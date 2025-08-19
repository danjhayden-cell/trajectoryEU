'use client';

import { useState, useMemo } from 'react';
import { Settings, Zap, ChevronDown } from 'lucide-react';
import { ChartJSTrajectory } from './charts/chartjs-trajectory';
import { ControlPanel } from './ui/control-panel';
import { NarrativePanel } from './ui/narrative-panel';
import { regions, getDataForIndicatorAndRegions, calculateCAGR } from '../../lib/sample-data';

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

export interface ComparisonState {
  indicator: string;
  regions: string[];
  startYear: number;
  horizon: number;
  scenario: number;
  indexNormalized: boolean;
  unit: string;
}

const initialState: ComparisonState = {
  indicator: 'NY.GDP.PCAP.PP.KD',
  regions: ['EUU', 'USA'], // EU always included as baseline
  startYear: 2000,
  horizon: 20,
  scenario: 0,
  indexNormalized: true,
  unit: 'ppp'
};

export function TrajectoryCompare() {
  const [state, setState] = useState<ComparisonState>(initialState);
  const [showNarrative, setShowNarrative] = useState(false);
  const [showAdvancedControls, setShowAdvancedControls] = useState(false);
  const [customScenario, setCustomScenario] = useState(0);
  const [isCustomScenario, setIsCustomScenario] = useState(false);

  const handleStateChange = (updates: Partial<ComparisonState>) => {
    setState(prev => ({ ...prev, ...updates }));
  };

  const presets = [
    {
      name: 'EU vs US GDP',
      description: 'Compare GDP per capita growth since 2000',
      config: {
        indicator: 'NY.GDP.PCAP.PP.KD',
        regions: ['EUU', 'USA'],
        startYear: 2000,
        horizon: 20,
        scenario: 0,
        indexNormalized: true,
        unit: 'ppp'
      }
    },
    {
      name: 'Innovation Race',
      description: 'R&D spending across major economies',
      config: {
        indicator: 'GB.XPD.RSDV.GD.ZS',
        regions: ['EUU', 'USA', 'CHN'],
        startYear: 2005,
        horizon: 15,
        scenario: 0,
        indexNormalized: false,
        unit: 'percent'
      }
    },
    {
      name: 'Growth Trajectories',
      description: 'Real GDP growth patterns',
      config: {
        indicator: 'NY.GDP.MKTP.KD.ZG',
        regions: ['EUU', 'USA', 'CHN', 'BRC'],
        startYear: 2010,
        horizon: 10,
        scenario: 0,
        indexNormalized: false,
        unit: 'percent'
      }
    },
    {
      name: 'Investment Comparison',
      description: 'Capital formation trends',
      config: {
        indicator: 'NE.GDI.TOTL.ZS',
        regions: ['EUU', 'CHN'],
        startYear: 2005,
        horizon: 20,
        scenario: 0,
        indexNormalized: false,
        unit: 'percent'
      }
    }
  ];

  const handlePreset = (presetConfig: ComparisonState) => {
    setState(presetConfig);
  };

  // Calculate delta values for callout (memoized to prevent hydration mismatches)
  const deltaData = useMemo(() => {
    if (state.regions.length < 2) return null;
    
    const currentYear = 2024;
    const endYear = currentYear + state.horizon;
    const scenario = isCustomScenario ? customScenario : state.scenario;
    
    // Get sample data for calculation
    const indicatorId = getIndicatorId(state.indicator);
    const data = getDataForIndicatorAndRegions(indicatorId, state.regions);
    
    const projections = state.regions.map(regionId => {
      const regionData = data.filter(d => d.region === regionId && d.year >= state.startYear && d.year <= currentYear);
      if (regionData.length === 0) return null;
      
      const cagr = calculateCAGR(regionId, indicatorId, Math.max(state.startYear, currentYear - 10), currentYear);
      if (!cagr) return null;
      
      // Only apply scenario adjustment to EU (EUU)
      const adjustedGrowthRate = regionId === 'EUU' ? cagr + (scenario / 100) : cagr;
      const latestValue = regionData[regionData.length - 1].value;
      
      let startValue = latestValue;
      let endValue = latestValue;
      
      if (state.indexNormalized) {
        const baseData = regionData.find(d => d.year === state.startYear);
        if (baseData) {
          startValue = (latestValue / baseData.value) * 100;
          endValue = startValue * Math.pow(1 + adjustedGrowthRate, state.horizon);
        }
      } else {
        endValue = latestValue * Math.pow(1 + adjustedGrowthRate, state.horizon);
      }
      
      return {
        regionId,
        regionName: regions.find(r => r.id === regionId)?.name || regionId,
        endValue,
        change: ((endValue - startValue) / startValue) * 100
      };
    }).filter(Boolean);
    
    if (projections.length < 2) return null;
    
    // Compare first two regions
    const region1 = projections[0];
    const region2 = projections[1];
    
    if (!region1 || !region2) return null;
    
    const delta = region2.endValue - region1.endValue;
    const percentDifference = ((region2.endValue - region1.endValue) / region1.endValue) * 100;
    
    return {
      region1: region1.regionName,
      region2: region2.regionName,
      delta: Math.abs(delta),
      percentDifference: Math.abs(percentDifference),
      leader: delta > 0 ? region2.regionName : region1.regionName,
      isIndexed: state.indexNormalized
    };
  }, [state.regions, state.horizon, state.scenario, state.indicator, state.startYear, state.indexNormalized, isCustomScenario, customScenario]);

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div className="py-8">
        <h1 className="text-3xl font-bold text-text-primary">
          Compare Europe's trajectory with major peers and see how small differences in growth compound over 10-50 years
        </h1>
      </div>


      {/* Compact Primary Controls - Indicators & Regions Only */}
      <div className="bg-background-primary rounded-xl border border-border-light shadow-sm p-6 mb-6">

        <div className="grid lg:grid-cols-2 gap-6">
          {/* Indicator Selection - Compact Button Grid */}
          <div>
            <label className="block text-base font-semibold text-text-primary mb-3">
              📊 Economic Indicator
            </label>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
              {[
                { id: 'NY.GDP.PCAP.PP.KD', name: 'GDP per Capita', icon: '💰' },
                { id: 'NY.GDP.MKTP.KD.ZG', name: 'GDP Growth', icon: '📈' },
                { id: 'GB.XPD.RSDV.GD.ZS', name: 'R&D Spending', icon: '🔬' },
                { id: 'NE.GDI.TOTL.ZS', name: 'Investment', icon: '🏗️' },
                { id: 'labor_productivity', name: 'Productivity', icon: '⚡' }
              ].map(indicator => (
                <button
                  key={indicator.id}
                  onClick={() => handleStateChange({ indicator: indicator.id })}
                  className={`p-3 rounded-lg border-2 transition-all duration-200 text-center group ${
                    state.indicator === indicator.id
                      ? 'border-chart-eu bg-chart-eu/10 shadow-sm'
                      : 'border-border-medium bg-background-secondary hover:border-chart-eu/50'
                  }`}
                >
                  <div className="text-xl mb-1">
                    {indicator.icon}
                  </div>
                  <div className={`font-semibold text-xs ${
                    state.indicator === indicator.id ? 'text-chart-eu' : 'text-text-primary'
                  }`}>
                    {indicator.name}
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* EU-Centric Region Selection - Compact */}
          <div>
            <label className="block text-base font-semibold text-text-primary mb-3">
              🇪🇺 EU vs. Which Regions?
            </label>
            
            {/* EU Baseline + Other Regions in Grid */}
            <div className="grid grid-cols-2 gap-2">
              {/* EU Always Selected */}
              <div className="p-2 bg-chart-eu/10 border-2 border-chart-eu rounded-lg">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-chart-eu flex items-center justify-center">
                    <div className="w-1.5 h-1.5 rounded-full bg-white"></div>
                  </div>
                  <span className="font-semibold text-xs text-chart-eu">EU</span>
                  <span className="text-xs text-chart-eu/70 ml-auto">Base</span>
                </div>
              </div>

              {/* Other Regions */}
              {[
                { id: 'USA', name: 'USA', flag: '🇺🇸', color: '#EF4444' },
                { id: 'CHN', name: 'China', flag: '🇨🇳', color: '#F59E0B' },
                { id: 'BRC', name: 'BRICS', flag: '🌍', color: '#10B981' }
              ].map(region => {
                const isSelected = state.regions.includes(region.id);
                return (
                  <button
                    key={region.id}
                    onClick={() => {
                      const newRegions = isSelected
                        ? state.regions.filter(r => r !== region.id)
                        : [...state.regions, region.id];
                      if (!newRegions.includes('EUU')) {
                        newRegions.unshift('EUU');
                      }
                      handleStateChange({ regions: newRegions });
                    }}
                    className={`p-2 rounded-lg border-2 transition-all duration-200 ${
                      isSelected
                        ? 'shadow-sm'
                        : 'border-border-medium bg-background-secondary hover:border-gray-400'
                    }`}
                    style={{
                      borderColor: isSelected ? region.color : undefined,
                      backgroundColor: isSelected ? `${region.color}10` : undefined
                    }}
                  >
                    <div className="flex items-center gap-2">
                      <div className={`w-3 h-3 rounded-full flex items-center justify-center`} style={{ backgroundColor: region.color }}>
                        {isSelected && <div className="w-1.5 h-1.5 rounded-full bg-white"></div>}
                      </div>
                      <span className="text-xs mr-1">{region.flag}</span>
                      <span className={`font-semibold text-xs ${
                        isSelected ? 'text-text-primary' : 'text-text-secondary'
                      }`}>
                        {region.name}
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Main Layout: Chart Left, Controls Right */}
      <div className="grid lg:grid-cols-3 gap-8">
        {/* Chart Area - Left Side (2/3 width) */}
        <div className="lg:col-span-2">
          <div className="bg-background-primary rounded-xl border border-border-light shadow-sm p-6 h-full">
            <ChartJSTrajectory state={state} />
          </div>
        </div>

        {/* Consolidated Time & Scenario Controls - Right Side */}
        <div className="flex">
          <div className="bg-background-primary rounded-xl border border-border-light shadow-sm p-6 flex-1 flex flex-col">
            {/* Time Horizon Section */}
            <div className="mb-6">
              <h2 className="text-lg font-semibold text-text-primary mb-3 flex items-center">
                📅 Time Horizon
              </h2>
              
              {/* Time Horizon Buttons */}
              <div className="grid grid-cols-3 gap-2">
                {[
                  { value: 10, label: '10 years' },
                  { value: 20, label: '20 years' },
                  { value: 50, label: '50 years' }
                ].map(horizon => (
                  <button
                    key={horizon.value}
                    onClick={() => handleStateChange({ horizon: horizon.value })}
                    className={`p-3 rounded-lg border-2 transition-all text-center ${
                      state.horizon === horizon.value
                        ? 'border-chart-eu bg-chart-eu/10 text-chart-eu font-semibold'
                        : 'border-border-medium bg-background-secondary text-text-secondary hover:border-chart-eu/50'
                    }`}
                  >
                    <div className="font-semibold text-sm">{horizon.label}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* Growth Scenario Section */}
            <div className="mt-8">
              <h2 className="text-lg font-semibold text-text-primary mb-3 flex items-center">
                🇪🇺 EU Growth Scenario
              </h2>
              <div className="space-y-3">
                {[
                  { value: -0.5, label: 'Conservative (-0.5pp)', desc: 'Growth slows due to aging populations, debt burdens, or productivity stagnation', icon: '🐌' },
                  { value: 0, label: 'Baseline (0pp)', desc: 'Current trends continue unchanged from historical patterns', icon: '📈' },
                  { value: 0.5, label: 'Optimistic (+0.5pp)', desc: 'Growth accelerates through innovation breakthroughs, better policies, or favorable conditions', icon: '🚀' }
                ].map(scenario => (
                  <button
                    key={scenario.value}
                    onClick={() => {
                      setIsCustomScenario(false);
                      handleStateChange({ scenario: scenario.value });
                    }}
                    className={`w-full p-3 rounded-lg border-2 transition-all text-left ${
                      state.scenario === scenario.value && !isCustomScenario
                        ? 'border-chart-eu bg-chart-eu/10'
                        : 'border-border-medium bg-background-secondary hover:border-chart-eu/50'
                    }`}
                  >
                    <div className="flex items-center gap-3 mb-1">
                      <span className="text-base">{scenario.icon}</span>
                      <span className={`font-semibold text-sm ${
                        state.scenario === scenario.value && !isCustomScenario ? 'text-chart-eu' : 'text-text-primary'
                      }`}>
                        {scenario.label}
                      </span>
                      {state.scenario === scenario.value && !isCustomScenario && (
                        <span className="ml-auto text-chart-eu text-sm font-semibold">✓</span>
                      )}
                    </div>
                    <p className="text-xs text-text-tertiary leading-relaxed">
                      {scenario.desc}
                    </p>
                  </button>
                ))}
              </div>
            </div>
          </div>



        </div>
      </div>

      {/* Delta Results - Full Width Below Chart */}
      {deltaData && (
        <div className="bg-gradient-to-br from-chart-eu/5 to-chart-eu/10 rounded-xl border border-chart-eu/20 p-6 mb-8">
          {/* Header - Keep existing */}
          <div className="text-center mb-6">
            <h3 className="text-2xl font-bold text-text-primary mb-2 flex items-center justify-center">
              <div className="w-3 h-3 bg-chart-eu rounded-full mr-3"></div>
              By {state.horizon} years
            </h3>
            <div className="text-xl mb-2">
              <span className="font-bold text-chart-eu text-2xl">{deltaData.leader}</span>
              <span className="text-text-secondary mx-2">leads by</span>
              <span className="font-bold text-text-primary text-2xl">
                {Math.round(deltaData.percentDifference * 10) / 10}%
              </span>
            </div>
            <div className="text-base text-text-tertiary">
              {deltaData.region1} vs {deltaData.region2}
              {deltaData.isIndexed ? ' (indexed, start=100)' : ''}
            </div>
          </div>

          {/* Real-World Consequences Cards */}
          <div className="grid md:grid-cols-3 gap-4">
            {/* Living Standards Card */}
            <div className="bg-background-primary rounded-lg border border-border-light p-4">
              <div className="flex items-center gap-2 mb-3">
                <span className="text-lg">🏠</span>
                <h4 className="font-semibold text-text-primary">Living Standards</h4>
              </div>
              <div className="text-sm text-text-secondary">
                {state.indicator === 'NY.GDP.PCAP.PP.KD' ? (
                  deltaData.percentDifference > 15 ? (
                    <>
                      <p className="mb-2">A <strong>{Math.round(deltaData.percentDifference)}%</strong> gap means:</p>
                      <ul className="space-y-1 text-xs">
                        <li>• Significant differences in purchasing power</li>
                        <li>• Different access to healthcare and education</li>
                        <li>• Varying quality of infrastructure</li>
                      </ul>
                    </>
                  ) : deltaData.percentDifference > 5 ? (
                    <>
                      <p className="mb-2">A <strong>{Math.round(deltaData.percentDifference)}%</strong> gap translates to:</p>
                      <ul className="space-y-1 text-xs">
                        <li>• Noticeable differences in disposable income</li>
                        <li>• Varied consumer spending patterns</li>
                        <li>• Different housing affordability</li>
                      </ul>
                    </>
                  ) : (
                    <p>Similar living standards with minor differences in purchasing power and lifestyle choices.</p>
                  )
                ) : (
                  <p>Economic growth differences gradually compound into varying improvements in quality of life over time.</p>
                )}
              </div>
            </div>

            {/* Public Services Card */}
            <div className="bg-background-primary rounded-lg border border-border-light p-4">
              <div className="flex items-center gap-2 mb-3">
                <span className="text-lg">🏥</span>
                <h4 className="font-semibold text-text-primary">Public Services</h4>
              </div>
              <div className="text-sm text-text-secondary">
                {state.indicator === 'NY.GDP.PCAP.PP.KD' ? (
                  deltaData.percentDifference > 15 ? (
                    <>
                      <p className="mb-2">Higher GDP enables:</p>
                      <ul className="space-y-1 text-xs">
                        <li>• More funding for healthcare systems</li>
                        <li>• Better educational resources</li>
                        <li>• Enhanced social safety nets</li>
                      </ul>
                    </>
                  ) : deltaData.percentDifference > 5 ? (
                    <>
                      <p className="mb-2">Moderate differences in:</p>
                      <ul className="space-y-1 text-xs">
                        <li>• Public investment capacity</li>
                        <li>• Infrastructure maintenance</li>
                        <li>• Social program scope</li>
                      </ul>
                    </>
                  ) : (
                    <p>Similar capacity for public investment and social programs with minor variations in scope.</p>
                  )
                ) : state.indicator === 'GB.XPD.RSDV.GD.ZS' ? (
                  <p>R&D investment differences affect future innovation capacity and technological leadership in public services.</p>
                ) : (
                  <p>Economic growth variations influence government revenue and capacity for public service delivery.</p>
                )}
              </div>
            </div>

            {/* Economic Competitiveness Card */}
            <div className="bg-background-primary rounded-lg border border-border-light p-4">
              <div className="flex items-center gap-2 mb-3">
                <span className="text-lg">🏭</span>
                <h4 className="font-semibold text-text-primary">Economic Position</h4>
              </div>
              <div className="text-sm text-text-secondary">
                {state.indicator === 'NY.GDP.PCAP.PP.KD' ? (
                  deltaData.percentDifference > 15 ? (
                    <>
                      <p className="mb-2">Significant impact on:</p>
                      <ul className="space-y-1 text-xs">
                        <li>• Global economic influence</li>
                        <li>• Ability to attract investment</li>
                        <li>• Trade negotiating power</li>
                      </ul>
                    </>
                  ) : deltaData.percentDifference > 5 ? (
                    <>
                      <p className="mb-2">Notable effects on:</p>
                      <ul className="space-y-1 text-xs">
                        <li>• International competitiveness</li>
                        <li>• Business environment attractiveness</li>
                        <li>• Innovation ecosystem strength</li>
                      </ul>
                    </>
                  ) : (
                    <p>Relatively similar competitive positions with minor differences in global economic standing.</p>
                  )
                ) : state.indicator === 'GB.XPD.RSDV.GD.ZS' ? (
                  <p>R&D spending gaps create long-term differences in technological capabilities and innovation leadership.</p>
                ) : state.indicator === 'labor_productivity' ? (
                  <p>Productivity differences determine competitiveness, wage growth potential, and industrial strength.</p>
                ) : (
                  <p>Growth pattern differences influence long-term economic positioning and global competitiveness.</p>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Quick Preset Comparisons - Below Delta */}
      <div className="bg-background-primary rounded-xl border border-border-light shadow-sm p-6 mb-8">
        <h2 className="text-xl font-semibold text-text-primary mb-4 flex items-center">
          <Zap className="h-5 w-5 mr-2 text-chart-eu" />
          Quick Comparisons
        </h2>
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
          {presets.map((preset, index) => {
            const isActive = 
              state.indicator === preset.config.indicator &&
              state.regions.length === preset.config.regions.length &&
              state.regions.every(r => preset.config.regions.includes(r)) &&
              state.horizon === preset.config.horizon;
            
            return (
              <button
                key={index}
                onClick={() => handlePreset(preset.config)}
                className={`p-4 text-left border rounded-lg transition-all group ${
                  isActive 
                    ? 'bg-chart-eu/10 border-chart-eu text-chart-eu' 
                    : 'bg-background-secondary border-border-light hover:border-chart-eu hover:bg-chart-eu/5'
                }`}
              >
                <div className="mb-2">
                  <h3 className={`font-medium text-base mb-1 transition-colors ${
                    isActive ? 'text-chart-eu' : 'text-text-primary group-hover:text-chart-eu'
                  }`}>
                    {preset.name}
                  </h3>
                  <div className="text-xs text-text-tertiary">
                    {preset.config.regions.length} regions · {preset.config.horizon} years
                  </div>
                </div>
                <p className="text-sm text-text-tertiary leading-relaxed">
                  {preset.description}
                </p>
              </button>
            );
          })}
        </div>
      </div>

      {/* Advanced Controls Panel - Below presets */}
      <div className="bg-background-primary rounded-xl border border-border-light shadow-sm">
        <button
          onClick={() => setShowAdvancedControls(!showAdvancedControls)}
          className="w-full flex items-center justify-between p-6 hover:bg-background-secondary transition-colors"
        >
          <div className="flex items-center space-x-3">
            <Settings className="h-5 w-5 text-text-secondary" />
            <h3 className="text-xl font-semibold text-text-primary">Advanced Controls</h3>
          </div>
          <div className="flex items-center space-x-3">
            <span className="text-base text-text-tertiary">
              Customize indicators, regions, and time periods
            </span>
            <ChevronDown 
              className={`h-4 w-4 text-text-tertiary transition-transform ${
                showAdvancedControls ? 'rotate-180' : ''
              }`} 
            />
          </div>
        </button>
        {showAdvancedControls && (
          <div className="border-t border-border-light p-8">
            <ControlPanel state={state} onChange={handleStateChange} />
          </div>
        )}
      </div>

      {/* Optional Impact Analysis */}
      <div className="text-center">
        {!showNarrative ? (
          <button
            onClick={() => setShowNarrative(true)}
            className="px-8 py-4 bg-chart-eu text-white rounded-lg hover:bg-chart-eu/90 transition-colors font-semibold text-base"
          >
            Generate Impact Analysis
          </button>
        ) : (
          <div className="bg-background-primary rounded-xl border border-border-light shadow-sm p-8">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-semibold text-text-primary">Impact Analysis</h3>
              <button
                onClick={() => setShowNarrative(false)}
                className="text-base text-chart-eu hover:text-chart-eu/80 transition-colors font-medium"
              >
                Hide
              </button>
            </div>
            <NarrativePanel state={state} />
          </div>
        )}
      </div>

      {/* Footer / Trust Section */}
      <footer className="mt-16 pt-8 border-t border-border-light">
        <div className="grid md:grid-cols-3 gap-8 text-sm">
          {/* Sources */}
          <div>
            <h4 className="font-semibold text-text-primary mb-3 flex items-center">
              📊 Sources
            </h4>
            <p className="text-text-secondary leading-relaxed">
              World Bank; Eurostat (where used).
            </p>
          </div>

          {/* Methodology */}
          <div>
            <h4 className="font-semibold text-text-primary mb-3 flex items-center">
              🔬 Methodology
            </h4>
            <p className="text-text-secondary leading-relaxed">
              <a 
                href="/methodology" 
                className="text-chart-eu hover:text-chart-eu/80 transition-colors underline decoration-dotted underline-offset-2"
              >
                How we build projections and handle units →
              </a>
            </p>
          </div>

          {/* Privacy */}
          <div>
            <h4 className="font-semibold text-text-primary mb-3 flex items-center">
              🔒 Privacy
            </h4>
            <p className="text-text-secondary leading-relaxed">
              No personal data; optional cookieless analytics.
            </p>
          </div>
        </div>

        {/* Attribution */}
        <div className="mt-8 pt-6 border-t border-border-light text-center">
          <p className="text-xs text-text-tertiary">
            Built with care for transparent economic analysis
          </p>
        </div>
      </footer>

    </div>
  );
}