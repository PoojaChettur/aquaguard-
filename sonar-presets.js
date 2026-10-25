/**
 * Scyld OceanGuard — Sonar Presets, Microplastics Taxonomy & Geodata
 */

const SONAR_PRESETS = {
  mission_alpha: {
    id: "mission_alpha",
    name: "Mission Alpha: Continental Shelf",
    dataset: "SeabedObjects-KLSG & Marine Debris FLS",
    datasetType: "Side-Scan Sonar (SSS)",
    frequency: "450 kHz High-Res",
    swathWidth: "120 m",
    altitude: "12.4 m",
    surveyDate: "2026-09-18",
    locationName: "Dogger Bank Continental Shelf, North Sea",
    coordinates: { lat: 54.7214, lon: 2.1482 },
    depth: 48.5,
    imagePath: "assets/sonar/sonar_ghost_net.jpg",
    opticalImagePath: "assets/optical/optical_ghost_net.jpg",
    opticalDescription: "JAMSTEC ROV optical camera frame (Triton 4K) confirming entangled monofilament ghost net suffocating benthic coral mound.",
    description: "High-density side-scan acoustic survey of heavily fished shipping lane. Multiple high-backscatter signatures with acoustic shadows.",
    detections: [
      {
        id: "TGT-001",
        label: "Ghost Fishing Net",
        classCategory: "Ghost Gear / Entanglement",
        confidence: 0.96,
        riskScore: 78,
        riskLevel: "moderate",
        color: "#f59e0b",
        bbox: { x: 55, y: 15, width: 38, height: 35 },
        shadowLength_m: 6.2,
        estimatedDims: { length: 14.5, width: 8.2, height: 2.1 },
        material: "High-density Polyethylene & Monofilament",
        actionPlan: "Deploy ROV with hydraulic rotary cutter & heavy lift salvage balloon."
      },
      {
        id: "TGT-002",
        label: "Metallic Storage Drum",
        classCategory: "Industrial Chemical / Hazard",
        confidence: 0.91,
        riskScore: 84,
        riskLevel: "critical",
        color: "#ef4444",
        bbox: { x: 28, y: 38, width: 14, height: 18 },
        shadowLength_m: 3.8,
        estimatedDims: { length: 2.2, width: 1.4, height: 1.2 },
        material: "Corroded Carbon Steel (Pressurized)",
        actionPlan: "Hazardous containment capsule retrieval protocol."
      }
    ],
    trackline: [
      [54.7180, 2.1420],
      [54.7200, 2.1450],
      [54.7214, 2.1482],
      [54.7230, 2.1510],
      [54.7250, 2.1540]
    ]
  },

  mission_echo: {
    id: "mission_echo",
    name: "Mission Echo: Subsea Microplastic & Polymer Plume",
    dataset: "Marine Debris FLS + DeepSea Sediment Backscatter Index",
    datasetType: "Forward-Looking Acoustic Sonar (FLS)",
    frequency: "900 kHz Ultra-Def Acoustic Resonance",
    swathWidth: "45 m",
    altitude: "2.8 m",
    surveyDate: "2026-09-20",
    locationName: "Gotland Deep Benthic Depocenter, Baltic Sea",
    coordinates: { lat: 57.3200, lon: 20.0500 },
    depth: 72.4,
    imagePath: "assets/sonar/sonar_microplastics.jpg",
    opticalImagePath: "assets/optical/optical_microplastics.jpg",
    opticalDescription: "ROV Hercules 100x magnification camera confirming dense primary nurdles (0-4mm), degraded polymer fibers, and polyethylene flakes in sediment ripples.",
    description: "High-frequency multi-spectral acoustic backscatter mapping of microplastic sedimentation hotspots and particulate polymer accumulation troughs.",
    microplasticMetrics: {
      particleDensity: "18,450 particles/m³",
      polymerTypes: "PE (48%), PP (26%), PET (15%), Nylon (11%)",
      sedimentRisk: "HIGH BENTHIC BIOACCUMULATION",
      hotspotsCount: 4
    },
    detections: [
      {
        id: "TGT-MP1",
        label: "Dense Microplastic Nurdle Bed",
        classCategory: "Microplastics / Primary Polymer Pellets",
        confidence: 0.95,
        riskScore: 86,
        riskLevel: "critical",
        color: "#00f0ff",
        bbox: { x: 38, y: 35, width: 28, height: 26 },
        shadowLength_m: 1.4,
        estimatedDims: { length: 4.8, width: 3.6, height: 0.3 },
        material: "Virgin Polyethylene (PE) Nurdles & Precursors",
        actionPlan: "Autonomous benthic suction dredge with 50-micron filtration canister."
      },
      {
        id: "TGT-MP2",
        label: "Micro-Fiber Sedimentation Plume",
        classCategory: "Microplastics / Synthetic Fibers",
        confidence: 0.92,
        riskScore: 74,
        riskLevel: "moderate",
        color: "#f59e0b",
        bbox: { x: 56, y: 48, width: 32, height: 34 },
        shadowLength_m: 0.9,
        estimatedDims: { length: 6.2, width: 5.1, height: 0.2 },
        material: "Degraded Polyamide & Polyester Microfibers",
        actionPlan: "Benthic core sampling & environmental bio-barrier remediation."
      },
      {
        id: "TGT-MP3",
        label: "Degraded Polymer Flake Accumulation",
        classCategory: "Microplastics / Secondary Microplastics",
        confidence: 0.89,
        riskScore: 68,
        riskLevel: "moderate",
        color: "#10b981",
        bbox: { x: 34, y: 12, width: 22, height: 24 },
        shadowLength_m: 0.6,
        estimatedDims: { length: 3.1, width: 2.4, height: 0.15 },
        material: "Fragmented Polypropylene Packaging Flakes",
        actionPlan: "ROV benthic vacuum scoop retrieval."
      }
    ],
    trackline: [
      [57.3160, 20.0440],
      [57.3180, 20.0470],
      [57.3200, 20.0500],
      [57.3220, 20.0530],
      [57.3240, 20.0560]
    ]
  },

  mission_bravo: {
    id: "mission_bravo",
    name: "Mission Bravo: Coastal Harbor Approach",
    dataset: "Marine Debris FLS (Singh & Valdenegro-Toro 2021)",
    datasetType: "Forward-Looking Sonar (FLS)",
    frequency: "900 kHz Ultra-Def",
    swathWidth: "60 m",
    altitude: "4.2 m",
    surveyDate: "2026-09-19",
    locationName: "Outer Port Gateway, English Channel",
    coordinates: { lat: 50.8122, lon: -1.0874 },
    depth: 22.8,
    imagePath: "assets/sonar/sonar_fls_debris.jpg",
    opticalImagePath: "assets/optical/optical_metal_debris.jpg",
    opticalDescription: "ROV optical validation showing industrial waste tires, submerged oil drums, and high-density plastic container debris.",
    description: "Forward-looking acoustic sector scan targeting harbor debris bottlenecks and submerged litter.",
    detections: [
      {
        id: "TGT-004",
        label: "Industrial Vehicle Tire",
        classCategory: "Rubber & Polymer Debris",
        confidence: 0.94,
        riskScore: 56,
        riskLevel: "moderate",
        color: "#f59e0b",
        bbox: { x: 42, y: 44, width: 18, height: 20 },
        shadowLength_m: 2.1,
        estimatedDims: { length: 1.6, width: 1.6, height: 0.8 },
        material: "Vulcanized Synthetic Rubber & Steel Belting",
        actionPlan: "Standard AUV grapple recovery."
      },
      {
        id: "TGT-005",
        label: "Submerged Metal Drum",
        classCategory: "Industrial Chemical / Hazard",
        confidence: 0.92,
        riskScore: 82,
        riskLevel: "critical",
        color: "#ef4444",
        bbox: { x: 62, y: 28, width: 22, height: 26 },
        shadowLength_m: 4.4,
        estimatedDims: { length: 2.4, width: 1.8, height: 1.4 },
        material: "Ferrous Drum with Corrosive Residue Risk",
        actionPlan: "Environmental hazard containment suction bell."
      }
    ],
    trackline: [
      [50.8080, -1.0920],
      [50.8100, -1.0895],
      [50.8122, -1.0874],
      [50.8145, -1.0850],
      [50.8170, -1.0820]
    ]
  },

  mission_charlie: {
    id: "mission_charlie",
    name: "Mission Charlie: Maritime Channel UXO Anomaly",
    dataset: "SeabedObjects-KLSG & SCTD Benchmark",
    datasetType: "Side-Scan Sonar (SSS)",
    frequency: "500 kHz Chirp",
    swathWidth: "150 m",
    altitude: "15.0 m",
    surveyDate: "2026-09-20",
    locationName: "Baltic Maritime Corridor, Bornholm Basin",
    coordinates: { lat: 55.2845, lon: 15.1290 },
    depth: 64.0,
    imagePath: "assets/sonar/sonar_uxo_mine.jpg",
    opticalImagePath: "assets/optical/optical_uxo.jpg",
    opticalDescription: "ROV Triton HD Camera optical capture of historical corroded naval ground mine with bio-encrustation.",
    description: "High-risk unexploded ordnance (UXO) and legacy metallic munitions survey in critical commercial navigation channel.",
    detections: [
      {
        id: "TGT-007",
        label: "Naval Mine / UXO Hazard",
        classCategory: "Explosive Munition / Extreme Hazard",
        confidence: 0.95,
        riskScore: 96,
        riskLevel: "critical",
        color: "#ef4444",
        bbox: { x: 38, y: 32, width: 24, height: 32 },
        shadowLength_m: 8.5,
        estimatedDims: { length: 1.8, width: 1.8, height: 1.5 },
        material: "Cast Steel Shell with Torpex/TNT Core",
        actionPlan: "IMMEDIATE EOD NOTIFICATION. Establish 1.5 nm safety exclusion perimeter."
      }
    ],
    trackline: [
      [55.2800, 15.1220],
      [55.2825, 15.1255],
      [55.2845, 15.1290],
      [55.2870, 15.1330],
      [55.2895, 15.1370]
    ]
  },

  mission_delta: {
    id: "mission_delta",
    name: "Mission Delta: Industrial Wreckage Zone",
    dataset: "SeabedObjects-KLSG",
    datasetType: "Side-Scan Sonar (SSS)",
    frequency: "410 kHz High-Res",
    swathWidth: "200 m",
    altitude: "18.5 m",
    surveyDate: "2026-09-17",
    locationName: "Celtic Sea Deep Shelf",
    coordinates: { lat: 49.5240, lon: -6.8450 },
    depth: 92.4,
    imagePath: "assets/sonar/sonar_wreckage.jpg",
    opticalImagePath: "assets/optical/optical_shipwreck.jpg",
    opticalDescription: "ROV SeaViewer 4K UHD optical capture of sunken cargo vessel MV Calypso resting at 90m depth on Celtic Sea sandy abyssal sediment bed with rusticles and biofouling.",
    description: "Deep-water survey of sunken industrial vessel wreckage posing benthic obstruction hazard.",
    detections: [
      {
        id: "TGT-009",
        label: "Sunken Vessel Structural Wreckage",
        classCategory: "Large Industrial Hazard",
        confidence: 0.94,
        riskScore: 88,
        riskLevel: "critical",
        color: "#ef4444",
        bbox: { x: 26, y: 22, width: 48, height: 42 },
        shadowLength_m: 16.4,
        estimatedDims: { length: 18.2, width: 12.6, height: 4.8 },
        material: "Aviation Duralumin & Structural Steel",
        actionPlan: "Heavy salvage crane mission. Environmental containment boom."
      }
    ],
    trackline: [
      [49.5180, -6.8520],
      [49.5210, -6.8485],
      [49.5240, -6.8450],
      [49.5270, -6.8415],
      [49.5300, -6.8380]
    ]
  }
};

const ALL_MISSION_TARGETS = Object.values(SONAR_PRESETS).flatMap((preset) => {
  return preset.detections.map((d, index) => {
    const latOffset = (index - 1) * 0.0018 + (Math.random() * 0.0006 - 0.0003);
    const lonOffset = (index - 1) * 0.0022 + (Math.random() * 0.0006 - 0.0003);
    return {
      ...d,
      missionId: preset.id,
      missionName: preset.name,
      coordinates: {
        lat: preset.coordinates.lat + latOffset,
        lon: preset.coordinates.lon + lonOffset
      },
      depth: preset.depth + (index * 1.8),
      surveyDate: preset.surveyDate,
      sonarFreq: preset.frequency,
      sonarType: preset.datasetType,
      imageThumb: preset.imagePath
    };
  });
});

window.SONAR_PRESETS = SONAR_PRESETS;
window.ALL_MISSION_TARGETS = ALL_MISSION_TARGETS;
