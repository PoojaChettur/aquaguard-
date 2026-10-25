/**
 * Scyld DeepSea Sonar - Pitch Stretch Goals & Judge Differentiators
 * 1. Temporal Change Detection Engine
 * 2. Edge AUV Jetson Orin Hardware Telemetry Simulator
 * 3. Human-in-the-Loop (HITL) Active Learning & Re-labeling Station
 */

class SonarStretchGoals {
  constructor() {
    this.jetsonInterval = null;
    this.hitlQueue = [];
    this.isEdgeSimulating = false;
  }

  /**
   * Initialize Temporal Change Detection Slider
   */
  initChangeDetection() {
    const slider = document.getElementById("temporal-split-slider");
    const container = document.getElementById("temporal-compare-container");
    const afterImg = document.getElementById("temporal-after-img");
    const divider = document.getElementById("temporal-divider-line");

    if (!slider || !container || !afterImg) return;

    const updateSlider = (val) => {
      afterImg.style.clipPath = `polygon(${val}% 0, 100% 0, 100% 100%, ${val}% 100%)`;
      if (divider) divider.style.left = `${val}%`;
    };

    slider.addEventListener("input", (e) => {
      updateSlider(e.target.value);
    });

    updateSlider(50);
  }

  /**
   * Start Edge Jetson Orin Real-Time Hardware Telemetry Simulator
   */
  startJetsonTelemetry() {
    if (this.isEdgeSimulating) return;
    this.isEdgeSimulating = true;

    const fpsEl = document.getElementById("jetson-fps");
    const latencyEl = document.getElementById("jetson-latency");
    const powerEl = document.getElementById("jetson-power");
    const tempEl = document.getElementById("jetson-temp");
    const memoryEl = document.getElementById("jetson-mem");

    this.jetsonInterval = setInterval(() => {
      if (!this.isEdgeSimulating) return;

      const baseFps = 62.4;
      const curFps = (baseFps + (Math.random() * 2.4 - 1.2)).toFixed(1);
      const curLatency = (1000 / curFps * 0.72).toFixed(1);
      const curPower = (14.2 + (Math.random() * 0.8 - 0.4)).toFixed(1);
      const curTemp = (44.5 + (Math.random() * 0.6 - 0.3)).toFixed(1);

      if (fpsEl) fpsEl.textContent = `${curFps} FPS`;
      if (latencyEl) latencyEl.textContent = `${curLatency} ms`;
      if (powerEl) powerEl.textContent = `${curPower} W`;
      if (tempEl) tempEl.textContent = `${curTemp} °C`;
      if (memoryEl) memoryEl.textContent = `1.84 / 16.0 GB`;
    }, 400);
  }

  stopJetsonTelemetry() {
    this.isEdgeSimulating = false;
    if (this.jetsonInterval) {
      clearInterval(this.jetsonInterval);
      this.jetsonInterval = null;
    }
  }

  /**
   * Submit Human-in-the-Loop Re-annotation to Retraining Queue
   */
  submitHITLAnnotation(targetId, newClass, operatorNotes) {
    const entry = {
      id: targetId || `HITL-${Date.now().toString().slice(-4)}`,
      timestamp: new Date().toISOString(),
      originalClass: "Uncertain Acoustic Target",
      verifiedClass: newClass,
      operatorNotes: operatorNotes,
      status: "QUEUED_FOR_RETRAINING"
    };

    this.hitlQueue.unshift(entry);
    this.renderHITLQueue();
    return entry;
  }

  renderHITLQueue() {
    const listEl = document.getElementById("hitl-queue-list");
    const countEl = document.getElementById("hitl-queue-count");
    if (!listEl) return;

    if (countEl) countEl.textContent = `${this.hitlQueue.length} Queued`;

    if (this.hitlQueue.length === 0) {
      listEl.innerHTML = `<div class="text-muted text-xs p-3">Retraining queue empty. Select an uncertain detection and submit operator corrections.</div>`;
      return;
    }

    listEl.innerHTML = this.hitlQueue.map((item) => `
      <div class="hitl-queue-card">
        <div class="flex justify-between items-center mb-1">
          <span class="code-font text-xs font-bold text-accent">${item.id}</span>
          <span class="hitl-status-pill">PENDING RETRAIN</span>
        </div>
        <div class="text-xs text-white font-medium">${item.verifiedClass}</div>
        <div class="text-xs text-muted italic">"${item.operatorNotes || 'Reclassified by sonar operator'}"</div>
        <div class="text-[10px] text-gray-400 mt-1 code-font">${item.timestamp.slice(11, 19)} UTC</div>
      </div>
    `).join("");
  }
}

window.SonarStretchGoals = SonarStretchGoals;
