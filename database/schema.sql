-- SQLite Schema for World Bank API Caching
-- Simple, efficient local database for trajectory data

-- Regions (simple 3-region setup)
CREATE TABLE IF NOT EXISTS regions (
  id TEXT PRIMARY KEY,            -- 'EUU', 'USA', 'CHN'
  name TEXT NOT NULL,             -- 'European Union', 'United States', 'China'  
  world_bank_code TEXT,           -- API country code
  color TEXT,                     -- Chart color
  created_at INTEGER DEFAULT (unixepoch())
);

-- Indicators with World Bank codes
CREATE TABLE IF NOT EXISTS indicators (
  id TEXT PRIMARY KEY,            -- 'NY.GDP.PCAP.PP.KD' (World Bank code)
  internal_id TEXT UNIQUE,        -- 'gdp_per_capita' (our internal naming)
  name TEXT NOT NULL,             -- 'GDP per Capita (PPP)'
  unit TEXT,                      -- 'USD', '%'
  description TEXT,
  category TEXT,                  -- 'economic'
  world_bank_indicator TEXT,      -- Same as id for World Bank indicators
  calculation_method TEXT,        -- 'direct' or 'calculated'
  calculation_formula TEXT,       -- For productivity calculation
  created_at INTEGER DEFAULT (unixepoch())
);

-- Simple data points table
CREATE TABLE IF NOT EXISTS data_points (
  region_id TEXT NOT NULL,
  indicator_id TEXT NOT NULL,
  year INTEGER NOT NULL,
  value REAL,                     -- SQLite REAL for decimal numbers
  source_api TEXT DEFAULT 'worldbank',
  fetched_at INTEGER DEFAULT (unixepoch()),
  updated_at INTEGER DEFAULT (unixepoch()),
  
  PRIMARY KEY (region_id, indicator_id, year),
  FOREIGN KEY (region_id) REFERENCES regions(id),
  FOREIGN KEY (indicator_id) REFERENCES indicators(id)
);

-- Indexes for fast queries (SQLite style)
CREATE INDEX IF NOT EXISTS idx_data_points_region_indicator ON data_points(region_id, indicator_id);
CREATE INDEX IF NOT EXISTS idx_data_points_year ON data_points(year);
CREATE INDEX IF NOT EXISTS idx_data_points_updated ON data_points(updated_at);

-- API fetch log for monitoring and cache management
CREATE TABLE IF NOT EXISTS api_fetch_log (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  indicator_id TEXT,
  region_id TEXT, 
  fetch_date TEXT DEFAULT (date('now')),     -- SQLite date format
  records_fetched INTEGER,
  api_status INTEGER,
  response_time_ms INTEGER,
  error_message TEXT,
  created_at INTEGER DEFAULT (unixepoch())
);

-- Indexes for fetch log
CREATE INDEX IF NOT EXISTS idx_fetch_log_date ON api_fetch_log(fetch_date);
CREATE INDEX IF NOT EXISTS idx_fetch_log_indicator ON api_fetch_log(indicator_id, region_id);

-- Cache metadata table for smart cache invalidation
CREATE TABLE IF NOT EXISTS cache_metadata (
  cache_key TEXT PRIMARY KEY,     -- 'EUU-NY.GDP.PCAP.PP.KD'
  last_fetch INTEGER,             -- Unix timestamp
  cache_expires INTEGER,          -- Unix timestamp when cache expires
  record_count INTEGER,           -- Number of records in cache
  is_valid INTEGER DEFAULT 1     -- 1 = valid, 0 = needs refresh
);