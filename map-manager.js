/**
 * AquaGuard — 100% Open-Source Bathymetric Geolocation & Swath Map Controller
 * Uses OpenStreetMap & Esri Ocean Basemaps with Zero API Keys Required
 */

class BathymetricMapManager {
  constructor(mapContainerId) {
    this.mapContainerId = mapContainerId;
    this.map = null;
    this.expandedMap = null;
    this.markerLayer = null;
    this.tracklineLayer = null;
    this.swathLayer = null;
    this.currentPreset = null;
    this.activeFilter = "all";
    this.onMarkerClickCallback = null;
  }

  initMap() {
    const container = document.getElementById(this.mapContainerId);
    if (!container) return;

    if (this.map) {
      this.map.invalidateSize();
      return;
    }

    // Initialize Leaflet Map with Open-Source Tile Layer (Zero API Keys)
    this.map = L.map(this.mapContainerId, {
      center: [54.7, 2.1],
      zoom: 7,
      zoomControl: true,
      attributionControl: false
    });

    // 100% Free OpenStreetMap Public Standard Tile Layer
    const osmTileLayer = L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
      maxZoom: 19,
      attribution: '© OpenStreetMap contributors'
    });

    osmTileLayer.addTo(this.map);

    this.markerLayer = L.layerGroup().addTo(this.map);
    this.tracklineLayer = L.layerGroup().addTo(this.map);
    this.swathLayer = L.layerGroup().addTo(this.map);

    L.control.scale({ imperial: true, metric: true, position: "bottomleft" }).addTo(this.map);

    // Multi-tick layout invalidation for smooth rendering
    [50, 200, 500, 1000].forEach((delay) => {
      setTimeout(() => {
        if (this.map) this.map.invalidateSize();
      }, delay);
    });
  }

  setPreset(preset) {
    this.currentPreset = preset;
    if (!this.map) this.initMap();
    this.renderMission(preset);
  }

  renderMission(preset) {
    if (!this.map || !preset) return;

    this.tracklineLayer.clearLayers();
    this.swathLayer.clearLayers();
    this.markerLayer.clearLayers();

    const coords = [preset.coordinates.lat, preset.coordinates.lon];

    // 1. Draw AUV Trackline & Swath Corridor
    if (preset.trackline && preset.trackline.length > 0) {
      L.polyline(preset.trackline, {
        color: "#00f0ff",
        weight: 3,
        dashArray: "6, 8",
        opacity: 0.9
      }).addTo(this.tracklineLayer);

      const swathBufferCoords = preset.trackline.map((pt) => [pt[0] + 0.0015, pt[1] + 0.0018]);
      const returnBufferCoords = [...preset.trackline].reverse().map((pt) => [pt[0] - 0.0015, pt[1] - 0.0018]);
      const fullSwathPolygon = [...swathBufferCoords, ...returnBufferCoords];

      L.polygon(fullSwathPolygon, {
        color: "#00f0ff",
        fillColor: "rgba(0, 240, 255, 0.2)",
        fillOpacity: 0.35,
        weight: 1,
        dashArray: "3, 3"
      }).addTo(this.swathLayer);

      const startIcon = L.divIcon({
        className: "auv-waypoint-icon",
        html: `<div class="waypoint-pin start"><span>AUV SWATH</span></div>`,
        iconSize: [80, 24],
        iconAnchor: [40, 12]
      });
      L.marker(preset.trackline[0], { icon: startIcon }).addTo(this.tracklineLayer);
    }

    // 2. Render Risk Pins
    const missionTargets = window.ALL_MISSION_TARGETS.filter((t) => t.missionId === preset.id);
    missionTargets.forEach((tgt) => this.addRiskMarker(tgt));

    // 3. Pan to location
    this.map.setView(coords, 13);
    setTimeout(() => this.map.invalidateSize(), 150);
  }

  renderAllGlobalTargets() {
    if (!this.map) this.initMap();
    this.markerLayer.clearLayers();
    this.tracklineLayer.clearLayers();
    this.swathLayer.clearLayers();

    const targets = window.ALL_MISSION_TARGETS;
    targets.forEach((tgt) => {
      if (this.activeFilter === "all" || tgt.riskLevel === this.activeFilter) {
        this.addRiskMarker(tgt);
      }
    });

    this.map.setView([54.0, 10.0], 5);
    setTimeout(() => this.map.invalidateSize(), 100);
  }

  addRiskMarker(target) {
    if (this.activeFilter !== "all" && target.riskLevel !== this.activeFilter) return;

    const isCritical = target.riskLevel === "critical";
    const isModerate = target.riskLevel === "moderate";

    const pulseClass = isCritical ? "pulse-critical" : (isModerate ? "pulse-moderate" : "pulse-low");
    const markerColor = isCritical ? "#ef4444" : (isModerate ? "#f59e0b" : "#00f0ff");

    const customIcon = L.divIcon({
      className: "sonar-risk-marker-container",
      html: `
        <div class="sonar-marker ${pulseClass}">
          <div class="sonar-marker-core" style="background-color: ${markerColor}; box-shadow: 0 0 14px ${markerColor};"></div>
          <div class="sonar-marker-radar" style="border-color: ${markerColor};"></div>
        </div>
      `,
      iconSize: [30, 30],
      iconAnchor: [15, 15]
    });

    const marker = L.marker([target.coordinates.lat, target.coordinates.lon], { icon: customIcon });

    const popupContent = `
      <div class="sonar-map-popup">
        <div class="popup-header" style="border-left: 3px solid ${markerColor};">
          <div class="popup-title-row">
            <span class="target-badge ${target.riskLevel}">${target.riskLevel.toUpperCase()} HAZARD</span>
            <span class="target-id">${target.id}</span>
          </div>
          <h4 class="target-label">${target.label}</h4>
        </div>
        <div class="popup-body">
          <div class="popup-meta-grid">
            <div class="meta-item">
              <span class="meta-lbl">Coordinates:</span>
              <span class="meta-val">${target.coordinates.lat.toFixed(4)}°N, ${Math.abs(target.coordinates.lon).toFixed(4)}°${target.coordinates.lon >= 0 ? 'E' : 'W'}</span>
            </div>
            <div class="meta-item">
              <span class="meta-lbl">Depth:</span>
              <span class="meta-val">${target.depth.toFixed(1)} m</span>
            </div>
            <div class="meta-item">
              <span class="meta-lbl">Confidence:</span>
              <span class="meta-val">${(target.confidence * 100).toFixed(0)}%</span>
            </div>
            <div class="meta-item">
              <span class="meta-lbl">Risk Score:</span>
              <span class="meta-val" style="color:${markerColor}; font-weight:700;">${target.riskScore}/100</span>
            </div>
          </div>
          <div class="popup-action-plan">
            <strong>Action:</strong> ${target.actionPlan}
          </div>
          <button class="popup-inspect-btn" onclick="window.app.inspectTargetFromMap('${target.id}', '${target.missionId}')">
            <span>⚡ Inspect In AI Viewport</span>
          </button>
        </div>
      </div>
    `;

    marker.bindPopup(popupContent, {
      className: "custom-sonar-leaflet-popup",
      maxWidth: 300,
      autoPanPadding: [15, 15]
    });

    marker.addTo(this.markerLayer);
  }

  filterByRisk(riskLevel) {
    this.activeFilter = riskLevel;
    if (this.currentPreset) {
      this.renderMission(this.currentPreset);
    } else {
      this.renderAllGlobalTargets();
    }
  }

  openExpandedMapModal() {
    const modal = document.getElementById("expanded-map-modal");
    if (!modal) return;
    modal.classList.add("active");

    setTimeout(() => {
      if (!this.expandedMap) {
        this.expandedMap = L.map("leaflet-expanded-sonar-map", {
          center: [54.0, 10.0],
          zoom: 6,
          attributionControl: false
        });
        // Free OpenStreetMap Tile Layer
        L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", { maxZoom: 19 }).addTo(this.expandedMap);
      }

      this.expandedMap.invalidateSize();

      window.ALL_MISSION_TARGETS.forEach((t) => {
        const markerColor = t.riskLevel === "critical" ? "#ef4444" : (t.riskLevel === "moderate" ? "#f59e0b" : "#00f0ff");
        const icon = L.divIcon({
          className: "sonar-risk-marker-container",
          html: `<div class="sonar-marker pulse-${t.riskLevel}"><div class="sonar-marker-core" style="background-color:${markerColor};"></div></div>`,
          iconSize: [24, 24],
          iconAnchor: [12, 12]
        });
        L.marker([t.coordinates.lat, t.coordinates.lon], { icon }).bindPopup(`<strong>${t.label}</strong><br>Risk: ${t.riskScore}/100<br>Depth: ${t.depth}m`).addTo(this.expandedMap);
      });
    }, 200);
  }

  closeExpandedMapModal() {
    const modal = document.getElementById("expanded-map-modal");
    if (modal) modal.classList.remove("active");
  }
}

window.BathymetricMapManager = BathymetricMapManager;
