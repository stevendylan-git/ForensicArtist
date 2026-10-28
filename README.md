# Forensic Face Composite Studio (PS-01)

AI-assisted eyewitness composite generation system adhering to forensic evidentiary standards, structured cognitive interviewing, region-scoped edits, and tamper-evident SHA-256 audit logging. Rewritten as a modern React SPA running on Vite.

## Core Features & Evidentiary Invariants

- **Cognitive Elicitation Console (Rule 7 Anti-Leading Protocol)**: Free recall interview interface adhering strictly to non-leading cognitive interviewing protocols. Automatically detects and blocks adversarial celebrity comparisons, logging denials into the evidentiary ledger.
- **FaceSpec Source of Truth (Rule 3 Invariant)**: Morphological state model tracking 13 facial feature categories with confidence scores (0.0–1.0), verbatim witness quotes, and source utterance IDs. Unstated features strictly remain `unknown`.
- **Procedural Forensic Canvas & Charcoal Renderer**: High-fidelity procedural rendering with anatomical guides, landmark meshes, region highlighting, and statutory evidentiary watermark banners (`AI-GENERATED APPROXIMATION - INVESTIGATIVE LEAD ONLY`).
- **3×3 Eyewitness Recognition Grid**: Candidate variation engine allowing the witness to vary a single feature while holding all other regions locked. Supports candidate selection, narrow blending, and wide re-generation.
- **Region-Scoped Locality Controls**: Lock individual facial regions to guarantee pixel-identical integrity outside the edit boundary during subsequent revisions.
- **Non-Destructive Version Timeline**: Complete version history with undo/redo, side-by-side comparative inspection, and morphological diff analysis.
- **Tamper-Evident SHA-256 Audit Ledger**: Append-only cryptographic hash chain linking every action, turn, version creation, rejection, and export back to the genesis block (`0x00`). Includes a live verification tool and tamper simulation mode.
- **RBAC & Need-to-Know Access Isolation**: Multi-role support (Investigator, Forensic Artist, Supervisor, Admin, and Auditor). Compliance Auditor role enforces biometric face image isolation while providing unrestricted audit inspection.
- **Fugitive Plastic Surgery & Alteration Matrix**: Comprehensive facial alteration forecast simulating the 8 most popular cosmetic surgical procedures fugitives undergo to evade facial recognition algorithms and eyewitness recognition (Rhinoplasty, Blepharoplasty, Buccal Fat Excision & Malar Implants, V-Line Mandibuloplasty, Genioplasty, Rhytidectomy Facelift, Cheiloplasty, and Full Disguise Overhaul). Features biometric disruption scores, interactive draggable Before/After split sliders, surgical incision guides, nodal calipers, and 1-click Law Enforcement Bulletin export.
- **Court-Admissible Export Docket**: High-resolution PNG and printable dossier export with burned-in statutory watermarks and embedded metadata chunks.

## Running Locally

```bash
npm install
npm run dev
```

App runs on port 3000 (`http://localhost:3000`).
