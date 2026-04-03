import { AiProvider } from "@/lib/marc/types";
import { getAnthropicClient } from "@/lib/claude/client";
import { getGeminiClient } from "@/lib/gemini/client";
import {
  CATALOGING_SYSTEM_PROMPT,
  buildUserPrompt,
} from "@/lib/claude/prompts";

export async function generateCatalogRecord(
  provider: AiProvider,
  titlePageText: string,
  versoText: string
): Promise<string> {
  const userPrompt = buildUserPrompt(titlePageText, versoText);

  if (provider === "gemini") {
    return generateWithGemini(userPrompt);
  }
  return generateWithClaude(userPrompt);
}

async function generateWithClaude(userPrompt: string): Promise<string> {
  const client = getAnthropicClient();
  const message = await client.messages.create({
    model: "claude-sonnet-4-20250514",
    max_tokens: 4096,
    temperature: 0,
    system: CATALOGING_SYSTEM_PROMPT,
    messages: [{ role: "user", content: userPrompt }],
  });

  const textContent = message.content.find((c) => c.type === "text");
  if (!textContent || textContent.type !== "text") {
    throw new Error("No text response from Claude.");
  }
  return textContent.text;
}

async function generateWithGemini(userPrompt: string): Promise<string> {
  const client = getGeminiClient();
  const model = client.getGenerativeModel({
    model: "gemini-1.5-flash",
    systemInstruction: CATALOGING_SYSTEM_PROMPT,
  });

  const result = await model.generateContent({
    contents: [{ role: "user", parts: [{ text: userPrompt }] }],
    generationConfig: {
      temperature: 0,
      responseMimeType: "application/json",
    },
  });

  const text = result.response.text();
  if (!text) {
    throw new Error("No text response from Gemini.");
  }
  return text;
}
