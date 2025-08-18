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
    unit: 'Index',
    description: 'Labor productivity per hour worked (index, 2015=100)'
  }
];

export const regions: Region[] = [
  { id: 'EUU', name: 'European Union', color: '#3B82F6' },
  { id: 'USA', name: 'United States', color: '#EF4444' },
  { id: 'CHN', name: 'China', color: '#F59E0B' },
  { id: 'BRC', name: 'BRICS', color: '#10B981' }
];

// Sample data generator
const generateDataPoints = (
  regionId: string, 
  indicator: string, 
  startYear: number = 2000, 
  endYear: number = 2024
): DataPoint[] => {
  const region = regions.find(r => r.id === regionId)!;
  const indicatorInfo = indicators.find(i => i.id === indicator)!;
  
  const data: DataPoint[] = [];
  
  // Base values and growth rates for different indicators and regions
  const baseValues: Record<string, Record<string, number>> = {
    gdp_per_capita: {
      EUU: 28000,
      USA: 45000,
      CHN: 8000,
      BRC: 15000
    },
    real_gdp_growth: {
      EUU: 1.8,
      USA: 2.2,
      CHN: 7.5,
      BRC: 4.2
    },
    rd_expenditure: {
      EUU: 2.1,
      USA: 3.2,
      CHN: 2.4,
      BRC: 1.8
    },
    capital_formation: {
      EUU: 20.5,
      USA: 21.2,
      CHN: 42.8,
      BRC: 28.5
    },
    labor_productivity: {
      EUU: 100,
      USA: 115,
      CHN: 85,
      BRC: 92
    }
  };

  const growthRates: Record<string, Record<string, number>> = {
    gdp_per_capita: {
      EUU: 0.015,
      USA: 0.018,
      CHN: 0.065,
      BRC: 0.035
    },
    real_gdp_growth: {
      EUU: -0.002,
      USA: -0.001,
      CHN: -0.008,
      BRC: -0.003
    },
    rd_expenditure: {
      EUU: 0.025,
      USA: 0.012,
      CHN: 0.045,
      BRC: 0.018
    },
    capital_formation: {
      EUU: -0.005,
      USA: 0.002,
      CHN: -0.012,
      BRC: 0.008
    },
    labor_productivity: {
      EUU: 0.012,
      USA: 0.015,
      CHN: 0.055,
      BRC: 0.025
    }
  };

  const baseValue = baseValues[indicator][regionId];
  const growthRate = growthRates[indicator][regionId];

  for (let year = startYear; year <= endYear; year++) {
    const yearsSinceStart = year - startYear;
    let value: number;

    if (indicator === 'real_gdp_growth') {
      // GDP growth oscillates around a trend
      const trend = baseValue + (growthRate * yearsSinceStart);
      const cyclical = Math.sin((year - startYear) * 0.5) * 1.5;
      const noise = (Math.random() - 0.5) * 0.8;
      value = trend + cyclical + noise;
    } else if (indicator === 'rd_expenditure' || indicator === 'capital_formation') {
      // These indicators have gradual changes with some volatility
      const trend = baseValue * Math.pow(1 + growthRate, yearsSinceStart);
      const noise = (Math.random() - 0.5) * baseValue * 0.1;
      value = trend + noise;
    } else {
      // GDP per capita and productivity grow more steadily
      const trend = baseValue * Math.pow(1 + growthRate, yearsSinceStart);
      const noise = (Math.random() - 0.5) * trend * 0.05;
      value = trend + noise;
    }

    // Add some realistic economic shocks
    if (year === 2008 || year === 2009) {
      // Financial crisis impact
      if (indicator === 'gdp_per_capita') value *= (regionId === 'CHN' ? 0.98 : 0.95);
      if (indicator === 'real_gdp_growth') value -= (regionId === 'CHN' ? 2 : 3);
    }
    if (year === 2020) {
      // COVID-19 impact
      if (indicator === 'gdp_per_capita') value *= 0.93;
      if (indicator === 'real_gdp_growth') value -= 5;
    }

    data.push({
      region: regionId,
      regionName: region.name,
      year,
      value: Math.max(0, value),
      indicator,
      indicatorName: indicatorInfo.name
    });
  }

  return data;
};

// Generate complete sample dataset
export const sampleData: DataPoint[] = [
  ...regions.flatMap(region => 
    indicators.flatMap(indicator => 
      generateDataPoints(region.id, indicator.id, 2000, 2024)
    )
  )
];

// Utility functions
export const getDataForIndicator = (indicatorId: string): DataPoint[] => {
  return sampleData.filter(d => d.indicator === indicatorId);
};

export const getDataForRegion = (regionId: string): DataPoint[] => {
  return sampleData.filter(d => d.region === regionId);
};

export const getDataForIndicatorAndRegions = (
  indicatorId: string, 
  regionIds: string[]
): DataPoint[] => {
  return sampleData.filter(d => 
    d.indicator === indicatorId && regionIds.includes(d.region)
  );
};

export const getLatestValueForRegion = (
  regionId: string, 
  indicatorId: string
): number | null => {
  const data = sampleData
    .filter(d => d.region === regionId && d.indicator === indicatorId)
    .sort((a, b) => b.year - a.year);
  
  return data.length > 0 ? data[0].value : null;
};

export const calculateCAGR = (
  regionId: string,
  indicatorId: string,
  startYear: number,
  endYear: number
): number | null => {
  const startData = sampleData.find(d => 
    d.region === regionId && d.indicator === indicatorId && d.year === startYear
  );
  const endData = sampleData.find(d => 
    d.region === regionId && d.indicator === indicatorId && d.year === endYear
  );

  if (!startData || !endData || startData.value <= 0) return null;

  const years = endYear - startYear;
  return Math.pow(endData.value / startData.value, 1 / years) - 1;
};