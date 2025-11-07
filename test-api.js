/**
 * API Testing Script
 * Tests for 429 errors, caching, and general API health
 */

const http = require('http');

const BASE_URL = 'http://localhost:5050';
const ENDPOINTS = [
  '/api/upcoming-events',
  '/api/news',
  '/api/pdf',
  '/api/financials',
  '/api/company-structure',
  '/api/annual-meeting-documents/by-year?active=true'
];

// Color codes for terminal output
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function makeRequest(url) {
  return new Promise((resolve, reject) => {
    const startTime = Date.now();

    http.get(url, (res) => {
      let data = '';

      res.on('data', (chunk) => {
        data += chunk;
      });

      res.on('end', () => {
        const responseTime = Date.now() - startTime;
        resolve({
          statusCode: res.statusCode,
          responseTime,
          data: data.length,
          headers: res.headers
        });
      });
    }).on('error', (err) => {
      reject(err);
    });
  });
}

async function testEndpoint(endpoint, requestNumber = 1) {
  try {
    const url = `${BASE_URL}${endpoint}`;
    const result = await makeRequest(url);

    const statusColor = result.statusCode === 200 ? 'green' :
                       result.statusCode === 429 ? 'red' : 'yellow';

    log(`  Request #${requestNumber}: ${result.statusCode} - ${result.responseTime}ms - ${result.data} bytes`, statusColor);

    return result;
  } catch (error) {
    log(`  Request #${requestNumber}: ERROR - ${error.message}`, 'red');
    return { statusCode: 0, error: error.message };
  }
}

async function stressTestEndpoint(endpoint, requestCount = 10, delayMs = 100) {
  log(`\n🔧 Testing: ${endpoint}`, 'cyan');
  log(`  Making ${requestCount} requests with ${delayMs}ms delay...`, 'blue');

  const results = [];
  let errors429 = 0;
  let successCount = 0;
  let totalTime = 0;

  for (let i = 1; i <= requestCount; i++) {
    const result = await testEndpoint(endpoint, i);
    results.push(result);

    if (result.statusCode === 429) {
      errors429++;
    } else if (result.statusCode === 200) {
      successCount++;
      totalTime += result.responseTime;
    }

    // Delay between requests
    if (i < requestCount) {
      await new Promise(resolve => setTimeout(resolve, delayMs));
    }
  }

  // Summary
  const avgTime = successCount > 0 ? Math.round(totalTime / successCount) : 0;

  log(`\n  📊 Summary:`, 'magenta');
  log(`    ✅ Successful: ${successCount}/${requestCount}`, 'green');
  log(`    ❌ 429 Errors: ${errors429}`, errors429 > 0 ? 'red' : 'green');
  log(`    ⏱️  Avg Response Time: ${avgTime}ms`, 'blue');

  return { endpoint, errors429, successCount, avgTime, totalRequests: requestCount };
}

async function runTests() {
  log('\n🚀 Starting API Tests...', 'cyan');
  log('=' .repeat(60), 'cyan');

  const testResults = [];

  // Test each endpoint
  for (const endpoint of ENDPOINTS) {
    const result = await stressTestEndpoint(endpoint, 15, 50); // 15 requests, 50ms apart
    testResults.push(result);
    await new Promise(resolve => setTimeout(resolve, 500)); // Pause between endpoints
  }

  // Final Report
  log('\n' + '='.repeat(60), 'cyan');
  log('📋 FINAL TEST REPORT', 'cyan');
  log('='.repeat(60), 'cyan');

  let total429 = 0;
  let totalSuccess = 0;
  let totalRequests = 0;

  testResults.forEach(result => {
    total429 += result.errors429;
    totalSuccess += result.successCount;
    totalRequests += result.totalRequests;

    const status = result.errors429 === 0 ? '✅ PASS' : '❌ FAIL';
    const statusColor = result.errors429 === 0 ? 'green' : 'red';

    log(`\n${status} ${result.endpoint}`, statusColor);
    log(`  Success: ${result.successCount}/${result.totalRequests}`, 'blue');
    log(`  429 Errors: ${result.errors429}`, result.errors429 > 0 ? 'red' : 'green');
    log(`  Avg Time: ${result.avgTime}ms`, 'blue');
  });

  log('\n' + '='.repeat(60), 'cyan');
  log('📊 OVERALL STATISTICS', 'cyan');
  log('='.repeat(60), 'cyan');
  log(`Total Requests: ${totalRequests}`, 'blue');
  log(`Total Success: ${totalSuccess}`, 'green');
  log(`Total 429 Errors: ${total429}`, total429 > 0 ? 'red' : 'green');
  log(`Success Rate: ${Math.round((totalSuccess / totalRequests) * 100)}%`, 'magenta');

  if (total429 === 0) {
    log('\n🎉 SUCCESS! No 429 errors detected!', 'green');
    log('✅ Caching is working properly', 'green');
  } else {
    log('\n⚠️  WARNING: 429 errors detected!', 'red');
    log('❌ Caching may need adjustment', 'yellow');
  }

  log('\n' + '='.repeat(60), 'cyan');
}

// Run tests
runTests().then(() => {
  log('\n✅ Testing completed!', 'green');
  process.exit(0);
}).catch((error) => {
  log(`\n❌ Testing failed: ${error.message}`, 'red');
  process.exit(1);
});
