import React, { useEffect, useState } from 'react';

const MyPage = () => {
  const [profile, setProfile] = useState({
    photo: '',
    nickname: '',
    email: '',
    phone: '',
    intro: '',
    education: [
      {
        level: '',
        status: '',
        school: '',
        major: ''
      }
    ],
    activities: [{ title: '', content: '' }],
    awards: [{ title: '', content: '' }],
    certificates: ['']
  });

  useEffect(() => {
    const user = JSON.parse(sessionStorage.getItem("user"));
    if (user) {
      setProfile((prev) => ({
        ...prev,
        nickname: user.name,
        email: user.email,
      }));
    }
  }, []);

  const handleChange = (e) => {
    const { name, value, files } = e.target;
    if (name === 'photo') {
      const file = files[0];
      const reader = new FileReader();
      reader.onloadend = () => {
        setProfile(prev => ({ ...prev, photo: reader.result }));
      };
      if (file) reader.readAsDataURL(file);
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
      education: [...profile.education, {
        level: '', status: '', school: '', major: ''
      }]
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

  const handleSubmit = (e) => {
    e.preventDefault();
    alert('프로필 정보가 저장되었습니다.');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-100 to-indigo-100 py-12 px-4">
      <div className="max-w-4xl mx-auto bg-white rounded-3xl shadow-2xl p-10">
        <h1 className="text-3xl font-extrabold text-center mb-8 text-purple-600">
          {profile.nickname ? `${profile.nickname}님, 반가워요 👋` : "내 프로필"}
        </h1>

        {/* 프로필 사진 */}
        <div className="flex flex-col items-center mb-10">
          <div className="w-36 h-36 rounded-full border-4 border-indigo-200 shadow-md overflow-hidden">
            {profile.photo ? (
              <img src={profile.photo} alt="프로필" className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full bg-gray-200 flex items-center justify-center text-gray-400 text-sm">
                사진 없음
              </div>
            )}
          </div>
          <input
            type="file"
            name="photo"
            accept="image/*"
            onChange={handleChange}
            className="mt-4 text-sm text-gray-600"
          />
        </div>

        <form onSubmit={handleSubmit} className="space-y-8">
          {/* 기본 정보 */}
          <FieldCard >
            <InputField label="- 닉네임 / 이름" name="nickname" value={profile.nickname} onChange={handleChange} required />
            <InputField label="- 이메일" name="email" type="email" value={profile.email} onChange={handleChange} required />
            <InputField label="- 연락처" name="phone" type="tel" value={profile.phone} onChange={handleChange} />
            <TextAreaField label="- 소개글 / 상태 메시지" name="intro" value={profile.intro} onChange={handleChange} rows={3} />
          </FieldCard>

          {/* 학력사항 */}
          <FieldCard>
            <div className="flex justify-between items-center mb-4">
              <h4 className="text-base">🫟 학력사항</h4>
              <button type="button" onClick={addEducation} className="text-indigo-600 hover:underline text-sm font-medium">+ 행 추가</button>
            </div>
            {profile.education.map((edu, i) => (
              <div key={i} className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
                <div>
                  <label className="block mb-1 text-sm font-medium text-black">학력</label>
                  <select
                    name={`level-${i}`}
                    value={edu.level}
                    onChange={(e) => handleEducationChange(i, 'level', e.target.value)}
                    className="w-full border border-gray-300 rounded-lg px-4 py-2 bg-white text-black"
                  >
                    <option value="">선택</option>
                    <option value="고등학교">고등학교</option>
                    <option value="전문대학">전문대학</option>
                    <option value="대학교(4년제)">대학교(4년제)</option>
                    <option value="대학원">대학원</option>
                  </select>
                </div>
                <div>
                  <label className="block mb-1 text-sm font-medium text-black">졸업 상태</label>
                  <select
                    name={`status-${i}`}
                    value={edu.status}
                    onChange={(e) => handleEducationChange(i, 'status', e.target.value)}
                    className="w-full border border-gray-300 rounded-lg px-4 py-2 bg-white text-black"
                  >
                    <option value="">선택</option>
                    <option value="졸업">졸업</option>
                    <option value="재학중">재학중</option>
                    <option value="휴학">휴학</option>
                    <option value="중퇴">중퇴</option>
                  </select>
                </div>
                <InputField label="학교명" name={`school-${i}`} value={edu.school} onChange={(e) => handleEducationChange(i, 'school', e.target.value)} />
                <InputField label="전공" name={`major-${i}`} value={edu.major} onChange={(e) => handleEducationChange(i, 'major', e.target.value)} />
              </div>
            ))}
          </FieldCard>

          {/* 대외활동 */}
          <FieldCard>
            <div className="flex justify-between items-center mb-4">
              <h4 className="text-base">🫟 대외활동</h4>
              <button type="button" onClick={() => addArrayItem('activities', { title: '', content: '' })} className="text-indigo-600 hover:underline text-sm font-medium">+ 추가</button>
            </div>
            {profile.activities.map((act, i) => (
              <div key={i} className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-2">
                <InputField label="활동명" name={`activity-title-${i}`} value={act.title} onChange={(e) => handleArrayChange('activities', i, 'title', e.target.value)} />
                <InputField label="주요 내용" name={`activity-content-${i}`} value={act.content} onChange={(e) => handleArrayChange('activities', i, 'content', e.target.value)} />
              </div>
            ))}
          </FieldCard>

          {/* 수상경력 */}
          <FieldCard>
            <div className="flex justify-between items-center mb-4">
              <h4 className="text-base">🫟 수상경력</h4>
              <button type="button" onClick={() => addArrayItem('awards', { title: '', content: '' })} className="text-indigo-600 hover:underline text-sm font-medium">+ 추가</button>
            </div>
            {profile.awards.map((award, i) => (
              <div key={i} className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-2">
                <InputField label="수상명" name={`award-title-${i}`} value={award.title} onChange={(e) => handleArrayChange('awards', i, 'title', e.target.value)} />
                <InputField label="주요 내용" name={`award-content-${i}`} value={award.content} onChange={(e) => handleArrayChange('awards', i, 'content', e.target.value)} />
              </div>
            ))}
          </FieldCard>

          {/* 자격증 */}
          <FieldCard>
            <div className="flex justify-between items-center mb-4">
              <h4 className="text-base">🫟 자격증</h4>
              <button type="button" onClick={addCertificate} className="text-indigo-600 hover:underline text-sm font-medium">+ 추가</button>
            </div>
            {profile.certificates.map((cert, i) => (
              <InputField
                key={i}
                label={`자격증 ${i + 1}`}
                name={`certificate-${i}`}
                value={cert}
                onChange={(e) => handleCertificateChange(i, e.target.value)}
              />
            ))}
          </FieldCard>

          <button
            type="submit"
            className="w-full bg-gradient-to-r from-purple-500 to-indigo-500 text-white font-bold py-3 rounded-lg shadow-md hover:brightness-110 transition"
          >
            저장하기
          </button>
        </form>
      </div>
    </div>
  );
};

const FieldCard = ({ children }) => (
  <div className="bg-white rounded-xl shadow-md p-6 space-y-4 text-black">{children}</div>
);

const InputField = ({ label, name, value, onChange, type = "text", required = false }) => (
  <div>
    <label className="block mb-1 text-sm font-medium text-black">{label}</label>
    <input
      type={type}
      name={name}
      value={value}
      onChange={onChange}
      required={required}
      className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-300 bg-white text-black placeholder:text-purple-400"
      placeholder={`${label} 입력`}
    />
  </div>
);

const TextAreaField = ({ label, name, value, onChange, rows }) => (
  <div>
    <label className="block mb-1 text-sm font-medium text-black">{label}</label>
    <textarea
      name={name}
      value={value}
      onChange={onChange}
      rows={rows}
      placeholder={`${label} 입력`}
      className="w-full border border-gray-300 rounded-lg px-4 py-2 resize-none focus:outline-none focus:ring-2 focus:ring-indigo-300 bg-white text-black placeholder:text-purple-400"
    />
  </div>
);

export default MyPage;
