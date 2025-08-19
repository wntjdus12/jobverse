export const CATEGORY_LABELS = {
  result_oriented: "성과 중심",
  process_oriented: "과정/논리",
  ownership: "주도성",
  collaboration: "소통/협업",
  user_centric: "고객/기업 이해",
};

export const QUESTIONS = [
  {
    id: 1,
    title: "새로운 업무를 받았을 때, 당신의 첫 행동은?",
    choices: [
      {
        key: "A",
        label: "일단 실행 가능한 작은 일부터 바로 시작한다.",
        weights: { ownership: 1, result_oriented: 1 },
      },
      {
        key: "B",
        label: "관련 자료를 찾아보며 원인과 배경을 먼저 파악한다.",
        weights: { process_oriented: 2 },
      },
      {
        key: "C",
        label: "관련된 사람들과 이야기하며 맥락부터 공유한다.",
        weights: { collaboration: 2 },
      },
      {
        key: "D",
        label: "예상되는 어려움과 우선순위를 먼저 정리한다.",
        weights: { process_oriented: 2 },
      },
    ],
  },
  {
    id: 2,
    title: "자신의 성과를 증명해야 할 때, 어떤 기준을 가장 먼저 떠올리나요?",
    choices: [
      {
        key: "A",
        label: "그 일을 하기 전과 후의 '수치'나 '지표' 변화",
        weights: { result_oriented: 2 },
      },
      {
        key: "B",
        label: "함께 일한 동료나 고객의 '긍정적인 피드백'",
        weights: { user_centric: 1, collaboration: 1 },
      },
      {
        key: "C",
        label: "내가 해결한 '과업의 전문성'과 '난이도'",
        weights: { ownership: 2 },
      },
      {
        key: "D",
        label: "결과물의 '완성도'와 '안정성'",
        weights: { process_oriented: 2 },
      },
    ],
  },
  {
    id: 3,
    title: "팀 프로젝트에서 당신이 주로 맡는 역할은?",
    choices: [
      {
        key: "A",
        label: "전체적인 방향을 제시하고 팀원들의 의견을 조율한다.",
        weights: { ownership: 2 },
      },
      {
        key: "B",
        label: "정해진 목표에 맞춰 일정과 진행 상황을 관리한다.",
        weights: { process_oriented: 2 },
      },
      {
        key: "C",
        label: "누구보다 먼저 직접 실행하며 결과물을 만들어낸다.",
        weights: { result_oriented: 2 },
      },
      {
        key: "D",
        label: "팀원들의 의견을 듣고, 설득하며 합의점을 찾아낸다.",
        weights: { collaboration: 2 },
      },
    ],
  },
  {
    id: 4,
    title: "업무 중 예상치 못한 문제가 발생했을 때, 어떻게 행동하나요?",
    choices: [
      {
        key: "A",
        label: "신속하게 문제를 해결하고, 재발 방지책을 수립한다.",
        weights: { process_oriented: 1, result_oriented: 1 },
      },
      {
        key: "B",
        label: "관련된 사람들에게 즉시 상황을 공유하여 혼선을 막는다.",
        weights: { collaboration: 2 },
      },
      {
        key: "C",
        label: "문제의 근본 원인을 데이터로 기록하고 분석한다.",
        weights: { process_oriented: 2 },
      },
      {
        key: "D",
        label:
          "고객이나 사용자에게 미칠 영향을 최소화하는 것을 최우선으로 한다.",
        weights: { user_centric: 2 },
      },
    ],
  },
  {
    id: 5,
    title: "새로운 직무나 역할에 끌리는 가장 큰 이유는?",
    choices: [
      {
        key: "A",
        label: "해결해야 할 과제의 규모와 중요도",
        weights: { ownership: 2 },
      },
      {
        key: "B",
        label: "나의 일이 사용자에게 미치는 긍정적인 영향력",
        weights: { user_centric: 2 },
      },
      {
        key: "C",
        label: "해당 분야의 전문가로 성장할 수 있는 기회",
        weights: { ownership: 1, result_oriented: 1 },
      },
      {
        key: "D",
        label: "함께 일하고 싶은 팀의 문화와 동료",
        weights: { collaboration: 2 },
      },
    ],
  },
  {
    id: 6,
    title: "문제에 접근하는 당신만의 방식이 있다면?",
    choices: [
      {
        key: "A",
        label: "작은 가설을 세우고 빠르게 시도하며 정답을 찾아간다.",
        weights: { result_oriented: 2 },
      },
      {
        key: "B",
        label: "'왜?'라는 질문을 반복하며 근본적인 원인을 파고든다.",
        weights: { process_oriented: 2 },
      },
      {
        key: "C",
        label: "이 일이 관련된 사람들에게 어떤 영향을 줄지부터 생각해본다.",
        weights: { user_centric: 1, collaboration: 1 },
      },
      {
        key: "D",
        label: "명확한 목표를 세우고, 예상되는 결과를 먼저 정의한다.",
        weights: { process_oriented: 1, result_oriented: 1 },
      },
    ],
  },
  {
    id: 7,
    title: "보고서나 발표 자료를 만들 때, 당신의 스타일은?",
    choices: [
      {
        key: "A",
        label: "객관적인 사실과 데이터를 중심으로 담백하게 전달한다.",
        weights: { process_oriented: 2 },
      },
      {
        key: "B",
        label: "배경부터 결론까지, 기승전결이 있는 이야기로 풀어낸다.",
        weights: { collaboration: 2 },
      },
      {
        key: "C",
        label: "사실에 기반하여 나만의 해석과 통찰(인사이트)을 덧붙인다.",
        weights: { ownership: 2 },
      },
      {
        key: "D",
        label: "명확한 목표와 구체적인 실행 계획을 중심으로 구성한다.",
        weights: { result_oriented: 2 },
      },
    ],
  },
  {
    id: 8,
    title: "동료들과 결과물을 공유하는 당신의 방식은?",
    choices: [
      {
        key: "A",
        label: "작은 단위로 자주 공유하며 빠르게 피드백을 받는다.",
        weights: { result_oriented: 1, collaboration: 1 },
      },
      {
        key: "B",
        label: "객관적인 데이터와 함께 결과물을 공유한다.",
        weights: { process_oriented: 2 },
      },
      {
        key: "C",
        label: "상세한 문서로 과정과 결정사항을 함께 기록하여 공유한다.",
        weights: { process_oriented: 1, collaboration: 1 },
      },
      {
        key: "D",
        label: "주기적으로 진행 상황을 발표하고 동료들의 의견을 구한다.",
        weights: { collaboration: 2 },
      },
    ],
  },
  {
    id: 9,
    title: "여러 가지 일을 동시에 해야 할 때, 우선순위를 정하는 기준은?",
    choices: [
      {
        key: "A",
        label: "'가성비' (가장 적은 노력으로 가장 큰 효과를 내는 일)",
        weights: { result_oriented: 2 },
      },
      {
        key: "B",
        label: "고객의 가장 큰 불편함을 해결해주는 일",
        weights: { user_centric: 2 },
      },
      {
        key: "C",
        label: "팀과 회사의 가장 중요한 목표와 연결되는 일",
        weights: { ownership: 2 },
      },
      {
        key: "D",
        label: "가장 빠르게 끝낼 수 있는 일",
        weights: { result_oriented: 1, process_oriented: 1 },
      },
    ],
  },
  {
    id: 10,
    title: "당신이 가장 큰 보람을 느끼는 순간은 언제인가요?",
    choices: [
      {
        key: "A",
        label: "설정했던 목표 수치를 달성했을 때",
        weights: { result_oriented: 2 },
      },
      {
        key: "B",
        label: "동료나 고객으로부터 '고맙다'는 말을 들었을 때",
        weights: { user_centric: 2 },
      },
      {
        key: "C",
        label: "아무도 해결하지 못했던 어려운 과제를 해결했을 때",
        weights: { ownership: 2 },
      },
      {
        key: "D",
        label: "나의 도움으로 동료나 팀 전체가 성장했을 때",
        weights: { collaboration: 2 },
      },
    ],
  },
];
