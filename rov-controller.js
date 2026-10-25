/**
 * AquaGuard — ROV Submersible 4K Cockpit Simulator & Vision Controller
 * Features 60FPS subsea particle physics, dynamic lighting shaders,
 * authentic submarine HUD (pitch ladder, gyro compass, depth tape, sonar mini-radar),
 * 100x microscope zoom, and interactive robotic manipulator animations.
 */

class ROVCockpitController {
  constructor() {
    this.lightMode = "flood"; // 'flood', 'spot', 'uv', 'ambient', 'sit'
    this.feedSource = "hybrid"; // 'hybrid' (Real 4K Optical) vs 'neural_synth' (AI Neural Synth)
    this.zoomLevel = 1.0; // 1.0x to 100.0x
    this.panX = 0;
    this.tiltY = 0;
    this.panY = 0;
    this.isDragging = false;
    this.dragStart = { x: 0, y: 0 };

    this.showLaserGrid = true;
    this.showHUD = true;

    this.activeManipulator = "grapple"; // 'grapple', 'cutter', 'suction', 'scan'
    this.isManipulating = false;
    this.manipProgress = 0;
    this.manipTimer = null;
    this.suctionCount = 0;

    // Subsea Dynamic Particle Physics
    this.bubbles = [];
    this.marineSnow = [];
    this.initParticles();

    // Telemetry and Gyro Simulation
    this.heading = 184.2;
    this.pitch = -3.8;
    this.roll = 1.4;
    this.depth = 72.4;
    this.altitude = 1.4;
    this.thrusterPower = 64;

    this.animFrameId = null;
    this.lastTime = performance.now();
  }

  init() {
    this.bindControls();
    this.bindCanvasInteractions();
    this.startAnimationLoop();
  }

  initParticles() {
    this.bubbles = [];
    for (let i = 0; i < 28; i++) {
      this.bubbles.push({
        x: Math.random() * 960,
        y: Math.random() * 600,
        radius: 1.2 + Math.random() * 3.5,
        speedY: 0.8 + Math.random() * 1.8,
        swaySpeed: 0.02 + Math.random() * 0.03,
        swayOffset: Math.random() * Math.PI * 2,
        opacity: 0.35 + Math.random() * 0.45
      });
    }

    this.marineSnow = [];
    for (let i = 0; i < 65; i++) {
      this.marineSnow.push({
        x: Math.random() * 960,
        y: Math.random() * 600,
        size: 0.8 + Math.random() * 2.2,
        speedX: (Math.random() - 0.5) * 0.4 + 0.3,
        speedY: (Math.random() - 0.5) * 0.3 + 0.15,
        alpha: 0.2 + Math.random() * 0.6
      });
    }
  }

  startAnimationLoop() {
    const loop = (currentTime) => {
      const dt = (currentTime - this.lastTime) / 1000;
      this.lastTime = currentTime;

      this.updateSimulation(currentTime, dt);

      if (window.app?.currentPage === "rov" || window.app?.currentPage === "sonar") {
        this.renderROVFrame(currentTime);
        this.renderROVVehicleVisualizer(currentTime);
      }

      this.animFrameId = requestAnimationFrame(loop);
    };

    this.animFrameId = requestAnimationFrame(loop);
  }

  updateSimulation(timeMs, dt) {
    // 1. Update Bubbles
    this.bubbles.forEach((b) => {
      b.y -= b.speedY;
      b.x += Math.sin(timeMs * b.swaySpeed + b.swayOffset) * 0.6;
      if (b.y < -10) {
        b.y = 610;
        b.x = Math.random() * 960;
      }
    });

    // 2. Update Marine Snow
    this.marineSnow.forEach((s) => {
      s.x = (s.x + s.speedX) % 960;
      if (s.x < 0) s.x = 960;
      s.y = (s.y + s.speedY) % 600;
      if (s.y < 0) s.y = 600;
    });

    // 3. Gyroscope natural subsea motion
    this.heading = 184 + Math.sin(timeMs * 0.0008) * 1.5;
    this.pitch = -3.8 + Math.sin(timeMs * 0.0012) * 0.8;
    this.roll = 1.4 + Math.cos(timeMs * 0.0015) * 0.6;

    // 4. Manipulator progress
    if (this.isManipulating) {
      this.manipProgress = Math.min(1.0, this.manipProgress + dt * 0.65);
      if (this.activeManipulator === "suction") {
        this.suctionCount += 4;
      }
    } else {
      this.manipProgress = Math.max(0.0, this.manipProgress - dt * 0.8);
    }
  }

  bindControls() {
    // Lighting Mode buttons
    const lightBtns = document.querySelectorAll(".rov-light-btn");
    lightBtns.forEach((btn) => {
      btn.addEventListener("click", () => {
        lightBtns.forEach((b) => b.classList.remove("active"));
        btn.classList.add("active");
        this.lightMode = btn.getAttribute("data-light");
        window.app?.audio?.playClick();
      });
    });

    // Feed Source (4K Optical vs AI Synth)
    const feedBtns = document.querySelectorAll(".rov-feed-btn");
    feedBtns.forEach((btn) => {
      btn.addEventListener("click", () => {
        feedBtns.forEach((b) => b.classList.remove("active"));
        btn.classList.add("active");
        const source = btn.getAttribute("data-source");
        this.feedSource = source;
        if (window.app?.synthesizer) {
          window.app.synthesizer.setRenderMode(source);
        }
        window.app?.audio?.playClick();
      });
    });

    // Zoom Slider
    const zoomSlider = document.getElementById("rov-zoom-slider");
    const zoomBadge = document.getElementById("rov-zoom-badge");
    if (zoomSlider) {
      zoomSlider.addEventListener("input", (e) => {
        this.zoomLevel = parseFloat(e.target.value);
        if (zoomBadge) zoomBadge.textContent = `${this.zoomLevel.toFixed(1)}x`;
      });
    }

    // Quick Zoom Presets
    const quickZoomBtns = document.querySelectorAll(".quick-zoom-btn");
    quickZoomBtns.forEach((b) => {
      b.addEventListener("click", () => {
        quickZoomBtns.forEach((q) => q.classList.remove("active"));
        b.classList.add("active");
        const z = parseFloat(b.getAttribute("data-zoom") || "1.0");
        this.zoomLevel = z;
        if (zoomSlider) zoomSlider.value = z;
        if (zoomBadge) zoomBadge.textContent = `${z.toFixed(1)}x`;
        window.app?.audio?.playClick();
      });
    });

    // Laser Grid toggle
    const laserToggle = document.getElementById("rov-toggle-laser");
    if (laserToggle) {
      laserToggle.addEventListener("change", (e) => {
        this.showLaserGrid = e.target.checked;
        window.app?.audio?.playClick();
      });
    }

    // HUD toggle
    const hudToggle = document.getElementById("rov-toggle-hud");
    if (hudToggle) {
      hudToggle.addEventListener("change", (e) => {
        this.showHUD = e.target.checked;
      });
    }

    // Manipulator Tools
    const manipBtns = document.querySelectorAll(".rov-manip-btn");
    manipBtns.forEach((btn) => {
      btn.addEventListener("click", () => {
        manipBtns.forEach((b) => b.classList.remove("active"));
        btn.classList.add("active");
        this.activeManipulator = btn.getAttribute("data-tool");
        this.triggerManipulatorAction();
      });
    });

    // Virtual D-pad pan and tilt controls
    const dpadBtns = document.querySelectorAll(".rov-dpad-btn");
    dpadBtns.forEach((btn) => {
      btn.addEventListener("click", () => {
        const dir = btn.getAttribute("data-dir");
        const step = 45;
        if (dir === "up") this.tiltY += step;    // Tilt camera up
        if (dir === "down") this.tiltY -= step;  // Tilt camera down
        if (dir === "left") this.panX += step;   // Pan camera left
        if (dir === "right") this.panX -= step;  // Pan camera right
        if (dir === "center") { this.panX = 0; this.tiltY = 0; }
        this.panY = this.tiltY;
        window.app?.audio?.playClick();
      });
    });

    // 4K Snapshot Button
    const snapBtn = document.getElementById("btn-rov-snapshot");
    if (snapBtn) {
      snapBtn.addEventListener("click", () => this.captureSnapshot());
    }
  }

  bindCanvasInteractions() {
    const canvas = document.getElementById("rov-cockpit-canvas");
    if (!canvas) return;

    canvas.addEventListener("mousedown", (e) => {
      this.isDragging = true;
      this.dragStart = { x: e.clientX - this.panX, y: e.clientY - this.tiltY };
      canvas.style.cursor = "grabbing";
    });

    window.addEventListener("mousemove", (e) => {
      if (!this.isDragging) return;
      this.panX = e.clientX - this.dragStart.x;
      this.tiltY = e.clientY - this.dragStart.y;
      this.panY = this.tiltY;
    });

    window.addEventListener("mouseup", () => {
      if (this.isDragging) {
        this.isDragging = false;
        canvas.style.cursor = "crosshair";
      }
    });

    // Keyboard Arrow Keys for Pan & Tilt
    window.addEventListener("keydown", (e) => {
      if (window.app?.currentPage !== "rov") return;
      if (["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight"].includes(e.key)) {
        e.preventDefault();
        const step = 35;
        if (e.key === "ArrowUp") this.tiltY += step;
        if (e.key === "ArrowDown") this.tiltY -= step;
        if (e.key === "ArrowLeft") this.panX += step;
        if (e.key === "ArrowRight") this.panX -= step;
        this.panY = this.tiltY;
      }
    });

    // Mouse Wheel Zoom
    canvas.addEventListener("wheel", (e) => {
      e.preventDefault();
      const delta = e.deltaY < 0 ? 0.8 : -0.8;
      this.zoomLevel = Math.max(1.0, Math.min(100.0, this.zoomLevel + delta));
      const zoomSlider = document.getElementById("rov-zoom-slider");
      const zoomBadge = document.getElementById("rov-zoom-badge");
      if (zoomSlider) zoomSlider.value = this.zoomLevel;
      if (zoomBadge) zoomBadge.textContent = `${this.zoomLevel.toFixed(1)}x`;
    }, { passive: false });
  }

  renderROVFrame(timeMs = 0) {
    const canvas = document.getElementById("rov-cockpit-canvas");
    if (!canvas) return;

    // Responsive Canvas Resolution: dynamically match container width and height
    const container = canvas.parentElement;
    if (container) {
      const cRect = container.getBoundingClientRect();
      if (cRect.width > 100 && cRect.height > 100) {
        const targetW = Math.max(960, Math.round(cRect.width));
        const targetH = Math.max(560, Math.round(cRect.height));
        if (Math.abs(canvas.width - targetW) > 3 || Math.abs(canvas.height - targetH) > 3) {
          canvas.width = targetW;
          canvas.height = targetH;
        }
      }
    }

    const ctx = canvas.getContext("2d");
    const width = canvas.width;
    const height = canvas.height;

    const presetId = window.app?.selectedPresetId || "mission_echo";
    const target = window.app?.detector?.getSelectedTarget();
    const synthCanvas = window.app?.synthesizer?.synthesizeOpticalView(
      window.app?.processor?.processedCanvas,
      target,
      window.app?.classifier,
      presetId,
      timeMs
    );

    ctx.save();
    ctx.clearRect(0, 0, width, height);

    // Dynamic Pan and Tilt Clamping based on Zoom Level & Overscan factor
    const overscan = 1.38 * this.zoomLevel;
    const maxPanX = (overscan - 0.96) * width * 0.5 + (this.zoomLevel - 1) * width * 0.45;
    const maxTiltY = (overscan - 0.96) * height * 0.5 + (this.zoomLevel - 1) * height * 0.45;
    this.panX = Math.max(-maxPanX, Math.min(maxPanX, this.panX));
    this.tiltY = Math.max(-maxTiltY, Math.min(maxTiltY, this.tiltY));
    this.panY = this.tiltY;

    // Update real-time flight telemetry (pitch ladder & compass ribbon respond dynamically)
    this.pitch = -3.8 + (this.tiltY / height) * 32;
    this.heading = (184.2 - (this.panX / width) * 45 + 360) % 360;
    this.roll = 1.4 + Math.sin(timeMs * 0.0015) * 0.5 - (this.panX / width) * 2.2;

    // 1. Continuous Deep Abyssal Ocean Background (Full Screen, Shifts with Tilt)
    const skyShift = this.tiltY * 0.45;
    const oceanGrad = ctx.createLinearGradient(0, -skyShift, 0, height - skyShift);
    oceanGrad.addColorStop(0, "#010612");
    oceanGrad.addColorStop(0.3, "#041124");
    oceanGrad.addColorStop(0.7, "#0a223f");
    oceanGrad.addColorStop(1, "#06182c");
    ctx.fillStyle = oceanGrad;
    ctx.fillRect(0, 0, width, height);

    // 2. Continuous Benthic Seafloor Silt & Texture with Dynamic Tilt Horizon & Parallax Scroll
    const horizonY = height * 0.50 + this.tiltY * 0.85;
    if (horizonY < height + 60) {
      const sandGrad = ctx.createLinearGradient(0, Math.max(0, horizonY), 0, height);
      sandGrad.addColorStop(0, "#081729");
      sandGrad.addColorStop(0.3, "#10263f");
      sandGrad.addColorStop(0.7, "#173656");
      sandGrad.addColorStop(1, "#1c3f64");
      ctx.fillStyle = sandGrad;

      ctx.beginPath();
      const startY = Math.max(-60, horizonY);
      ctx.moveTo(0, startY);
      for (let x = 0; x <= width; x += 20) {
        const rippleY = startY + Math.sin((x - this.panX * 0.35) * 0.035) * 10 + Math.cos((x - this.panX * 0.35) * 0.07) * 5;
        ctx.lineTo(x, rippleY);
      }
      ctx.lineTo(width, height);
      ctx.lineTo(0, height);
      ctx.closePath();
      ctx.fill();

      // Parallax Secondary Sediment Dunes (Mathematically continuous across 100% width)
      ctx.strokeStyle = "rgba(56, 189, 248, 0.12)";
      ctx.lineWidth = 2.5;
      for (let d = 1; d <= 4; d++) {
        const dy = startY + d * (height - startY) * 0.22;
        if (dy < height + 30) {
          ctx.beginPath();
          ctx.moveTo(0, dy);
          for (let x = 0; x <= width; x += 25) {
            ctx.lineTo(x, dy + Math.sin((x - this.panX * (0.35 + d * 0.04)) * 0.024 + d * 1.5) * 8 + Math.cos((x - this.panX * 0.35) * 0.05) * 4);
          }
          ctx.stroke();
        }
      }
    }

    // 3. Draw Optical / Synthesized Base View with Overscan Projection (ZERO BLANK ENDS!)
    if (synthCanvas) {
      ctx.save();
      // Translate by pan & tilt with overscan scale to eliminate boundary voids
      ctx.translate(width / 2 + this.panX, height / 2 + this.tiltY);
      ctx.scale(overscan, overscan);
      ctx.translate(-width / 2, -height / 2);
      ctx.drawImage(synthCanvas, 0, 0, width, height);
      ctx.restore();
    }

    // 4. Subsea Dynamic Micro-Bubbles (Screen Space)
    this.renderSubseaBubbles(ctx, width, height);

    // 5. Floating Marine Snow (Screen Space)
    this.renderMarineSnowParticles(ctx, width, height);

    // 6. Subsea Lighting Shaders (Screen Space, follows camera tilt)
    this.applyLightingShaders(ctx, width, height, timeMs);

    // 7. Green Laser Scaling Reticle (10cm metric scale)
    if (this.showLaserGrid) {
      this.renderLaserReticles(ctx, width, height);
    }

    // 8. Manipulator Robotic Arm Interactive Animation
    if (this.manipProgress > 0) {
      this.renderManipulatorTool(ctx, width, height, timeMs);
    }

    // 9. Authentic Submarine Cockpit Flight HUD (Clean, High-Contrast)
    if (this.showHUD) {
      this.renderCockpitHUD(ctx, width, height, timeMs);
    }

    // 10. Sync Station 1 Tactical Viewport if in AI Optical View mode
    if (window.app?.currentPage === "sonar" && window.app?.activeViewportMode === "optical" && synthCanvas) {
      const mainCanvas = document.getElementById("main-sonar-canvas");
      if (mainCanvas) {
        if (mainCanvas.width !== synthCanvas.width || mainCanvas.height !== synthCanvas.height) {
          mainCanvas.width = synthCanvas.width;
          mainCanvas.height = synthCanvas.height;
        }
        const mctx = mainCanvas.getContext("2d");
        mctx.drawImage(synthCanvas, 0, 0, mainCanvas.width, mainCanvas.height);
      }
    }

    ctx.restore();
  }

  renderSubseaBubbles(ctx, width, height) {
    ctx.save();
    this.bubbles.forEach((b) => {
      ctx.fillStyle = `rgba(180, 245, 255, ${b.opacity})`;
      ctx.strokeStyle = "rgba(255, 255, 255, 0.75)";
      ctx.lineWidth = 0.8;
      ctx.beginPath();
      ctx.arc(b.x, b.y, b.radius, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();

      // Highlight glint
      ctx.fillStyle = "rgba(255, 255, 255, 0.95)";
      ctx.beginPath();
      ctx.arc(b.x - b.radius * 0.35, b.y - b.radius * 0.35, b.radius * 0.3, 0, Math.PI * 2);
      ctx.fill();
    });
    ctx.restore();
  }

  renderMarineSnowParticles(ctx, width, height) {
    ctx.save();
    this.marineSnow.forEach((s) => {
      ctx.fillStyle = `rgba(225, 248, 255, ${s.alpha})`;
      ctx.beginPath();
      ctx.arc(s.x, s.y, s.size, 0, Math.PI * 2);
      ctx.fill();
    });
    ctx.restore();
  }

  applyLightingShaders(ctx, width, height, timeMs) {
    ctx.save();

    if (this.lightMode === "uv") {
      // ─── 365nm UV SPECTRAL FLUORESCENCE ENGINE ───────────────────────────
      // Step 1: Deep UV blacklight atmosphere overlay
      ctx.globalCompositeOperation = "multiply";
      ctx.fillStyle = "rgba(4, 1, 11, 0.88)";
      ctx.fillRect(0, 0, width, height);

      // Step 2: UV ambient purple haze
      ctx.globalCompositeOperation = "screen";
      const uvAtmo = ctx.createRadialGradient(width * 0.5, height * 0.4, 10, width * 0.5, height * 0.5, width * 0.75);
      uvAtmo.addColorStop(0, "rgba(90, 20, 180, 0.30)");
      uvAtmo.addColorStop(0.5, "rgba(50, 0, 120, 0.15)");
      uvAtmo.addColorStop(1, "transparent");
      ctx.fillStyle = uvAtmo;
      ctx.fillRect(0, 0, width, height);

      // Step 3: Scattered microplastic nurdle fluorescence (neon cyan/magenta/chartreuse)
      ctx.globalCompositeOperation = "screen";
      const nurdles = [
        { x: 0.28, y: 0.62, c: "0, 240, 255",   r: 14 },
        { x: 0.44, y: 0.71, c: "255, 0, 127",    r: 10 },
        { x: 0.60, y: 0.65, c: "118, 255, 3",    r: 12 },
        { x: 0.35, y: 0.58, c: "0, 240, 255",    r:  8 },
        { x: 0.55, y: 0.74, c: "255, 0, 127",    r:  7 },
        { x: 0.70, y: 0.60, c: "118, 255, 3",    r:  9 },
        { x: 0.22, y: 0.78, c: "0, 240, 255",    r:  6 },
        { x: 0.80, y: 0.68, c: "255, 180, 0",    r:  8 },
        { x: 0.48, y: 0.80, c: "200, 50, 255",   r: 11 },
        { x: 0.65, y: 0.55, c: "0, 240, 255",    r:  7 },
      ];
      const uvPulse = 0.75 + 0.25 * Math.sin(timeMs * 0.0022);
      nurdles.forEach(n => {
        const nx = n.x * width  + Math.sin(timeMs * 0.0007 + n.x * 10) * 3;
        const ny = n.y * height + Math.cos(timeMs * 0.0009 + n.y * 10) * 2;
        const ng = ctx.createRadialGradient(nx, ny, 1, nx, ny, n.r * 2.5);
        ng.addColorStop(0, `rgba(${n.c}, ${0.95 * uvPulse})`);
        ng.addColorStop(0.35, `rgba(${n.c}, ${0.55 * uvPulse})`);
        ng.addColorStop(1, "transparent");
        ctx.fillStyle = ng;
        ctx.beginPath();
        ctx.arc(nx, ny, n.r * 2.5, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = `rgba(${n.c}, 0.95)`;
        ctx.beginPath();
        ctx.arc(nx, ny, n.r * 0.35, 0, Math.PI * 2);
        ctx.fill();
      });

      // Step 4: GFP Bio-fluorescent coral / algae clusters (electric green)
      ctx.globalCompositeOperation = "screen";
      const coralY = height * 0.78;
      const coralPoints = [0.18, 0.32, 0.50, 0.68, 0.82];
      coralPoints.forEach((cx2, i) => {
        const px = cx2 * width + Math.sin(timeMs * 0.0005 + i) * 4;
        const py = coralY + Math.cos(timeMs * 0.0006 + i) * 3;
        const coralR = (24 + i * 6) * (0.85 + 0.15 * Math.sin(timeMs * 0.001 + i));
        const cg = ctx.createRadialGradient(px, py, 2, px, py, coralR);
        cg.addColorStop(0, "rgba(0, 255, 102, 0.90)");
        cg.addColorStop(0.4, "rgba(0, 255, 102, 0.40)");
        cg.addColorStop(1, "transparent");
        ctx.fillStyle = cg;
        ctx.beginPath();
        ctx.arc(px, py, coralR, 0, Math.PI * 2);
        ctx.fill();
      });

      // Step 5: Hydrocarbon / petroleum fluorescent plume ribbon (neon yellow-green)
      ctx.globalCompositeOperation = "screen";
      ctx.save();
      ctx.beginPath();
      const plX = width * 0.52, plY = height * 0.58;
      ctx.moveTo(plX, plY);
      for (let i = 1; i <= 18; i++) {
        const t = i / 18;
        const wx = plX + Math.sin(t * Math.PI * 2.2 + timeMs * 0.0008) * 28 * t;
        const wy = plY - t * height * 0.28;
        ctx.lineTo(wx, wy);
      }
      ctx.strokeStyle = `rgba(180, 255, 0, ${0.38 + 0.12 * Math.sin(timeMs * 0.0015)})`;
      ctx.lineWidth = 6;
      ctx.shadowColor = "rgba(180, 255, 0, 0.65)";
      ctx.shadowBlur = 14;
      ctx.stroke();
      ctx.restore();

      // Step 6: UV spectral HUD badge
      ctx.globalCompositeOperation = "source-over";
      ctx.save();
      const badgeX = width * 0.5, badgeY = 28;
      const badgeW = 380, badgeH = 22;
      ctx.fillStyle = "rgba(80, 0, 160, 0.82)";
      ctx.beginPath();
      ctx.roundRect(badgeX - badgeW / 2, badgeY - badgeH / 2, badgeW, badgeH, 11);
      ctx.fill();
      ctx.strokeStyle = `rgba(255, 0, 200, ${0.7 + 0.3 * Math.sin(timeMs * 0.003)})`;
      ctx.lineWidth = 1.5;
      ctx.stroke();
      ctx.fillStyle = `rgba(255, 0, 200, ${0.85 + 0.15 * Math.sin(timeMs * 0.003)})`;
      ctx.font = "bold 10px 'JetBrains Mono', monospace";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText("UV 365nm SPECTRAL FLUORESCENCE // STOKES SHIFT ACTIVE", badgeX, badgeY);
      ctx.restore();

    } else if (this.lightMode === "spot") {
      // Focused 15-degree penetration spotlight
      ctx.globalCompositeOperation = "multiply";
      ctx.fillStyle = "rgba(2, 6, 18, 0.75)";
      ctx.fillRect(0, 0, width, height);

      ctx.globalCompositeOperation = "screen";
      const spotGrad = ctx.createRadialGradient(width / 2 + this.panX * 0.2, height / 2 + this.tiltY * 0.2, 30, width / 2, height / 2, width * 0.42);
      spotGrad.addColorStop(0, "rgba(255, 255, 255, 0.75)");
      spotGrad.addColorStop(0.4, "rgba(56, 189, 248, 0.35)");
      spotGrad.addColorStop(0.85, "rgba(2, 132, 199, 0.06)");
      spotGrad.addColorStop(1, "transparent");
      ctx.fillStyle = spotGrad;
      ctx.fillRect(0, 0, width, height);

    } else if (this.lightMode === "sit") {
      // SIT Low-Light Sensor (Tactical Green Night Vision)
      ctx.globalCompositeOperation = "color";
      ctx.fillStyle = "rgba(34, 197, 94, 0.85)";
      ctx.fillRect(0, 0, width, height);

      ctx.globalCompositeOperation = "source-over";
      ctx.fillStyle = "rgba(0, 0, 0, 0.2)";
      for (let y = 0; y < height; y += 4) {
        ctx.fillRect(0, y, width, 1.5);
      }

    } else if (this.lightMode === "ambient") {
      // Natural Ambient Benthic Mode
      ctx.globalCompositeOperation = "multiply";
      ctx.fillStyle = "rgba(4, 14, 32, 0.55)";
      ctx.fillRect(0, 0, width, height);

    } else {
      // Dual Floodlights (Default)
      ctx.globalCompositeOperation = "screen";
      const floodGrad = ctx.createRadialGradient(width * 0.5, height * 0.5, 40, width * 0.5, height * 0.5, width * 0.65);
      floodGrad.addColorStop(0, "rgba(255, 255, 255, 0.22)");
      floodGrad.addColorStop(0.5, "rgba(56, 189, 248, 0.08)");
      floodGrad.addColorStop(1, "transparent");
      ctx.fillStyle = floodGrad;
      ctx.fillRect(0, 0, width, height);
    }

    ctx.restore();
  }

  renderLaserReticles(ctx, width, height) {
    ctx.save();
    ctx.globalCompositeOperation = "source-over";

    const cx = width / 2;
    const cy = height / 2;
    const laserSpacing = 85;

    // Dual Green Laser Dots with high diffraction bloom
    ctx.fillStyle = "#22c55e";
    ctx.shadowColor = "#4ade80";
    ctx.shadowBlur = 14;

    ctx.beginPath();
    ctx.arc(cx - laserSpacing, cy, 4, 0, Math.PI * 2);
    ctx.arc(cx + laserSpacing, cy, 4, 0, Math.PI * 2);
    ctx.fill();

    // Scale Bracket and Measurement
    ctx.shadowBlur = 0;
    ctx.strokeStyle = "rgba(74, 222, 128, 0.8)";
    ctx.lineWidth = 1.5;

    ctx.beginPath();
    ctx.moveTo(cx - laserSpacing, cy - 8); ctx.lineTo(cx - laserSpacing, cy + 8);
    ctx.moveTo(cx + laserSpacing, cy - 8); ctx.lineTo(cx + laserSpacing, cy + 8);
    ctx.moveTo(cx - laserSpacing, cy); ctx.lineTo(cx + laserSpacing, cy);
    ctx.stroke();

    ctx.fillStyle = "#4ade80";
    ctx.font = "bold 10px 'JetBrains Mono', monospace";
    ctx.textAlign = "center";
    const scaledCm = (10 / this.zoomLevel).toFixed(1);
    ctx.fillText(`◄ ${scaledCm} cm CALIBRATED LASER RETICLE ►`, cx, cy + 24);

    // Crosshairs
    ctx.strokeStyle = "rgba(74, 222, 128, 0.45)";
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(cx - 25, cy); ctx.lineTo(cx - 8, cy);
    ctx.moveTo(cx + 8, cy); ctx.lineTo(cx + 25, cy);
    ctx.moveTo(cx, cy - 25); ctx.lineTo(cx, cy - 8);
    ctx.moveTo(cx, cy + 8); ctx.lineTo(cx, cy + 25);
    ctx.stroke();

    ctx.restore();
  }

  /**
   * Authentic Submarine Cockpit Flight HUD
   */
  renderCockpitHUD(ctx, width, height, timeMs) {
    ctx.save();
    ctx.globalCompositeOperation = "source-over"; // Ensure clean source-over overlay

    const target = window.app?.detector?.getSelectedTarget();
    const depthVal = target?.depth || this.depth;

    // 1. Top Artificial Horizon / Compass Ribbon
    this.renderTopCompassTape(ctx, width, this.heading);

    // 2. Pitch Ladder (Artificial Horizon Rungs)
    this.renderPitchLadder(ctx, width, height, this.pitch, this.roll);

    // 3. Right Depth Gauge Tape
    this.renderDepthTape(ctx, width, height, depthVal, this.altitude);

    // 4. Left Telemetry Glass Card
    ctx.beginPath();
    ctx.fillStyle = "rgba(3, 10, 26, 0.88)";
    ctx.strokeStyle = "rgba(0, 240, 255, 0.4)";
    ctx.lineWidth = 1;
    ctx.roundRect(16, 16, 260, 68, 8);
    ctx.fill();
    ctx.stroke();

    ctx.textAlign = "left";
    ctx.font = "bold 11px 'JetBrains Mono', monospace";
    ctx.fillStyle = "#00f0ff";
    ctx.fillText("ROV HERCULES // CAM 1 4K", 28, 34);

    ctx.font = "10px 'JetBrains Mono', monospace";
    ctx.fillStyle = "#cbd5e1";
    ctx.fillText(`DEPTH: ${depthVal.toFixed(1)}m  |  ALT: ${this.altitude.toFixed(1)}m`, 28, 50);
    ctx.fillText(`PITCH: ${this.pitch.toFixed(1)}°  |  ROLL: ${this.roll.toFixed(1)}°  |  440V DC`, 28, 66);

    // 5. Right Camera Telemetry Glass Card
    ctx.beginPath();
    ctx.fillStyle = "rgba(3, 10, 26, 0.88)";
    ctx.strokeStyle = "rgba(0, 240, 255, 0.4)";
    ctx.lineWidth = 1;
    ctx.roundRect(width - 240, 16, 224, 68, 8);
    ctx.fill();
    ctx.stroke();

    // Red recording beacon
    const blink = Math.sin(timeMs * 0.005) > 0;
    ctx.fillStyle = blink ? "#ef4444" : "#7f1d1d";
    ctx.beginPath();
    ctx.arc(width - 224, 32, 4.5, 0, Math.PI * 2);
    ctx.fill();

    ctx.font = "bold 11px 'JetBrains Mono', monospace";
    ctx.fillStyle = "#ffffff";
    ctx.fillText("4K 60FPS // LIVE REC", width - 212, 36);

    ctx.font = "10px 'JetBrains Mono', monospace";
    ctx.fillStyle = "#cbd5e1";
    ctx.fillText(`ZOOM: ${this.zoomLevel.toFixed(1)}x MAGNIFICATION`, width - 224, 50);
    ctx.fillText(`LIGHT: ${this.lightMode.toUpperCase()}  |  FEED: ${this.feedSource.toUpperCase()}`, width - 224, 66);

    // 6. Bottom Target Inspection Card & Remediation Quick Trigger
    if (target) {
      const bannerW = Math.min(480, width - 40);
      ctx.beginPath();
      ctx.fillStyle = "rgba(3, 10, 26, 0.92)";
      ctx.strokeStyle = target.isRemediated ? "#10b981" : (target.riskLevel === "critical" ? "#ef4444" : "#00f0ff");
      ctx.lineWidth = 1.5;
      ctx.roundRect(20, height - 74, bannerW, 56, 8);
      ctx.fill();
      ctx.stroke();

      ctx.fillStyle = "#ffffff";
      ctx.font = "bold 12px 'Inter', sans-serif";
      const remLabel = target.isRemediated ? "✅ [REMEDIATED / SECURED]" : `[${target.id}]`;
      ctx.fillText(`${target.label} ${remLabel}`, 32, height - 48);

      ctx.font = "10px 'JetBrains Mono', monospace";
      ctx.fillStyle = target.isRemediated ? "#10b981" : (target.riskLevel === "critical" ? "#ef4444" : "#f59e0b");
      const threatText = target.isRemediated ? "THREAT: 0/100 [CONTAINED]" : `THREAT: ${target.riskScore}/100 [${target.riskLevel.toUpperCase()}]`;
      ctx.fillText(`${threatText}  |  CONF: ${(target.confidence * 100).toFixed(1)}%  |  ${target.material || 'Polymer'}`, 32, height - 30);
    }

    // 7. Corner Tactical Cockpit Frame Brackets
    ctx.strokeStyle = "rgba(0, 240, 255, 0.55)";
    ctx.lineWidth = 2;
    const bLen = 30;
    // Top-left
    ctx.beginPath(); ctx.moveTo(8, 8 + bLen); ctx.lineTo(8, 8); ctx.lineTo(8 + bLen, 8); ctx.stroke();
    // Top-right
    ctx.beginPath(); ctx.moveTo(width - 8 - bLen, 8); ctx.lineTo(width - 8, 8); ctx.lineTo(width - 8, 8 + bLen); ctx.stroke();
    // Bottom-left
    ctx.beginPath(); ctx.moveTo(8, height - 8 - bLen); ctx.lineTo(8, height - 8); ctx.lineTo(8 + bLen, height - 8); ctx.stroke();
    // Bottom-right
    ctx.beginPath(); ctx.moveTo(width - 8 - bLen, height - 8); ctx.lineTo(width - 8, height - 8); ctx.lineTo(width - 8, height - 8 - bLen); ctx.stroke();

    ctx.restore();
  }

  renderTopCompassTape(ctx, width, heading) {
    const cx = width / 2;
    const y = 28;
    const tapeWidth = 240;

    ctx.beginPath();
    ctx.fillStyle = "rgba(3, 10, 26, 0.88)";
    ctx.strokeStyle = "rgba(0, 240, 255, 0.4)";
    ctx.lineWidth = 1;
    ctx.roundRect(cx - tapeWidth / 2, 10, tapeWidth, 34, 6);
    ctx.fill();
    ctx.stroke();

    // Center Heading Triangle
    ctx.fillStyle = "#00f0ff";
    ctx.beginPath();
    ctx.moveTo(cx, y + 12);
    ctx.lineTo(cx - 5, y + 6);
    ctx.lineTo(cx + 5, y + 6);
    ctx.closePath();
    ctx.fill();

    // Heading Tick Marks
    ctx.font = "9px 'JetBrains Mono', monospace";
    ctx.textAlign = "center";
    for (let deg = -60; deg <= 60; deg += 15) {
      const curDeg = Math.round((heading + deg + 360) % 360);
      const tickX = cx + (deg / 60) * (tapeWidth * 0.44);

      ctx.strokeStyle = deg === 0 ? "#00f0ff" : "rgba(148, 163, 184, 0.5)";
      ctx.lineWidth = deg === 0 ? 2 : 1;
      ctx.beginPath();
      ctx.moveTo(tickX, y - 6);
      ctx.lineTo(tickX, y - (deg % 30 === 0 ? 12 : 8));
      ctx.stroke();

      if (deg % 30 === 0) {
        let cardinal = `${curDeg}°`;
        if (curDeg === 0 || curDeg === 360) cardinal = "N";
        if (curDeg === 90) cardinal = "E";
        if (curDeg === 180) cardinal = "S";
        if (curDeg === 270) cardinal = "W";

        ctx.fillStyle = deg === 0 ? "#00f0ff" : "#94a3b8";
        ctx.fillText(cardinal, tickX, y + 6);
      }
    }
  }

  renderPitchLadder(ctx, width, height, pitch, roll) {
    ctx.save();
    const cx = width / 2;
    const cy = height / 2;

    ctx.translate(cx, cy);
    ctx.rotate(roll * (Math.PI / 180));

    ctx.strokeStyle = "rgba(0, 240, 255, 0.3)";
    ctx.lineWidth = 1.2;
    ctx.font = "8px 'JetBrains Mono', monospace";
    ctx.fillStyle = "rgba(0, 240, 255, 0.6)";

    // Pitch ladder rungs (+10, +5, 0, -5, -10)
    [-10, -5, 5, 10].forEach((p) => {
      const yOffset = (p - pitch) * 8;
      if (Math.abs(yOffset) < 140) {
        const rungW = p % 10 === 0 ? 45 : 30;
        ctx.beginPath();
        // Left rung
        ctx.moveTo(-rungW, yOffset);
        ctx.lineTo(-15, yOffset);
        ctx.lineTo(-15, yOffset + (p > 0 ? 4 : -4));
        // Right rung
        ctx.moveTo(15, yOffset + (p > 0 ? 4 : -4));
        ctx.lineTo(15, yOffset);
        ctx.lineTo(rungW, yOffset);
        ctx.stroke();

        ctx.textAlign = "right";
        ctx.fillText(`${Math.abs(p)}°`, -rungW - 4, yOffset + 3);
        ctx.textAlign = "left";
        ctx.fillText(`${Math.abs(p)}°`, rungW + 4, yOffset + 3);
      }
    });

    ctx.restore();
  }

  renderDepthTape(ctx, width, height, depth, altitude) {
    ctx.save();
    const x = width - 42;
    const cy = height / 2;
    const tapeH = 180;

    ctx.beginPath();
    ctx.fillStyle = "rgba(3, 10, 26, 0.75)";
    ctx.strokeStyle = "rgba(0, 240, 255, 0.35)";
    ctx.roundRect(x - 22, cy - tapeH / 2, 38, tapeH, 6);
    ctx.fill();
    ctx.stroke();

    ctx.font = "9px 'JetBrains Mono', monospace";
    ctx.textAlign = "center";
    ctx.fillStyle = "#00f0ff";
    ctx.fillText("DEPTH", x - 3, cy - tapeH / 2 + 14);
    ctx.fillText("M", x - 3, cy + tapeH / 2 - 8);

    // Current Depth Indicator
    ctx.fillStyle = "#ffffff";
    ctx.font = "bold 10px 'JetBrains Mono', monospace";
    ctx.fillText(`${depth.toFixed(1)}`, x - 3, cy + 4);

    ctx.strokeStyle = "#00f0ff";
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(x - 20, cy); ctx.lineTo(x + 14, cy);
    ctx.stroke();

    ctx.restore();
  }

  triggerManipulatorAction() {
    this.isManipulating = true;
    this.manipProgress = 0.05;

    if (this.manipTimer) clearTimeout(this.manipTimer);

    const toolName = 
      this.activeManipulator === "cutter" ? "Hydraulic Rotary Net Cutter" : 
      this.activeManipulator === "suction" ? "50-Micron Benthic Microplastic Vacuum Canister" : 
      this.activeManipulator === "scan" ? "Calibrated 3D Volumetric Laser Scanner" : "Heavy Debris Grapple Claw";

    window.app?.audio?.playClick();
    window.app?.showToast(`🦾 ROV Tool Engaged: ${toolName}`);

    this.manipTimer = setTimeout(() => {
      this.isManipulating = false;
      window.app?.showToast(`✅ ROV Action Cycle Completed: ${toolName}`);
    }, 4500);
  }

  renderManipulatorTool(ctx, width, height, timeMs) {
    ctx.save();
    const progress = this.manipProgress; // 0 to 1

    const baseX = width * 0.88;
    const baseY = height * 1.05;
    const targetX = width * 0.52;
    const targetY = height * 0.58;

    // Interpolated Arm Reach
    const currentX = baseX + (targetX - baseX) * progress;
    const currentY = baseY + (targetY - baseY) * progress;
    const elbowX = (baseX + currentX) * 0.5 + 40;
    const elbowY = (baseY + currentY) * 0.5 + 50;

    // Titanium Hydraulic Arm Segments
    ctx.strokeStyle = "#1e293b";
    ctx.lineWidth = 14;
    ctx.lineCap = "round";
    ctx.beginPath();
    ctx.moveTo(baseX, baseY);
    ctx.quadraticCurveTo(elbowX, elbowY, currentX, currentY);
    ctx.stroke();

    ctx.strokeStyle = "#0284c7";
    ctx.lineWidth = 6;
    ctx.stroke();

    // Hydraulic Pistons
    ctx.strokeStyle = "#00f0ff";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(baseX - 10, baseY);
    ctx.lineTo(elbowX - 6, elbowY);
    ctx.lineTo(currentX - 6, currentY);
    ctx.stroke();

    // End Effector Tool
    if (this.activeManipulator === "cutter") {
      // ── HYDRAULIC ROTARY CUTTER: Full traversal + kerf + severance ─────────
      const sliceW = 110;
      const sliceStartX = targetX - sliceW * 0.5;
      const bladeX = sliceStartX + Math.min(progress, 1.0) * sliceW;
      const bladeY = currentY;

      // Move the arm tip to follow blade X
      const cutCurrentX = bladeX;

      // 1. Glowing kerf line (start → blade position)
      if (progress > 0.05) {
        const kerfGrad = ctx.createLinearGradient(sliceStartX, bladeY, cutCurrentX, bladeY);
        kerfGrad.addColorStop(0,   "rgba(255, 69, 0, 0.0)");
        kerfGrad.addColorStop(0.3, "rgba(245, 158, 11, 0.75)");
        kerfGrad.addColorStop(0.85,"rgba(239, 68, 68, 0.90)");
        kerfGrad.addColorStop(1,   "rgba(255, 255, 180, 1.0)");
        ctx.save();
        ctx.strokeStyle = kerfGrad;
        ctx.lineWidth = 3.5;
        ctx.shadowColor = "#f59e0b";
        ctx.shadowBlur = 12;
        ctx.beginPath();
        ctx.moveTo(sliceStartX, bladeY);
        ctx.lineTo(cutCurrentX, bladeY);
        ctx.stroke();
        // hot incandescent line core
        ctx.strokeStyle = "rgba(255, 240, 200, 0.85)";
        ctx.lineWidth = 1.2;
        ctx.beginPath();
        ctx.moveTo(sliceStartX, bladeY);
        ctx.lineTo(cutCurrentX, bladeY);
        ctx.stroke();
        ctx.restore();
      }

      // 2. Spinning diamond blade disc at blade position
      const angle = (timeMs * 0.055) % (Math.PI * 2);
      ctx.save();
      ctx.translate(cutCurrentX, bladeY);
      ctx.rotate(angle);
      // Outer steel disc
      const bladeGrad = ctx.createRadialGradient(0, 0, 2, 0, 0, 22);
      bladeGrad.addColorStop(0, "#e2e8f0");
      bladeGrad.addColorStop(0.6, "#94a3b8");
      bladeGrad.addColorStop(1, "#475569");
      ctx.fillStyle = bladeGrad;
      ctx.beginPath();
      ctx.arc(0, 0, 22, 0, Math.PI * 2);
      ctx.fill();
      // Diamond teeth on rim
      for (let t = 0; t < 8; t++) {
        const ta = (t / 8) * Math.PI * 2;
        ctx.fillStyle = "#f59e0b";
        ctx.beginPath();
        ctx.arc(Math.cos(ta) * 20, Math.sin(ta) * 20, 3.5, 0, Math.PI * 2);
        ctx.fill();
      }
      // Arbor hub
      ctx.fillStyle = "#1e293b";
      ctx.beginPath();
      ctx.arc(0, 0, 5, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();

      // 3. High-velocity directional spark shower
      const sparkColors = ["#fff7ed","#f59e0b","#ef4444","#fde68a","#ffedd5"];
      for (let p = 0; p < 14; p++) {
        const seed = (timeMs * 0.003 + p * 37.1) % 1.0;
        const ang  = -0.3 + seed * 0.9; // mostly forward/downward
        const dist = 12 + seed * 55;
        const sx = cutCurrentX + Math.cos(ang) * dist;
        const sy = bladeY      + Math.sin(ang) * dist + seed * 18;
        const sz = 1 + seed * 2.5;
        ctx.fillStyle = sparkColors[p % sparkColors.length];
        ctx.globalAlpha = Math.max(0, 1.0 - dist / 65);
        ctx.beginPath();
        ctx.arc(sx, sy, sz, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.globalAlpha = 1.0;

      // 4. Object severance split (progress > 0.80)
      if (progress > 0.80) {
        const splitAmt = (progress - 0.80) / 0.20 * 38; // 0 → 38 px
        ctx.save();
        ctx.globalAlpha = 0.55;
        // Left half silhouette drifts left
        ctx.fillStyle = "rgba(30, 80, 120, 0.70)";
        ctx.beginPath();
        ctx.ellipse(targetX - splitAmt, bladeY + 10, 28, 18, 0, 0, Math.PI * 2);
        ctx.fill();
        // Right half drifts right
        ctx.fillStyle = "rgba(30, 80, 120, 0.70)";
        ctx.beginPath();
        ctx.ellipse(targetX + splitAmt, bladeY + 10, 28, 18, 0, 0, Math.PI * 2);
        ctx.fill();
        // Gap glow
        ctx.globalAlpha = 0.6;
        ctx.strokeStyle = "rgba(255, 200, 80, 0.85)";
        ctx.lineWidth = 2;
        ctx.shadowColor = "#f59e0b";
        ctx.shadowBlur = 10;
        ctx.beginPath();
        ctx.moveTo(targetX, bladeY - 20);
        ctx.lineTo(targetX, bladeY + 30);
        ctx.stroke();
        ctx.restore();
      }

    } else if (this.activeManipulator === "suction") {
      // 50-Micron Vacuum Nozzle & Vortex
      ctx.fillStyle = "#0284c7";
      ctx.beginPath();
      ctx.ellipse(currentX, currentY, 20, 28, -0.4, 0, Math.PI * 2);
      ctx.fill();

      // Suction Vortex Cone
      ctx.fillStyle = "rgba(0, 240, 255, 0.25)";
      ctx.beginPath();
      ctx.moveTo(currentX, currentY);
      ctx.lineTo(currentX - 60, currentY - 40);
      ctx.lineTo(currentX - 40, currentY + 60);
      ctx.closePath();
      ctx.fill();

      // Microplastic Particles into Canister
      const colors = ["#00f0ff", "#ec4899", "#f59e0b", "#10b981", "#ffffff"];
      for (let n = 0; n < 10; n++) {
        const frac = ((timeMs * 0.002 + n * 0.1) % 1.0);
        const nx = (currentX - 50) + frac * 50;
        const ny = (currentY - 20) + frac * 20;
        ctx.fillStyle = colors[n % colors.length];
        ctx.beginPath();
        ctx.arc(nx, ny, 2.5, 0, Math.PI * 2);
        ctx.fill();
      }

    } else if (this.activeManipulator === "scan") {
      // 3D Laser Volumetric Grid
      ctx.strokeStyle = "rgba(0, 240, 255, 0.75)";
      ctx.lineWidth = 1.5;
      for (let g = -3; g <= 3; g++) {
        ctx.beginPath();
        ctx.moveTo(currentX - 60, currentY + g * 15);
        ctx.lineTo(currentX + 60, currentY + g * 15);
        ctx.stroke();
      }

    } else {
      // Heavy Hydraulic Grapple Claw
      ctx.strokeStyle = "#38bdf8";
      ctx.lineWidth = 5;
      const clawOpen = Math.sin(timeMs * 0.006) * 12 + 16;
      ctx.beginPath();
      ctx.moveTo(currentX, currentY);
      ctx.lineTo(currentX - clawOpen, currentY - 25);
      ctx.lineTo(currentX - clawOpen * 0.6, currentY - 35);
      ctx.moveTo(currentX, currentY);
      ctx.lineTo(currentX + clawOpen, currentY - 25);
      ctx.lineTo(currentX + clawOpen * 0.6, currentY - 35);
      ctx.stroke();
    }

    // Active Tool Label
    ctx.fillStyle = "#00f0ff";
    ctx.font = "bold 11px 'JetBrains Mono', monospace";
    ctx.fillText(`TOOL ENGAGED: ${this.activeManipulator.toUpperCase()} (${Math.round(progress * 100)}%)`, currentX - 100, currentY - 45);

    ctx.restore();
  }

  /**
   * Render Interactive ROV Hercules Submersible 3D Isometric Visualizer
   */
  renderROVVehicleVisualizer(timeMs = 0) {
    const canvas = document.getElementById("rov-vehicle-canvas");
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    const width = canvas.width;
    const height = canvas.height;

    ctx.clearRect(0, 0, width, height);

    const cx = width / 2;
    const cy = height / 2 + 15;

    // Background Cyber Grid
    ctx.strokeStyle = "rgba(0, 240, 255, 0.08)";
    ctx.lineWidth = 1;
    for (let x = 0; x < width; x += 22) {
      ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, height); ctx.stroke();
    }
    for (let y = 0; y < height; y += 22) {
      ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(width, y); ctx.stroke();
    }

    ctx.save();
    ctx.translate(cx, cy);
    ctx.rotate(this.roll * 0.02);

    // Chassis Shadow
    ctx.fillStyle = "rgba(0, 0, 0, 0.6)";
    ctx.beginPath();
    ctx.ellipse(0, 48, 75, 20, 0, 0, Math.PI * 2);
    ctx.fill();

    // Titanium Lower Frame
    ctx.fillStyle = "#0f172a";
    ctx.beginPath();
    ctx.roundRect(-58, -20, 116, 56, 8);
    ctx.fill();
    ctx.strokeStyle = "#00f0ff";
    ctx.lineWidth = 1.5;
    ctx.stroke();

    // Safety Yellow Syntactic Buoyancy Pack
    const yellowGrad = ctx.createLinearGradient(-50, -45, 50, -20);
    yellowGrad.addColorStop(0, "#f59e0b");
    yellowGrad.addColorStop(0.5, "#fbbf24");
    yellowGrad.addColorStop(1, "#d97706");
    ctx.fillStyle = yellowGrad;
    ctx.beginPath();
    ctx.roundRect(-52, -46, 104, 34, 6);
    ctx.fill();

    // ROV Hercules Branding
    ctx.fillStyle = "#040810";
    ctx.font = "bold 9px 'Montserrat', sans-serif";
    ctx.textAlign = "center";
    ctx.fillText("HERCULES // 4000M", 0, -25);

    // Dual 4K Camera Pods with glowing lenses
    ctx.fillStyle = "#020617";
    ctx.beginPath();
    ctx.arc(-22, 14, 9, 0, Math.PI * 2);
    ctx.arc(22, 14, 9, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = "#00f0ff";
    ctx.lineWidth = 1.5;
    ctx.stroke();

    ctx.fillStyle = "#00f0ff";
    ctx.beginPath();
    ctx.arc(-22, 14, 4, 0, Math.PI * 2);
    ctx.arc(22, 14, 4, 0, Math.PI * 2);
    ctx.fill();

    // 4x Vector Thrusters with animated spinning blades
    const thrusterPositions = [
      { x: -70, y: -25 },
      { x: 70, y: -25 },
      { x: -70, y: 22 },
      { x: 70, y: 22 }
    ];

    thrusterPositions.forEach((tp) => {
      ctx.fillStyle = "#0f172a";
      ctx.beginPath();
      ctx.roundRect(tp.x - 10, tp.y - 14, 20, 28, 4);
      ctx.fill();
      ctx.strokeStyle = "#38bdf8";
      ctx.lineWidth = 1.2;
      ctx.stroke();

      const propAngle = (timeMs * 0.02) % Math.PI;
      ctx.strokeStyle = "#00f0ff";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(tp.x - Math.cos(propAngle) * 7, tp.y - Math.sin(propAngle) * 7);
      ctx.lineTo(tp.x + Math.cos(propAngle) * 7, tp.y + Math.sin(propAngle) * 7);
      ctx.stroke();
    });

    // Dual Forward LED Floodlight Beams
    ctx.fillStyle = "rgba(0, 240, 255, 0.14)";
    ctx.beginPath();
    ctx.moveTo(-24, 18);
    ctx.lineTo(-65, 75);
    ctx.lineTo(0, 75);
    ctx.closePath();
    ctx.fill();

    ctx.beginPath();
    ctx.moveTo(24, 18);
    ctx.lineTo(65, 75);
    ctx.lineTo(0, 75);
    ctx.closePath();
    ctx.fill();

    // Tether Umbilical Line entering top
    ctx.strokeStyle = "#f97316";
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(0, -46);
    ctx.bezierCurveTo(15, -70, -10, -90, 5, -110);
    ctx.stroke();

    ctx.restore();

    // Submersible Telemetry Badges (clean layout)
    ctx.fillStyle = "#00f0ff";
    ctx.font = "bold 10px 'JetBrains Mono', monospace";
    ctx.textAlign = "left";
    ctx.fillText("STATUS: 6-AXIS THRUST LOCK", 12, 18);

    ctx.fillStyle = "#cbd5e1";
    ctx.font = "9px 'JetBrains Mono', monospace";
    ctx.fillText(`POWER: ${this.thrusterPower}%  |  TEMP: 4.2°C  |  TENSION: 142N`, 12, 32);
  }

  captureSnapshot() {
    const canvas = document.getElementById("rov-cockpit-canvas");
    if (!canvas) return;

    const dataUri = canvas.toDataURL("image/jpeg", 0.95);
    const link = document.createElement("a");
    link.download = `AquaGuard_ROV_Inspection_4K_${new Date().toISOString().slice(0, 10)}.jpg`;
    link.href = dataUri;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    window.app?.audio?.playClick();
    window.app?.showToast("📷 4K ROV High-Resolution Optical Frame Saved!");
  }
}

window.ROVCockpitController = ROVCockpitController;
