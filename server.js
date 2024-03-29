require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const connection = require("./db/conn");
const cookieParser = require("cookie-parser");
const cors = require("cors");
const port = process.env.PORT || 5000;
// const port = 5000;
const stripe = require("stripe")(process.env.SECRET_KEY);
const path = require("path");

const app = express();

app.use(
  cors({
    origin: process.env.FRONT_END_URL,
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "HEAD", "OPTIONS"],
    allowedHeaders: [
      "Content-Type",
      "Origin",
      "X-Requested-With",
      "Accept",
      "x-client-key",
      "x-client-token",
      "x-client-secret",
      "Authorization",
    ],
    credentials: true,
  })
);

// app.use(cors({
//     origin : "*"
// }))
app.use(express.json()); // data json ke form me deta
app.use(cookieParser());
// mongoose  connection
connection();
// routes
app.use("/api", require("./Router/Routes"));
app.use("/", express.static(path.join("./public/build")));

app.listen(port, function () {
  console.log(`server is running on ${port}`);
});
