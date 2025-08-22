// Shared type definitions for data layer

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