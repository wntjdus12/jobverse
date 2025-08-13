const mongoose = require('mongoose');

let conn;
async function connectMongo() {
  if (!conn) {
    conn = mongoose.connect(process.env.MONGO_URI, {
      maxPoolSize: 10,
    });
  }
  return conn;
}

// --- Schemas ---
const SessionSchema = new mongoose.Schema(
  {
    userName: { type: String, index: true, required: true }, // 표시용 이름
    userId:   { type: mongoose.Schema.Types.ObjectId, ref: 'User', index: true }, // 로그인 유저 _id
    userEmail:{ type: String, index: true }, // 보조키(선택)
    jobRole:  { type: String, required: true },
    status:   { type: String, enum: ['ongoing','ended'], default: 'ongoing' },
    startedAt:{ type: Date, default: Date.now },
    endedAt:  { type: Date }
  },
  { timestamps: true }
);

const MessageSchema = new mongoose.Schema(
  {
    sessionId:       { type: mongoose.Schema.Types.ObjectId, ref: 'Session', index: true },
    userName:        { type: String, index: true },
    userId:          { type: mongoose.Schema.Types.ObjectId, ref: 'User', index: true },
    userEmail:       { type: String, index: true },
    speaker:         { type: String, enum: ['interviewer','user'], required: true },
    interviewerRole: { type: String },
    turn:            { type: Number, index: true },
    text:            { type: String, required: true }
  },
  { timestamps: true }
);

// 자주 쓰는 쿼리 최적화(선택)
MessageSchema.index({ sessionId: 1, speaker: 1, createdAt: 1 });
MessageSchema.index({ sessionId: 1, turn: 1 });

const ReportSchema = new mongoose.Schema(
  {
    sessionId:       { type: mongoose.Schema.Types.ObjectId, ref: 'Session', unique: true },
    summary:         String,
    strengths:       [String],
    improvements:    [String],
    recommendations: [String]
  },
  { timestamps: true }
);

// --- Models ---
const Session = mongoose.models.Session || mongoose.model('Session', SessionSchema);
const Message = mongoose.models.Message || mongoose.model('Message', MessageSchema);
const Report  = mongoose.models.Report  || mongoose.model('Report',  ReportSchema);

module.exports = { connectMongo, Session, Message, Report };
