# Multichat

Unified Twitch and YouTube chat for OBS.

## Setup

1. Unzip files.

2. Configure `.env`:
```env
TWITCH_CHANNEL=your_channel
TWITCH_TOKEN=your_token

YOUTUBE_HANDLE=@your_handle
# or
YOUTUBE_CHANNEL_ID=your_id

SEVENTV_USER_ID=your_7tv_id
```

2. Start your livestreams.

3. Run the server:
```bash
Run the multichat-overlay.exe
```

## OBS Usage

**Dock (side panel):**
- Add Custom Browser Dock
- URL: `http://localhost:3000`

**Browser Source (overlay):**
- Add Browser Source
- URL: `http://localhost:3000`
- Width: 450-500px
- Height: 800-1080px

---

Access `http://localhost:3000` in your browser to view.
