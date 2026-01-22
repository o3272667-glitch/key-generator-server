const express = require('express');
const app = express();
const port = process.env.PORT || 3000;

app.use(express.static('public')); // Ha van public mappa CSS/JS-knek
app.use(express.urlencoded({ extended: true })); // Form adatokhoz

// Tároló (memóriában, később fájlba)
let codes = {}; // { userId: { code: 'ABC123', expires: timestamp } }

// Főoldal – Generate & Redeem gombok
app.get('/', (req, res) => {
  res.send(`
    <!DOCTYPE html>
    <html lang="hu">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Key Mate – Unlock Content</title>
      <style>
        body { font-family: Arial, sans-serif; background:#0f0f1a; color:white; text-align:center; padding:20px; margin:0; }
        h1 { color:#ff69b4; }
        .container { max-width:500px; margin:auto; background:#1e1e2e; padding:30px; border-radius:15px; box-shadow:0 0 20px rgba(255,105,180,0.3); }
        .btn { display:block; margin:20px auto; padding:15px 40px; font-size:1.3em; border:none; border-radius:50px; cursor:pointer; transition:0.3s; }
        .generate { background:#ff69b4; color:white; }
        .redeem { background:#00ff9d; color:black; }
        .btn:hover { transform:scale(1.05); }
        input { padding:12px; font-size:1.2em; width:80%; margin:10px 0; border-radius:8px; border:1px solid #444; background:#2a2a3a; color:white; }
        .steps { text-align:left; margin:20px 0; }
        .steps li { margin:10px 0; font-size:1.1em; }
        img { max-width:100%; border-radius:10px; margin:20px 0; }
      </style>
    </head>
    <body>
      <div class="container">
        <h1>Key Mate ♥</h1>
        <p>Get Your FREE Content!</p>

        <img src="https://i.imgur.com/placeholder-nsfw-teaser.jpg" alt="Teaser" /> <!-- Cseréld saját képre -->

        <h2>Generate Key</h2>
        <p>Kattints a gombra, kövesd a lépéseket, és kapsz egyedi kulcsot!</p>
        <a href="/generate" class="btn generate">Generate Key</a>

        <h2>Redeem Your Key</h2>
        <form action="/redeem" method="POST">
          <input type="text" name="code" placeholder="Írd be a kulcsodat itt..." required>
          <button type="submit" class="btn redeem">Redeem Key</button>
        </form>

        <div class="steps">
          <h3>Lépések:</h3>
          <ol>
            <li>Kattints Generate Key-re</li>
            <li>Kövesd a lépéseket</li>
            <li>Másold ki a kulcsot</li>
            <li>Írd be ide és Redeem!</li>
          </ol>
        </div>
      </div>
    </body>
    </html>
  `);
});

// Generate → átirányít offerwall-ra (most placeholder, később BitLabs)
app.get('/generate', (req, res) => {
  // Ha BitLabs approved, ide tedd a redirect-et:
  // res.redirect('https://web.bitlabs.ai/?token=...&uid=' + req.query.user);
  res.send(`
    <h1>Generating Key...</h1>
    <p>Átirányítás folyamatban... Kövesd a lépéseket!</p>
    <meta http-equiv="refresh" content="3;url=https://example.com/placeholder-offerwall">
    <!-- Ide tedd később a valódi offerwall linket -->
  `);
});

// Redeem POST (kulcs ellenőrzés)
app.post('/redeem', (req, res) => {
  const code = req.body.code.trim().toUpperCase();
  let valid = false;
  let userIdFound = null;

  for (const uid in codes) {
    if (codes[uid].code === code && Date.now() < codes[uid].expires) {
      valid = true;
      userIdFound = uid;
      delete codes[uid]; // egyszer használatos
      break;
    }
  }

  if (valid) {
    res.send(`
      <div style="text-align:center; padding:50px; background:#1e1e2e; color:#00ff9d;">
        <h1 style="color:#00ff9d;">Sikeres! 🎉</h1>
        <p>A kulcs elfogadva – rangod aktív 1 órára!</p>
        <p>Élvezd a contentet! 😏</p>
      </div>
    `);
  } else {
    res.send(`
      <div style="text-align:center; padding:50px; background:#1e1e2e; color:#ff4444;">
        <h1>Hiba</h1>
        <p>Érvénytelen vagy lejárt kulcs. Próbáld újra!</p>
        <a href="/" style="color:#ff69b4;">Vissza</a>
      </div>
    `);
  }
});

app.listen(port, '0.0.0.0', () => {
  console.log(`Server running on port ${port}`);
});
