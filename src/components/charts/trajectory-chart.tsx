'use client';

import { useEffect, useRef, useState } from 'react';
import * as Plot from '@observablehq/plot';

// Alternative import method for debugging
// const Plot = require('@observablehq/plot');
import type { ComparisonState } from '../trajectory-compare';
import { getDataForIndicatorAndRegions, regions, calculateCAGR } from '../../../lib/sample-data';

interface TrajectoryChartProps {
  state: ComparisonState;
}

interface ChartDataPoint {
  region: string;
  regionName: string;
  year: number;
  value: number;
  type: 'historical' | 'projection';
  color: string;
}

// Convert indicator IDs to match our sample data
const getIndicatorId = (stateIndicator: string): string => {
  const mapping: Record<string, string> = {
    'NY.GDP.PCAP.PP.KD': 'gdp_per_capita',
    'NY.GDP.MKTP.KD.ZG': 'real_gdp_growth',
    'GB.XPD.RSDV.GD.ZS': 'rd_expenditure',
    'NE.GDI.TOTL.ZS': 'capital_formation',
    'labor_productivity': 'labor_productivity'
  };
  return mapping[stateIndicator] || 'gdp_per_capita';
};

const generateChartData = (state: ComparisonState): ChartDataPoint[] => {
  const indicatorId = getIndicatorId(state.indicator);
  const historicalData = getDataForIndicatorAndRegions(indicatorId, state.regions);
  
  
  const regionColorMap = regions.reduce((acc, region) => {
    acc[region.id] = region.color;
    return acc;
  }, {} as Record<string, string>);

  const regionNameMap = regions.reduce((acc, region) => {
    acc[region.id] = region.name;
    return acc;
  }, {} as Record<string, string>);

  const data: ChartDataPoint[] = [];
  const currentYear = 2024;
  const endYear = currentYear + state.horizon;

  // Process historical data
  const filteredHistorical = historicalData.filter(d => 
    d.year >= state.startYear && d.year <= currentYear
  );
  
  if (filteredHistorical.length === 0) {
    console.warn('No historical data found for the selected criteria', {
      indicatorId,
      regions: state.regions,
      startYear: state.startYear,
      totalSampleData: historicalData.length
    });
    return [];
  }

  // Index normalization baseline values
  const baselineValues: Record<string, number> = {};
  if (state.indexNormalized) {
    state.regions.forEach(regionId => {
      const baseData = filteredHistorical.find(d => 
        d.region === regionId && d.year === state.startYear
      );
      if (baseData) {
        baselineValues[regionId] = baseData.value;
      }
    });
  }

  // Add historical data
  filteredHistorical.forEach(d => {
    let value = d.value;
    if (state.indexNormalized && baselineValues[d.region]) {
      value = (value / baselineValues[d.region]) * 100;
    }

    data.push({
      region: d.region,
      regionName: regionNameMap[d.region] || d.regionName,
      year: d.year,
      value,
      type: 'historical',
      color: regionColorMap[d.region] || '#6B7280'
    });
  });

  // Generate projections
  state.regions.forEach(regionId => {
    // Calculate CAGR for the last 10 years (or available years)
    const projectionStartYear = Math.max(state.startYear, currentYear - 10);
    const cagr = calculateCAGR(regionId, indicatorId, projectionStartYear, currentYear);
    
    if (!cagr) return;

    // Apply scenario adjustment
    const adjustedGrowthRate = cagr + (state.scenario / 100);
    
    // Get the last historical value
    const lastHistoricalPoint = data
      .filter(d => d.region === regionId && d.type === 'historical')
      .sort((a, b) => b.year - a.year)[0];

    if (!lastHistoricalPoint) return;

    // Generate projection points
    for (let year = currentYear + 1; year <= endYear; year++) {
      const yearsSinceProjection = year - currentYear;
      const projectedValue = lastHistoricalPoint.value * Math.pow(1 + adjustedGrowthRate, yearsSinceProjection);

      data.push({
        region: regionId,
        regionName: regionNameMap[regionId] || regionId,
        year,
        value: projectedValue,
        type: 'projection',
        color: regionColorMap[regionId] || '#6B7280'
      });
    }
  });


  return data;
};

// Fallback chart for debugging
const createFallbackChart = (data: ChartDataPoint[], state: ComparisonState): string => {
  const regionGroups = data.reduce((acc, point) => {
    if (!acc[point.region]) acc[point.region] = [];
    acc[point.region].push(point);
    return acc;
  }, {} as Record<string, ChartDataPoint[]>);

  const regionList = Object.entries(regionGroups)
    .map(([regionId, points]) => {
      const historicalCount = points.filter(p => p.type === 'historical').length;
      const projectionCount = points.filter(p => p.type === 'projection').length;
      const region = regions.find(r => r.id === regionId);
      
      return `
        <div class="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
          <div class="flex items-center space-x-2">
            <div class="w-4 h-4 rounded-full" style="background-color: ${region?.color || '#gray'}"></div>
            <span class="font-medium">${region?.name || regionId}</span>
          </div>
          <div class="text-sm text-gray-600">
            ${historicalCount} historical, ${projectionCount} projected
          </div>
        </div>
      `;
    }).join('');

  return `
    <div class="p-6 bg-blue-50 border border-blue-200 rounded-lg">
      <div class="text-center mb-4">
        <h3 class="text-lg font-medium text-blue-800 mb-2">Chart Debug Mode</h3>
        <p class="text-blue-600">Observable Plot not available. Showing data summary:</p>
        <p class="text-sm text-blue-500 mt-1">Total data points: ${data.length}</p>
      </div>
      <div class="space-y-2">
        ${regionList}
      </div>
      <div class="mt-4 text-center text-sm text-blue-600">
        Indicator: ${state.indicator} | Horizon: ${state.horizon} years | Scenario: ${state.scenario}pp
      </div>
    </div>
  `;
};

export function TrajectoryChart({ state }: TrajectoryChartProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    console.log('Chart useEffect triggered with state:', state);
    
    // Small delay to ensure container is fully mounted
    const timer = setTimeout(() => {
      if (!containerRef.current) {
        console.log('Container ref is null after timeout, returning');
        return;
      }

      setIsLoading(true);
    
    // Clear previous chart
    containerRef.current.innerHTML = '';

    try {
      const data = generateChartData(state);
      console.log('Generated chart data length:', data.length);
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const currentYear = 2024;

      if (data.length === 0) {
        containerRef.current.innerHTML = `
          <div class="flex items-center justify-center h-96 bg-background-secondary rounded-lg">
            <div class="text-center p-8">
              <h3 class="text-lg font-medium text-text-primary mb-2">No Data Available</h3>
              <p class="text-text-secondary">Please try selecting different regions or indicators.</p>
            </div>
          </div>
        `;
        setIsLoading(false);
        return;
      }

      console.log('About to create Observable Plot with data:', {
        dataLength: data.length,
        containerWidth: containerRef.current.clientWidth,
        plotAvailable: typeof Plot !== 'undefined'
      });

      // Temporary fallback for debugging - Create simple HTML chart
      if (!Plot || typeof Plot.plot !== 'function') {
        console.error('Observable Plot is not available');
        const fallbackChart = createFallbackChart(data, state);
        containerRef.current.innerHTML = fallbackChart;
        setIsLoading(false);
        return;
      }

      // Try a minimal plot first to test if Observable Plot works at all
      const plot = Plot.plot({
        width: Math.min(800, containerRef.current.clientWidth),
        height: 400,
        marks: [
          // Historical data (solid lines)
          Plot.line(data.filter(d => d.type === 'historical'), {
            x: 'year',
            y: 'value',
            stroke: 'region',
            strokeWidth: 3
          }),
          // Projection data (dashed lines)
          Plot.line(data.filter(d => d.type === 'projection'), {
            x: 'year',
            y: 'value',
            stroke: 'region',
            strokeWidth: 2,
            strokeDasharray: '8,4'
          })
        ]
      });

      console.log('Plot created successfully, appending to container');
      containerRef.current.appendChild(plot);
      console.log('Plot appended, setting loading to false');
      setIsLoading(false);
    } catch (error) {
      console.error('Error creating chart:', error);
      if (error instanceof Error) {
        console.error('Error details:', {
          message: error.message,
          stack: error.stack
        });
      }
      setIsLoading(false);
    }
    }, 100); // 100ms delay

    return () => clearTimeout(timer);
  }, [state]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96 bg-background-secondary rounded-lg">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-chart-eu"></div>
      </div>
    );
  }

  const generateChartDescription = () => {
    const regionNames = { 'EUU': 'European Union', 'USA': 'United States', 'CHN': 'China', 'BRC': 'BRICS' };
    const regions = state.regions.map(r => regionNames[r as keyof typeof regionNames]).join(', ');
    const scenarioText = state.scenario === 0 ? 'baseline' : 
                        state.scenario > 0 ? `optimistic (+${state.scenario}pp)` : 
                        `pessimistic (${state.scenario}pp)`;
    
    return `Interactive line chart showing economic trajectories for ${regions} from ${state.startYear} to ${2024 + state.horizon}. Historical data shown as solid lines, projections as dashed lines under ${scenarioText} scenario.`;
  };

  return (
    <div className="space-y-4">
      <div 
        ref={containerRef} 
        className="plot-container w-full overflow-x-auto"
        style={{ minHeight: '400px' }}
        role="img"
        aria-label={generateChartDescription()}
        tabIndex={0}
      />
      
      {/* Chart Legend and Info */}
      <div className="border-t border-border-light pt-4 space-y-3">
        <div className="flex flex-wrap items-center justify-between text-sm">
          <div className="flex items-center space-x-6">
            <div className="flex items-center space-x-2">
              <div className="h-3 w-6 bg-chart-eu"></div>
              <span className="text-text-tertiary">Historical</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="h-px w-6 border-t-2 border-dashed border-chart-eu"></div>
              <span className="text-text-tertiary">Projection</span>
            </div>
          </div>
          <div className="text-text-tertiary">
            Scenario: {state.scenario === 0 ? 'Baseline growth' : 
                      state.scenario > 0 ? `+${state.scenario}pp annual growth` : 
                      `${state.scenario}pp annual growth`}
          </div>
        </div>
        
        {/* Current Regions Legend */}
        <div className="flex flex-wrap items-center gap-4">
          <span className="text-sm text-text-secondary font-medium">Regions:</span>
          {state.regions.map(regionId => {
            const region = regions.find(r => r.id === regionId);
            return region ? (
              <div key={regionId} className="flex items-center space-x-1">
                <div 
                  className="w-3 h-3 rounded-full" 
                  style={{ backgroundColor: region.color }}
                ></div>
                <span className="text-sm text-text-secondary">{region.name}</span>
              </div>
            ) : null;
          })}
        </div>
      </div>
    </div>
  );
}