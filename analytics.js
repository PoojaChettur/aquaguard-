/**
 * Scyld DeepSea Sonar - Mission Analytics & Risk Matrix Engine
 * Integrates Chart.js visualizations, KPI cards, and dynamic risk scoring
 */

class SonarAnalyticsEngine {
  constructor() {
    this.taxonomyChart = null;
    this.depthRiskChart = null;
    this.severityChart = null;
  }

  calculateMissionKPIs(selectedPresetId = null) {
    const targets = selectedPresetId && selectedPresetId !== "all"
      ? window.ALL_MISSION_TARGETS.filter((t) => t.missionId === selectedPresetId)
      : window.ALL_MISSION_TARGETS;

    const totalCount = targets.length;
    const criticalCount = targets.filter((t) => t.riskLevel === "critical").length;
    const moderateCount = targets.filter((t) => t.riskLevel === "moderate").length;
    const lowCount = targets.filter((t) => t.riskLevel === "low").length;

    const avgConfidence = totalCount > 0
      ? (targets.reduce((acc, t) => acc + t.confidence, 0) / totalCount * 100).toFixed(1)
      : 0;

    const avgDepth = totalCount > 0
      ? (targets.reduce((acc, t) => acc + t.depth, 0) / totalCount).toFixed(1)
      : 0;

    // Synthetic survey area calculation
    const coverageAreaKm2 = selectedPresetId && selectedPresetId !== "all" ? 4.8 : 19.4;

    return {
      totalCount,
      criticalCount,
      moderateCount,
      lowCount,
      avgConfidence,
      avgDepth,
      coverageAreaKm2,
      targets
    };
  }

  updateKPICards(kpis) {
    const elTotal = document.getElementById("kpi-total-debris");
    const elCritical = document.getElementById("kpi-critical-hazards");
    const elCoverage = document.getElementById("kpi-survey-coverage");
    const elDepth = document.getElementById("kpi-avg-depth");
    const elConfidence = document.getElementById("kpi-ai-confidence");

    if (elTotal) elTotal.textContent = kpis.totalCount;
    if (elCritical) elCritical.textContent = kpis.criticalCount;
    if (elCoverage) elCoverage.textContent = `${kpis.coverageAreaKm2} km²`;
    if (elDepth) elDepth.textContent = `${kpis.avgDepth} m`;
    if (elConfidence) elConfidence.textContent = `${kpis.avgConfidence}%`;
  }

  renderCharts(selectedPresetId = null) {
    const kpis = this.calculateMissionKPIs(selectedPresetId);
    this.updateKPICards(kpis);

    this.renderTaxonomyChart(kpis.targets);
    this.renderDepthRiskChart(kpis.targets);
    this.renderSeverityChart(kpis);
  }

  renderTaxonomyChart(targets) {
    const ctx = document.getElementById("chart-taxonomy");
    if (!ctx) return;

    if (this.taxonomyChart) {
      this.taxonomyChart.destroy();
    }

    // Tally class categories
    const counts = {};
    targets.forEach((t) => {
      const cat = t.classCategory || "Other Anomaly";
      counts[cat] = (counts[cat] || 0) + 1;
    });

    const labels = Object.keys(counts);
    const data = Object.values(counts);

    const bgColors = [
      "#ef4444", // UXO / Hazard
      "#f59e0b", // Ghost Nets
      "#00f0ff", // Structural Wreckage
      "#10b981", // Rubber / Plastics
      "#8b5cf6", // Metallic Drums
      "#64748b"  // Other
    ];

    this.taxonomyChart = new Chart(ctx, {
      type: "doughnut",
      data: {
        labels: labels,
        datasets: [{
          data: data,
          backgroundColor: bgColors.slice(0, labels.length),
          borderColor: "#0b1329",
          borderWidth: 2,
          hoverOffset: 6
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            position: "right",
            labels: {
              color: "#94a3b8",
              font: { family: "'Inter', sans-serif", size: 11 },
              boxWidth: 12,
              padding: 10
            }
          },
          tooltip: {
            backgroundColor: "rgba(11, 19, 41, 0.95)",
            titleColor: "#00f0ff",
            bodyColor: "#f8fafc",
            borderColor: "rgba(0, 240, 255, 0.3)",
            borderWidth: 1
          }
        },
        cutout: "68%"
      }
    });
  }

  renderDepthRiskChart(targets) {
    const ctx = document.getElementById("chart-depth-risk");
    if (!ctx) return;

    if (this.depthRiskChart) {
      this.depthRiskChart.destroy();
    }

    const labels = targets.map((t) => t.id);
    const riskScores = targets.map((t) => t.riskScore);
    const depths = targets.map((t) => t.depth);

    this.depthRiskChart = new Chart(ctx, {
      type: "bar",
      data: {
        labels: labels,
        datasets: [
          {
            label: "Risk Threat Score (0-100)",
            data: riskScores,
            backgroundColor: targets.map((t) => t.riskLevel === "critical" ? "#ef4444" : (t.riskLevel === "moderate" ? "#f59e0b" : "#10b981")),
            borderRadius: 4,
            yAxisID: "y"
          },
          {
            label: "Seabed Depth (m)",
            data: depths,
            type: "line",
            borderColor: "#00f0ff",
            backgroundColor: "rgba(0, 240, 255, 0.2)",
            borderWidth: 2,
            pointBackgroundColor: "#00f0ff",
            pointRadius: 4,
            yAxisID: "y1"
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            position: "top",
            labels: {
              color: "#94a3b8",
              font: { family: "'Inter', sans-serif", size: 11 }
            }
          },
          tooltip: {
            backgroundColor: "rgba(11, 19, 41, 0.95)",
            titleColor: "#00f0ff",
            borderColor: "rgba(0, 240, 255, 0.3)",
            borderWidth: 1
          }
        },
        scales: {
          x: {
            grid: { color: "rgba(255, 255, 255, 0.05)" },
            ticks: { color: "#94a3b8", font: { family: "'JetBrains Mono', monospace", size: 10 } }
          },
          y: {
            type: "linear",
            display: true,
            position: "left",
            title: { display: true, text: "Risk Index", color: "#94a3b8" },
            grid: { color: "rgba(255, 255, 255, 0.05)" },
            ticks: { color: "#94a3b8" },
            max: 100
          },
          y1: {
            type: "linear",
            display: true,
            position: "right",
            title: { display: true, text: "Depth (meters)", color: "#00f0ff" },
            grid: { drawOnChartArea: false },
            ticks: { color: "#00f0ff" }
          }
        }
      }
    });
  }

  renderSeverityChart(kpis) {
    const ctx = document.getElementById("chart-severity");
    if (!ctx) return;

    if (this.severityChart) {
      this.severityChart.destroy();
    }

    this.severityChart = new Chart(ctx, {
      type: "polarArea",
      data: {
        labels: ["Critical (>80)", "Moderate (50-79)", "Low (<50)"],
        datasets: [{
          data: [kpis.criticalCount, kpis.moderateCount, kpis.lowCount],
          backgroundColor: [
            "rgba(239, 68, 68, 0.7)",
            "rgba(245, 158, 11, 0.7)",
            "rgba(16, 185, 129, 0.7)"
          ],
          borderColor: ["#ef4444", "#f59e0b", "#10b981"],
          borderWidth: 1.5
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            position: "bottom",
            labels: { color: "#94a3b8", font: { family: "'Inter', sans-serif", size: 11 } }
          }
        },
        scales: {
          r: {
            grid: { color: "rgba(255, 255, 255, 0.08)" },
            ticks: { display: false }
          }
        }
      }
    });
  }
}

window.SonarAnalyticsEngine = SonarAnalyticsEngine;
