// services/vector.js (수정본)
const weaviate = require('weaviate-ts-client').default; // ★ default export
const host = process.env.WEAVIATE_HOST || 'http://localhost:8080';

const client = weaviate.client({
  scheme: host.startsWith('https') ? 'https' : 'http',
  host: host.replace(/^https?:\/\//, ''),
  headers: process.env.OPENAI_API_KEY
    ? { 'X-OpenAI-Api-Key': process.env.OPENAI_API_KEY } // ★ 헤더 표기 정정
    : undefined,
});

// 안전하게 스키마 정의 유틸
function classDef(name, props) {
  return {
    class: name,
    vectorizer: 'text2vec-openai',
    properties: props.map((p) => {
      if (p === 'text') return { name: 'text', dataType: ['text'] };
      if (p === 'turn') return { name: 'turn', dataType: ['int'] };
      return { name: p, dataType: ['string'] };
    }),
  };
}

let schemaReady = false;
async function ensureSchema() {
  if (schemaReady) return;

  const res = await client.schema.getter().do();
  const existing = new Map((res.classes || []).map((c) => [c.class, c]));

  const defs = [
    classDef('QuestionChunk', [
      'text',
      'sessionId',
      'userName',
      'userId',
      'userEmail',
      'jobRole',
      'turn',
      'mongoMessageId',
      'interviewerRole',
    ]),
    classDef('AnswerChunk', [
      'text',
      'sessionId',
      'userName',
      'userId',
      'userEmail',
      'jobRole',
      'turn',
      'mongoMessageId',
    ]),
  ];

  for (const def of defs) {
    const cur = existing.get(def.class);
    if (!cur) {
      await client.schema.classCreator().withClass(def).do();
      continue;
    }
    const have = new Set((cur.properties || []).map((p) => p.name));
    for (const prop of def.properties) {
      if (!have.has(prop.name)) {
        await client.schema
          .propertyCreator()
          .withClassName(def.class)
          .withProperty(prop)
          .do();
      }
    }
  }

  schemaReady = true;
}

async function upsert(className, props) {
  return client.data.creator().withClassName(className).withProperties(props).do();
}

// 유사 질문 탐색
async function findSimilarQuestions({
  text,
  sessionId,
  userName,
  userId,
  userEmail,
  jobRole,
  limit = 5,
}) {
  const operands = [
    { path: ['sessionId'], operator: 'Equal', valueString: String(sessionId) },
    { path: ['jobRole'], operator: 'Equal', valueString: jobRole },
  ];

  if (userId) {
    operands.push({ path: ['userId'], operator: 'Equal', valueString: String(userId) });
  } else if (userEmail) {
    operands.push({ path: ['userEmail'], operator: 'Equal', valueString: userEmail });
  } else {
    operands.push({ path: ['userName'], operator: 'Equal', valueString: userName });
  }

  const r = await client.graphql
    .get()
    .withClassName('QuestionChunk')
    .withFields('text turn _additional { distance }')
    .withNearText({ concepts: [text] })
    .withWhere({ operator: 'And', operands })
    .withLimit(limit)
    .do();

  const items = r?.data?.Get?.QuestionChunk || [];
  return items.map((i) => ({
    text: i.text,
    turn: i.turn,
    distance: i._additional.distance,
    similarity: 1 - i._additional.distance, // cosine distance 기준
  }));
}

module.exports = { ensureSchema, upsert, findSimilarQuestions };
