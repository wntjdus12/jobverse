const Profile = require("../models/Profile");

exports.getMyProfile = async (req, res) => {
  try {
    const profile = await Profile.findOne({ user: req.userId });
    res.json(profile);
  } catch (error) {
    res.status(500).json({ message: "Server Error" });
  }
};

exports.upsertProfile = async (req, res) => {
  try {
    const updatedProfile = await Profile.findOneAndUpdate(
      { user: req.userId },
      { ...req.body, user: req.userId },
      { new: true, upsert: true }
    );
    res.json(updatedProfile);
  } catch (error) {
    res.status(500).json({ message: "Server Error" });
  }
};
