const express = require('express');
const app = express();
const port = process.env.PORT || 3000;

app.use(express.urlencoded({ extended: true }));

// Tároló kulcsoknak (memóriában teszteléshez, később fájl/DB)
let codes = {}; // { userId: { code: 'ABC123', expires: timestamp } }

// Főoldal – Redeem Key stílus
app.get('/', (req, res) => {
  res.send(`
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Redeem Key – Unlock Content</title>
      <style>
        body {
          margin: 0;
          font-family: Arial, sans-serif;
          background: url('https://i.imgur.com/EXPLICIT_BACKGROUND.jpg') no-repeat center center fixed; /* Cseréld explicit háttérképre */
          background-size: cover;
          color: white;
          text-align: center;
          min-height: 100vh;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .overlay {
          position: absolute;
          top: 0; left: 0; right: 0; bottom: 0;
          background: rgba(0, 0, 0, 0.65); /* sötét overlay */
          z-index: 1;
        }
        .container {
          position: relative;
          z-index: 2;
          max-width: 500px;
          background: rgba(30, 30, 46, 0.85);
          padding: 40px;
          border-radius: 20px;
          box-shadow: 0 0 30px rgba(255, 105, 180, 0.4);
          backdrop-filter: blur(8px);
        }
        h1 { color: #ff69b4; margin-bottom: 10px; }
        p { font-size: 1.1em; margin: 10px 0; }
        .btn {
          display: block;
          margin: 25px auto;
          padding: 18px 50px;
          font-size: 1.4em;
          font-weight: bold;
          border: none;
          border-radius: 50px;
          cursor: pointer;
          transition: all 0.3s;
        }
        .generate { background: #ff69b4; color: white; }
        .redeem { background: #00ff9d; color: black; }
        .btn:hover { transform: scale(1.08); box-shadow: 0 0 20px rgba(255,105,180,0.6); }
        input {
          padding: 15px;
          font-size: 1.3em;
          width: 80%;
          margin: 15px 0;
          border-radius: 10px;
          border: 2px solid #444;
          background: #2a2a3a;
          color: white;
          text-align: center;
        }
        .steps {
          text-align: left;
          margin: 30px 0;
          font-size: 1.1em;
        }
        .steps li { margin: 12px 0; }
        img.teaser { max-width: 100%; border-radius: 15px; margin: 20px 0; box-shadow: 0 0 15px rgba(255,105,180,0.5); }
      </style>
    </head>
    <body>
      <div class="overlay"></div>
      <div class="container">
        <h1>Redeem Key</h1>
        <p>Get Your FREE Content!</p>

        <!-- Teaser explicit kép (cseréld saját URL-re, pl. Imgur vagy saját host) -->
        <img class="teaser" src="https://i.imgur.com/EXPLICIT_TEASER.jpg" alt="Teaser">

        <h2>Generate Your Key</h2>
        <p>Click below, follow the simple steps, and get your unique key!</p>
        <a href="/generate" class="btn generate">Generate Key</a>

        <h2>Redeem Your Key</h2>
        <form action="/redeem" method="POST">
          <input type="text" name="code" placeholder="Paste your key here..." required maxlength="8">
          <button type="submit" class="btn redeem">Redeem Key</button>
        </form>

        <div class="steps">
          <h3>Simple Steps:</h3>
          <ol>
            <li>Click Generate Key</li>
            <li>Follow the steps on the next page</li>
            <li>Copy your unique key</li>
            <li>Paste it here and Redeem!</li>
          </ol>
        </div>
      </div>
    </body>
    </html>
  `);
});

// Generate → placeholder (később BitLabs link)
app.get('/generate', (req, res) => {
  res.send(`
    <!DOCTYPE html>
    <html lang="en">
    <head><meta charset="UTF-8"><title>Generating...</title></head>
    <body style="background:#0f0f1a;color:white;text-align:center;padding:100px;">
      <h1>Generating Your Key...</h1>
      <p>Redirecting to steps – please wait...</p>
      <meta http-equiv="refresh" content="3;url=https://example.com/placeholder-steps">
      <!-- Itt lesz később: res.redirect('https://web.bitlabs.ai/?token=...&uid=...') -->
    </body>
    </html>
  `);
});

// Redeem POST
app.post('/redeem', (req, res) => {
  const code = (req.body.code || '').trim().toUpperCase();

  let valid = false;
  for (const uid in codes) {
    if (codes[uid].code === code && Date.now() < codes[uid].expires) {
      valid = true;
      delete codes[uid];
      break;
    }
  }

  if (valid) {
    res.send(`
      <div style="text-align:center;padding:100px;background:#1e1e2e;color:#00ff9d;">
        <h1 style="color:#00ff9d;">Success! 🎉</h1>
        <p>Your key is valid – content unlocked for 1 hour!</p>
        <p>Enjoy! 😏</p>
      </div>
    `);
  } else {
    res.send(`
      <div style="text-align:center;padding:100px;background:#1e1e2e;color:#ff4444;">
        <h1>Invalid Key</h1>
        <p>The key is wrong or expired. Try again!</p>
        <a href="/" style="color:#ff69b4;font-size:1.2em;">Back</a>
      </div>
    `);
  }
});

app.listen(port, '0.0.0.0', () => {
  console.log(`Server running on port ${port}`);
});
