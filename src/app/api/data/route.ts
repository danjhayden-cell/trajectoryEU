import { NextRequest, NextResponse } from 'next/server';

// API route to handle database operations server-side
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const indicatorId = searchParams.get('indicator');
    const regionIds = searchParams.get('regions')?.split(',') || [];
    
    if (!indicatorId || regionIds.length === 0) {
      return NextResponse.json(
        { error: 'Missing indicator or regions parameters' },
        { status: 400 }
      );
    }

    // Import data source that handles database/sample routing
    const { getDataForIndicatorAndRegions } = await import('../../../../lib/data-source');
    const data = await getDataForIndicatorAndRegions(indicatorId, regionIds);
    
    return NextResponse.json(data);
    
  } catch (error) {
    console.error('Data API error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch data' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, indicatorId, regionIds, regionId, startYear, endYear } = body;

    // Import data source that handles database/sample routing
    const dataSource = await import('../../../../lib/data-source');

    switch (action) {
      case 'getDataForIndicatorAndRegions':
        if (!indicatorId || !regionIds) {
          return NextResponse.json(
            { error: 'Missing indicatorId or regionIds' },
            { status: 400 }
          );
        }
        const data = await dataSource.getDataForIndicatorAndRegions(indicatorId, regionIds);
        return NextResponse.json(data);

      case 'getLatestValueForRegion':
        if (!regionId || !indicatorId) {
          return NextResponse.json(
            { error: 'Missing regionId or indicatorId' },
            { status: 400 }
          );
        }
        const latestValue = await dataSource.getLatestValueForRegion(regionId, indicatorId);
        return NextResponse.json(latestValue);

      case 'calculateCAGR':
        if (!regionId || !indicatorId || !startYear || !endYear) {
          return NextResponse.json(
            { error: 'Missing required parameters for CAGR calculation' },
            { status: 400 }
          );
        }
        const cagr = await dataSource.calculateCAGR(regionId, indicatorId, startYear, endYear);
        return NextResponse.json(cagr);

      default:
        return NextResponse.json(
          { error: 'Unknown action' },
          { status: 400 }
        );
    }
    
  } catch (error) {
    console.error('Data API error:', error);
    return NextResponse.json(
      { error: 'Failed to execute data operation' },
      { status: 500 }
    );
  }
}