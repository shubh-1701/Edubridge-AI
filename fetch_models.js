const https = require('https');
const fs = require('fs');
const req = https.request('https://api.groq.com/openai/v1/models', {
  method: 'GET',
  headers: {
    'Authorization': 'Bearer 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'
  }
}, (res) => {
  let data = '';
  res.on('data', (chunk) => data += chunk);
  res.on('end', () => {
    fs.writeFileSync('groq_models.json', data);
  });
});
req.end();
