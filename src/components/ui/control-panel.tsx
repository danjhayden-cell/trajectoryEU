'use client';

import { ChevronDown } from 'lucide-react';
import type { ComparisonState } from '../trajectory-compare';
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import { indicators, regions } from '../../../lib/sample-data';

interface ControlPanelProps {
  state: ComparisonState;
  onChange: (updates: Partial<ComparisonState>) => void;
}

// Map sample data to the format expected by the component
const mappedIndicators = [
  { id: 'NY.GDP.PCAP.PP.KD', name: 'GDP per Capita (PPP)', unit: 'USD' },
  { id: 'NY.GDP.MKTP.KD.ZG', name: 'Real GDP Growth', unit: '%' },
  { id: 'GB.XPD.RSDV.GD.ZS', name: 'R&D Expenditure', unit: '% of GDP' },
  { id: 'NE.GDI.TOTL.ZS', name: 'Capital Formation', unit: '% of GDP' },
  { id: 'labor_productivity', name: 'Labor Productivity', unit: 'Index' },
];

const mappedRegions = regions.map(region => ({
  id: region.id,
  name: region.name,
  color: `bg-[${region.color}]`
}));

const horizons = [5, 10, 20, 50];

export function ControlPanel({ state, onChange }: ControlPanelProps) {
  const handleRegionToggle = (regionId: string) => {
    const newRegions = state.regions.includes(regionId)
      ? state.regions.filter(r => r !== regionId)
      : [...state.regions, regionId];
    onChange({ regions: newRegions });
  };

  return (
    <div className="space-y-8">
      {/* Indicator Selection */}
      <div>
        <label className="block text-base font-semibold text-text-primary mb-3">
          Economic Indicator
        </label>
        <div className="relative">
          <select
            value={state.indicator}
            onChange={(e) => onChange({ indicator: e.target.value })}
            className="w-full appearance-none bg-background-secondary border border-border-medium rounded-lg px-4 py-4 text-base text-text-primary focus:outline-none focus:ring-2 focus:ring-chart-eu focus:border-transparent transition-colors"
            aria-describedby="indicator-help"
          >
            {mappedIndicators.map(indicator => (
              <option key={indicator.id} value={indicator.id}>
                {indicator.name}
              </option>
            ))}
          </select>
          <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-text-tertiary pointer-events-none" />
          <div id="indicator-help" className="sr-only">
            Select the economic indicator to analyze and compare across regions
          </div>
        </div>
      </div>

      {/* Region Selection */}
      <div>
        <label className="block text-base font-semibold text-text-primary mb-3">
          Regions to Compare
        </label>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {mappedRegions.map(region => (
            <button
              key={region.id}
              onClick={() => handleRegionToggle(region.id)}
              className={`flex items-center space-x-3 p-4 rounded-lg border transition-all ${
                state.regions.includes(region.id)
                  ? 'border-chart-eu bg-chart-eu/10 text-text-primary'
                  : 'border-border-medium bg-background-secondary text-text-secondary hover:bg-background-tertiary'
              }`}
            >
              <div 
                className={`w-3 h-3 rounded-full ${
                  state.regions.includes(region.id) ? 'opacity-100' : 'opacity-40'
                }`}
                style={{ backgroundColor: regions.find(r => r.id === region.id)?.color }}
              ></div>
              <span className="text-base font-medium">{region.name}</span>
            </button>
          ))}
        </div>
        {state.regions.length > 6 && (
          <p className="mt-3 text-sm text-yellow-600">
            Warning: Too many regions selected. Chart may be difficult to read.
          </p>
        )}
      </div>

      {/* Time Controls */}
      <div className="grid sm:grid-cols-2 gap-8">
        {/* Start Year */}
        <div>
          <label className="block text-base font-semibold text-text-primary mb-3">
            Start Year
          </label>
          <input
            type="number"
            min="1990"
            max="2020"
            value={state.startYear}
            onChange={(e) => onChange({ startYear: parseInt(e.target.value) })}
            className="w-full bg-background-secondary border border-border-medium rounded-lg px-4 py-4 text-base text-text-primary focus:outline-none focus:ring-2 focus:ring-chart-eu focus:border-transparent transition-colors"
          />
        </div>

        {/* Horizon Buttons */}
        <div>
          <label className="block text-base font-semibold text-text-primary mb-3">
            Time Horizon
          </label>
          <div className="flex space-x-3">
            {horizons.map(horizon => (
              <button
                key={horizon}
                onClick={() => onChange({ horizon })}
                className={`flex-1 py-4 px-4 rounded-lg font-semibold text-base transition-all ${
                  state.horizon === horizon
                    ? 'bg-chart-eu text-white'
                    : 'bg-background-secondary text-text-secondary hover:bg-background-tertiary border border-border-medium'
                }`}
              >
                {horizon}y
              </button>
            ))}
          </div>
        </div>
      </div>


      {/* Display Options */}
      <div className="flex items-center justify-between pt-6 border-t border-border-light">
        <div className="flex items-center space-x-4">
          <label className="flex items-center space-x-3 cursor-pointer">
            <input
              type="checkbox"
              checked={state.indexNormalized}
              onChange={(e) => onChange({ indexNormalized: e.target.checked })}
              className="rounded border-border-medium text-chart-eu focus:ring-chart-eu"
            />
            <span className="text-base text-text-tertiary">Index to 100 at start year</span>
          </label>
        </div>
        
        <div className="text-sm text-text-tertiary">
          {state.regions.length} regions • {state.horizon} year horizon
        </div>
      </div>
    </div>
  );
}