import {
  DataAPIClient,
  VectorDoc,
  UUID,
  ObjectId,
} from "@datastax/astra-db-ts";
import { NODE_CONFIG } from "../config/node-config";
import { RecursiveCharacterTextSplitter } from "langchain/text_splitter";
import { getAboutMeData } from "./helper";
import { createGeminiEmbedding } from "../models/gemini/gemini-setup";

// Schema for the collection (VectorDoc adds the $vector field)
interface Idea extends VectorDoc {
  idea: string;
}

// Connect to the db
const client = new DataAPIClient(NODE_CONFIG.DATASTAX_TOKEN);
const db = client.db(NODE_CONFIG.DATASTAX_API_ENDPOINT, {
  namespace: NODE_CONFIG.DATASTAX_NAMESPACE,
});

const splitter = new RecursiveCharacterTextSplitter({
  chunkSize: 512,
  chunkOverlap: 100,
});

const createOrGetAstraDBCollection = async () => {
  const yetToCreateCollection = NODE_CONFIG.DATASTAX_COLLECTION_NAME;
  const allCollectionList = await db.listCollections();
  const isCollectionExists = allCollectionList.some((collection) => {
    console.log("collection", collection.name, "exists in db", collection);
    if (collection.name.toLowerCase() === yetToCreateCollection.toLowerCase()) {
      console.log("collection already exists", collection.name);
      return true;
    } else {
      console.log("collection does not exist", collection.name);
      return false;
    }
  });

  if (isCollectionExists) {
    console.log("Collection already exists, skipping creation.");
    return;
  }

  const res = await db.createCollection(yetToCreateCollection, {
    vector: {
      dimension: 768,
      metric: "dot_product",
    },
  });
  console.log("collection created", res);
};

export const loadData = async () => {
  // Create the collection if it doesn't exist
  await createOrGetAstraDBCollection();

  const aboutMeData = await getAboutMeData();
  const chunks = await splitter.splitText(aboutMeData);
  const collection = db.collection(NODE_CONFIG.DATASTAX_COLLECTION_NAME);
  console.log("all chuncks", chunks.length);
  console.log("chunks", chunks);
  for await (const chunk of chunks) {
    // console.log("chunck", chunk);
    const embeddingVector = await createGeminiEmbedding({ contents: chunk });
    // console.log("embedding", embedding);
    const doc = {
      $vector: embeddingVector,
      text: chunk,
    };
    console.log("doc to insert", doc);
    await collection.insertOne(doc);
  }
  console.log("SUCCESSFULLY LOADED DATA INTO ASTRA DB");
};

export const getAstraCollection = async () => {
  await createOrGetAstraDBCollection();
  const collection = db.collection(NODE_CONFIG.DATASTAX_COLLECTION_NAME);
  return collection;
};
