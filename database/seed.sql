-- Seed data for simplified 3-region trajectory app

-- Insert regions (using our research findings)
INSERT INTO regions (id, name, world_bank_code, color) VALUES
('EUU', 'European Union', 'EUU', '#3B82F6'),  -- Blue
('USA', 'United States', 'US', '#EF4444'),    -- Red  
('CHN', 'China', 'CN', '#F59E0B');             -- Amber

-- Insert indicators (World Bank codes + calculated productivity)
INSERT INTO indicators (
  id, 
  internal_id, 
  name, 
  unit, 
  description, 
  category,
  world_bank_indicator,
  calculation_method
) VALUES
(
  'NY.GDP.PCAP.PP.KD',
  'gdp_per_capita', 
  'GDP per Capita (PPP)',
  'USD',
  'Gross domestic product per capita adjusted for purchasing power parity',
  'economic',
  'NY.GDP.PCAP.PP.KD',
  'direct'
),
(
  'NY.GDP.MKTP.KD.ZG',
  'real_gdp_growth',
  'Real GDP Growth', 
  '%',
  'Annual percentage growth rate of GDP at constant prices',
  'economic',
  'NY.GDP.MKTP.KD.ZG', 
  'direct'
),
(
  'GB.XPD.RSDV.GD.ZS',
  'rd_expenditure',
  'R&D Expenditure',
  '% of GDP', 
  'Research and development expenditure as percentage of GDP',
  'economic',
  'GB.XPD.RSDV.GD.ZS',
  'direct'
),
(
  'NE.GDI.TOTL.ZS',
  'capital_formation',
  'Capital Formation',
  '% of GDP',
  'Gross capital formation as percentage of GDP', 
  'economic',
  'NE.GDI.TOTL.ZS',
  'direct'
),
(
  'labor_productivity',
  'labor_productivity', 
  'Labor Productivity',
  'USD per employed person',
  'GDP per capita divided by employment rate (GDP per employed person)',
  'economic',
  'calculated',
  'calculated'
);

-- Note: No initial data points - these will be fetched from World Bank API
-- The ETL process will populate the data_points table