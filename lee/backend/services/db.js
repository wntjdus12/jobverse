const mongoose = require('mongoose');

let conn;
/** Mongo 연결 */
async function connectMongo() {
  if (!conn) {
    conn = mongoose.connect(process.env.MONGO_URI, {
      maxPoolSize: 10,
      autoIndex: true,
    });
  }
  return conn;
}

/* ===================== Schemas ===================== */
const SessionSchema = new mongoose.Schema(
  {
    userName:  { type: String, index: true, required: true }, // 표시용 이름
    userId:    { type: mongoose.Schema.Types.ObjectId, ref: 'User', index: true }, // 로그인 유저 _id
    userEmail: { type: String, index: true }, // 보조키(선택)
    jobRole:   { type: String, required: true, index: true },
    status:    { type: String, enum: ['ongoing','ended'], default: 'ongoing' },
    startedAt: { type: Date, default: Date.now, index: true },
    endedAt:   { type: Date, index: true },

    // 소프트 삭제용 (추가)
    deletedAt: { type: Date, default: null, index: true },
  },
  { timestamps: true }
);
// 자주 쓰는 인덱스
SessionSchema.index({ userId: 1, endedAt: -1, startedAt: -1 });
SessionSchema.index({ userEmail: 1, endedAt: -1 });
SessionSchema.index({ userName: 1, jobRole: 1 });

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
MessageSchema.index({ sessionId: 1, speaker: 1, createdAt: 1 });
MessageSchema.index({ sessionId: 1, turn: 1 });

const ReportSchema = new mongoose.Schema(
  {
    sessionId:       { type: mongoose.Schema.Types.ObjectId, ref: 'Session', unique: true, index: true },
    summary:         String,
    strengths:       [String],
    improvements:    [String],
    recommendations: [String],
    // 필요하면 추가 필드를 여기에 확장하세요(예: scores, qa 등)
  },
  { timestamps: true }
);

/* ===================== Models ===================== */
const Session = mongoose.models.Session || mongoose.model('Session', SessionSchema);
const Message = mongoose.models.Message || mongoose.model('Message', MessageSchema);
const Report  = mongoose.models.Report  || mongoose.model('Report',  ReportSchema);

/* ===================== Helpers ===================== */
function toObjectId(id) {
  try { return new mongoose.Types.ObjectId(id); } catch { return null; }
}

function normalizeSessionDoc(s, summaryText) {
  return {
    id: String(s._id),
    name: s.userName,
    role: s.jobRole,
    date: (s.endedAt || s.startedAt) ? new Date(s.endedAt || s.startedAt).toISOString() : null,
    summary: summaryText || '',
  };
}

/**
 * Report 문서를 프론트에서 쓰기 편하도록 변환
 * - overview  ← summary
 * - strengths ← strengths
 * - areas     ← improvements
 * - recommendation ← recommendations[0] (또는 join)
 * - topFindings ← recommendations가 있으면 그것, 없으면 strengths 일부
 * - name/role/date는 세션 문서에서 가져옴
 */
function normalizeReportDoc(r, session) {
  if (!r) return null;
  const topFindings = Array.isArray(r.recommendations) && r.recommendations.length
    ? r.recommendations
    : Array.isArray(r.strengths) ? r.strengths.slice(0, 3) : [];

  return {
    id: String(r.sessionId),
    name: session?.userName || null,
    role: session?.jobRole || null,
    date: session?.endedAt || session?.startedAt
      ? new Date(session.endedAt || session.startedAt).toISOString()
      : null,

    overview: r.summary || '',
    strengths: Array.isArray(r.strengths) ? r.strengths : [],
    areas: Array.isArray(r.improvements) ? r.improvements : [],
    recommendation: Array.isArray(r.recommendations) && r.recommendations.length
      ? r.recommendations[0]
      : '',
    topFindings,
    // 필요 시 scores/qa 등은 서비스 단계에서 붙이세요
  };
}

/* ===================== Public DB APIs ===================== */

/**
 * 세션 목록
 * - userId / userEmail / userName 중 하나로 소유자 필터 가능
 * - q: userName, jobRole 에 대한 간단 검색
 * - Report.summary를 조인해서 항목별 summary 제공
 */
async function listSessions({ userId, userEmail, userName, q = '', limit = 50, offset = 0 }) {
  await connectMongo();

  const filter = { deletedAt: null };
  if (userId) {
    const oid = typeof userId === 'string' ? toObjectId(userId) : userId;
    if (oid) filter.userId = oid;
  } else if (userEmail) {
    filter.userEmail = userEmail;
  } else if (userName) {
    filter.userName = userName;
  }

  if (q) {
    const re = new RegExp(q.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
    Object.assign(filter, { $or: [{ userName: re }, { jobRole: re }] });
  }

  const [rows, total] = await Promise.all([
    Session.aggregate([
      { $match: filter },
      { $sort: { endedAt: -1, startedAt: -1, _id: -1 } },
      { $skip: offset },
      { $limit: limit },
      {
        $lookup: {
          from: 'reports',
          localField: '_id',
          foreignField: 'sessionId',
          as: 'rpt'
        }
      },
      {
        $project: {
          userName: 1,
          jobRole: 1,
          startedAt: 1,
          endedAt: 1,
          summary: { $ifNull: [{ $first: '$rpt.summary' }, '' ] }
        }
      }
    ]),
    Session.countDocuments(filter),
  ]);

  const items = rows.map(r =>
    normalizeSessionDoc(
      { _id: r._id, userName: r.userName, jobRole: r.jobRole, startedAt: r.startedAt, endedAt: r.endedAt },
      r.summary
    )
  );

  return { items, total };
}

/** 세션 단건 */
async function getSessionById(id) {
  await connectMongo();
  const oid = toObjectId(id);
  if (!oid) return null;
  const s = await Session.findOne({ _id: oid, deletedAt: null }).lean();
  if (!s) return null;
  return { ...s, id: String(s._id) };
}

/** 세션 소프트 삭제 (성공 시 true) */
async function deleteSession(id) {
  await connectMongo();
  const oid = toObjectId(id);
  if (!oid) return false;
  const r = await Session.updateOne(
    { _id: oid, deletedAt: null },
    { $set: { deletedAt: new Date() } }
  );
  return r.modifiedCount > 0;
}

/** 리포트 조회 (정규화하여 반환) */
async function getReportBySessionId(sessionId) {
  await connectMongo();
  const oid = toObjectId(sessionId);
  if (!oid) return null;

  const [rpt, s] = await Promise.all([
    Report.findOne({ sessionId: oid }).lean(),
    Session.findOne({ _id: oid }).lean(),
  ]);
  if (!rpt) return null;
  return normalizeReportDoc(rpt, s || null);
}

/** 리포트 upsert (payload는 Report 스키마 기준, 반환은 정규화) */
async function upsertReport(sessionId, payload) {
  await connectMongo();
  const oid = toObjectId(sessionId);
  if (!oid) throw new Error('invalid sessionId');

  const doc = await Report.findOneAndUpdate(
    { sessionId: oid },
    { $set: { ...payload, sessionId: oid } },
    { upsert: true, new: true, setDefaultsOnInsert: true }
  ).lean();

  const s = await Session.findById(oid).lean();
  return normalizeReportDoc(doc, s || null);
}

/** (선택) 세션 생성 시 사용 */
async function insertSession(row) {
  await connectMongo();
  const doc = await Session.create(row);
  return String(doc._id);
}

/** (선택) 특정 세션의 메시지 나열 */
async function listMessagesBySession(sessionId) {
  await connectMongo();
  const oid = toObjectId(sessionId);
  if (!oid) return [];
  const rows = await Message.find({ sessionId: oid }).sort({ createdAt: 1, _id: 1 }).lean();
  return rows;
}

module.exports = {
  connectMongo,
  Session,
  Message,
  Report,

  // 서비스 레이어에서 사용할 함수들
  listSessions,
  getSessionById,
  deleteSession,
  getReportBySessionId,
  upsertReport,
  insertSession,
  listMessagesBySession,
};
