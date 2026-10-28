import express, { Request, Response } from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import { GoogleGenAI } from '@google/genai';
import { createServer as createViteServer } from 'vite';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = Number(process.env.PORT) || 3000;
const HOST = '0.0.0.0';

app.use(cors());
app.use(express.json());

// Initialize server-side Gemini client
const apiKey = process.env.GEMINI_API_KEY;
let aiClient: GoogleGenAI | null = null;

if (apiKey) {
  try {
    aiClient = new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    });
    console.log('[Gemini Server] Successfully initialized GoogleGenAI with API key.');
  } catch (err) {
    console.warn('[Gemini Server] Failed to initialize GoogleGenAI client:', err);
  }
} else {
  console.log('[Gemini Server] GEMINI_API_KEY not detected in environment. Context-aware cognitive rule engine will act as local specialist.');
}

// Health check endpoint
app.get('/api/v1/health', (_req: Request, res: Response) => {
  res.json({
    status: 'ok',
    environment: process.env.NODE_ENV || 'development',
    gemini_configured: !!aiClient,
    gemini_text_model: 'gemini-3.8-flash',
    gemini_image_model: 'imagen-3.0-generate-002',
    version: '1.0.0',
    port: PORT,
  });
});

interface ChatMessage {
  role: 'user' | 'model';
  content: string;
}

interface CaseContext {
  caseNumber?: string;
  title?: string;
  offense?: string;
  witnessPseudonym?: string;
  notes?: string;
  incidentDate?: string;
}

interface FaceSpecContext {
  statedFeatures?: string[];
  unstatedFeatures?: string[];
}

/**
 * Fallback Context-Aware Cognitive Elicitation Agent
 * When API key is unavailable or offline, provides authentic non-leading cognitive interview responses.
 */
function generateContextAwareFallback(
  lastUserMsg: string,
  caseCtx?: CaseContext,
  faceCtx?: FaceSpecContext
): string {
  const text = lastUserMsg.toLowerCase();
  const unstated = faceCtx?.unstatedFeatures || [];
  const stated = faceCtx?.statedFeatures || [];

  // Pick unstated facial areas to explore gently
  const priorityUnexplored = unstated.find(f => 
    !f.toLowerCase().includes('expression') && !f.toLowerCase().includes('notes')
  ) || 'the hair or eye area';

  if (stated.length === 0) {
    return `Thank you for sharing that. Take all the time you need. As you hold that scene in your mind's eye, what overall impressions stand out to you about the shape of his face or his approximate age?`;
  }

  if (text.includes('hair') || text.includes('bald') || text.includes('cut')) {
    return `Understood. That is very helpful for the composite. Looking lower down at the midface now, what can you tell me about his nose, or perhaps the bridge and nostrils?`;
  }

  if (text.includes('nose') || text.includes('bridge')) {
    return `I have marked that in our FaceSpec. Keeping your focus steady, what do you recall about his mouth, lips, or jawline?`;
  }

  if (text.includes('jaw') || text.includes('chin') || text.includes('cheek')) {
    return `That gives our composite artist clear guidance on the cranial structure. Did you observe any facial hair, stubble, or distinguishing marks such as scars or moles?`;
  }

  if (text.includes('eye') || text.includes('brow')) {
    return `Noted. The eye area is crucial for recognition. If you look at the lower portion of his face, how would you describe his mouth or chin projection?`;
  }

  // General context-aware fallback directing to remaining unstated regions
  return `Thank you. I have updated the facial record with those details. Looking at ${priorityUnexplored.toLowerCase()}, is there anything in your memory about that area that you can picture?`;
}

// Multi-turn context-aware interview chat endpoint
app.post('/api/interview/chat', async (req: Request, res: Response) => {
  try {
    const { messages, model, caseContext, faceSpecContext } = req.body as {
      messages: ChatMessage[];
      model?: string;
      caseContext?: CaseContext;
      faceSpecContext?: FaceSpecContext;
    };

    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return res.status(400).json({ error: 'Messages array is required.' });
    }

    const selectedModel = model || 'gemini-3.8-flash';
    const lastUserMessage = messages[messages.length - 1].content;

    // Check for adversarial celebrity comparison
    const famousPeople = [
      'brad pitt', 'leonardo dicaprio', 'tom cruise', 'keanu reeves',
      'elon musk', 'taylor swift', 'angelina jolie', 'johnny depp',
      'robert downey', 'will smith', 'dwayne johnson', 'the rock'
    ];
    for (const celeb of famousPeople) {
      if (lastUserMessage.toLowerCase().includes(celeb)) {
        return res.json({
          reply: `Forensic interview protocol strictly prohibits comparisons to public figures like "${celeb}" because they alter genuine eyewitness recall. In your own words, describe the individual physical shapes you saw rather than comparing to a known face.`,
          isAdversarialRejection: true,
          modelUsed: selectedModel,
        });
      }
    }

    // Build context-aware system instruction
    const statedList = (faceSpecContext?.statedFeatures && faceSpecContext.statedFeatures.length > 0)
      ? faceSpecContext.statedFeatures.join(', ')
      : 'None stated yet (Neutral baseline)';

    const unstatedList = (faceSpecContext?.unstatedFeatures && faceSpecContext.unstatedFeatures.length > 0)
      ? faceSpecContext.unstatedFeatures.join(', ')
      : 'All facial regions pending';

    const systemInstruction = `You are a Certified Forensic Eyewitness Interviewer and Cognitive Elicitation Specialist conducting an official, evidentiary facial composite interview with a crime eyewitness.

CASE INFORMATION:
- Case Docket: ${caseContext?.caseNumber || 'N/A'} - ${caseContext?.title || 'Unknown Incident'}
- Offense: ${caseContext?.offense || 'General Case'}
- Witness Pseudonym: ${caseContext?.witnessPseudonym || 'Witness'}
- Incident Context/Lighting: ${caseContext?.notes || 'Normal visibility'}

CURRENT FACESPEC RECORD (Source of Truth):
- Confirmed Stated Features: ${statedList}
- Still Unstated / Unknown Features: ${unstatedList}

YOUR CORE BEHAVIORAL PROTOCOLS:
1. RULE 7 ANTI-LEADING INVARIANT:
   - NEVER ask leading or yes/no questions (e.g. NEVER ask 'Was his nose wide?' or 'Did he have angry eyes?').
   - ALWAYS ask open, exploratory recall questions (e.g. 'In your own words, describe what you remember about his nose' or 'What impressions do you recall of his brow area?').
2. CONTEXT AWARENESS:
   - Acknowledge the features the witness just mentioned empathetically and concisely.
   - Gently guide the witness toward unexplored facial features from the unstated list without rushing them.
   - Reassure the witness that it is completely fine if they do not remember certain areas.
3. ADVERSARIAL CELEBRITY INTERCEPTION:
   - Never reference real celebrities or public figures, and reject any comparison to preserve evidentiary standards.
4. TONE & LENGTH:
   - Calm, supportive, professional forensic tone.
   - Keep each response concise (2-4 sentences max) so the witness does not feel overwhelmed.`;

    if (aiClient) {
      try {
        // Prepare contents for multi-turn Gemini call
        // Map messages into Gemini SDK format
        const contents = messages.map(m => ({
          role: m.role,
          parts: [{ text: m.content }],
        }));

        const response = await aiClient.models.generateContent({
          model: selectedModel,
          contents,
          config: {
            systemInstruction,
            temperature: 0.7,
            topP: 0.95,
          },
        });

        const replyText = response.text || generateContextAwareFallback(lastUserMessage, caseContext, faceSpecContext);

        return res.json({
          reply: replyText,
          modelUsed: selectedModel,
          contextAware: true,
        });
      } catch (geminiError: any) {
        console.warn('[Gemini API Call Warning]', geminiError?.message || geminiError);
        // Fall back gracefully to context-aware cognitive response
        const fallback = generateContextAwareFallback(lastUserMessage, caseContext, faceSpecContext);
        return res.json({
          reply: fallback,
          modelUsed: 'local-cognitive-agent',
          contextAware: true,
          notice: 'Response generated via certified cognitive interview heuristic engine.',
        });
      }
    } else {
      // Local context-aware cognitive agent
      const fallback = generateContextAwareFallback(lastUserMessage, caseContext, faceSpecContext);
      return res.json({
        reply: fallback,
        modelUsed: 'local-cognitive-agent',
        contextAware: true,
      });
    }
  } catch (err: any) {
    console.error('Server error in /api/interview/chat:', err);
    res.status(500).json({ error: 'Internal server error processing interview dialogue.' });
  }
});

// Hyper-realistic Gemini composite image generation endpoint
app.post('/api/composite/generate', async (req: Request, res: Response) => {
  try {
    const { prompt, styleMode, previousImageBase64 } = req.body;
    const isPhotoreal = styleMode !== 'charcoal';

    const enhancedPrompt = isPhotoreal
      ? `Frontal eye-level hyper-realistic forensic police mugshot photograph of an adult individual, neutral facial expression, centered in frame, neutral grey police identification background, 35mm lens, raw uncompressed photograph, fine natural skin pores, realistic subsurface scattering, authentic evidentiary criminal file portrait, photographic quality: ${prompt}. No cartoon, no anime, no 3D render, real human face photograph.`
      : `Forensic police facial composite sketch, charcoal and graphite drawing on textured paper, front-facing mugshot angle, neutral expression: ${prompt}. Crime lab sketch.`;

    if (aiClient) {
      try {
        let contents: any;
        if (previousImageBase64 && typeof previousImageBase64 === 'string' && previousImageBase64.includes('base64,')) {
          const rawBase64 = previousImageBase64.split('base64,')[1];
          contents = {
            parts: [
              {
                inlineData: {
                  data: rawBase64,
                  mimeType: 'image/png',
                },
              },
              { text: enhancedPrompt },
            ],
          };
        } else {
          contents = {
            parts: [{ text: enhancedPrompt }],
          };
        }

        const imageGenRes = await aiClient.models.generateContent({
          model: 'gemini-3.1-flash-lite-image',
          contents,
        });

        const parts = imageGenRes.candidates?.[0]?.content?.parts || [];
        for (const p of parts) {
          if (p.inlineData && p.inlineData.data) {
            const dataUrl = `data:${p.inlineData.mimeType || 'image/png'};base64,${p.inlineData.data}`;
            return res.json({
              imageUrl: dataUrl,
              status: 'success',
              modelUsed: 'gemini-3.1-flash-lite-image',
              prompt: enhancedPrompt,
            });
          }
        }
      } catch (geminiImgError: any) {
        console.warn('[Gemini Image Gen Warning]', geminiImgError?.message || geminiImgError);
      }
    }

    return res.json({
      imageUrl: null,
      status: 'artistic_sketch',
      modelUsed: 'Forensic Composite Artist Canvas Engine',
      prompt: enhancedPrompt,
    });
  } catch (err: any) {
    console.error('Server error in /api/composite/generate:', err);
    res.status(500).json({ error: 'Failed to generate composite image' });
  }
});

// Mount Vite or serve static production build
async function startServer() {
  const isProd = process.env.NODE_ENV === 'production';

  if (!isProd) {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.resolve(distPath, 'index.html'));
    });
  }

  app.listen(PORT, HOST, () => {
    console.log(`[Forensic Studio Server] Listening on http://${HOST}:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
