const express = require("express");
const router = express.Router();
const userApi = require("./user.api");
const { model } = require("mongoose");

router.use("/user", userApi)  

module.exports = router; 