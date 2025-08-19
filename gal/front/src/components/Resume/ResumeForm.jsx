import { useState, useCallback } from "react";
import { getAuthHeaders } from "../../lib/authHeaders";
import "./ResumeForm.css";
import JobStats from "./JobStats";

const API_BASE = import.meta.env.VITE_API_BASE || "http://localhost:8004";

// 직무 옵션 (이미지 기준)
const JOB_OPTIONS = [
  {
    label: "생산/엔지니어링",
    options: ["생산직", "품질보증", "생산관리자", "설비 유지보수 엔지니어"],
  },
  {
    label: "마케팅",
    options: [
      "마케팅/광고",
      "디지털 마케터",
      "콘텐츠 마케터",
      "퍼포먼스 마케터",
      "마케팅 기획자",
    ],
  },
  {
    label: "경영/기획",
    options: ["재무/회계", "프로덕트 매니저", "사업기획자", "HR 담당자"],
  },
  {
    label: "개발",
    options: [
      "백엔드 개발자",
      "프론트엔드 개발자",
      "AI/데이터 개발자",
      "DevOps/인프라 개발자",
    ],
  },
];

export default function ResumeForm() {
  const [form, setForm] = useState({
    activities: [],
    awards: [],
    certificates: [],
    education: [],
    email: "",
    phone: "",
    jobTitle: "",
  });
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // 모달 상태 + 통계 데이터
  const [statsOpen, setStatsOpen] = useState(false);
  const [statsData, setStatsData] = useState(null);
  const [statsSample, setStatsSample] = useState(0);
  const [statsJobTitle, setStatsJobTitle] = useState("");

  const readToken = () => {
    try {
      return localStorage.getItem("token") || "";
    } catch {
      return "";
    }
  };

  const makeHeaders = useCallback(() => {
    const base = getAuthHeaders?.() || {};
    const token = readToken();
    return {
      ...(base || {}),
      ...(token && !base.Authorization
        ? { Authorization: `Bearer ${token}` }
        : {}),
    };
  }, []);

  // 프로필 불러오기
  const fetchProfileData = useCallback(async () => {
    try {
      setLoading(true);
      const headers = makeHeaders();
      if (!headers.Authorization) {
        alert("로그인 정보가 없습니다. 다시 로그인 해주세요.");
        return;
      }
      const res = await fetch(`${API_BASE}/resume/me?include_photo=false`, {
        method: "GET",
        headers,
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data?.profile) {
        const msg =
          res.status === 401
            ? data.detail || "로그인이 필요합니다."
            : data.detail || "데이터 불러오기 실패";
        throw new Error(msg);
      }
      const p = data.profile;
      setForm({
        jobTitle: p.jobTitle || p.role || "",
        activities: Array.isArray(p.activities) ? p.activities : [],
        awards: Array.isArray(p.awards) ? p.awards : [],
        certificates: Array.isArray(p.certificates) ? p.certificates : [],
        education: Array.isArray(p.education) ? p.education : [],
        email: p.email || "",
        phone: p.phone || "",
      });
    } catch (e) {
      console.error(e);
      alert(e.message || "프로필 데이터를 불러올 수 없습니다.");
    } finally {
      setLoading(false);
    }
  }, [makeHeaders]);

  // 제출 & 통계 모달 오픈
  const submitResume = useCallback(async () => {
    try {
      if (!form.jobTitle?.trim()) {
        alert("직무를 먼저 선택하거나 불러와 주세요.");
        return;
      }
      setSubmitting(true);
      const headers = { ...makeHeaders(), "Content-Type": "application/json" };
      if (!headers.Authorization) {
        alert("로그인 정보가 없습니다. 다시 로그인 해주세요.");
        return;
      }
      const res = await fetch(`${API_BASE}/resume/submit`, {
        method: "PUT",
        headers,
        body: JSON.stringify({
          jobTitle: form.jobTitle,
          activities: form.activities ?? [],
          awards: form.awards ?? [],
          certificates: form.certificates ?? [],
          education: form.education ?? [],
          email: form.email ?? "",
          phone: form.phone ?? "",
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || data?.ok !== true)
        throw new Error(data?.detail || "제출 실패");

      // 응답 저장 → 모달 오픈
      setStatsData(data.stats);
      setStatsSample(data.sampleSize);
      setStatsJobTitle(data.jobTitle || form.jobTitle);
      setStatsOpen(true);
    } catch (e) {
      console.error(e);
      alert(e.message || "제출 중 오류가 발생했습니다.");
    } finally {
      setSubmitting(false);
    }
  }, [form, makeHeaders]);

  // Helpers
  const addCertificate = () =>
    setForm((f) => ({ ...f, certificates: [...(f.certificates || []), ""] }));
  const updateCertificate = (i, val) =>
    setForm((f) => {
      const arr = [...(f.certificates || [])];
      arr[i] = val;
      return { ...f, certificates: arr };
    });
  const removeCertificate = (i) =>
    setForm((f) => ({
      ...f,
      certificates: (f.certificates || []).filter((_, idx) => idx !== i),
    }));

  const addActivity = () =>
    setForm((f) => ({
      ...f,
      activities: [...(f.activities || []), { title: "", content: "" }],
    }));
  const updateActivity = (i, key, val) =>
    setForm((f) => {
      const arr = [...(f.activities || [])];
      arr[i] = { ...arr[i], [key]: val };
      return { ...f, activities: arr };
    });
  const removeActivity = (i) =>
    setForm((f) => ({
      ...f,
      activities: (f.activities || []).filter((_, idx) => idx !== i),
    }));

  const addAward = () =>
    setForm((f) => ({
      ...f,
      awards: [...(f.awards || []), { title: "", content: "" }],
    }));
  const updateAward = (i, key, val) =>
    setForm((f) => {
      const arr = [...(f.awards || [])];
      arr[i] = { ...arr[i], [key]: val };
      return { ...f, awards: arr };
    });
  const removeAward = (i) =>
    setForm((f) => ({
      ...f,
      awards: (f.awards || []).filter((_, idx) => idx !== i),
    }));

  const addEdu = () =>
    setForm((f) => ({
      ...f,
      education: [
        ...(f.education || []),
        { school: "", major: "", level: "", status: "" },
      ],
    }));

  return (
    <div className="resume">
      <header className="resume__header">
        <div>
          <h1 className="resume__title">이력서</h1>
          <p className="resume__subtitle">
            프로필을 불러오고 제출하면 직무 통계를 모달로 확인할 수 있어요.
          </p>
        </div>
        <div className="resume__actions">
          <button
            className="btn btn--ghost"
            disabled={loading || submitting}
            onClick={fetchProfileData}
          >
            {loading ? "불러오는 중…" : "마이페이지에서 불러오기"}
          </button>
          <button
            className="btn btn--primary"
            disabled={loading || submitting}
            onClick={submitResume}
            title={!form.jobTitle ? "직무가 비어있습니다." : ""}
          >
            {submitting ? "제출 중…" : "제출 & 통계 보기"}
          </button>
        </div>
      </header>

      <form className="card" onSubmit={(e) => e.preventDefault()}>
        {/* 기본 정보 */}
        <section className="section">
          <div className="section__head">
            <h2>기본 정보</h2>
            {form.jobTitle && (
              <span className="chip">
                내 직무: <b>{form.jobTitle}</b>
              </span>
            )}
          </div>

          <div className="grid grid--2">
            {/* 직무: SelectBox */}
            <div className="field">
              <label htmlFor="jobTitle">직무</label>
              <select
                id="jobTitle"
                className="input select"
                value={form.jobTitle}
                onChange={(e) =>
                  setForm((f) => ({ ...f, jobTitle: e.target.value }))
                }
              >
                <option value="" disabled>
                  직무를 선택해주세요
                </option>
                {JOB_OPTIONS.map((group) => (
                  <optgroup key={group.label} label={group.label}>
                    {group.options.map((opt) => (
                      <option key={opt} value={opt}>
                        {opt}
                      </option>
                    ))}
                  </optgroup>
                ))}
              </select>
            </div>

            <div className="field">
              <label htmlFor="email">이메일</label>
              <input
                id="email"
                className="input"
                placeholder="예) user@example.com"
                value={form.email}
                onChange={(e) =>
                  setForm((f) => ({ ...f, email: e.target.value }))
                }
              />
            </div>

            <div className="field">
              <label htmlFor="phone">전화번호</label>
              <input
                id="phone"
                className="input"
                placeholder="예) 010-1234-5678"
                value={form.phone}
                onChange={(e) =>
                  setForm((f) => ({ ...f, phone: e.target.value }))
                }
              />
            </div>
          </div>
        </section>

        {/* 자격증 */}
        <section className="section">
          <h2>자격증</h2>
          {(!form.certificates || form.certificates.length === 0) && (
            <p className="muted">자격증 정보가 없습니다.</p>
          )}
          <div className="vstack">
            {(form.certificates || []).map((c, i) => (
              <div key={i} className="row">
                <input
                  className="input"
                  placeholder="자격증 명"
                  value={c}
                  onChange={(e) => updateCertificate(i, e.target.value)}
                />
                <button
                  type="button"
                  className="btn btn--ghost"
                  onClick={() => removeCertificate(i)}
                >
                  삭제
                </button>
              </div>
            ))}
          </div>
          <button
            type="button"
            className="btn btn--outline"
            onClick={addCertificate}
          >
            + 자격증 추가
          </button>
        </section>

        {/* 대외활동 */}
        <section className="section">
          <h2>대외활동</h2>
          {(!form.activities || form.activities.length === 0) && (
            <p className="muted">대외활동 정보가 없습니다.</p>
          )}
          <div className="vstack">
            {(form.activities || []).map((a, i) => (
              <div key={i} className="grid grid--activity">
                <input
                  className="input"
                  placeholder="활동명"
                  value={a.title || ""}
                  onChange={(e) => updateActivity(i, "title", e.target.value)}
                />
                <input
                  className="input"
                  placeholder="내용"
                  value={a.content || ""}
                  onChange={(e) => updateActivity(i, "content", e.target.value)}
                />
                <button
                  type="button"
                  className="btn btn--ghost"
                  onClick={() => removeActivity(i)}
                >
                  삭제
                </button>
              </div>
            ))}
          </div>
          <button
            type="button"
            className="btn btn--outline"
            onClick={addActivity}
          >
            + 대외활동 추가
          </button>
        </section>

        {/* 수상 */}
        <section className="section">
          <h2>수상</h2>
          {(!form.awards || form.awards.length === 0) && (
            <p className="muted">수상 내역이 없습니다.</p>
          )}
          <div className="vstack">
            {(form.awards || []).map((a, i) => (
              <div key={i} className="grid grid--activity">
                <input
                  className="input"
                  placeholder="수상명"
                  value={a.title || ""}
                  onChange={(e) => updateAward(i, "title", e.target.value)}
                />
                <input
                  className="input"
                  placeholder="내용"
                  value={a.content || ""}
                  onChange={(e) => updateAward(i, "content", e.target.value)}
                />
                <button
                  type="button"
                  className="btn btn--ghost"
                  onClick={() => removeAward(i)}
                >
                  삭제
                </button>
              </div>
            ))}
          </div>
          <button type="button" className="btn btn--outline" onClick={addAward}>
            + 수상 추가
          </button>
        </section>

        {/* 학력 */}
        <section className="section">
          <h2>학력</h2>
          {(!form.education || form.education.length === 0) && (
            <p className="muted">학력 정보가 없습니다.</p>
          )}
          <div className="vstack">
            {(form.education || []).map((e, i) => (
              <div key={i} className="grid grid--edu">
                <input
                  className="input"
                  placeholder="학교"
                  value={e.school || ""}
                  onChange={(ev) =>
                    setForm((f) => {
                      const arr = [...(f.education || [])];
                      arr[i] = { ...arr[i], school: ev.target.value };
                      return { ...f, education: arr };
                    })
                  }
                />
                <input
                  className="input"
                  placeholder="전공"
                  value={e.major || ""}
                  onChange={(ev) =>
                    setForm((f) => {
                      const arr = [...(f.education || [])];
                      arr[i] = { ...arr[i], major: ev.target.value };
                      return { ...f, education: arr };
                    })
                  }
                />
                <input
                  className="input"
                  placeholder="학력(예: 대학교(4년제))"
                  value={e.level || ""}
                  onChange={(ev) =>
                    setForm((f) => {
                      const arr = [...(f.education || [])];
                      arr[i] = { ...arr[i], level: ev.target.value };
                      return { ...f, education: arr };
                    })
                  }
                />
                <input
                  className="input"
                  placeholder="상태(예: 재학/졸업)"
                  value={e.status || ""}
                  onChange={(ev) =>
                    setForm((f) => {
                      const arr = [...(f.education || [])];
                      arr[i] = { ...arr[i], status: ev.target.value };
                      return { ...f, education: arr };
                    })
                  }
                />
                <button
                  type="button"
                  className="btn btn--ghost btn--edu-delete"
                  onClick={() =>
                    setForm((f) => ({
                      ...f,
                      education: (f.education || []).filter(
                        (_, idx) => idx !== i
                      ),
                    }))
                  }
                >
                  삭제
                </button>
              </div>
            ))}
          </div>
          <button type="button" className="btn btn--outline" onClick={addEdu}>
            + 학력 추가
          </button>
        </section>
      </form>

      <JobStats
        asModal
        open={statsOpen}
        onClose={() => setStatsOpen(false)}
        title={`직무 통계`}
        stats={statsData}
        sampleSize={statsSample}
        jobTitle={statsJobTitle}
        maxItemsPerBlock={12}
      />
    </div>
  );
}
