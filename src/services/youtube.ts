import { LiveChat } from "youtube-chat";
import type { ChatMessage, MessagePart } from "../types";

export class YouTubeService {
  private chat: LiveChat | null = null;
  private channelId?: string;
  private handle?: string;
  private onMessage: (msg: ChatMessage) => void;

  constructor(
    options: { channelId?: string; handle?: string },
    onMessage: (msg: ChatMessage) => void,
  ) {
    this.channelId = options.channelId;
    this.handle = options.handle;
    this.onMessage = onMessage;
  }

  async start(): Promise<void> {
    const opts = this.channelId
      ? { channelId: this.channelId }
      : { handle: this.handle! };

    this.chat = new LiveChat(opts);

    this.chat.on("start", () => {
      console.log(`✅ YouTube: Live stream is active`);
    });

    this.chat.on("chat", (item: any) => {
      try {
        const user = item.author?.name || "Unknown";
        const parts = this.parseMessage(item.message);
        const text = this.extractText(item.message);

        this.onMessage({
          platform: "youtube",
          user,
          text,
          parts: parts.length > 0 ? parts : [{ type: "text", content: text }],
        });
      } catch (err) {}
    });

    this.chat.on("error", (err: any) => {
      if (err?.message?.includes("Live Stream was not found")) {
        console.log(`⚠️  YouTube: Live stream not found (channel offline)`);
      }
    });
    this.chat.on("end", () => {
      console.log(`⚠️  YouTube: Live stream ended`);
    });

    await this.chat.start();

    const id = this.channelId || this.handle;
    console.log(`✅ YouTube: Connected to ${id}`);
  }

  private parseMessage(msg: any): MessagePart[] {
    if (!msg || !Array.isArray(msg)) return [];

    const parts: MessagePart[] = [];
    msg.forEach((m: any) => {
      if (m.text) {
        parts.push({ type: "text", content: m.text });
      } else if (m.url) {
        parts.push({ type: "emote", url: m.url, name: m.alt || "emote" });
      }
    });
    return parts;
  }

  private extractText(msg: any): string {
    if (!msg || !Array.isArray(msg)) return "";
    return msg.map((m: any) => m.text || m.alt || "").join("");
  }

  async stop(): Promise<void> {
    if (this.chat) {
      try {
        this.chat.stop();
      } catch (err) {}
      this.chat = null;
    }
  }

  isConnected(): boolean {
    return this.chat !== null;
  }
}
