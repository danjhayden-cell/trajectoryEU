'use client';

import { useState, useMemo, useEffect, useCallback } from 'react';
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
  const [customScenario] = useState(0);
  const [isCustomScenario, setIsCustomScenario] = useState(false);
  const [consequences, setConsequences] = useState<{
    content: string;
  } | null>(null);
  const [isLoadingConsequences, setIsLoadingConsequences] = useState(false);
  
  // Animated header words
  const [currentWordIndex, setCurrentWordIndex] = useState(0);
  const [isWordTransitioning, setIsWordTransitioning] = useState(false);
  const animatedWords = ['growth', 'innovation', 'R&D', 'investment', 'productivity'];

  const handleStateChange = (updates: Partial<ComparisonState>) => {
    setState(prev => ({ ...prev, ...updates }));
  };

  // Function to fetch consequences from OpenAI API
  const fetchConsequences = useCallback(async (deltaData: {
    region1: string;
    region2: string;
    percentDifference: number;
    leader: string;
  }) => {
    if (!deltaData) return;

    setIsLoadingConsequences(true);
    try {
      const response = await fetch('/api/consequences', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          indicator: state.indicator,
          region1: deltaData.region1,
          region2: deltaData.region2,
          percentageDifference: deltaData.percentDifference,
          timeHorizon: state.horizon,
          scenario: state.scenario,
          leader: deltaData.leader
        }),
      });

      if (response.ok) {
        const data = await response.json();
        console.log('API Response:', data); // Debug logging
        setConsequences({ content: data.content });
      } else {
        console.error('Failed to fetch consequences:', response.statusText);
        // Keep existing static content on error
      }
    } catch (error) {
      console.error('Error fetching consequences:', error);
      // Keep existing static content on error
    } finally {
      setIsLoadingConsequences(false);
    }
  }, [state.indicator, state.horizon, state.scenario]);

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

  // Fetch consequences when delta data changes
  useEffect(() => {
    if (deltaData && deltaData.percentDifference > 1) { // Only fetch for meaningful differences
      fetchConsequences(deltaData);
    } else {
      setConsequences(null); // Clear consequences for small differences
    }
  }, [deltaData, fetchConsequences]);

  // Animated header word cycling
  useEffect(() => {
    const interval = setInterval(() => {
      setIsWordTransitioning(true);
      
      setTimeout(() => {
        setCurrentWordIndex((prev) => (prev + 1) % animatedWords.length);
        setIsWordTransitioning(false);
      }, 300); // Half the transition time
      
    }, 3000); // Change word every 3 seconds

    return () => clearInterval(interval);
  }, [animatedWords.length]);

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div className="py-8">
        <h1 className="text-3xl font-bold text-text-primary">
          Compare Europe&apos;s{' '}
          <span 
            className="inline-block bg-purple-500 text-white px-4 py-1 rounded-lg"
            style={{ width: '193px' }} // Fixed width to fit "productivity" and "innovation" comfortably
          >
            <span 
              className={`block text-center transition-all duration-600 ease-in-out ${
                isWordTransitioning ? 'opacity-0 transform -translate-y-2' : 'opacity-100 transform translate-y-0'
              }`}
            >
              {animatedWords[currentWordIndex]}
            </span>
          </span>
          {' '}trajectory with major peers and see how small differences compound over 10-50 years
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
                      ? 'border-purple-400 bg-purple-100 shadow-lg shadow-purple-200/50 transform scale-[1.02]'
                      : 'border-border-medium bg-background-secondary hover:border-purple-300 hover:bg-purple-50'
                  }`}
                >
                  <div className="text-xl mb-1">
                    {indicator.icon}
                  </div>
                  <div className={`font-semibold text-xs ${
                    state.indicator === indicator.id ? 'text-purple-700' : 'text-text-primary'
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
              🇪🇺 Compare the EU with:
            </label>
            
            {/* EU Baseline + Other Regions in Grid */}
            <div className="grid grid-cols-2 gap-2">
              {/* EU Always Selected */}
              <div className="p-3 bg-blue-50 border-2 border-blue-400 rounded-lg shadow-sm">
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 rounded-full bg-blue-500 flex items-center justify-center">
                    <span className="text-white text-xs">✓</span>
                  </div>
                  <span className="text-xs mr-1">🇪🇺</span>
                  <span className="font-semibold text-xs text-blue-700">EU</span>
                  <span className="text-xs text-blue-600/70 ml-auto">Base</span>
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
                    className={`p-3 rounded-lg border-2 transition-all duration-200 ${
                      isSelected
                        ? 'shadow-sm'
                        : 'border-border-medium bg-background-secondary hover:border-gray-400'
                    }`}
                    style={{
                      borderColor: isSelected ? region.color : undefined,
                      backgroundColor: isSelected ? `${region.color}15` : undefined
                    }}
                  >
                    <div className="flex items-center gap-2">
                      <div className={`w-4 h-4 rounded-full flex items-center justify-center`} style={{ backgroundColor: region.color }}>
                        {isSelected && <span className="text-white text-xs">✓</span>}
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
                    className={`p-4 rounded-lg border-2 transition-all duration-200 text-center ${
                      state.horizon === horizon.value
                        ? 'border-purple-400 bg-purple-100 shadow-lg shadow-purple-200/50 transform scale-[1.02] text-purple-700 font-semibold'
                        : 'border-border-medium bg-background-secondary text-text-secondary hover:border-purple-300 hover:bg-purple-50'
                    }`}
                  >
                    <div className="font-semibold text-base">{horizon.label}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* Growth Scenario Section */}
            <div className="mt-8">
              <h2 className="text-lg font-semibold text-text-primary mb-6 flex items-center">
                🇪🇺 EU Growth Scenario
              </h2>
              
              {/* Current Status Display - Large and Centered */}
              <div className="text-center mb-4">
                <div 
                  className={`inline-flex items-center justify-center px-8 py-4 rounded-xl font-bold text-3xl min-w-[120px] ${
                    state.scenario > 0 
                      ? 'bg-green-500 text-white' 
                      : state.scenario < 0 
                        ? 'bg-red-500 text-white'
                        : 'bg-gray-500 text-white'
                  }`}
                >
                  {state.scenario > 0 ? '+' : ''}{state.scenario.toFixed(1)}%
                </div>
              </div>

              {/* Increment/Decrement Controls - Smaller, underneath */}
              <div className="flex justify-center gap-4 mb-4">
                <button
                  onClick={() => handleStateChange({ scenario: Math.max(state.scenario - 0.5, -3.0) })}
                  className="flex items-center justify-center gap-1 px-3 py-2 rounded-lg border border-red-300 bg-red-50 hover:bg-red-100 transition-all duration-200 text-red-700 font-semibold text-sm"
                  disabled={state.scenario <= -3.0}
                >
                  <span className="text-base">−</span>
                  <span className="text-xs">0.5%</span>
                </button>
                
                <button
                  onClick={() => handleStateChange({ scenario: Math.min(state.scenario + 0.5, 3.0) })}
                  className="flex items-center justify-center gap-1 px-3 py-2 rounded-lg border border-green-300 bg-green-50 hover:bg-green-100 transition-all duration-200 text-green-700 font-semibold text-sm"
                  disabled={state.scenario >= 3.0}
                >
                  <span className="text-base">+</span>
                  <span className="text-xs">0.5%</span>
                </button>
              </div>

              {/* Reset to Baseline */}
              <div className="text-center">
                <button
                  onClick={() => handleStateChange({ scenario: 0 })}
                  className="inline-flex items-center justify-center px-8 py-2 rounded-lg border border-gray-300 bg-gray-50 hover:bg-gray-100 transition-all duration-200 text-gray-700 text-sm min-w-[120px]"
                  disabled={state.scenario === 0}
                >
                  Reset to Baseline (0%)
                </button>
              </div>

              {/* Explanatory Text */}
              <div className="mt-4 text-xs text-text-tertiary leading-relaxed">
                <p>Adjust EU growth by ±0.5% increments. Positive values represent accelerated growth through innovation, policy improvements, or favorable conditions. Negative values represent slower growth due to structural challenges.</p>
              </div>
            </div>
          </div>



        </div>
      </div>

      {/* Delta Results - Full Width Below Chart */}
      {deltaData && (
        <div className="bg-gradient-to-br from-chart-eu/5 to-chart-eu/10 rounded-xl border border-chart-eu/20 p-6 mb-8">
          {/* Left-aligned Header Question */}
          <div className="mt-4 mb-8">
            <div className="text-2xl font-bold text-text-primary text-left">
              What would it mean if, in {2024 + state.horizon}, {deltaData.leader === 'European Union' ? 'the EU' : 
                deltaData.leader === 'United States' ? 'the USA' : 
                deltaData.leader === 'China' ? 'China' : 
                deltaData.leader === 'BRICS' ? 'BRICS' : deltaData.leader} {deltaData.leader === 'BRICS' ? 'are' : 'is'} ahead of {(deltaData.leader === deltaData.region1 ? deltaData.region2 : deltaData.region1) === 'European Union' ? 'the EU' : 
                (deltaData.leader === deltaData.region1 ? deltaData.region2 : deltaData.region1) === 'United States' ? 'the USA' : 
                (deltaData.leader === deltaData.region1 ? deltaData.region2 : deltaData.region1) === 'China' ? 'China' : 
                (deltaData.leader === deltaData.region1 ? deltaData.region2 : deltaData.region1) === 'BRICS' ? 'BRICS' : (deltaData.leader === deltaData.region1 ? deltaData.region2 : deltaData.region1)} by <span className="bg-purple-500 text-white px-3 py-2 rounded text-2xl font-bold">{Math.round(deltaData.percentDifference * 10) / 10}%</span> in <span className="bg-purple-500 text-white px-3 py-2 rounded text-2xl font-bold">{state.indicator === 'NY.GDP.PCAP.PP.KD' ? 'GDP per capita' : state.indicator === 'GB.XPD.RSDV.GD.ZS' ? 'R&D spending' : state.indicator === 'NY.GDP.MKTP.KD.ZG' ? 'GDP growth' : state.indicator === 'NE.GDI.TOTL.ZS' ? 'investment rates' : 'productivity'}</span>?
            </div>
          </div>

          {/* Full-width Analysis Content */}
          <div className="text-base text-text-secondary leading-relaxed">
                {isLoadingConsequences ? (
                  <div className="flex items-center gap-3">
                    <div className="w-5 h-5 border-2 border-chart-eu border-t-transparent rounded-full animate-spin"></div>
                    <span>Analyzing real-world implications...</span>
                  </div>
                ) : consequences?.content ? (
                  <div className="prose prose-gray max-w-none">
                    {consequences.content.split('\n').map((line, index) => {
                      if (line.startsWith('# ')) {
                        return <h2 key={index} className="text-xl font-bold text-text-primary mt-8 mb-4 first:mt-0">{line.replace('# ', '')}</h2>;
                      } else if (line.startsWith('## ')) {
                        return <h3 key={index} className="text-lg font-semibold text-text-primary mt-6 mb-3 first:mt-0">{line.replace('## ', '')}</h3>;
                      } else if (line.startsWith('### ')) {
                        return <h4 key={index} className="text-base font-semibold text-text-primary mt-4 mb-2 first:mt-0">{line.replace('### ', '')}</h4>;
                      } else if (line.startsWith('• ')) {
                        return (
                          <div key={index} className="ml-4 mb-2">
                            <span className="text-purple-500 mr-2">•</span>
                            <span className="text-text-secondary">{line.replace('• ', '')}</span>
                          </div>
                        );
                      } else if (line.trim() === '') {
                        return <div key={index} className="h-2"></div>;
                      } else {
                        return <p key={index} className="mb-3 text-text-secondary">{line}</p>;
                      }
                    })}
                  </div>
                ) : (
                  // Fallback to static content
                  <p>
                    Economic differences of this magnitude create meaningful real-world impacts. Over the {state.horizon}-year timeframe, 
                    this {Math.round(deltaData.percentDifference * 10) / 10}% gap in {state.indicator === 'NY.GDP.PCAP.PP.KD' ? 'GDP per capita' : 
                    state.indicator === 'GB.XPD.RSDV.GD.ZS' ? 'R&D spending' : 
                    state.indicator === 'NY.GDP.MKTP.KD.ZG' ? 'GDP growth' : 
                    state.indicator === 'NE.GDI.TOTL.ZS' ? 'investment rates' : 'productivity'} would compound to affect 
                    living standards, competitiveness, and long-term economic prospects.
                  </p>
                )}
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