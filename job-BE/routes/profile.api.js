const express = require('express');
const router = express.Router();
const authController = require('../controllers/auth.controller');
const profileController = require('../controllers/profile.controller');


//프로필 생성 또는 수정
router.post("/", authController.authenticate, profileController.upsertProfile);

//로그인한 사용자의 프로필 조회 ( 로그인된 사용자만 프로필 생성/수정 해야 해 )
router.get("/me", authController.authenticate, profileController.getMyProfile);


module.exports = router;
