export type Platform = "twitch" | "youtube";

export interface MessagePart {
  type: "text" | "emote";
  content?: string;
  url?: string;
  name?: string;
}

export interface Badge {
  name: string;
  url: string;
}

export interface ChatMessage {
  platform: Platform;
  user: string;
  text: string;
  parts: MessagePart[];
  badges?: Badge[];
  timestamp?: number;
}

export interface Config {
  twitch: {
    enabled: boolean;
    channel?: string;
    token?: string;
    sevenTvUserId?: string;
  };
  youtube: {
    enabled: boolean;
    channelId?: string;
    handle?: string;
  };
  server: {
    httpPort: number;
    wsPort: number;
  };
}
