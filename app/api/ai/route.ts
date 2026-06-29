import { NextRequest, NextResponse } from "next/server";
import { generateText } from "ai";
import { groq } from "@ai-sdk/groq";
import { auth } from "@/app/api/auth/[...nextauth]/route";
import { aiRequestSchema } from "@/lib/validations";
import { UnauthorizedError, getErrorResponse } from "@/lib/errors";

const cleanResponse = (text: string): string => {
  return text
    .replace(/\*\*/g, "")
    .replace(/\*/g, "")
    .replace(/^- /gm, "")
    .replace(/^• /gm, "")
    .replace(/^[0-9]+\. /gm, "")
    .trim();
};

const prompts: Record<string, (text: string) => string> = {
  summarize: (text) => `Summarize this text in 2-3 sentences. Keep it simple, no formatting:\n\n${text}`,
  improve: (text) =>
    `Improve the clarity and quality of this text. Keep it simple and clean, no asterisks or bold formatting:\n\n${text}`,
  grammar: (text) =>
    `Fix grammar and spelling errors. Return only the corrected text, no explanations:\n\n${text}`,
  continue: (text) => `Continue writing this text naturally. Keep the same tone and style:\n\n${text}`,
  rewrite: (text) =>
    `Rewrite this in a professional tone. Keep it simple and clear, no special formatting:\n\n${text}`,
  explain: (text) =>
    `Explain this in simple, easy-to-understand language. Use short sentences, no bullet points:\n\n${text}`,
  notes: (text) =>
    `Create clear meeting notes from this. Use simple formatting, one item per line:\n\n${text}`,
  actions: (text) =>
    `Extract action items from this. List each item on a new line, no asterisks or special formatting:\n\n${text}`,
};

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.email) {
      throw new UnauthorizedError();
    }

    const body = await request.json();
    const validated = aiRequestSchema.parse(body);

    const text = validated.selectedText || validated.text || "";
    if (!text) {
      throw new Error("No text provided for AI processing");
    }

    const promptText = prompts[validated.action];
    if (!promptText) {
      throw new Error(`Unknown AI action: ${validated.action}`);
    }

    const groqApiKey = process.env.GROQ_API_KEY;
    if (!groqApiKey) {
      throw new Error("GROQ_API_KEY environment variable not set");
    }

    const { text: responseText } = await generateText({
      model: groq("llama-3.1-8b-instant") as any,
      prompt: promptText(text),
      temperature: 0.7,
    } as any);

    const cleanedResult = cleanResponse(responseText);

    return NextResponse.json({
      data: {
        result: cleanedResult,
        tokens: 0,
      },
    });
  } catch (error) {
    console.error("[AI] Error:", error);
    const response = getErrorResponse(error);
    return NextResponse.json(response, { status: response.status });
  }
}
