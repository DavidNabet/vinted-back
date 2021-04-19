const express = require("express");
const formidable = require("express-formidable");
const mongoose = require("mongoose");
const cors = require("cors");
require("dotenv").config();
const app = express();
const cloudinary = require("cloudinary").v2;

app.use(formidable());
app.use(cors());

mongoose.connect(process.env.MONGO_LOCAL_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  useFindAndModify: false,
  useCreateIndex: true,
});

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Importer les routes
app.use("/user", require("./routes/user"));
app.use(require("./routes/offer"));

app.get("/", (req, res) => {
  res.json("Welcome to Vinted API !");
});

app.all("*", (req, res) => {
  res.status(404).json({ error: "Cette route n'existe pas." });
});

app.listen(process.env.PORT, () => {
  console.log("Server Started");
});
