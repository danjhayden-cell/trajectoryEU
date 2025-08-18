'use client';

import React, { useMemo } from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  ChartOptions,
  TooltipItem,
} from 'chart.js';
import { Line } from 'react-chartjs-2';
import type { ComparisonState } from '../trajectory-compare';
import { getDataForIndicatorAndRegions, regions, calculateCAGR, indicators } from '../../../lib/sample-data';

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);

interface ChartJSTrajectoryProps {
  state: ComparisonState;
}

interface ProcessedDataPoint {
  x: number; // year
  y: number; // value
  type: 'historical' | 'projection';
  region: string;
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

export function ChartJSTrajectory({ state }: ChartJSTrajectoryProps) {
  const chartData = useMemo(() => {
    const indicatorId = getIndicatorId(state.indicator);
    const historicalData = getDataForIndicatorAndRegions(indicatorId, state.regions);
    
    const currentYear = 2024;
    const endYear = currentYear + state.horizon;
    
    // Filter historical data
    const filteredHistorical = historicalData.filter(d => 
      d.year >= state.startYear && d.year <= currentYear
    );
    
    if (filteredHistorical.length === 0) {
      return { datasets: [] };
    }

    // Region color mapping
    const regionColors: Record<string, string> = {
      'EUU': '#3B82F6',  // Blue
      'USA': '#EF4444',  // Red
      'CHN': '#F59E0B',  // Amber
      'BRC': '#10B981',  // Emerald
    };

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

    // Create separate datasets for historical and projection data
    const datasets: any[] = [];

    state.regions.forEach(regionId => {
      const region = regions.find(r => r.id === regionId);
      if (!region) return;

      const regionColor = regionColors[regionId] || '#6B7280';

      // Historical data points
      const historicalPoints = filteredHistorical
        .filter(d => d.region === regionId)
        .map(d => {
          let value = d.value;
          if (state.indexNormalized && baselineValues[regionId]) {
            value = (value / baselineValues[regionId]) * 100;
          }
          return { x: d.year, y: value };
        })
        .sort((a, b) => a.x - b.x);

      // Add historical dataset
      if (historicalPoints.length > 0) {
        datasets.push({
          label: region.name,
          data: historicalPoints,
          borderColor: regionColor,
          backgroundColor: `${regionColor}20`,
          borderWidth: 3,
          pointRadius: 4,
          pointBackgroundColor: regionColor,
          pointBorderColor: '#FFFFFF',
          pointBorderWidth: 2,
          tension: 0.1,
          fill: false,
        });

        // Generate projections
        const projectionStartYear = Math.max(state.startYear, currentYear - 10);
        const cagr = calculateCAGR(regionId, indicatorId, projectionStartYear, currentYear);
        
        if (cagr) {
          const adjustedGrowthRate = cagr + (state.scenario / 100);
          const lastHistoricalValue = historicalPoints[historicalPoints.length - 1].y;

          // Create projection points starting from last historical point
          const projectionPoints = [
            { x: currentYear, y: lastHistoricalValue }, // Connection point
          ];

          for (let year = currentYear + 1; year <= endYear; year++) {
            const yearsSinceProjection = year - currentYear;
            const projectedValue = lastHistoricalValue * Math.pow(1 + adjustedGrowthRate, yearsSinceProjection);
            projectionPoints.push({ x: year, y: projectedValue });
          }

          // Add projection dataset
          datasets.push({
            label: `${region.name} (Projected)`,
            data: projectionPoints,
            borderColor: regionColor,
            backgroundColor: `${regionColor}10`,
            borderWidth: 2,
            borderDash: [8, 4],
            pointRadius: 0,
            pointHoverRadius: 4,
            tension: 0.1,
            fill: false,
          });
        }
      }
    });

    return { datasets };
  }, [state]);

  const options: ChartOptions<'line'> = useMemo(() => {
    const indicatorInfo = indicators.find(i => getIndicatorId(state.indicator) === i.id);
    
    return {
      responsive: true,
      maintainAspectRatio: false,
      layout: {
        padding: {
          right: 80, // Space for line-end labels
        },
      },
      interaction: {
        intersect: false,
        mode: 'index',
      },
      plugins: {
        legend: {
          display: false,
        },
        tooltip: {
          backgroundColor: '#1F2937',
          titleColor: '#F9FAFB',
          bodyColor: '#F9FAFB',
          borderColor: '#374151',
          borderWidth: 1,
          cornerRadius: 8,
          displayColors: true,
          callbacks: {
            title: (tooltipItems: TooltipItem<'line'>[]) => {
              const year = tooltipItems[0]?.parsed?.x;
              return `Year: ${year}`;
            },
            label: (context: TooltipItem<'line'>) => {
              const point = context.dataset.data[context.dataIndex] as ProcessedDataPoint;
              const value = typeof context.parsed.y === 'number' ? context.parsed.y : 0;
              const formattedValue = indicatorInfo?.unit === '%' 
                ? `${value.toFixed(1)}%`
                : state.indexNormalized 
                  ? `${value.toFixed(1)} (Index)`
                  : value.toLocaleString();
              
              const type = point?.type === 'projection' ? ' (Projected)' : '';
              return `${context.dataset.label}: ${formattedValue}${type}`;
            },
          },
        },
      },
      scales: {
        x: {
          type: 'linear',
          position: 'bottom',
          min: state.startYear,
          max: 2024 + state.horizon,
          title: {
            display: true,
            text: 'Year',
            font: {
              family: 'inherit',
              size: 12,
              weight: '500',
            },
            color: '#6B7280',
          },
          grid: {
            color: '#E5E7EB',
            lineWidth: 1,
          },
          ticks: {
            stepSize: 5,
            color: '#6B7280',
            font: {
              family: 'inherit',
              size: 11,
            },
          },
        },
        y: {
          beginAtZero: indicatorInfo?.unit === '%' ? true : false,
          title: {
            display: true,
            text: state.indexNormalized 
              ? 'Index (Start Year = 100)' 
              : `${indicatorInfo?.name || 'Value'} (${indicatorInfo?.unit || ''})`,
            font: {
              family: 'inherit',
              size: 12,
              weight: '500',
            },
            color: '#6B7280',
          },
          grid: {
            color: '#F3F4F6',
            lineWidth: 1,
          },
          ticks: {
            color: '#6B7280',
            font: {
              family: 'inherit',
              size: 11,
            },
            callback: function(value) {
              if (typeof value === 'number') {
                return indicatorInfo?.unit === '%' 
                  ? `${value.toFixed(1)}%`
                  : value.toLocaleString();
              }
              return value;
            },
          },
        },
      },
      elements: {
        point: {
          hoverRadius: 6,
          hoverBorderWidth: 2,
        },
        line: {
          borderCapStyle: 'round',
          borderJoinStyle: 'round',
        },
      },
    };
  }, [state]);

  // Custom plugin for projected area background shade
  const projectedAreaPlugin = {
    id: 'projectedArea',
    beforeDatasetsDraw(chart: any) {
      const { ctx, chartArea, scales } = chart;
      const currentYear = 2024;
      
      // Get the x-coordinate for the current year (where projections start)
      const projectionStartX = scales.x.getPixelForValue(currentYear);
      
      if (projectionStartX < chartArea.right) {
        ctx.save();
        ctx.fillStyle = 'rgba(59, 130, 246, 0.03)'; // Very subtle blue shade
        ctx.fillRect(
          projectionStartX,
          chartArea.top,
          chartArea.right - projectionStartX,
          chartArea.bottom - chartArea.top
        );
        ctx.restore();
      }
    }
  };

  // Custom plugin for line-end labels
  const lineEndLabelsPlugin = {
    id: 'lineEndLabels',
    afterDatasetsDraw(chart: any) {
      const { ctx, chartArea } = chart;
      const labelPositions: Array<{x: number, y: number, label: string, color: string}> = [];
      
      // Collect all projection datasets (these are the rightmost lines)
      const projectionDatasets = chart.data.datasets.filter((dataset: any) => 
        dataset.label && dataset.label.includes('Projected')
      );
      
      projectionDatasets.forEach((dataset: any, index: number) => {
        const datasetIndex = chart.data.datasets.indexOf(dataset);
        const points = chart.getDatasetMeta(datasetIndex).data;
        
        if (points.length > 0) {
          const lastPoint = points[points.length - 1];
          const regionName = dataset.label.replace(' (Projected)', '');
          
          labelPositions.push({
            x: lastPoint.x,
            y: lastPoint.y,
            label: regionName,
            color: dataset.borderColor
          });
        }
      });
      
      // Sort by Y position to handle overlapping
      labelPositions.sort((a, b) => a.y - b.y);
      
      // Adjust overlapping positions
      for (let i = 1; i < labelPositions.length; i++) {
        const current = labelPositions[i];
        const previous = labelPositions[i - 1];
        const minDistance = 20; // Minimum pixels between labels
        
        if (Math.abs(current.y - previous.y) < minDistance) {
          current.y = previous.y + minDistance;
        }
      }
      
      // Draw labels
      ctx.save();
      ctx.font = 'bold 11px Inter, system-ui, sans-serif';
      ctx.textAlign = 'left';
      ctx.textBaseline = 'middle';
      
      labelPositions.forEach(({ x, y, label, color }) => {
        const labelX = x + 10;
        const labelY = Math.max(20, Math.min(chartArea.bottom - 10, y));
        
        // Draw background rectangle for better readability
        const textWidth = ctx.measureText(label).width;
        ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
        ctx.fillRect(labelX - 4, labelY - 8, textWidth + 8, 16);
        
        // Draw border
        ctx.strokeStyle = color;
        ctx.lineWidth = 1;
        ctx.strokeRect(labelX - 4, labelY - 8, textWidth + 8, 16);
        
        // Draw text
        ctx.fillStyle = color;
        ctx.fillText(label, labelX, labelY);
      });
      
      ctx.restore();
    }
  };

  if (!chartData.datasets || chartData.datasets.length === 0) {
    return (
      <div className="flex items-center justify-center h-96 bg-background-secondary rounded-lg">
        <div className="text-center p-8">
          <h3 className="text-lg font-medium text-text-primary mb-2">No Data Available</h3>
          <p className="text-text-secondary">Please select different regions or indicators.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="h-96 w-full">
        <Line data={chartData} options={options} plugins={[projectedAreaPlugin, lineEndLabelsPlugin]} />
      </div>
      
      {/* Chart Info */}
      <div className="border-t border-border-light pt-6 space-y-4">
        <div className="flex flex-wrap items-center justify-between text-base">
          <div className="flex items-center space-x-8">
            <div className="flex items-center space-x-3">
              <div className="h-3 w-6 border-2 border-chart-eu"></div>
              <span className="text-text-tertiary">Historical</span>
            </div>
            <div className="flex items-center space-x-3">
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
        <div className="flex flex-wrap items-center gap-6">
          <span className="text-base text-text-secondary font-semibold">Regions:</span>
          {state.regions.map(regionId => {
            const region = regions.find(r => r.id === regionId);
            return region ? (
              <div key={regionId} className="flex items-center space-x-2">
                <div 
                  className="w-3 h-3 rounded-full" 
                  style={{ backgroundColor: region.color }}
                ></div>
                <span className="text-base text-text-secondary">{region.name}</span>
              </div>
            ) : null;
          })}
        </div>
      </div>
    </div>
  );
}