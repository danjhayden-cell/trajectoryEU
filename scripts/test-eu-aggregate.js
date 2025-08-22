#!/usr/bin/env node

/**
 * Test EU Aggregate Data Availability
 * Check if World Bank has pre-calculated EU aggregates
 */

const fetch = require('node-fetch');

// Possible EU aggregate codes in World Bank
const EU_CODES = [
  'EUU',          // European Union
  'EMU',          // Euro area  
  'ECS',          // Europe & Central Asia
  'ECA',          // Europe & Central Asia (all income levels)
  'EU',           // European Union (might be different format)
  'EUR',          // Europe
  'XC',           // Euro area
  'XR'            // Euro area (changing composition)
];

const TEST_INDICATORS = [
  'NY.GDP.PCAP.PP.KD',  // GDP per capita
  'NY.GDP.MKTP.KD.ZG',  // GDP growth
  'GB.XPD.RSDV.GD.ZS',  // R&D expenditure
  'NE.GDI.TOTL.ZS'      // Investment
];

async function testEUAggregates() {
  console.log('🇪🇺 Testing EU Aggregate Data Availability...\n');
  
  for (const euCode of EU_CODES) {
    console.log(`\n📊 Testing EU Code: ${euCode}`);
    
    try {
      // Test with GDP per capita (most reliable indicator)
      const url = `https://api.worldbank.org/v2/country/${euCode}/indicator/NY.GDP.PCAP.PP.KD?format=json&date=2020:2023&per_page=5`;
      const response = await fetch(url);
      
      if (!response.ok) {
        console.log(`   ❌ API Error: ${response.status}`);
        continue;
      }
      
      const data = await response.json();
      
      if (!data || !data[1] || data[1].length === 0) {
        console.log(`   ⚠️  No data for ${euCode}`);
        continue;
      }
      
      const validData = data[1].filter(d => d.value !== null);
      if (validData.length === 0) {
        console.log(`   ⚠️  No valid values for ${euCode}`);
        continue;
      }
      
      // Found data! Let's examine it
      console.log(`   ✅ FOUND DATA for ${euCode}!`);
      console.log(`   Region Name: ${validData[0].country.value}`);
      
      validData.forEach(point => {
        console.log(`   ${point.date}: $${Math.round(point.value).toLocaleString()}`);
      });
      
      // Test all indicators for this EU code
      await testAllIndicators(euCode);
      
    } catch (error) {
      console.log(`   💥 Error: ${error.message}`);
    }
    
    await new Promise(resolve => setTimeout(resolve, 300));
  }
}

async function testAllIndicators(euCode) {
  console.log(`\n   🔍 Testing all indicators for ${euCode}:`);
  
  for (const indicator of TEST_INDICATORS) {
    try {
      const url = `https://api.worldbank.org/v2/country/${euCode}/indicator/${indicator}?format=json&date=2022&per_page=1`;
      const response = await fetch(url);
      const data = await response.json();
      
      if (data && data[1] && data[1][0] && data[1][0].value !== null) {
        const value = data[1][0].value;
        const name = indicator.includes('GDP.PCAP') ? 'GDP/capita' :
                     indicator.includes('GDP.MKTP') ? 'GDP growth' :
                     indicator.includes('XPD.RSDV') ? 'R&D' : 'Investment';
        console.log(`   ${name}: ${typeof value === 'number' ? value.toFixed(2) : value}`);
      } else {
        console.log(`   ${indicator}: ❌ No data`);
      }
    } catch (error) {
      console.log(`   ${indicator}: 💥 Error`);
    }
    
    await new Promise(resolve => setTimeout(resolve, 100));
  }
}

async function compareEUvsManualCalculation() {
  console.log('\n🔍 Comparing EU Aggregate vs Manual Calculation...\n');
  
  // Test both EUU and manual calculation for major EU countries
  const majorEUCountries = ['DE', 'FR', 'IT', 'ES', 'NL', 'PL'];
  
  try {
    // Get EU aggregate (if available)
    let euAggregate = null;
    const euUrl = `https://api.worldbank.org/v2/country/EUU/indicator/NY.GDP.PCAP.PP.KD?format=json&date=2022&per_page=1`;
    const euResponse = await fetch(euUrl);
    const euData = await euResponse.json();
    
    if (euData && euData[1] && euData[1][0]) {
      euAggregate = euData[1][0].value;
      console.log(`🇪🇺 EU Aggregate (World Bank): $${Math.round(euAggregate).toLocaleString()}`);
    }
    
    // Get individual country data
    const countriesStr = majorEUCountries.join(';');
    const countriesUrl = `https://api.worldbank.org/v2/country/${countriesStr}/indicator/NY.GDP.PCAP.PP.KD?format=json&date=2022&per_page=20`;
    const countriesResponse = await fetch(countriesUrl);
    const countriesData = await countriesResponse.json();
    
    if (countriesData && countriesData[1]) {
      console.log('\n🏛️  Major EU Countries (2022):');
      const validCountries = countriesData[1].filter(d => d.value !== null);
      
      validCountries.forEach(country => {
        console.log(`   ${country.country.value}: $${Math.round(country.value).toLocaleString()}`);
      });
      
      // Simple average calculation
      const values = validCountries.map(d => d.value);
      const simpleAvg = values.reduce((sum, val) => sum + val, 0) / values.length;
      console.log(`\n📊 Simple Average: $${Math.round(simpleAvg).toLocaleString()}`);
      
      if (euAggregate) {
        const difference = ((euAggregate - simpleAvg) / simpleAvg * 100);
        console.log(`🔄 Difference: ${difference.toFixed(1)}% (EU aggregate vs simple average)`);
        console.log('💡 World Bank likely uses population weighting');
      }
    }
    
  } catch (error) {
    console.log('💥 Comparison failed:', error.message);
  }
}

async function testDataCoverage() {
  console.log('\n📈 Testing EU Data Coverage Over Time...\n');
  
  try {
    const url = 'https://api.worldbank.org/v2/country/EUU/indicator/NY.GDP.PCAP.PP.KD?format=json&date=1990:2024&per_page=100';
    const response = await fetch(url);
    const data = await response.json();
    
    if (data && data[1]) {
      const validData = data[1].filter(d => d.value !== null);
      const years = validData.map(d => parseInt(d.date)).sort();
      
      console.log(`📊 EU Aggregate Coverage: ${years.length} years`);
      console.log(`📅 Range: ${Math.min(...years)} - ${Math.max(...years)}`);
      console.log(`📈 Latest: ${Math.max(...years)} ($${Math.round(validData[0].value).toLocaleString()})`);
      
      // Check for gaps
      const gaps = [];
      for (let year = Math.min(...years); year <= Math.max(...years); year++) {
        if (!years.includes(year)) {
          gaps.push(year);
        }
      }
      
      if (gaps.length > 0) {
        console.log(`⚠️  Missing years: ${gaps.join(', ')}`);
      } else {
        console.log(`✅ Complete coverage - no gaps!`);
      }
    }
    
  } catch (error) {
    console.log('💥 Coverage test failed:', error.message);
  }
}

async function main() {
  console.log('🚀 EU Aggregate Data Research\n');
  console.log('Testing if World Bank has pre-calculated EU data\n');
  console.log('=' .repeat(60));
  
  await testEUAggregates();
  await compareEUvsManualCalculation();
  await testDataCoverage();
  
  console.log('\n' + '='.repeat(60));
  console.log('✅ EU Aggregate Research Complete');
  console.log('\nDecision Matrix:');
  console.log('✅ If EU aggregate available → Use directly (much simpler!)');
  console.log('🔧 If gaps exist → Manual aggregation as fallback');
  console.log('📊 If coverage poor → Full manual aggregation');
}

main().catch(console.error);