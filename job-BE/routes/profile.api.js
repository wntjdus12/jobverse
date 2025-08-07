const express = require('express');
const authController = require('../controllers/auth.controller');
const router = express.Router();

router.post("/", authController.authenticate, profileController.upsertProfile);
router.get("/me", authController.authenticate, profileController.getMyProfile);

module.exports = router