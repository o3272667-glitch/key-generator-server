const express = require('express');
const app = express();
const port = process.env.PORT || 3000;

app.use(express.urlencoded({ extended: true }));

// Teszt kulcsok (manuálisan hozzáadva teszteléshez – később BitLabs generálja)
let codes = {
  'TESTUSER': { code: 'ABC12345', expires: Date.now() + 3600 * 1000 } // teszt kulcs
};

app.get('/', (req, res) => {
  res.send(`
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Redeem Key – Unlock Now</title>
      <style>
        body {
          margin: 0;
          font-family: Arial, sans-serif;
          background: url('https://media.giphy.com/media/3ov9k1173PdfJWRsoE/giphy.gif') no-repeat center center fixed;
          background-size: cover;
          background-attachment: fixed;
          color: white;
          text-align: center;
          min-height: 100vh;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .overlay {
          position: absolute;
          inset: 0;
          background: rgba(0, 0, 0, 0.78);
          z-index: 1;
        }
        .container {
          position: relative;
          z-index: 2;
          max-width: 480px;
          background: rgba(30, 30, 46, 0.92);
          padding: 40px 25px;
          border-radius: 20px;
          box-shadow: 0 10px 40px rgba(255, 105, 180, 0.35);
          backdrop-filter: blur(10px);
        }
        h1 {
          color: #ff69b4;
          margin: 0 0 10px;
          font-size: 2.5em;
        }
        p {
          font-size: 1.15em;
          margin: 10px 0;
        }
        .btn {
          display: block;
          margin: 25px auto;
          padding: 16px 60px;
          font-size: 1.4em;
          font-weight: bold;
          border: none;
          border-radius: 50px;
          cursor: pointer;
          transition: all 0.3s ease;
        }
        .generate {
          background: linear-gradient(135deg, #ff69b4, #ff1493);
          color: white;
        }
        .redeem {
          background: linear-gradient(135deg, #00ff9d, #00bfff);
          color: black;
        }
        .btn:hover {
          transform: scale(1.08);
          box-shadow: 0 0 25px rgba(255,105,180,0.7);
        }
        input {
          padding: 16px;
          font-size: 1.4em;
          width: 85%;
          margin: 15px 0;
          border-radius: 12px;
          border: 2px solid #555;
          background: #222;
          color: white;
          text-align: center;
        }
        .steps {
          text-align: left;
          margin: 30px 0;
          font-size: 1.1em;
        }
        .steps li {
          margin: 12px 0;
          list-style-position: inside;
        }
        .teaser {
          max-width: 100%;
          border-radius: 15px;
          margin: 20px 0;
          box-shadow: 0 5px 20px rgba(0,0,0,0.6);
        }
      </style>
    </head>
    <body>
      <div class="overlay"></div>
      <div class="container">
        <h1>Redeem Key</h1>
        <p>Get Your FREE Content Now!</p>

        <!-- Teaser / reklám kép – ha nem kell, töröld ezt a sort -->
        <img class="teaser" src="https://i.imgur.com/placeholder-teaser.jpg" alt="Exclusive Preview">

        <h2>Generate Your Key</h2>
        <p>Click below to start the simple steps and get your unique key!</p>
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
            <li>Follow the easy steps</li>
            <li>Copy your unique key</li>
            <li>Paste it here and redeem!</li>
          </ol>
        </div>
      </div>
    </body>
    </html>
  `);
});

// Generate – placeholder (később BitLabs)
app.get('/generate', (req, res) => {
  res.send(`
    <h1 style="text-align:center;padding:150px;background:#0f0f1a;color:#ff69b4;">
      Generating Your Key...
      <br><br>
      <p style="color:white;">Redirecting to steps – please wait...</p>
      <meta http-equiv="refresh" content="3;url=https://example.com/steps">
    </h1>
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
      <div style="text-align:center;padding:120px;background:#1e1e2e;color:#00ff9d;">
        <h1 style="color:#00ff9d;">Success! 🎉</h1>
        <p>Your key is valid – content unlocked!</p>
        <p>Enjoy for 1 hour 😏</p>
      </div>
    `);
  } else {
    res.send(`
      <div style="text-align:center;padding:120px;background:#1e1e2e;color:#ff4444;">
        <h1>Invalid Key</h1>
        <p>Wrong or expired. Try again!</p>
        <a href="/" style="color:#ff69b4;font-size:1.3em;">Back</a>
      </div>
    `);
  }
});

app.listen(port, '0.0.0.0', () => {
  console.log(`Server running on port ${port}`);
});
