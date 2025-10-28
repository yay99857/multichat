import type { Config } from "../types";

export function loadConfig(): Config {
  return {
    twitch: {
      enabled: !!(process.env.TWITCH_CHANNEL && process.env.TWITCH_TOKEN),
      channel: process.env.TWITCH_CHANNEL,
      token: process.env.TWITCH_TOKEN,
      sevenTvUserId: process.env.SEVENTV_USER_ID,
    },
    youtube: {
      enabled: !!(process.env.YOUTUBE_CHANNEL_ID || process.env.YOUTUBE_HANDLE),
      channelId: process.env.YOUTUBE_CHANNEL_ID,
      handle: process.env.YOUTUBE_HANDLE,
    },
    server: {
      httpPort: parseInt(process.env.HTTP_PORT || "3000", 10),
      wsPort: parseInt(process.env.WS_PORT || "3001", 10),
    },
  };
}

export function validateConfig(config: Config): void {
  if (!config.twitch.enabled && !config.youtube.enabled) {
    console.warn("⚠️  No chat platforms enabled");
  }

  if (
    config.twitch.enabled &&
    (!config.twitch.channel || !config.twitch.token)
  ) {
    throw new Error("TWITCH_CHANNEL and TWITCH_TOKEN required");
  }

  if (
    config.youtube.enabled &&
    !config.youtube.channelId &&
    !config.youtube.handle
  ) {
    throw new Error("YOUTUBE_CHANNEL_ID or YOUTUBE_HANDLE required");
  }
}
