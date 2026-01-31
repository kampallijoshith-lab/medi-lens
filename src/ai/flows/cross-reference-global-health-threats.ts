'use server';

/**
 * @fileOverview Cross-references medicine information against a 'Global Health Threats' Firestore collection using GenAI to identify potential risks.
 *
 * - crossReferenceGlobalHealthThreats - A function that handles the cross-referencing process.
 * - CrossReferenceInput - The input type for the crossReferenceGlobalHealthThreats function.
 * - CrossReferenceOutput - The return type for the crossReferenceGlobalHealthThreats function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const CrossReferenceInputSchema = z.object({
  medicineInfo: z
    .string()
    .describe('The medicine information to cross-reference, including name and batch number.'),
});
export type CrossReferenceInput = z.infer<typeof CrossReferenceInputSchema>;

const CrossReferenceOutputSchema = z.object({
  matchFound: z
    .boolean()
    .describe('Whether a match was found in the Global Health Threats collection.'),
  alertDetails: z
    .string()
    .optional()
    .describe('Details of the alert if a match is found.'),
  source: z
    .string()
    .optional()
    .describe('Source of the alert if a match is found.'),
  reason: z
    .string()
    .optional()
    .describe('Reason for the alert if a match is found.'),
});
export type CrossReferenceOutput = z.infer<typeof CrossReferenceOutputSchema>;

export async function crossReferenceGlobalHealthThreats(
  input: CrossReferenceInput
): Promise<CrossReferenceOutput> {
  return crossReferenceFlow(input);
}

const prompt = ai.definePrompt({
  name: 'crossReferencePrompt',
  input: {schema: CrossReferenceInputSchema},
  output: {schema: CrossReferenceOutputSchema},
  prompt: `You are an expert in identifying falsified medicines.
  Cross-reference the provided medicine information against your knowledge of global health threats related to counterfeit drugs.
  Based on the information, determine if there is a match in the Global Health Threats collection and provide alert details, source, and reason if a match is found.
  medicineInfo: {{{medicineInfo}}}
  Make sure the output is valid JSON. Do not include any text outside of the JSON. The "matchFound" field must always be populated.
  If no alert details, source, or reason exists, omit those fields instead of setting them to null.
  If the medicine name or batch number match any alerts in the 'Global Health Threats' database, then set matchFound to true.`,
});

const crossReferenceFlow = ai.defineFlow(
  {
    name: 'crossReferenceFlow',
    inputSchema: CrossReferenceInputSchema,
    outputSchema: CrossReferenceOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
