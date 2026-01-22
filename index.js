const express = require('express');
const crypto = require('crypto'); // Hash validáláshoz
const { v4: uuidv4 } = require('uuid'); // Ha nincs, add package.json dependencies-hez: "uuid": "^9.0.0"
const app = express();
const port = process.env.PORT || 3000;

app.use(express.json()); // Ha POST kell
app.use(express.static('.')); // Serve static fájlok, pl. offerwall.html

// BitLabs kulcsok env-ből (Render Environment Variables-ben add hozzá!)
const BITLABS_TOKEN = process.env.BITLABS_TOKEN || '4ec9d06d-c1fd-4758-aab2-d0bd5fd64ca8';
const BITLABS_SECRET = process.env.BITLABS_SECRET || 'your-secret-from-dashboard';

// Egyszerű in-memory storage key-knek (prod-ban Redis vagy file/DB jobb)
const codes = {}; // { userId: { code: 'ABC123', expires: timestamp } }

// Offerwall oldal (iframe BitLabs wall-lal)
app.get('/offer', (req, res) => {
  const userId = req.query.user || 'test'; // Discord ID átadva ?user=...
  if (!userId) return res.status(400).send('No user ID');

  const wallUrl = `https://web.bitlabs.ai/?token=${BITLABS_TOKEN}&uid=${userId}`;
  res.send(`
    <!DOCTYPE html>
    <html>
    <head><title>Complete Offer</title></head>
    <body style="font-family: Arial; text-align:center; padding:20px;">
      <h1>Complete Offers to Get Your Key</h1>
      <p>Finish tasks, then get your unique code for Discord role.</p>
      <iframe src="${wallUrl}" style="width:100%; height:800px; border:none;"></iframe>
    </body>
    </html>
  `);
});

// BitLabs postback / reward callback (GET, params: uid, val, tx, hash, stb.)
app.get('/bitlabs-callback', (req, res) => {
  const params = req.query;
  const receivedHash = params.hash || '';
  delete params.hash; // Tisztítás

  // Sorted query string validálás (BitLabs HMAC-SHA1)
  const sortedParams = Object.keys(params).sort().map(k => `${k}=${params[k]}`).join('&');
  const computedHash = crypto.createHmac('sha1', BITLABS_SECRET)
    .update(sortedParams)
    .digest('hex');

  if (computedHash.toLowerCase() !== receivedHash.toLowerCase()) {
    console.log('Invalid signature');
    return res.status(403).send('Invalid');
  }

  const userId = params.uid || params.UID;
  const val = parseFloat(params.val || 0);
  const tx = params.tx;

  if (val > 0) { // Csak pozitív reward esetén generál key-t
    const code = uuidv4().slice(0, 8).toUpperCase(); // Pl. A1B2C3D4
    const expires = Date.now() + 3600 * 1000; // 1 óra
    codes[userId] = { code, expires };

    console.log(`Key generated for ${userId}: ${code}`);
    // Opcionális: redirect usernek success oldalra, vagy küldj Discord webhook-kal
    res.redirect(`/success?code=${code}&user=${userId}`);
  } else {
    res.send('OK'); // $0 callback-ekre is OK
  }
});

// Success oldal a key-vel
app.get('/success', (req, res) => {
  const code = req.query.code;
  res.send(`
    <h1>Your Key: ${code || 'Error'}</h1>
    <p>Copy this and use !verify ${code || ''} in Discord. Valid for 1 hour.</p>
  `);
});

// Offerwall.html serve (ha statikusan akarod)
app.get('/', (req, res) => {
  res.sendFile(__dirname + '/offerwall.html');
});

app.listen(port, '0.0.0.0', () => {
  console.log(`Server running on port ${port}`);
});
