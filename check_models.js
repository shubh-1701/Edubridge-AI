const https = require('https');
const req = https.request('https://api.groq.com/openai/v1/models', {
  method: 'GET',
  headers: {
    'Authorization': 'Bearer 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'
  }
}, (res) => {
  let data = '';
  res.on('data', (chunk) => data += chunk);
  res.on('end', () => {
    const json = JSON.parse(data);
    const models = json.data.map(m => m.id);
    console.log("All Models:\n" + models.join('\n'));
    console.log("\nVision Models:\n" + models.filter(m => m.includes('vision') || m.includes('llava') || m.includes('scout') || m.includes('maverick')).join('\n'));
  });
});
req.end();
