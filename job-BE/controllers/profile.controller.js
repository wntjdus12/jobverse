const Profile = require("../models/Profile");

const profileController = {}

profileController.upsertProfile = async ( req, res ) => {
  try { 
    const userId = req.userId;

    const profileData = {
      ...req.body,
      user : userId
    }

    const updatedProfile = await Profile.findOneAndUpdate(
      {user: userId},
      profileData,
      { new: true , upsert: true, setDefaultsOnInsert: true}
    );
    res.status(200).json(updatedProfile)
  } catch (error) {
    console.error('프로필 저장 실패:', error);
    res.status(500).json({message: '프로필 저장 중 오류 발생'})
  }
};

profileController.getMyProfile = async (req, res) => {
  try {
    const userId = req.userId;

    const profile = await Profile.findOne({ user: userId });

    if (!profile) {
      return res.status(404).json({ message: '프로필이 존재하지 않습니다.'})
    }

    res.status(200).json(profile);

  }catch (error) {
    console.error('프로필 조회 실패:', error)
    res.status(500).json({ message: '프로필 조회 중 오류 발생'});
  }
}


module.exports = profileController

