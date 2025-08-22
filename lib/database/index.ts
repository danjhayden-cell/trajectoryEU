// Database layer - SQLite with World Bank API caching
// Maintains same API as sample-data.ts for seamless migration

import { Database } from 'sqlite';
import sqlite3 from 'sqlite3';
import path from 'path';
import fs from 'fs';
import fetch from 'node-fetch';

// Re-export types to maintain compatibility
export interface DataPoint {
  region: string;
  regionName: string;
  year: number;
  value: number;
  indicator: string;
  indicatorName: string;
}

export interface Indicator {
  id: string;
  name: string;
  unit: string;
  description: string;
}

export interface Region {
  id: string;
  name: string;
  color: string;
}

// Database connection
let db: Database | null = null;

// Cache settings
const CACHE_TTL_HOURS = 24; // Refresh data daily
const CACHE_TTL_MS = CACHE_TTL_HOURS * 60 * 60 * 1000;

// Initialize database
async function initDatabase(): Promise<Database> {
  if (db) return db;

  const dbPath = path.join(process.cwd(), 'data', 'trajectory.db');
  
  // Ensure data directory exists
  const dataDir = path.dirname(dbPath);
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }

  // Open database
  const { open } = await import('sqlite');
  db = await open({
    filename: dbPath,
    driver: sqlite3.Database
  });

  // Create tables if they don't exist
  const schemaPath = path.join(process.cwd(), 'database', 'schema.sql');
  if (fs.existsSync(schemaPath)) {
    const schema = fs.readFileSync(schemaPath, 'utf8');
    await db.exec(schema);
  }

  // Insert seed data if tables are empty
  const regionCount = await db.get('SELECT COUNT(*) as count FROM regions');
  if (regionCount.count === 0) {
    await seedDatabase();
  }

  return db;
}

// Seed database with initial data
async function seedDatabase() {
  if (!db) throw new Error('Database not initialized');

  // Insert regions
  await db.run(`INSERT OR IGNORE INTO regions (id, name, world_bank_code, color) VALUES 
    ('EUU', 'European Union', 'EUU', '#3B82F6'),
    ('USA', 'United States', 'US', '#EF4444'),
    ('CHN', 'China', 'CN', '#F59E0B')`);

  // Insert indicators
  await db.run(`INSERT OR IGNORE INTO indicators (
    id, internal_id, name, unit, description, category, world_bank_indicator, calculation_method
  ) VALUES 
    ('NY.GDP.PCAP.PP.KD', 'gdp_per_capita', 'GDP per Capita (PPP)', 'USD', 'Gross domestic product per capita adjusted for purchasing power parity', 'economic', 'NY.GDP.PCAP.PP.KD', 'direct'),
    ('NY.GDP.MKTP.KD.ZG', 'real_gdp_growth', 'Real GDP Growth', '%', 'Annual percentage growth rate of GDP at constant prices', 'economic', 'NY.GDP.MKTP.KD.ZG', 'direct'),
    ('GB.XPD.RSDV.GD.ZS', 'rd_expenditure', 'R&D Expenditure', '% of GDP', 'Research and development expenditure as percentage of GDP', 'economic', 'GB.XPD.RSDV.GD.ZS', 'direct'),
    ('NE.GDI.TOTL.ZS', 'capital_formation', 'Capital Formation', '% of GDP', 'Gross capital formation as percentage of GDP', 'economic', 'NE.GDI.TOTL.ZS', 'direct'),
    ('labor_productivity', 'labor_productivity', 'Labor Productivity', 'USD per employed person', 'GDP per capita divided by employment rate', 'economic', 'calculated', 'calculated')`);
}

// World Bank API fetcher
async function fetchFromWorldBank(
  regionCode: string, 
  indicatorCode: string, 
  startYear: number = 1990, 
  endYear: number = 2024
// eslint-disable-next-line @typescript-eslint/no-explicit-any
): Promise<any[]> {
  const url = `https://api.worldbank.org/v2/country/${regionCode}/indicator/${indicatorCode}?format=json&date=${startYear}:${endYear}&per_page=1000`;
  
  const startTime = Date.now();
  
  try {
    const response = await fetch(url);
    const responseTime = Date.now() - startTime;
    
    if (!response.ok) {
      await logAPIFetch(indicatorCode, regionCode, 0, response.status, responseTime, `HTTP ${response.status}`);
      throw new Error(`World Bank API error: ${response.status}`);
    }
    
    const data = await response.json();
    const apiData = Array.isArray(data) && data[1] ? data[1] : [];
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const validData = apiData.filter((d: any) => d.value !== null);
    
    await logAPIFetch(indicatorCode, regionCode, validData.length, 200, responseTime);
    
    return validData;
    
  } catch (error) {
    const responseTime = Date.now() - startTime;
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    await logAPIFetch(indicatorCode, regionCode, 0, 500, responseTime, errorMessage);
    throw error;
  }
}

// Calculate productivity from GDP + employment data
async function calculateProductivity(regionCode: string, year: number): Promise<number | null> {
  try {
    // Get GDP per capita
    const gdpData = await fetchFromWorldBank(regionCode, 'NY.GDP.PCAP.PP.KD', year, year);
    // Get employment rate
    const empData = await fetchFromWorldBank(regionCode, 'SL.EMP.TOTL.SP.ZS', year, year);
    
    if (gdpData.length > 0 && empData.length > 0) {
      const gdpPerCapita = gdpData[0].value;
      const employmentRate = empData[0].value / 100; // Convert percentage
      
      if (gdpPerCapita && employmentRate > 0) {
        return gdpPerCapita / employmentRate; // GDP per employed person
      }
    }
    
    return null;
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.warn(`Failed to calculate productivity for ${regionCode} ${year}:`, errorMessage);
    return null;
  }
}

// Log API fetch for monitoring
async function logAPIFetch(
  indicatorId: string,
  regionId: string,
  recordsFetched: number,
  status: number,
  responseTime: number,
  errorMessage?: string
) {
  if (!db) return;
  
  await db.run(`INSERT INTO api_fetch_log (
    indicator_id, region_id, records_fetched, api_status, response_time_ms, error_message
  ) VALUES (?, ?, ?, ?, ?, ?)`, [
    indicatorId, regionId, recordsFetched, status, responseTime, errorMessage || null
  ]);
}

// Check if cache is valid
async function isCacheValid(regionId: string, indicatorId: string): Promise<boolean> {
  if (!db) return false;
  
  const cacheKey = `${regionId}-${indicatorId}`;
  const cacheInfo = await db.get(
    'SELECT cache_expires, is_valid FROM cache_metadata WHERE cache_key = ?',
    [cacheKey]
  );
  
  if (!cacheInfo) return false;
  
  const now = Date.now();
  return cacheInfo.is_valid === 1 && cacheInfo.cache_expires > now;
}

// Update cache metadata
async function updateCacheMetadata(regionId: string, indicatorId: string, recordCount: number) {
  if (!db) return;
  
  const cacheKey = `${regionId}-${indicatorId}`;
  const now = Date.now();
  const expires = now + CACHE_TTL_MS;
  
  await db.run(`INSERT OR REPLACE INTO cache_metadata (
    cache_key, last_fetch, cache_expires, record_count, is_valid
  ) VALUES (?, ?, ?, ?, 1)`, [cacheKey, now, expires, recordCount]);
}

// Refresh data for region/indicator combination
async function refreshIndicatorData(regionId: string, indicatorId: string) {
  if (!db) await initDatabase();
  
  console.log(`Fetching ${indicatorId} data for ${regionId}...`);
  
  try {
    // Get region info
    const region = await db!.get('SELECT * FROM regions WHERE id = ?', [regionId]);
    if (!region) throw new Error(`Region ${regionId} not found`);
    
    // Get indicator info - check both id and internal_id
    const indicator = await db!.get(
      'SELECT * FROM indicators WHERE id = ? OR internal_id = ?', 
      [indicatorId, indicatorId]
    );
    if (!indicator) throw new Error(`Indicator ${indicatorId} not found`);
    
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let dataPoints: any[] = [];
    
    if (indicator.calculation_method === 'calculated' && indicatorId === 'labor_productivity') {
      // Calculate productivity for each year
      console.log('Calculating productivity data...');
      for (let year = 1990; year <= 2024; year++) {
        const productivity = await calculateProductivity(region.world_bank_code, year);
        if (productivity) {
          dataPoints.push({
            date: year.toString(),
            value: productivity,
            country: { value: region.name },
            indicator: { value: indicator.name }
          });
        }
        
        // Rate limiting
        await new Promise(resolve => setTimeout(resolve, 100));
      }
    } else {
      // Fetch directly from World Bank
      dataPoints = await fetchFromWorldBank(region.world_bank_code, indicator.world_bank_indicator);
    }
    
    // Clear existing data
    await db!.run('DELETE FROM data_points WHERE region_id = ? AND indicator_id = ?', [regionId, indicatorId]);
    
    // Insert new data
    let insertCount = 0;
    for (const point of dataPoints) {
      if (point.value !== null && point.value !== undefined) {
        await db!.run(`INSERT INTO data_points (
          region_id, indicator_id, year, value, source_api
        ) VALUES (?, ?, ?, ?, 'worldbank')`, [
          regionId, indicatorId, parseInt(point.date), point.value
        ]);
        insertCount++;
      }
    }
    
    // Update cache metadata
    await updateCacheMetadata(regionId, indicatorId, insertCount);
    
    console.log(`✅ Cached ${insertCount} ${indicatorId} data points for ${regionId}`);
    
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error(`❌ Failed to refresh ${indicatorId} for ${regionId}:`, errorMessage);
    throw error;
  }
}

// Export functions that match sample-data.ts API
export const regions: Region[] = [
  { id: 'EUU', name: 'European Union', color: '#3B82F6' },
  { id: 'USA', name: 'United States', color: '#EF4444' },
  { id: 'CHN', name: 'China', color: '#F59E0B' }
];

export const indicators: Indicator[] = [
  {
    id: 'gdp_per_capita',
    name: 'GDP per Capita (PPP)',
    unit: 'USD',
    description: 'Gross domestic product per capita adjusted for purchasing power parity'
  },
  {
    id: 'real_gdp_growth',
    name: 'Real GDP Growth',
    unit: '%',
    description: 'Annual percentage growth rate of GDP at constant prices'
  },
  {
    id: 'rd_expenditure',
    name: 'R&D Expenditure',
    unit: '% of GDP',
    description: 'Research and development expenditure as percentage of GDP'
  },
  {
    id: 'capital_formation',
    name: 'Capital Formation',
    unit: '% of GDP',
    description: 'Gross capital formation as percentage of GDP'
  },
  {
    id: 'labor_productivity',
    name: 'Labor Productivity',
    unit: 'USD per employed person',
    description: 'GDP per capita divided by employment rate'
  }
];

export async function getDataForIndicatorAndRegions(
  indicatorId: string,
  regionIds: string[]
): Promise<DataPoint[]> {
  await initDatabase();
  
  const results: DataPoint[] = [];
  
  for (const regionId of regionIds) {
    // Check cache validity
    const isValid = await isCacheValid(regionId, indicatorId);
    
    if (!isValid) {
      console.log(`Cache miss for ${regionId}-${indicatorId}, refreshing...`);
      await refreshIndicatorData(regionId, indicatorId);
    }
    
    // Get data from cache
    const rows = await db!.all(`
      SELECT dp.*, r.name as region_name, i.name as indicator_name
      FROM data_points dp
      JOIN regions r ON dp.region_id = r.id
      JOIN indicators i ON dp.indicator_id = i.internal_id
      WHERE dp.region_id = ? AND dp.indicator_id = ?
      ORDER BY dp.year ASC
    `, [regionId, indicatorId]);
    
    for (const row of rows) {
      results.push({
        region: row.region_id,
        regionName: row.region_name,
        year: row.year,
        value: row.value,
        indicator: row.indicator_id,
        indicatorName: row.indicator_name
      });
    }
  }
  
  return results;
}

export async function getLatestValueForRegion(
  regionId: string,
  indicatorId: string
): Promise<number | null> {
  await initDatabase();
  
  const isValid = await isCacheValid(regionId, indicatorId);
  if (!isValid) {
    await refreshIndicatorData(regionId, indicatorId);
  }
  
  const row = await db!.get(`
    SELECT value FROM data_points 
    WHERE region_id = ? AND indicator_id = ?
    ORDER BY year DESC LIMIT 1
  `, [regionId, indicatorId]);
  
  return row ? row.value : null;
}

export async function calculateCAGR(
  regionId: string,
  indicatorId: string,
  startYear: number,
  endYear: number
): Promise<number | null> {
  await initDatabase();
  
  const isValid = await isCacheValid(regionId, indicatorId);
  if (!isValid) {
    await refreshIndicatorData(regionId, indicatorId);
  }
  
  const rows = await db!.all(`
    SELECT year, value FROM data_points
    WHERE region_id = ? AND indicator_id = ? 
    AND year IN (?, ?) AND value IS NOT NULL AND value > 0
    ORDER BY year
  `, [regionId, indicatorId, startYear, endYear]);
  
  if (rows.length !== 2) return null;
  
  const startValue = rows[0].value;
  const endValue = rows[1].value;
  const years = endYear - startYear;
  
  return Math.pow(endValue / startValue, 1 / years) - 1;
}