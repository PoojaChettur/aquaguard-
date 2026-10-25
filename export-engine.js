/**
 * AquaGuard — Export & Cleanup Action Plan Generator
 */

class SonarExportEngine {
  exportToCSV(selectedMissionId = null) {
    const targets = selectedMissionId && selectedMissionId !== "all"
      ? window.ALL_MISSION_TARGETS.filter((t) => t.missionId === selectedMissionId)
      : window.ALL_MISSION_TARGETS;

    const headers = [
      "Target ID",
      "Mission Name",
      "Object Label",
      "Class Category",
      "Confidence (%)",
      "Risk Score (0-100)",
      "Risk Level",
      "Latitude",
      "Longitude",
      "Depth (meters)",
      "Sonar Sensor Type",
      "Sonar Frequency",
      "Shadow Length (m)",
      "Estimated Dimensions (LxWxH m)",
      "Material Composition",
      "Remediation Action Plan",
      "Survey Date"
    ];

    const rows = targets.map((t) => [
      `"${t.id}"`,
      `"${t.missionName}"`,
      `"${t.label}"`,
      `"${t.classCategory}"`,
      `"${(t.confidence * 100).toFixed(1)}"`,
      `"${t.riskScore}"`,
      `"${t.riskLevel.toUpperCase()}"`,
      `"${t.coordinates.lat.toFixed(6)}"`,
      `"${t.coordinates.lon.toFixed(6)}"`,
      `"${t.depth.toFixed(1)}"`,
      `"${t.sonarType}"`,
      `"${t.sonarFreq}"`,
      `"${t.shadowLength_m || 'N/A'}"`,
      `"${t.estimatedDims ? `${t.estimatedDims.length}x${t.estimatedDims.width}x${t.estimatedDims.height}` : 'N/A'}"`,
      `"${t.material || 'Unknown'}"`,
      `"${t.actionPlan}"`,
      `"${t.surveyDate}"`
    ]);

    const csvContent = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows.map((e) => e.join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `AquaGuard_Seabed_Anomaly_Survey_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  generatePrintableReport(selectedMissionId = null) {
    const targets = selectedMissionId && selectedMissionId !== "all"
      ? window.ALL_MISSION_TARGETS.filter((t) => t.missionId === selectedMissionId)
      : window.ALL_MISSION_TARGETS;

    const criticalCount = targets.filter((t) => t.riskLevel === "critical").length;
    const moderateCount = targets.filter((t) => t.riskLevel === "moderate").length;
    const lowCount = targets.filter((t) => t.riskLevel === "low").length;

    const modalContainer = document.getElementById("report-modal-content");
    if (!modalContainer) return;

    const rowsHtml = targets.map((t) => `
      <tr class="report-table-row">
        <td class="code-font font-bold text-cyan">${t.id}</td>
        <td>
          <div class="font-bold text-white">${t.label}</div>
          <div class="text-[10px] text-muted">${t.classCategory}</div>
        </td>
        <td>
          <span class="report-badge ${t.riskLevel}">${t.riskScore}/100 (${t.riskLevel.toUpperCase()})</span>
        </td>
        <td class="code-font text-[11px] text-gray-300">
          ${t.coordinates.lat.toFixed(4)}°N, ${Math.abs(t.coordinates.lon).toFixed(4)}°${t.coordinates.lon >= 0 ? 'E' : 'W'}
        </td>
        <td class="code-font text-[11px] text-gray-300">${t.depth.toFixed(1)} m</td>
        <td class="code-font text-[11px] text-cyan">${(t.confidence * 100).toFixed(0)}%</td>
        <td class="text-[11px] text-gray-200">${t.actionPlan}</td>
      </tr>
    `).join("");

    modalContainer.innerHTML = `
      <div class="printable-cleanup-report" id="print-area">
        <div class="report-header">
          <div class="report-branding">
            <div class="aquaguard-pill">AQUAGUARD // DEEPSEA INTELLIGENCE</div>
            <h2>SEABED REMEDIATION & MARINE DEBRIS CLEANUP MISSION PLAN</h2>
            <p class="report-sub">Standard Oceanographic & Scientific Acoustic Survey Anomaly Register</p>
          </div>
          <div class="report-meta-box code-font">
            <div><strong>DOC REF:</strong> AQG-DSD-2026-X4</div>
            <div><strong>TIMESTAMP:</strong> ${new Date().toUTCString()}</div>
            <div><strong>CLASSIFICATION:</strong> OPERATIONAL (UNRESTRICTED)</div>
            <div><strong>PLATFORM:</strong> AUV HUGIN / AQUAGUARD EDGE AI</div>
          </div>
        </div>

        <div class="report-summary-grid">
          <div class="summary-kpi red">
            <span class="val">${criticalCount}</span>
            <span class="lbl">CRITICAL HAZARDS</span>
          </div>
          <div class="summary-kpi amber">
            <span class="val">${moderateCount}</span>
            <span class="lbl">MODERATE (GHOST NETS / TIRES)</span>
          </div>
          <div class="summary-kpi green">
            <span class="val">${lowCount}</span>
            <span class="lbl">LOW / PARTICULATES</span>
          </div>
          <div class="summary-kpi cyan">
            <span class="val">${targets.length}</span>
            <span class="lbl">TOTAL TARGETS GEOLOCATED</span>
          </div>
        </div>

        <div class="report-section-title">
          <h3>1. TACTICAL TARGET MATRIX & COORDINATES</h3>
        </div>

        <table class="report-table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Target & Classification</th>
              <th>Risk Score</th>
              <th>GPS Coordinates</th>
              <th>Depth</th>
              <th>Conf.</th>
              <th>Remediation Protocol</th>
            </tr>
          </thead>
          <tbody>
            ${rowsHtml}
          </tbody>
        </table>

        <div class="report-section-title">
          <h3>2. ROV & AUV SALVAGE DEPLOYMENT PROTOCOLS</h3>
        </div>

        <div class="report-guidelines-grid">
          <div class="guideline-card">
            <h4>🔴 High-Risk UXO & Chemical Containment Protocol</h4>
            <p>Maintain 1.5 nautical mile exclusion zone. Avoid ferrous contact. Notify Maritime EOD clearance team with coordinates and shadow slant calculations.</p>
          </div>
          <div class="guideline-card">
            <h4>🟡 Ghost Gear Rotary Slit & Lift Protocol</h4>
            <p>Deploy Class III Work-ROV fitted with diamond-edge hydraulic net cutters and buoyant lift bags. Cut anchor lines first to prevent benthic coral tearing.</p>
          </div>
          <div class="guideline-card">
            <h4>✨ Microplastic & Particulate Sedimentation Dredge</h4>
            <p>Autonomous benthic suction dredge with 50-micron filtration canisters to capture primary nurdle hotspots and synthetic microfiber accumulations.</p>
          </div>
        </div>

        <div class="report-footer">
          <div>Report generated automatically by <strong>AquaGuard DeepSea AI Sonar Detection Engine</strong></div>
          <div>Validated on SeabedObjects-KLSG & Marine Debris FLS Public Datasets</div>
        </div>
      </div>
    `;

    const modalEl = document.getElementById("report-modal");
    if (modalEl) {
      modalEl.classList.add("active");
    }
  }

  printReport() {
    window.print();
  }
}

window.SonarExportEngine = SonarExportEngine;
