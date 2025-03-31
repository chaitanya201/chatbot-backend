import express from "express";
import cors from "cors";
import { NODE_CONFIG } from "./config/node-config";
import { loadData } from "./db/datastax";
import chatRouter from "./routes/chat.route";

const baseURL = "/api/v1";
const PORT = NODE_CONFIG.PORT || 3000;

const app = express();

app.use(cors({ origin: "*" }));
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
// loadData();

app.use(`${baseURL}/chat`, chatRouter);
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
