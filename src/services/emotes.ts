import type { MessagePart } from "../types";

export class EmoteService {
  private globalEmotes: Record<string, string> = {};
  private channelEmotes: Record<string, string> = {};

  async initialize(channelName?: string): Promise<void> {
    await this.fetchGlobalEmotes();
    if (channelName) {
      await this.fetchChannelEmotes(channelName);
    }
  }

  private async fetchGlobalEmotes(): Promise<void> {
    try {
      const res = await fetch("https://7tv.io/v3/emote-sets/global");
      if (!res.ok) return;

      const data = await res.json();
      this.globalEmotes = {};

      if (data.emotes && Array.isArray(data.emotes)) {
        data.emotes.forEach((e: any) => {
          this.globalEmotes[e.name] =
            `https://cdn.7tv.app/emote/${e.id}/2x.webp`;
        });
      }
    } catch (err) {}
  }

  private async fetchChannelEmotes(channel: string): Promise<void> {
    try {
      const userId = process.env.SEVENTV_USER_ID;
      let res: Response;

      if (userId) {
        res = await fetch(`https://7tv.io/v3/users/${userId}`);
      } else {
        res = await fetch(`https://7tv.io/v3/users/twitch/${channel}`);
        if (!res.ok) {
          res = await fetch(
            `https://7tv.io/v3/users/twitch/${channel.toLowerCase()}`,
          );
        }
      }

      if (!res.ok) return;

      const user = await res.json();
      let setId = user.emote_set?.id;

      if (!setId && user.connections) {
        const twitch = user.connections.find(
          (c: any) => c.platform === "TWITCH",
        );
        if (twitch?.emote_set_id) setId = twitch.emote_set_id;
      }

      if (!setId) return;

      const setRes = await fetch(`https://7tv.io/v3/emote-sets/${setId}`);
      if (!setRes.ok) return;

      const set = await setRes.json();
      this.channelEmotes = {};

      if (set.emotes && Array.isArray(set.emotes)) {
        set.emotes.forEach((e: any) => {
          const name = e.name || e.data?.name;
          const id = e.id || e.data?.id;
          if (name && id) {
            this.channelEmotes[name] =
              `https://cdn.7tv.app/emote/${id}/2x.webp`;
          }
        });
      }
    } catch (err) {}
  }

  parseEmotes(
    text: string,
    twitchEmotes?: Map<string, string[]>,
  ): MessagePart[] {
    const parts: MessagePart[] = [];
    const allEmotes = { ...this.globalEmotes, ...this.channelEmotes };

    if (twitchEmotes && twitchEmotes.size > 0) {
      const positions: Array<{ start: number; end: number; url: string }> = [];

      twitchEmotes.forEach((pos, id) => {
        pos.forEach((p) => {
          const [start, end] = p.split("-").map(Number);
          positions.push({
            start,
            end,
            url: `https://static-cdn.jtvnw.net/emoticons/v2/${id}/default/dark/2.0`,
          });
        });
      });

      positions.sort((a, b) => a.start - b.start);
      let idx = 0;

      positions.forEach(({ start, end, url }) => {
        if (idx < start) {
          parts.push(...this.parse7TV(text.substring(idx, start), allEmotes));
        }
        parts.push({
          type: "emote",
          url,
          name: text.substring(start, end + 1),
        });
        idx = end + 1;
      });

      if (idx < text.length) {
        parts.push(...this.parse7TV(text.substring(idx), allEmotes));
      }

      return parts;
    }

    return this.parse7TV(text, allEmotes);
  }

  private parse7TV(
    text: string,
    emotes: Record<string, string>,
  ): MessagePart[] {
    const parts: MessagePart[] = [];
    const words = text.split(" ");

    words.forEach((word, i) => {
      if (emotes[word]) {
        parts.push({ type: "emote", url: emotes[word], name: word });
      } else {
        parts.push({ type: "text", content: word });
      }

      if (i < words.length - 1) {
        parts.push({ type: "text", content: " " });
      }
    });

    return parts;
  }
}
