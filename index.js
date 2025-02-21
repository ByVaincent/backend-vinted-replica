const express = require("express");
const app = express();
const mongoose = require("mongoose");
const cloudinary = require("cloudinary").v2;
require("dotenv").config();

app.use(express.json());

mongoose.connect(process.env.MONGODB_URI);

//routes import
const userRoute = require("./routes/user");
const offerRoute = require("./routes/offer");

// cloudinary configuration
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

app.get("/", (req, res) => {
  res.json("Hi!");
});

app.use(userRoute);

app.use(offerRoute);

app.all("*", (req, res) => {
  res.status(404).json("Not found!");
});

app.listen(process.env.PORT, () => {
  console.log("server's runnin'");
});
