// Simple smoke tester for payments endpoints
// Usage: node tmp/test_payments_requests.js

const base = process.env.BASE || 'http://localhost:4001/api';
const userId = '11111111-1111-1111-1111-111111111111';

async function run() {
  try {
    console.log('GET', `${base}/payments`);
    const r1 = await fetch(`${base}/payments`);
    console.log('Status:', r1.status);
    const json1 = await r1.text();
    console.log('Body:', json1);

    console.log('\nGET', `${base}/payments/user/${userId}`);
    const r2 = await fetch(`${base}/payments/user/${userId}`);
    console.log('Status:', r2.status);
    const json2 = await r2.text();
    console.log('Body:', json2);
  } catch (err) {
    console.error('Request error:', err);
    process.exitCode = 2;
  }
}

run();
