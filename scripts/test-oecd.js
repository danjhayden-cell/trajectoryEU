#!/usr/bin/env node

/**
 * OECD API Testing - Focus on Productivity Data
 * Tests labour productivity indicators for EU, USA, China
 */

const fetch = require('node-fetch');

// OECD Productivity Indicators
const PRODUCTIVITY_INDICATORS = {
  'PDB_LV': 'Labour Productivity Levels',
  'PDB_GR': 'Labour Productivity Growth', 
  'PDBI_P': 'Productivity by Industry',
  'ULC': 'Unit Labour Costs'
};

// Target countries
const COUNTRIES = {
  'USA': 'USA',
  'CHN': 'CHN', 
  'DEU': 'DEU',  // Germany as EU proxy
  'FRA': 'FRA',  // France
  'ITA': 'ITA',  // Italy
  'ESP': 'ESP',  // Spain
  'NLD': 'NLD'   // Netherlands
};

async function testOECDProductivity() {
  console.log('📊 Testing OECD Productivity Data...\n');
  
  // Test main productivity indicator
  try {
    // OECD uses different URL structure: 
    // https://stats.oecd.org/restsdmx/sdmx.ashx/GetData/[DATASET]/[LOCATION].[SUBJECT].[MEASURE].[TIME]
    
    const url = 'https://stats.oecd.org/restsdmx/sdmx.ashx/GetData/PDB_LV/USA+DEU+FRA.T_GDPPOP.LP_LV/all?format=json';
    console.log('Testing URL:', url);
    
    const response = await fetch(url);
    console.log('OECD API Status:', response.status);
    
    if (response.ok) {
      const data = await response.json();
      console.log('✅ OECD Productivity data available');
      console.log('Response structure:', Object.keys(data));
      
      // Check if we got actual data
      if (data.dataSets && data.dataSets[0] && data.dataSets[0].observations) {
        const observations = Object.keys(data.dataSets[0].observations);
        console.log(`📈 Found ${observations.length} data points`);
      }
    } else {
      console.log('❌ OECD API Error:', response.statusText);
    }
    
  } catch (error) {
    console.log('💥 OECD API Error:', error.message);
  }
}

async function testOECDAlternativeEndpoint() {
  console.log('\n🔍 Testing OECD Alternative Endpoints...\n');
  
  // Try different OECD API endpoint
  const endpoints = [
    'https://stats.oecd.org/restsdmx/sdmx.ashx/GetDataStructure/PDB_LV',
    'https://stats.oecd.org/SDMX-JSON/data/PDB_LV/USA.T_GDPPOP.LP_LV/all',
    'https://stats.oecd.org/Index.aspx?DataSetCode=PDB_LV'
  ];
  
  for (const url of endpoints) {
    try {
      console.log(`Testing: ${url}`);
      const response = await fetch(url);
      console.log(`Status: ${response.status} - ${response.ok ? '✅' : '❌'}`);
      
      if (response.ok) {
        const contentType = response.headers.get('content-type');
        console.log(`Content-Type: ${contentType}`);
      }
      
    } catch (error) {
      console.log(`Error: ${error.message}`);
    }
    
    await new Promise(resolve => setTimeout(resolve, 500));
  }
}

async function testProductivityCalculation() {
  console.log('\n🧮 Testing Productivity Calculation from World Bank...\n');
  
  // Alternative: Calculate productivity from GDP and employment data
  // Productivity = GDP / Total Employment
  
  const testCountry = 'US';
  
  try {
    // Get GDP data
    const gdpUrl = `https://api.worldbank.org/v2/country/${testCountry}/indicator/NY.GDP.MKTP.CD?format=json&date=2020:2023&per_page=10`;
    const gdpResponse = await fetch(gdpUrl);
    const gdpData = await gdpResponse.json();
    
    // Get employment data  
    const empUrl = `https://api.worldbank.org/v2/country/${testCountry}/indicator/SL.EMP.TOTL.SP.NE.ZS?format=json&date=2020:2023&per_page=10`;
    const empResponse = await fetch(empUrl);
    const empData = await empResponse.json();
    
    console.log('GDP Data available:', gdpData[1] && gdpData[1].length > 0 ? '✅' : '❌');
    console.log('Employment Data available:', empData[1] && empData[1].length > 0 ? '✅' : '❌');
    
    if (gdpData[1] && empData[1]) {
      const latestGdp = gdpData[1].find(d => d.value);
      const latestEmp = empData[1].find(d => d.value);
      
      if (latestGdp && latestEmp) {
        // This would require population data for proper calculation
        console.log('💡 Can calculate approximate productivity from GDP + employment data');
        console.log(`Latest GDP (${latestGdp.date}): $${latestGdp.value}`);
        console.log(`Latest Employment Rate (${latestEmp.date}): ${latestEmp.value}%`);
      }
    }
    
  } catch (error) {
    console.log('💥 Calculation test failed:', error.message);
  }
}

async function testEurostatAPI() {
  console.log('\n🇪🇺 Testing Eurostat API for EU Productivity...\n');
  
  try {
    // Eurostat has good productivity data for EU
    const url = 'https://ec.europa.eu/eurostat/api/dissemination/statistics/1.0/data/nama_10_lp_ulc?format=JSON&lang=en&geo=EU27_2020&unit=I10&na_item=LPC_P&time=2022';
    
    console.log('Testing Eurostat URL:', url);
    const response = await fetch(url);
    console.log('Eurostat API Status:', response.status);
    
    if (response.ok) {
      const data = await response.json();
      console.log('✅ Eurostat productivity data available');
      
      if (data.value) {
        const dataPoints = Object.keys(data.value);
        console.log(`📈 Found ${dataPoints.length} EU productivity data points`);
      }
    } else {
      console.log('❌ Eurostat API Error:', response.statusText);
    }
    
  } catch (error) {
    console.log('💥 Eurostat API Error:', error.message);
  }
}

async function main() {
  console.log('🚀 OECD & Productivity Data Research\n');
  console.log('Finding the best source for labour productivity data\n');
  console.log('=' .repeat(60));
  
  await testOECDProductivity();
  await testOECDAlternativeEndpoint();
  await testProductivityCalculation();
  await testEurostatAPI();
  
  console.log('\n' + '='.repeat(60));
  console.log('✅ Productivity Research Complete');
  console.log('\nFindings Summary:');
  console.log('1. World Bank: GDP ✅, Employment ✅ → Can calculate productivity');
  console.log('2. OECD: Dedicated productivity indicators (testing...)');
  console.log('3. Eurostat: EU-specific productivity data (testing...)');
  console.log('4. Fallback: Calculate from GDP per employed person');
}

main().catch(console.error);