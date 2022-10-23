require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const connection = require("./db/conn");
const cookieParser = require("cookie-parser");

// mongoose model
const User = require("./models/userSchema");
const app = express();
app.use(express.json());    // data json ke form me deta h
app.use(cookieParser());
// mongoose  connection
connection();

// routes
app.use('/api',require("./Router/routers"));



app.listen(process.env.PORT,function(){
    console.log(`server is running on ${process.env.PORT}`);
})