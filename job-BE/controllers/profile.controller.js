const Profile = require("../models/Profile");
const multer = require('multer');
const { GridFsStorage } = require('multer-gridfs-storage');
const mongoose = require('mongoose');

// MongoDB 연결 객체를 가져옵니다.
const conn = mongoose.connection;

// GridFS Storage 엔진을 설정합니다.
// multer가 이 스토리지 엔진을 사용하여 파일을 MongoDB에 저장합니다.
const storage = new GridFsStorage({
  db: conn,
  file: (req, file) => {
    return {
      filename: `photo-${Date.now()}-${file.originalname}`,
      bucketName: 'profile_photos' // 파일을 저장할 버킷(컬렉션) 이름
    };
  }
});

// multer 미들웨어 설정
const upload = multer({ storage });

const profileController = {};

// ✅ 사진을 업로드하는 새로운 컨트롤러 함수
// 이 함수는 multer 미들웨어를 사용하여 파일을 처리합니다.
profileController.uploadPhoto = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: '사진이 첨부되지 않았습니다.' });
    }
    // 업로드가 성공하면 파일 ID를 응답으로 보냅니다.
    res.status(200).json({ fileId: req.file.id, filename: req.file.filename });
  } catch (error) {
    console.error('사진 업로드 실패:', error);
    res.status(500).json({ message: '사진 업로드 중 오류 발생' });
  }
};

profileController.upsertProfile = async (req, res) => {
  try {
    const userId = req.userId;

    const profileData = {
      ...req.body,
      user: userId
    };

    const updatedProfile = await Profile.findOneAndUpdate(
      { user: userId },
      profileData,
      { new: true, upsert: true, setDefaultsOnInsert: true }
    );
    res.status(200).json(updatedProfile);
  } catch (error) {
    console.error('프로필 저장 실패:', error);
    res.status(500).json({ message: '프로필 저장 중 오류 발생' });
  }
};

profileController.getMyProfile = async (req, res) => {
  try {
    const userId = req.userId;
    const profile = await Profile.findOne({ user: userId });

    if (!profile) {
      return res.status(404).json({ message: '프로필이 존재하지 않습니다.' });
    }
    res.status(200).json(profile);
  } catch (error) {
    console.error('프로필 조회 실패:', error);
    res.status(500).json({ message: '프로필 조회 중 오류 발생' });
  }
};


module.exports = {
  profileController,
  upload
};
