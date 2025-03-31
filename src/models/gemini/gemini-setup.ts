import { GoogleGenAI } from "@google/genai";
import { NODE_CONFIG } from "../../config/node-config";
import { GoogleGenerativeAI, Content } from "@google/generative-ai";

const GEMINI_AI = new GoogleGenAI({ apiKey: NODE_CONFIG.GEMINI_API_KEY });
const GEMINI_SETUP = new GoogleGenerativeAI(NODE_CONFIG.GEMINI_API_KEY);

export const GEMINI_1_PRO = async ({
  contents,
  message,
}: {
  contents: Content[];
  message: string;
}) => {
  const geminiFlashModel = GEMINI_SETUP.getGenerativeModel({
    model: "gemini-1.5-flash",
  });
  const chat = geminiFlashModel.startChat({ history: contents });
  const result = await chat.sendMessage(message);
  const res = result.response;
  const finalResponse = res.text();
  return finalResponse;
};

export const createGeminiEmbedding = async ({
  contents,
}: {
  contents: string;
}) => {
  const res = await GEMINI_AI.models.embedContent({
    model: "text-embedding-004",
    contents,
  });
  return res.embeddings?.[0]?.values || [];
};
