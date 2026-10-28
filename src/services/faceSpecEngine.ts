import { FaceSpec, FeatureAttribute } from '../types';

export function createEmptyAttribute(): FeatureAttribute {
  return {
    value: 'unknown',
    confidence: 0.0,
    stated: false,
    locked: false,
    verbatim: undefined,
  };
}

export function createInitialFaceSpec(): FaceSpec {
  return {
    gender_presentation: createEmptyAttribute(),
    approximate_age: createEmptyAttribute(),
    face_shape: createEmptyAttribute(),
    skin_tone_complexion: createEmptyAttribute(),
    hair: {
      length: createEmptyAttribute(),
      style: createEmptyAttribute(),
      color: createEmptyAttribute(),
      hairline: createEmptyAttribute(),
    },
    eyebrows: createEmptyAttribute(),
    eyes: {
      shape: createEmptyAttribute(),
      size: createEmptyAttribute(),
      spacing: createEmptyAttribute(),
      color: createEmptyAttribute(),
    },
    nose: {
      width: createEmptyAttribute(),
      length: createEmptyAttribute(),
      bridge: createEmptyAttribute(),
      tip: createEmptyAttribute(),
    },
    mouth_lips: createEmptyAttribute(),
    jawline_chin: createEmptyAttribute(),
    cheekbones_ears: createEmptyAttribute(),
    facial_hair: createEmptyAttribute(),
    distinguishing_marks: {
      type: createEmptyAttribute(),
      location: createEmptyAttribute(),
    },
    accessories: createEmptyAttribute(),
    expression: createEmptyAttribute(),
    notes: createEmptyAttribute(),
  };
}

/**
 * Calculates witness confidence score from hedging phrases in text (0.0 to 1.0).
 */
export function estimateConfidence(text: string): number {
  const lower = text.toLowerCase();
  if (/\b(definitely|certain|positive|100%|clearly|distinctly|unmistakable)\b/.test(lower)) {
    return 0.95;
  }
  if (/\b(pretty sure|fairly sure|very likely|almost certain|distinct)\b/.test(lower)) {
    return 0.85;
  }
  if (/\b(i think|seems|looked like|appeared to be|probably|around|roughly)\b/.test(lower)) {
    return 0.65;
  }
  if (/\b(maybe|perhaps|could be|might have been|sort of|kind of|i guess)\b/.test(lower)) {
    return 0.40;
  }
  if (/\b(not sure|unsure|vague|faint|hard to tell|barely remember|guessing)\b/.test(lower)) {
    return 0.25;
  }
  return 0.75;
}

/**
 * Parses natural language witness descriptions into structured FaceSpec updates.
 * Rule 3: Only stated attributes are updated; untouched attributes remain 'unknown'.
 */
export function parseUtteranceToFaceSpec(
  utterance: string,
  utteranceId: string,
  currentSpec: FaceSpec
): { updatedSpec: FaceSpec; diff: Record<string, { before: string; after: string; confidence: number }> } {
  const text = utterance.toLowerCase();
  const confidence = estimateConfidence(utterance);
  
  // Clone current spec deeply
  const updated: FaceSpec = JSON.parse(JSON.stringify(currentSpec));
  const diff: Record<string, { before: string; after: string; confidence: number }> = {};

  const applyField = (
    attr: FeatureAttribute,
    newValue: string,
    fieldPath: string,
    verbatimSnippet: string
  ) => {
    if (attr.locked) {
      // Locked regions cannot be modified
      return;
    }
    const beforeVal = attr.value;
    attr.value = newValue;
    attr.confidence = confidence;
    attr.stated = true;
    attr.verbatim = verbatimSnippet;
    attr.sourceUtteranceId = utteranceId;

    if (beforeVal !== newValue) {
      diff[fieldPath] = {
        before: beforeVal,
        after: newValue,
        confidence,
      };
    }
  };

  // Gender presentation
  if (/\b(male|man|guy|gentleman|masculine|he|him)\b/.test(text) && !/\b(female|woman)\b/.test(text)) {
    applyField(updated.gender_presentation, 'Male', 'gender_presentation', 'male presentation');
  } else if (/\b(female|woman|lady|feminine|she|her)\b/.test(text)) {
    applyField(updated.gender_presentation, 'Female', 'gender_presentation', 'female presentation');
  }

  // Age
  const ageMatch = text.match(/\b(in his|in her|around|about|approx)?\s*([1-9][0-9])s?\b/) ||
                   text.match(/\b(early|mid|late)\s*([2-8][0-9])s?\b/);
  if (ageMatch) {
    const ageStr = ageMatch[0].trim();
    applyField(updated.approximate_age, ageStr, 'approximate_age', ageStr);
  } else if (/\b(young|teenager|twenties|thirties|forties|fifties|elderly|middle-aged)\b/.test(text)) {
    const m = text.match(/\b(young|teenager|twenties|thirties|forties|fifties|elderly|middle-aged)\b/);
    if (m) applyField(updated.approximate_age, m[0], 'approximate_age', m[0]);
  }

  // Face shape
  if (/\b(oval|square|round|angular|heart-shaped|oblong|diamond|sharp jawed|broad face|chiseled)\b/.test(text)) {
    const m = text.match(/\b(oval|square|round|angular|heart-shaped|oblong|diamond|broad face|chiseled)\b/);
    if (m) applyField(updated.face_shape, m[0], 'face_shape', m[0]);
  }

  // Skin tone & Complexion
  if (/\b(fair|pale|olive|tan|tanned|medium|dark|ruddy|weathered|light-brown|freckled)\b/.test(text)) {
    const m = text.match(/\b(fair|pale|olive|tan|tanned|medium|dark|ruddy|weathered|light-brown|freckled)\b/);
    if (m) applyField(updated.skin_tone_complexion, m[0], 'skin_tone_complexion', m[0]);
  }

  // Eyebrows
  if (/\b(bushy|thick|thin|arched|straight|dark|sparse|heavy|monobrow|angled)\s*(eye)?brows?\b/.test(text)) {
    const m = text.match(/\b(bushy|thick|thin|arched|straight|dark|sparse|heavy|angled)\s*(eye)?brows?\b/);
    if (m) applyField(updated.eyebrows, m[0], 'eyebrows', m[0]);
  }

  // Eyes (Shape, Spacing, Color)
  if (/\b(deep-set|almond|round|narrow|hooded|sunken|large|small)\s*eyes?\b/.test(text)) {
    const m = text.match(/\b(deep-set|almond|round|narrow|hooded|sunken|large|small)\b/);
    if (m) applyField(updated.eyes.shape, m[0], 'eyes.shape', m[0]);
  }
  if (/\b(wide-set|close-set|narrowly spaced)\b/.test(text)) {
    const m = text.match(/\b(wide-set|close-set|narrowly spaced)\b/);
    if (m) applyField(updated.eyes.spacing, m[0], 'eyes.spacing', m[0]);
  }
  if (/\b(brown|dark brown|blue|green|hazel|grey|amber|black)\s*eyes?\b/.test(text)) {
    const m = text.match(/\b(dark brown|brown|blue|green|hazel|grey|amber|black)\b/);
    if (m) applyField(updated.eyes.color, m[0], 'eyes.color', m[0]);
  }

  // Nose (Bridge, Width, Length, Tip)
  if (/\b(narrow|wide|broad|crooked|straight|hooked|aquiline|button|upturned|bulbous|roman)\s*nose?\b/.test(text) ||
      /\b(high bridge|crooked bridge|flat bridge|wide flare|pointed tip)\b/.test(text)) {
    if (/\b(wide|broad)\b/.test(text)) applyField(updated.nose.width, 'wide', 'nose.width', 'wide');
    if (/\b(narrow|thin)\b/.test(text)) applyField(updated.nose.width, 'narrow', 'nose.width', 'narrow');
    if (/\b(high bridge|flat bridge|crooked bridge|prominent bridge)\b/.test(text)) {
      const m = text.match(/\b(high bridge|flat bridge|crooked bridge|prominent bridge)\b/);
      if (m) applyField(updated.nose.bridge, m[0], 'nose.bridge', m[0]);
    }
    if (/\b(hooked|aquiline|button|bulbous|pointed|upturned)\b/.test(text)) {
      const m = text.match(/\b(hooked|aquiline|button|bulbous|pointed|upturned)\b/);
      if (m) applyField(updated.nose.tip, m[0], 'nose.tip', m[0]);
    }
  }

  // Mouth & Lips
  if (/\b(thin|full|medium|wide|pursed|cleft|prominent|downturned)\s*lips?\b/.test(text) || /\b(thin|full)\s*mouth\b/.test(text)) {
    const m = text.match(/\b(thin|full|medium|wide|pursed|prominent)\s*(lips?|mouth)\b/);
    if (m) applyField(updated.mouth_lips, m[0], 'mouth_lips', m[0]);
  }

  // Jawline & Chin
  if (/\b(sharp|square|pointed|receding|prominent|cleft|double|strong|soft)\s*(jaw|jawline|chin)\b/.test(text)) {
    const m = text.match(/\b(sharp|square|pointed|receding|prominent|cleft|strong|soft)\s*(jaw|jawline|chin)\b/);
    if (m) applyField(updated.jawline_chin, m[0], 'jawline_chin', m[0]);
  }

  // Hair (Color, Style, Length)
  if (/\b(black|dark brown|brown|blonde|blond|red|ginger|grey|gray|salt and pepper|white)\s*hair\b/.test(text)) {
    const m = text.match(/\b(black|dark brown|brown|blonde|blond|red|ginger|grey|gray|salt and pepper|white)\b/);
    if (m) applyField(updated.hair.color, m[0], 'hair.color', m[0]);
  }
  if (/\b(short|medium length|long|shoulder-length|buzzcut|shaved|buzzed|bald)\b/.test(text)) {
    const m = text.match(/\b(short|medium length|long|shoulder-length|buzzcut|shaved|buzzed|bald)\b/);
    if (m) applyField(updated.hair.length, m[0], 'hair.length', m[0]);
  }
  if (/\b(straight|wavy|curly|coily|dreadlocks|slicked back|parted|messy|crew cut|fade)\b/.test(text)) {
    const m = text.match(/\b(straight|wavy|curly|coily|dreadlocks|slicked back|parted|messy|crew cut|fade)\b/);
    if (m) applyField(updated.hair.style, m[0], 'hair.style', m[0]);
  }

  // Facial Hair
  if (/\b(beard|goatee|mustache|moustache|stubble|clean-shaven|sideburns|5 o'clock shadow|unshaven)\b/.test(text)) {
    const m = text.match(/\b(beard|goatee|mustache|moustache|stubble|clean-shaven|sideburns|5 o'clock shadow|unshaven)\b/);
    if (m) applyField(updated.facial_hair, m[0], 'facial_hair', m[0]);
  }

  // Distinguishing marks (Scars, Tattoos, Moles, Marks)
  if (/\b(scar|mole|birthmark|tattoo|freckle|cut|notch)\b/.test(text)) {
    const m = text.match(/\b(scar|mole|birthmark|tattoo|cut|notch)\s*(on|across|near)?\s*(the)?\s*(left cheek|right cheek|forehead|chin|lip|eyebrow|temple)?\b/);
    if (m) {
      applyField(updated.distinguishing_marks.type, m[1] || 'mark', 'distinguishing_marks.type', m[0]);
      if (m[4]) {
        applyField(updated.distinguishing_marks.location, m[4], 'distinguishing_marks.location', m[4]);
      }
    }
  }

  // Accessories (Glasses, Hat, Piercing)
  if (/\b(glasses|spectacles|sunglasses|wire-rim|horn-rim|hat|baseball cap|beanie|piercing|earring)\b/.test(text)) {
    const m = text.match(/\b(wire-rim glasses|horn-rim glasses|glasses|sunglasses|spectacles|hat|cap|piercing|earring)\b/);
    if (m) applyField(updated.accessories, m[0], 'accessories', m[0]);
  }

  // Expression
  if (/\b(neutral|stern|angry|smirking|calm|intense|scowling|serious|blank)\b/.test(text)) {
    const m = text.match(/\b(neutral|stern|angry|smirking|calm|intense|scowling|serious|blank)\b/);
    if (m) applyField(updated.expression, m[0], 'expression', m[0]);
  }

  return { updatedSpec: updated, diff };
}

/**
 * Builds a deterministic forensic prompt text describing only confirmed attributes.
 */
export function buildForensicPrompt(spec: FaceSpec): string {
  const statedFeatures: string[] = [];

  if (spec.gender_presentation.stated) statedFeatures.push(`Sex/Gender: ${spec.gender_presentation.value}`);
  if (spec.approximate_age.stated) statedFeatures.push(`Age: ${spec.approximate_age.value}`);
  if (spec.face_shape.stated) statedFeatures.push(`Face shape: ${spec.face_shape.value}`);
  if (spec.skin_tone_complexion.stated) statedFeatures.push(`Skin tone: ${spec.skin_tone_complexion.value}`);
  
  if (spec.hair.color.stated || spec.hair.style.stated || spec.hair.length.stated) {
    const hairDesc = [spec.hair.length.value, spec.hair.style.value, spec.hair.color.value]
      .filter(v => v !== 'unknown')
      .join(' ');
    if (hairDesc) statedFeatures.push(`Hair: ${hairDesc}`);
  }

  if (spec.eyebrows.stated) statedFeatures.push(`Eyebrows: ${spec.eyebrows.value}`);
  
  if (spec.eyes.shape.stated || spec.eyes.color.stated || spec.eyes.spacing.stated) {
    const eyeDesc = [spec.eyes.shape.value, spec.eyes.spacing.value, spec.eyes.color.value]
      .filter(v => v !== 'unknown')
      .join(' ');
    if (eyeDesc) statedFeatures.push(`Eyes: ${eyeDesc}`);
  }

  if (spec.nose.width.stated || spec.nose.bridge.stated || spec.nose.tip.stated) {
    const noseDesc = [spec.nose.width.value, spec.nose.bridge.value, spec.nose.tip.value]
      .filter(v => v !== 'unknown')
      .join(' ');
    if (noseDesc) statedFeatures.push(`Nose: ${noseDesc}`);
  }

  if (spec.mouth_lips.stated) statedFeatures.push(`Mouth/Lips: ${spec.mouth_lips.value}`);
  if (spec.jawline_chin.stated) statedFeatures.push(`Jawline/Chin: ${spec.jawline_chin.value}`);
  if (spec.facial_hair.stated) statedFeatures.push(`Facial hair: ${spec.facial_hair.value}`);
  
  if (spec.distinguishing_marks.type.stated) {
    const markDesc = `${spec.distinguishing_marks.type.value} ${spec.distinguishing_marks.location.stated ? 'at ' + spec.distinguishing_marks.location.value : ''}`;
    statedFeatures.push(`Distinguishing mark: ${markDesc.trim()}`);
  }

  if (spec.accessories.stated) statedFeatures.push(`Accessories: ${spec.accessories.value}`);
  if (spec.expression.stated) statedFeatures.push(`Expression: ${spec.expression.value}`);

  if (statedFeatures.length === 0) {
    return 'Forensic composite sketch base template. Neutral front-facing view on charcoal textured paper. No features stated yet.';
  }

  return `Forensic police facial composite sketch, front-facing mugshot angle, charcoal pencil shading on textured paper. Stated features: ${statedFeatures.join('; ')}. Unstated attributes remain neutral and ambiguous.`;
}
