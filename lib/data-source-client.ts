// Client-side data source - uses API routes
import { DataPoint } from './data-source-types';

// Re-export static data from sample data
export { indicators, regions } from './sample-data';

// Check if we should use real database (client-side env var)
const USE_REAL_DATABASE = process.env.NEXT_PUBLIC_USE_REAL_DATABASE === 'true';

console.log('🔧 Client Data Source Config:', {
  USE_REAL_DATABASE,
  NODE_ENV: process.env.NODE_ENV
});

// Client-side data fetching functions
export async function getDataForIndicatorAndRegions(
  indicatorId: string, 
  regionIds: string[]
): Promise<DataPoint[]> {
  if (USE_REAL_DATABASE) {
    try {
      const response = await fetch('/api/data', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'getDataForIndicatorAndRegions',
          indicatorId,
          regionIds
        })
      });
      
      if (!response.ok) {
        throw new Error(`API error: ${response.status}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error('API call failed, falling back to sample data:', error);
      // Fallback to sample data
      const { getDataForIndicatorAndRegions: sampleGetData } = await import('./sample-data');
      return sampleGetData(indicatorId, regionIds);
    }
  } else {
    // Use sample data directly
    const { getDataForIndicatorAndRegions: sampleGetData } = await import('./sample-data');
    return sampleGetData(indicatorId, regionIds);
  }
}

export async function calculateCAGR(
  regionId: string, 
  indicatorId: string, 
  startYear: number, 
  endYear: number
): Promise<number | null> {
  if (USE_REAL_DATABASE) {
    try {
      const response = await fetch('/api/data', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'calculateCAGR',
          regionId,
          indicatorId,
          startYear,
          endYear
        })
      });
      
      if (!response.ok) {
        throw new Error(`API error: ${response.status}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error('API call failed, falling back to sample data:', error);
      const { calculateCAGR: sampleCalculateCAGR } = await import('./sample-data');
      return sampleCalculateCAGR(regionId, indicatorId, startYear, endYear);
    }
  } else {
    const { calculateCAGR: sampleCalculateCAGR } = await import('./sample-data');
    return sampleCalculateCAGR(regionId, indicatorId, startYear, endYear);
  }
}

export async function getLatestValueForRegion(
  regionId: string, 
  indicatorId: string
): Promise<number | null> {
  if (USE_REAL_DATABASE) {
    try {
      const response = await fetch('/api/data', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'getLatestValueForRegion',
          regionId,
          indicatorId
        })
      });
      
      if (!response.ok) {
        throw new Error(`API error: ${response.status}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error('API call failed, falling back to sample data:', error);
      const { getLatestValueForRegion: sampleGetLatest } = await import('./sample-data');
      return sampleGetLatest(regionId, indicatorId);
    }
  } else {
    const { getLatestValueForRegion: sampleGetLatest } = await import('./sample-data');
    return sampleGetLatest(regionId, indicatorId);
  }
}