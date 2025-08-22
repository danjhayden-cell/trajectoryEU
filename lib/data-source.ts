// Server-side data source - handles database operations
// This file should ONLY be imported by API routes or server components

export type { DataPoint, Indicator, Region } from './data-source-types';

// Re-export static data for API routes that need it
export { indicators, regions } from './sample-data';

// Configuration - server-side only
const USE_REAL_DATABASE = process.env.USE_REAL_DATABASE === 'true';
const FALLBACK_TO_SAMPLE = process.env.FALLBACK_TO_SAMPLE !== 'false';

console.log('🔧 Server Data Source Config:', {
  USE_REAL_DATABASE,
  FALLBACK_TO_SAMPLE,
  NODE_ENV: process.env.NODE_ENV
});

// Server-side data operations
export async function getDataForIndicatorAndRegions(
  indicatorId: string, 
  regionIds: string[]
) {
  if (USE_REAL_DATABASE) {
    try {
      // Import database module only when needed (server-side)
      const { getDataForIndicatorAndRegions: dbGetData } = await import('./database/index');
      console.log(`🗄️ Using database for ${indicatorId} with regions ${regionIds.join(', ')}`);
      return await dbGetData(indicatorId, regionIds);
    } catch (error) {
      console.error('Database operation failed:', error);
      if (FALLBACK_TO_SAMPLE) {
        console.log('📋 Falling back to sample data');
        const { getDataForIndicatorAndRegions: sampleGetData } = await import('./sample-data');
        return sampleGetData(indicatorId, regionIds);
      }
      throw error;
    }
  } else {
    console.log(`📋 Using sample data for ${indicatorId}`);
    const { getDataForIndicatorAndRegions: sampleGetData } = await import('./sample-data');
    return sampleGetData(indicatorId, regionIds);
  }
}

export async function getLatestValueForRegion(regionId: string, indicatorId: string) {
  if (USE_REAL_DATABASE) {
    try {
      const { getLatestValueForRegion: dbGetLatest } = await import('./database/index');
      console.log(`🗄️ Getting latest ${indicatorId} for ${regionId} from database`);
      return await dbGetLatest(regionId, indicatorId);
    } catch (error) {
      console.error('Database operation failed:', error);
      if (FALLBACK_TO_SAMPLE) {
        console.log('📋 Falling back to sample data');
        const { getLatestValueForRegion: sampleGetLatest } = await import('./sample-data');
        return sampleGetLatest(regionId, indicatorId);
      }
      throw error;
    }
  } else {
    console.log(`📋 Getting latest ${indicatorId} for ${regionId} from sample data`);
    const { getLatestValueForRegion: sampleGetLatest } = await import('./sample-data');
    return sampleGetLatest(regionId, indicatorId);
  }
}

export async function calculateCAGR(
  regionId: string, 
  indicatorId: string, 
  startYear: number, 
  endYear: number
) {
  if (USE_REAL_DATABASE) {
    try {
      const { calculateCAGR: dbCalculateCAGR } = await import('./database/index');
      console.log(`🗄️ Calculating CAGR for ${regionId}:${indicatorId} (${startYear}-${endYear}) from database`);
      return await dbCalculateCAGR(regionId, indicatorId, startYear, endYear);
    } catch (error) {
      console.error('Database operation failed:', error);
      if (FALLBACK_TO_SAMPLE) {
        console.log('📋 Falling back to sample data');
        const { calculateCAGR: sampleCalculateCAGR } = await import('./sample-data');
        return sampleCalculateCAGR(regionId, indicatorId, startYear, endYear);
      }
      throw error;
    }
  } else {
    console.log(`📋 Calculating CAGR for ${regionId}:${indicatorId} (${startYear}-${endYear}) from sample data`);
    const { calculateCAGR: sampleCalculateCAGR } = await import('./sample-data');
    return sampleCalculateCAGR(regionId, indicatorId, startYear, endYear);
  }
}