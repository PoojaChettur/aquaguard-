/**
 * Scyld OceanGuard — AI Detection & Interactive Tactical Viewport Engine
 */

class SonarDetector {
  constructor() {
    this.currentPreset = null;
    this.customDetections = null;
    this.confidenceThreshold = 0.60;
    this.selectedTargetId = null;
    this.hoveredTargetId = null;
    this.showShadowGeometry = true;
    this.showBoundingBoxes = true;
    this.viewportMode = "detection"; // 'detection', 'split', 'heatmap', 'optical'
    this.onTargetSelectCallback = null;
  }

  setPreset(preset) {
    this.currentPreset = preset;
    this.customDetections = null;
    this.selectedTargetId = preset.detections && preset.detections.length > 0 ? preset.detections[0].id : null;
  }

  setCustomDetections(detections) {
    this.customDetections = detections;
    this.selectedTargetId = detections && detections.length > 0 ? detections[0].id : null;
  }

  getActiveDetections() {
    let list = [];
    if (this.customDetections) {
      list = this.customDetections;
    } else if (this.currentPreset && this.currentPreset.detections) {
      list = this.currentPreset.detections;
    }
    return list.filter((d) => d.confidence >= this.confidenceThreshold);
  }

  getSelectedTarget() {
    const list = this.getActiveDetections();
    if (!list || list.length === 0) return null;
    return list.find((d) => d.id === this.selectedTargetId) || list[0];
  }

  /**
   * Render Bounding Boxes & Tactical Overlay on Canvas
   */
  renderDetections(canvas, imageElement) {
    if (!canvas || !imageElement) return;

    const ctx = canvas.getContext("2d");
    const width = canvas.width;
    const height = canvas.height;

    // Draw base enhanced sonar image
    ctx.clearRect(0, 0, width, height);
    ctx.drawImage(imageElement, 0, 0, width, height);

    if (!this.showBoundingBoxes || this.viewportMode !== "detection") return;

    const detections = this.getActiveDetections();

    detections.forEach((det) => {
      const isSelected = det.id === this.selectedTargetId;
      const isHovered = det.id === this.hoveredTargetId;

      const bx = (det.bbox.x / 100) * width;
      const by = (det.bbox.y / 100) * height;
      const bw = (det.bbox.width / 100) * width;
      const bh = (det.bbox.height / 100) * height;

      const strokeColor = det.riskLevel === "critical" ? "#ef4444" : (det.riskLevel === "moderate" ? "#f59e0b" : "#10b981");

      ctx.save();

      // 1. Acoustic Shadow Vector & Sizing Badge
      if (this.showShadowGeometry && det.shadowLength_m) {
        ctx.strokeStyle = "rgba(0, 240, 255, 0.5)";
        ctx.setLineDash([4, 4]);
        ctx.lineWidth = 1.5;

        const shadowPx = (det.shadowLength_m * 4.5);
        ctx.beginPath();
        ctx.moveTo(bx + bw / 2, by + bh);
        ctx.lineTo(bx + bw / 2 + shadowPx * 0.8, by + bh + shadowPx * 0.4);
        ctx.stroke();

        ctx.setLineDash([]);
        ctx.fillStyle = "rgba(11, 19, 41, 0.9)";
        ctx.strokeStyle = "#00f0ff";
        ctx.lineWidth = 1;
        const shadowText = `Shadow: ${det.shadowLength_m}m | H≈${det.estimatedDims?.height || 1.2}m`;
        ctx.font = "10px 'JetBrains Mono', monospace";
        const stW = ctx.measureText(shadowText).width + 10;
        ctx.fillRect(bx + bw / 2 + shadowPx * 0.8 - 4, by + bh + shadowPx * 0.4 - 14, stW, 18);
        ctx.strokeRect(bx + bw / 2 + shadowPx * 0.8 - 4, by + bh + shadowPx * 0.4 - 14, stW, 18);
        ctx.fillStyle = "#00f0ff";
        ctx.fillText(shadowText, bx + bw / 2 + shadowPx * 0.8, by + bh + shadowPx * 0.4);
      }

      // 2. Main Bounding Box with Cyber Tactical Reticle
      ctx.setLineDash([]);
      ctx.strokeStyle = strokeColor;
      ctx.lineWidth = isSelected ? 3 : (isHovered ? 2.5 : 1.8);
      ctx.shadowColor = strokeColor;
      ctx.shadowBlur = isSelected ? 16 : (isHovered ? 10 : 4);

      ctx.strokeRect(bx, by, bw, bh);

      if (isSelected || isHovered) {
        ctx.fillStyle = det.riskLevel === "critical" ? "rgba(239, 68, 68, 0.18)" : "rgba(245, 158, 11, 0.15)";
        ctx.fillRect(bx, by, bw, bh);
      }

      // Corner Reticles
      const cLen = Math.min(12, bw / 4, bh / 4);
      ctx.strokeStyle = "#ffffff";
      ctx.lineWidth = 2.5;

      ctx.beginPath();
      ctx.moveTo(bx, by + cLen); ctx.lineTo(bx, by); ctx.lineTo(bx + cLen, by);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(bx + bw - cLen, by); ctx.lineTo(bx + bw, by); ctx.lineTo(bx + bw, by + cLen);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(bx, by + bh - cLen); ctx.lineTo(bx, by + bh); ctx.lineTo(bx + cLen, by + bh);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(bx + bw - cLen, by + bh); ctx.lineTo(bx + bw, by + bh); ctx.lineTo(bx + bw, by + bh - cLen);
      ctx.stroke();

      // 3. Label Badge Header
      ctx.shadowBlur = 0;
      ctx.font = "bold 11px 'Inter', sans-serif";
      const tagText = `${det.label} ${(det.confidence * 100).toFixed(0)}%`;
      const textWidth = ctx.measureText(tagText).width;
      const badgeH = 20;
      const badgeW = textWidth + 16;

      ctx.fillStyle = strokeColor;
      ctx.fillRect(bx, Math.max(0, by - badgeH), badgeW, badgeH);

      ctx.fillStyle = "#ffffff";
      ctx.fillText(tagText, bx + 8, Math.max(badgeH - 6, by - 6));

      // ID Tag Pill
      ctx.fillStyle = "rgba(11, 19, 41, 0.9)";
      ctx.fillRect(bx + badgeW + 2, Math.max(0, by - badgeH), 54, badgeH);
      ctx.fillStyle = "#94a3b8";
      ctx.font = "10px 'JetBrains Mono', monospace";
      ctx.fillText(det.id, bx + badgeW + 6, Math.max(badgeH - 6, by - 6));

      ctx.restore();
    });
  }

  handleCanvasClick(event, canvas) {
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;

    const clickX = (event.clientX - rect.left) * scaleX;
    const clickY = (event.clientY - rect.top) * scaleY;

    const detections = this.getActiveDetections();
    let clickedDet = null;

    for (let i = detections.length - 1; i >= 0; i--) {
      const det = detections[i];
      const bx = (det.bbox.x / 100) * canvas.width;
      const by = (det.bbox.y / 100) * canvas.height;
      const bw = (det.bbox.width / 100) * canvas.width;
      const bh = (det.bbox.height / 100) * canvas.height;

      if (clickX >= bx && clickX <= bx + bw && clickY >= by && clickY <= by + bh) {
        clickedDet = det;
        break;
      }
    }

    if (clickedDet) {
      this.selectedTargetId = clickedDet.id;
      if (this.onTargetSelectCallback) {
        this.onTargetSelectCallback(clickedDet);
      }
      return clickedDet;
    }
    return null;
  }
}

window.SonarDetector = SonarDetector;
