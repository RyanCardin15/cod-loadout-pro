#!/usr/bin/env tsx

import { testCODArmoryConnection } from './lib/scrapers/codarmory-fetcher';
import { cache } from './lib/utils/cache';

/**
 * Test the data infrastructure components
 */
async function testInfrastructure() {
  console.log('🧪 Testing Data Infrastructure...\n');

  let allPassed = true;

  // Test 1: Cache System
  console.log('1️⃣ Testing Cache System...');
  try {
    await cache.init();
    await cache.set('test-key', { data: 'test' }, 1000);
    const result = await cache.get('test-key');

    if (result && (result as any).data === 'test') {
      console.log('   ✅ Cache: Write and read successful');
    } else {
      console.log('   ❌ Cache: Read failed');
      allPassed = false;
    }

    await cache.delete('test-key');
  } catch (error) {
    console.log('   ❌ Cache: Error -', error);
    allPassed = false;
  }

  // Test 2: CODArmory Connection
  console.log('\n2️⃣ Testing CODArmory Connection...');
  try {
    const connected = await testCODArmoryConnection();
    if (connected) {
      console.log('   ✅ CODArmory: Connection successful');
    } else {
      console.log('   ❌ CODArmory: Connection failed');
      allPassed = false;
    }
  } catch (error) {
    console.log('   ❌ CODArmory: Error -', error);
    allPassed = false;
  }

  // Test 3: Cache Statistics
  console.log('\n3️⃣ Testing Cache Statistics...');
  try {
    const stats = await cache.stats();
    console.log(`   ✅ Cache Stats: ${stats.files} files, ${(stats.size / 1024).toFixed(2)} KB`);
  } catch (error) {
    console.log('   ❌ Cache Stats: Error -', error);
    allPassed = false;
  }

  // Summary
  console.log('\n' + '='.repeat(50));
  if (allPassed) {
    console.log('✅ All tests passed! Infrastructure is ready.');
    console.log('\n💡 Next step: Run "npm run data:init" to populate database');
  } else {
    console.log('❌ Some tests failed. Check the errors above.');
  }
  console.log('='.repeat(50) + '\n');

  process.exit(allPassed ? 0 : 1);
}

testInfrastructure();
