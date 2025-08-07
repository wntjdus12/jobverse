const Profile = require("../models/Profile");

const profileController = {}



profileController.upsertProfile = async (req, res) => {
    try {
        const userId = req.userId;

        const profileData = {
            ...req.body,
            user: userId,
        }
    } catch (error) {

    }
}

module.exports = profileController