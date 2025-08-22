#!/usr/bin/env node

/**
 * API Testing Script - World Bank & Energy Data
 * Tests data availability for EU, USA, China
 */

const fetch = require('node-fetch');

// Core indicators from our current app
const ECONOMIC_INDICATORS = {
  'NY.GDP.PCAP.PP.KD': 'GDP per Capita (PPP)',
  'NY.GDP.MKTP.KD.ZG': 'GDP Growth Rate', 
  'GB.XPD.RSDV.GD.ZS': 'R&D Expenditure (% of GDP)',
  'NE.GDI.TOTL.ZS': 'Gross Capital Formation (% of GDP)'
};

// Energy indicators to add
const ENERGY_INDICATORS = {
  'EG.USE.PCAP.KG.OE': 'Energy Use per Capita (kg oil equivalent)',
  'EG.ELC.RNEW.ZS': 'Renewable Electricity Output (% of total)',
  'EN.ATM.CO2E.PC': 'CO2 Emissions per Capita (metric tons)',
  'EG.IMP.CONS.ZS': 'Energy Imports (% of energy use)',
  'EG.ELC.COAL.ZS': 'Electricity from Coal (% of total)',
  'EG.ELC.NGAS.ZS': 'Electricity from Natural Gas (% of total)',
  'EG.ELC.NUCL.ZS': 'Electricity from Nuclear (% of total)',
  'EG.ELC.HYRO.ZS': 'Electricity from Hydroelectric (% of total)'
};

// Target regions - simplified for EU, USA, China
const REGIONS = {
  'USA': 'US',      
  'CHN': 'CN',      
  'EUU': ['AT','BE','BG','HR','CY','CZ','DK','EE','FI','FR','DE','GR','HU','IE','IT','LV','LT','LU','MT','NL','PL','PT','RO','SK','SI','ES','SE']
};

async function testWorldBankAPI() {
  console.log('🌍 Testing World Bank API...\n');
  
  const allIndicators = { ...ECONOMIC_INDICATORS, ...ENERGY_INDICATORS };
  
  for (const [code, name] of Object.entries(allIndicators)) {
    console.log(`📊 Testing: ${name} (${code})`);
    
    // Test for USA (simple case)
    try {
      const url = `https://api.worldbank.org/v2/country/US/indicator/${code}?format=json&date=2020:2023&per_page=10`;
      const response = await fetch(url);
      
      if (!response.ok) {
        console.log(`   ❌ API Error: ${response.status}`);
        continue;
      }
      
      const data = await response.json();
      
      if (!data || !Array.isArray(data) || data.length < 2 || !data[1]) {
        console.log(`   ⚠️  No data available`);
        continue;
      }
      
      const apiData = data[1]; // World Bank returns [metadata, data]
      const validData = apiData.filter(d => d.value !== null);
      const latestYear = validData.length > 0 ? validData[0].date : 'N/A';
      const latestValue = validData.length > 0 ? validData[0].value : 'N/A';
      
      console.log(`   ✅ Available | Latest: ${latestYear} | Value: ${latestValue}`);
      
      // Test EU aggregation complexity
      if (code === 'NY.GDP.PCAP.PP.KD') {
        console.log(`   🇪🇺 Testing EU country availability...`);
        const euCountries = REGIONS.EUU.slice(0, 5).join(';'); // Test first 5 EU countries
        const euUrl = `https://api.worldbank.org/v2/country/${euCountries}/indicator/${code}?format=json&date=2022&per_page=50`;
        const euResponse = await fetch(euUrl);
        const euData = await euResponse.json();
        
        if (euData && euData[1]) {
          const validEuData = euData[1].filter(d => d.value !== null);
          console.log(`   🇪🇺 EU Sample: ${validEuData.length}/5 countries have data`);
        }
      }
      
    } catch (error) {
      console.log(`   💥 Error: ${error.message}`);
    }
    
    // Rate limiting - be nice to the API
    await new Promise(resolve => setTimeout(resolve, 200));
  }
}

async function testIEAAPI() {
  console.log('\n⚡ Testing IEA Energy Data (if accessible)...\n');
  
  try {
    const url = 'https://api.iea.org/stats';
    const response = await fetch(url);
    console.log(`IEA API Status: ${response.status}`);
    
    if (response.status === 401) {
      console.log('🔐 IEA API requires authentication - need API key');
      console.log('💡 Will use World Bank energy indicators instead');
    }
  } catch (error) {
    console.log('🔍 IEA API not accessible, using World Bank energy data');
  }
}

async function analyzeDataCoverage() {
  console.log('\n📈 Analyzing Data Coverage...\n');
  
  // Test historical coverage for key indicator
  const testIndicator = 'NY.GDP.PCAP.PP.KD';
  const testCountries = ['US', 'CN', 'DE', 'FR']; // Representative sample
  
  for (const country of testCountries) {
    try {
      const url = `https://api.worldbank.org/v2/country/${country}/indicator/${testIndicator}?format=json&date=1990:2024&per_page=100`;
      const response = await fetch(url);
      const data = await response.json();
      
      if (data && data[1]) {
        const validData = data[1].filter(d => d.value !== null);
        const years = validData.map(d => parseInt(d.date)).sort();
        const coverage = years.length;
        const latestYear = Math.max(...years);
        const earliestYear = Math.min(...years);
        
        console.log(`🏛️  ${country}: ${coverage} years | ${earliestYear}-${latestYear} | Latest: ${latestYear}`);
      }
    } catch (error) {
      console.log(`💥 ${country}: Error - ${error.message}`);
    }
    
    await new Promise(resolve => setTimeout(resolve, 300));
  }
}

async function testEUAggregation() {
  console.log('\n🇪🇺 Testing EU Aggregation Strategy...\n');
  
  // Test GDP data for major EU countries
  const majorEUCountries = ['DE', 'FR', 'IT', 'ES', 'NL']; // Big 5 EU economies
  const testYear = '2022';
  
  try {
    const countriesStr = majorEUCountries.join(';');
    const url = `https://api.worldbank.org/v2/country/${countriesStr}/indicator/NY.GDP.PCAP.PP.KD?format=json&date=${testYear}&per_page=50`;
    const response = await fetch(url);
    const data = await response.json();
    
    if (data && data[1]) {
      console.log('🇪🇺 EU Major Economies GDP per Capita (2022):');
      data[1].forEach(point => {
        if (point.value) {
          console.log(`   ${point.country.value}: $${Math.round(point.value).toLocaleString()}`);
        }
      });
      
      // Calculate simple average (later we'll do population-weighted)
      const values = data[1].filter(d => d.value).map(d => d.value);
      const average = values.reduce((sum, val) => sum + val, 0) / values.length;
      console.log(`   📊 Simple Average: $${Math.round(average).toLocaleString()}`);
      console.log('   💡 Note: Real aggregation will use population weights');
    }
  } catch (error) {
    console.log(`💥 EU Aggregation test failed: ${error.message}`);
  }
}

async function main() {
  console.log('🚀 API Research & Testing Script\n');
  console.log('Testing data availability for EU-USA-China trajectory analysis\n');
  console.log('Focus: Economic + Energy indicators\n');
  console.log('=' .repeat(60));
  
  await testWorldBankAPI();
  await testIEAAPI(); 
  await analyzeDataCoverage();
  await testEUAggregation();
  
  console.log('\n' + '='.repeat(60));
  console.log('✅ API Testing Complete');
  console.log('\nNext Steps:');
  console.log('1. Review data availability for each indicator');
  console.log('2. Design EU population-weighted aggregation');
  console.log('3. Plan energy indicator integration');
  console.log('4. Build API fetching and caching system');
}

main().catch(console.error);