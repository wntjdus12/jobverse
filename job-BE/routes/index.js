const express = require("express");
const router = express.Router();
const userApi = require("./user.api");
const { model } = require("mongoose");
const profileApi = require("./profile.api");

router.use("/user", userApi);
router.use("/profile", profileApi);

module.exports = router;