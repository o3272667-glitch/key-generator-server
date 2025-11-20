const express = require("express");
const crypto = require("crypto");
const fs = require("fs");
const bodyParser = require("body-parser");
const cors = require("cors");

const app = express();
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(cors());

function loadKeys() {
    if (!fs.existsSync("keys.json")) return {};
    return JSON.parse(fs.readFileSync("keys.json"));
}

function saveKeys(data) {
    fs.writeFileSync("keys.json", JSON.stringify(data, null, 4));
}

function generateKey() {
    return crypto.randomBytes(16).toString("hex").toUpperCase();
}

app.post("/postback", (req, res) => {
    const data = req.body;

    if (!data.subId || !data.status || !data.signature) {
        return res.status(400).send("Missing fields");
    }

    const SECRET_KEY = "IDE ÍRD A SAJÁT SECRET KEY-t";
    const expected = crypto.createHash("md5").update(data.transId + SECRET_KEY).digest("hex");

    if (expected !== data.signature) {
        return res.status(403).send("Invalid signature");
    }

    if (data.status === "1") {
        const key = generateKey();

        const keys = loadKeys();
        keys[key] = {
            user: data.subId,
            used: false,
            date: Date.now()
        };
        saveKeys(keys);

        console.log("Generated key:", key);

        return res.send(key);
    }

    return res.send("OK");
});

app.post("/redeem", (req, res) => {
    const { key, discord_id } = req.body;

    if (!key || !discord_id) {
        return res.status(400).json({ success: false, error: "Missing fields" });
    }

    const keys = loadKeys();

    if (!keys[key]) {
        return res.json({ success: false, error: "Invalid key" });
    }
    if (keys[key].used) {
        return res.json({ success: false, error: "Already used" });
    }

    keys[key].used = true;
    keys[key].redeemed_by = discord_id;
    keys[key].redeemed_at = Date.now();
    saveKeys(keys);

    return res.json({ success: true });
});

app.listen(3000, () => {
    console.log("Server running on port 3000");
});
