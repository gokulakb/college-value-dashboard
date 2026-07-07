const http = require('http');
const querystring = require('querystring');

// First login to get session
const loginData = querystring.stringify({
  email: 'officer@iitb.edu',
  password: 'demo123'
});

const loginOptions = {
  hostname: 'localhost',
  port: 10000,
  path: '/api/auth/login',
  method: 'POST',
  headers: {
    'Content-Type': 'application/x-www-form-urlencoded',
    'Content-Length': Buffer.byteLength(loginData)
  }
};

let sessionCookie = '';

const loginReq = http.request(loginOptions, (res) => {
  // Get session cookie
  const cookies = res.headers['set-cookie'];
  if (cookies) {
    sessionCookie = cookies[0].split(';')[0];
    console.log('✅ Session cookie received');
  }
  
  let data = '';
  res.on('data', (chunk) => { data += chunk; });
  res.on('end', () => {
    console.log('Login response:', data);
    
    // Now test college overview endpoint
    const overviewOptions = {
      hostname: 'localhost',
      port: 10000,
      path: '/api/college/overview',
      method: 'GET',
      headers: {
        'Cookie': sessionCookie
      }
    };
    
    console.log('\n🔍 Testing college overview...');
    const overviewReq = http.request(overviewOptions, (res2) => {
      let data2 = '';
      res2.on('data', (chunk) => { data2 += chunk; });
      res2.on('end', () => {
        console.log('Overview response status:', res2.statusCode);
        console.log('Overview data:', data2);
        
        try {
          const json = JSON.parse(data2);
          if (json.success) {
            console.log('✅ College overview loaded successfully!');
            console.log('College:', json.data.collegeName);
            console.log('Total Students:', json.data.totalStudents);
            console.log('Placement Rate:', json.data.placementRate + '%');
          } else {
            console.log('❌ Error:', json.error);
          }
        } catch (e) {
          console.error('❌ Error parsing response:', e);
        }
      });
    });
    
    overviewReq.on('error', (e) => {
      console.error('❌ Overview request error:', e);
    });
    
    overviewReq.end();
  });
});

loginReq.on('error', (e) => {
  console.error('❌ Login request error:', e);
});

loginReq.write(loginData);
loginReq.end();