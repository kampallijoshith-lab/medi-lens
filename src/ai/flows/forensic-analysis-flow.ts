'use server';
/**
 * @fileOverview A multi-step forensic analysis flow to verify medicine authenticity.
 */

import { ai } from '@/ai/genkit';
import { z } from 'zod';
import {
  ForensicAnalysisResult,
  ForensicAnalysisInputSchema,
} from '@/lib/types';


// Helper to clean JSON from LLM responses
function cleanJSON(str: string): string {
    if (!str) return '';
    try {
      const firstBrace = str.indexOf('{');
      const lastBrace = str.lastIndexOf('}');
      if (firstBrace !== -1 && lastBrace !== -1) {
        str = str.substring(firstBrace, lastBrace + 1);
      }
      return str.replace(/```json|```/g, '').trim();
    } catch (e) {
      return str;
    }
}


export async function forensicAnalysisFlow(
  input: z.infer<typeof ForensicAnalysisInputSchema>
): Promise<ForensicAnalysisResult> {
  
  const forensicPrompt = `You are a world-class Pharmaceutical Forensic Analyst. Your task is to analyze an image of a pill and provide a comprehensive authenticity report in a single JSON response.

Follow these steps precisely:

1.  **Quality Gate:** First, analyze the image quality. If the image suffers from severe LENS_BLUR, EXCESSIVE_GLARE, or POOR_FRAMING that makes analysis impossible, you MUST return a JSON object with ONLY the 'error' field set to a descriptive message (e.g., '{"error": "Image quality is too low due to blur."}'). Do not proceed further.

2.  **Physical Feature Extraction:** If the image quality is acceptable, extract the pill's physical characteristics:
    *   **Imprint:** The text or logo engraved on the pill. If it's unclear, note that.
    *   **Color:** The primary and secondary colors as HEX codes.
    *   **Shape:** The pill's shape (e.g., round, oval, capsule).

3.  **Ground Truth Simulation:** Based on the extracted features, perform a simulated search of authoritative databases (like FDA, Drugs.com, DailyMed) to find the "ground truth" data for a legitimate pill with these characteristics. Synthesize this information.

4.  **Comparative Analysis:** Compare the observed features (from Step 2) with the ground truth information (from Step 3). For each core feature (Imprint, Color, Shape), determine the status as "match", "conflict", or "omission" and provide a brief "reason" and an "evidence_quote" from your simulated ground truth.

5.  **Source Reliability:** Evaluate the reliability of the (simulated) sources you used. If they are top-tier (e.g., .gov sites), this contributes positively to the score.

6.  **Scoring and Verdict:** Based on your entire analysis, calculate a final "score" from 0 to 100, where 100 is definitively authentic. The scoring should be weighted: Imprint match is most important (approx. 40 points), Color match is next (20 points), Shape (10 points), and source reliability (15 points). Based on the final score, provide a "verdict": 'Authentic' (score > 85), 'Inconclusive' (65-85), or 'Counterfeit Risk' (<65).

7.  **Final JSON Output:** Consolidate all findings into a single, valid JSON object that strictly conforms to the ForensicAnalysisResult schema provided below. Do not include any text outside of this JSON object.

**JSON Schema to follow:**
\`\`\`json
{
  "score": "number",
  "verdict": "'Authentic' | 'Inconclusive' | 'Counterfeit Risk'",
  "imprint": "string",
  "sources": [{ "uri": "string", "title": "string", "tier": "number (1 for official, 2 for other)" }],
  "coreResults": {
    "imprint": { "match": "boolean", "status": "string", "reason": "string", "evidence_quote": "string" },
    "color": { "match": "boolean", "status": "string", "reason": "string", "evidence_quote": "string" },
    "shape": { "match": "boolean", "status": "string", "reason": "string", "evidence_quote": "string" },
    "generic": { "match": "boolean", "status": "string", "reason": "string", "evidence_quote": "string" },
    "source": { "match": "boolean", "reason": "string" }
  },
  "detailed": [{ "name": "string", "status": "string", "evidence_quote": "string" }],
  "timestamp": "ISO8601 string",
  "scanId": "string"
}
\`\`\`
Image for analysis:
{{media url=photoDataUri}}
`;
  
  const analysisResult = await ai.generate({
    model: 'googleai/gemini-2.5-flash',
    prompt: forensicPrompt,
    config: {
        temperature: 0.1,
    },
    input: {
        photoDataUri: input.photoDataUri,
    },
  });

  const cleanedJson = cleanJSON(analysisResult.text);
  const parsedJson = JSON.parse(cleanedJson);

  if (parsedJson.error) {
      throw new Error(parsedJson.error);
  }

  // Fill in any missing data or format it correctly
  const finalResult: ForensicAnalysisResult = {
    ...parsedJson,
    score: parsedJson.score ?? 0,
    verdict: parsedJson.verdict ?? 'Inconclusive',
    imprint: parsedJson.imprint ?? 'Not detected',
    sources: parsedJson.sources ?? [],
    coreResults: {
        imprint: parsedJson.coreResults?.imprint ?? { match: false, status: 'omission', reason: 'AI response missing data.' , evidence_quote: ''},
        color: parsedJson.coreResults?.color ?? { match: false, status: 'omission', reason: 'AI response missing data.', evidence_quote: '' },
        shape: parsedJson.coreResults?.shape ?? { match: false, status: 'omission', reason: 'AI response missing data.', evidence_quote: '' },
        generic: parsedJson.coreResults?.generic ?? { match: false, status: 'omission', reason: 'AI response missing data.', evidence_quote: '' },
        source: parsedJson.coreResults?.source ?? { match: false, reason: 'AI response missing data.' },
    },
    detailed: parsedJson.detailed ?? [],
    timestamp: new Date().toISOString(),
    scanId: `scan_${new Date().getTime()}`,
  };

  return finalResult;
}
