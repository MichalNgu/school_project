/**
 * API Test Script
 * Tests all endpoints to ensure they work correctly
 */

const http = require('http');

function makeRequest(method, path, data = null) {
    return new Promise((resolve, reject) => {
        const options = {
            hostname: 'localhost',
            port: 3000,
            path: path,
            method: method,
            headers: {
                'Content-Type': 'application/json'
            }
        };

        const req = http.request(options, (res) => {
            let responseData = '';

            res.on('data', (chunk) => {
                responseData += chunk;
            });

            res.on('end', () => {
                resolve({
                    status: res.statusCode,
                    headers: res.headers,
                    body: responseData
                });
            });
        });

        req.on('error', reject);

        if (data) {
            req.write(JSON.stringify(data));
        }
        req.end();
    });
}

async function runTests() {
    console.log('\n📋 AUDI BACKEND API TEST SUITE\n');

    try {
        // Test 1: Health Check
        console.log('1️⃣  Testing /health');
        let result = await makeRequest('GET', '/health');
        console.log(`   Status: ${result.status}`);
        console.log(`   Response: ${result.body.substring(0, 100)}...\n`);

        // Test 2: GET /api/cars
        console.log('2️⃣  Testing GET /api/cars');
        result = await makeRequest('GET', '/api/cars');
        console.log(`   Status: ${result.status}`);
        console.log(`   Response: ${result.body.substring(0, 150)}...\n`);

        // Test 3: POST /api/testdrive
        console.log('3️⃣  Testing POST /api/testdrive');
        const testdriveData = {
            name: 'Test User',
            email: 'test@example.cz',
            phone: '+420 123 456 789',
            model: 'Audi A4',
            message: 'I want to test drive'
        };
        result = await makeRequest('POST', '/api/testdrive', testdriveData);
        console.log(`   Status: ${result.status}`);
        console.log(`   Response: ${result.body}\n`);

        // Test 4: POST /api/contact
        console.log('4️⃣  Testing POST /api/contact');
        const contactData = {
            name: 'Test Contact',
            email: 'contact@example.cz',
            message: 'Hello, I have a question'
        };
        result = await makeRequest('POST', '/api/contact', contactData);
        console.log(`   Status: ${result.status}`);
        console.log(`   Response: ${result.body}\n`);

        // Test 5: POST /api/cookies
        console.log('5️⃣  Testing POST /api/cookies');
        const cookiesData = {
            allowed: true,
            sessionId: 'test-session-123'
        };
        result = await makeRequest('POST', '/api/cookies', cookiesData);
        console.log(`   Status: ${result.status}`);
        console.log(`   Response: ${result.body}\n`);

        // Test 6: GET /api/testdrive
        console.log('6️⃣  Testing GET /api/testdrive');
        result = await makeRequest('GET', '/api/testdrive');
        console.log(`   Status: ${result.status}`);
        const body = JSON.parse(result.body);
        console.log(`   Count: ${body.count}`);
        console.log(`   Sample: ${JSON.stringify(body.data[0], null, 2).substring(0, 150)}...\n`);

        // Test 7: GET /api/contact
        console.log('7️⃣  Testing GET /api/contact');
        result = await makeRequest('GET', '/api/contact');
        console.log(`   Status: ${result.status}`);
        const contactBody = JSON.parse(result.body);
        console.log(`   Count: ${contactBody.count}\n`);

        // Test 8: GET /api/analytics
        console.log('8️⃣  Testing GET /api/analytics');
        result = await makeRequest('GET', '/api/analytics');
        console.log(`   Status: ${result.status}`);
        console.log(`   Response: ${result.body}\n`);

        console.log('✅ All tests completed!\n');

    } catch (error) {
        console.error('❌ Test failed:', error.message);
    }
}

runTests();
