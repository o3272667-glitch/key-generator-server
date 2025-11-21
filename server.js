const express = require("express");
const app = express();
const path = require("path");

app.use(express.static("public"));

app.use(express.json());

app.get("/", (req, res) => {
    res.send("Key Generator Server is running!");
});

app.post("/postback", (req, res) => {
    console.log("Postback received!", req.body);
    
    res.send("OK");
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log("Server running on port " + PORT);
});
