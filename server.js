const express = require("express");
const app = express();
const path = require("path");

// STATIKUS FÁJLOK KISZOLGÁLÁSA (Public mappa)
app.use(express.static("public"));

// JSON támogatás (ha később kell a bothoz)
app.use(express.json());

// Gyökér URL – csak egy alap válasz
app.get("/", (req, res) => {
    res.send("Key Generator Server is running!");
});

// Offerwall postback endpoint – IDE JÖNNEK A COMPLETED OFFEREK
app.post("/postback", (req, res) => {
    console.log("Postback received!", req.body);
    // Itt fogunk majd kulcsot generálni
    res.send("OK");
});

// Indítás
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log("Server running on port " + PORT);
});
