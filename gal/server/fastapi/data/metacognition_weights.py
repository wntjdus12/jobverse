# 공식 가중치 표 (프론트 questionsData.js와 동일)
# 문항 10개, 비채점 문항 없음

WEIGHTS: dict[int, dict[str, dict[str, int]]] = {
    1: {
        "A": {"ownership": 1, "result_oriented": 1},
        "B": {"process_oriented": 2},
        "C": {"collaboration": 2},
        "D": {"process_oriented": 2},
    },
    2: {
        "A": {"result_oriented": 2},
        "B": {"user_centric": 1, "collaboration": 1},
        "C": {"ownership": 2},
        "D": {"process_oriented": 2},
    },
    3: {
        "A": {"ownership": 2},
        "B": {"process_oriented": 2},
        "C": {"result_oriented": 2},
        "D": {"collaboration": 2},
    },
    4: {
        "A": {"process_oriented": 1, "result_oriented": 1},
        "B": {"collaboration": 2},
        "C": {"process_oriented": 2},
        "D": {"user_centric": 2},
    },
    5: {
        "A": {"ownership": 2},
        "B": {"user_centric": 2},
        "C": {"ownership": 1, "result_oriented": 1},
        "D": {"collaboration": 2},
    },
    6: {
        "A": {"result_oriented": 2},
        "B": {"process_oriented": 2},
        "C": {"user_centric": 1, "collaboration": 1},
        "D": {"process_oriented": 1, "result_oriented": 1},
    },
    7: {
        "A": {"process_oriented": 2},
        "B": {"collaboration": 2},
        "C": {"ownership": 2},
        "D": {"result_oriented": 2},
    },
    8: {
        "A": {"result_oriented": 1, "collaboration": 1},
        "B": {"process_oriented": 2},
        "C": {"process_oriented": 1, "collaboration": 1},
        "D": {"collaboration": 2},
    },
    9: {
        "A": {"result_oriented": 2},
        "B": {"user_centric": 2},
        "C": {"ownership": 2},
        "D": {"result_oriented": 1, "process_oriented": 1},
    },
    10: {
        "A": {"result_oriented": 2},
        "B": {"user_centric": 2},
        "C": {"ownership": 2},
        "D": {"collaboration": 2},
    },
}

# 백엔드 점수 키의 고정 순서 (프론트 CATEGORY_LABELS 키와 1:1)
CATEGORIES = [
    "result_oriented",
    "process_oriented",
    "ownership",
    "collaboration",
    "user_centric",
]
