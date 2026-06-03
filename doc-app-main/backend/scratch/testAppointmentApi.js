const http = require('http');

function request(method, path, body, token) {
  return new Promise((resolve, reject) => {
    const data = body ? JSON.stringify(body) : '';
    const opts = {
      hostname: '127.0.0.1',
      port: 5000,
      path,
      method,
      headers: {
        'Content-Type': 'application/json',
        ...(data ? { 'Content-Length': Buffer.byteLength(data) } : {}),
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
    };
    const req = http.request(opts, (res) => {
      let buf = '';
      res.on('data', (c) => { buf += c; });
      res.on('end', () => resolve({ status: res.statusCode, body: buf }));
    });
    req.on('error', reject);
    if (data) req.write(data);
    req.end();
  });
}

(async () => {
  const signup = await request('POST', '/api/auth/signup', {
    email: `test${Date.now()}@test.com`,
    password: 'test12345',
    name: 'Test',
    phone: '9999999999',
    dob: '1990-01-01',
    gender: 'male',
  });
  const auth = JSON.parse(signup.body);
  const token = auth.accessToken;
  if (!token) {
    console.log('AUTH FAIL', signup.status, signup.body);
    process.exit(1);
  }
  const apt = await request('POST', '/api/appointments', {
    date: '2026-06-20',
    startTime: '14:30',
    endTime: '15:00',
    reason: 'test booking visit',
  }, token);
  console.log('APPOINTMENT', apt.status, apt.body.slice(0, 200));
})();
