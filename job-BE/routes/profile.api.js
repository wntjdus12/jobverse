const express = require('express');
const router = express.Router();
const profileController = require('../controllers/profile.controller');
const authController = require('../controllers/auth.controller');

router.post("/", authController.authenticate, profileController.upsertProfile);



module.exports = router;
