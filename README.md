# 🎮 Palworld Web Manager

A web-based management panel for [Palworld Dedicated Server](https://tech.palworldgame.com/dedicated-server-guide), built with **Vue 3** + **Elysia (Bun)** and deployed via **Docker Compose**.

![Vue](https://img.shields.io/badge/Vue_3-4FC08D?logo=vuedotjs&logoColor=white)
![Bun](https://img.shields.io/badge/Bun-000?logo=bun&logoColor=white)
![Docker](https://img.shields.io/badge/Docker-2496ED?logo=docker&logoColor=white)
![License](https://img.shields.io/badge/license-MIT-blue)

---

## ✨ Features

| Feature               | Description                                                                                    |
| --------------------- | ---------------------------------------------------------------------------------------------- |
| **Dashboard**         | Real-time server info, metrics, and player count                                               |
| **Players**           | View online players — kick, ban, unban                                                         |
| **Settings Editor**   | Visual editor with 3 category tabs (Server / In-Game / Advanced), sliders, toggles, validation |
| **Server Control**    | Start, restart (graceful save → shutdown → start), save world, announce, force stop            |
| **JWT Auth**          | Login with `PALWORLD_API_USER`/`PASSWORD`, httpOnly cookies, Bearer token support              |
| **Refresh Token**     | Short-lived access token (30m) + long-lived refresh token (7d), silent auto-refresh            |
| **Docker Management** | Start/stop/restart the game server container via Docker socket                                 |

---

## 📁 Project Structure

```
palworld-web-manage/
├── compose.yaml          # Docker Compose — backend + frontend
├── .env.example          # Environment variable template
├── backend/
│   ├── Dockerfile        # Bun Alpine image
│   ├── package.json
│   ├── tsconfig.json
│   └── src/
│       ├── index.ts              # Elysia server — API routes, auth, Docker helpers
│       └── settings-parser.ts    # INI parser, schema, serializer, validator
└── frontend/
    ├── Dockerfile        # Node build → Nginx serve
    ├── package.json
    ├── vite.config.ts
    ├── nginx.conf        # SPA fallback + API reverse proxy
    └── src/
        ├── App.vue                   # Root layout with sidebar
        ├── main.ts                   # Router + auth navigation guard
        ├── composables/
        │   ├── api.ts                # fetchApi — credentials, auto-refresh
        │   └── auth.ts              # Auth state — login, logout, checkAuth
        └── views/
            ├── Login.vue             # Login page
            ├── Dashboard.vue         # Server info & metrics
            ├── Players.vue           # Online player management
            ├── Settings.vue          # 3-tab settings editor
            └── ServerControl.vue     # Start, restart, shutdown controls
```

---

## 🚀 Quick Start

### Prerequisites

- **Docker** & **Docker Compose** v2+
- **Linux host** recommended (Docker Desktop on Windows/macOS has slow disk I/O)

### 1. Set up Palworld Dedicated Server

First, clone the official Palworld Dedicated Server Docker repo and start the game server:

```bash
git clone https://github.com/pocketpairjp/palworld-dedicated-server-docker.git
cd palworld-dedicated-server-docker

# Start the game server
cd compose
docker compose up -d
cd ..
```

> Wait for the server to fully boot (check with `docker compose -f compose/compose.yaml logs -f`).
> On first launch, `Saved/` and `PalWorldSettings.ini` will be generated automatically.

Make sure the REST API is enabled — edit `compose/Saved/Config/LinuxServer/PalWorldSettings.ini` and set `RESTAPIEnabled=True` with your `AdminPassword`.

For more details see the [official server guide](https://tech.palworldgame.com/).

### 2. Clone palworld-web-manage into the repo

```bash
# You should be inside palworld-dedicated-server-docker/
git clone https://github.com/<your-username>/palworld-web-manage.git
cd palworld-web-manage
```

Your directory structure should now look like:

```
palworld-dedicated-server-docker/
├── compose/                  ← official game server (docker compose)
│   ├── compose.yaml
│   └── Saved/                ← server data + PalWorldSettings.ini
│       └── Config/LinuxServer/PalWorldSettings.ini
├── palworld-web-manage/      ← this web manager ★
│   ├── compose.yaml
│   ├── .env
│   ├── backend/
│   └── frontend/
├── README.md
└── README-JA.md
```

### 3. Configure environment

```bash
cp .env.example .env
```

Edit `.env` with your values:

```dotenv
PALWORLD_API_HOST=palworld-server    # game server hostname or IP
PALWORLD_API_PORT=8212               # REST API port
PALWORLD_API_USER=admin
PALWORLD_API_PASSWORD=your-password  # same as AdminPassword in PalWorldSettings.ini

PALWORLD_SAVED_PATH=../compose/Saved # points up to the game server's Saved directory
PALWORLD_CONTAINER_NAME=palworld-server
WEB_PORT=8080
```

> **Note:** `PALWORLD_SAVED_PATH=../compose/Saved` assumes `palworld-web-manage/` is inside `palworld-dedicated-server-docker/`. Adjust if your layout differs.

### 4. Build & run

```bash
docker compose up -d --build
```

### 5. Open the web UI

```
http://your-server-ip:8080
```

Login with the same `PALWORLD_API_USER` / `PALWORLD_API_PASSWORD` you set in `.env`.

---

## ⚙️ Environment Variables

| Variable                  | Default                    | Description                                          |
| ------------------------- | -------------------------- | ---------------------------------------------------- |
| `PALWORLD_API_HOST`       | `palworld-server`          | Palworld server hostname (Docker service name or IP) |
| `PALWORLD_API_PORT`       | `8212`                     | Palworld REST API port                               |
| `PALWORLD_API_USER`       | `admin`                    | REST API username                                    |
| `PALWORLD_API_PASSWORD`   | _(empty)_                  | REST API password (`AdminPassword`)                  |
| `PALWORLD_SAVED_PATH`     | `../compose/Saved`         | Host path to the server's `Saved/` directory         |
| `PALWORLD_CONTAINER_NAME` | `palworld-server`          | Docker container name of the game server             |
| `WEB_PORT`                | `8080`                     | Port for the web UI                                  |
| `JWT_SECRET`              | _(auto from password)_     | Secret for signing JWTs                              |
| `JWT_EXPIRY`              | `30m`                      | Access token lifetime                                |
| `REFRESH_EXPIRY`          | `7d`                       | Refresh token lifetime                               |
| `COOKIE_EXPIRY`           | _(same as REFRESH_EXPIRY)_ | Browser cookie `maxAge`                              |

---

## 🔐 Authentication

The web panel uses **JWT** with a two-token system:

| Token   | Cookie Name        | Default Expiry | Purpose                         |
| ------- | ------------------ | -------------- | ------------------------------- |
| Access  | `palworld_token`   | 30 min         | Authenticates every API request |
| Refresh | `palworld_refresh` | 7 days         | Silently renews access tokens   |

- **Cookies**: httpOnly, SameSite=Lax — used automatically by the browser
- **Bearer**: Send `Authorization: Bearer <access_token>` for programmatic API access
- **Refresh header**: Send `X-Refresh-Token: <refresh_token>` to `POST /api/auth/refresh`

### Auth Endpoints

| Method | Path                | Description                                                |
| ------ | ------------------- | ---------------------------------------------------------- |
| `POST` | `/api/auth/login`   | Login → returns tokens + sets cookies                      |
| `POST` | `/api/auth/logout`  | Clears all auth cookies                                    |
| `GET`  | `/api/auth/me`      | Check auth status (auto-refreshes if access token expired) |
| `POST` | `/api/auth/refresh` | Exchange refresh token for new access token                |

---

## 📡 API Endpoints

All endpoints below require authentication (cookie or Bearer token).

### Settings (INI file)

| Method | Path                   | Description                                               |
| ------ | ---------------------- | --------------------------------------------------------- |
| `GET`  | `/api/settings-schema` | Settings schema with metadata, defaults, validation rules |
| `GET`  | `/api/config`          | Read parsed `PalWorldSettings.ini`                        |
| `POST` | `/api/config`          | Save settings (validated)                                 |
| `POST` | `/api/config/raw`      | Save raw INI content                                      |

### Palworld Server API (proxied)

| Method | Path                     | Description       |
| ------ | ------------------------ | ----------------- |
| `GET`  | `/api/palworld/info`     | Server info       |
| `GET`  | `/api/palworld/players`  | Online players    |
| `GET`  | `/api/palworld/settings` | Runtime settings  |
| `GET`  | `/api/palworld/metrics`  | Server metrics    |
| `POST` | `/api/palworld/announce` | Broadcast message |
| `POST` | `/api/palworld/kick`     | Kick player       |
| `POST` | `/api/palworld/ban`      | Ban player        |
| `POST` | `/api/palworld/unban`    | Unban player      |
| `POST` | `/api/palworld/save`     | Save world        |
| `POST` | `/api/palworld/shutdown` | Graceful shutdown |
| `POST` | `/api/palworld/stop`     | Force stop        |

### Docker Container Management

| Method | Path                     | Description                            |
| ------ | ------------------------ | -------------------------------------- |
| `GET`  | `/api/container/status`  | Container state (running/stopped/etc.) |
| `POST` | `/api/container/start`   | Start the game server container        |
| `POST` | `/api/container/restart` | Save → shutdown → wait → start         |

---

## 🛠 Development

### Backend (Bun + Elysia)

```bash
cd backend
bun install
bun run dev    # starts with --watch
```

### Frontend (Vue 3 + Vite)

```bash
cd frontend
npm install
npm run dev    # Vite dev server at http://localhost:5173
```

> **Note:** During local dev, the Vite dev server proxies `/api/` to the backend. Configure `vite.config.ts` `server.proxy` if needed.

---

## 🐳 Docker Architecture

```
┌────────────────────────────────────────────┐
│  Browser → :8080                           │
│  ┌──────────────────────────┐              │
│  │   Nginx (frontend)       │              │
│  │   - Serves Vue SPA       │              │
│  │   - Proxies /api/ →──────┼──┐           │
│  └──────────────────────────┘  │           │
│                                │           │
│  ┌──────────────────────────┐  │           │
│  │   Elysia (backend) :3000 │◄─┘           │
│  │   - REST API             │              │
│  │   - JWT Auth             │              │
│  │   - INI Parser           │──→ Saved/    │
│  │   - Docker Socket        │──→ 🐳        │
│  └──────────────────────────┘              │
│                  palworld-web-manage net   │
└────────────────────────────────────────────┘
```

---

## 📄 License

MIT
