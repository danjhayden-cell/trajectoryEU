#!/usr/bin/env node

/**
 * Detailed OECD API Testing - Productivity Data
 * The OECD API uses SDMX format, let's get the correct structure
 */

const fetch = require('node-fetch');

async function testOECDProductivityDetailed() {
  console.log('🔍 Testing OECD Productivity API - Detailed\n');
  
  try {
    // Test the working endpoint that returned 200
    const url = 'https://stats.oecd.org/SDMX-JSON/data/PDB_LV/USA.T_GDPPOP.LP_LV/all';
    console.log('Testing working URL:', url);
    
    const response = await fetch(url);
    const data = await response.json();
    
    console.log('Response structure:', Object.keys(data));
    
    if (data.dataSets && data.dataSets[0]) {
      const dataset = data.dataSets[0];
      console.log('Dataset keys:', Object.keys(dataset));
      
      if (dataset.observations) {
        const observations = Object.keys(dataset.observations);
        console.log(`📊 Found ${observations.length} observations`);
        
        // Get some sample data
        const sampleObs = observations.slice(0, 3);
        sampleObs.forEach(obsKey => {
          const value = dataset.observations[obsKey];
          console.log(`Observation ${obsKey}: ${value}`);
        });
      }
      
      if (dataset.series) {
        console.log('Series data available:', Object.keys(dataset.series).length);
      }
    }
    
    // Check structure to understand dimensions
    if (data.structure) {
      console.log('\n📐 Data Structure:');
      console.log('Structure keys:', Object.keys(data.structure));
      
      if (data.structure.dimensions && data.structure.dimensions.observation) {
        console.log('Observation dimensions:', data.structure.dimensions.observation.length);
        data.structure.dimensions.observation.forEach((dim, i) => {
          console.log(`  ${i}: ${dim.id} - ${dim.name}`);
        });
      }
    }
    
  } catch (error) {
    console.log('💥 Error:', error.message);
  }
}

async function testMultipleCountries() {
  console.log('\n🌍 Testing Multiple Countries Productivity...\n');
  
  const countries = ['USA', 'DEU', 'FRA', 'CHN'];
  
  for (const country of countries) {
    try {
      const url = `https://stats.oecd.org/SDMX-JSON/data/PDB_LV/${country}.T_GDPPOP.LP_LV/all`;
      const response = await fetch(url);
      
      if (response.ok) {
        const data = await response.json();
        const obsCount = data.dataSets?.[0]?.observations ? 
          Object.keys(data.dataSets[0].observations).length : 0;
        
        console.log(`${country}: ✅ ${obsCount} data points`);
        
        // Get latest value if available
        if (obsCount > 0) {
          const observations = data.dataSets[0].observations;
          const keys = Object.keys(observations);
          const latestKey = keys[keys.length - 1];
          const latestValue = observations[latestKey];
          console.log(`  Latest value: ${latestValue}`);
        }
        
      } else {
        console.log(`${country}: ❌ Status ${response.status}`);
      }
      
    } catch (error) {
      console.log(`${country}: 💥 ${error.message}`);
    }
    
    // Rate limiting
    await new Promise(resolve => setTimeout(resolve, 300));
  }
}

async function testWorldBankProductivityCalculation() {
  console.log('\n🧮 World Bank Productivity Calculation Test...\n');
  
  // Test if we can calculate productivity reliably from World Bank data
  const countries = ['US', 'CN', 'DE'];
  
  for (const country of countries) {
    try {
      // GDP per capita (we already have this)
      const gdpPerCapUrl = `https://api.worldbank.org/v2/country/${country}/indicator/NY.GDP.PCAP.PP.KD?format=json&date=2022&per_page=1`;
      const gdpPerCapResponse = await fetch(gdpPerCapUrl);
      const gdpPerCapData = await gdpPerCapResponse.json();
      
      // Employment to population ratio
      const empRatioUrl = `https://api.worldbank.org/v2/country/${country}/indicator/SL.EMP.TOTL.SP.ZS?format=json&date=2022&per_page=1`;
      const empRatioResponse = await fetch(empRatioUrl);
      const empRatioData = await empRatioResponse.json();
      
      if (gdpPerCapData[1]?.[0]?.value && empRatioData[1]?.[0]?.value) {
        const gdpPerCap = gdpPerCapData[1][0].value;
        const empRatio = empRatioData[1][0].value / 100; // Convert percentage
        
        // Simple productivity calculation: GDP per capita / employment ratio
        const productivity = gdpPerCap / empRatio;
        
        console.log(`${country}:`);
        console.log(`  GDP per capita: $${Math.round(gdpPerCap).toLocaleString()}`);
        console.log(`  Employment ratio: ${(empRatio * 100).toFixed(1)}%`);
        console.log(`  💡 Calculated productivity: $${Math.round(productivity).toLocaleString()} per employed person`);
      } else {
        console.log(`${country}: ❌ Missing data for calculation`);
      }
      
    } catch (error) {
      console.log(`${country}: 💥 ${error.message}`);
    }
    
    await new Promise(resolve => setTimeout(resolve, 300));
  }
}

async function main() {
  console.log('🚀 Detailed OECD Productivity Research\n');
  console.log('Finding the exact API format and data structure\n');
  console.log('=' .repeat(60));
  
  await testOECDProductivityDetailed();
  await testMultipleCountries();
  await testWorldBankProductivityCalculation();
  
  console.log('\n' + '='.repeat(60));
  console.log('✅ Detailed Research Complete');
  console.log('\nRecommendation:');
  console.log('1. If OECD has good coverage → Use OECD productivity data');
  console.log('2. If gaps exist → Calculate from World Bank GDP + employment');
  console.log('3. Hybrid approach: OECD for OECD countries, calculated for others');
}

main().catch(console.error);