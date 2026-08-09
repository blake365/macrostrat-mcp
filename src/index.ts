#!/usr/bin/env node
/**
 * STDIO entry point, used by Claude Desktop and any other stdio MCP client.
 *
 * The Smithery HTTP runtime builds `src/server.ts` instead, which exports the
 * server factory with no side effects. Keeping the two entry points separate
 * means neither has to guess whether it is the process entry point.
 */
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import createServer from "./server.js";

const server = createServer({ config: {} });
const transport = new StdioServerTransport();

server.connect(transport).catch((error) => {
  console.error("Failed to start STDIO server:", error);
  process.exit(1);
});
