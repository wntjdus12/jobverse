const weaviate = require('weaviate-ts-client').default; // ★ default export
const host = process.env.WEAVIATE_HOST || 'http://localhost:8080';

// 임베딩 모델: .env에서 TEXT2VEC_OPENAI_MODEL 지정, 없으면 안전한 기본값
const EMB_MODEL = process.env.TEXT2VEC_OPENAI_MODEL || 'text-embedding-3-small';

const client = weaviate.client({
  scheme: host.startsWith('https') ? 'https' : 'http',
  host: host.replace(/^https?:\/\//, ''),
  headers: process.env.OPENAI_API_KEY
    ? { 'X-OpenAI-Api-Key': process.env.OPENAI_API_KEY } // Weaviate가 OpenAI 호출할 때 사용
    : undefined,
});

// 안전하게 스키마 정의 유틸 (모델/거리까지 명시)
function classDef(name, props) {
  return {
    class: name,
    vectorizer: 'text2vec-openai',
    moduleConfig: {
      'text2vec-openai': {
        model: EMB_MODEL, // 스키마로 모델 고정
      },
    },
    vectorIndexConfig: {
      distance: 'cosine', // findSimilarQuestions의 1 - distance 계산과 일치
    },
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
      // 신규 클래스 생성 (스키마에 모델/거리 설정 포함됨)
      await client.schema.classCreator().withClass(def).do();
      continue;
    }

    // 기존 클래스가 있을 때: 누락된 속성만 안전 추가
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
