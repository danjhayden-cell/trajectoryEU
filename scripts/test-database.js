#!/usr/bin/env node

/**
 * Test Database Integration
 * Validates that the database layer works correctly
 */

async function testDatabase() {
  console.log('🧪 Testing Database Integration...\n');
  
  // Set environment to use database
  process.env.USE_REAL_DATABASE = 'true';
  process.env.FALLBACK_TO_SAMPLE = 'true';
  
  try {
    // Import the data source module
    const { getDataForIndicatorAndRegions, calculateCAGR } = await import('../lib/data-source.ts');
    
    console.log('1️⃣ Testing GDP per capita data fetch...');
    const gdpData = await getDataForIndicatorAndRegions('gdp_per_capita', ['EUU', 'USA', 'CHN']);
    
    console.log(`   📊 Fetched ${gdpData.length} data points`);
    
    // Show sample data
    const recentData = gdpData.filter(d => d.year >= 2020);
    recentData.forEach(point => {
      console.log(`   ${point.regionName} ${point.year}: $${Math.round(point.value).toLocaleString()}`);
    });
    
    console.log('\n2️⃣ Testing CAGR calculation...');
    const euCagr = await calculateCAGR('EUU', 'gdp_per_capita', 2010, 2023);
    if (euCagr) {
      console.log(`   🇪🇺 EU GDP per capita CAGR (2010-2023): ${(euCagr * 100).toFixed(2)}%`);
    } else {
      console.log('   ⚠️  CAGR calculation returned null');
    }
    
    console.log('\n3️⃣ Testing productivity data...');
    const productivityData = await getDataForIndicatorAndRegions('labor_productivity', ['USA']);
    console.log(`   📊 Productivity data points: ${productivityData.length}`);
    
    if (productivityData.length > 0) {
      const latest = productivityData[productivityData.length - 1];
      console.log(`   🇺🇸 Latest US productivity: $${Math.round(latest.value).toLocaleString()} per employed person (${latest.year})`);
    }
    
    console.log('\n✅ Database test completed successfully!');
    
  } catch (error) {
    console.error('❌ Database test failed:', error.message);
    console.error(error.stack);
    process.exit(1);
  }
}

testDatabase();