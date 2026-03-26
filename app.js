if (process.env.NODE_ENV !== "production") {
  require("dotenv").config();
}

const express = require("express");
const app = express();
const mongoose = require("mongoose");

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// MongoDB Connection
const dbUrl = process.env.ATLASDB_URL || "mongodb://127.0.0.1:27017/havenpoint";

mongoose.connect(dbUrl)
.then(() => {
    console.log("Database Connected");
})
.catch((err) => {
    console.log(err);
});

// Basic Route
app.get("/", (req, res) => {
    res.send("Welcome to HavenPoint Server");
});

// Server
app.listen(3000, () => {
    console.log("Server running on port 3000");
});