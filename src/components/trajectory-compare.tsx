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
      
      const adjustedGrowthRate = cagr + (scenario / 100);
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
      <div className="text-center py-8">
        <h1 className="text-3xl font-bold text-text-primary mb-4">
          See how small differences become big futures
        </h1>
        <p className="text-base text-text-tertiary">
          Compare economic trajectories and explore how growth differences compound over time
        </p>
      </div>

      {/* Compact Disclaimer Pill */}
      <div className="flex justify-center mb-4">
        <div className="inline-flex items-center px-3 py-1.5 bg-amber-50 text-amber-700 text-xs rounded-full border border-amber-200">
          <span className="font-medium">Illustrative projection</span>
          <span className="mx-1">·</span>
          <span>constant-rate assumption</span>
          <span className="mx-1">·</span>
          <a href="/methodology" className="underline hover:no-underline font-medium">
            see Methodology
          </a>
        </div>
      </div>

      {/* Primary Controls Card - EU-Focused Design */}
      <div className="bg-background-primary rounded-2xl border border-border-light shadow-lg p-8 mb-8">
        {/* Header with EU Focus */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-text-primary mb-2">Compare with the EU</h2>
          <p className="text-base text-text-tertiary">Explore how different economic indicators evolve across regions over time</p>
        </div>

        {/* Main Controls Grid */}
        <div className="space-y-8">
          {/* Indicator Selection - Button Grid */}
          <div>
            <label className="block text-lg font-semibold text-text-primary mb-4">
              Economic Indicator
            </label>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
              {[
                { id: 'NY.GDP.PCAP.PP.KD', name: 'GDP per Capita', icon: '💰', desc: 'Purchasing power adjusted' },
                { id: 'NY.GDP.MKTP.KD.ZG', name: 'GDP Growth', icon: '📈', desc: 'Annual percentage change' },
                { id: 'GB.XPD.RSDV.GD.ZS', name: 'R&D Spending', icon: '🔬', desc: 'Innovation investment' },
                { id: 'NE.GDI.TOTL.ZS', name: 'Investment', icon: '🏗️', desc: 'Capital formation' },
                { id: 'labor_productivity', name: 'Productivity', icon: '⚡', desc: 'Output per worker' }
              ].map(indicator => (
                <button
                  key={indicator.id}
                  onClick={() => handleStateChange({ indicator: indicator.id })}
                  className={`p-4 rounded-xl border-2 transition-all duration-200 text-left group ${
                    state.indicator === indicator.id
                      ? 'border-chart-eu bg-chart-eu/10 shadow-md transform scale-105'
                      : 'border-border-medium bg-background-secondary hover:border-chart-eu/50 hover:bg-chart-eu/5'
                  }`}
                >
                  <div className={`text-2xl mb-2 transition-transform group-hover:scale-110 ${
                    state.indicator === indicator.id ? 'transform scale-110' : ''
                  }`}>
                    {indicator.icon}
                  </div>
                  <div className={`font-semibold text-sm mb-1 ${
                    state.indicator === indicator.id ? 'text-chart-eu' : 'text-text-primary'
                  }`}>
                    {indicator.name}
                  </div>
                  <div className="text-xs text-text-tertiary">
                    {indicator.desc}
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Regions & Time Controls Row */}
          <div className="grid md:grid-cols-2 gap-8">
            {/* EU-Centric Region Selection */}
            <div>
              <label className="block text-lg font-semibold text-text-primary mb-4">
                <span className="inline-flex items-center gap-2">
                  🇪🇺 EU vs. Which Regions?
                </span>
              </label>
              
              {/* EU Always Selected (Visual Only) */}
              <div className="mb-4 p-3 bg-chart-eu/10 border-2 border-chart-eu rounded-xl">
                <div className="flex items-center gap-3">
                  <div className="w-4 h-4 rounded-full bg-chart-eu flex items-center justify-center">
                    <div className="w-2 h-2 rounded-full bg-white"></div>
                  </div>
                  <span className="font-semibold text-chart-eu">European Union</span>
                  <span className="text-xs text-chart-eu/70 ml-auto">Baseline</span>
                </div>
              </div>

              {/* Other Regions */}
              <div className="space-y-3">
                {[
                  { id: 'USA', name: 'United States', flag: '🇺🇸', color: '#EF4444' },
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
                        // Always ensure EU is included
                        if (!newRegions.includes('EUU')) {
                          newRegions.unshift('EUU');
                        }
                        handleStateChange({ regions: newRegions });
                      }}
                      className={`w-full p-3 rounded-xl border-2 transition-all duration-200 ${
                        isSelected
                          ? 'border-2 shadow-md transform scale-105'
                          : 'border-border-medium bg-background-secondary hover:border-gray-400'
                      }`}
                      style={{
                        borderColor: isSelected ? region.color : undefined,
                        backgroundColor: isSelected ? `${region.color}10` : undefined
                      }}
                    >
                      <div className="flex items-center gap-3">
                        <div className={`w-4 h-4 rounded-full flex items-center justify-center transition-all ${
                          isSelected ? 'transform scale-110' : ''
                        }`} style={{ backgroundColor: region.color }}>
                          {isSelected && <div className="w-2 h-2 rounded-full bg-white"></div>}
                        </div>
                        <span className="text-lg mr-2">{region.flag}</span>
                        <span className={`font-semibold ${
                          isSelected ? 'text-text-primary' : 'text-text-secondary'
                        }`}>
                          {region.name}
                        </span>
                        {isSelected && (
                          <span className="ml-auto text-xs font-medium" style={{ color: region.color }}>
                            ✓ Active
                          </span>
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Consolidated Time & Scenario Controls */}
            <div className="space-y-6">
              {/* Time Horizon */}
              <div>
                <label className="block text-lg font-semibold text-text-primary mb-4">
                  📅 Time Horizon
                </label>
                <div className="grid grid-cols-2 gap-3">
                  {[
                    { value: 10, label: '10 years', desc: 'Medium term' },
                    { value: 20, label: '20 years', desc: 'Long term' },
                    { value: 5, label: '5 years', desc: 'Short term' },
                    { value: 50, label: '50 years', desc: 'Generation' }
                  ].map(horizon => (
                    <button
                      key={horizon.value}
                      onClick={() => handleStateChange({ horizon: horizon.value })}
                      className={`p-4 rounded-xl border-2 transition-all duration-200 text-left ${
                        state.horizon === horizon.value
                          ? 'border-chart-eu bg-chart-eu/10 shadow-md transform scale-105'
                          : 'border-border-medium bg-background-secondary hover:border-chart-eu/50'
                      }`}
                    >
                      <div className={`font-bold text-base mb-1 ${
                        state.horizon === horizon.value ? 'text-chart-eu' : 'text-text-primary'
                      }`}>
                        {horizon.label}
                      </div>
                      <div className="text-xs text-text-tertiary">
                        {horizon.desc}
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Growth Scenario */}
              <div>
                <label className="block text-lg font-semibold text-text-primary mb-4">
                  📊 Growth Scenario
                </label>
                <div className="space-y-3">
                  {[
                    { value: 0, label: 'Baseline', desc: 'Historical trends continue', icon: '📈' },
                    { value: 0.5, label: 'Optimistic (+0.5pp)', desc: 'Accelerated growth', icon: '🚀' },
                    { value: -0.5, label: 'Conservative (-0.5pp)', desc: 'Slower growth', icon: '🐌' }
                  ].map(scenario => (
                    <button
                      key={scenario.value}
                      onClick={() => {
                        setIsCustomScenario(false);
                        handleStateChange({ scenario: scenario.value });
                      }}
                      className={`w-full p-3 rounded-xl border-2 transition-all duration-200 text-left ${
                        state.scenario === scenario.value && !isCustomScenario
                          ? 'border-chart-eu bg-chart-eu/10 shadow-md'
                          : 'border-border-medium bg-background-secondary hover:border-chart-eu/50'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <span className="text-lg">{scenario.icon}</span>
                        <div>
                          <div className={`font-semibold text-sm mb-1 ${
                            state.scenario === scenario.value && !isCustomScenario ? 'text-chart-eu' : 'text-text-primary'
                          }`}>
                            {scenario.label}
                          </div>
                          <div className="text-xs text-text-tertiary">
                            {scenario.desc}
                          </div>
                        </div>
                        {state.scenario === scenario.value && !isCustomScenario && (
                          <div className="ml-auto text-chart-eu text-sm font-semibold">✓</div>
                        )}
                      </div>
                    </button>
                  ))}
                  
                  {/* Custom Scenario */}
                  <button
                    onClick={() => {
                      setIsCustomScenario(true);
                      handleStateChange({ scenario: customScenario });
                    }}
                    className={`w-full p-3 rounded-xl border-2 transition-all duration-200 text-left ${
                      isCustomScenario
                        ? 'border-chart-eu bg-chart-eu/10 shadow-md'
                        : 'border-border-medium bg-background-secondary hover:border-chart-eu/50'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-lg">⚙️</span>
                      <div>
                        <div className={`font-semibold text-sm mb-1 ${
                          isCustomScenario ? 'text-chart-eu' : 'text-text-primary'
                        }`}>
                          Custom ({customScenario > 0 ? '+' : ''}{customScenario}pp)
                        </div>
                        <div className="text-xs text-text-tertiary">
                          Set your own growth rate
                        </div>
                      </div>
                      {isCustomScenario && (
                        <div className="ml-auto text-chart-eu text-sm font-semibold">✓</div>
                      )}
                    </div>
                  </button>
                  
                  {/* Custom Slider */}
                  {isCustomScenario && (
                    <div className="p-4 bg-background-tertiary rounded-xl border border-border-light">
                      <input
                        type="range"
                        min="-2"
                        max="2"
                        step="0.1"
                        value={customScenario}
                        onChange={(e) => {
                          const value = parseFloat(e.target.value);
                          setCustomScenario(value);
                          handleStateChange({ scenario: value });
                        }}
                        className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                      />
                      <div className="flex justify-between text-sm text-text-tertiary mt-3">
                        <span>-2pp</span>
                        <span className="font-semibold text-chart-eu">
                          {customScenario > 0 ? '+' : ''}{customScenario}pp
                        </span>
                        <span>+2pp</span>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Layout: Chart Left, Controls Right */}
      <div className="grid lg:grid-cols-3 gap-8">
        {/* Chart Area - Left Side (2/3 width) */}
        <div className="lg:col-span-2">
          <div className="bg-background-primary rounded-xl border border-border-light shadow-sm p-6">
            <ChartJSTrajectory state={state} />
          </div>
        </div>

        {/* Compact Controls - Right Side (1/3 width) */}
        <div className="space-y-6">
          {/* Quick Preset Buttons */}
          <div className="bg-background-primary rounded-xl border border-border-light shadow-sm p-6">
            <h2 className="text-xl font-semibold text-text-primary mb-4 flex items-center">
              <Zap className="h-5 w-5 mr-2 text-chart-eu" />
              Quick Comparisons
            </h2>
            <div className="space-y-3">
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
                    className={`w-full p-4 text-left border rounded-lg transition-all group ${
                      isActive 
                        ? 'bg-chart-eu/10 border-chart-eu text-chart-eu' 
                        : 'bg-background-secondary border-border-light hover:border-chart-eu hover:bg-chart-eu/5'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <h3 className={`font-medium text-base transition-colors ${
                        isActive ? 'text-chart-eu' : 'text-text-primary group-hover:text-chart-eu'
                      }`}>
                        {preset.name}
                      </h3>
                      <div className="text-sm text-text-tertiary">
                        {preset.config.regions.length} region{preset.config.regions.length !== 1 ? 's' : ''} · {preset.config.horizon} years
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

          {/* Quick Scenario Switcher */}
          <div className="bg-background-primary rounded-xl border border-border-light shadow-sm p-6">
            <h3 className="text-xl font-semibold text-text-primary mb-4">Growth Scenarios</h3>
            <div className="space-y-3">
              {[
                { value: -0.5, label: '−0.5pp', sublabel: 'Conservative growth' },
                { value: 0, label: 'Baseline', sublabel: 'Historical trends' },
                { value: 0.5, label: '+0.5pp', sublabel: 'Accelerated growth' }
              ].map(scenario => (
                <button
                  key={scenario.value}
                  onClick={() => {
                    setIsCustomScenario(false);
                    handleStateChange({ scenario: scenario.value });
                  }}
                  className={`w-full p-4 text-left border rounded-lg transition-all group ${
                    state.scenario === scenario.value && !isCustomScenario
                      ? 'bg-chart-eu border-chart-eu text-white shadow-sm' 
                      : 'bg-background-secondary border-border-medium hover:border-chart-eu hover:bg-chart-eu/5 text-text-primary'
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className={`font-medium text-base ${
                      state.scenario === scenario.value && !isCustomScenario ? 'text-white' : 'text-text-primary'
                    }`}>
                      {scenario.label}
                    </div>
                    {state.scenario === scenario.value && !isCustomScenario && (
                      <div className="w-2 h-2 bg-white rounded-full"></div>
                    )}
                  </div>
                  <div className={`text-sm ${
                    state.scenario === scenario.value && !isCustomScenario ? 'text-white/80' : 'text-text-secondary'
                  }`}>
                    {scenario.sublabel}
                  </div>
                </button>
              ))}
              
              {/* Custom Scenario Button */}
              <button
                onClick={() => {
                  setIsCustomScenario(true);
                  handleStateChange({ scenario: customScenario });
                }}
                className={`w-full p-4 text-left border rounded-lg transition-all group ${
                  isCustomScenario
                    ? 'bg-chart-eu border-chart-eu text-white shadow-sm' 
                    : 'bg-background-secondary border-border-medium hover:border-chart-eu hover:bg-chart-eu/5 text-text-primary'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <div className={`font-medium text-base ${
                    isCustomScenario ? 'text-white' : 'text-text-primary'
                  }`}>
                    Custom
                  </div>
                  {isCustomScenario && (
                    <div className="w-2 h-2 bg-white rounded-full"></div>
                  )}
                </div>
                <div className={`text-xs ${
                  isCustomScenario ? 'text-white/80' : 'text-text-secondary'
                }`}>
                  {isCustomScenario ? `${customScenario > 0 ? '+' : ''}${customScenario}pp growth` : 'Set custom rate'}
                </div>
              </button>
              
              {/* Custom Slider */}
              {isCustomScenario && (
                <div className="p-4 bg-background-tertiary rounded-lg border border-border-light">
                  <label className="block text-sm font-medium text-text-tertiary mb-3">
                    Growth Rate Adjustment
                  </label>
                  <input
                    type="range"
                    min="-2"
                    max="2"
                    step="0.1"
                    value={customScenario}
                    onChange={(e) => {
                      const value = parseFloat(e.target.value);
                      setCustomScenario(value);
                      handleStateChange({ scenario: value });
                    }}
                    className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                  />
                  <div className="flex justify-between text-sm text-text-tertiary mt-3">
                    <span>-2pp</span>
                    <span className="font-medium text-text-primary">
                      {customScenario > 0 ? '+' : ''}{customScenario}pp
                    </span>
                    <span>+2pp</span>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Delta Callout Panel */}
          {deltaData && (
            <div className="bg-gradient-to-br from-chart-eu/5 to-chart-eu/10 rounded-xl border border-chart-eu/20 p-6">
              <h3 className="text-xl font-semibold text-text-primary mb-4 flex items-center">
                <div className="w-2 h-2 bg-chart-eu rounded-full mr-3"></div>
                By {state.horizon} years
              </h3>
              <div className="space-y-3">
                <div className="text-base">
                  <span className="font-semibold text-chart-eu">{deltaData.leader}</span>
                  <span className="text-text-secondary"> leads by </span>
                  <span className="font-semibold text-text-primary">
                    {Math.round(deltaData.percentDifference * 10) / 10}%
                  </span>
                </div>
                
                <div className="text-sm text-text-tertiary border-t border-border-light pt-3">
                  {deltaData.region1} vs {deltaData.region2}
                  {deltaData.isIndexed ? ' (indexed, start=100)' : ''}
                </div>
                
                <div className="flex items-center justify-between text-sm">
                  <span className="text-text-tertiary">
                    Scenario: {isCustomScenario ? `${customScenario > 0 ? '+' : ''}${customScenario}pp` : 
                      state.scenario === 0 ? 'Baseline' : 
                      state.scenario > 0 ? `+${state.scenario}pp` : `${state.scenario}pp`}
                  </span>
                </div>
              </div>
            </div>
          )}

        </div>
      </div>

      {/* Advanced Controls Panel - Below main chart */}
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

    </div>
  );
}