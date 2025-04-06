import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";
const mcp = new Client({ name: "mcp-client-cli", version: "1.0.0" });

async function main() {
  await connectToServer(
    "/Users/xzp/Documents/company/ai_space/wuying-mcp/bundle/index.js"
  );
  mcp.close();
}
main();

async function connectToServer(serverScriptPath: string) {
  try {
    const isJs = serverScriptPath.endsWith(".js");
    const isPy = serverScriptPath.endsWith(".py");
    if (!isJs && !isPy) {
      throw new Error("Server script must be a .js or .py file");
    }
    const command = isPy
      ? process.platform === "win32"
        ? "python"
        : "python3"
      : process.execPath;

    const transport = new StdioClientTransport({
      command,
      args: [serverScriptPath],
      env: {
        APIKEY: "akm-4626e8d9-5384-43eb-9fce-560d874a3d91",
        ENV: "local",
      },
    });
    mcp.connect(transport);

    const toolsResult = await mcp.listTools();
    const tools = toolsResult.tools.map((tool) => {
      return {
        name: tool.name,
        description: tool.description,
        input_schema: tool.inputSchema,
      };
    });
    console.log(
      "Connected to server with tools:",
      tools.map(({ name }) => name)
    );
  } catch (e) {
    console.log("Failed to connect to MCP server: ", e);
    throw e;
  }
}
