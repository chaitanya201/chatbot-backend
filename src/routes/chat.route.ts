import { Router } from "express";
import { chatPostSchema } from "../lib/payload-schemas/chat-route";
import { SuccessErrorApiResponse } from "../lib/api-response/api-success";
import { getAstraCollection } from "../db/datastax";
import {
  createGeminiEmbedding,
  GEMINI_1_PRO,
} from "../models/gemini/gemini-setup";

const chatRouter = Router();

chatRouter.post("/chat", async (req, res) => {
  try {
    const parsedBody = chatPostSchema.safeParse(req.body);
    if (!parsedBody.success) {
      const response = new SuccessErrorApiResponse({
        metadata: {
          code: 400,
          message:
            parsedBody.error.format().messages?._errors?.toString() || "",
          timeStamp: new Date().toISOString(),
        },
      });
      return res.status(400).json(response);
    }
    const { messages } = parsedBody.data;
    let extraContext = "";

    const latestMessage = messages.at(-1)?.content || "";
    try {
      // create embedding for the latest message for searching in vector db.
      const embedding = await createGeminiEmbedding({
        contents: latestMessage,
      });

      // get collection and search for extra data with that embedding
      const collection = await getAstraCollection();
      const searchedData = collection.find(
        {},
        {
          sort: {
            $vector: embedding,
          },
          limit: 10,
        }
      );
      const documents = await searchedData.toArray();

      const finalDocs = documents.map((doc) => doc.text).toString();
      extraContext = finalDocs;
    } catch (error) {
      console.log("error while getting extra context", error);
      extraContext = "";
    }

    console.log("final context", extraContext);

    // call external model with new context to get data
    const template = {
      role: "system",
      text: `
      You are an AI assistant who knows chaitanya based on the context. 
      Use the below context to answer the question. If you do not find anything just say you did not find it. Do not search it online.
      Answer with only text, do not include any other format.
      ----------------
      START CONTEXT
      ${extraContext}
      END CONTEXT
      ----------------
      QUESTION: ${latestMessage}
      ----------------
      `,
    };
    const formattedMessages = messages.map((msg) => {
      return { text: `${msg.role}: ${msg.content}` };
    });
    const modelRes = await GEMINI_1_PRO({
      message: `
      You are an AI assistant specialized in providing information about Chaitanya, using only the provided context.
      Use the following context to answer the user's question. If the answer is not within the context, respond with "This information is not available." Do not search for information online.
      Provide your response in plain text only, without any additional formatting.
      ----------------
      START CONTEXT
      ${extraContext}
      END CONTEXT
      ----------------
      QUESTION: ${latestMessage}
      ----------------
      `,
      contents: [
        {
          role: "user",
          parts: [
            { text: template.text },
            ...formattedMessages,
            { text: latestMessage },
          ],
        },
      ],
    });

    const parsedResponse = modelRes.replace("\n", "");

    const success = new SuccessErrorApiResponse({
      data: {
        responseData: parsedResponse,
      },
      metadata: { code: 200, message: "Chat message found." },
    });
    return res.json(success);
  } catch (error: any) {
    console.log("error while generating chat response", error);
    const err = new SuccessErrorApiResponse({
      metadata: {
        code: 500,
        message: error?.message || "Internal Server Error",
      },
    });
    return res.status(500).json(err);
  }
});

export default chatRouter;
