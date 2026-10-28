import { FaceSpec } from '../types';
import { calculateFacialSymmetryScore } from './faceSpecEngine';

export interface RenderOptions {
  width: number;
  height: number;
  styleMode: 'charcoal' | 'photoreal';
  viewAngle?: 'frontal' | 'profile' | 'dual';
  showGrid?: boolean;
  showLandmarks?: boolean;
  showHeatmap?: boolean;
  showSymmetryOverlay?: boolean;
  highlightRegion?: string | null;
  caseNumber: string;
  version: number;
  entryHash?: string;
  hasGenerated?: boolean;
  aiImageElement?: HTMLImageElement | null;
  isGenerating?: boolean;
  hideWatermarks?: boolean;
  focusFeature?: string | null;
}

export interface RegionConfidence {
  id: string;
  label: string;
  confidence: number; // 0.0 - 1.0
  stated: boolean;
  level: 'low' | 'moderate' | 'high';
  suggestedPrompt: string;
}

/**
 * Calculates facial region confidence metrics directly from the FaceSpec source of truth.
 * Identifies unstated or low-confidence zones for targeted non-leading cognitive questioning.
 */
export function calculateRegionConfidences(spec: FaceSpec): Record<string, RegionConfidence> {
  const avg = (attrs: any[]) => {
    const statedAttrs = attrs.filter(a => a && a.stated);
    if (statedAttrs.length === 0) return { conf: 0.0, stated: false };
    const sum = statedAttrs.reduce((acc, a) => acc + (typeof a.confidence === 'number' ? a.confidence : 0.5), 0);
    return { conf: sum / statedAttrs.length, stated: true };
  };

  const hairRes = avg([spec.hair.style, spec.hair.length, spec.hair.color, spec.hair.hairline]);
  const browsRes = avg([spec.eyebrows]);
  const eyesRes = avg([spec.eyes.shape, spec.eyes.size, spec.eyes.spacing, spec.eyes.color]);
  const noseRes = avg([spec.nose.bridge, spec.nose.width, spec.nose.tip, spec.nose.length]);
  const cheeksRes = avg([spec.cheekbones_ears]);
  const mouthRes = avg([spec.mouth_lips]);
  const jawRes = avg([spec.jawline_chin, spec.face_shape]);
  const facialHairRes = avg([spec.facial_hair]);

  const mapToRegion = (id: string, label: string, res: { conf: number; stated: boolean }, prompt: string): RegionConfidence => {
    const conf = res.stated ? res.conf : 0.0;
    const level: 'low' | 'moderate' | 'high' = 
      (!res.stated || conf < 0.40) ? 'low' : conf < 0.75 ? 'moderate' : 'high';
    return { id, label, confidence: conf, stated: res.stated, level, suggestedPrompt: prompt };
  };

  return {
    hair: mapToRegion('hair', 'Hair & Forehead', hairRes, 'Can you recall the texture, length, or hairline contour of the hair?'),
    eyebrows: mapToRegion('eyebrows', 'Eyebrows', browsRes, 'Thinking about the brow ridge, were the eyebrows thick, arched, or sparse?'),
    eyes: mapToRegion('eyes', 'Eyes & Orbital', eyesRes, 'Picture his gaze: were the eyes deep-set, wide, or hooded in any way?'),
    nose: mapToRegion('nose', 'Nose & Midface', noseRes, 'Focusing on the center of the face, did the nose have a noticeable bridge or nostril width?'),
    cheekbones_ears: mapToRegion('cheekbones_ears', 'Cheeks & Ears', cheeksRes, 'Did you notice high cheekbones, hollows, or ear visibility?'),
    mouth_lips: mapToRegion('mouth_lips', 'Mouth & Lips', mouthRes, 'As he spoke or stood, what stood out about the lip thickness or corners of the mouth?'),
    jawline_chin: mapToRegion('jawline_chin', 'Jaw & Chin', jawRes, 'Looking at the lower face, was the jawline rounded, angular, or squared?'),
    facial_hair: mapToRegion('facial_hair', 'Facial Hair', facialHairRes, 'Was the lower face clean-shaven, or was there stubble, mustache, or beard?'),
  };
}

/**
 * Forensic Facial Composite Renderer
 * Authentic Forensic Sketch Artist Engine using realistic procedural charcoal & graphite techniques.
 */
export function drawForensicComposite(
  ctx: CanvasRenderingContext2D,
  spec: FaceSpec,
  options: RenderOptions
) {
  const { 
    width, 
    height, 
    styleMode, 
    viewAngle = 'frontal',
    showGrid, 
    showLandmarks, 
    showHeatmap, 
    showSymmetryOverlay,
    highlightRegion, 
    caseNumber, 
    version, 
    entryHash,
    hasGenerated,
    aiImageElement,
    hideWatermarks,
    focusFeature,
  } = options;

  const isPhotoreal = styleMode === 'photoreal';

  // Helper to draw the mandatory statutory watermarks (Rule 6 Evidentiary Invariant)
  const drawWatermarks = () => {
    if (hideWatermarks) return;

    // 1. Mandatory Statutory Top Watermark Banner
    ctx.save();
    ctx.fillStyle = 'rgba(69, 10, 10, 0.95)';
    ctx.fillRect(0, 0, width, 26);
    ctx.strokeStyle = 'rgba(239, 68, 68, 0.6)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(0, 26);
    ctx.lineTo(width, 26);
    ctx.stroke();

    ctx.fillStyle = '#fecaca';
    ctx.font = '600 10px "JetBrains Mono", monospace';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('AI-GENERATED APPROXIMATION - INVESTIGATIVE LEAD ONLY', width / 2, 13);
    ctx.restore();

    // 2. Mandatory Statutory Bottom Watermark Banner
    ctx.save();
    ctx.fillStyle = 'rgba(15, 23, 42, 0.95)';
    ctx.fillRect(0, height - 32, width, 32);
    ctx.strokeStyle = 'rgba(51, 65, 85, 0.6)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(0, height - 32);
    ctx.lineTo(width, height - 32);
    ctx.stroke();

    ctx.fillStyle = '#94a3b8';
    ctx.font = '500 9px "JetBrains Mono", monospace';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';
    ctx.fillText(`CASE: ${caseNumber} | VER: ${version}`, 12, height - 16);

    ctx.textAlign = 'right';
    const shortHash = entryHash ? entryHash.substring(0, 16) + '...' : 'SEC-SHA256-ENFORCED';
    ctx.fillText(`HASH: ${shortHash}`, width - 12, height - 16);
    ctx.restore();
  };

  // Clear canvas
  ctx.clearRect(0, 0, width, height);

  // Background Drafting Canvas / Forensic Drawing Paper
  drawForensicPaper(ctx, width, height, isPhotoreal);

  // Initial startup: NO FACE RENDERED YET! (Rule 3 Invariant)
  // (Candidate grid previews always pass hasGenerated=true)
  if (!hasGenerated) {
    ctx.save();
    // Grid alignment guides
    ctx.strokeStyle = isPhotoreal ? 'rgba(56, 189, 248, 0.18)' : 'rgba(100, 116, 139, 0.25)';
    ctx.lineWidth = 1;
    ctx.setLineDash([4, 4]);
    ctx.beginPath();
    ctx.moveTo(width / 2, 26); ctx.lineTo(width / 2, height - 32);
    ctx.moveTo(0, height * 0.44); ctx.lineTo(width, height * 0.44);
    ctx.moveTo(0, height * 0.56); ctx.lineTo(width, height * 0.56);
    ctx.moveTo(0, height * 0.67); ctx.lineTo(width, height * 0.67);
    ctx.stroke();

    // Corner crosshairs
    const drawCross = (x: number, y: number) => {
      ctx.beginPath();
      ctx.moveTo(x - 6, y); ctx.lineTo(x + 6, y);
      ctx.moveTo(x, y - 6); ctx.lineTo(x, y + 6);
      ctx.stroke();
    };
    ctx.strokeStyle = isPhotoreal ? 'rgba(56, 189, 248, 0.35)' : 'rgba(71, 85, 105, 0.4)';
    ctx.setLineDash([]);
    drawCross(width * 0.2, height * 0.2);
    drawCross(width * 0.8, height * 0.2);
    drawCross(width * 0.2, height * 0.8);
    drawCross(width * 0.8, height * 0.8);

    // Anatomical placement guide
    const cx = width / 2;
    const cy = height * 0.48;
    const fw = width * 0.28;
    const fh = height * 0.34;
    ctx.strokeStyle = isPhotoreal ? 'rgba(56, 189, 248, 0.25)' : 'rgba(100, 116, 139, 0.35)';
    ctx.lineWidth = 1.5;
    ctx.setLineDash([6, 6]);
    ctx.beginPath();
    ctx.ellipse(cx, cy, fw, fh, 0, 0, Math.PI * 2);
    ctx.stroke();

    // Central crosshair in placeholder
    ctx.strokeStyle = isPhotoreal ? 'rgba(56, 189, 248, 0.3)' : 'rgba(71, 85, 105, 0.4)';
    ctx.setLineDash([]);
    ctx.beginPath();
    ctx.moveTo(cx - 16, cy); ctx.lineTo(cx + 16, cy);
    ctx.moveTo(cx, cy - 16); ctx.lineTo(cx, cy + 16);
    ctx.stroke();

    // Technical notification badge
    ctx.fillStyle = isPhotoreal ? 'rgba(15, 23, 42, 0.85)' : 'rgba(241, 245, 249, 0.9)';
    ctx.strokeStyle = isPhotoreal ? 'rgba(56, 189, 248, 0.3)' : 'rgba(148, 163, 184, 0.5)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.roundRect(cx - 160, cy - 40, 320, 80, 8);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = isPhotoreal ? '#38bdf8' : '#1e293b';
    ctx.font = '600 12px "JetBrains Mono", monospace';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('AWAITING WITNESS DESCRIPTION', cx, cy - 22);

    ctx.fillStyle = isPhotoreal ? '#cbd5e1' : '#475569';
    ctx.font = '400 12px Inter, sans-serif';
    ctx.fillText('No facial composite generated on startup.', cx, cy);
    ctx.fillStyle = isPhotoreal ? '#94a3b8' : '#64748b';
    ctx.fillText('Describe suspect features in the chat to begin sketch.', cx, cy + 20);
    ctx.restore();

    // Confidence heatmap overlay if toggled on draft board
    if (showHeatmap) {
      renderConfidenceHeatmap(ctx, spec, width, height, viewAngle, highlightRegion);
    }

    drawWatermarks();
    return;
  }

  // If external AI generated image is present and loaded, render it
  if (aiImageElement && aiImageElement.complete && aiImageElement.naturalWidth > 0) {
    ctx.save();
    const usableTop = hideWatermarks ? 0 : 26;
    const usableBottom = hideWatermarks ? height : height - 32;
    const usableHeight = usableBottom - usableTop;
    const imgW = aiImageElement.naturalWidth;
    const imgH = aiImageElement.naturalHeight;
    const scale = Math.max(width / imgW, usableHeight / imgH);
    const dw = imgW * scale;
    const dh = imgH * scale;
    const dx = (width - dw) / 2;
    const dy = usableTop + (usableHeight - dh) / 2;
    ctx.drawImage(aiImageElement, 0, 0, imgW, imgH, dx, dy, dw, dh);
    ctx.restore();
  } else {
    // RENDER AUTHENTIC FORENSIC ARTIST COMPOSITE SKETCH
    ctx.save();
    const usableTop = hideWatermarks ? 0 : 26;
    const usableBottom = hideWatermarks ? height : height - 32;
    const usableHeight = usableBottom - usableTop;

    if (focusFeature) {
      // SMART FEATURE FOCUS: Centered and zoomed directly on the feature being varied
      let targetY = 0;
      let zoomFactor = 1.0;
      if (focusFeature === 'nose') {
        targetY = 24;
        zoomFactor = 2.4;
      } else if (focusFeature === 'eyes') {
        targetY = -18;
        zoomFactor = 2.2;
      } else if (focusFeature === 'eyebrows') {
        targetY = -34;
        zoomFactor = 2.4;
      } else if (focusFeature === 'mouth_lips') {
        targetY = 66;
        zoomFactor = 2.3;
      } else if (focusFeature === 'jawline_chin') {
        targetY = 96;
        zoomFactor = 1.9;
      } else if (focusFeature === 'hair') {
        targetY = -75;
        zoomFactor = 1.5;
      } else if (focusFeature === 'facial_hair') {
        targetY = 70;
        zoomFactor = 1.8;
      } else if (focusFeature === 'face_shape') {
        targetY = 10;
        zoomFactor = 1.25;
      }

      const baseScale = Math.min(width / 380, usableHeight / 440);
      const scale = baseScale * zoomFactor;
      const cx = width * 0.5;
      const cy = (usableTop + usableHeight * 0.5) - (targetY * scale);
      drawForensicSketch(ctx, spec, cx, cy, scale, isPhotoreal, false, highlightRegion || focusFeature);
    } else if (viewAngle === 'dual') {
      // Dual angle view: Frontal on left, Profile on right
      const w1 = width * 0.48;
      const cx1 = width * 0.26;
      const cy1 = usableTop + usableHeight * 0.50;
      const scale1 = Math.min(w1 / 380, usableHeight / 480);
      drawForensicSketch(ctx, spec, cx1, cy1, scale1, isPhotoreal, false, highlightRegion);

      // Dividing technical rule line
      ctx.strokeStyle = isPhotoreal ? 'rgba(56, 189, 248, 0.3)' : 'rgba(100, 116, 139, 0.4)';
      ctx.lineWidth = 1;
      ctx.setLineDash([4, 4]);
      ctx.beginPath();
      ctx.moveTo(width * 0.51, usableTop + 10);
      ctx.lineTo(width * 0.51, usableBottom - 10);
      ctx.stroke();
      ctx.setLineDash([]);

      const cx2 = width * 0.75;
      drawForensicSketch(ctx, spec, cx2, cy1, scale1, isPhotoreal, true, highlightRegion);

      // Angle indicator tags
      if (!hideWatermarks) {
        ctx.fillStyle = isPhotoreal ? '#94a3b8' : '#475569';
        ctx.font = '600 10px "JetBrains Mono", monospace';
        ctx.textAlign = 'center';
        ctx.fillText('VIEW A: FRONTAL APX', cx1, usableBottom - 14);
        ctx.fillText('VIEW B: LATERAL 90° PROFILE', cx2, usableBottom - 14);
      }
    } else if (viewAngle === 'profile') {
      const cx = width * 0.5;
      const cy = usableTop + usableHeight * 0.50;
      const scale = Math.min(width / 420, usableHeight / 500);
      drawForensicSketch(ctx, spec, cx, cy, scale, isPhotoreal, true, highlightRegion);
    } else {
      // Standard Frontal view
      const cx = width * 0.5;
      const cy = usableTop + usableHeight * 0.50;
      const scale = hideWatermarks
        ? Math.min(width / 360, usableHeight / 430) * 1.15
        : Math.min(width / 420, usableHeight / 500);
      drawForensicSketch(ctx, spec, cx, cy, scale, isPhotoreal, false, highlightRegion);
    }
    ctx.restore();
  }

  // Grid alignment overlay if toggled
  if (showGrid && !hideWatermarks) {
    ctx.save();
    ctx.strokeStyle = isPhotoreal ? 'rgba(56, 189, 248, 0.35)' : 'rgba(71, 85, 105, 0.35)';
    ctx.lineWidth = 1;
    ctx.setLineDash([4, 4]);
    ctx.beginPath();
    ctx.moveTo(width / 2, 26); ctx.lineTo(width / 2, height - 32);
    ctx.moveTo(0, height * 0.44); ctx.lineTo(width, height * 0.44);
    ctx.moveTo(0, height * 0.56); ctx.lineTo(width, height * 0.56);
    ctx.moveTo(0, height * 0.67); ctx.lineTo(width, height * 0.67);
    ctx.stroke();

    const step = 40;
    ctx.strokeStyle = isPhotoreal ? 'rgba(56, 189, 248, 0.12)' : 'rgba(148, 163, 184, 0.15)';
    ctx.setLineDash([]);
    for (let x = step; x < width; x += step) {
      ctx.beginPath(); ctx.moveTo(x, 26); ctx.lineTo(x, height - 32); ctx.stroke();
    }
    for (let y = 26 + step; y < height - 32; y += step) {
      ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(width, y); ctx.stroke();
    }
    ctx.restore();
  }

  // Landmarks overlay if toggled
  if (showLandmarks && !hideWatermarks) {
    ctx.save();
    ctx.fillStyle = isPhotoreal ? '#38bdf8' : '#0284c7';
    const cx = width / 2;
    const cy = height * 0.47;
    const points = [
      [cx - 46, cy - 22], [cx + 46, cy - 22],
      [cx - 72, cy - 22], [cx - 24, cy - 22],
      [cx + 24, cy - 22], [cx + 72, cy - 22],
      [cx, cy + 28], [cx - 18, cy + 28], [cx + 18, cy + 28],
      [cx - 32, cy + 68], [cx + 32, cy + 68], [cx, cy + 66], [cx, cy + 76],
      [cx, cy + 124], [cx - 68, cy + 110], [cx + 68, cy + 110]
    ];
    for (const [px, py] of points) {
      ctx.beginPath();
      ctx.arc(px, py, 3.5, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
  }

  // Confidence heatmap overlay if toggled
  if (showHeatmap && !hideWatermarks) {
    renderConfidenceHeatmap(ctx, spec, width, height, viewAngle, highlightRegion);
  }

  // Facial symmetry balance overlay if toggled
  if (showSymmetryOverlay && !hideWatermarks && hasGenerated) {
    renderFacialSymmetryOverlay(ctx, spec, width, height, viewAngle, isPhotoreal);
  }

  // Mandatory statutory watermarks
  drawWatermarks();
}

/**
 * Draws the textured forensic paper surface with subtle charcoal tooth and grain.
 */
function drawForensicPaper(ctx: CanvasRenderingContext2D, width: number, height: number, isPhotoreal: boolean) {
  ctx.save();
  if (isPhotoreal) {
    const bg = ctx.createRadialGradient(width * 0.5, height * 0.46, 30, width * 0.5, height * 0.5, width * 0.85);
    bg.addColorStop(0, '#1c2438');
    bg.addColorStop(0.5, '#0f172a');
    bg.addColorStop(1, '#060a12');
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, width, height);
  } else {
    const bg = ctx.createRadialGradient(width * 0.5, height * 0.46, 40, width * 0.5, height * 0.5, width * 0.9);
    bg.addColorStop(0, '#faf7f0');
    bg.addColorStop(0.65, '#f3ede0');
    bg.addColorStop(1, '#e7dec9');
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, width, height);

    ctx.fillStyle = 'rgba(60, 50, 40, 0.025)';
    for (let i = 0; i < 400; i++) {
      const rx = (Math.sin(i * 997) * 0.5 + 0.5) * width;
      const ry = (Math.cos(i * 883) * 0.5 + 0.5) * height;
      ctx.fillRect(rx, ry, 1.5, 1.5);
    }
  }
  ctx.restore();
}

/**
 * Procedural authentic forensic sketch artist engine.
 * Renders realistic craniometric anatomy, bone structure, graphite hatching, and charcoal shading.
 */
function drawForensicSketch(
  ctx: CanvasRenderingContext2D,
  spec: FaceSpec,
  cx: number,
  cy: number,
  scale: number,
  isPhotoreal: boolean,
  isProfile: boolean,
  highlightRegion?: string | null
) {
  ctx.save();
  ctx.translate(cx, cy);
  ctx.scale(scale, scale);

  // Palette definition based on styleMode
  const p = isPhotoreal ? {
    dark: '#020617',
    deep: '#0f172a',
    mid: '#334155',
    light: '#64748b',
    skinGradStart: '#e2e8f0',
    skinGradEnd: '#94a3b8',
    highlight: 'rgba(255, 255, 255, 0.7)',
    pencilStroke: 'rgba(15, 23, 42, 0.85)',
    shading: 'rgba(15, 23, 42, 0.22)',
  } : {
    dark: '#1c1917',
    deep: '#292524',
    mid: '#44403c',
    light: '#78716c',
    skinGradStart: '#faf7f0',
    skinGradEnd: '#e6dcce',
    highlight: 'rgba(255, 255, 255, 0.65)',
    pencilStroke: 'rgba(28, 25, 23, 0.85)',
    shading: 'rgba(41, 37, 36, 0.18)',
  };

  // Extract morphological parameters from FaceSpec
  const faceShape = (spec.face_shape.value || '').toLowerCase();
  const jawType = (spec.jawline_chin.value || '').toLowerCase();
  const hairStyle = (spec.hair.style.value || '').toLowerCase();
  const hairLength = (spec.hair.length.value || '').toLowerCase();
  const hairLine = (spec.hair.hairline.value || '').toLowerCase();
  const eyeShape = (spec.eyes.shape.value || '').toLowerCase();
  const eyeSpacing = (spec.eyes.spacing.value || '').toLowerCase();
  const eyeSize = (spec.eyes.size.value || '').toLowerCase();
  const noseBridge = (spec.nose.bridge.value || '').toLowerCase();
  const noseTip = (spec.nose.tip.value || '').toLowerCase();
  const noseWidth = (spec.nose.width.value || '').toLowerCase();
  const browType = (spec.eyebrows.value || '').toLowerCase();
  const lipType = (spec.mouth_lips.value || '').toLowerCase();
  const facialHair = (spec.facial_hair.value || '').toLowerCase();

  // Head dimensions & morphological tuning
  let headW = 106;
  let headH = 138;
  let jawWidth = 72;
  let chinDrop = 135;

  if (faceShape.includes('round') || jawType.includes('rounded')) {
    headW = 116;
    headH = 130;
    jawWidth = 84;
    chinDrop = 126;
  } else if (faceShape.includes('square') || jawType.includes('square')) {
    headW = 114;
    headH = 136;
    jawWidth = 98;
    chinDrop = 136;
  } else if (faceShape.includes('heart') || jawType.includes('pointed') || jawType.includes('narrow')) {
    headW = 105;
    headH = 142;
    jawWidth = 56;
    chinDrop = 142;
  } else if (faceShape.includes('angular') || jawType.includes('angular') || jawType.includes('chiseled')) {
    headW = 108;
    headH = 138;
    jawWidth = 86;
    chinDrop = 138;
  } else if (faceShape.includes('long') || faceShape.includes('oblong')) {
    headW = 98;
    headH = 148;
    chinDrop = 146;
  }

  if (jawType.includes('receding') || jawType.includes('weak')) {
    chinDrop = 122;
  } else if (jawType.includes('prominent') || jawType.includes('jutting')) {
    chinDrop = 148;
  }

  // --- 1. NECK & SHOULDERS ---
  ctx.save();
  ctx.fillStyle = isPhotoreal ? '#1e293b' : '#ded5c5';
  ctx.strokeStyle = p.pencilStroke;
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(-jawWidth * 0.65, chinDrop - 35);
  ctx.lineTo(-jawWidth * 0.75, chinDrop + 85);
  ctx.lineTo(-170, chinDrop + 115);
  ctx.lineTo(170, chinDrop + 115);
  ctx.lineTo(jawWidth * 0.75, chinDrop + 85);
  ctx.lineTo(jawWidth * 0.65, chinDrop - 35);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  // Neck shading (sub-mandibular cast shadow)
  const neckGrad = ctx.createLinearGradient(0, chinDrop - 20, 0, chinDrop + 55);
  neckGrad.addColorStop(0, p.shading);
  neckGrad.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.fillStyle = neckGrad;
  ctx.fillRect(-jawWidth * 0.8, chinDrop - 20, jawWidth * 1.6, 75);

  // Sternocleidomastoid muscle contour lines
  ctx.strokeStyle = p.light;
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(-35, chinDrop + 10);
  ctx.quadraticCurveTo(-25, chinDrop + 45, -15, chinDrop + 85);
  ctx.moveTo(35, chinDrop + 10);
  ctx.quadraticCurveTo(25, chinDrop + 45, 15, chinDrop + 85);
  ctx.stroke();
  ctx.restore();

  if (isProfile) {
    // --- 90° LATERAL PROFILE RENDERING ---
    drawProfileMorphology(ctx, p, {
      headW, headH, hairStyle, hairLength, hairLine,
      eyeShape, noseBridge, noseTip, lipType, jawType, facialHair
    });
    ctx.restore();
    return;
  }

  // --- 2. CRANIOFACIAL MASS (HEAD CONTOUR) ---
  ctx.save();
  const skinGrad = ctx.createRadialGradient(0, 0, 30, 0, 20, headW * 1.3);
  skinGrad.addColorStop(0, p.skinGradStart);
  skinGrad.addColorStop(0.7, p.skinGradEnd);
  skinGrad.addColorStop(1, isPhotoreal ? '#64748b' : '#d5c8b5');
  ctx.fillStyle = skinGrad;

  // Draw Craniofacial contour with responsive jaw/chin geometry
  ctx.beginPath();
  ctx.moveTo(0, -headH);
  // Right Cranium & Temple
  ctx.bezierCurveTo(headW * 0.8, -headH, headW, -headH * 0.3, headW, 10);
  // Right Cheek & Mandibular Angle
  ctx.bezierCurveTo(headW * 0.98, 55, jawWidth, 80, jawWidth * 0.8, 115);

  // Chin base
  if (jawType.includes('square')) {
    ctx.lineTo(24, chinDrop);
    ctx.lineTo(-24, chinDrop);
  } else if (jawType.includes('pointed') || jawType.includes('narrow')) {
    ctx.lineTo(6, chinDrop);
    ctx.lineTo(-6, chinDrop);
  } else {
    ctx.bezierCurveTo(jawWidth * 0.45, chinDrop, -jawWidth * 0.45, chinDrop, -jawWidth * 0.8, 115);
  }

  // Left Mandibular Angle & Cheek
  ctx.bezierCurveTo(-jawWidth, 80, -headW * 0.98, 55, -headW, 10);
  // Left Temple & Cranium
  ctx.bezierCurveTo(-headW, -headH * 0.3, -headW * 0.8, -headH, 0, -headH);
  ctx.closePath();
  ctx.fill();

  // Multi-stroke charcoal pencil line
  ctx.strokeStyle = p.pencilStroke;
  ctx.lineWidth = 2;
  ctx.stroke();
  ctx.strokeStyle = p.deep;
  ctx.lineWidth = 1;
  ctx.stroke();
  ctx.restore();

  // --- 3. FACIAL BONE SHADING (Zygomatic, Temples, Orbital Cavity) ---
  ctx.save();
  // Temple shadows
  const templeGradL = ctx.createRadialGradient(-headW * 0.75, -45, 5, -headW * 0.75, -45, 45);
  templeGradL.addColorStop(0, p.shading);
  templeGradL.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.fillStyle = templeGradL;
  ctx.fillRect(-headW, -80, 60, 70);

  const templeGradR = ctx.createRadialGradient(headW * 0.75, -45, 5, headW * 0.75, -45, 45);
  templeGradR.addColorStop(0, p.shading);
  templeGradR.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.fillStyle = templeGradR;
  ctx.fillRect(headW - 60, -80, 60, 70);

  // Cheekbone hollows (Zygomatic shading)
  const cheekGradL = ctx.createRadialGradient(-jawWidth * 0.75, 45, 5, -jawWidth * 0.75, 45, 40);
  cheekGradL.addColorStop(0, p.shading);
  cheekGradL.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.fillStyle = cheekGradL;
  ctx.fillRect(-jawWidth, 20, 50, 60);

  const cheekGradR = ctx.createRadialGradient(jawWidth * 0.75, 45, 5, jawWidth * 0.75, 45, 40);
  cheekGradR.addColorStop(0, p.shading);
  cheekGradR.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.fillStyle = cheekGradR;
  ctx.fillRect(jawWidth - 50, 20, 50, 60);

  // Orbital Cavities (deep eye socket shading)
  const isDeepSet = eyeShape.includes('deep') || eyeSize.includes('deep');
  const eyeSocketY = -18;
  const isWideSet = eyeSpacing.includes('wide') || eyeShape.includes('wide-set');
  const isCloseSet = eyeSpacing.includes('close') || eyeShape.includes('close-set');
  const eyeOffset = isWideSet ? 52 : isCloseSet ? 33 : 43;

  for (const dir of [-1, 1]) {
    const ox = dir * eyeOffset;
    const socketR = isDeepSet ? 38 : 32;
    const socketGrad = ctx.createRadialGradient(ox, eyeSocketY, 8, ox, eyeSocketY, socketR);
    socketGrad.addColorStop(0, isDeepSet ? 'rgba(28, 25, 23, 0.38)' : p.shading);
    socketGrad.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = socketGrad;
    ctx.beginPath();
    ctx.arc(ox, eyeSocketY, socketR, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();

  // --- 4. EARS ---
  ctx.save();
  for (const dir of [-1, 1]) {
    const earX = dir * headW * 0.94;
    const earY = -15;
    ctx.fillStyle = isPhotoreal ? '#cbd5e1' : '#ede3d4';
    ctx.strokeStyle = p.pencilStroke;
    ctx.lineWidth = 1.5;

    ctx.beginPath();
    ctx.moveTo(earX, earY - 32);
    ctx.bezierCurveTo(earX + dir * 24, earY - 26, earX + dir * 26, earY + 20, earX + dir * 14, earY + 38);
    ctx.bezierCurveTo(earX + dir * 4, earY + 44, earX, earY + 28, earX, earY + 20);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    ctx.strokeStyle = p.deep;
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    ctx.moveTo(earX + dir * 4, earY - 22);
    ctx.quadraticCurveTo(earX + dir * 16, earY - 14, earX + dir * 12, earY + 6);
    ctx.quadraticCurveTo(earX + dir * 8, earY + 16, earX + dir * 2, earY + 16);
    ctx.stroke();

    ctx.fillStyle = p.deep;
    ctx.beginPath();
    ctx.arc(earX + dir * 6, earY, 5, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();

  // --- 5. EYES & ORBITAL ANATOMY ---
  ctx.save();
  const isLargeRound = eyeShape.includes('large') || eyeShape.includes('round') || eyeSize.includes('large');
  const isHooded = eyeShape.includes('hood') || eyeShape.includes('narrow') || eyeSize.includes('narrow');
  const isAlmond = eyeShape.includes('almond');
  const isDownturned = eyeShape.includes('downturn');

  const eyeW = isLargeRound ? 24 : isAlmond ? 22 : 19;
  const eyeH = isLargeRound ? 15 : isHooded ? 5.5 : isAlmond ? 9 : 10;
  const canthusTilt = isDownturned ? 3.5 : isAlmond ? -3.5 : 0;

  for (const dir of [-1, 1]) {
    const ex = dir * eyeOffset;
    const ey = eyeSocketY;

    // Sclera
    ctx.save();
    ctx.beginPath();
    ctx.moveTo(ex - dir * eyeW, ey);
    ctx.quadraticCurveTo(ex, ey - eyeH, ex + dir * eyeW, ey + canthusTilt);
    ctx.quadraticCurveTo(ex, ey + eyeH * 0.85, ex - dir * eyeW, ey);
    ctx.closePath();
    ctx.fillStyle = isPhotoreal ? '#f8fafc' : '#f5f2eb';
    ctx.fill();
    ctx.clip();

    // Sclera shadow
    const scleraShadow = ctx.createRadialGradient(ex, ey, eyeW * 0.35, ex, ey, eyeW);
    scleraShadow.addColorStop(0, 'rgba(0,0,0,0)');
    scleraShadow.addColorStop(1, 'rgba(0,0,0,0.25)');
    ctx.fillStyle = scleraShadow;
    ctx.fillRect(ex - eyeW, ey - eyeH - 4, eyeW * 2, eyeH * 2 + 8);

    // Iris
    const irisR = isLargeRound ? 8.5 : isHooded ? 6.5 : 7.5;
    ctx.fillStyle = p.mid;
    ctx.beginPath();
    ctx.arc(ex, ey, irisR, 0, Math.PI * 2);
    ctx.fill();

    // Limbal ring
    ctx.strokeStyle = p.dark;
    ctx.lineWidth = 1.3;
    ctx.stroke();

    // Pupil
    ctx.fillStyle = p.dark;
    ctx.beginPath();
    ctx.arc(ex, ey, isLargeRound ? 4.2 : 3.6, 0, Math.PI * 2);
    ctx.fill();

    // Specular catchlight highlight
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(ex - 1.8, ey - 1.8, 1.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    // Upper Eyelid & Eyelash Line
    ctx.strokeStyle = p.dark;
    ctx.lineWidth = isHooded ? 2.8 : 2.2;
    ctx.beginPath();
    ctx.moveTo(ex - dir * (eyeW + 2), ey + 0.5);
    ctx.quadraticCurveTo(ex, ey - eyeH - 0.5, ex + dir * (eyeW + 1), ey + canthusTilt);
    ctx.stroke();

    // Hooded upper eyelid fold / crease
    if (isHooded) {
      ctx.strokeStyle = p.deep;
      ctx.lineWidth = 1.6;
      ctx.beginPath();
      ctx.moveTo(ex - dir * (eyeW + 1), ey - 2);
      ctx.quadraticCurveTo(ex, ey - eyeH + 1.5, ex + dir * (eyeW + 4), ey + canthusTilt - 2);
      ctx.stroke();
    } else {
      ctx.strokeStyle = p.light;
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(ex - dir * (eyeW - 2), ey - eyeH - 2.5);
      ctx.quadraticCurveTo(ex, ey - eyeH - 5.5, ex + dir * (eyeW - 4), ey - eyeH - 1.5);
      ctx.stroke();
    }

    // Lower Eyelid line
    ctx.strokeStyle = p.mid;
    ctx.lineWidth = 1.1;
    ctx.beginPath();
    ctx.moveTo(ex - dir * eyeW, ey);
    ctx.quadraticCurveTo(ex, ey + eyeH * 0.85, ex + dir * eyeW, ey + canthusTilt);
    ctx.stroke();

    // Tear duct
    ctx.fillStyle = isPhotoreal ? '#f43f5e' : '#be7373';
    ctx.beginPath();
    ctx.arc(ex - dir * eyeW, ey, 1.8, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();

  // --- 6. EYEBROWS ---
  ctx.save();
  const isBushy = browType.includes('thick') || browType.includes('bushy') || browType.includes('heavy');
  const isSparse = browType.includes('sparse') || browType.includes('thin') || browType.includes('faint') || browType.includes('narrow');
  const isArched = browType.includes('arch');
  const isStraight = browType.includes('straight') || browType.includes('horizontal');
  const isMonobrow = browType.includes('mono') || browType.includes('unibrow') || browType.includes('joined');
  const isAngular = browType.includes('angular') || browType.includes('peak');

  const browThick = isBushy ? 8 : isSparse ? 2 : 4.5;
  const browY = eyeSocketY - 16;

  for (const dir of [-1, 1]) {
    const bx = dir * eyeOffset;
    ctx.strokeStyle = p.deep;
    ctx.lineWidth = browThick;
    ctx.lineCap = 'round';

    const archLift = isArched ? 14 : isStraight ? 0 : isAngular ? 12 : 5;
    const tailDrop = isStraight ? 0 : 3;

    ctx.beginPath();
    ctx.moveTo(bx - dir * 26, browY + 2);
    if (isAngular) {
      ctx.lineTo(bx + dir * 6, browY - archLift);
      ctx.lineTo(bx + dir * 28, browY + tailDrop);
    } else {
      ctx.quadraticCurveTo(bx + dir * 4, browY - archLift, bx + dir * 28, browY + tailDrop);
    }
    ctx.stroke();

    // Feathered individual hair strokes
    ctx.strokeStyle = p.dark;
    ctx.lineWidth = isBushy ? 1.5 : 0.9;
    const count = isBushy ? 16 : isSparse ? 6 : 12;
    for (let h = 0; h < count; h++) {
      const t = (h / count) * 50 - 25;
      const hx = bx + dir * t;
      const hy = browY - (t > 0 ? 3 : 0);
      ctx.beginPath();
      ctx.moveTo(hx, hy + 3);
      ctx.lineTo(hx + dir * (isBushy ? 5 : 3.5), hy - (isBushy ? 6 : 4.5));
      ctx.stroke();
    }
  }

  // Monobrow bridge across center glabella
  if (isMonobrow) {
    ctx.strokeStyle = p.deep;
    ctx.lineWidth = 3.5;
    for (let mx = -14; mx <= 14; mx += 3) {
      ctx.beginPath();
      ctx.moveTo(mx, browY + 2);
      ctx.lineTo(mx + 2, browY - 3);
      ctx.stroke();
    }
  }
  ctx.restore();

  // --- 7. NOSE & MIDFACE ANATOMY ---
  ctx.save();
  const isWideNose = noseWidth.includes('wide') || noseWidth.includes('flared') || noseWidth.includes('broad') || noseBridge.includes('wide') || noseBridge.includes('flared') || noseBridge.includes('broad') || noseTip.includes('broad') || noseTip.includes('flared');
  const isNarrowNose = noseWidth.includes('narrow') || noseWidth.includes('thin') || noseWidth.includes('straight') || noseBridge.includes('narrow') || noseBridge.includes('straight') || noseTip.includes('narrow');
  const isAquiline = noseBridge.includes('hook') || noseBridge.includes('aquiline') || noseTip.includes('hook') || noseTip.includes('aquiline');
  const isButton = noseTip.includes('button') || noseBridge.includes('button') || noseTip.includes('upturn');
  const isPointed = noseTip.includes('point') || noseBridge.includes('point');
  const isBulbous = noseTip.includes('bulb') || noseBridge.includes('bulb');
  const isProminent = noseBridge.includes('prominent') || noseBridge.includes('high') || noseBridge.includes('chiseled');

  let noseY = 24;
  let noseW = isWideNose ? 28 : isNarrowNose ? 12.5 : 18;
  let bridgeSpan = isWideNose ? 22 : isNarrowNose ? 9 : 14;

  let tipY = noseY;
  let tipR = 7.5;

  if (isButton) {
    tipY = noseY - 6;
    tipR = 5.5;
  } else if (isAquiline) {
    tipY = noseY + 7;
    tipR = 7;
  } else if (isBulbous) {
    tipY = noseY;
    tipR = 12;
  } else if (isPointed) {
    tipY = noseY + 2;
    tipR = 5;
  }

  // Nasal Bridge Highlight & Lateral Shading
  const bridgeStartY = isProminent ? eyeSocketY - 10 : eyeSocketY + 6;
  const bridgeGrad = ctx.createLinearGradient(-bridgeSpan, bridgeStartY, bridgeSpan, tipY);
  bridgeGrad.addColorStop(0, p.shading);
  bridgeGrad.addColorStop(0.5, 'rgba(255,255,255,0.2)');
  bridgeGrad.addColorStop(1, p.shading);
  ctx.fillStyle = bridgeGrad;
  ctx.fillRect(-bridgeSpan * 0.5, bridgeStartY, bridgeSpan, tipY - bridgeStartY - 4);

  // Dorsal bridge contour lines
  ctx.strokeStyle = p.light;
  ctx.lineWidth = isProminent ? 1.8 : 1.2;
  if (isAquiline) {
    // Convex hooked bridge curve
    ctx.beginPath();
    ctx.moveTo(-5, bridgeStartY);
    ctx.quadraticCurveTo(-12, (bridgeStartY + tipY) * 0.5, -6, tipY - 4);
    ctx.moveTo(5, bridgeStartY);
    ctx.quadraticCurveTo(12, (bridgeStartY + tipY) * 0.5, 6, tipY - 4);
    ctx.stroke();
  } else {
    ctx.beginPath();
    ctx.moveTo(-bridgeSpan * 0.35, bridgeStartY);
    ctx.lineTo(-bridgeSpan * 0.45, tipY - 5);
    ctx.moveTo(bridgeSpan * 0.35, bridgeStartY);
    ctx.lineTo(bridgeSpan * 0.45, tipY - 5);
    ctx.stroke();
  }

  // Nasal Ball (Pronasale)
  const tipGrad = ctx.createRadialGradient(0, tipY - 2, 2, 0, tipY - 2, tipR);
  tipGrad.addColorStop(0, p.highlight);
  tipGrad.addColorStop(0.8, p.skinGradEnd);
  tipGrad.addColorStop(1, p.mid);
  ctx.fillStyle = tipGrad;
  ctx.beginPath();
  if (isPointed) {
    ctx.moveTo(0, tipY + 4);
    ctx.lineTo(-tipR, tipY - 4);
    ctx.lineTo(tipR, tipY - 4);
    ctx.closePath();
  } else {
    ctx.arc(0, tipY - 2, tipR, 0, Math.PI * 2);
  }
  ctx.fill();

  // Nostril Wings (Alar lobules)
  ctx.fillStyle = isPhotoreal ? '#94a3b8' : '#d5c8b5';
  ctx.strokeStyle = p.deep;
  ctx.lineWidth = 1.6;

  // Left Ala
  ctx.beginPath();
  ctx.arc(-noseW, tipY + 2, isWideNose ? 8 : 5.5, Math.PI * 0.4, Math.PI * 1.5, false);
  ctx.stroke();

  // Right Ala
  ctx.beginPath();
  ctx.arc(noseW, tipY + 2, isWideNose ? 8 : 5.5, -Math.PI * 0.5, Math.PI * 0.6, false);
  ctx.stroke();

  // Nostril Cavities
  ctx.fillStyle = p.dark;
  const nostrilR = isWideNose ? 6.5 : isNarrowNose ? 3.5 : 5;
  ctx.beginPath();
  ctx.ellipse(-noseW * 0.55, tipY + 3.5, nostrilR, 2.5, -Math.PI * 0.15, 0, Math.PI * 2);
  ctx.fill();

  ctx.beginPath();
  ctx.ellipse(noseW * 0.55, tipY + 3.5, nostrilR, 2.5, Math.PI * 0.15, 0, Math.PI * 2);
  ctx.fill();

  // Subnasale Cast Shadow
  const subNasalShadow = ctx.createRadialGradient(0, tipY + 6, 2, 0, tipY + 6, isAquiline ? 18 : 14);
  subNasalShadow.addColorStop(0, p.shading);
  subNasalShadow.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.fillStyle = subNasalShadow;
  ctx.beginPath();
  ctx.arc(0, tipY + 6, isAquiline ? 18 : 14, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();

  // --- 8. MOUTH & LIPS ---
  ctx.save();
  const isFullLips = lipType.includes('full') || lipType.includes('plump') || lipType.includes('thick');
  const isThinLips = lipType.includes('thin') || lipType.includes('pencil') || lipType.includes('narrow');
  const isWideMouth = lipType.includes('wide') || lipType.includes('smile') || lipType.includes('broad');
  const isCupidBow = lipType.includes('cupid') || lipType.includes('defined');
  const isDownturnedMouth = lipType.includes('downturn');
  const isSmirk = lipType.includes('smirk');

  const mouthY = 66;
  const mouthW = isWideMouth ? 39 : isThinLips ? 26 : 30;
  const lipThick = isFullLips ? 11 : isThinLips ? 3.2 : 6.5;
  const cornerDrop = isDownturnedMouth ? 4 : isSmirk ? -4 : 0;

  // Philtrum
  ctx.strokeStyle = p.light;
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(-4, tipY + 6);
  ctx.lineTo(-4, mouthY - lipThick - 1);
  ctx.moveTo(4, tipY + 6);
  ctx.lineTo(4, mouthY - lipThick - 1);
  ctx.stroke();

  // Upper Lip
  ctx.fillStyle = isPhotoreal ? '#94a3b8' : '#baa793';
  ctx.strokeStyle = p.deep;
  ctx.lineWidth = 1.3;
  ctx.beginPath();
  ctx.moveTo(-mouthW, mouthY + cornerDrop);
  const cupidDip = isCupidBow ? lipThick * 0.75 : lipThick * 0.45;
  ctx.quadraticCurveTo(-mouthW * 0.45, mouthY - lipThick * 0.85, -6, mouthY - lipThick);
  ctx.lineTo(0, mouthY - cupidDip);
  ctx.lineTo(6, mouthY - lipThick);
  ctx.quadraticCurveTo(mouthW * 0.45, mouthY - lipThick * 0.85, mouthW, mouthY - cornerDrop);
  ctx.quadraticCurveTo(0, mouthY + 1.5, -mouthW, mouthY + cornerDrop);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  // Lower Lip
  ctx.fillStyle = isPhotoreal ? '#cbd5e1' : '#cbbaa5';
  ctx.beginPath();
  ctx.moveTo(-mouthW, mouthY + cornerDrop);
  ctx.quadraticCurveTo(0, mouthY + 1.5, mouthW, mouthY - cornerDrop);
  ctx.quadraticCurveTo(0, mouthY + lipThick * 1.6, -mouthW, mouthY + cornerDrop);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  // Interlabial line
  ctx.strokeStyle = p.dark;
  ctx.lineWidth = 1.8;
  ctx.beginPath();
  ctx.moveTo(-mouthW, mouthY + cornerDrop);
  ctx.quadraticCurveTo(0, mouthY + 1.8, mouthW, mouthY - cornerDrop);
  ctx.stroke();

  // Lip Corners
  ctx.fillStyle = p.dark;
  ctx.beginPath();
  ctx.arc(-mouthW, mouthY + cornerDrop, 2, 0, Math.PI * 2);
  ctx.arc(mouthW, mouthY - cornerDrop, 2, 0, Math.PI * 2);
  ctx.fill();

  // Mental Crease Shadow
  const mentalCrease = ctx.createRadialGradient(0, mouthY + lipThick + 5, 2, 0, mouthY + lipThick + 5, 18);
  mentalCrease.addColorStop(0, p.shading);
  mentalCrease.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.fillStyle = mentalCrease;
  ctx.beginPath();
  ctx.arc(0, mouthY + lipThick + 5, 18, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();

  // --- 9. JAWLINE & CHIN SHADING ---
  ctx.save();
  const chinY = chinDrop - 22;
  const chinGrad = ctx.createRadialGradient(0, chinY, 3, 0, chinY, 18);
  chinGrad.addColorStop(0, p.highlight);
  chinGrad.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.fillStyle = chinGrad;
  ctx.beginPath();
  ctx.arc(0, chinY, 18, 0, Math.PI * 2);
  ctx.fill();

  if (jawType.includes('cleft')) {
    ctx.strokeStyle = p.deep;
    ctx.lineWidth = 2.2;
    ctx.beginPath();
    ctx.moveTo(0, chinY - 6);
    ctx.lineTo(0, chinY + 8);
    ctx.stroke();
  }
  ctx.restore();

  // --- 10. FACIAL HAIR (Stubble, Mustache, Beard) ---
  const isCleanShaven = facialHair.includes('clean') || facialHair.length === 0 || facialHair === 'unknown';
  if (!isCleanShaven) {
    ctx.save();
    ctx.fillStyle = p.dark;

    if (facialHair.includes('stubble') || facialHair.includes('shadow') || facialHair.includes('unshaven')) {
      for (let i = 0; i < 400; i++) {
        const angle = Math.sin(i * 13) * Math.PI;
        const sx = Math.sin(angle) * (jawWidth * 0.7);
        const sy = 60 + Math.abs(Math.cos(angle)) * 60;
        ctx.fillRect(sx, sy, 1.2, 1.2);
      }
    }

    if (facialHair.includes('mustache') || facialHair.includes('moustache')) {
      ctx.strokeStyle = p.dark;
      ctx.lineWidth = 1.8;
      for (let m = -mouthW * 0.9; m <= mouthW * 0.9; m += 3) {
        ctx.beginPath();
        ctx.moveTo(m, mouthY - lipThick - 3);
        ctx.quadraticCurveTo(m * 1.1, mouthY - 1, m * 1.2, mouthY + 1);
        ctx.stroke();
      }
    }

    if (facialHair.includes('beard') || facialHair.includes('goatee')) {
      ctx.strokeStyle = p.dark;
      ctx.lineWidth = 1.8;
      const span = facialHair.includes('goatee') ? 32 : jawWidth * 0.8;
      for (let b = -span; b <= span; b += 3.5) {
        ctx.beginPath();
        ctx.moveTo(b, chinY - 15);
        ctx.quadraticCurveTo(b * 1.05, chinY + 20, b * 0.9, chinY + 34);
        ctx.stroke();
      }
    }
    ctx.restore();
  }

  // --- 11. HAIR (Fine layered pencil strands & volume) ---
  ctx.save();
  const isBald = hairStyle.includes('bald') || hairLength.includes('bald') || hairStyle.includes('shaven');
  const isBuzz = hairStyle.includes('buzz') || hairStyle.includes('fade') || hairLength.includes('crop');
  const isWavy = hairStyle.includes('wavy');
  const isCurly = hairStyle.includes('curl');
  const isSlicked = hairStyle.includes('slick');
  const isMessy = hairStyle.includes('messy') || hairStyle.includes('fringe');
  const isReceding = hairLine.includes('reced') || hairStyle.includes('reced');
  const isCrew = hairStyle.includes('crew');
  const isShaggy = hairStyle.includes('shaggy') || hairLength.includes('long') || hairLength.includes('shoulder');

  if (!isBald) {
    const hairColor = (spec.hair.color.value || '').toLowerCase();
    const hairBaseColor = hairColor.includes('blonde') || hairColor.includes('light') 
      ? (isPhotoreal ? '#94a3b8' : '#caa778') 
      : p.dark;

    let hairTopY = -headH - 18;
    let hairSideW = headW + 12;

    if (isBuzz) {
      hairTopY = -headH - 4;
      hairSideW = headW + 2;
    } else if (isCurly || isWavy) {
      hairTopY = -headH - 26;
      hairSideW = headW + 24;
    } else if (isCrew) {
      hairTopY = -headH - 12;
      hairSideW = headW + 8;
    } else if (isShaggy) {
      hairTopY = -headH - 14;
      hairSideW = headW + 28;
    }

    // Hair Mass Silhouette
    ctx.fillStyle = hairBaseColor;
    ctx.beginPath();
    ctx.moveTo(0, hairTopY);
    ctx.bezierCurveTo(hairSideW * 0.8, hairTopY - 10, hairSideW, -headH * 0.3, hairSideW, 10);

    if (isShaggy) {
      ctx.bezierCurveTo(hairSideW * 1.1, 70, hairSideW, 140, hairSideW * 0.8, 175);
      ctx.lineTo(-hairSideW * 0.8, 175);
      ctx.bezierCurveTo(-hairSideW, 140, -hairSideW * 1.1, 70, -hairSideW, 10);
    } else {
      ctx.bezierCurveTo(hairSideW * 0.9, 45, headW, 40, headW * 0.88, 15);
      const hairlineY = isReceding ? -headH * 0.42 : isMessy ? -headH * 0.72 : -headH * 0.62;
      ctx.quadraticCurveTo(headW * 0.5, hairlineY + 12, 0, hairlineY + (isReceding ? 22 : 0));
      ctx.quadraticCurveTo(-headW * 0.5, hairlineY + 12, -headW * 0.88, 15);
      ctx.bezierCurveTo(-headW, 40, -hairSideW * 0.9, 45, -hairSideW, 10);
    }
    ctx.bezierCurveTo(-hairSideW, -headH * 0.3, -hairSideW * 0.8, hairTopY - 10, 0, hairTopY);
    ctx.closePath();
    ctx.fill();

    // Layered authentic pencil strokes
    ctx.strokeStyle = isPhotoreal ? 'rgba(15, 23, 42, 0.9)' : 'rgba(28, 25, 23, 0.75)';
    ctx.lineWidth = 1.4;

    const strokeCount = isBuzz ? 60 : 130;
    for (let s = 0; s < strokeCount; s++) {
      const t = (s / strokeCount) * 2 - 1;
      const startX = t * (headW * 0.75);
      const startY = hairTopY + 10;
      const endX = t * (hairSideW * 0.95);
      const endY = -headH * 0.4 + Math.abs(t) * 55;

      ctx.beginPath();
      ctx.moveTo(startX, startY);
      if (isCurly) {
        ctx.bezierCurveTo(startX + 18, (startY + endY) / 2 - 12, endX - 18, (startY + endY) / 2 + 12, endX, endY);
      } else if (isWavy) {
        ctx.bezierCurveTo(startX + 12, (startY + endY) / 2 - 6, endX - 12, (startY + endY) / 2 + 6, endX, endY);
      } else {
        ctx.quadraticCurveTo((startX + endX) / 2, startY + 15, endX, endY);
      }
      ctx.stroke();
    }

    // Hair Highlight Sheen
    ctx.strokeStyle = isPhotoreal ? 'rgba(255, 255, 255, 0.25)' : 'rgba(255, 255, 255, 0.35)';
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.arc(0, hairTopY + 22, headW * 0.55, -Math.PI * 0.75, -Math.PI * 0.25);
    ctx.stroke();
  }
  ctx.restore();

  // --- 12. HIGHLIGHT REGION BRACKET ---
  if (highlightRegion) {
    ctx.save();
    ctx.strokeStyle = '#38bdf8';
    ctx.lineWidth = 2;
    ctx.setLineDash([5, 5]);

    if (highlightRegion === 'eyes') {
      ctx.strokeRect(-eyeOffset - 32, eyeSocketY - 22, eyeOffset * 2 + 64, 44);
    } else if (highlightRegion === 'nose') {
      ctx.strokeRect(-noseW - 12, eyeSocketY + 6, noseW * 2 + 24, tipY - eyeSocketY + 24);
    } else if (highlightRegion === 'mouth_lips') {
      ctx.strokeRect(-mouthW - 14, mouthY - lipThick - 8, mouthW * 2 + 28, lipThick * 2 + 26);
    } else if (highlightRegion === 'hair') {
      ctx.strokeRect(-headW - 10, -headH - 24, headW * 2 + 20, headH * 0.75);
    } else if (highlightRegion === 'eyebrows') {
      ctx.strokeRect(-eyeOffset - 36, browY - 14, eyeOffset * 2 + 72, 28);
    } else if (highlightRegion === 'jawline_chin') {
      ctx.strokeRect(-jawWidth - 8, chinY - 26, jawWidth * 2 + 16, 52);
    }
    ctx.restore();
  }

  ctx.restore();
}

/**
 * Procedural authentic 90-degree lateral profile rendering.
 */
function drawProfileMorphology(
  ctx: CanvasRenderingContext2D,
  p: any,
  geo: any
) {
  const { headW, headH, eyeShape, noseBridge, noseTip, jawType } = geo;

  ctx.save();
  ctx.fillStyle = p.skinGradStart;
  ctx.strokeStyle = p.pencilStroke;
  ctx.lineWidth = 2;

  ctx.beginPath();
  ctx.moveTo(25, -headH);
  ctx.bezierCurveTo(headW * 1.1, -headH * 0.8, headW * 1.15, 0, headW * 0.85, 45);
  ctx.lineTo(headW * 0.7, 130);
  ctx.lineTo(-headW * 0.2, 130);
  ctx.lineTo(-15, 115);

  const chinOut = jawType.includes('prominent') ? -44 : -34;
  ctx.quadraticCurveTo(chinOut * 0.5, 115, chinOut, 105);
  ctx.lineTo(chinOut + 4, 95);
  ctx.quadraticCurveTo(chinOut + 14, 82, chinOut + 6, 75);
  ctx.lineTo(chinOut + 14, 68);
  ctx.lineTo(chinOut + 4, 64);
  ctx.lineTo(chinOut + 15, 60);
  ctx.lineTo(chinOut + 2, 40);

  const noseOut = noseTip.includes('point') ? -68 : -62;
  const noseY = 32;
  ctx.lineTo(noseOut, noseY);

  const bridgeX = noseBridge.includes('hook') || noseBridge.includes('aquiline') ? -52 : -44;
  ctx.lineTo(bridgeX, 8);
  ctx.lineTo(-35, -12);
  ctx.quadraticCurveTo(-42, -32, -32, -58);
  ctx.bezierCurveTo(-22, -headH * 0.8, -5, -headH, 25, -headH);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  // Profile Ear
  const earX = 30;
  const earY = 8;
  ctx.fillStyle = p.skinGradEnd;
  ctx.beginPath();
  ctx.ellipse(earX, earY, 15, 24, 0.1, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();

  // Profile Eye
  ctx.fillStyle = p.dark;
  ctx.beginPath();
  ctx.moveTo(-18, -10);
  ctx.lineTo(-6, -15);
  ctx.lineTo(-6, -5);
  ctx.closePath();
  ctx.fill();

  // Profile Eyebrow
  ctx.strokeStyle = p.deep;
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.moveTo(-34, -24);
  ctx.quadraticCurveTo(-14, -28, 4, -22);
  ctx.stroke();

  ctx.restore();
}

/**
 * Renders an evidentiary confidence heatmap overlay.
 */
function renderConfidenceHeatmap(
  ctx: CanvasRenderingContext2D,
  spec: FaceSpec,
  width: number,
  height: number,
  viewAngle: 'frontal' | 'profile' | 'dual' = 'frontal',
  highlightRegion?: string | null
) {
  const confidences = calculateRegionConfidences(spec);

  const usableTop = 26;
  const usableBottom = height - 32;
  const usableHeight = usableBottom - usableTop;

  interface HeatmapRegionGeo {
    id: string;
    label: string;
    x: number;
    y: number;
    rx: number;
    ry: number;
  }

  const regions: HeatmapRegionGeo[] = [];

  if (viewAngle === 'profile') {
    regions.push(
      { id: 'hair', label: 'HAIR', x: width * 0.48, y: usableTop + usableHeight * 0.22, rx: width * 0.22, ry: usableHeight * 0.12 },
      { id: 'eyebrows', label: 'BROWS', x: width * 0.36, y: usableTop + usableHeight * 0.38, rx: width * 0.11, ry: usableHeight * 0.045 },
      { id: 'eyes', label: 'EYE', x: width * 0.36, y: usableTop + usableHeight * 0.43, rx: width * 0.10, ry: usableHeight * 0.055 },
      { id: 'nose', label: 'NOSE', x: width * 0.31, y: usableTop + usableHeight * 0.52, rx: width * 0.09, ry: usableHeight * 0.075 },
      { id: 'mouth_lips', label: 'MOUTH', x: width * 0.35, y: usableTop + usableHeight * 0.65, rx: width * 0.09, ry: usableHeight * 0.055 },
      { id: 'jawline_chin', label: 'JAW/CHIN', x: width * 0.41, y: usableTop + usableHeight * 0.75, rx: width * 0.15, ry: usableHeight * 0.085 },
      { id: 'cheekbones_ears', label: 'EAR/CHEEK', x: width * 0.55, y: usableTop + usableHeight * 0.54, rx: width * 0.11, ry: usableHeight * 0.085 },
      { id: 'facial_hair', label: 'FACIAL HAIR', x: width * 0.38, y: usableTop + usableHeight * 0.71, rx: width * 0.13, ry: usableHeight * 0.08 }
    );
  } else if (viewAngle === 'dual') {
    const cx1 = width * 0.26;
    regions.push(
      { id: 'hair', label: 'HAIR', x: cx1, y: usableTop + usableHeight * 0.22, rx: width * 0.13, ry: usableHeight * 0.10 },
      { id: 'eyebrows', label: 'BROWS', x: cx1, y: usableTop + usableHeight * 0.38, rx: width * 0.10, ry: usableHeight * 0.04 },
      { id: 'eyes', label: 'EYES', x: cx1, y: usableTop + usableHeight * 0.44, rx: width * 0.10, ry: usableHeight * 0.05 },
      { id: 'nose', label: 'NOSE', x: cx1, y: usableTop + usableHeight * 0.53, rx: width * 0.06, ry: usableHeight * 0.07 },
      { id: 'mouth_lips', label: 'MOUTH', x: cx1, y: usableTop + usableHeight * 0.65, rx: width * 0.07, ry: usableHeight * 0.05 },
      { id: 'jawline_chin', label: 'JAW/CHIN', x: cx1, y: usableTop + usableHeight * 0.75, rx: width * 0.10, ry: usableHeight * 0.08 }
    );
    const cx2 = width * 0.75;
    regions.push(
      { id: 'hair', label: 'HAIR', x: cx2 + width * 0.02, y: usableTop + usableHeight * 0.22, rx: width * 0.13, ry: usableHeight * 0.10 },
      { id: 'nose', label: 'NOSE', x: cx2 - width * 0.08, y: usableTop + usableHeight * 0.52, rx: width * 0.06, ry: usableHeight * 0.07 },
      { id: 'jawline_chin', label: 'JAW/CHIN', x: cx2 - width * 0.03, y: usableTop + usableHeight * 0.75, rx: width * 0.09, ry: usableHeight * 0.08 }
    );
  } else {
    // Frontal
    const cx = width * 0.5;
    regions.push(
      { id: 'hair', label: 'HAIR', x: cx, y: usableTop + usableHeight * 0.22, rx: width * 0.24, ry: usableHeight * 0.12 },
      { id: 'eyebrows', label: 'BROWS', x: cx, y: usableTop + usableHeight * 0.37, rx: width * 0.19, ry: usableHeight * 0.045 },
      { id: 'eyes', label: 'EYES', x: cx, y: usableTop + usableHeight * 0.44, rx: width * 0.17, ry: usableHeight * 0.055 },
      { id: 'nose', label: 'NOSE', x: cx, y: usableTop + usableHeight * 0.53, rx: width * 0.085, ry: usableHeight * 0.08 },
      { id: 'cheekbones_ears', label: 'CHEEKS', x: cx - width * 0.18, y: usableTop + usableHeight * 0.54, rx: width * 0.07, ry: usableHeight * 0.085 },
      { id: 'cheekbones_ears', label: 'CHEEKS', x: cx + width * 0.18, y: usableTop + usableHeight * 0.54, rx: width * 0.07, ry: usableHeight * 0.085 },
      { id: 'mouth_lips', label: 'MOUTH', x: cx, y: usableTop + usableHeight * 0.65, rx: width * 0.11, ry: usableHeight * 0.055 },
      { id: 'facial_hair', label: 'BEARD', x: cx, y: usableTop + usableHeight * 0.71, rx: width * 0.15, ry: usableHeight * 0.08 },
      { id: 'jawline_chin', label: 'JAW/CHIN', x: cx, y: usableTop + usableHeight * 0.76, rx: width * 0.18, ry: usableHeight * 0.08 }
    );
  }

  ctx.save();

  for (const reg of regions) {
    const data = confidences[reg.id];
    if (!data) continue;

    const isSelected = highlightRegion === reg.id;
    const isLow = data.level === 'low';
    const isModerate = data.level === 'moderate';

    ctx.save();
    ctx.translate(reg.x, reg.y);
    ctx.scale(reg.rx, reg.ry);

    const grad = ctx.createRadialGradient(0, 0, 0, 0, 0, 1);
    if (isLow) {
      const alpha = isSelected ? 0.85 : 0.65;
      grad.addColorStop(0, `rgba(239, 68, 68, ${alpha})`);
      grad.addColorStop(0.35, `rgba(249, 115, 22, ${alpha * 0.8})`);
      grad.addColorStop(0.7, `rgba(234, 179, 8, ${alpha * 0.35})`);
      grad.addColorStop(1, 'rgba(239, 68, 68, 0)');
    } else if (isModerate) {
      const alpha = isSelected ? 0.65 : 0.45;
      grad.addColorStop(0, `rgba(234, 179, 8, ${alpha})`);
      grad.addColorStop(0.5, `rgba(245, 158, 11, ${alpha * 0.6})`);
      grad.addColorStop(1, 'rgba(234, 179, 8, 0)');
    } else {
      const alpha = isSelected ? 0.45 : 0.25;
      grad.addColorStop(0, `rgba(16, 185, 129, ${alpha})`);
      grad.addColorStop(0.6, `rgba(6, 182, 212, ${alpha * 0.4})`);
      grad.addColorStop(1, 'rgba(16, 185, 129, 0)');
    }

    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.arc(0, 0, 1, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  const drawnLabels = new Set<string>();

  for (const reg of regions) {
    const data = confidences[reg.id];
    if (!data) continue;

    const shouldDrawBadge = !drawnLabels.has(reg.id);
    drawnLabels.add(reg.id);

    const isSelected = highlightRegion === reg.id;
    const isLow = data.level === 'low';
    const isModerate = data.level === 'moderate';

    ctx.save();
    ctx.beginPath();
    ctx.ellipse(reg.x, reg.y, reg.rx * 0.9, reg.ry * 0.85, 0, 0, Math.PI * 2);
    if (isLow) {
      ctx.strokeStyle = isSelected ? '#ef4444' : 'rgba(239, 68, 68, 0.85)';
      ctx.lineWidth = isSelected ? 2 : 1.5;
      ctx.setLineDash([4, 4]);
      ctx.stroke();

      ctx.setLineDash([]);
      ctx.lineWidth = 1;
      const s = 5;
      ctx.beginPath();
      ctx.moveTo(reg.x - s, reg.y); ctx.lineTo(reg.x + s, reg.y);
      ctx.moveTo(reg.x, reg.y - s); ctx.lineTo(reg.x + s, reg.y);
      ctx.stroke();
    } else if (isModerate) {
      ctx.strokeStyle = 'rgba(234, 179, 8, 0.6)';
      ctx.lineWidth = 1;
      ctx.setLineDash([3, 5]);
      ctx.stroke();
    } else {
      ctx.strokeStyle = 'rgba(16, 185, 129, 0.4)';
      ctx.lineWidth = 1;
      ctx.setLineDash([2, 4]);
      ctx.stroke();
    }
    ctx.restore();

    if (shouldDrawBadge && width >= 320) {
      ctx.save();
      const pct = Math.round(data.confidence * 100);
      const text = isLow 
        ? `${reg.label}: ${data.stated ? `${pct}% LOW` : 'UNSTATED'}`
        : `${reg.label}: ${pct}%`;

      ctx.font = '600 9px "JetBrains Mono", monospace';
      const textMetrics = ctx.measureText(text);
      const badgeW = textMetrics.width + 10;
      const badgeH = 15;
      const badgeX = reg.x - badgeW / 2;
      const badgeY = reg.y - badgeH / 2;

      ctx.fillStyle = isLow ? 'rgba(69, 10, 10, 0.92)' : isModerate ? 'rgba(41, 37, 36, 0.92)' : 'rgba(6, 44, 30, 0.92)';
      ctx.strokeStyle = isLow ? '#ef4444' : isModerate ? '#eab308' : '#10b981';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.roundRect(badgeX, badgeY, badgeW, badgeH, 3);
      ctx.fill();
      ctx.stroke();

      ctx.fillStyle = isLow ? '#fecaca' : isModerate ? '#fef08a' : '#a7f3d0';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(text, reg.x, reg.y + 0.5);
      ctx.restore();
    }
  }

  // Calibration scale in top right corner
  ctx.save();
  const barW = 110;
  const barH = 8;
  const barX = width - barW - 12;
  const barY = usableTop + 8;

  ctx.fillStyle = 'rgba(15, 23, 42, 0.88)';
  ctx.strokeStyle = 'rgba(51, 65, 85, 0.8)';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.roundRect(barX - 6, barY - 6, barW + 12, barH + 26, 4);
  ctx.fill();
  ctx.stroke();

  ctx.fillStyle = '#f87171';
  ctx.font = '600 8px "JetBrains Mono", monospace';
  ctx.textAlign = 'left';
  ctx.fillText('CONFIDENCE HEATMAP', barX, barY + 1);

  const specGrad = ctx.createLinearGradient(barX, 0, barX + barW, 0);
  specGrad.addColorStop(0, '#ef4444');
  specGrad.addColorStop(0.35, '#f97316');
  specGrad.addColorStop(0.65, '#eab308');
  specGrad.addColorStop(1, '#10b981');

  ctx.fillStyle = specGrad;
  ctx.fillRect(barX, barY + 7, barW, barH);
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)';
  ctx.strokeRect(barX, barY + 7, barW, barH);

  ctx.fillStyle = '#94a3b8';
  ctx.font = '500 7px "JetBrains Mono", monospace';
  ctx.textAlign = 'left';
  ctx.fillText('0% LOW (FOCUS)', barX, barY + 23);
  ctx.textAlign = 'right';
  ctx.fillText('100% HIGH', barX + barW, barY + 23);

  ctx.restore();
  ctx.restore();
}

/**
 * Renders the Craniometric Facial Symmetry Overlay:
 * Visualizes the central Sagittal plumb-line, horizontal cranial planes (ocular, nasal, labial, mandibular),
 * and an on-canvas HUD telemetry card displaying the overall symmetry percentage index and sub-metrics.
 */
function renderFacialSymmetryOverlay(
  ctx: CanvasRenderingContext2D,
  spec: FaceSpec,
  width: number,
  height: number,
  viewAngle: 'frontal' | 'profile' | 'dual',
  isPhotoreal: boolean
) {
  const sym = calculateFacialSymmetryScore(spec);
  const usableTop = 26;
  const usableBottom = height - 32;
  const usableHeight = usableBottom - usableTop;
  const cx = width / 2;
  const cy = usableTop + usableHeight * 0.50;

  ctx.save();

  // 1. Central Sagittal Axis (Vertical Plumb-Line)
  ctx.strokeStyle = '#a855f7';
  ctx.lineWidth = 1.5;
  ctx.setLineDash([5, 4]);
  ctx.beginPath();
  ctx.moveTo(cx, usableTop + 8);
  ctx.lineTo(cx, usableBottom - 8);
  ctx.stroke();

  // 2. Bilateral Cranial Reference Planes
  const scale = Math.min(width / 420, usableHeight / 500);
  const eyeY = cy + (-18 * scale);
  const noseY = cy + (24 * scale);
  const lipY = cy + (66 * scale);
  const chinY = cy + (112 * scale);

  const drawPlane = (y: number, label: string) => {
    ctx.strokeStyle = 'rgba(168, 85, 247, 0.45)';
    ctx.lineWidth = 1;
    ctx.setLineDash([3, 5]);
    ctx.beginPath();
    ctx.moveTo(cx - 130, y);
    ctx.lineTo(cx + 130, y);
    ctx.stroke();

    ctx.fillStyle = '#c084fc';
    ctx.font = '600 8px "JetBrains Mono", monospace';
    ctx.textAlign = 'right';
    ctx.fillText(label, cx - 134, y + 2.5);
  };

  drawPlane(eyeY, 'OCULAR');
  drawPlane(noseY, 'NASAL');
  drawPlane(lipY, 'LABIAL');
  drawPlane(chinY, 'MANDIBULAR');

  // Bilateral tick marks on eyes
  const eyeOffset = 43 * scale;
  ctx.setLineDash([]);
  ctx.strokeStyle = '#a855f7';
  ctx.lineWidth = 1.5;
  for (const dir of [-1, 1]) {
    const ex = cx + dir * eyeOffset;
    ctx.beginPath();
    ctx.moveTo(ex, eyeY - 7); ctx.lineTo(ex, eyeY + 7);
    ctx.stroke();
  }

  // 3. Symmetry HUD Telemetry Card in top-left
  const hudW = 194;
  const hudH = 58;
  const hudX = 12;
  const hudY = usableTop + 8;

  ctx.fillStyle = 'rgba(15, 23, 42, 0.92)';
  ctx.strokeStyle = '#a855f7';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.roundRect(hudX, hudY, hudW, hudH, 6);
  ctx.fill();
  ctx.stroke();

  // Header
  ctx.fillStyle = '#d8b4fe';
  ctx.font = '700 9px "JetBrains Mono", monospace';
  ctx.textAlign = 'left';
  ctx.fillText('CRANIOMETRIC SYMMETRY INDEX', hudX + 8, hudY + 14);

  // Big percentage badge
  ctx.fillStyle = sym.score >= 95 ? '#4ade80' : sym.score >= 90 ? '#facc15' : '#fb923c';
  ctx.font = '800 16px "JetBrains Mono", monospace';
  ctx.textAlign = 'right';
  ctx.fillText(sym.percentageText, hudX + hudW - 8, hudY + 18);

  // Progress Bar
  const barX = hudX + 8;
  const barY = hudY + 22;
  const barW = hudW - 16;
  const barH = 5;

  ctx.fillStyle = 'rgba(51, 65, 85, 0.7)';
  ctx.fillRect(barX, barY, barW, barH);

  const fillW = (sym.score / 100) * barW;
  const barGrad = ctx.createLinearGradient(barX, 0, barX + barW, 0);
  barGrad.addColorStop(0, '#a855f7');
  barGrad.addColorStop(1, sym.score >= 95 ? '#22c55e' : '#eab308');
  ctx.fillStyle = barGrad;
  ctx.fillRect(barX, barY, fillW, barH);

  // Sub-metrics breakdown
  ctx.fillStyle = '#94a3b8';
  ctx.font = '600 7.5px "JetBrains Mono", monospace';
  ctx.textAlign = 'left';
  ctx.fillText(`OCU:${sym.ocularBalance}% | NAS:${sym.nasalBalance}% | LAB:${sym.labialBalance}% | MAN:${sym.mandibularBalance}%`, hudX + 8, hudY + 39);

  // Classification
  ctx.fillStyle = '#c084fc';
  ctx.font = '500 7px "JetBrains Mono", monospace';
  ctx.fillText(sym.classification.toUpperCase(), hudX + 8, hudY + 49);

  ctx.restore();
}

