# AquaGuard — Manual Test Cases

| ID | Area | Steps | Expected result |
|---|---|---|---|
| TC-01 | Load | Open the app URL | Sonar AI Command loads; feed list and viewport visible |
| TC-02 | Preset feed | Click "Microplastics Plume Nurdles Bed" | Image renders; TGT-MP1 appears with Threat 86/100, Confidence 95.0% |
| TC-03 | Microplastic telemetry | Select the microplastics feed | HOTSPOT DETECTED; 18,450 part/m³; HIGH BENTHIC; PE 48 / PP 26 / PET 15 / Nylon 11 |
| TC-04 | Upload | Drop a PNG/JPG/TIFF sonar image | Image ingested, classifier runs, detections drawn |
| TC-05 | Invalid upload | Drop a .txt file | File rejected, no crash |
| TC-06 | Palette | Cycle Amber / CRT / Cyan / Greyscale | Viewport recolours each time |
| TC-07 | CLAHE | Toggle CLAHE | Shadow regions equalised; CLAHE Split view differs from original |
| TC-08 | Speckle filter | Toggle 3×3 median | Visible noise reduction |
| TC-09 | Gain | Move gain slider | Brightness changes; label updates (e.g. 1.15x) |
| TC-10 | Viewport tabs | Switch AI Detections / CLAHE Split / CAM / Optical | Each view renders without error |
| TC-11 | Neural scan | Click "Neural AI Scan" | Classifier re-runs; results refresh |
| TC-12 | Registry | Open Analytics & Registry; filter All/Critical/Moderate | 11 targets total; 4 critical; filters correct |
| TC-13 | Charts | Open Analytics | Taxonomy distribution and depth-vs-threat charts render |
| TC-14 | ROV | Open ROV Optical Station | Controls respond: pan/tilt, 1x–100x zoom, lights, lasers |
| TC-15 | Manipulator | Click Execute Subsea Remediation Protocol | Phases 1→3 progress; certificate appears |
| TC-16 | CSV export | Cleanup Plan → Download CSV | CSV downloads with target data |
| TC-17 | PDF plan | Cleanup Plan → Open Printable PDF Plan | Print dialog/preview opens with plan |
| TC-18 | Responsive | Resize to mobile width | Layout adapts, no horizontal overflow |
| TC-19 | Offline | Load once, then disconnect | Core features still run (client-side) |
