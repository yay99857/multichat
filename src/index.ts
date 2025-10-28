import { Elysia } from "elysia";
import { staticPlugin } from "@elysiajs/static";
import { createServer } from "http";
import { WebSocketServer } from "ws";
import { loadConfig, validateConfig } from "./config";
import { EmoteService } from "./services/emotes";
import { TwitchService } from "./services/twitch";
import { YouTubeService } from "./services/youtube";
import type { ChatMessage } from "./types";

const config = loadConfig();
validateConfig(config);

const emotes = new EmoteService();
const clients = new Set<any>();

let twitch: TwitchService | null = null;
let youtube: YouTubeService | null = null;

function broadcast(msg: ChatMessage) {
  const data = JSON.stringify(msg);
  clients.forEach((ws) => {
    try {
      if (ws.readyState === 1) ws.send(data);
    } catch (err) {
      clients.delete(ws);
    }
  });
}

const app = new Elysia()
  .use(staticPlugin({ assets: "./public" }))
  .get("/", () => Bun.file("./public/index.html"))
  .get("/health", () => ({
    status: "ok",
    clients: clients.size,
    twitch: twitch?.isConnected() ?? false,
    youtube: youtube?.isConnected() ?? false,
  }))
  .listen(config.server.httpPort);

console.log(`✅ HTTP Server: http://localhost:${config.server.httpPort}`);

const server = createServer();
const wss = new WebSocketServer({ server });

wss.on("connection", (ws) => {
  clients.add(ws);
  ws.on("close", () => clients.delete(ws));
  ws.on("error", () => clients.delete(ws));
});

server.listen(config.server.wsPort || 3001);
console.log(`✅ WebSocket: ws://localhost:${config.server.wsPort || 3001}`);

async function init() {
  await emotes.initialize(config.twitch.channel);

  if (config.twitch.enabled && config.twitch.channel) {
    twitch = new TwitchService(config.twitch.channel, emotes, broadcast);
    await twitch.start();
  } else {
    console.log("❌ Twitch: disabled");
  }

  if (config.youtube.enabled) {
    youtube = new YouTubeService(
      { channelId: config.youtube.channelId, handle: config.youtube.handle },
      broadcast,
    );
    await youtube.start();
  } else {
    console.log("❌ YouTube: disabled");
  }
}

async function cleanup() {
  if (twitch) await twitch.stop();
  if (youtube) await youtube.stop();
  clients.forEach((ws) => {
    try {
      ws.close();
    } catch (err) {}
  });
  clients.clear();
  wss.close();
  server.close();
  process.exit(0);
}

process.on("SIGINT", cleanup);
process.on("SIGTERM", cleanup);
process.on("uncaughtException", cleanup);
process.on("unhandledRejection", cleanup);

init().catch(() => process.exit(1));
