const express = require('express');
const crypto = require('crypto');
const { v4: uuidv4 } = require('uuid');

const app = express();
const port = process.env.PORT || 3000;

app.use(express.static('.')); // offerwall.html serve-hez, ha van

// BitLabs kulcsok env-ből
const BITLABS_TOKEN = process.env.BITLABS_TOKEN;
const BITLABS_SECRET = process.env.BITLABS_SECRET;

if (!BITLABS_TOKEN || !BITLABS_SECRET) {
  console.error('BITLABS_TOKEN vagy BITLABS_SECRET hiányzik az environment variables-ből!');
}

// Offerwall oldal (iframe)
app.get('/offer', (req, res) => {
  const userId = req.query.user || 'test';
  const wallUrl = `https://web.bitlabs.ai/?token=${BITLABS_TOKEN}&uid=${userId}`;

  res.send(`
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <title>Complete Offers</title>
    </head>
    <body style="margin:0; font-family:Arial; text-align:center; padding:20px;">
      <h1>Complete Offers to Get Your Key</h1>
      <p>Finish easy tasks below, then you'll get a code for Discord.</p>
      <iframe src="${wallUrl}" style="width:100%; height:800px; border:none;"></iframe>
    </body>
    </html>
  `);
});

// BitLabs callback (postback)
app.get('/bitlabs-callback', (req, res) => {
  const params = req.query;
  const receivedHash = params.hash || '';

  // Hash validálás
  delete params.hash;
  const sorted = Object.keys(params).sort().map(k => `${k}=${params[k]}`).join('&');
  const computed = crypto.createHmac('sha1', BITLABS_SECRET)
    .update(sorted)
    .digest('hex');

  if (computed.toLowerCase() !== receivedHash.toLowerCase()) {
    console.log('Invalid hash');
    return res.status(403).send('Invalid');
  }

  const userId = params.uid || params.UID;
  const val = parseFloat(params.val || 0);

  if (val > 0 && userId) {
    const code = uuidv4().slice(0, 8).toUpperCase();
    console.log(`Key generated for ${userId}: ${code} (val: ${val})`);
    // Itt később DB-be mentés, most csak log + success redirect
    res.redirect(`/success?code=${code}`);
  } else {
    res.send('OK');
  }
});

// Success oldal
app.get('/success', (req, res) => {
  const code = req.query.code || 'ERROR';
  res.send(`
    <h1>Your Code: ${code}</h1>
    <p>Use in Discord: !verify ${code}</p>
    <p>Valid for 1 hour.</p>
  `);
});

// Alap route (teszt)
app.get('/', (req, res) => {
  res.send('Server is running. Go to /offer?user=yourid');
});

app.listen(port, '0.0.0.0', () => {
  console.log(`Server started on port ${port}`);
});
