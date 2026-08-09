#!/usr/bin/env node
/**
 * STDIO entry point — what `npx macrostrat-mcp` and Claude Desktop run.
 *
 * `src/server.ts` holds the server itself and is side-effect free, so it can be
 * imported and connected to a different transport without starting stdio.
 */
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import createServer from "./server.js";

const server = createServer();
const transport = new StdioServerTransport();

server.connect(transport).catch((error) => {
  console.error("Failed to start STDIO server:", error);
  process.exit(1);
});
