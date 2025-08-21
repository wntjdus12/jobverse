const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const profileSchema = Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true,
        unique: true,
    },
    nickname: {type: String},
    email: {type: String},
    phone: {type: String},
    intro: {type: String},
    photo: {type: String},
    jobTitle: {type: String}, // ✅ 희망 직무 필드 추가
    education: [
        {
            level: {type: String},
            status: {type: String},
            school: {type: String},
            major: {type: String},
        },
    ],
    activities: [
        {
            title: {type: String},
            content: {type: String},
        },
    ],
    awards: [
        {
            title: {type: String},
            content: {type: String},
        },
    ],
    certificates: [{type: String}],    
}, {timestamps: true});

const Profile = mongoose.model("Profile", profileSchema)

module.exports = Profile;
