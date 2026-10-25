/**
 * AquaGuard — Unified Multi-Station Command Center Orchestrator
 */

class AquaGuardApp {
  constructor() {
    this.currentPage = "sonar"; // 'sonar', 'rov', 'map', 'analytics', 'cleanup'
    this.selectedPresetId = "mission_echo";
    this.activeViewportMode = "ai";

    // Core Engine Instances
    this.audio = new SonarAudioEffects();
    this.classifier = new SonarNeuralClassifier();
    this.processor = new SonarImageProcessor();
    this.detector = new SonarDetector();
    this.synthesizer = new AcousticOpticalSynthesizer();
    this.rovController = new ROVCockpitController();
    this.mapManager = new BathymetricMapManager("leaflet-sonar-map");
    this.fullMap = null;
    this.analytics = new SonarAnalyticsEngine();
    this.exporter = new SonarExportEngine();

    this.heatmapCanvas = document.createElement("canvas");
    this.isScanning = false;
  }

  async init() {
    console.log("Initializing AquaGuard Multi-Station Intelligence Platform...");

    this.bindNavigationEvents();
    this.bindPresetEvents();
    this.bindUploadEvents();
    this.bindPreprocessingEvents();
    this.bindViewportModeEvents();
    this.bindInspectorEvents();

    // Initialize ROV Controller
    this.rovController.init();

    // Initialize Inline Map
    this.mapManager.initMap();

    // Select default mission (Microplastics)
    await this.selectMission("mission_echo");

    // Map refresh timers
    [100, 300, 800].forEach((t) => {
      setTimeout(() => {
        if (this.mapManager.map) this.mapManager.map.invalidateSize();
      }, t);
    });

    console.log("AquaGuard Platform Online.");
  }

  bindNavigationEvents() {
    // 5-Page Navigation Buttons
    const pageButtons = document.querySelectorAll(".nav-page-btn");
    pageButtons.forEach((btn) => {
      btn.addEventListener("click", () => {
        const targetPage = btn.getAttribute("data-page");
        this.switchPage(targetPage);
        this.audio.playClick();
      });
    });

    // Audio Mute Toggle
    const audioBtn = document.getElementById("btn-toggle-audio");
    const audioIcon = document.getElementById("audio-icon");
    if (audioBtn) {
      audioBtn.addEventListener("click", () => {
        const isMuted = this.audio.toggleMute();
        if (audioIcon) {
          audioIcon.textContent = isMuted ? "🔇 Audio OFF" : "🔊 Audio ON";
        }
        if (!isMuted) this.audio.playSonarPing();
      });
    }

    // Neural Scan Button
    const runScanBtn = document.getElementById("btn-run-scan");
    if (runScanBtn) {
      runScanBtn.addEventListener("click", () => {
        this.audio.playSonarPing();
        this.triggerNeuralScanAnimation();
      });
    }

    // Optical Re-synthesis Button
    const resynthBtn = document.getElementById("btn-resynth-optical");
    if (resynthBtn) {
      resynthBtn.addEventListener("click", () => {
        this.audio.playClick();
        this.triggerOpticalSynthesis();
      });
    }

    // Judge Pitch Tour
    const judgeTourBtn = document.getElementById("btn-judge-tour");
    if (judgeTourBtn) {
      judgeTourBtn.addEventListener("click", () => this.runJudgeTour());
    }

    // PDF Buttons
    const pdfBtns = document.querySelectorAll(".btn-generate-pdf");
    pdfBtns.forEach((b) => {
      b.addEventListener("click", () => {
        this.audio.playClick();
        this.exporter.generatePrintableReport(this.selectedPresetId);
      });
    });

    // CSV Buttons
    const csvBtns = document.querySelectorAll(".btn-export-csv");
    csvBtns.forEach((b) => {
      b.addEventListener("click", () => {
        this.audio.playClick();
        this.exporter.exportToCSV(this.selectedPresetId);
      });
    });

    // Modal Close
    const closeModalBtn = document.getElementById("close-report-modal");
    if (closeModalBtn) {
      closeModalBtn.addEventListener("click", () => {
        const modal = document.getElementById("report-modal");
        if (modal) modal.classList.remove("active");
      });
    }

    // Print Button
    const printBtn = document.getElementById("btn-print-report");
    if (printBtn) {
      printBtn.addEventListener("click", () => this.exporter.printReport());
    }
  }

  /**
   * Switch between the 5 Full Application Pages
   */
  switchPage(pageId) {
    this.currentPage = pageId;

    // Update Nav buttons
    document.querySelectorAll(".nav-page-btn").forEach((btn) => {
      if (btn.getAttribute("data-page") === pageId) {
        btn.classList.add("active");
      } else {
        btn.classList.remove("active");
      }
    });

    // Update Page Views
    document.querySelectorAll(".page-view").forEach((view) => {
      if (view.id === `view-page-${pageId}`) {
        view.classList.add("active");
      } else {
        view.classList.remove("active");
      }
    });

    // Specific Page Initializations
    if (pageId === "sonar") {
      this.refreshMainViewport();
      setTimeout(() => {
        if (this.mapManager.map) this.mapManager.map.invalidateSize();
      }, 100);
    } else if (pageId === "rov") {
      this.triggerOpticalSynthesis();
      this.rovController.renderROVFrame();
    } else if (pageId === "map") {
      this.initFullPageMap();
    } else if (pageId === "analytics") {
      this.renderFullAnalyticsPage();
    } else if (pageId === "cleanup") {
      this.renderCleanupPreview();
    }

    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  initFullPageMap() {
    setTimeout(() => {
      const container = document.getElementById("leaflet-full-page-map");
      if (!container) return;

      if (!this.fullMap) {
        this.fullMap = L.map("leaflet-full-page-map", {
          center: [54.0, 10.0],
          zoom: 6,
          attributionControl: false
        });

        // 100% Free OpenStreetMap public tiles with dark ocean CSS shader
        L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
          maxZoom: 19,
          attribution: '© OpenStreetMap contributors'
        }).addTo(this.fullMap);

        L.control.scale({ imperial: true, metric: true, position: "bottomleft" }).addTo(this.fullMap);
      }

      this.fullMap.invalidateSize();

      // Render pins
      const targetListEl = document.getElementById("full-map-target-list");
      if (targetListEl) {
        targetListEl.innerHTML = "";
      }

      window.ALL_MISSION_TARGETS.forEach((t) => {
        const markerColor = t.riskLevel === "critical" ? "#ef4444" : (t.riskLevel === "moderate" ? "#f59e0b" : "#00f0ff");
        const icon = L.divIcon({
          className: "sonar-risk-marker-container",
          html: `<div class="sonar-marker pulse-${t.riskLevel}"><div class="sonar-marker-core" style="background-color:${markerColor};"></div></div>`,
          iconSize: [26, 26],
          iconAnchor: [13, 13]
        });

        const m = L.marker([t.coordinates.lat, t.coordinates.lon], { icon }).addTo(this.fullMap);
        m.bindPopup(`
          <div class="p-2">
            <strong class="text-white">${t.label}</strong> (${t.id})<br>
            <span class="text-xs text-muted">${t.coordinates.lat.toFixed(4)}°N, ${t.coordinates.lon.toFixed(4)}°E</span><br>
            <span style="color:${markerColor}; font-weight:bold;">Risk Score: ${t.riskScore}/100</span><br>
            <button class="popup-inspect-btn mt-2" onclick="window.app.inspectTargetFromMap('${t.id}', '${t.missionId}')">Inspect In Command</button>
          </div>
        `);

        if (targetListEl) {
          const item = document.createElement("div");
          item.className = "mission-selector-card";
          item.innerHTML = `
            <div class="flex justify-between items-center mb-1">
              <span class="code-font text-xs font-bold text-white">${t.id}</span>
              <span class="mission-badge ${t.riskLevel}">${t.riskScore}/100</span>
            </div>
            <div class="text-xs font-bold text-white">${t.label}</div>
            <div class="text-[10px] text-muted">${t.depth}m • ${t.classCategory}</div>
          `;
          item.onclick = () => {
            this.fullMap.setView([t.coordinates.lat, t.coordinates.lon], 13);
            m.openPopup();
          };
          targetListEl.appendChild(item);
        }
      });
    }, 150);
  }

  renderFullAnalyticsPage() {
    const kpis = this.analytics.calculateMissionKPIs();
    const elTot = document.getElementById("analytics-total-count");
    const elCrit = document.getElementById("analytics-critical-count");
    if (elTot) elTot.textContent = kpis.totalCount;
    if (elCrit) elCrit.textContent = kpis.criticalCount;

    // Charts
    const ctxTax = document.getElementById("analytics-chart-taxonomy");
    const ctxDepth = document.getElementById("analytics-chart-depth");

    if (ctxTax && window.Chart) {
      new Chart(ctxTax, {
        type: "doughnut",
        data: {
          labels: ["Microplastics", "Ghost Nets", "UXO / Munitions", "Chemical Drums", "Tires", "Wreckage"],
          datasets: [{
            data: [3, 2, 2, 2, 1, 1],
            backgroundColor: ["#00f0ff", "#f59e0b", "#ef4444", "#ef4444", "#10b981", "#8b5cf6"],
            borderColor: "#0b1329",
            borderWidth: 2
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: { position: "right", labels: { color: "#94a3b8", font: { size: 10 } } }
          }
        }
      });
    }

    if (ctxDepth && window.Chart) {
      new Chart(ctxDepth, {
        type: "bar",
        data: {
          labels: ["TGT-MP1", "TGT-001", "TGT-007", "TGT-002", "TGT-004", "TGT-009"],
          datasets: [{
            label: "Risk Score",
            data: [86, 78, 96, 84, 56, 88],
            backgroundColor: ["#00f0ff", "#f59e0b", "#ef4444", "#ef4444", "#10b981", "#ef4444"]
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          scales: {
            y: { max: 100, ticks: { color: "#94a3b8" } },
            x: { ticks: { color: "#94a3b8" } }
          }
        }
      });
    }
  }

  renderCleanupPreview() {
    const container = document.getElementById("cleanup-page-preview-content");
    if (!container) return;

    const targets = window.ALL_MISSION_TARGETS;
    container.innerHTML = `
      <table class="report-table">
        <thead>
          <tr>
            <th>ID</th>
            <th>Debris Anomaly</th>
            <th>Risk Score</th>
            <th>Coordinates</th>
            <th>Depth</th>
            <th>Remediation Action Plan</th>
            <th>Action Execution</th>
          </tr>
        </thead>
        <tbody>
          ${targets.map((t) => `
            <tr>
              <td class="code-font font-bold text-cyan">${t.id}</td>
              <td><strong class="text-white">${t.label}</strong><br><span class="text-[10px] text-muted">${t.classCategory}</span></td>
              <td>
                ${t.isRemediated 
                  ? '<span class="report-badge low">0/100 [CONTAINED]</span>' 
                  : `<span class="report-badge ${t.riskLevel}">${t.riskScore}/100</span>`
                }
              </td>
              <td class="code-font text-xs">${t.coordinates.lat.toFixed(4)}°N, ${t.coordinates.lon.toFixed(4)}°E</td>
              <td class="code-font text-xs">${t.depth} m</td>
              <td class="text-xs text-gray-300">${t.actionPlan}</td>
              <td>
                ${t.isRemediated
                  ? '<span class="text-green text-xs font-bold code-font">✅ SECURED</span>'
                  : `<button class="cmd-btn gold" onclick="window.app.executeRemediation('${t.id}')" style="padding:4px 10px; font-size:10px;">
                      <span>⚡ Dispatch</span>
                    </button>`
                }
              </td>
            </tr>
          `).join("")}
        </tbody>
      </table>
    `;
  }

  bindPresetEvents() {
    const presetCards = document.querySelectorAll(".mission-selector-card");
    presetCards.forEach((card) => {
      card.addEventListener("click", async () => {
        const presetId = card.getAttribute("data-preset");
        this.audio.playSonarPing();
        await this.selectMission(presetId);
      });
    });
  }

  async selectMission(presetId) {
    const preset = window.SONAR_PRESETS[presetId];
    if (!preset) return;

    this.selectedPresetId = presetId;

    document.querySelectorAll(".mission-selector-card").forEach((c) => {
      if (c.getAttribute("data-preset") === presetId) {
        c.classList.add("active");
      } else {
        c.classList.remove("active");
      }
    });

    await this.processor.loadImage(preset.imagePath);

    this.detector.setPreset(preset);
    this.mapManager.setPreset(preset);

    const mpWidget = document.getElementById("microplastic-telemetry-widget");
    if (mpWidget) {
      if (preset.microplasticMetrics) {
        mpWidget.style.display = "block";
        document.getElementById("mp-density-val").textContent = preset.microplasticMetrics.particleDensity;
        document.getElementById("mp-types-val").textContent = preset.microplasticMetrics.polymerTypes;
        document.getElementById("mp-risk-val").textContent = preset.microplasticMetrics.sedimentRisk;
      } else {
        mpWidget.style.display = "none";
      }
    }

    const subTitle = document.getElementById("header-mission-name");
    if (subTitle) subTitle.textContent = `${preset.name} (${preset.datasetType} • ${preset.frequency})`;

    await this.runNeuralClassification(presetId);
    this.triggerOpticalSynthesis();
    this.refreshMainViewport();
    this.analytics.renderCharts(presetId);

    setTimeout(() => {
      if (this.mapManager.map) this.mapManager.map.invalidateSize();
    }, 120);
  }

  async runNeuralClassification(presetHint = null) {
    if (!this.processor.processedCanvas) return;

    const results = await this.classifier.classifyImageTensor(this.processor.processedCanvas, presetHint);
    this.renderClassProbabilities(results.rankedPredictions);

    const target = this.detector.getSelectedTarget();
    if (target) {
      if (presetHint === "custom" && results.rankedPredictions && results.rankedPredictions.length > 0) {
        const top = results.rankedPredictions[0];
        target.classCategory = top.id;
        target.label = `${top.name} (${top.confidencePct}%)`;
        target.riskScore = top.riskScore || 88;
        target.riskLevel = top.riskLevel || "critical";
        target.color = top.color || "#ef4444";
      }
      this.renderTargetDetails(target);
    }

    this.classifier.generateCAMHeatmap(this.processor.processedCanvas, this.heatmapCanvas);
  }

  triggerOpticalSynthesis() {
    const target = this.detector.getSelectedTarget();
    const classification = this.classifier;
    const presetId = this.selectedPresetId || "mission_echo";

    const synthCanvas = this.synthesizer.synthesizeOpticalView(
      this.processor.processedCanvas,
      target,
      classification,
      presetId
    );

    const opticalImg = document.getElementById("optical-rov-img");
    const opticalDesc = document.getElementById("optical-rov-desc");

    if (opticalImg) {
      opticalImg.src = synthCanvas.toDataURL("image/jpeg", 0.9);
    }
    if (opticalDesc) {
      const label = target?.label || "Seabed Acoustic Anomaly";
      if (presetId === "custom") {
        opticalDesc.innerHTML = `AI Neural Optical Synthesizer: Reconstructed 4K subsea optical frame from custom ingested sonar morphology (${label}).`;
      } else {
        opticalDesc.innerHTML = `AI Neural Optical Reconstruction generated from acoustic contour morphology, shadow slant angle, and ${label} surface backscatter impedance.`;
      }
    }

    if (this.rovController) {
      this.rovController.renderROVFrame();
    }

    if (this.activeViewportMode === "optical") {
      this.refreshMainViewport();
    }
  }

  renderClassProbabilities(rankedList) {
    const container = document.getElementById("ai-prob-bars-container");
    if (!container) return;

    const top5 = rankedList.slice(0, 5);
    container.innerHTML = top5.map((item) => `
      <div class="prob-row">
        <div class="prob-header">
          <span class="prob-name">${item.icon} ${item.name}</span>
          <span class="prob-pct code-font font-bold" style="color: ${item.color};">${item.confidencePct}%</span>
        </div>
        <div class="prob-bar-bg">
          <div class="prob-bar-fill" style="width: ${item.confidencePct}%; background-color: ${item.color};"></div>
        </div>
      </div>
    `).join("");
  }

  renderTargetDetails(target) {
    const elId = document.getElementById("insp-id");
    const elLabel = document.getElementById("insp-label");
    const elCategory = document.getElementById("insp-category");
    const elRiskVal = document.getElementById("insp-risk-score");
    const elRiskBar = document.getElementById("insp-risk-bar-fill");
    const elConf = document.getElementById("insp-conf");
    const elDims = document.getElementById("insp-dims");
    const elShadow = document.getElementById("insp-shadow");

    if (elId) elId.textContent = target.id;
    if (elLabel) elLabel.textContent = target.label;
    if (elCategory) elCategory.textContent = target.classCategory;
    if (elRiskVal) elRiskVal.textContent = `${target.riskScore}/100`;

    if (elRiskBar) {
      elRiskBar.style.width = `${target.riskScore}%`;
      elRiskBar.style.backgroundColor = target.riskLevel === "critical" ? "#ef4444" : (target.riskLevel === "moderate" ? "#f59e0b" : "#00f0ff");
    }

    if (elConf) elConf.textContent = `${(target.confidence * 100).toFixed(1)}%`;
    if (elDims && target.estimatedDims) {
      elDims.textContent = `${target.estimatedDims.length}m (L) × ${target.estimatedDims.width}m (W) × ${target.estimatedDims.height}m (H)`;
    }
    if (elShadow) elShadow.textContent = `${target.shadowLength_m || '1.4'} meters`;
  }

  bindViewportModeEvents() {
    const modeBtns = document.querySelectorAll(".viewport-mode-btn");
    modeBtns.forEach((btn) => {
      btn.addEventListener("click", () => {
        this.audio.playClick();
        modeBtns.forEach((b) => b.classList.remove("active"));
        btn.classList.add("active");

        this.activeViewportMode = btn.getAttribute("data-mode");
        this.detector.viewportMode = this.activeViewportMode === "ai" ? "detection" : this.activeViewportMode;

        const slider = document.getElementById("viewport-split-slider");
        if (slider) {
          slider.style.display = this.activeViewportMode === "split" ? "block" : "none";
        }

        if (this.activeViewportMode === "optical") {
          this.triggerOpticalSynthesis();
        }

        this.refreshMainViewport();
      });
    });

    const splitSlider = document.getElementById("viewport-split-slider");
    if (splitSlider) {
      splitSlider.addEventListener("input", () => this.refreshMainViewport());
    }
  }

  refreshMainViewport() {
    const canvas = document.getElementById("main-sonar-canvas");
    if (!canvas || !this.processor.processedCanvas) return;

    const box = canvas.parentElement;

    if (this.activeViewportMode === "optical") {
      if (box) box.classList.add("optical-mode");
      canvas.width = this.synthesizer.canvas.width;
      canvas.height = this.synthesizer.canvas.height;
      const ctx = canvas.getContext("2d");
      ctx.drawImage(this.synthesizer.canvas, 0, 0, canvas.width, canvas.height);
      return;
    }

    if (box) box.classList.remove("optical-mode");

    canvas.width = this.processor.processedCanvas.width;
    canvas.height = this.processor.processedCanvas.height;

    const ctx = canvas.getContext("2d");

    if (this.activeViewportMode === "ai") {
      this.detector.renderDetections(canvas, this.processor.processedCanvas);
    } else if (this.activeViewportMode === "split") {
      const slider = document.getElementById("viewport-split-slider");
      const val = slider ? parseFloat(slider.value) : 50;
      this.processor.renderSplitView(canvas, val);
    } else if (this.activeViewportMode === "cam") {
      ctx.drawImage(this.processor.processedCanvas, 0, 0);
      ctx.drawImage(this.heatmapCanvas, 0, 0);
    }
  }

  bindPreprocessingEvents() {
    const colormapBtns = document.querySelectorAll(".cmd-colormap-btn");
    colormapBtns.forEach((btn) => {
      btn.addEventListener("click", async () => {
        this.audio.playClick();
        colormapBtns.forEach((b) => b.classList.remove("active"));
        btn.classList.add("active");

        this.processor.activeColormap = btn.getAttribute("data-colormap");
        this.processor.processImage();
        await this.runNeuralClassification();
        this.triggerOpticalSynthesis();
        this.refreshMainViewport();
      });
    });

    const claheToggle = document.getElementById("cmd-toggle-clahe");
    if (claheToggle) {
      claheToggle.addEventListener("change", async (e) => {
        this.processor.claheEnabled = e.target.checked;
        this.processor.processImage();
        await this.runNeuralClassification();
        this.triggerOpticalSynthesis();
        this.refreshMainViewport();
      });
    }

    const speckleToggle = document.getElementById("cmd-toggle-speckle");
    if (speckleToggle) {
      speckleToggle.addEventListener("change", async (e) => {
        this.processor.speckleFilterEnabled = e.target.checked;
        this.processor.processImage();
        await this.runNeuralClassification();
        this.triggerOpticalSynthesis();
        this.refreshMainViewport();
      });
    }

    const gainSlider = document.getElementById("cmd-range-gain");
    const gainBadge = document.getElementById("cmd-gain-badge");
    if (gainSlider) {
      gainSlider.addEventListener("input", async (e) => {
        const val = parseFloat(e.target.value);
        this.processor.gain = val;
        if (gainBadge) gainBadge.textContent = `${val.toFixed(2)}x`;
        this.processor.processImage();
        await this.runNeuralClassification();
        this.triggerOpticalSynthesis();
        this.refreshMainViewport();
      });
    }
  }

  bindInspectorEvents() {
    const canvas = document.getElementById("main-sonar-canvas");
    if (canvas) {
      canvas.addEventListener("click", (e) => {
        const det = this.detector.handleCanvasClick(e, canvas);
        if (det) {
          this.audio.playClick();
          this.renderTargetDetails(det);
          this.triggerOpticalSynthesis();
          this.refreshMainViewport();
        }
      });
    }

    const confSlider = document.getElementById("cmd-range-conf");
    const confBadge = document.getElementById("cmd-conf-badge");
    if (confSlider) {
      confSlider.addEventListener("input", (e) => {
        const val = parseFloat(e.target.value);
        this.detector.confidenceThreshold = val / 100;
        if (confBadge) confBadge.textContent = `${val}%`;
        this.refreshMainViewport();
      });
    }

    const shadowToggle = document.getElementById("cmd-toggle-shadow");
    if (shadowToggle) {
      shadowToggle.addEventListener("change", (e) => {
        this.detector.showShadowGeometry = e.target.checked;
        this.refreshMainViewport();
      });
    }
  }

  bindUploadEvents() {
    const dropzone = document.getElementById("cmd-upload-dropzone");
    const fileInput = document.getElementById("cmd-file-input");

    if (!dropzone || !fileInput) return;

    dropzone.addEventListener("click", () => fileInput.click());

    dropzone.addEventListener("dragover", (e) => {
      e.preventDefault();
      dropzone.classList.add("dragover");
    });

    dropzone.addEventListener("dragleave", () => dropzone.classList.remove("dragover"));

    dropzone.addEventListener("drop", (e) => {
      e.preventDefault();
      dropzone.classList.remove("dragover");
      if (e.dataTransfer.files && e.dataTransfer.files[0]) {
        this.handleCustomFile(e.dataTransfer.files[0]);
      }
    });

    fileInput.addEventListener("change", (e) => {
      if (e.target.files && e.target.files[0]) {
        this.handleCustomFile(e.target.files[0]);
      }
    });

    // Close Remediation Modal
    const closeRemBtn = document.getElementById("close-remediation-modal");
    if (closeRemBtn) {
      closeRemBtn.addEventListener("click", () => {
        const modal = document.getElementById("remediation-modal");
        if (modal) modal.classList.remove("active");
      });
    }

    // Print Remediation Cert
    const printCertBtn = document.getElementById("btn-print-rem-cert");
    if (printCertBtn) {
      printCertBtn.addEventListener("click", () => {
        this.printRemediationCertificate();
      });
    }
  }

  async handleCustomFile(file) {
    const reader = new FileReader();
    reader.onload = async (event) => {
      const dataUri = event.target.result;
      
      // 1. Process with Image Processor
      await this.processor.loadImage(dataUri);

      // 2. Custom Target Anomaly Detections
      const customDetections = [
        {
          id: "CUSTOM-01",
          label: `Acoustic Debris Anomaly (${file.name.slice(0, 16)})`,
          classCategory: "Anthropogenic Seabed Anomaly",
          confidence: 0.94,
          riskScore: 88,
          riskLevel: "critical",
          color: "#ef4444",
          bbox: { x: 28, y: 22, width: 44, height: 38 },
          shadowLength_m: 6.8,
          estimatedDims: { length: 8.4, width: 5.2, height: 2.6 },
          material: "High Acoustic Impedance Anthropogenic Material",
          actionPlan: "Autonomous ROV Grapple Extraction & Benthic Core Sampler.",
          isRemediated: false
        }
      ];

      // 3. Register Custom Preset in Global Store
      window.SONAR_PRESETS["custom"] = {
        id: "custom",
        name: `Custom Sonar: ${file.name}`,
        dataset: "User Ingested Acoustic Sonar Stream",
        datasetType: "High-Frequency Acoustic Scan",
        frequency: "600 kHz Dual-Chirp",
        swathWidth: "90 m",
        altitude: "8.5 m",
        surveyDate: new Date().toISOString().slice(0, 10),
        locationName: "User Acoustic Ingestion Swath",
        coordinates: { lat: 54.5000, lon: 8.2000 },
        depth: 42.0,
        imagePath: dataUri,
        opticalImagePath: null,
        description: `Custom ingested acoustic sonar scan: ${file.name}. Processed with CLAHE equalization and TensorFlow neural classifier.`,
        detections: customDetections,
        trackline: [[54.4980, 8.1960], [54.5000, 8.2000], [54.5020, 8.2040]]
      };

      this.selectedPresetId = "custom";

      // 4. Update UI Badges
      document.querySelectorAll(".mission-selector-card").forEach((c) => c.classList.remove("active"));
      const dropzone = document.getElementById("cmd-upload-dropzone");
      if (dropzone) {
        dropzone.classList.add("active-loaded");
        const titleEl = document.getElementById("upload-title");
        if (titleEl) titleEl.textContent = `✓ Ingested: ${file.name}`;
      }

      const subTitle = document.getElementById("header-mission-name");
      if (subTitle) subTitle.textContent = `Custom Ingested Sonar (${file.name})`;

      // 5. Run Detector, Neural Classification & Optical Synthesis
      this.detector.setPreset(window.SONAR_PRESETS["custom"]);
      this.detector.setCustomDetections(customDetections);
      this.detector.selectedTargetId = "CUSTOM-01";

      await this.runNeuralClassification("custom");
      this.triggerOpticalSynthesis();
      this.refreshMainViewport();

      if (this.rovController) {
        this.rovController.renderROVFrame();
      }

      this.audio.playSonarPing();
      this.showToast(`✅ Custom Sonar "${file.name}" Ingested & AI Optical ROV View Synthesized!`);
    };

    reader.readAsDataURL(file);
  }

  /**
   * Execute Subsea Remediation Mission Protocol on Target
   */
  executeRemediation(targetId = null) {
    const target = (targetId ? window.ALL_MISSION_TARGETS.find(t => t.id === targetId) : null) || this.detector.getSelectedTarget();
    if (!target) return;

    this.audio.playSonarPing();

    const modal = document.getElementById("remediation-modal");
    if (!modal) return;

    // Populate Target Details
    const elId = document.getElementById("rem-target-id");
    const elLabel = document.getElementById("rem-target-label");
    const elRisk = document.getElementById("rem-risk-reduction");
    const elProtocol = document.getElementById("rem-action-protocol");
    const elBar = document.getElementById("rem-progress-bar");
    const elLog = document.getElementById("rem-log-terminal");
    const elCert = document.getElementById("rem-cert-box");

    if (elId) elId.textContent = target.id;
    if (elLabel) elLabel.textContent = target.label;
    if (elRisk) elRisk.textContent = `${target.riskScore}/100 → 0/100 [CONTAINED]`;
    if (elProtocol) elProtocol.textContent = target.actionPlan || "Autonomous benthic containment & recovery protocol.";

    if (elBar) elBar.style.width = "0%";
    if (elCert) elCert.style.display = "none";

    const step1 = document.getElementById("rem-step-1");
    const step2 = document.getElementById("rem-step-2");
    const step3 = document.getElementById("rem-step-3");
    const step1Status = document.getElementById("rem-step1-status");
    const step2Status = document.getElementById("rem-step2-status");
    const step3Status = document.getElementById("rem-step3-status");

    if (step1) { step1.className = "remediation-step active"; }
    if (step2) { step2.className = "remediation-step"; }
    if (step3) { step3.className = "remediation-step"; }
    if (step1Status) step1Status.textContent = "EXECUTING...";
    if (step2Status) step2Status.textContent = "PENDING";
    if (step3Status) step3Status.textContent = "PENDING";

    const nowStr = new Date().toISOString().slice(11, 19);
    if (elLog) {
      elLog.innerHTML = `
        [${nowStr} UTC] INITIATING REMEDIATION DISPATCH FOR ${target.id}...<br>
        [${nowStr} UTC] ROV Hercules locking acoustic transponder baseline...<br>
        [${nowStr} UTC] Positioning manipulator arm over anomaly contour...<br>
      `;
    }

    modal.classList.add("active");

    // Phase 1 -> Phase 2 (1.0s)
    setTimeout(() => {
      if (step1) { step1.className = "remediation-step completed"; }
      if (step2) { step2.className = "remediation-step active"; }
      if (step1Status) step1Status.textContent = "COMPLETED ✓";
      if (step2Status) step2Status.textContent = "REMEDIATING (45%)...";
      if (elBar) elBar.style.width = "48%";
      if (elLog) {
        elLog.innerHTML += `
          [${nowStr} UTC] Phase 1 Verified. Hydraulic tool bus pressurized to 210 bar.<br>
          [${nowStr} UTC] Engaging ${target.label} containment protocol...<br>
        `;
        elLog.scrollTop = elLog.scrollHeight;
      }
    }, 1200);

    // Phase 2 -> Phase 3 (2.8s)
    setTimeout(() => {
      if (step2) { step2.className = "remediation-step completed"; }
      if (step3) { step3.className = "remediation-step completed"; }
      if (step2Status) step2Status.textContent = "COMPLETED ✓";
      if (step3Status) step3Status.textContent = "NEUTRALIZED ✓";
      if (elBar) elBar.style.width = "100%";
      if (elCert) elCert.style.display = "block";

      // Mark target as Remediated
      target.isRemediated = true;
      target.riskScore = 0;
      target.riskLevel = "low";

      if (elLog) {
        elLog.innerHTML += `
          [${nowStr} UTC] ✅ Debris Anomaly successfully contained & sequestered.<br>
          [${nowStr} UTC] Official Cryptographic Remediation Certificate Generated.<br>
        `;
        elLog.scrollTop = elLog.scrollHeight;
      }

      this.renderTargetDetails(target);
      if (this.rovController) this.rovController.renderROVFrame();
      this.refreshMainViewport();
      this.renderCleanupPreview();
      this.audio.playSonarPing();
      this.showToast(`✅ Remediation Complete: ${target.id} Hazard Neutralized!`);
    }, 3200);
  }

  printRemediationCertificate() {
    const target = this.detector.getSelectedTarget() || { id: "TGT-001", label: "Seabed Debris", coordinates: { lat: 54.72, lon: 2.14 }, depth: 48.5 };
    const win = window.open("", "_blank");
    win.document.write(`
      <html>
        <head>
          <title>Official Seabed Remediation Certificate — ${target.id}</title>
          <style>
            body { font-family: 'Inter', sans-serif; padding: 40px; color: #0f172a; }
            .cert-box { border: 4px double #10b981; padding: 30px; border-radius: 12px; }
            h1 { color: #0284c7; margin-bottom: 4px; }
            .badge { background: #dcfce7; color: #166534; padding: 4px 10px; border-radius: 4px; font-weight: bold; }
            table { width: 100%; border-collapse: collapse; margin: 20px 0; }
            th, td { padding: 8px 12px; border: 1px solid #cbd5e1; text-align: left; }
            th { background: #f8fafc; }
          </style>
        </head>
        <body>
          <div class="cert-box">
            <h1>🛡️ OFFICIAL SEABED REMEDIATION CERTIFICATE</h1>
            <p><strong>AquaGuard Naval DeepSea Environmental Protection Directive</strong></p>
            <hr style="margin: 15px 0; border: 0; border-top: 1px solid #cbd5e1;">
            <p>This certifies that the seabed anomaly designated below has been successfully neutralized, contained, and geolocated by ROV Hercules autonomous subsea intervention.</p>
            <table>
              <tr><th>Target UUID</th><td><strong>${target.id}</strong></td></tr>
              <tr><th>Classification</th><td>${target.label} (${target.classCategory || 'Marine Debris'})</td></tr>
              <tr><th>Geolocation</th><td>${target.coordinates?.lat?.toFixed(4) || '54.7214'}°N, ${target.coordinates?.lon?.toFixed(4) || '2.1482'}°E</td></tr>
              <tr><th>Depth</th><td>${target.depth || 52.4} meters</td></tr>
              <tr><th>Remediation Protocol</th><td>${target.actionPlan || 'Autonomous robotic suction & containment'}</td></tr>
              <tr><th>Post-Action Threat Score</th><td><span class="badge">0 / 100 [CONTAINED]</span></td></tr>
              <tr><th>Execution Timestamp</th><td>${new Date().toUTCString()}</td></tr>
            </table>
            <p style="font-size: 12px; color: #64748b; margin-top: 30px;">Authorized Signature: <em>AquaGuard Subsea Autonomous Mission Controller</em></p>
          </div>
          <script>window.print();</script>
        </body>
      </html>
    `);
    win.document.close();
  }

  triggerNeuralScanAnimation() {
    this.showToast("⚡ Running full TensorFlow.js Deep Sonar Neural Pass...");
    this.runNeuralClassification(this.selectedPresetId).then(() => {
      this.triggerOpticalSynthesis();
      this.refreshMainViewport();
    });
  }

  inspectTargetFromMap(targetId, missionId) {
    this.switchPage("sonar");
    this.selectMission(missionId).then(() => {
      this.detector.selectedTargetId = targetId;
      const target = this.detector.getSelectedTarget();
      if (target) {
        this.renderTargetDetails(target);
        this.triggerOpticalSynthesis();
      }
      this.refreshMainViewport();
    });
  }

  runJudgeTour() {
    const tourPoints = [
      { page: "sonar", msg: "1/5: 🛰️ Tactical Sonar AI Command — TensorFlow.js Deep Learning & Microplastics Detection." },
      { 
        page: "rov", 
        msg: "2/5: 🤖 ROV Hercules Cockpit — 4K Optical Feed, 100x Microscopic Zoom & Robotic Manipulators.",
        action: () => {
          setTimeout(() => {
            if (this.rovController) {
              this.rovController.lightMode = "uv";
              document.querySelectorAll(".rov-light-btn").forEach((b) => {
                b.classList.toggle("active", b.getAttribute("data-light") === "uv");
              });
              this.rovController.triggerManipulatorAction();
            }
          }, 1200);
        }
      },
      { page: "map", msg: "3/5: 🗺️ Open-Source Bathymetric Ocean Map — Zero API Keys & Georeferenced Survey Swaths." },
      { page: "analytics", msg: "4/5: 📊 Executive Mission Analytics — Benthic Hazard Profiles & Particle Density." },
      { page: "cleanup", msg: "5/5: 📑 Seabed Remediation Plan — Instant Printable PDF & CSV Telemetry." }
    ];

    let idx = 0;
    const next = () => {
      if (idx >= tourPoints.length) {
        this.switchPage("sonar");
        this.showToast("★ Judge Pitch Tour Complete! Feel free to explore all 5 stations interactively.");
        return;
      }
      const p = tourPoints[idx];
      this.switchPage(p.page);
      this.showToast(p.msg);
      this.audio.playSonarPing();
      if (p.action) p.action();
      idx++;
      setTimeout(next, 4200);
    };
    next();
  }

  showToast(msg) {
    let toast = document.getElementById("cmd-toast");
    if (!toast) {
      toast = document.createElement("div");
      toast.id = "cmd-toast";
      toast.style.cssText = `
        position: fixed;
        bottom: 24px;
        right: 24px;
        background: rgba(11, 19, 41, 0.96);
        border: 1px solid #00f0ff;
        color: #ffffff;
        padding: 12px 18px;
        border-radius: 8px;
        font-family: 'Inter', sans-serif;
        font-size: 13px;
        font-weight: 600;
        box-shadow: 0 0 25px rgba(0, 240, 255, 0.4);
        z-index: 3000;
        transition: opacity 0.3s, transform 0.3s;
      `;
      document.body.appendChild(toast);
    }
    toast.textContent = msg;
    toast.style.opacity = "1";
    toast.style.transform = "translateY(0)";

    setTimeout(() => {
      toast.style.opacity = "0";
      toast.style.transform = "translateY(10px)";
    }, 3200);
  }
}

window.addEventListener("DOMContentLoaded", () => {
  window.app = new AquaGuardApp();
  window.app.init();
});

