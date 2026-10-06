# Part 3 – Backend (Student Safety & Location Tracking)

Middle layer between the **Student App (Phone B)** and the **Faculty App**.

```
Phone B --HTTP--> Express API --> Redis (latest location)
                       |--> AI risk engine (NORMAL / WARNING / HIGH_RISK, 0-100)
                       |--> MongoDB (permanent records, alerts, SOS)
                       '--> Socket.IO --> Faculty App (live updates + alerts)
```

## Why Redis?
Phone B may send a location every second or two. Faculty only need the **latest** position fast.
Redis lives in memory, so reading/overwriting `student:S101:location` takes well under a millisecond, and a TTL
(`LOCATION_TTL_SECONDS`, default 300 s) removes stale positions automatically. We never write every update
to MongoDB; only "important" points are saved (first point, moved >= 50 m, 5 minutes passed, or risk is not NORMAL).
Redis also holds the last 10 points per student (for speed/direction analysis) and the latest risk result.
If a Redis entry has expired, `GET .../location` falls back to the last point saved in MongoDB.

## Why MongoDB?
Data that must survive restarts: students, faculty, important location history, SOS records, alerts, AI risk events.

## Folder guide
| Path | What it does |
|---|---|
| `src/server.js` | Starts Express, Socket.IO, MongoDB, Redis |
| `src/config/` | `env.js` (reads .env), `db.js` (MongoDB), `redis.js` (Redis) |
| `src/routes/index.js` | Lists all REST endpoints |
| `src/controllers/` | Handle request/response only (location, students, sos, alerts) |
| `src/services/` | Real logic: `locationService` (main pipeline), `redisService`, `alertService`, `socketService`, `aiService` |
| `src/models/` | Mongoose schemas: Student, Faculty, LocationHistory, Sos, Alert, RiskEvent |
| `src/middleware/` | `validate.js` (input checks), `auth.js` (API key, auth-ready), `errorHandler.js` |
| `src/ai/` | `riskEngine.js` (explainable rules), `geo.js` (distance/direction maths) |
| `scripts/` | `seed.js` (sample data), `test-api.js` (automated test), `simulate-phone.js` (fake Phone B + fake Faculty App) |

## Setup

### 1. Install
- **Node.js 18+** (https://nodejs.org) – check with `node -v`
- **MongoDB Community** (https://www.mongodb.com/try/download/community), or free MongoDB Atlas
- **Redis**
  - Linux/Mac: `sudo apt install redis-server` / `brew install redis`
  - Windows: use WSL, or Docker: `docker run -d -p 6379:6379 redis`
- Quick option for both databases with Docker:
  ```
  docker run -d --name mongo -p 27017:27017 mongo:7
  docker run -d --name redis -p 6379:6379 redis:7
  ```

### 2. Configure
```
cd part3-backend
npm install
cp .env.example .env      # Windows: copy .env.example .env
```
Edit `.env` if your MongoDB/Redis addresses differ. Never commit `.env`. Set `API_KEY` to turn on simple authentication
(then send header `x-api-key` on every request; Socket.IO clients send `auth: { apiKey }`). For production set
`CORS_ORIGINS` to your Faculty App origin instead of `*`.

### 3. Run
```
npm run seed        # creates students S101, S102, S103 and faculty F001
npm start           # or: npm run dev   (auto-restart)
```
Check: http://localhost:5000/health

## Testing (before Phone B exists)
Automated: with the server running, `npm run test:api`.
Live demo: `npm run simulate` (fake Phone B walking, then moving fast out of the campus; prints live faculty events).
Edit the campus centre in `scripts/seed.js` to your real campus coordinates.

### curl
```
curl -X POST localhost:5000/api/location -H "Content-Type: application/json" \
  -d '{"studentId":"S101","latitude":17.3850,"longitude":78.4867,"timestamp":"2026-10-06T10:30:25Z"}'

curl localhost:5000/api/students/S101/location
curl localhost:5000/api/students/S101/risk

curl -X POST localhost:5000/api/sos -H "Content-Type: application/json" \
  -d '{"studentId":"S101","latitude":17.3850,"longitude":78.4867,"timestamp":"2026-10-06T10:35:00Z"}'

curl localhost:5000/api/alerts
curl -X POST localhost:5000/api/alerts/<ALERT_ID>/acknowledge -H "Content-Type: application/json" -d '{"facultyId":"F001"}'
```
(Add `-H "x-api-key: YOUR_KEY"` if API_KEY is set. In Postman use the same URLs, method and JSON body.)

## API summary
| Method | Path | Used by |
|---|---|---|
| POST | `/api/location` | Phone B |
| POST | `/api/sos` | Phone B |
| GET | `/api/students` | Faculty (all students + latest location + risk) |
| GET | `/api/students/:id/location` | Faculty |
| GET | `/api/students/:id/risk` | Faculty |
| GET | `/api/alerts?status=OPEN&type=SOS&studentId=S101&limit=50` | Faculty |
| GET | `/api/alerts/:id` | Faculty |
| POST | `/api/alerts/:id/acknowledge` | Faculty |

### Socket.IO events (Faculty App listens)
`location:update`, `risk:update`, `alert:new`, `alert:acknowledged`
```js
import { io } from "socket.io-client";
const socket = io("http://<server-ip>:5000", { auth: { apiKey: "..." } });
socket.on("location:update", (p) => console.log(p));
socket.on("alert:new", (a) => console.log(a));
```

## AI risk engine (`src/ai/riskEngine.js`)
Transparent rules, each adds points and a plain-language reason: outside geofence, unusual speed, sudden jump or speed change,
route deviation, repeated sharp direction reversals, repeated abnormal readings. Score < 30 NORMAL, 30-59 WARNING, >= 60 HIGH_RISK.
It only flags unusual movement and never claims a student is in danger. Alerts for WARNING/HIGH_RISK are rate limited
(`ALERT_COOLDOWN_SECONDS`). Thresholds are in `CONFIG` at the top of the file. To use a Python/FastAPI model later, change only
`src/services/aiService.js` to call it and return `{ riskScore, riskLevel, reasons }`.

## Connecting the apps
- **Phone B:** POST to `http://<your-computer-LAN-IP>:5000/api/location` (phone and computer on the same Wi-Fi; `localhost` will not work from a phone). For internet use, deploy or use a tunnel (e.g. ngrok) and use HTTPS.
- **Faculty App:** call the GET endpoints for initial data, then keep a Socket.IO connection for live updates.

## Notes / limitations
- Auth is a shared API key (auth-ready structure); add per-user JWT login before real deployment.
- Student identity is the `studentId` sent by the app; with real users, bind it to the logged-in account.
- Location data is sensitive: use HTTPS, get consent from students, and set a retention policy for `LocationHistory`.
