import { formFields, documentForm } from "./domElements.js";
import {
  handleDocumentFormSubmit,
  handlePortfolioFormSubmit,
} from "./formSubmitHandler.js";

// 공용 렌더 유틸
function renderInput(field, namePrefix = "", value = "") {
  const requiredMark = field.required ? '<span class="required">*</span>' : "";
  const labelHTML = field.label
    ? `<label>${field.label}${requiredMark}</label>`
    : "";

  if (field.type === "select") {
    return `
      ${labelHTML}
      <select name="${namePrefix + field.name}" ${
      field.required ? "required" : ""
    }>
        ${field.options
          .map(
            (opt) =>
              `<option value="${opt}" ${value === opt ? "selected" : ""}>${
                opt || "선택"
              }</option>`
          )
          .join("")}
      </select>`;
  }

  if (field.type === "textarea") {
    return `
      ${labelHTML}
      <textarea name="${namePrefix + field.name}" ${
      field.required ? "required" : ""
    }>${value || ""}</textarea>`;
  }

  return `
    ${labelHTML}
    <input type="${field.type}" name="${namePrefix + field.name}" value="${
    value || ""
  }" ${field.required ? "required" : ""}>`;
}

/* =========================
   MyPage 스키마 전용: 이력서
   education:   [{ level, status, school, major }]
   activities:  [{ title, content }]
   awards:      [{ title, content }]
   certificates:[string]
   ========================= */

// 행 DOM 생성기: 학력
function eduRowHTML(idx, data = {}) {
  const namePrefix = `education_${idx}_`;
  return `
    <div class="item-entry resume-edu-item" data-index="${idx}">
      <div class="input-group">
        ${renderInput(
          {
            name: "level",
            label: "학력",
            type: "select",
            options: ["", "고등학교", "전문대학", "대학교(4년제)", "대학원"],
          },
          namePrefix,
          data.level || ""
        )}
      </div>
      <div class="input-group">
        ${renderInput(
          {
            name: "status",
            label: "졸업 상태",
            type: "select",
            options: ["", "졸업", "재학중", "휴학", "중퇴"],
          },
          namePrefix,
          data.status || ""
        )}
      </div>
      <div class="input-group">
        ${renderInput(
          { name: "school", label: "학교명", type: "text" },
          namePrefix,
          data.school || ""
        )}
      </div>
      <div class="input-group">
        ${renderInput(
          { name: "major", label: "전공", type: "text" },
          namePrefix,
          data.major || ""
        )}
      </div>

      <div class="item-actions" style="display:flex; gap:8px; justify-content:flex-end; margin-top:6px;">
        <button type="button" class="add-after-button">+ 추가</button>
        <button type="button" class="remove-item-button">삭제</button>
      </div>
    </div>
  `;
}

// 행 DOM 생성기: 2열(활동/수상)
function twoColRowHTML(sectionKey, idx, data = {}, labels = ["제목", "내용"]) {
  const namePrefix = `${sectionKey}_${idx}_`;
  return `
    <div class="item-entry" data-index="${idx}">
      <div class="input-group">
        ${renderInput(
          { name: "title", label: labels[0], type: "text" },
          namePrefix,
          data.title || ""
        )}
      </div>
      <div class="input-group">
        ${renderInput(
          { name: "content", label: labels[1], type: "text" },
          namePrefix,
          data.content || ""
        )}
      </div>

      <div class="item-actions" style="display:flex; gap:8px; justify-content:flex-end; margin-top:6px;">
        <button type="button" class="add-after-button">+ 추가</button>
        <button type="button" class="remove-item-button">삭제</button>
      </div>
    </div>
  `;
}

// 행 DOM 생성기: 자격증(문자열)
function certRowHTML(idx, value = "") {
  return `
    <div class="item-entry" data-index="${idx}">
      <div class="input-group">
        ${renderInput(
          { name: "name", label: `자격증 ${idx + 1}`, type: "text" },
          `certificates_${idx}_`,
          value
        )}
      </div>

      <div class="item-actions" style="display:flex; gap:8px; justify-content:flex-end; margin-top:6px;">
        <button type="button" class="add-after-button">+ 추가</button>
        <button type="button" class="remove-item-button">삭제</button>
      </div>
    </div>
  `;
}

/* ---------- 이벤트 위임: 같은 라인 + 추가/삭제 ---------- */
function wireInlineAddRemove(section, rowFactory) {
  const container = document.getElementById(`${section}-container`);
  if (!container) return;

  container.addEventListener("click", (e) => {
    const entry = e.target.closest(".item-entry");

    // 행 뒤에 새 행 추가
    if (e.target.classList.contains("add-after-button")) {
      e.preventDefault();
      const nextIdx = container.querySelectorAll(".item-entry").length;
      const temp = document.createElement("div");
      temp.innerHTML = rowFactory(nextIdx, {});
      const node = temp.firstElementChild;
      container.insertBefore(node, entry ? entry.nextSibling : null);
      return;
    }

    // 행 삭제 (전부 비면 자동으로 1행 생성)
    if (e.target.classList.contains("remove-item-button")) {
      e.preventDefault();
      if (entry) entry.remove();
      const remain = container.querySelectorAll(".item-entry").length;
      if (remain === 0) {
        const temp = document.createElement("div");
        temp.innerHTML = rowFactory(0, {});
        container.appendChild(temp.firstElementChild);
      }
      return;
    }
  });
}

/* ---------- 메인 렌더 ---------- */
export function renderFormFields(schema, currentContent = {}) {
  formFields.innerHTML = "";
  const docKoreanName =
    schema.korean_name || schema.title || currentContent.koreanName;

  // 포트폴리오
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
      </div>`;
    document.querySelector('#document-form button[type="submit"]').textContent =
      "요약 및 다운";
    documentForm.onsubmit = handlePortfolioFormSubmit;
    return;
  }

  // 자기소개서
  if (docKoreanName === "자기소개서") {
    const container = document.createElement("div");
    const COVER_LETTER_FIELDS = [
      {
        name: "reason_for_application",
        label: "1. 해당 직무에 지원한 이유를 서술하시오.",
        type: "textarea",
        required: true,
      },
      {
        name: "expertise_experience",
        label:
          "2. 해당 분야에 대한 전문성을 기르기 위해 노력한 경험을 서술하시오.",
        type: "textarea",
        required: true,
      },
      {
        name: "collaboration_experience",
        label: "3. 공동의 목표를 위해 협업을 한 경험을 서술하시오.",
        type: "textarea",
        required: true,
      },
      {
        name: "challenging_goal_experience",
        label:
          "4. 도전적인 목표를 세우고 성취하기 위해 노력한 경험을 서술하시오.",
        type: "textarea",
        required: true,
      },
      {
        name: "growth_process",
        label: "5. 자신의 성장과정을 서술하시오.",
        type: "textarea",
        required: true,
      },
    ];
    COVER_LETTER_FIELDS.forEach((f, idx) => {
      container.innerHTML += `
        <div class="input-group" style="margin-top:${idx > 0 ? "20px" : "0"};">
          ${renderInput(f, "", currentContent[f.name] || "")}
          <div class="error-message" style="display:none;color:#c00;font-size:12px;">필수 항목입니다.</div>
        </div>`;
    });
    formFields.appendChild(container);
    documentForm.onsubmit = handleDocumentFormSubmit;
    return;
  }

  // 이력서 (MyPage 스키마와 1:1) - 헤더의 +추가 제거, 각 행에 +추가/삭제
  if (docKoreanName === "이력서") {
    const resumeContainer = document.createElement("div");
    resumeContainer.className = "resume-form";

    // 학력
    const edu =
      Array.isArray(currentContent.education) && currentContent.education.length
        ? currentContent.education
        : [{ level: "", status: "", school: "", major: "" }];

    resumeContainer.innerHTML += `
      <h3>학력사항</h3>
      <div id="education-container" class="array-field-container">
        ${edu.map((row, i) => eduRowHTML(i, row)).join("")}
      </div>
      <hr/>`;

    // 대외활동
    const acts =
      Array.isArray(currentContent.activities) &&
      currentContent.activities.length
        ? currentContent.activities
        : [{ title: "", content: "" }];

    resumeContainer.innerHTML += `
      <h3>대외활동</h3>
      <div id="activities-container" class="array-field-container">
        ${acts
          .map((row, i) =>
            twoColRowHTML("activities", i, row, ["활동명", "주요 내용"])
          )
          .join("")}
      </div>
      <hr/>`;

    // 수상경력
    const awds =
      Array.isArray(currentContent.awards) && currentContent.awards.length
        ? currentContent.awards
        : [{ title: "", content: "" }];

    resumeContainer.innerHTML += `
      <h3>수상경력</h3>
      <div id="awards-container" class="array-field-container">
        ${awds
          .map((row, i) =>
            twoColRowHTML("awards", i, row, ["수상명", "주요 내용"])
          )
          .join("")}
      </div>
      <hr/>`;

    // 자격증
    const certs =
      Array.isArray(currentContent.certificates) &&
      currentContent.certificates.length
        ? currentContent.certificates
        : [""];

    resumeContainer.innerHTML += `
      <h3>자격증</h3>
      <div id="certificates-container" class="array-field-container">
        ${certs.map((v, i) => certRowHTML(i, v)).join("")}
      </div>`;

    formFields.appendChild(resumeContainer);

    // 섹션별 이벤트 위임
    wireInlineAddRemove("education", (idx, data) => eduRowHTML(idx, data));
    wireInlineAddRemove("activities", (idx, data) =>
      twoColRowHTML("activities", idx, data, ["활동명", "주요 내용"])
    );
    wireInlineAddRemove("awards", (idx, data) =>
      twoColRowHTML("awards", idx, data, ["수상명", "주요 내용"])
    );
    wireInlineAddRemove("certificates", (idx, data) => certRowHTML(idx, data));

    documentForm.onsubmit = handleDocumentFormSubmit;
    return;
  }

  // 기타 문서타입 (기존 스키마)
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
          renderArrayItem(section, sectionContainer, {}, {});
        });
        sectionContainer.appendChild(addButton);

        (currentContent[section.name] || []).forEach((itemContent) => {
          renderArrayItem(section, sectionContainer, {}, itemContent);
        });
      } else if (section.fields) {
        section.fields.forEach((field) => {
          renderField(field, sectionContainer, currentContent);
        });
      }
    });
  }
}

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

function renderField(field, container, content) {
  const inputGroup = document.createElement("div");
  inputGroup.className = "input-group";
  inputGroup.innerHTML = renderInput(field, "", content[field.name] || "");
  container.appendChild(inputGroup);
}
