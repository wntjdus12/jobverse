// static/js/formRenderer.js
import { formFields, documentForm } from "./domElements.js";
import {
  handleDocumentFormSubmit,
  handlePortfolioFormSubmit,
} from "./formSubmitHandler.js"; // 폼 제출 핸들러 임포트

/**
 * 주어진 스키마와 내용에 따라 폼 필드를 렌더링합니다.
 * @param {Object} schema - 문서 스키마 (sections 또는 fields 포함).
 * @param {Object} currentContent - 현재 문서 내용.
 */
export function renderFormFields(schema, currentContent) {
  formFields.innerHTML = ""; // 기존 폼 필드 초기화
  console.log("Rendering form fields for schema:", schema);

  const docKoreanName =
    schema.korean_name || schema.title || currentContent.koreanName;

  if (docKoreanName === "포트폴리오") {
    formFields.innerHTML = `
            <div class="input-group">
                <label>포트폴리오 PDF 업로드:</label>
                <input type="file" name="portfolio_pdf" accept=".pdf">
            </div>
            <div class="input-group">
                <label>포트폴리오 링크 입력:</label>
                <input type="text" name="portfolio_link" value="${
                  currentContent.portfolio_link || ""
                }">
            </div>
        `;
    const submitBtn = document.querySelector(
      '#document-form button[type="submit"]'
    );
    submitBtn.textContent = "요약 및 다운";
    documentForm.onsubmit = handlePortfolioFormSubmit;
    return;
  } else if (docKoreanName === "자기소개서") {
    const qaContainer = document.createElement("div");
    qaContainer.id = "qa-container";

    // 5가지 새로운 질문에 대한 필드 렌더링
    qaContainer.innerHTML = `
            <div class="input-group">
                <label>1. 해당 직무에 지원한 이유를 서술하시오.<span class="required">*</span></label>
                <textarea name="reason_for_application" style="width: 100%; min-height: 120px;" required>${
                  currentContent.reason_for_application || ""
                }</textarea>
                <div class="char-counter" style="text-align: right; font-size: 0.9em; color: #666; margin-top: 3px;">
                    글자수: <span class="char-count">${
                      (currentContent.reason_for_application || "").length
                    }</span>
                </div>
                <div class="error-message" style="color: red; font-size: 0.8em; display: none;">필수 입력 항목입니다.</div>
            </div>
            <div class="input-group" style="margin-top: 20px;">
                <label>2. 해당 분야에 대한 전문성을 기르기 위해 노력한 경험을 서술하시오.<span class="required">*</span></label>
                <textarea name="expertise_experience" style="width: 100%; min-height: 120px;" required>${
                  currentContent.expertise_experience || ""
                }</textarea>
                <div class="char-counter" style="text-align: right; font-size: 0.9em; color: #666; margin-top: 3px;">
                    글자수: <span class="char-count">${
                      (currentContent.expertise_experience || "").length
                    }</span>
                </div>
                <div class="error-message" style="color: red; font-size: 0.8em; display: none;">필수 입력 항목입니다.</div>
            </div>
            <div class="input-group" style="margin-top: 20px;">
                <label>3. 공동의 목표를 위해 협업을 한 경험을 서술하시오.<span class="required">*</span></label>
                <textarea name="collaboration_experience" style="width: 100%; min-height: 120px;" required>${
                  currentContent.collaboration_experience || ""
                }</textarea>
                <div class="char-counter" style="text-align: right; font-size: 0.9em; color: #666; margin-top: 3px;">
                    글자수: <span class="char-count">${
                      (currentContent.collaboration_experience || "").length
                    }</span>
                </div>
                <div class="error-message" style="color: red; font-size: 0.8em; display: none;">필수 입력 항목입니다.</div>
            </div>
            <div class="input-group" style="margin-top: 20px;">
                <label>4. 도전적인 목표를 세우고 성취하기 위해 노력한 경험을 서술하시오.<span class="required">*</span></label>
                <textarea name="challenging_goal_experience" style="width: 100%; min-height: 120px;" required>${
                  currentContent.challenging_goal_experience || ""
                }</textarea>
                <div class="char-counter" style="text-align: right; font-size: 0.9em; color: #666; margin-top: 3px;">
                    글자수: <span class="char-count">${
                      (currentContent.challenging_goal_experience || "").length
                    }</span>
                </div>
                <div class="error-message" style="color: red; font-size: 0.8em; display: none;">필수 입력 항목입니다.</div>
            </div>
            <div class="input-group" style="margin-top: 20px;">
                <label>5. 어려움을 극복한 경험을 서술하시오.<span class="required">*</span></label>
                <textarea name="overcoming_challenge_experience" style="width: 100%; min-height: 120px;" required>${
                  currentContent.overcoming_challenge_experience || ""
                }</textarea>
                <div class="char-counter" style="text-align: right; font-size: 0.9em; color: #666; margin-top: 3px;">
                    글자수: <span class="char-count">${
                      (currentContent.overcoming_challenge_experience || "")
                        .length
                    }</span>
                </div>
                <div class="error-message" style="color: red; font-size: 0.8em; display: none;">필수 입력 항목입니다.</div>
            </div>
        `;
    formFields.appendChild(qaContainer);
    documentForm.onsubmit = handleDocumentFormSubmit;
    return;
  } else if (docKoreanName === "이력서") {
    // 사용자가 요청한 이력서 양식 및 UI 개선
    const resumeContainer = document.createElement("div");
    resumeContainer.className = "resume-form";

    resumeContainer.innerHTML += `
      <h3>학력 정보</h3>
      <div class="input-group">
        <label>최종학력 <span class="required">*</span></label>
        <select name="final_education_level" id="final-education-level-select" required>
          <option value="">최종학력을 선택하세요</option>
          <option value="고등학교" ${
            currentContent.final_education_level === "고등학교"
              ? "selected"
              : ""
          }>고등학교</option>
          <option value="대학교" ${
            currentContent.final_education_level === "대학교" ? "selected" : ""
          }>대학교</option>
          <option value="대학원" ${
            currentContent.final_education_level === "대학원" ? "selected" : ""
          }>대학원</option>
        </select>
        <div class="error-message" style="color: red; font-size: 0.8em; display: none;">필수 입력 항목입니다.</div>
      </div>
      <div id="education-highschool-container" class="array-field-container">
        <h4>고등학교</h4>
        <div class="input-group">
          <label>학교명:</label>
          <input type="text" name="education_highschool_school_name" value="${
            currentContent.education_highschool_school_name || ""
          }">
        </div>
        <div style="display: flex; gap: 15px;">
          <div class="input-group" style="flex: 1;">
            <label>입학 연월:</label>
            <input type="month" name="education_highschool_start_date" value="${
              currentContent.education_highschool_start_date || ""
            }">
          </div>
          <div class="input-group" style="flex: 1;">
            <label>졸업 연월:</label>
            <input type="month" name="education_highschool_end_date" value="${
              currentContent.education_highschool_end_date || ""
            }">
          </div>
        </div>
        <div class="input-group">
          <label>졸업 유형:</label>
          <select name="education_highschool_graduation_type">
            <option value="">졸업 유형을 선택해주세요.</option>
            <option value="재학" ${
              currentContent.education_highschool_graduation_type === "재학"
                ? "selected"
                : ""
            }>재학</option>
            <option value="자퇴" ${
              currentContent.education_highschool_graduation_type === "자퇴"
                ? "selected"
                : ""
            }>자퇴</option>
            <option value="수료" ${
              currentContent.education_highschool_graduation_type === "수료"
                ? "selected"
                : ""
            }>수료</option>
            <option value="졸업" ${
              currentContent.education_highschool_graduation_type === "졸업"
                ? "selected"
                : ""
            }>졸업</option>
            <option value="졸업예정" ${
              currentContent.education_highschool_graduation_type === "졸업예정"
                ? "selected"
                : ""
            }>졸업예정</option>
            <option value="휴학" ${
              currentContent.education_highschool_graduation_type === "휴학"
                ? "selected"
                : ""
            }>휴학</option>
            <option value="기타" ${
              currentContent.education_highschool_graduation_type === "기타"
                ? "selected"
                : ""
            }>기타</option>
          </select>
        </div>
        <div class="input-group checkbox-group">
          <input type="checkbox" id="education_highschool_ged" name="education_highschool_ged" ${
            currentContent.education_highschool_ged_date ? "checked" : ""
          }>
          <label for="education_highschool_ged">검정고시</label>
          ${
            currentContent.education_highschool_ged_date
              ? `<input type="date" name="education_highschool_ged_date" value="${currentContent.education_highschool_ged_date}">`
              : `<input type="date" name="education_highschool_ged_date" style="display:none;">`
          }
        </div>
      </div>

      <div id="education-university-container" class="array-field-container">
        <h4>대학교</h4>
        <div class="input-group">
          <label>학교명:</label>
          <input type="text" name="education_university_school_name" value="${
            currentContent.education_university_school_name || ""
          }">
        </div>
        <div style="display: flex; gap: 15px;">
          <div class="input-group" style="flex: 1;">
            <label>입학 연월:</label>
            <input type="month" name="education_university_start_date" value="${
              currentContent.education_university_start_date || ""
            }">
          </div>
          <div class="input-group" style="flex: 1;">
            <label>졸업 연월:</label>
            <input type="month" name="education_university_end_date" value="${
              currentContent.education_university_end_date || ""
            }">
          </div>
        </div>
        <div class="input-group">
          <label>졸업 유형:</label>
          <select name="education_university_graduation_type">
            <option value="">졸업 유형을 선택해주세요.</option>
            <option value="재학" ${
              currentContent.education_university_graduation_type === "재학"
                ? "selected"
                : ""
            }>재학</option>
            <option value="자퇴" ${
              currentContent.education_university_graduation_type === "자퇴"
                ? "selected"
                : ""
            }>자퇴</option>
            <option value="수료" ${
              currentContent.education_university_graduation_type === "수료"
                ? "selected"
                : ""
            }>수료</option>
            <option value="졸업" ${
              currentContent.education_university_graduation_type === "졸업"
                ? "selected"
                : ""
            }>졸업</option>
            <option value="졸업예정" ${
              currentContent.education_university_graduation_type === "졸업예정"
                ? "selected"
                : ""
            }>졸업예정</option>
            <option value="휴학" ${
              currentContent.education_university_graduation_type === "휴학"
                ? "selected"
                : ""
            }>휴학</option>
            <option value="기타" ${
              currentContent.education_university_graduation_type === "기타"
                ? "selected"
                : ""
            }>기타</option>
          </select>
        </div>
        <div class="input-group">
          <label>입학 유형:</label>
          <select name="education_university_admission_type">
            <option value="">입학 유형을 선택해주세요.</option>
            <option value="정시" ${
              currentContent.education_university_admission_type === "정시"
                ? "selected"
                : ""
            }>정시</option>
            <option value="수시" ${
              currentContent.education_university_admission_type === "수시"
                ? "selected"
                : ""
            }>수시</option>
            </select>
        </div>
        <div class="input-group">
          <label>학위:</label>
          <input type="text" name="education_university_degree" value="${
            currentContent.education_university_degree || ""
          }">
        </div>
        <div class="input-group">
          <label>전공:</label>
          <input type="text" name="education_university_major" value="${
            currentContent.education_university_major || ""
          }">
        </div>
        <div class="input-group">
          <label>학점/전체학점:</label>
          <input type="text" name="education_university_gpa" value="${
            currentContent.education_university_gpa || ""
          }">
        </div>
      </div>

      <div id="education-graduate-container" class="array-field-container">
        <h4>대학원</h4>
        <div class="input-group">
          <label>학교명:</label>
          <input type="text" name="education_graduate_school_name" value="${
            currentContent.education_graduate_school_name || ""
          }">
        </div>
        <div style="display: flex; gap: 15px;">
          <div class="input-group" style="flex: 1;">
            <label>입학 연월:</label>
            <input type="month" name="education_graduate_start_date" value="${
              currentContent.education_graduate_start_date || ""
            }">
          </div>
          <div class="input-group" style="flex: 1;">
            <label>졸업 연월:</label>
            <input type="month" name="education_graduate_end_date" value="${
              currentContent.education_graduate_end_date || ""
            }">
          </div>
        </div>
        <div class="input-group">
          <label>졸업 유형:</label>
          <select name="education_graduate_graduation_type">
            <option value="">졸업 유형을 선택해주세요.</option>
            <option value="재학" ${
              currentContent.education_graduate_graduation_type === "재학"
                ? "selected"
                : ""
            }>재학</option>
            <option value="자퇴" ${
              currentContent.education_graduate_graduation_type === "자퇴"
                ? "selected"
                : ""
            }>자퇴</option>
            <option value="수료" ${
              currentContent.education_graduate_graduation_type === "수료"
                ? "selected"
                : ""
            }>수료</option>
            <option value="졸업" ${
              currentContent.education_graduate_graduation_type === "졸업"
                ? "selected"
                : ""
            }>졸업</option>
            <option value="졸업예정" ${
              currentContent.education_graduate_graduation_type === "졸업예정"
                ? "selected"
                : ""
            }>졸업예정</option>
            <option value="휴학" ${
              currentContent.education_graduate_graduation_type === "휴학"
                ? "selected"
                : ""
            }>휴학</option>
            <option value="기타" ${
              currentContent.education_graduate_graduation_type === "기타"
                ? "selected"
                : ""
            }>기타</option>
          </select>
        </div>
        <div class="input-group">
          <label>학위:</label>
          <input type="text" name="education_graduate_degree" value="${
            currentContent.education_graduate_degree || ""
          }">
        </div>
        <div class="input-group">
          <label>전공:</label>
          <input type="text" name="education_graduate_major" value="${
            currentContent.education_graduate_major || ""
          }">
        </div>
      </div>

      <hr/>

      <h3>학내외 활동</h3>
      <div id="activities-container" class="array-field-container">
        <button type="button" class="add-item-button" data-section="activities">항목 추가</button>
      </div>

      <hr/>

      <h3>경력</h3>
      <div id="career-container" class="array-field-container">
        <button type="button" class="add-item-button" data-section="career">항목 추가</button>
      </div>

      <hr/>

      <h3>외국어</h3>
      <div id="languages-container" class="array-field-container">
        <button type="button" class="add-item-button" data-section="languages">항목 추가</button>
      </div>

      <hr/>

      <h3>자격증</h3>
      <div id="certificates-container" class="array-field-container">
        <button type="button" class="add-item-button" data-section="certificates">항목 추가</button>
      </div>

      <hr/>

      <h3>수상내역</h3>
      <div id="awards-container" class="array-field-container">
        <button type="button" class="add-item-button" data-section="awards">항목 추가</button>
      </div>

      <hr/>

      <h3>교육</h3>
      <div id="education-courses-container" class="array-field-container">
        <button type="button" class="add-item-button" data-section="education-courses">항목 추가</button>
      </div>

      <hr/>

      <h3>기술 스택</h3>
      <div id="tech-stack-container" class="array-field-container">
        <button type="button" class="add-item-button" data-section="tech-stack">항목 추가</button>
      </div>
    `;

    formFields.appendChild(resumeContainer);
    // 학력 선택에 따라 입력란 show/hide
    const educationSelect = document.getElementById(
      "final-education-level-select"
    );
    const highschoolDiv = document.getElementById(
      "education-highschool-container"
    );
    const universityDiv = document.getElementById(
      "education-university-container"
    );
    const graduateDiv = document.getElementById("education-graduate-container");
    const submitBtn = document.querySelector(
      '#document-form button[type="submit"]'
    );

    function showEducationFields(level) {
      highschoolDiv.style.display = "none";
      universityDiv.style.display = "none";
      graduateDiv.style.display = "none";
      if (level === "고등학교") highschoolDiv.style.display = "block";
      else if (level === "대학교") {
        highschoolDiv.style.display = "block";
        universityDiv.style.display = "block";
      } else if (level === "대학원") {
        highschoolDiv.style.display = "block";
        universityDiv.style.display = "block";
        graduateDiv.style.display = "block";
      }
    }
    showEducationFields(educationSelect.value);
    educationSelect.addEventListener("change", (e) => {
      showEducationFields(e.target.value);
      validateFinalEducation(); // 선택 바뀔 때도 즉시 검증
    });

    // === 저장 버튼 활성화 검증 ===
    function validateFinalEducation() {
      const level = educationSelect.value;
      let valid = true;

      // 고등학교 필수
      if (level === "고등학교" || level === "대학교" || level === "대학원") {
        const hsName = document.querySelector(
          'input[name="education_highschool_school_name"]'
        );
        if (!hsName || !hsName.value.trim()) valid = false;
      }
      // 대학교 필수
      if ((level === "대학교" || level === "대학원") && valid) {
        const univName = document.querySelector(
          'input[name="education_university_school_name"]'
        );
        if (!univName || !univName.value.trim()) valid = false;
      }
      // 대학원 필수
      if (level === "대학원" && valid) {
        const gradName = document.querySelector(
          'input[name="education_graduate_school_name"]'
        );
        if (!gradName || !gradName.value.trim()) valid = false;
      }

      if (!level) valid = false;

      submitBtn.disabled = !valid;
    }

    // 입력 변화 감지
    educationSelect.addEventListener("change", validateFinalEducation);
    [
      'input[name="education_highschool_school_name"]',
      'input[name="education_university_school_name"]',
      'input[name="education_graduate_school_name"]',
    ].forEach((sel) => {
      const el = document.querySelector(sel);
      if (el) el.addEventListener("input", validateFinalEducation);
    });

    // 폼 처음 진입 시 한 번 체크
    validateFinalEducation();
    // 검정고시 체크박스 이벤트
    const gedCheckbox = document.querySelector("#education_highschool_ged");
    const gedDateInput = document.querySelector(
      'input[name="education_highschool_ged_date"]'
    );
    const highschoolGraduationTypeSelect = document.querySelector(
      'select[name="education_highschool_graduation_type"]'
    );
    const highschoolDatePair = document.querySelector(
      '#education-highschool-container > div[style*="flex"]'
    );

    function toggleGedFields(checked) {
      if (checked) {
        gedDateInput.style.display = "block";
        highschoolGraduationTypeSelect.style.display = "none";
        highschoolDatePair.style.display = "none";
      } else {
        gedDateInput.style.display = "none";
        highschoolGraduationTypeSelect.style.display = "block";
        highschoolDatePair.style.display = "flex";
      }
    }

    gedCheckbox.addEventListener("change", (event) => {
      toggleGedFields(event.target.checked);
    });

    // 페이지 로드 시 초기 상태 설정
    toggleGedFields(gedCheckbox.checked);

    // 동적으로 항목을 추가하는 이벤트 리스너
    document.querySelectorAll(".add-item-button").forEach((button) => {
      button.addEventListener("click", () => {
        const section = button.dataset.section;
        let itemHtml = "";
        const container = document.getElementById(section + "-container");

        switch (section) {
          case "activities":
            itemHtml = `
              <div class="item-entry">
                <div class="input-group"><label>활동단체명:</label><input type="text" name="activities_organization"></div>
                <div class="input-group"><label>역할 및 지위:</label><input type="text" name="activities_role"></div>
                <div style="display: flex; gap: 15px;">
                  <div class="input-group" style="flex: 1;"><label>시작일:</label><input type="month" name="activities_period_start"></div>
                  <div class="input-group" style="flex: 1;"><label>종료일:</label><input type="month" name="activities_period_end"></div>
                </div>
                <div class="input-group"><label>활동 내용:</label><textarea name="activities_details"></textarea></div>
                <button type="button" class="remove-item-button">삭제</button>
              </div>
            `;
            break;
          case "career":
            itemHtml = `
              <div class="item-entry">
                <div class="input-group"><label>회사명:</label><input type="text" name="career_company_name"></div>
                <div class="input-group"><label>부서명:</label><input type="text" name="career_department"></div>
                <div style="display: flex; gap: 15px;">
                  <div class="input-group" style="flex: 1;"><label>입사일:</label><input type="month" name="career_start_date"></div>
                  <div class="input-group" style="flex: 1;"><label>퇴사일:</label><input type="month" name="career_end_date"></div>
                </div>
                <div class="input-group"><label>직급/직책:</label><input type="text" name="career_position"></div>
                <div class="input-group"><label>업무 내용:</label><textarea name="career_job_description"></textarea></div>
                <div class="input-group"><label>고용 형태:</label><input type="text" name="career_employment_type"></div>
                <div class="input-group"><label>퇴직 사유:</label><input type="text" name="career_reason_for_leaving"></div>
                <button type="button" class="remove-item-button">삭제</button>
              </div>
            `;
            break;
          case "languages":
            itemHtml = `
              <div class="item-entry">
                <div class="input-group"><label>외국어:</label><input type="text" name="languages_name"></div>
                <div style="display: flex; gap: 15px;">
                  <div class="input-group" style="flex: 1;">
                    <label>회화능력:</label>
                    <select name="languages_speaking">
                      <option value="">선택</option>
                      <option value="상">상</option>
                      <option value="중">중</option>
                      <option value="하">하</option>
                    </select>
                  </div>
                  <div class="input-group" style="flex: 1;">
                    <label>작문능력:</label>
                    <select name="languages_writing">
                      <option value="">선택</option>
                      <option value="상">상</option>
                      <option value="중">중</option>
                      <option value="하">하</option>
                    </select>
                  </div>
                  <div class="input-group" style="flex: 1;">
                    <label>독해능력:</label>
                    <select name="languages_reading">
                      <option value="">선택</option>
                      <option value="상">상</option>
                      <option value="중">중</option>
                      <option value="하">하</option>
                    </select>
                  </div>
                </div>
                <div class="input-group"><label>시험 종류:</label><input type="text" name="languages_test_type"></div>
                <div class="input-group"><label>점수/등급:</label><input type="text" name="languages_score"></div>
                <div class="input-group"><label>취득일:</label><input type="month" name="languages_date_acquired"></div>
                <button type="button" class="remove-item-button">삭제</button>
              </div>
            `;
            break;
          case "certificates":
            itemHtml = `
              <div class="item-entry">
                <div class="input-group"><label>자격증 이름:</label><input type="text" name="certificates_name"></div>
                <div class="input-group"><label>발급기관:</label><input type="text" name="certificates_issuer"></div>
                <div style="display: flex; gap: 15px;">
                  <div class="input-group" style="flex: 1;"><label>취득일:</label><input type="month" name="certificates_date_acquired"></div>
                  <div class="input-group" style="flex: 1;"><label>만료일:</label><input type="month" name="certificates_expiration_date"></div>
                </div>
                <button type="button" class="remove-item-button">삭제</button>
              </div>
            `;
            break;
          case "awards":
            itemHtml = `
              <div class="item-entry">
                <div class="input-group"><label>수상/공모전:</label><input type="text" name="awards_name"></div>
                <div class="input-group"><label>주최기관:</label><input type="text" name="awards_organizer"></div>
                <div class="input-group"><label>수상내역:</label><textarea name="awards_details"></textarea></div>
                <div class="input-group"><label>수상일:</label><input type="month" name="awards_date"></div>
                <button type="button" class="remove-item-button">삭제</button>
              </div>
            `;
            break;
          case "education-courses":
            itemHtml = `
              <div class="item-entry">
                <div class="input-group"><label>교육명:</label><input type="text" name="education_course_name"></div>
                <div class="input-group"><label>교육 기관:</label><input type="text" name="education_course_institution"></div>
                <div style="display: flex; gap: 15px;">
                  <div class="input-group" style="flex: 1;"><label>시작일:</label><input type="month" name="education_course_start_date"></div>
                  <div class="input-group" style="flex: 1;"><label>종료일:</label><input type="month" name="education_course_end_date"></div>
                </div>
                <div class="input-group"><label>교육 내용:</label><textarea name="education_course_details"></textarea></div>
                <button type="button" class="remove-item-button">삭제</button>
              </div>
            `;
            break;
          case "tech-stack":
            itemHtml = `
              <div class="item-entry">
                <div class="input-group"><label>기술명:</label><input type="text" name="tech_stack_name"></div>
                <div class="input-group">
                  <label>능력:</label>
                  <select name="tech_stack_proficiency">
                    <option value="">선택</option>
                    <option value="상">상</option>
                    <option value="중">중</option>
                    <option value="하">하</option>
                  </select>
                </div>
                <button type="button" class="remove-item-button">삭제</button>
              </div>
            `;
            break;
        }

        const newDiv = document.createElement("div");
        newDiv.innerHTML = itemHtml;
        container.insertBefore(newDiv, button);

        // 새 항목에 삭제 버튼 이벤트 리스너 추가
        newDiv
          .querySelector(".remove-item-button")
          .addEventListener("click", (e) => {
            e.target.closest(".item-entry").remove();
          });
      });
    });

    documentForm.onsubmit = handleDocumentFormSubmit;
    return;
  }

  if (schema && schema.sections) {
    schema.sections.forEach((section) => {
      const sectionContainer = document.createElement("div");
      sectionContainer.className = "section-container";
      formFields.appendChild(sectionContainer);

      const sectionTitle = document.createElement("h3");
      sectionTitle.textContent = section.title;
      sectionContainer.appendChild(sectionTitle);

      if (section.is_array) {
        sectionContainer.dataset.arrayFieldName = section.name;
        const addButton = document.createElement("button");
        addButton.type = "button";
        addButton.textContent = `+ ${section.title} 추가`;
        addButton.className = "add-array-item-button";
        addButton.addEventListener("click", () => {
          renderArrayItem(section, sectionContainer, currentContent);
        });
        sectionContainer.appendChild(addButton);

        const existingItems = currentContent[section.name] || [];
        existingItems.forEach((itemContent) => {
          renderArrayItem(
            section,
            sectionContainer,
            currentContent,
            itemContent
          );
        });
      } else if (section.fields) {
        section.fields.forEach((field) => {
          renderField(field, sectionContainer, currentContent);
        });
      }
    });
  }
}

/**
 * 배열 내 개별 항목을 렌더링합니다.
 * @param {Object} section - 배열 섹션 스키마.
 * @param {HTMLElement} container - 항목을 추가할 컨테이너.
 * @param {Object} currentContent - 현재 문서 내용.
 * @param {Object} [itemContent={}] - 개별 항목의 내용 (선택 사항).
 */
function renderArrayItem(section, container, currentContent, itemContent = {}) {
  const itemContainer = document.createElement("div");
  itemContainer.className = "array-item-container";

  section.fields.forEach((field) => {
    renderField(field, itemContainer, itemContent);
  });

  const removeButton = document.createElement("button");
  removeButton.type = "button";
  removeButton.textContent = "삭제";
  removeButton.className = "remove-array-item-button";
  removeButton.onclick = () => itemContainer.remove();
  itemContainer.appendChild(removeButton);

  container.insertBefore(itemContainer, container.firstChild);
}

/**
 * 개별 필드를 렌더링합니다.
 * @param {Object} field - 필드 스키마.
 * @param {HTMLElement} container - 필드를 추가할 컨테이너.
 * @param {Object} content - 현재 문서 내용.
 */
function renderField(field, container, content) {
  const inputGroup = document.createElement("div");
  inputGroup.className = "input-group";
  inputGroup.innerHTML = `
      <label for="${field.name}">${field.label}</label>
      <input type="${field.type}" id="${field.name}" name="${
    field.name
  }" value="${content[field.name] || ""}" />
  `;
  container.appendChild(inputGroup);
}
