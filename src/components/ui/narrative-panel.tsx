'use client';

import { useState, useEffect } from 'react';
import { AlertTriangle } from 'lucide-react';
import type { ComparisonState } from '../trajectory-compare';

interface NarrativePanelProps {
  state: ComparisonState;
}

// Mock narrative generation - in real app this would call LLM API
const generateNarrative = (state: ComparisonState): string => {
  const scenarioText = state.scenario === 0 ? 'baseline growth trends continue' :
                      state.scenario > 0 ? `growth increases by ${state.scenario} percentage points annually` :
                      `growth decreases by ${Math.abs(state.scenario)} percentage points annually`;

  const regionText = state.regions.length === 2 && state.regions.includes('EUU') && state.regions.includes('USA') 
    ? 'between the EU and US' 
    : `across ${state.regions.join(', ')}`;

  return `Over the next ${state.horizon} years, if ${scenarioText}, the economic trajectories ${regionText} would diverge significantly due to the power of compound growth.

**Household Impact:** A sustained ${Math.abs(state.scenario)}% difference in annual growth could translate to 15-25% variation in average household purchasing power by ${2024 + state.horizon}, affecting everything from housing affordability to discretionary spending.

**Public Services:** Government revenues would vary proportionally, potentially affecting infrastructure investment, healthcare capacity, and education funding by tens of billions in aggregate across the projection period.

**Innovation & Capital:** Different growth trajectories influence venture capital availability, R&D budgets, and startup ecosystem development, with faster-growing regions attracting more international investment and talent.

**Why this could differ:** Demographic changes, technological disruptions, trade policy shifts, climate impacts, or measurement methodology changes could significantly alter these projections.`;
};

export function NarrativePanel({ state }: NarrativePanelProps) {
  const [narrative, setNarrative] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    setIsLoading(true);
    
    // Simulate API call delay
    const timer = setTimeout(() => {
      const generatedNarrative = generateNarrative(state);
      setNarrative(generatedNarrative);
      setIsLoading(false);
    }, 1000);

    return () => clearTimeout(timer);
  }, [state]);

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="animate-pulse">
          <div className="h-4 bg-background-tertiary rounded mb-2"></div>
          <div className="h-4 bg-background-tertiary rounded mb-2 w-5/6"></div>
          <div className="h-4 bg-background-tertiary rounded mb-4 w-4/6"></div>
          <div className="space-y-2">
            <div className="h-3 bg-background-tertiary rounded w-3/4"></div>
            <div className="h-3 bg-background-tertiary rounded w-5/6"></div>
            <div className="h-3 bg-background-tertiary rounded w-4/6"></div>
          </div>
        </div>
        <p className="text-xs text-text-tertiary text-center">Generating analysis...</p>
      </div>
    );
  }

  const sections = narrative.split('\n\n');
  const mainText = sections[0];
  const bulletPoints = sections.slice(1, -1);
  const disclaimer = sections[sections.length - 1];

  return (
    <div className="space-y-4">
      {/* Main Analysis */}
      <div className="prose prose-sm prose-slate max-w-none">
        <p className="text-text-secondary leading-relaxed">{mainText}</p>
      </div>

      {/* Key Impact Areas */}
      <div className="space-y-3">
        {bulletPoints.map((point, index) => {
          const [title, ...content] = point.split(': ');
          return (
            <div key={index} className="p-3 bg-background-secondary rounded-lg">
              <h4 className="font-medium text-text-primary text-sm mb-1">
                {title.replace('**', '').replace('**', '')}
              </h4>
              <p className="text-xs text-text-secondary leading-relaxed">
                {content.join(': ')}
              </p>
            </div>
          );
        })}
      </div>

      {/* Uncertainty Disclaimer */}
      <div className="flex items-start space-x-2 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
        <AlertTriangle className="h-4 w-4 text-yellow-600 mt-0.5 flex-shrink-0" />
        <div>
          <p className="text-xs text-yellow-800 font-medium mb-1">Important Caveat</p>
          <p className="text-xs text-yellow-700 leading-relaxed">
            {disclaimer.replace('**Why this could differ:** ', '')}
          </p>
        </div>
      </div>

      {/* Methodology Note */}
      <div className="text-xs text-text-tertiary text-center pt-2 border-t border-border-light">
        <p>
          <strong>Illustrative projection</strong> • Constant-rate assumption • Not a forecast
        </p>
      </div>
    </div>
  );
}