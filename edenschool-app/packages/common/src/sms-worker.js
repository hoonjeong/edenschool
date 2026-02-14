// Standalone SMS sender - runs outside Next.js runtime
const http = require('http');

const [,, sUserid, authKey, sendMsg, destNum, callNum, sType] = process.argv;

const params = new URLSearchParams({ sUserid, authKey, sendMsg, destNum, callNum, sMode: 'Real', sType });
const data = params.toString();

const req = http.request({
  hostname: 'www.sms9.co.kr',
  path: '/authSendApi/authSendApi_UTF8.php',
  method: 'POST',
  headers: {
    'Content-Type': 'application/x-www-form-urlencoded',
    'Content-Length': Buffer.byteLength(data),
  },
}, (res) => {
  let body = '';
  res.on('data', (chunk) => body += chunk);
  res.on('end', () => {
    process.stdout.write(body);
    process.exit(0);
  });
});

req.on('error', (e) => {
  process.stderr.write(e.message);
  process.exit(1);
});

req.write(data);
req.end();
