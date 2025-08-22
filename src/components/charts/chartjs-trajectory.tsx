'use client';

import React, { useState, useEffect, useMemo } from 'react';
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
import { getDataForIndicatorAndRegions, regions, calculateCAGR, indicators } from '../../../lib/data-source-client';

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

// Helper function to generate appropriate Y-axis titles
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const getYAxisTitle = (indicatorInfo: any) => {
  if (!indicatorInfo) return 'Value';
  
  switch (indicatorInfo.id) {
    case 'gdp_per_capita':
      return 'GDP per Capita (PPP, USD)';
    case 'labor_productivity':
      return 'Labor Productivity (USD per employed person)';
    case 'real_gdp_growth':
      return 'Real GDP Growth Rate (%)';
    case 'rd_expenditure':
      return 'R&D Expenditure (% of GDP)';
    case 'capital_formation':
      return 'Gross Capital Formation (% of GDP)';
    default:
      return `${indicatorInfo.name} (${indicatorInfo.unit})`;
  }
};

// Helper function to determine if Y-axis should begin at zero
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const getBeginAtZero = (indicatorInfo: any) => {
  if (!indicatorInfo) return false;
  
  switch (indicatorInfo.id) {
    case 'real_gdp_growth':
      // GDP growth can be negative, so don't force zero
      return false;
    case 'rd_expenditure':
    case 'capital_formation':
      // Percentages should start at zero for context
      return true;
    case 'gdp_per_capita':
    case 'labor_productivity':
      // Currency values don't need to start at zero (better scale)
      return false;
    default:
      return indicatorInfo?.unit === '%';
  }
};

export function ChartJSTrajectory({ state }: ChartJSTrajectoryProps) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [chartData, setChartData] = useState<any>({ datasets: [] });

  useEffect(() => {
    const loadChartData = async () => {
      try {
        const indicatorId = getIndicatorId(state.indicator);
        const dataResult = getDataForIndicatorAndRegions(indicatorId, state.regions);
        const historicalData = dataResult instanceof Promise ? await dataResult : dataResult;

        if (!Array.isArray(historicalData)) {
          setChartData({ datasets: [] });
          return;
        }
    
    const currentYear = 2024;
    const endYear = currentYear + state.horizon;
    
    // Filter historical data
    const filteredHistorical = historicalData.filter(d => 
      d.year >= state.startYear && d.year <= currentYear
    );
    
    if (filteredHistorical.length === 0) {
      setChartData({ datasets: [] });
      return;
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
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const datasets: any[] = [];

    const regionDataSets = await Promise.all(state.regions.map(async regionId => {
      const region = regions.find(r => r.id === regionId);
      if (!region) return;

      // Use shorter names for chart labels
      const getShortRegionName = (regionId: string) => {
        const shortNames: Record<string, string> = {
          'EUU': 'EU',
          'USA': 'USA', 
          'CHN': 'China',
          'BRC': 'BRICS'
        };
        return shortNames[regionId] || region.name;
      };

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

      // Create historical dataset
      let historicalDataSet = null;
      if (historicalPoints.length > 0) {
        historicalDataSet = {
          label: getShortRegionName(regionId),
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
        };
      }
      
      // Create projection dataset
      let projectionDataSet = null;
      if (historicalPoints.length > 0) {
        // Generate projections
        const projectionStartYear = Math.max(state.startYear, currentYear - 10);
        const cagrResult = calculateCAGR(regionId, indicatorId, projectionStartYear, currentYear);
        const cagr = cagrResult instanceof Promise ? await cagrResult : cagrResult;
        
        if (cagr) {
          // Only apply scenario adjustment to EU (EUU)
          const adjustedGrowthRate = regionId === 'EUU' ? cagr + (state.scenario / 100) : cagr;
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

          // Create projection dataset
          projectionDataSet = {
            label: `${getShortRegionName(regionId)} (Projected)`,
            data: projectionPoints,
            borderColor: regionColor,
            backgroundColor: `${regionColor}10`,
            borderWidth: 2,
            borderDash: [8, 4],
            pointRadius: 0,
            pointHoverRadius: 4,
            tension: 0.1,
            fill: false,
          };
        }
      }

      return { historical: historicalDataSet, projection: projectionDataSet };
    }));

    // Flatten the results into datasets array
    regionDataSets.forEach(regionResult => {
      if (regionResult?.historical) datasets.push(regionResult.historical);
      if (regionResult?.projection) datasets.push(regionResult.projection);
    });

    setChartData({ datasets });
      } catch (error) {
        console.error('Error loading chart data:', error);
        setChartData({ datasets: [] });
      }
    };

    loadChartData();
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
              return `${year}`; // Bold year formatting, no comma
            },
            label: (context: TooltipItem<'line'>) => {
              const point = context.dataset.data[context.dataIndex] as ProcessedDataPoint;
              const value = typeof context.parsed.y === 'number' ? context.parsed.y : 0;
              
              let formattedValue: string;
              if (state.indexNormalized) {
                formattedValue = `${value.toFixed(1)} (Index)`;
              } else {
                // Format based on indicator type
                switch (indicatorInfo?.id) {
                  case 'gdp_per_capita':
                    formattedValue = `$${Math.round(value).toLocaleString()}`;
                    break;
                  case 'labor_productivity':
                    formattedValue = `$${Math.round(value).toLocaleString()}`;
                    break;
                  case 'real_gdp_growth':
                  case 'rd_expenditure':
                  case 'capital_formation':
                    formattedValue = `${value.toFixed(1)}%`;
                    break;
                  default:
                    formattedValue = Math.round(value).toLocaleString();
                }
              }
              
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
              weight: 500,
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
            callback: function(value) {
              if (typeof value === 'number') {
                return Math.round(value).toString(); // Remove commas from years
              }
              return value;
            },
          },
        },
        y: {
          beginAtZero: getBeginAtZero(indicatorInfo),
          title: {
            display: true,
            text: state.indexNormalized 
              ? 'Index (Start Year = 100)' 
              : getYAxisTitle(indicatorInfo),
            font: {
              family: 'inherit',
              size: 12,
              weight: 500,
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
                // Format based on indicator type
                switch (indicatorInfo?.id) {
                  case 'gdp_per_capita':
                    return `$${Math.round(value).toLocaleString()}`;
                  case 'labor_productivity':
                    return `$${Math.round(value).toLocaleString()}`;
                  case 'real_gdp_growth':
                  case 'rd_expenditure':
                  case 'capital_formation':
                    return `${value.toFixed(1)}%`;
                  default:
                    return Math.round(value).toLocaleString();
                }
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
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    beforeDatasetsDraw(chart: any) {
      const { ctx, chartArea, scales } = chart;
      const currentYear = 2024;
      
      // Get the x-coordinate for the current year (where projections start)
      const projectionStartX = scales.x.getPixelForValue(currentYear);
      
      if (projectionStartX < chartArea.right) {
        ctx.save();
        ctx.fillStyle = 'rgba(59, 130, 246, 0.08)'; // More visible blue shade
        ctx.fillRect(
          projectionStartX,
          chartArea.top,
          chartArea.right - projectionStartX,
          chartArea.bottom - chartArea.top
        );
        
        // Add a subtle vertical line at the projection boundary
        ctx.strokeStyle = 'rgba(59, 130, 246, 0.3)';
        ctx.lineWidth = 1;
        ctx.setLineDash([4, 4]); // Dashed line
        ctx.beginPath();
        ctx.moveTo(projectionStartX, chartArea.top);
        ctx.lineTo(projectionStartX, chartArea.bottom);
        ctx.stroke();
        ctx.setLineDash([]); // Reset line dash
        
        ctx.restore();
      }
    }
  };

  // Custom plugin for line-end labels
  const lineEndLabelsPlugin = {
    id: 'lineEndLabels',
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    afterDatasetsDraw(chart: any) {
      const { ctx, chartArea } = chart;
      const labelPositions: Array<{x: number, y: number, label: string, color: string}> = [];
      
      // Collect all projection datasets (these are the rightmost lines)
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const projectionDatasets = chart.data.datasets.filter((dataset: any) => 
        dataset.label && dataset.label.includes('Projected')
      );
      
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      projectionDatasets.forEach((dataset: any) => {
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
      <div className="border-t border-border-light pt-6">
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
      </div>
    </div>
  );
}