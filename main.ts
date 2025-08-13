import { GameManager } from "./src/game/GameManager.ts";
import { WebSocketHandler } from "./src/server/WebSocketHandler.ts";

const gameManager = new GameManager();
const wsHandler = new WebSocketHandler(gameManager);

async function handler(req: Request): Promise<Response> {
  const url = new URL(req.url);

  // Handle WebSocket connections
  if (req.headers.get("upgrade") === "websocket") {
    return wsHandler.handleConnection(req);
  }

  // Serve static files and API endpoints
  switch (url.pathname) {
    case "/":
      return new Response(await getIndexHTML(), {
        headers: { "content-type": "text/html" },
      });

    case "/styles.css":
      try {
        const css = await Deno.readTextFile("./static/styles.css");
        return new Response(css, {
          headers: { "content-type": "text/css" },
        });
      } catch {
        return new Response("/* CSS file not found */", {
          status: 404,
          headers: { "content-type": "text/css" },
        });
      }

    case "/api/game/start":
      if (req.method === "POST") {
        const body = await req.json();
        const gameId = await gameManager.startNewGame(body.gmPrompt, body.characters);
        return Response.json({ gameId });
      }
      break;

    case "/api/game/status":
      if (req.method === "GET") {
        const gameId = url.searchParams.get("gameId");
        if (gameId) {
          const status = await gameManager.getGameStatus(gameId);
          return Response.json(status);
        }
      }
      break;

    case "/api/llm/status":
      if (req.method === "GET") {
        const llmStatus = gameManager.getLLMStatus();
        return Response.json(llmStatus);
      }
      break;

    case "/api/game/prompt":
      if (req.method === "POST") {
        const body = await req.json();
        await gameManager.processGMPrompt(body.gameId, body.prompt);
        const status = await gameManager.getGameStatus(body.gameId);
        return Response.json(status);
      }
      break;

    default:
      return new Response("Not Found", { status: 404 });
  }

  return new Response("Method Not Allowed", { status: 405 });
}

async function getIndexHTML(): Promise<string> {
  try {
    return await Deno.readTextFile("./static/index.html");
  } catch {
    // Fallback HTML if static file doesn't exist
    return `
<!DOCTYPE html>
<html>
<head>
    <title>D&D LLM Chat</title>
</head>
<body>
   <h1>Oops! D&D LLM Chat is not available</h1>
</body>
</html>
    `;
  }
}

console.log("D&D LLM Chat Server starting...");
console.log("Server will be available at http://localhost:8000");

Deno.serve({ port: 8000 }, handler);
