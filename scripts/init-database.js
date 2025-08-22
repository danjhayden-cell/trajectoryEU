#!/usr/bin/env node

/**
 * Initialize SQLite Database
 * Creates the database and fetches initial data from World Bank API
 */

const { open } = require('sqlite');
const sqlite3 = require('sqlite3');
const fetch = require('node-fetch');
const fs = require('fs');
const path = require('path');

async function initDatabase() {
  console.log('🚀 Initializing Trajectory Database...\n');
  
  // Ensure data directory exists
  const dataDir = path.join(__dirname, '..', 'data');
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
    console.log('📁 Created data directory');
  }
  
  // Open database
  const dbPath = path.join(dataDir, 'trajectory.db');
  const db = await open({
    filename: dbPath,
    driver: sqlite3.Database
  });
  
  console.log('📊 Database opened:', dbPath);
  
  // Create schema
  const schemaPath = path.join(__dirname, '..', 'database', 'schema.sql');
  const schema = fs.readFileSync(schemaPath, 'utf8');
  await db.exec(schema);
  console.log('✅ Schema created');
  
  // Insert seed data
  await db.run(`INSERT OR IGNORE INTO regions (id, name, world_bank_code, color) VALUES 
    ('EUU', 'European Union', 'EUU', '#3B82F6'),
    ('USA', 'United States', 'US', '#EF4444'),
    ('CHN', 'China', 'CN', '#F59E0B')`);
  
  await db.run(`INSERT OR IGNORE INTO indicators (
    id, internal_id, name, unit, description, category, world_bank_indicator, calculation_method
  ) VALUES 
    ('NY.GDP.PCAP.PP.KD', 'gdp_per_capita', 'GDP per Capita (PPP)', 'USD', 'Gross domestic product per capita adjusted for purchasing power parity', 'economic', 'NY.GDP.PCAP.PP.KD', 'direct'),
    ('NY.GDP.MKTP.KD.ZG', 'real_gdp_growth', 'Real GDP Growth', '%', 'Annual percentage growth rate of GDP at constant prices', 'economic', 'NY.GDP.MKTP.KD.ZG', 'direct'),
    ('GB.XPD.RSDV.GD.ZS', 'rd_expenditure', 'R&D Expenditure', '% of GDP', 'Research and development expenditure as percentage of GDP', 'economic', 'GB.XPD.RSDV.GD.ZS', 'direct'),
    ('NE.GDI.TOTL.ZS', 'capital_formation', 'Capital Formation', '% of GDP', 'Gross capital formation as percentage of GDP', 'economic', 'NE.GDI.TOTL.ZS', 'direct'),
    ('labor_productivity', 'labor_productivity', 'Labor Productivity', 'USD per employed person', 'GDP per capita divided by employment rate', 'economic', 'calculated', 'calculated')`);
  
  console.log('✅ Seed data inserted');
  
  // Fetch sample data to verify API connectivity
  console.log('\n🌍 Testing World Bank API connectivity...');
  
  try {
    const testUrl = 'https://api.worldbank.org/v2/country/EUU/indicator/NY.GDP.PCAP.PP.KD?format=json&date=2022&per_page=1';
    const response = await fetch(testUrl);
    const data = await response.json();
    
    if (data && data[1] && data[1][0]) {
      const testValue = data[1][0].value;
      console.log(`✅ API Test Success: EU GDP per capita (2022) = $${Math.round(testValue).toLocaleString()}`);
    } else {
      console.log('⚠️  API returned unexpected format');
    }
  } catch (error) {
    console.log('❌ API Test Failed:', error.message);
  }
  
  await db.close();
  
  console.log('\n🎉 Database initialization complete!');
  console.log('\nNext steps:');
  console.log('1. Set USE_REAL_DATABASE=true in .env.local');
  console.log('2. Data will be fetched automatically when needed');
  console.log('3. Cache refreshes every 24 hours');
}

initDatabase().catch(console.error);