# MediaMiner (FastAPI + React)

Fast, containerized YouTube/media downloader with live progress, history, and file browser.

- **Backend:** FastAPI + yt-dlp + WebSocket progress
- **Frontend:** React (Vite) served by nginx
- **Proxying:** nginx proxies `/api/*` and `/ws/*` to the backend so the UI can call relative URLs

## Features
- Audio or video downloads with format/bitrate/container selection
- Playlist support (toggle + specific item selection)
- Custom metadata fields (title/artist/year/album/genre)
- Cookie support for authenticated downloads
- Live progress + cancel/stop control
- Download history, re-download actions, and local files list
- Log viewer with timestamped entries

## Run with Docker

```bash
docker compose up --build
```

Open:
- http://localhost:8080

Downloads persist to:
- `./downloads`

## Quick UI Guide
- Enter URL, optionally preview metadata, choose Audio or Video, then start download
- Toggle **Allow playlist** and set **Playlist items** (e.g. `1-3,5`) when needed
- Paste cookies text (if required) into the **Cookies** field
- Stop a running download from the progress panel
- **Downloads** page: history + downloaded files
- **Logs** page: live job log

## Cookies (optional)

1. Put cookies at `./cookies/cookies.txt`
2. Uncomment the cookies volume in `docker-compose.yml`
3. In the UI set `cookie_file` to `/app/cookies/cookies.txt`

## Dev mode (optional)

Backend:
```bash
cd backend
python -m venv .venv
source .venv/bin/activate  # Windows: .venv\Scripts\activate
pip install -r requirements.txt
uvicorn backend.app:app --reload --port 8000
```

Frontend:
```bash
cd frontend
npm install
npm run dev
```

Open:
- http://localhost:5173

Vite proxies `/api` and `/ws` to the backend.

## Build
```bash
cd frontend
npm install
npm run build
```

## Troubleshooting
- If ports clash: change `docker-compose.yml` published ports (nginx `8080`, backend `8000`)
- Cookies not applied: ensure volume is mounted and the UI cookie path matches (`/app/cookies/cookies.txt`)
- Stale UI: clear browser cache or run `npm run dev` for a fresh build
