import { ChatClient } from "@twurple/chat";
import type { ChatMessage, Badge } from "../types";
import type { EmoteService } from "./emotes";

export class TwitchService {
  private client: ChatClient | null = null;
  private channel: string;
  private emotes: EmoteService;
  private onMessage: (msg: ChatMessage) => void;

  private badges: Record<string, string> = {
    moderator:
      "https://static-cdn.jtvnw.net/badges/v1/3267646d-33f0-4b17-b3df-f923a41db1d0/2",
    vip: "https://static-cdn.jtvnw.net/badges/v1/b817aba4-fad8-49e2-b88a-7cc744dfa6ec/2",
    subscriber:
      "https://static-cdn.jtvnw.net/badges/v1/5d9f2208-5dd8-11e7-8513-2ff4adfae661/2",
    broadcaster:
      "https://static-cdn.jtvnw.net/badges/v1/5527c58c-fb7d-422d-b71b-f309dcb85cc1/2",
    premium:
      "https://static-cdn.jtvnw.net/badges/v1/bbbe0db0-a598-423e-86d0-f9fb98ca1933/2",
    turbo:
      "https://static-cdn.jtvnw.net/badges/v1/bd444ec6-8f34-4bf9-91f4-af1e3428d80f/2",
    partner:
      "https://static-cdn.jtvnw.net/badges/v1/d12a2e27-16f6-41d0-ab77-b780518f00a3/2",
  };

  constructor(
    channel: string,
    emotes: EmoteService,
    onMessage: (msg: ChatMessage) => void,
  ) {
    this.channel = channel;
    this.emotes = emotes;
    this.onMessage = onMessage;
  }

  async start(): Promise<void> {
    this.client = new ChatClient({ channels: [this.channel] });

    this.client.onMessage((ch, user, text, msg) => {
      try {
        const parts = this.emotes.parseEmotes(text, msg.emoteOffsets);
        const userBadges = this.parseBadges(msg.userInfo.badges);

        this.onMessage({
          platform: "twitch",
          user,
          text,
          parts,
          badges: userBadges,
        });
      } catch (err) {}
    });

    await this.client.connect();
    console.log(`✅ Twitch: Connected to channel '${this.channel}'`);
  }

  private parseBadges(info?: Map<string, string>): Badge[] {
    if (!info) return [];

    const result: Badge[] = [];
    info.forEach((v, k) => {
      if (this.badges[k]) {
        result.push({ name: k, url: this.badges[k] });
      }
    });
    return result;
  }

  async stop(): Promise<void> {
    if (this.client) {
      try {
        await this.client.quit();
      } catch (err) {}
      this.client = null;
    }
  }

  isConnected(): boolean {
    return this.client !== null;
  }
}
