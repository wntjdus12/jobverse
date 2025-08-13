// static/js/diagramRenderer.js
import {
  diagramContainer,
  editModal,
  companyModal,
  closeCompanyModalButton,
} from "./domElements.js";
import {
  jobTitle,
  documentData,
  currentDocType,
  currentDocVersion,
  setCurrentDocInfo,
  truncateDocumentVersions,
  getDocumentVersionData,
} from "./documentData.js";
import {
  showLoading,
  openEditModal,
  setAiFeedback,
  setModalTitle,
  openCompanyModal,
} from "./uiHandler.js";
import { renderFormFields } from "./formRenderer.js";

/**
 * 다이어그램 노드 클릭 이벤트 설정
 */
export function setupNodeClickEvents() {
  // 롤백 버튼
  document.querySelectorAll(".rollback-button").forEach((button) => {
    button.onclick = (e) => {
      e.stopPropagation();
      const docType = button.dataset.docType;
      const versionToRollback = parseInt(button.dataset.version, 10);
      rollbackDocument(docType, versionToRollback);
    };
  });

  // 노드 클릭
  document.querySelectorAll(".diagram-node").forEach((node) => {
    node.onclick = async (e) => {
      const clickedNode = e.target.closest(".diagram-node");
      const docType = clickedNode.dataset.docType;

      if (docType === "company") {
        openCompanyModal();
        return;
      }
      if (!clickedNode.classList.contains("document-node")) return;

      const version = parseInt(clickedNode.dataset.version, 10);
      setCurrentDocInfo(docType, version);

      try {
        showLoading(true, "문서 스키마 로딩 중...");
        const formSchema = await fetch(
          `/api/document_schema/${currentDocType}?job_slug=${jobTitle
            .replace(/ /g, "-")
            .replace(/\//g, "-")
            .toLowerCase()}`
        )
          .then((res) => {
            if (!res.ok) throw new Error(`서버 응답 오류: ${res.status}`);
            return res.json();
          })
          .catch((error) => {
            console.error("Error fetching form schema:", error);
            alert(
              "문서 스키마를 불러오는 데 실패했습니다. 네트워크나 서버 상태를 확인하세요."
            );
            editModal.style.display = "none";
            return null;
          });

        if (!formSchema) {
          showLoading(false);
          return;
        }

        const docContent =
          getDocumentVersionData(docType, version)?.content || {};
        const savedFeedback =
          getDocumentVersionData(docType, version)?.feedback || "";
        const individualFeedbacks =
          getDocumentVersionData(docType, version)?.individual_feedbacks || {};

        renderFormFields(formSchema, docContent);
        setModalTitle(`${clickedNode.dataset.koreanName} 편집 (v${version})`);
        openEditModal(
          `${clickedNode.dataset.koreanName} 편집 (v${version})`,
          savedFeedback,
          individualFeedbacks,
          docType // 포트폴리오 포함 개별 피드백 표시 가능
        );
      } catch (error) {
        console.error("An error occurred during node click event:", error);
        alert(
          "문서 편집기를 여는 중 오류가 발생했습니다. 네트워크나 서버를 확인하세요."
        );
        editModal.style.display = "none";
      } finally {
        showLoading(false);
      }
    };
  });
}

/**
 * 다이어그램 그리기
 */
export function drawDiagram() {
  diagramContainer.innerHTML = "";

  const jobNode = document.createElement("div");
  jobNode.className = "diagram-node company-node";
  jobNode.dataset.docType = "company";
  jobNode.dataset.koreanName = "기업";
  jobNode.textContent = "기업";
  diagramContainer.appendChild(jobNode);

  const documentLanesContainer = document.createElement("div");
  documentLanesContainer.className = "document-lanes-container";
  diagramContainer.appendChild(documentLanesContainer);

  for (const docType in documentData) {
    const docLane = document.createElement("div");
    docLane.className = "document-lane";
    docLane.dataset.docType = docType;
    documentLanesContainer.appendChild(docLane);

    const totalVersions = documentData[docType].length;

    for (let i = 0; i < totalVersions; i++) {
      const doc = documentData[docType][i];
      const nodeVersion = doc.version;
      const nodeVersionGroup = document.createElement("div");
      nodeVersionGroup.className = "node-version-group";

      const node = document.createElement("div");
      node.className = `diagram-node document-node v${nodeVersion}`;
      node.dataset.docType = docType;
      node.dataset.version = nodeVersion;
      node.dataset.koreanName = doc.koreanName;
      node.textContent = doc.displayContent;

      if (nodeVersion < totalVersions - 1) {
        const rollbackButton = document.createElement("button");
        rollbackButton.className = "rollback-button";
        rollbackButton.textContent = `v${nodeVersion} 되돌리기`;
        rollbackButton.dataset.docType = docType;
        rollbackButton.dataset.version = nodeVersion;
        node.appendChild(rollbackButton);
      }

      node.querySelector(".rollback-button")?.addEventListener("click", (e) => {
        e.stopPropagation();
      });

      nodeVersionGroup.appendChild(node);
      docLane.appendChild(nodeVersionGroup);
    }
  }

  if (closeCompanyModalButton) {
    closeCompanyModalButton.onclick = () => {
      companyModal.style.display = "none";
    };
  }

  setupNodeClickEvents();
}

/**
 * 문서 되돌리기
 */
export async function rollbackDocument(docType, versionToRollback) {
  const docName = documentData[docType][0]
    ? documentData[docType][0].koreanName
    : docType;

  if (!confirm(`${docName}를 v${versionToRollback} 버전으로 되돌리시겠습니까?`))
    return;

  truncateDocumentVersions(docType, versionToRollback);

  showLoading(true, "데이터베이스 롤백 중...");
  try {
    const response = await fetch(
      `/api/rollback_document/${docType}/${jobTitle
        .replace(/ /g, "-")
        .replace(/\//g, "-")
        .toLowerCase()}/${versionToRollback}`,
      { method: "DELETE" }
    );
    if (!response.ok) {
      const errorResult = await response.json();
      throw new Error(errorResult.detail || "서버 롤백 실패");
    }
    alert(`${docName}가 v${versionToRollback} 버전으로 되돌려졌습니다.`);
  } catch (error) {
    console.error("Rollback API error:", error);
    alert(`롤백 중 오류: ${error.message}`);
  } finally {
    showLoading(false);
  }

  setCurrentDocInfo(docType, versionToRollback);

  // 모달 먼저 갱신
  if (editModal.style.display === "block" && currentDocType === docType) {
    const versionData = getDocumentVersionData(docType, versionToRollback);
    if (versionData) {
      try {
        const schema = await fetch(
          `/api/document_schema/${currentDocType}?job_slug=${jobTitle
            .replace(/ /g, "-")
            .toLowerCase()}`
        ).then((res) => res.json());

        renderFormFields(schema, versionData.content);
        setAiFeedback(
          versionData.feedback || "",
          versionData.individual_feedbacks || {},
          docType // 포트폴리오 포함
        );
        setModalTitle(
          `${versionData.koreanName} 편집 (v${versionData.version})`
        );
      } catch (err) {
        console.error("Error fetching schema on rollback:", err);
      }
    } else {
      editModal.style.display = "none";
      alert("문서가 초기화되어 현재 편집 중인 내용이 없습니다.");
    }
  }

  // 모달 갱신 후 다이어그램 다시 그림
  drawDiagram();
}
