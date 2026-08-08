import dotenv from "dotenv";
dotenv.config();

import { createServer } from "http";
import app from "./app";

const PORT = process.env.PORT ? Number(process.env.PORT) : 3000;

const server = createServer(app);

server.listen(PORT, () => {
  // eslint-disable-next-line no-console
  console.log(`Backend listening on http://localhost:${PORT}`);
});
