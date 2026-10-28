import { FaceSpec } from '../types';

export interface RenderOptions {
  width: number;
  height: number;
  styleMode: 'charcoal' | 'photoreal';
  showGrid?: boolean;
  showLandmarks?: boolean;
  highlightRegion?: string | null;
  caseNumber: string;
  version: number;
  entryHash?: string;
}

/**
 * Draws the procedural forensic facial composite onto a 2D canvas context.
 */
export function drawForensicComposite(
  ctx: CanvasRenderingContext2D,
  spec: FaceSpec,
  options: RenderOptions
) {
  const { width, height, styleMode, showGrid, showLandmarks, highlightRegion, caseNumber, version, entryHash } = options;

  // Clear canvas
  ctx.clearRect(0, 0, width, height);

  // 1. Background Paper Texture / Neutral Tone
  const bgGrad = ctx.createRadialGradient(width / 2, height / 2, 50, width / 2, height / 2, width * 0.7);
  if (styleMode === 'charcoal') {
    bgGrad.addColorStop(0, '#1e293b');
    bgGrad.addColorStop(1, '#0f172a');
  } else {
    bgGrad.addColorStop(0, '#1e293b');
    bgGrad.addColorStop(1, '#0b1120');
  }
  ctx.fillStyle = bgGrad;
  ctx.fillRect(0, 0, width, height);

  // Subtle paper grain effect
  ctx.save();
  ctx.fillStyle = 'rgba(255, 255, 255, 0.02)';
  for (let i = 0; i < 250; i++) {
    const rx = (Math.sin(i * 997) * 0.5 + 0.5) * width;
    const ry = (Math.cos(i * 883) * 0.5 + 0.5) * height;
    ctx.fillRect(rx, ry, 1.5, 1.5);
  }
  ctx.restore();

  // Grid guides if enabled
  if (showGrid) {
    ctx.save();
    ctx.strokeStyle = 'rgba(56, 189, 248, 0.15)';
    ctx.lineWidth = 1;
    ctx.setLineDash([4, 4]);
    // Center vertical axis
    ctx.beginPath();
    ctx.moveTo(width / 2, 0);
    ctx.lineTo(width / 2, height);
    // Eye horizontal axis
    ctx.moveTo(0, height * 0.44);
    ctx.lineTo(width, height * 0.44);
    // Nose axis
    ctx.moveTo(0, height * 0.56);
    ctx.lineTo(width, height * 0.56);
    // Mouth axis
    ctx.moveTo(0, height * 0.67);
    ctx.lineTo(width, height * 0.67);
    ctx.stroke();
    ctx.restore();
  }

  const cx = width / 2;
  const cy = height * 0.48;

  // Determine morphology from FaceSpec
  const faceShape = spec.face_shape.stated ? spec.face_shape.value.toLowerCase() : 'neutral';
  const skinTone = spec.skin_tone_complexion.stated ? spec.skin_tone_complexion.value.toLowerCase() : 'medium';
  const age = spec.approximate_age.stated ? spec.approximate_age.value.toLowerCase() : 'adult';
  const hairStyle = spec.hair.style.stated ? spec.hair.style.value.toLowerCase() : spec.hair.length.value.toLowerCase();
  const hairColor = spec.hair.color.stated ? spec.hair.color.value.toLowerCase() : 'dark';
  const eyeColor = spec.eyes.color.stated ? spec.eyes.color.value.toLowerCase() : 'brown';
  const eyeShape = spec.eyes.shape.stated ? spec.eyes.shape.value.toLowerCase() : 'almond';
  const eyeSpacing = spec.eyes.spacing.stated ? spec.eyes.spacing.value.toLowerCase() : 'normal';
  const noseWidth = spec.nose.width.stated ? spec.nose.width.value.toLowerCase() : 'medium';
  const noseBridge = spec.nose.bridge.stated ? spec.nose.bridge.value.toLowerCase() : 'straight';
  const mouthStyle = spec.mouth_lips.stated ? spec.mouth_lips.value.toLowerCase() : 'medium';
  const jawStyle = spec.jawline_chin.stated ? spec.jawline_chin.value.toLowerCase() : 'neutral';
  const facialHair = spec.facial_hair.stated ? spec.facial_hair.value.toLowerCase() : 'none';
  const accessories = spec.accessories.stated ? spec.accessories.value.toLowerCase() : 'none';
  const scarMark = spec.distinguishing_marks.type.stated ? spec.distinguishing_marks.type.value.toLowerCase() : 'none';

  // Face Width & Height
  let fw = width * 0.28;
  let fh = height * 0.32;
  if (faceShape.includes('square')) { fw = width * 0.31; fh = height * 0.30; }
  if (faceShape.includes('round')) { fw = width * 0.30; fh = height * 0.28; }
  if (faceShape.includes('angular') || faceShape.includes('chiseled')) { fw = width * 0.27; fh = height * 0.34; }
  if (faceShape.includes('oblong')) { fw = width * 0.25; fh = height * 0.35; }

  // 2. Neck & Shoulders
  ctx.save();
  ctx.fillStyle = styleMode === 'charcoal' ? '#334155' : '#475569';
  ctx.beginPath();
  ctx.moveTo(cx - fw * 0.65, cy + fh * 0.7);
  ctx.lineTo(cx - width * 0.42, height * 0.95);
  ctx.lineTo(cx + width * 0.42, height * 0.95);
  ctx.lineTo(cx + fw * 0.65, cy + fh * 0.7);
  ctx.closePath();
  ctx.fill();

  // Neck shading
  ctx.strokeStyle = 'rgba(15, 23, 42, 0.7)';
  ctx.lineWidth = 2;
  ctx.stroke();
  ctx.restore();

  // 3. Head & Jaw Base Contour
  ctx.save();
  // Region highlight if face/jaw is hovered
  if (highlightRegion === 'face_shape' || highlightRegion === 'jawline_chin') {
    ctx.shadowColor = '#38bdf8';
    ctx.shadowBlur = 15;
  }

  // Base head tone
  let baseTone = '#cbd5e1';
  if (skinTone.includes('dark')) baseTone = '#64748b';
  else if (skinTone.includes('tan') || skinTone.includes('olive')) baseTone = '#94a3b8';
  else if (skinTone.includes('pale') || skinTone.includes('fair')) baseTone = '#e2e8f0';

  ctx.fillStyle = baseTone;
  ctx.strokeStyle = '#0f172a';
  ctx.lineWidth = styleMode === 'charcoal' ? 3.5 : 2.5;

  ctx.beginPath();
  // Top cranium
  ctx.ellipse(cx, cy - fh * 0.15, fw, fh * 0.65, 0, Math.PI, 0, false);
  
  // Jawline contour
  if (jawStyle.includes('square') || faceShape.includes('square')) {
    ctx.lineTo(cx + fw * 0.95, cy + fh * 0.5);
    ctx.lineTo(cx + fw * 0.45, cy + fh * 0.88);
    ctx.lineTo(cx, cy + fh * 0.92);
    ctx.lineTo(cx - fw * 0.45, cy + fh * 0.88);
    ctx.lineTo(cx - fw * 0.95, cy + fh * 0.5);
  } else if (jawStyle.includes('pointed') || jawStyle.includes('sharp') || faceShape.includes('angular')) {
    ctx.lineTo(cx + fw * 0.85, cy + fh * 0.45);
    ctx.lineTo(cx + fw * 0.25, cy + fh * 0.94);
    ctx.lineTo(cx, cy + fh * 0.97);
    ctx.lineTo(cx - fw * 0.25, cy + fh * 0.94);
    ctx.lineTo(cx - fw * 0.85, cy + fh * 0.45);
  } else {
    // Oval / smooth curve
    ctx.bezierCurveTo(cx + fw * 0.95, cy + fh * 0.4, cx + fw * 0.6, cy + fh * 0.85, cx, cy + fh * 0.90);
    ctx.bezierCurveTo(cx - fw * 0.6, cy + fh * 0.85, cx - fw * 0.95, cy + fh * 0.4, cx - fw, cy - fh * 0.15);
  }
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
  ctx.restore();

  // 4. Ears
  ctx.save();
  ctx.fillStyle = baseTone;
  ctx.strokeStyle = '#1e293b';
  ctx.lineWidth = 2.5;
  // Left Ear
  ctx.beginPath();
  ctx.ellipse(cx - fw * 1.02, cy + fh * 0.05, fw * 0.12, fh * 0.25, -0.05, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();
  // Right Ear
  ctx.beginPath();
  ctx.ellipse(cx + fw * 1.02, cy + fh * 0.05, fw * 0.12, fh * 0.25, 0.05, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();
  ctx.restore();

  // 5. Charcoal Cheek & Temple Shading
  ctx.save();
  ctx.fillStyle = 'rgba(15, 23, 42, 0.12)';
  // Cheekbones
  ctx.beginPath();
  ctx.ellipse(cx - fw * 0.55, cy + fh * 0.25, fw * 0.25, fh * 0.15, -0.3, 0, Math.PI * 2);
  ctx.ellipse(cx + fw * 0.55, cy + fh * 0.25, fw * 0.25, fh * 0.15, 0.3, 0, Math.PI * 2);
  ctx.fill();

  // Age lines if elderly/mature
  if (age.includes('40') || age.includes('50') || age.includes('60') || age.includes('elderly') || age.includes('middle')) {
    ctx.strokeStyle = 'rgba(15, 23, 42, 0.4)';
    ctx.lineWidth = 1.5;
    // Forehead creases
    ctx.beginPath();
    ctx.moveTo(cx - fw * 0.45, cy - fh * 0.45);
    ctx.quadraticCurveTo(cx, cy - fh * 0.48, cx + fw * 0.45, cy - fh * 0.45);
    ctx.moveTo(cx - fw * 0.35, cy - fh * 0.35);
    ctx.quadraticCurveTo(cx, cy - fh * 0.38, cx + fw * 0.35, cy - fh * 0.35);
    // Nasolabial folds
    ctx.moveTo(cx - fw * 0.3, cy + fh * 0.35);
    ctx.lineTo(cx - fw * 0.38, cy + fh * 0.65);
    ctx.moveTo(cx + fw * 0.3, cy + fh * 0.35);
    ctx.lineTo(cx + fw * 0.38, cy + fh * 0.65);
    ctx.stroke();
  }
  ctx.restore();

  // 6. Eyes & Eyebrows
  ctx.save();
  let eyeDist = fw * 0.42;
  if (eyeSpacing.includes('wide')) eyeDist = fw * 0.50;
  if (eyeSpacing.includes('close')) eyeDist = fw * 0.35;
  const eyeY = cy - fh * 0.05;

  const browY = eyeY - fh * 0.12;
  const browThickness = spec.eyebrows.stated && spec.eyebrows.value.includes('thick') ? 6 : (spec.eyebrows.value.includes('thin') ? 2.5 : 4);

  // Eyebrows
  ctx.lineWidth = browThickness;
  ctx.strokeStyle = hairColor.includes('blonde') ? '#78716c' : (hairColor.includes('grey') ? '#64748b' : '#0f172a');
  ctx.lineCap = 'round';
  // Left eyebrow
  ctx.beginPath();
  ctx.moveTo(cx - eyeDist - fw * 0.22, browY + 2);
  ctx.quadraticCurveTo(cx - eyeDist, browY - (spec.eyebrows.value.includes('arched') ? 8 : 2), cx - eyeDist + fw * 0.22, browY + 4);
  ctx.stroke();
  // Right eyebrow
  ctx.beginPath();
  ctx.moveTo(cx + eyeDist - fw * 0.22, browY + 4);
  ctx.quadraticCurveTo(cx + eyeDist, browY - (spec.eyebrows.value.includes('arched') ? 8 : 2), cx + eyeDist + fw * 0.22, browY + 2);
  ctx.stroke();

  // Eyes Outline
  const eyeW = fw * 0.22;
  let eyeH = fh * 0.08;
  if (eyeShape.includes('round') || eyeShape.includes('large')) eyeH = fh * 0.11;
  if (eyeShape.includes('narrow') || eyeShape.includes('hooded')) eyeH = fh * 0.06;

  const drawSingleEye = (eyeX: number, isRight: boolean) => {
    // Sclera (White)
    ctx.fillStyle = '#f8fafc';
    ctx.strokeStyle = '#0f172a';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(eyeX - eyeW, eyeY);
    ctx.quadraticCurveTo(eyeX, eyeY - eyeH * 1.5, eyeX + eyeW, eyeY);
    ctx.quadraticCurveTo(eyeX, eyeY + eyeH * 1.4, eyeX - eyeW, eyeY);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // Iris
    let irisColor = '#451a03'; // default dark brown
    if (eyeColor.includes('blue')) irisColor = '#1e3a8a';
    if (eyeColor.includes('green')) irisColor = '#14532d';
    if (eyeColor.includes('hazel')) irisColor = '#713f12';
    if (eyeColor.includes('grey')) irisColor = '#475569';

    ctx.fillStyle = irisColor;
    ctx.beginPath();
    ctx.arc(eyeX, eyeY, eyeH * 0.85, 0, Math.PI * 2);
    ctx.fill();

    // Pupil
    ctx.fillStyle = '#020617';
    ctx.beginPath();
    ctx.arc(eyeX, eyeY, eyeH * 0.45, 0, Math.PI * 2);
    ctx.fill();

    // Light reflection glint
    ctx.fillStyle = 'rgba(255, 255, 255, 0.85)';
    ctx.beginPath();
    ctx.arc(eyeX - 2, eyeY - 2, eyeH * 0.18, 0, Math.PI * 2);
    ctx.fill();

    // Upper eyelid charcoal crease
    ctx.strokeStyle = 'rgba(15, 23, 42, 0.6)';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(eyeX - eyeW * 0.9, eyeY - eyeH * 1.8);
    ctx.quadraticCurveTo(eyeX, eyeY - eyeH * 2.1, eyeX + eyeW * 0.9, eyeY - eyeH * 1.5);
    ctx.stroke();
  };

  drawSingleEye(cx - eyeDist, false);
  drawSingleEye(cx + eyeDist, true);
  ctx.restore();

  // 7. Nose
  ctx.save();
  const noseY = cy + fh * 0.22;
  let nw = fw * 0.22;
  if (noseWidth.includes('wide') || noseWidth.includes('broad')) nw = fw * 0.30;
  if (noseWidth.includes('narrow') || noseWidth.includes('thin')) nw = fw * 0.16;

  ctx.strokeStyle = '#0f172a';
  ctx.lineWidth = 2.5;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';

  // Nose Bridge line
  ctx.beginPath();
  if (noseBridge.includes('crooked')) {
    ctx.moveTo(cx - 2, eyeY);
    ctx.lineTo(cx + 6, cy + fh * 0.08);
    ctx.lineTo(cx - 1, noseY - fh * 0.05);
  } else {
    ctx.moveTo(cx - 2, eyeY - 2);
    ctx.lineTo(cx - 4, noseY - fh * 0.04);
  }
  ctx.stroke();

  // Nose tip & nostrils
  ctx.beginPath();
  // Left nostril
  ctx.moveTo(cx - nw, noseY + 2);
  ctx.quadraticCurveTo(cx - nw * 0.6, noseY - 6, cx - nw * 0.25, noseY);
  // Center tip bulb
  ctx.quadraticCurveTo(cx, noseY + 5, cx + nw * 0.25, noseY);
  // Right nostril
  ctx.quadraticCurveTo(cx + nw * 0.6, noseY - 6, cx + nw, noseY + 2);
  ctx.stroke();

  // Charcoal shadow under nose tip
  ctx.fillStyle = 'rgba(15, 23, 42, 0.25)';
  ctx.beginPath();
  ctx.ellipse(cx, noseY + 3, nw * 0.45, 3.5, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();

  // 8. Mouth & Lips
  ctx.save();
  const mouthY = cy + fh * 0.52;
  let mw = fw * 0.38;
  if (mouthStyle.includes('wide')) mw = fw * 0.48;
  if (mouthStyle.includes('thin')) mw = fw * 0.32;
  const lipThickness = mouthStyle.includes('full') ? 6 : (mouthStyle.includes('thin') ? 2 : 4);

  // Upper lip
  ctx.fillStyle = styleMode === 'charcoal' ? '#64748b' : '#94a3b8';
  ctx.strokeStyle = '#0f172a';
  ctx.lineWidth = 2.2;
  ctx.beginPath();
  ctx.moveTo(cx - mw, mouthY);
  ctx.quadraticCurveTo(cx - mw * 0.4, mouthY - lipThickness * 1.5, cx - mw * 0.1, mouthY - lipThickness * 1.2);
  ctx.lineTo(cx, mouthY - lipThickness * 0.6); // Cupid's bow dip
  ctx.lineTo(cx + mw * 0.1, mouthY - lipThickness * 1.2);
  ctx.quadraticCurveTo(cx + mw * 0.4, mouthY - lipThickness * 1.5, cx + mw, mouthY);
  // Mouth parting line
  ctx.quadraticCurveTo(cx, mouthY + 1.5, cx - mw, mouthY);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  // Lower lip
  ctx.beginPath();
  ctx.moveTo(cx - mw * 0.85, mouthY + 1);
  ctx.quadraticCurveTo(cx, mouthY + lipThickness * 2.2, cx + mw * 0.85, mouthY + 1);
  ctx.stroke();

  // Philtrum groove
  ctx.strokeStyle = 'rgba(15, 23, 42, 0.3)';
  ctx.lineWidth = 1.2;
  ctx.beginPath();
  ctx.moveTo(cx - 3, noseY + 6);
  ctx.lineTo(cx - 2, mouthY - lipThickness * 0.7);
  ctx.moveTo(cx + 3, noseY + 6);
  ctx.lineTo(cx + 2, mouthY - lipThickness * 0.7);
  ctx.stroke();
  ctx.restore();

  // 9. Facial Hair (Beard, Goatee, Stubble, Mustache)
  if (facialHair !== 'none') {
    ctx.save();
    ctx.fillStyle = hairColor.includes('blonde') ? 'rgba(168, 162, 158, 0.6)' : 'rgba(15, 23, 42, 0.75)';
    ctx.strokeStyle = ctx.fillStyle;

    if (facialHair.includes('stubble') || facialHair.includes('shadow')) {
      // Stippled 5 o'clock shadow
      ctx.fillStyle = 'rgba(15, 23, 42, 0.25)';
      ctx.beginPath();
      ctx.ellipse(cx, cy + fh * 0.65, fw * 0.65, fh * 0.28, 0, 0, Math.PI * 2);
      ctx.fill();
    } else if (facialHair.includes('mustache') || facialHair.includes('moustache')) {
      ctx.lineWidth = 6;
      ctx.beginPath();
      ctx.moveTo(cx - mw * 0.8, mouthY - 3);
      ctx.quadraticCurveTo(cx, mouthY - 10, cx + mw * 0.8, mouthY - 3);
      ctx.stroke();
    } else if (facialHair.includes('goatee')) {
      // Chin patch & mustache
      ctx.lineWidth = 5;
      ctx.beginPath();
      ctx.moveTo(cx - mw * 0.7, mouthY - 3);
      ctx.quadraticCurveTo(cx, mouthY - 9, cx + mw * 0.7, mouthY - 3);
      ctx.stroke();
      ctx.beginPath();
      ctx.ellipse(cx, cy + fh * 0.72, fw * 0.25, fh * 0.16, 0, 0, Math.PI * 2);
      ctx.fill();
    } else if (facialHair.includes('beard')) {
      // Full beard contour
      ctx.beginPath();
      ctx.moveTo(cx - fw * 0.9, cy + fh * 0.3);
      ctx.quadraticCurveTo(cx - fw * 0.7, cy + fh * 1.05, cx, cy + fh * 1.08);
      ctx.quadraticCurveTo(cx + fw * 0.7, cy + fh * 1.05, cx + fw * 0.9, cy + fh * 0.3);
      ctx.lineTo(cx + fw * 0.7, cy + fh * 0.55);
      ctx.quadraticCurveTo(cx, cy + fh * 0.8, cx - fw * 0.7, cy + fh * 0.55);
      ctx.closePath();
      ctx.fill();
    }
    ctx.restore();
  }

  // 10. Head Hair
  ctx.save();
  let hairHex = '#090d16'; // Black / dark
  if (hairColor.includes('brown')) hairHex = '#271b12';
  if (hairColor.includes('blonde') || hairColor.includes('blond')) hairHex = '#a16207';
  if (hairColor.includes('grey') || hairColor.includes('gray')) hairHex = '#64748b';
  if (hairColor.includes('red') || hairColor.includes('ginger')) hairHex = '#9a3412';

  ctx.fillStyle = hairHex;
  ctx.strokeStyle = '#020617';
  ctx.lineWidth = 3;

  if (hairStyle.includes('bald') || hairStyle.includes('shaved')) {
    // No hair or subtle faint crown
  } else if (hairStyle.includes('short') || hairStyle.includes('crew') || hairStyle.includes('fade')) {
    // Short crop
    ctx.beginPath();
    ctx.moveTo(cx - fw * 1.05, cy - fh * 0.2);
    ctx.quadraticCurveTo(cx - fw * 1.1, cy - fh * 0.85, cx, cy - fh * 0.92);
    ctx.quadraticCurveTo(cx + fw * 1.1, cy - fh * 0.85, cx + fw * 1.05, cy - fh * 0.2);
    // Hairline
    ctx.quadraticCurveTo(cx + fw * 0.5, cy - fh * 0.55, cx, cy - fh * 0.58);
    ctx.quadraticCurveTo(cx - fw * 0.5, cy - fh * 0.55, cx - fw * 1.05, cy - fh * 0.2);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
  } else if (hairStyle.includes('wavy') || hairStyle.includes('curly')) {
    // Wavy / textured volume
    ctx.beginPath();
    ctx.moveTo(cx - fw * 1.12, cy - fh * 0.15);
    ctx.bezierCurveTo(cx - fw * 1.25, cy - fh * 0.8, cx - fw * 0.4, cy - fh * 1.05, cx, cy - fh * 1.02);
    ctx.bezierCurveTo(cx + fw * 0.4, cy - fh * 1.05, cx + fw * 1.25, cy - fh * 0.8, cx + fw * 1.12, cy - fh * 0.15);
    // Wavy hairline
    ctx.quadraticCurveTo(cx + fw * 0.6, cy - fh * 0.52, cx, cy - fh * 0.56);
    ctx.quadraticCurveTo(cx - fw * 0.6, cy - fh * 0.52, cx - fw * 1.12, cy - fh * 0.15);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
  } else if (hairStyle.includes('long')) {
    // Long hair down sides
    ctx.beginPath();
    ctx.moveTo(cx - fw * 1.15, cy + fh * 0.6);
    ctx.lineTo(cx - fw * 1.2, cy - fh * 0.6);
    ctx.quadraticCurveTo(cx, cy - fh * 1.05, cx + fw * 1.2, cy - fh * 0.6);
    ctx.lineTo(cx + fw * 1.15, cy + fh * 0.6);
    ctx.lineTo(cx + fw * 0.95, cy + fh * 0.1);
    ctx.quadraticCurveTo(cx, cy - fh * 0.6, cx - fw * 0.95, cy + fh * 0.1);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
  } else {
    // Standard baseline parted hair
    ctx.beginPath();
    ctx.moveTo(cx - fw * 1.08, cy - fh * 0.18);
    ctx.quadraticCurveTo(cx - fw * 1.15, cy - fh * 0.88, cx, cy - fh * 0.94);
    ctx.quadraticCurveTo(cx + fw * 1.15, cy - fh * 0.88, cx + fw * 1.08, cy - fh * 0.18);
    ctx.quadraticCurveTo(cx + fw * 0.6, cy - fh * 0.54, cx, cy - fh * 0.56);
    ctx.quadraticCurveTo(cx - fw * 0.6, cy - fh * 0.54, cx - fw * 1.08, cy - fh * 0.18);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
  }
  ctx.restore();

  // 11. Distinguishing Mark (Scar / Mole)
  if (scarMark !== 'none') {
    ctx.save();
    ctx.strokeStyle = 'rgba(239, 68, 68, 0.7)';
    ctx.lineWidth = 2.5;
    ctx.lineCap = 'round';
    // Left cheek scar
    ctx.beginPath();
    ctx.moveTo(cx - fw * 0.62, cy + fh * 0.35);
    ctx.lineTo(cx - fw * 0.45, cy + fh * 0.55);
    // Stitch tick marks
    ctx.moveTo(cx - fw * 0.56, cy + fh * 0.41);
    ctx.lineTo(cx - fw * 0.50, cy + fh * 0.43);
    ctx.moveTo(cx - fw * 0.52, cy + fh * 0.48);
    ctx.lineTo(cx - fw * 0.46, cy + fh * 0.50);
    ctx.stroke();
    ctx.restore();
  }

  // 12. Accessories (Glasses)
  if (accessories !== 'none') {
    ctx.save();
    ctx.strokeStyle = '#020617';
    ctx.lineWidth = 3;
    // Left lens frame
    ctx.beginPath();
    ctx.roundRect(cx - eyeDist - fw * 0.25, eyeY - fh * 0.12, fw * 0.5, fh * 0.24, 6);
    ctx.stroke();
    // Right lens frame
    ctx.beginPath();
    ctx.roundRect(cx + eyeDist - fw * 0.25, eyeY - fh * 0.12, fw * 0.5, fh * 0.24, 6);
    ctx.stroke();
    // Bridge connect
    ctx.beginPath();
    ctx.moveTo(cx - eyeDist + fw * 0.25, eyeY);
    ctx.lineTo(cx + eyeDist - fw * 0.25, eyeY);
    ctx.stroke();
    ctx.restore();
  }

  // 13. Landmarks Overlay (if toggled)
  if (showLandmarks) {
    ctx.save();
    ctx.fillStyle = '#38bdf8';
    const points = [
      [cx - eyeDist, eyeY], [cx + eyeDist, eyeY],
      [cx - eyeDist - fw * 0.18, eyeY], [cx - eyeDist + fw * 0.18, eyeY],
      [cx + eyeDist - fw * 0.18, eyeY], [cx + eyeDist + fw * 0.18, eyeY],
      [cx, noseY], [cx - nw, noseY + 2], [cx + nw, noseY + 2],
      [cx - mw, mouthY], [cx + mw, mouthY], [cx, mouthY - 3], [cx, mouthY + 5],
      [cx, cy + fh * 0.9], [cx - fw * 0.5, cy + fh * 0.8], [cx + fw * 0.5, cy + fh * 0.8]
    ];
    for (const [px, py] of points) {
      ctx.beginPath();
      ctx.arc(px, py, 3, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
  }

  // 14. Statutory Top Watermark Banner (Rule 6 Invariant)
  ctx.save();
  ctx.fillStyle = 'rgba(69, 10, 10, 0.88)';
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
  ctx.letterSpacing = '0.08em';
  ctx.fillText('AI-GENERATED APPROXIMATION - INVESTIGATIVE LEAD ONLY', width / 2, 13);
  ctx.restore();

  // 15. Statutory Bottom Watermark Banner
  ctx.save();
  ctx.fillStyle = 'rgba(15, 23, 42, 0.92)';
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
}
