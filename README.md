# AquaGuard — DeepSea Sonar & Microplastics AI Intelligence Platform

Browser-based platform that ingests side-scan / forward-looking sonar imagery, classifies seabed debris and microplastic hotspots with an in-browser TensorFlow.js model, and generates remediation plans. Part of the **ELIXIR** microplastic-screening effort.

**Live demo:** https://aquaguardelixir1.netlify.app/

## Features

| Module | What it does |
|---|---|
| **Sonar AI Command** | Load sample feeds or upload your own PNG/JPG/TIFF sonar scan; view AI detections, CLAHE split, CAM heatmap and optical view |
| **Acoustic Preprocessing** | False-colour palettes (Amber Sand, CRT Phosphor, Ocean Cyan, Greyscale), CLAHE sharpening, 3×3 median speckle filter, gain control |
| **TensorFlow.js Classifier** | Client-side neural classification of targets (microplastics, ghost net, drums/tyres, naval mine, airframe wreckage) with confidence and threat score |
| **Microplastic Telemetry** | Particle density (part/m³), benthic risk level, polymer mix (PE, PP, PET, Nylon) |
| **ROV Optical Station** | Simulated ROV "Hercules" cockpit: 4K feed, pan/tilt, 1x–100x magnification, lighting suite, manipulator arm tools |
| **Ocean Swath Map** | Bathymetric swath with geolocated targets |
| **Analytics & Registry** | Taxonomy distribution, depth-vs-threat matrix, target roster (All / Critical / Moderate) |
| **Cleanup Plan** | Printable PDF mission plan, CSV export, remediation dispatch certificate |

## Quick start

### Prerequisites
- Any modern browser (Chrome, Edge, Firefox, Safari)
- Node.js 18+ (only for the local server and tests)

### Run locally
```bash
git clone https://github.com/PoojaChettur/aquaguard-.git
cd aquaguard-

# Option A: Node static server
npx serve .

# Option B: Python
python -m http.server 8080
```
Open `http://localhost:3000` (Option A) or `http://localhost:8080` (Option B).

### Environment variables
AquaGuard is a fully client-side static app. **No environment variables or API keys are required.**

| Variable | Required | Purpose |
|---|---|---|
| *(none)* | — | Inference, image processing and exports all run in the browser |

### Deploy (Netlify)
1. Push the repo to GitHub.
2. Netlify → *Add new site → Import from Git*.
3. Build command: *(empty)* · Publish directory: `.`
4. Deploy.

## Using the app
1. Open **Sonar AI Command** and pick a feed from *Acoustic Ingestion Feeds*, or drop your own sonar image.
2. Tune palette, CLAHE, speckle filter and gain.
3. Switch viewport tabs: AI Detections / CLAHE Split / Acoustic CAM Heatmap / AI Optical View.
4. Click a detected target → **Dispatch Remediation Action**.
5. Review the **Analytics & Registry** tab and export the **Cleanup Plan** (PDF/CSV).

## Sample data
See [`data/`](data/):
- `sample_targets.json` / `sample_targets.csv` — 11 synthetic geolocated targets (4 critical) matching the registry schema
- `sample_microplastic_telemetry.json` — plume telemetry example

## Tests
```bash
npm test
```
Runs schema and consistency checks on sample data (`tests/validate-sample-data.js`). Manual UI test cases are in [`tests/TEST_CASES.md`](tests/TEST_CASES.md).

## Documentation
- [Technical Design Document](docs/TECHNICAL_DESIGN.md) — architecture diagrams, data flow, models, design decisions
- [Test cases](tests/TEST_CASES.md)

## Dataset credits
Sonar sample categories follow the public KLSG sonar benchmark (FLS / SCTD sources). Bathymetry is open-source. Sample data in `data/` is synthetic and for demonstration only.

## Limitations
- ROV optical frames are AI-synthesised from acoustic morphology, not real camera footage.
- Densities and polymer splits in samples are illustrative, not field-validated.
- Not for operational navigation or munitions-clearance decisions.

## License
[MIT](LICENSE.md) © 2026 Pooja Chettur S
