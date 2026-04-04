const https = require('https');

const data = JSON.stringify({
  contents: [{
    parts: [{
      text: "안녕"
    }]
  }]
});

const options = {
  hostname: 'generativelanguage.googleapis.com',
  path: '/v1beta/models/gemini-1.5-flash-latest:generateContent?key=AIzaSyBTKDtIvroEL3d5kMWdvBvVYN-1YFb9QKM',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Content-Length': data.length
  }
};

const req = https.request(options, (res) => {
  let body = '';
  res.on('data', (d) => body += d);
  res.on('end', () => {
    console.log(`STATUS: ${res.statusCode}`);
    console.log(`BODY: ${body}`);
  });
});

req.on('error', (e) => {
  console.error(e);
});

req.write(data);
req.end();
