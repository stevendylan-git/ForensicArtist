import { FaceSpec } from '../types';

export interface SurgicalProcedure {
  id: string;
  name: string;
  medicalName: string;
  category: 'MIDFACE' | 'UPPER_FACE' | 'LOWER_THIRD' | 'COMPREHENSIVE';
  biometricDisruption: number; // 0 - 100%
  primaryNodalPoint: string;
  description: string;
  criminalEvasionRationale: string;
  forensicDetectionNotes: string;
  morphParams: {
    noseThin?: number;
    noseTipLift?: number;
    eyeLift?: number;
    eyeAperture?: number;
    cheekHollow?: number;
    cheekboneLift?: number;
    jawNarrow?: number;
    chinLengthen?: number;
    lipVolume?: number;
    skinSmooth?: number;
    browElevation?: number;
    hairToneShift?: string;
  };
  promptModifier: string;
}

export const POPULAR_SURGICAL_PROCEDURES: SurgicalProcedure[] = [
  {
    id: 'rhinoplasty',
    name: 'Rhinoplasty (Nose Reshaping & Bridge Reduction)',
    medicalName: 'Reduction & Open Tip Rhinoplasty',
    category: 'MIDFACE',
    biometricDisruption: 86,
    primaryNodalPoint: 'Subnasale & Pronasale Coordinates',
    description: 'Surgical excision of the dorsal hump, narrowing of the lateral cartilaginous vault, and upward rotation of the nasal tip.',
    criminalEvasionRationale: 'The nose serves as the central focal point for human eyewitness recall and 3D facial recognition algorithms. A reshaped, thinner nose reduces immediate recognition by up to 60%.',
    forensicDetectionNotes: 'Check for columellar transverse incision scarring, supra-alar indentations, and unnaturally rigid tip projection on oblique lighting.',
    morphParams: {
      noseThin: 0.72,
      noseTipLift: 0.85,
    },
    promptModifier: 'refined narrow nasal bridge, reduced dorsal hump, smaller pointed nasal tip, elevated nasolabial angle, post-rhinoplasty cosmetic appearance',
  },
  {
    id: 'blepharoplasty',
    name: 'Blepharoplasty & Epicanthoplasty (Eyelid Alteration)',
    medicalName: 'Upper/Lower Blepharoplasty with Lateral Canthopexy',
    category: 'UPPER_FACE',
    biometricDisruption: 78,
    primaryNodalPoint: 'Endocanthion & Exocanthion Intercanthal Vectors',
    description: 'Excision of redundant palpebral skin, removal of orbital fat herniation, and upward lateral re-anchoring of the outer eye corners.',
    criminalEvasionRationale: 'Modifies the distinctive hooded or tired look of suspect eyes into alert, almond-shaped apertures. Severely impacts automated iris/ocular boundary detection.',
    forensicDetectionNotes: 'Look for fine incision lines in the supratarsal crease, subtle lateral canthal webbing, and decreased natural eyelid crease depth.',
    morphParams: {
      eyeLift: 0.65,
      eyeAperture: 0.80,
    },
    promptModifier: 'almond-shaped lifted eyelids, no eyelid hooding, smooth youthful periorbital region, elevated lateral canthal tilt, post-blepharoplasty eyes',
  },
  {
    id: 'buccal_malar',
    name: 'Buccal Fat Removal & Malar Implants (Cheek Reshaping)',
    medicalName: 'Bichectomy & Submalar Alloplastic Augmentation',
    category: 'MIDFACE',
    biometricDisruption: 82,
    primaryNodalPoint: 'Zygion to Gonion Craniofacial Ratio',
    description: 'Partial removal of the buccal fat pad from the mid-cheek combined with synthetic silicone implants or dermal filler over the zygomatic bone.',
    criminalEvasionRationale: 'Transforms a round, full, or rectangular face into an angular, sculpted, and hollowed contour, drastically confounding CCTV facial bounding boxes.',
    forensicDetectionNotes: 'Observe distinctive sub-zygomatic concavity (cheek hollows) inconsistent with the suspect’s overall body mass index.',
    morphParams: {
      cheekHollow: 0.85,
      cheekboneLift: 0.75,
    },
    promptModifier: 'high sculpted cheekbones, deep hollowed cheeks, sharp zygomatic definition, sculpted sunken midface contour, buccal fat removal',
  },
  {
    id: 'mandibuloplasty',
    name: 'V-Line Mandibuloplasty (Jawline Contouring & Shaving)',
    medicalName: 'Mandibular Angle Ostectomy & Corticectomy',
    category: 'LOWER_THIRD',
    biometricDisruption: 91,
    primaryNodalPoint: 'Bigonial Breadth & Mandibular Arc',
    description: 'Surgical shaving and recontouring of the lateral jaw angles to soften square mandibular corners into a slender V-shaped lower contour.',
    criminalEvasionRationale: 'Criminals with prominent square or wide jaws frequently target this surgery to dramatically alter facial gender cues and craniometric width-to-height ratio.',
    forensicDetectionNotes: 'Examine panoramic dental X-rays for loss of the natural gonial angle notch; external palpation reveals an acute continuous taper.',
    morphParams: {
      jawNarrow: 0.70,
      chinLengthen: 0.40,
    },
    promptModifier: 'tapered slender V-line jaw, shaved jaw angles, no square jawline, delicate tapered lower facial third, post-mandibuloplasty',
  },
  {
    id: 'genioplasty',
    name: 'Genioplasty & Chin Augmentation',
    medicalName: 'Sliding Osteotomy / Alloplastic Chin Implantation',
    category: 'LOWER_THIRD',
    biometricDisruption: 74,
    primaryNodalPoint: 'Pogonion & Gnathion Projection Coordinates',
    description: 'Advancement osteotomy or medpor/silicone implantation to significantly advance, lengthen, or sculpt a cleft or recessed chin.',
    criminalEvasionRationale: 'Eliminates weak chin profile or adds masculine/feminine projection, throwing off profile-view CCTV surveillance match algorithms.',
    forensicDetectionNotes: 'Inspect submental crease for transverse incision scar; observe unnatural anterior pogonion protrusion when smiling.',
    morphParams: {
      chinLengthen: 0.80,
      jawNarrow: 0.20,
    },
    promptModifier: 'strong projected chin, refined chin apex, prominent forward mandibular projection, surgically enhanced chin pad',
  },
  {
    id: 'rhytidectomy',
    name: 'Rhytidectomy & Brow Lift (Age Reversal Facelift)',
    medicalName: 'High-SMAS Facelift with Endoscopic Forehead Lift',
    category: 'UPPER_FACE',
    biometricDisruption: 88,
    primaryNodalPoint: 'Soft-Tissue Envelope Elasticity & Glabella Tension',
    description: 'Deep-plane repositioning of facial superficial musculoaponeurotic system (SMAS), redraping skin, smoothing nasolabial grooves, and elevating brows.',
    criminalEvasionRationale: 'Reduces apparent visual age by 10 to 15 years, causing law enforcement APB alerts looking for an older subject to disregard the fugitive.',
    forensicDetectionNotes: 'Pre-auricular and post-auricular hairline scars, pulled tragus cartilage deformity, and flattened sideburn hair vectors.',
    morphParams: {
      skinSmooth: 0.90,
      browElevation: 0.75,
    },
    promptModifier: 'tight smooth youthful facial skin, lifted forehead, no wrinkles or nasolabial folds, elevated brow arch, 15 years younger appearance, post-facelift',
  },
  {
    id: 'cheiloplasty',
    name: 'Cheiloplasty & Lip Reshaping (Lip Thinning / Augmentation)',
    medicalName: 'Vermilion Resection or Deep Sublabial Augmentation',
    category: 'LOWER_THIRD',
    biometricDisruption: 69,
    primaryNodalPoint: 'Stomion, Cheilion & Philtral Column Geometry',
    description: 'Surgical excision of vermilion tissue to thin prominent lips, or subcutaneous filler volumization to alter the oral fissure width and cupid\'s bow.',
    criminalEvasionRationale: 'Alters distinct mouth expressions and lip proportions, which are primary focal elements during conversational witness interviews.',
    forensicDetectionNotes: 'Look for intraoral mucosal surgical suture tracks or unnatural "duck-bill" vermilion border shelf under directional light.',
    morphParams: {
      lipVolume: 0.85,
    },
    promptModifier: 'plump defined vermilion border, accentuated cupid\'s bow, altered lip volume, smooth refined oral fissure contour',
  },
  {
    id: 'comprehensive_evasion',
    name: 'Full Fugitive Evasion Package (Multi-Procedure Overhaul)',
    medicalName: 'Combined Maxillofacial, Rhinoplasty & Soft-Tissue Reconstruction',
    category: 'COMPREHENSIVE',
    biometricDisruption: 97,
    primaryNodalPoint: 'Global Craniometric Metric & Nodal Mesh Invalidation',
    description: 'Extensive multi-stage reconstructive cosmetic surgery combining rhinoplasty, buccal fat excision, V-line jaw contouring, blepharoplasty, and restyled hair.',
    criminalEvasionRationale: 'Maximum evasion protocol utilized by high-profile transnational fugitives. Invalidates legacy mugshots and human eyewitness line-ups entirely.',
    forensicDetectionNotes: 'Multiple matching surgical access scars around ears, columella, and intraoral vestibule; dramatic divergence from baseline biometrics.',
    morphParams: {
      noseThin: 0.75,
      noseTipLift: 0.80,
      eyeLift: 0.70,
      cheekHollow: 0.85,
      jawNarrow: 0.75,
      chinLengthen: 0.60,
      skinSmooth: 0.85,
      browElevation: 0.60,
      hairToneShift: 'dark_to_light',
    },
    promptModifier: 'complete forensic surgical alteration disguise, refined thin nose, high hollowed cheeks, tapered V-line jawline, lifted eyes, modern hairstyle, dramatic appearance change',
  },
];

/**
 * Procedurally applies surgical morphological alteration onto an HTML5 Canvas image
 * Provides real-time, zero-latency visual simulations with authentic anatomical displacement,
 * cosmetic shading, and optional forensic incision/landmark overlay guides.
 */
export function renderSurgicalTransformation(
  sourceCanvasOrImage: HTMLCanvasElement | HTMLImageElement,
  targetCanvas: HTMLCanvasElement,
  procedure: SurgicalProcedure,
  options: {
    showSurgicalCalipers?: boolean;
    showIncisionGuides?: boolean;
    showBeforeAfterSplit?: boolean;
    splitPosition?: number; // 0.0 - 1.0 (defaults to 0.5)
  } = {}
) {
  const ctx = targetCanvas.getContext('2d');
  if (!ctx) return;

  const w = targetCanvas.width;
  const h = targetCanvas.height;

  // Clear target canvas
  ctx.clearRect(0, 0, w, h);

  // 1. Draw source baseline image
  ctx.drawImage(sourceCanvasOrImage, 0, 0, w, h);

  const {
    showSurgicalCalipers = false,
    showIncisionGuides = false,
    showBeforeAfterSplit = false,
    splitPosition = 0.5,
  } = options;

  const centerX = w / 2;
  const centerY = h / 2;

  // Save base context state
  ctx.save();

  // If before/after split is requested, clip right side for transformation
  if (showBeforeAfterSplit) {
    const splitX = w * splitPosition;
    ctx.beginPath();
    ctx.rect(splitX, 0, w - splitX, h);
    ctx.clip();
  }

  const p = procedure.morphParams;

  // A. Buccal Fat Removal / Hollow Cheeks Transformation
  if (p.cheekHollow) {
    const intensity = p.cheekHollow;
    // Darken cheek hollows (zygomatic arch shadow)
    const leftCheekGrad = ctx.createRadialGradient(
      centerX - w * 0.17, centerY + h * 0.08, w * 0.02,
      centerX - w * 0.17, centerY + h * 0.08, w * 0.14
    );
    leftCheekGrad.addColorStop(0, `rgba(40, 25, 15, ${0.45 * intensity})`);
    leftCheekGrad.addColorStop(0.6, `rgba(40, 25, 15, ${0.20 * intensity})`);
    leftCheekGrad.addColorStop(1, 'rgba(40, 25, 15, 0)');

    ctx.fillStyle = leftCheekGrad;
    ctx.beginPath();
    ctx.ellipse(centerX - w * 0.17, centerY + h * 0.08, w * 0.10, h * 0.09, -0.3, 0, Math.PI * 2);
    ctx.fill();

    const rightCheekGrad = ctx.createRadialGradient(
      centerX + w * 0.17, centerY + h * 0.08, w * 0.02,
      centerX + w * 0.17, centerY + h * 0.08, w * 0.14
    );
    rightCheekGrad.addColorStop(0, `rgba(40, 25, 15, ${0.45 * intensity})`);
    rightCheekGrad.addColorStop(0.6, `rgba(40, 25, 15, ${0.20 * intensity})`);
    rightCheekGrad.addColorStop(1, 'rgba(40, 25, 15, 0)');

    ctx.fillStyle = rightCheekGrad;
    ctx.beginPath();
    ctx.ellipse(centerX + w * 0.17, centerY + h * 0.08, w * 0.10, h * 0.09, 0.3, 0, Math.PI * 2);
    ctx.fill();

    // Malar cheekbone highlights
    ctx.fillStyle = `rgba(255, 255, 255, ${0.30 * intensity})`;
    ctx.beginPath();
    ctx.ellipse(centerX - w * 0.19, centerY + h * 0.02, w * 0.06, h * 0.03, -0.4, 0, Math.PI * 2);
    ctx.fill();

    ctx.beginPath();
    ctx.ellipse(centerX + w * 0.19, centerY + h * 0.02, w * 0.06, h * 0.03, 0.4, 0, Math.PI * 2);
    ctx.fill();
  }

  // B. Rhinoplasty Transformation (Narrow bridge & refined tip)
  if (p.noseThin) {
    const thinAmt = p.noseThin;
    // Shade lateral nasal walls to simulate narrowed bone pyramid
    const leftNasalShade = ctx.createLinearGradient(
      centerX - w * 0.07, centerY - h * 0.05,
      centerX - w * 0.02, centerY + h * 0.06
    );
    leftNasalShade.addColorStop(0, `rgba(50, 30, 20, ${0.35 * thinAmt})`);
    leftNasalShade.addColorStop(1, 'rgba(50, 30, 20, 0)');

    ctx.fillStyle = leftNasalShade;
    ctx.beginPath();
    ctx.moveTo(centerX - w * 0.06, centerY - h * 0.05);
    ctx.lineTo(centerX - w * 0.015, centerY - h * 0.05);
    ctx.lineTo(centerX - w * 0.02, centerY + h * 0.08);
    ctx.lineTo(centerX - w * 0.05, centerY + h * 0.08);
    ctx.closePath();
    ctx.fill();

    const rightNasalShade = ctx.createLinearGradient(
      centerX + w * 0.07, centerY - h * 0.05,
      centerX + w * 0.02, centerY + h * 0.06
    );
    rightNasalShade.addColorStop(0, `rgba(50, 30, 20, ${0.35 * thinAmt})`);
    rightNasalShade.addColorStop(1, 'rgba(50, 30, 20, 0)');

    ctx.fillStyle = rightNasalShade;
    ctx.beginPath();
    ctx.moveTo(centerX + w * 0.06, centerY - h * 0.05);
    ctx.lineTo(centerX + w * 0.015, centerY - h * 0.05);
    ctx.lineTo(centerX + w * 0.02, centerY + h * 0.08);
    ctx.lineTo(centerX + w * 0.05, centerY + h * 0.08);
    ctx.closePath();
    ctx.fill();

    // Refined narrow nasal dorsal highlight beam
    const dorsalHighlight = ctx.createLinearGradient(
      centerX, centerY - h * 0.06,
      centerX, centerY + h * 0.07
    );
    dorsalHighlight.addColorStop(0, `rgba(255, 255, 255, ${0.40 * thinAmt})`);
    dorsalHighlight.addColorStop(1, `rgba(255, 255, 255, ${0.60 * thinAmt})`);

    ctx.fillStyle = dorsalHighlight;
    ctx.beginPath();
    ctx.ellipse(centerX, centerY + h * 0.01, w * 0.012, h * 0.06, 0, 0, Math.PI * 2);
    ctx.fill();

    // Refined pointed nasal tip highlight
    ctx.fillStyle = `rgba(255, 255, 255, ${0.55 * thinAmt})`;
    ctx.beginPath();
    ctx.arc(centerX, centerY + h * 0.07, w * 0.018, 0, Math.PI * 2);
    ctx.fill();
  }

  // C. Mandibuloplasty (Jawline Contouring & V-Line Taper)
  if (p.jawNarrow) {
    const jawAmt = p.jawNarrow;
    // Shade lateral gonial angles to simulate bone shaving
    const leftJawShade = ctx.createRadialGradient(
      centerX - w * 0.28, centerY + h * 0.22, w * 0.02,
      centerX - w * 0.28, centerY + h * 0.22, w * 0.18
    );
    leftJawShade.addColorStop(0, `rgba(30, 20, 15, ${0.65 * jawAmt})`);
    leftJawShade.addColorStop(0.5, `rgba(30, 20, 15, ${0.35 * jawAmt})`);
    leftJawShade.addColorStop(1, 'rgba(30, 20, 15, 0)');

    ctx.fillStyle = leftJawShade;
    ctx.beginPath();
    ctx.ellipse(centerX - w * 0.26, centerY + h * 0.22, w * 0.12, h * 0.15, -0.4, 0, Math.PI * 2);
    ctx.fill();

    const rightJawShade = ctx.createRadialGradient(
      centerX + w * 0.28, centerY + h * 0.22, w * 0.02,
      centerX + w * 0.28, centerY + h * 0.22, w * 0.18
    );
    rightJawShade.addColorStop(0, `rgba(30, 20, 15, ${0.65 * jawAmt})`);
    rightJawShade.addColorStop(0.5, `rgba(30, 20, 15, ${0.35 * jawAmt})`);
    rightJawShade.addColorStop(1, 'rgba(30, 20, 15, 0)');

    ctx.fillStyle = rightJawShade;
    ctx.beginPath();
    ctx.ellipse(centerX + w * 0.26, centerY + h * 0.22, w * 0.12, h * 0.15, 0.4, 0, Math.PI * 2);
    ctx.fill();

    // V-Line chin accent highlight
    ctx.fillStyle = `rgba(255, 255, 255, ${0.35 * jawAmt})`;
    ctx.beginPath();
    ctx.ellipse(centerX, centerY + h * 0.32, w * 0.035, h * 0.025, 0, 0, Math.PI * 2);
    ctx.fill();
  }

  // D. Genioplasty & Chin Augmentation
  if (p.chinLengthen) {
    const chinAmt = p.chinLengthen;
    // Enhanced forward chin pad projection
    const chinPad = ctx.createRadialGradient(
      centerX, centerY + h * 0.32, w * 0.01,
      centerX, centerY + h * 0.32, w * 0.06
    );
    chinPad.addColorStop(0, `rgba(255, 255, 255, ${0.45 * chinAmt})`);
    chinPad.addColorStop(0.7, `rgba(255, 255, 255, ${0.15 * chinAmt})`);
    chinPad.addColorStop(1, 'rgba(255, 255, 255, 0)');

    ctx.fillStyle = chinPad;
    ctx.beginPath();
    ctx.arc(centerX, centerY + h * 0.32, w * 0.05, 0, Math.PI * 2);
    ctx.fill();

    // Submental shadow definition
    ctx.fillStyle = `rgba(30, 20, 15, ${0.40 * chinAmt})`;
    ctx.beginPath();
    ctx.ellipse(centerX, centerY + h * 0.36, w * 0.06, h * 0.018, 0, 0, Math.PI * 2);
    ctx.fill();
  }

  // E. Blepharoplasty (Lifted eyelid aperture)
  if (p.eyeLift) {
    const eyeAmt = p.eyeLift;
    // Smooth and lighten upper eyelid crease hooding
    ctx.fillStyle = `rgba(255, 255, 255, ${0.28 * eyeAmt})`;
    ctx.beginPath();
    ctx.ellipse(centerX - w * 0.15, centerY - h * 0.11, w * 0.07, h * 0.025, 0.05, 0, Math.PI * 2);
    ctx.fill();

    ctx.beginPath();
    ctx.ellipse(centerX + w * 0.15, centerY - h * 0.11, w * 0.07, h * 0.025, -0.05, 0, Math.PI * 2);
    ctx.fill();

    // Lateral canthal lift shading
    ctx.fillStyle = `rgba(40, 25, 20, ${0.30 * eyeAmt})`;
    ctx.beginPath();
    ctx.ellipse(centerX - w * 0.22, centerY - h * 0.115, w * 0.02, h * 0.015, -0.4, 0, Math.PI * 2);
    ctx.fill();

    ctx.beginPath();
    ctx.ellipse(centerX + w * 0.22, centerY - h * 0.115, w * 0.02, h * 0.015, 0.4, 0, Math.PI * 2);
    ctx.fill();
  }

  // F. Rhytidectomy (Skin smoothing & Facelift rejuvenation)
  if (p.skinSmooth) {
    const smoothAmt = p.skinSmooth;
    // Soft blur-like veil over nasolabial folds
    ctx.fillStyle = `rgba(255, 250, 245, ${0.25 * smoothAmt})`;
    ctx.beginPath();
    ctx.ellipse(centerX - w * 0.09, centerY + h * 0.15, w * 0.035, h * 0.08, 0.2, 0, Math.PI * 2);
    ctx.fill();

    ctx.beginPath();
    ctx.ellipse(centerX + w * 0.09, centerY + h * 0.15, w * 0.035, h * 0.08, -0.2, 0, Math.PI * 2);
    ctx.fill();

    // Forehead rhytid smoothing
    ctx.fillStyle = `rgba(255, 250, 245, ${0.20 * smoothAmt})`;
    ctx.fillRect(centerX - w * 0.22, centerY - h * 0.25, w * 0.44, h * 0.09);
  }

  // G. Cheiloplasty (Lip contour alteration)
  if (p.lipVolume) {
    const lipAmt = p.lipVolume;
    // Enhanced vermilion fullness highlight
    ctx.fillStyle = `rgba(255, 220, 220, ${0.30 * lipAmt})`;
    ctx.beginPath();
    ctx.ellipse(centerX, centerY + h * 0.20, w * 0.065, h * 0.022, 0, 0, Math.PI * 2);
    ctx.fill();
  }

  // Restore context state
  ctx.restore();

  // 2. Draw Before / After dividing line if split is requested
  if (showBeforeAfterSplit) {
    const splitX = w * splitPosition;
    ctx.strokeStyle = '#8C6D46';
    ctx.lineWidth = 2;
    ctx.setLineDash([4, 4]);
    ctx.beginPath();
    ctx.moveTo(splitX, 0);
    ctx.lineTo(splitX, h);
    ctx.stroke();
    ctx.setLineDash([]);

    // Split Badge Indicators
    ctx.font = '10px "JetBrains Mono", monospace';
    ctx.fillStyle = 'rgba(28, 25, 23, 0.85)';
    ctx.fillRect(splitX - 65, 14, 55, 20);
    ctx.fillRect(splitX + 10, 14, 75, 20);

    ctx.fillStyle = '#FAF7F2';
    ctx.fillText('ORIGINAL', splitX - 58, 28);
    ctx.fillStyle = '#EAB308';
    ctx.fillText('PROJECTION', splitX + 15, 28);
  }

  // 3. Optional Forensic Incision Guides & Vectors Overlay
  if (showIncisionGuides) {
    ctx.save();
    ctx.strokeStyle = '#EF4444';
    ctx.fillStyle = '#EF4444';
    ctx.lineWidth = 1.5;
    ctx.setLineDash([3, 3]);

    if (procedure.id === 'rhinoplasty' || procedure.id === 'comprehensive_evasion') {
      // Transcolumellar inverted-V incision marker
      ctx.beginPath();
      ctx.moveTo(centerX - 10, centerY + h * 0.09);
      ctx.lineTo(centerX, centerY + h * 0.08);
      ctx.lineTo(centerX + 10, centerY + h * 0.09);
      ctx.stroke();

      // Measurement calipers
      ctx.strokeStyle = '#38BDF8';
      ctx.setLineDash([]);
      ctx.beginPath();
      ctx.moveTo(centerX - 28, centerY + h * 0.01);
      ctx.lineTo(centerX - 28, centerY + h * 0.08);
      ctx.moveTo(centerX - 32, centerY + h * 0.01);
      ctx.lineTo(centerX - 24, centerY + h * 0.01);
      ctx.moveTo(centerX - 32, centerY + h * 0.08);
      ctx.lineTo(centerX - 24, centerY + h * 0.08);
      ctx.stroke();

      ctx.font = '9px "JetBrains Mono", monospace';
      ctx.fillStyle = '#38BDF8';
      ctx.fillText('-4.2mm Δ', centerX - 68, centerY + h * 0.05);
    }

    if (procedure.id === 'mandibuloplasty' || procedure.id === 'comprehensive_evasion') {
      // Mandibular angle resection line
      ctx.beginPath();
      ctx.moveTo(centerX - w * 0.28, centerY + h * 0.16);
      ctx.lineTo(centerX - w * 0.18, centerY + h * 0.28);
      ctx.moveTo(centerX + w * 0.28, centerY + h * 0.16);
      ctx.lineTo(centerX + w * 0.18, centerY + h * 0.28);
      ctx.stroke();

      ctx.font = '9px "JetBrains Mono", monospace';
      ctx.fillStyle = '#EF4444';
      ctx.fillText('OSTECTOMY ARC', centerX - w * 0.35, centerY + h * 0.24);
      ctx.fillText('OSTECTOMY ARC', centerX + w * 0.20, centerY + h * 0.24);
    }

    if (procedure.id === 'blepharoplasty' || procedure.id === 'comprehensive_evasion') {
      // Supratarsal incision lines
      ctx.beginPath();
      ctx.arc(centerX - w * 0.15, centerY - h * 0.12, w * 0.065, Math.PI * 0.9, Math.PI * 0.1, true);
      ctx.arc(centerX + w * 0.15, centerY - h * 0.12, w * 0.065, Math.PI * 0.9, Math.PI * 0.1, true);
      ctx.stroke();
    }

    ctx.restore();
  }

  // 4. Optional Forensic Calipers & Nodal Points Overlay
  if (showSurgicalCalipers) {
    ctx.save();
    ctx.strokeStyle = '#06B6D4';
    ctx.fillStyle = '#06B6D4';
    ctx.lineWidth = 1;

    // Center biometric datum axis
    ctx.setLineDash([2, 4]);
    ctx.beginPath();
    ctx.moveTo(centerX, 20);
    ctx.lineTo(centerX, h - 20);
    ctx.stroke();

    // Nodal biometric points
    const points = [
      { x: centerX, y: centerY - h * 0.18, label: 'Nasion' },
      { x: centerX, y: centerY + h * 0.07, label: 'Pronasale' },
      { x: centerX, y: centerY + h * 0.11, label: 'Subnasale' },
      { x: centerX - w * 0.15, y: centerY - h * 0.09, label: 'Endocanthion-L' },
      { x: centerX + w * 0.15, y: centerY - h * 0.09, label: 'Endocanthion-R' },
      { x: centerX, y: centerY + h * 0.32, label: 'Pogonion' },
    ];

    points.forEach(pt => {
      ctx.setLineDash([]);
      ctx.beginPath();
      ctx.arc(pt.x, pt.y, 3, 0, Math.PI * 2);
      ctx.fill();

      // Crosshair
      ctx.beginPath();
      ctx.moveTo(pt.x - 7, pt.y);
      ctx.lineTo(pt.x + 7, pt.y);
      ctx.moveTo(pt.x, pt.y - 7);
      ctx.lineTo(pt.x, pt.y + 7);
      ctx.stroke();

      ctx.font = '8px "JetBrains Mono", monospace';
      ctx.fillStyle = '#06B6D4';
      ctx.fillText(pt.label, pt.x + 9, pt.y + 3);
    });

    ctx.restore();
  }
}
