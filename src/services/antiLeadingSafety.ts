export const PROHIBITED_CELEBRITIES = [
  'Brad Pitt', 'Leonardo DiCaprio', 'Tom Cruise', 'Keanu Reeves',
  'Elon Musk', 'Taylor Swift', 'Angelina Jolie', 'Johnny Depp',
  'Robert Downey Jr', 'Will Smith', 'Dwayne Johnson', 'The Rock',
  'Morgan Freeman', 'Barack Obama', 'Donald Trump', 'Joe Biden',
  'George Clooney', 'Matt Damon', 'Scarlett Johansson', 'Zendaya',
  'Pedro Pascal', 'Ryan Gosling', 'Chris Evans', 'Chris Hemsworth',
  'Beyoncé', 'Rihanna', 'Kanye West', 'Kim Kardashian',
  'Michael Jackson', 'David Beckham', 'Cristiano Ronaldo', 'Lionel Messi',
  'Justin Bieber', 'Selena Gomez', 'Ariana Grande', 'Bill Gates',
  'Jeff Bezos', 'Mark Zuckerberg', 'Steve Jobs', 'Harrison Ford',
  'Al Pacino', 'Robert De Niro', 'Denzel Washington', 'Samuel L Jackson'
];

export interface CelebrityCheckResult {
  blocked: boolean;
  celebrityName?: string;
  errorMessage?: string;
}

/**
 * Scans input text for prohibited celebrity / public figure comparisons (Adversarial Rule).
 */
export function detectCelebrityReference(text: string): CelebrityCheckResult {
  const normalized = text.toLowerCase();
  for (const name of PROHIBITED_CELEBRITIES) {
    const nameLower = name.toLowerCase();
    // Match word boundaries
    const regex = new RegExp(`\\b${nameLower.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'i');
    if (regex.test(normalized)) {
      return {
        blocked: true,
        celebrityName: name,
        errorMessage: `Adversarial celebrity reference detected: '${name}'. Forensic composite standards strictly prohibit biasing witness memory with celebrity comparisons.`
      };
    }
  }
  return { blocked: false };
}

/**
 * Checks for leading interview questions (Rule 7 Anti-Leading Protocol).
 */
export function isLeadingQuestion(question: string): { isLeading: boolean; reason?: string } {
  const q = question.trim().toLowerCase();
  
  const leadingPatterns = [
    { pattern: /^(did|was|is|were|are|has|had)\s+(he|she|they|the\s+suspect|the\s+person)/i, reason: 'Yes/No closed query can inadvertently plant details into witness recall.' },
    { pattern: /\b(wasn't\s+he|didn't\s+he|right\?|wouldn't\s+you\s+say)/i, reason: 'Suggestive confirmation tags induce compliance bias.' },
    { pattern: /\b(crooked|big|small|huge|ugly|scary|mean|dark-skinned|light-skinned)\s+(nose|eyes|face|mouth)\?/i, reason: 'Suggestive descriptive adjective leads witness memory.' }
  ];

  for (const lp of leadingPatterns) {
    if (lp.pattern.test(q)) {
      return { isLeading: true, reason: lp.reason };
    }
  }

  return { isLeading: false };
}

/**
 * Recommended forensic cognitive interview questions.
 */
export const COGNITIVE_PROMPTS = [
  {
    category: 'Context Reinstatement',
    prompt: 'Mentally place yourself back at the moment you saw the person. Think about the lighting, where you were standing, and the surroundings. Take your time.',
  },
  {
    category: 'Free Recall',
    prompt: 'In your own words, describe whichever facial features stood out to you most vividly without worrying about order.',
  },
  {
    category: 'Feature Focus: Face Structure',
    prompt: 'Focus your mind on the overall outline of their head and jawline. How would you describe the contour?',
  },
  {
    category: 'Feature Focus: Eye Area',
    prompt: 'Concentrate on the eye region and brow line. What impressions do you recall about the gaze or brow prominence?',
  },
  {
    category: 'Feature Focus: Nose & Midface',
    prompt: 'Think about the central part of the face and the bridge of the nose. What can you tell me about its shape or proportion?',
  },
  {
    category: 'Feature Focus: Mouth & Chin',
    prompt: 'Picture the lower portion of the face. How would you characterize the lips and chin projection?',
  },
  {
    category: 'Distinguishing Marks & Hair',
    prompt: 'Did you notice any unique markings, lines, scars, facial hair, or head hair length and texture?',
  },
];
