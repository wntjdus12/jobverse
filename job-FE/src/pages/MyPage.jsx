import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { FiPlus, FiSave, FiUser, FiBriefcase, FiBook, FiLink, FiAward } from 'react-icons/fi';
import { useNavigate } from 'react-router-dom';

// ---- 강제 적용 스타일 (배경 그라데이션 & 3D 카드 섀도) ----
const FORCE_STYLES = `
  .mypage-bg {
    background: linear-gradient(180deg, #ded8e3ff 0%, #cbbfd3 45%, #ffffff 100%) !important;
    background-attachment: fixed !important;
  }
  .card-3d {
    box-shadow:
      rgba(0, 0, 0, 0.25) 0px 54px 55px,
      rgba(0, 0, 0, 0.12) 0px -12px 30px,
      rgba(0, 0, 0, 0.12) 0px 4px 6px,
      rgba(0, 0, 0, 0.17) 0px 12px 13px,
      rgba(0, 0, 0, 0.09) 0px -3px 5px !important;
    border: 1px solid rgba(255,255,255,0.6) !important;
    backdrop-filter: blur(6px);
  }
`;

// 직무 목록 (리렌더 최소화)
const jobCategories = {
  "생산/엔지니어링": ["생산직", "품질보증", "생산관리자", "설비 유지보수 엔지니어"],
  "마케팅": ["마케팅/광고", "디지털 마케터", "콘텐츠 마케터", "퍼포먼스 마케터", "마케팅 기획자"],
  "경영/기획": ["재무/회계", "프로덕트 매니저", "사업기획자", "HR 담당자"],
  "개발": ["백엔드 개발자", "프론트엔드 개발자", "AI/데이터 개발자", "DevOps/인프라 개발자"],
};

const MyPage = () => {
  const [profile, setProfile] = useState({
    photo: '',
    nickname: '',
    email: '',
    phone: '',
    intro: '',
    jobTitle: '',
    education: [{ level: '', status: '', school: '', major: '' }],
    activities: [{ title: '', content: '' }],
    awards: [{ title: '', content: '' }],
    certificates: ['']
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const navigate = useNavigate();

  useEffect(() => {
    const init = async () => {
      try {
        const user = JSON.parse(sessionStorage.getItem("user"));
        setProfile(prev => ({
          ...prev,
          nickname: user?.name || prev.nickname,
          email: user?.email || prev.email,
        }));

        const token = sessionStorage.getItem("token");
        if (!token) throw new Error("로그인이 필요합니다.");

        const { data } = await axios.get('/api/profile/me', {
          headers: { Authorization: `Bearer ${token}` }
        });

        setProfile({
          photo: data.photo || '',
          nickname: data.nickname || user?.name || '',
          email: data.email || user?.email || '',
          phone: data.phone || '',
          intro: data.intro || '',
          jobTitle: data.jobTitle || '',
          education: (data.education && data.education.length ? data.education : [{ level: '', status: '', school: '', major: '' }]),
          activities: (data.activities && data.activities.length ? data.activities : [{ title: '', content: '' }]),
          awards: (data.awards && data.awards.length ? data.awards : [{ title: '', content: '' }]),
          certificates: (data.certificates && data.certificates.length ? data.certificates : [''])
        });

      } catch (error) {
        console.warn("프로필 불러오기: ", error?.response?.status || error.message);
      } finally {
        setLoading(false);
      }
    };
    init();
  }, []);

  const handleChange = (e) => {
    const { name, value, files } = e.target;
    if (name === 'photo') {
      const file = files?.[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onloadend = () => {
        setProfile(prev => ({ ...prev, photo: reader.result }));
      };
      reader.readAsDataURL(file);
    } else {
      setProfile(prev => ({ ...prev, [name]: value }));
    }
  };

  const handleEducationChange = (index, field, value) => {
    const updated = [...profile.education];
    updated[index][field] = value;
    setProfile({ ...profile, education: updated });
  };

  const addEducation = () => {
    setProfile({
      ...profile,
      education: [...profile.education, { level: '', status: '', school: '', major: '' }]
    });
  };

  const handleArrayChange = (section, index, field, value) => {
    const updated = [...profile[section]];
    updated[index][field] = value;
    setProfile({ ...profile, [section]: updated });
  };

  const addArrayItem = (section, template) => {
    setProfile({ ...profile, [section]: [...profile[section], template] });
  };

  const handleCertificateChange = (index, value) => {
    const updated = [...profile.certificates];
    updated[index] = value;
    setProfile({ ...profile, certificates: updated });
  };

  const addCertificate = () => {
    setProfile({ ...profile, certificates: [...profile.certificates, ''] });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const token = sessionStorage.getItem("token");
      if (!token) return alert("로그인이 필요합니다");

      setSaving(true);
      await axios.post('/api/profile', profile, {
        headers: { Authorization: `Bearer ${token}` }
      });
      alert('프로필 정보가 저장되었습니다.');
      navigate('/');
    } catch (error) {
      console.error('프로필 저장 실패:', error);
      alert('저장 중 오류가 발생했습니다.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center text-gray-700">
        프로필을 불러오는 중...
      </div>
    );
  }

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: FORCE_STYLES }} />
      <div
        className="min-h-screen py-12 px-4 sm:px-6 lg:px-8 mypage-bg"
        style={{ fontFamily: '"Segoe UI", system-ui, -apple-system, Roboto, sans-serif' }}
      >
        <div className="max-w-4xl mx-auto bg-white/90 rounded-3xl shadow-2xl card-3d p-8 md:p-12 text-black">
          <h2
            className="text-3xl font-black text-center mb-20 mt-20 text-gray-800"
            style={{ fontFamily: "'Montserrat', sans-serif", fontWeight: 700 }}
          >
            {profile.nickname ? ` ${profile.nickname}님 , 반가워요!` : "내 프로필"}
          </h2>

          {/* Profile Photo */}
          <div className="flex flex-col items-center mb-10 mt-10">
            <div className="w-32 h-32 rounded-full border-4 border-gray-200 shadow-inner overflow-hidden flex items-center justify-center bg-gray-100">
              {profile.photo ? (
                <img src={profile.photo} alt="프로필" className="w-full h-full object-cover" />
              ) : (
                <FiUser className="text-gray-400 text-5xl" />
              )}
            </div>
            <input
              type="file"
              name="photo"
              accept="image/*"
              onChange={handleChange}
              className="mt-4 text-sm text-gray-600 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-purple-50 file:text-purple-600 hover:file:bg-purple-100"
            />
          </div>

          <form onSubmit={handleSubmit} className="space-y-10">
            {/* Basic Info */}
            <SectionCard title="기본 정보" icon={<FiUser />}>
              <InputField label="닉네임 / 이름" name="nickname" value={profile.nickname} onChange={handleChange} required />
              <InputField label="이메일" name="email" type="email" value={profile.email} onChange={handleChange} required />
              <InputField label="연락처" name="phone" type="tel" value={profile.phone} onChange={handleChange} />
              <TextAreaField label="소개글 / 상태 메시지" name="intro" value={profile.intro} onChange={handleChange} rows={3} />
            </SectionCard>

            {/* Job Title */}
            <SectionCard title="희망 직무" icon={<FiBriefcase />}>
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">직무 선택</label>
                <select
                  name="jobTitle"
                  value={profile.jobTitle}
                  onChange={handleChange}
                  className="w-full border border-gray-300 rounded-lg px-4 py-2 bg-white text-gray-800 focus:outline-none focus:ring-2 focus:ring-purple-400"
                >
                  <option value="">직무를 선택해주세요</option>
                  {Object.entries(jobCategories).map(([category, jobs]) => (
                    <optgroup key={category} label={category}>
                      {jobs.map(job => (
                        <option key={job} value={job}>{job}</option>
                      ))}
                    </optgroup>
                  ))}
                </select>
              </div>
            </SectionCard>

            {/* Education */}
            <SectionCard title="학력사항" icon={<FiBook />} onAdd={() => addEducation()}>
              {profile.education.map((edu, i) => (
                <div key={i} className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 mb-4 p-4 rounded-lg bg-gray-50 border border-gray-200">
                  <SelectField label="학력" name="level" value={edu.level} options={["고등학교", "전문대학", "대학교(4년제)", "대학원"]} onChange={(e) => handleEducationChange(i, 'level', e.target.value)} />
                  <SelectField label="졸업 상태" name="status" value={edu.status} options={["졸업", "재학중", "휴학", "중퇴"]} onChange={(e) => handleEducationChange(i, 'status', e.target.value)} />
                  <InputField label="학교명" name="school" value={edu.school} onChange={(e) => handleEducationChange(i, 'school', e.target.value)} />
                  <InputField label="전공" name="major" value={edu.major} onChange={(e) => handleEducationChange(i, 'major', e.target.value)} />
                </div>
              ))}
            </SectionCard>

            {/* Activities */}
            <SectionCard title="대외활동" icon={<FiLink />} onAdd={() => addArrayItem('activities', { title: '', content: '' })}>
              {profile.activities.map((act, i) => (
                <div key={i} className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-2 p-4 rounded-lg bg-gray-50 border border-gray-200">
                  <InputField label="활동명" name={`activity-title-${i}`} value={act.title} onChange={(e) => handleArrayChange('activities', i, 'title', e.target.value)} />
                  <InputField label="주요 내용" name={`activity-content-${i}`} value={act.content} onChange={(e) => handleArrayChange('activities', i, 'content', e.target.value)} />
                </div>
              ))}
            </SectionCard>

            {/* Awards */}
            <SectionCard title="수상경력" icon={<FiAward />} onAdd={() => addArrayItem('awards', { title: '', content: '' })}>
              {profile.awards.map((award, i) => (
                <div key={i} className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-2 p-4 rounded-lg bg-gray-50 border border-gray-200">
                  <InputField label="수상명" name={`award-title-${i}`} value={award.title} onChange={(e) => handleArrayChange('awards', i, 'title', e.target.value)} />
                  <InputField label="주요 내용" name={`award-content-${i}`} value={award.content} onChange={(e) => handleArrayChange('awards', i, 'content', e.target.value)} />
                </div>
              ))}
            </SectionCard>

            {/* Certificates */}
            <SectionCard title="자격증" icon={<FiAward />} onAdd={() => addCertificate()}>
              {profile.certificates.map((cert, i) => (
                <InputField
                  key={i}
                  label={`자격증 ${i + 1}`}
                  name={`certificate-${i}`}
                  value={cert}
                  onChange={(e) => handleCertificateChange(i, e.target.value)}
                  className="mb-2"
                />
              ))}
            </SectionCard>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={saving}
              className="w-full flex items-center justify-center gap-2 !bg-purple-400 hover:!bg-purple-600 !text-white font-semibold py-3 rounded-xl shadow-md transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <FiSave />
              {saving ? '저장 중...' : '저장하기'}
            </button>
          </form>
        </div>
      </div>
    </>
  );
};

// --- 재사용 컴포넌트 ---
const SectionCard = ({ title, icon, onAdd, children }) => (
  <div className="bg-gray-100 rounded-2xl shadow-sm p-6 space-y-6">
    <div className="flex justify-between items-center pb-4 border-b border-gray-200">
      <h3 className="text-xl font-semibold text-gray-800 flex items-center gap-3">
        {icon} {title}
      </h3>
      {onAdd && (
        <button
          type="button"
          onClick={onAdd}
          className="text-sm font-medium text-purple-600 hover:text-purple-700 !bg-purple-300 hover:bg-purple-100 px-3 py-1 rounded-lg transition flex items-center gap-1"
        >
          <FiPlus className="w-4 h-4" /> 추가
        </button>
      )}
    </div>
    <div className="space-y-4">
      {children}
    </div>
  </div>
);

const InputField = ({ label, name, value, onChange, type = "text", required = false }) => (
  <div className="space-y-1">
    <label htmlFor={name} className="block text-sm font-medium text-gray-700">{label}</label>
    <input
      id={name}
      type={type}
      name={name}
      value={value}
      onChange={onChange}
      required={required}
      className="w-full border border-gray-300 rounded-lg px-4 py-2 bg-white text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-400 transition"
      placeholder={label}
    />
  </div>
);

const TextAreaField = ({ label, name, value, onChange, rows }) => (
  <div className="space-y-1">
    <label htmlFor={name} className="block text-sm font-medium text-gray-700">{label}</label>
    <textarea
      id={name}
      name={name}
      value={value}
      onChange={onChange}
      rows={rows}
      placeholder={label}
      className="w-full border border-gray-300 rounded-lg px-4 py-2 bg-white text-gray-900 placeholder:text-gray-400 resize-none focus:outline-none focus:ring-2 focus:ring-purple-400 transition"
    />
  </div>
);

const SelectField = ({ label, name, value, options, onChange }) => (
  <div className="space-y-1">
    <label htmlFor={name} className="block text-sm font-medium text-gray-700">{label}</label>
    <select
      id={name}
      name={name}
      value={value}
      onChange={onChange}
      className="w-full border border-gray-300 rounded-lg px-4 py-2 bg-white text-gray-800 focus:outline-none focus:ring-2 focus:ring-purple-400"
    >
      <option value="">{label} 선택</option>
      {options.map(option => (
        <option key={option} value={option}>{option}</option>
      ))}
    </select>
  </div>
);

export default MyPage;
