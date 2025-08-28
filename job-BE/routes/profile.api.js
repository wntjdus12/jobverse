const express = require('express');
const router = express.Router();
const authController = require('../controllers/auth.controller');
// multer 미들웨어와 profileController를 함께 가져옵니다.
const { profileController, upload } = require('../controllers/profile.controller');


// ✅ 프로필 생성 또는 수정
// 경로를 "/"로 수정하여 최종 경로가 "/api/profile"이 되도록 만듭니다.
router.post("/", authController.authenticate, profileController.upsertProfile);

// ✅ 로그인한 사용자의 프로필 조회
router.get("/me", authController.authenticate, profileController.getMyProfile);

// ✅ 프로필 사진 업로드
// POST 요청을 "/photo" 경로로 받도록 수정합니다.
router.post("/photo", authController.authenticate, upload.single('file'), profileController.uploadPhoto);


module.exports = router;
