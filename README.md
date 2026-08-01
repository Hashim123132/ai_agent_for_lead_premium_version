<p align="center">
  <h1 align="center">Hashim Car Rentals — AI Booking Agent</h1>
  <p align="center">
    AI-powered conversational car rental booking agent built with LangGraph.
    <br />
    Handles end-to-end reservations via Facebook Messenger — from car selection
    and calendar slot lookup to booking confirmation and voice calls.
  </p>
  <p align="center">
    <a href="#demo">View Demo</a>
    ·
    <a href="#features">Features</a>
    ·
    <a href="#getting-started">Getting Started</a>
    ·
    <a href="#architecture">Architecture</a>
  </p>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/python-3.11%2B-blue" alt="Python 3.11+" />
  <img src="https://img.shields.io/badge/framework-LangGraph-purple" alt="LangGraph" />
  <img src="https://img.shields.io/badge/LLM-Mistral%20AI-orange" alt="Mistral AI" />
  <img src="https://img.shields.io/badge/integration-Facebook%20Messenger-1877F2" alt="Facebook Messenger" />
  <img src="https://img.shields.io/badge/license-Commercial-red" alt="License" />
</p>

---

## Demo

![Hashim Car Rentals AI Booking Agent Demo](assets/demo.gif)



---

## Features

- **Car Inventory Management** — Browse available cars and check individual car
  availability from Google Sheets
- **Smart Calendar Slot Lookup** — Checks Google Calendar for free time slots
  matching pickup and return windows
- **End-to-End Booking** — Creates Google Calendar events, saves bookings to
  Google Sheets, and marks cars as unavailable
- **Gmail Confirmation Drafts** — Auto-generates confirmation email drafts with
  full booking details
- **Outbound Voice Calls** — Makes confirmation calls via Bland.ai API
- **Facebook Messenger Integration** — Full webhook server with typing
  indicators and conversation history
- **Multi-Provider LLM Support** — Defaults to Mistral AI, swappable to OpenAI,
  Gemini, or Groq

---

## Tech Stack

| Category | Technology |
|----------|------------|
| Agent Framework | LangGraph (StateGraph, ToolNode) |
| LLM | Mistral AI (`mistral-small-latest`), swappable |
| Tool Integration | Composio (Google Calendar, Gmail) |
| Server | FastAPI + uvicorn |
| Channel | Facebook Messenger (Graph API v18.0) |
| Spreadsheets | Google Sheets via gspread |
| Voice | Bland.ai |
| Web Search | Tavily |
| CI/CD | GitHub Actions (ruff, mypy, codespell, pytest) |

---

## Architecture

```
                    +---------------------+
                    |  Facebook Messenger  |
                    +----------+----------+
                               |
                    HTTP POST /facebook/webhook
                               |
                    +----------v----------+
                    |   src/server.py      |
                    |   (FastAPI)          |
                    +----------+----------+
                               | ainvoke()
                    +----------v----------+
                    | booking_agent   |
                    |  graph.py           |
                    |  (StateGraph)       |
                    +----------+----------+
                               |
              +----------------+----------------+
              |                |                |
      +-------v-------+  +----v--------+  +----v--------+
      |   agent node  |  | find_car_   |  | booking_    |
      | (LLM generate |  | availability|  | tools node  |
      |  response +   |  | (Calendar   |  | (ToolNode)  |
      |  tool binding)|  |  free slots)|  +-------------+
      +-------+-------+  +-------------+       |
              |               |                |
              |               |                +-- Google Calendar (create event)
              |               |                +-- Gmail (create draft)
              |               |                +-- mark_car_unavailable
              |               |                +-- save_booking
              |               |                +-- Bland.ai (confirmation call)
              |               |
              +-------+-------+
                      |
               Google Calendar
               (find free slots)

  External data stores:
    - Google Sheets: Cars inventory, Bookings log
    - Google Drive: Service account credentials
```

### Graph Flow

1. **START** → `agent` node — LLM generates a response and may invoke tools
2. **Conditional routing** based on the last tool call:
   - `GOOGLECALENDAR_FIND_FREE_SLOTS` → `find_car_availability` node
   - Any other tool → `booking_tools` node
   - No tool calls → END
3. `find_car_availability` / `booking_tools` → back to `agent` (loop)

---

## Getting Started

### Prerequisites

- Python 3.11+ and `uv` installed
- API keys for: **Composio**, **Google AI Studio**, **LangSmith**, **Mistral AI**
- A Google Cloud project with Calendar, Gmail, and Sheets APIs enabled
- A Facebook Page and Meta Developer App

### Setup

1. **Clone the repository:**

   ```bash
   git clone https://github.com/your-org/hashim-car-rentals.git
   cd hashim-car-rentals
   ```

2. **Configure environment:**

   ```bash
   cp .env.example .env
   ```

   Fill in all required API keys and tokens in `.env`.

3. **Authenticate Google services via Composio:**

   ```bash
   composio add googlecalendar gmail
   composio triggers enable GMAIL_NEW_GMAIL_MESSAGE
   ```

4. **Install dependencies and launch:**

   ```bash
   uv sync
   uv run langgraph dev
   ```

   The LangGraph API server will be available at `http://localhost:8123`.

5. **Open LangGraph Studio:**

   [http://localhost:8123](http://localhost:8123)

### Development Workflow

```bash
# Stop the server (Ctrl+C), edit source code in src/, then restart:
uv run langgraph dev
```

---

## Deploy to Render

The backend is a Dockerized FastAPI service. `render.yaml` contains the
Blueprint (service definition); env var *values* are set in the Render
dashboard, not committed.

### Required environment variables

| Variable | Description |
|----------|-------------|
| `TAVILY_API_KEY`, `OPENAI_API_KEY`, `GOOGLE_API_KEY` | LLM / search keys |
| `LANGCHAIN_API_KEY`, `LANGCHAIN_TRACING_V2`, `LANGCHAIN_PROJECT`, `LANGSMITH_API_KEY` | LangSmith tracing |
| `COMPOSIO_API_KEY` | Composio (Calendar/Gmail tools) |
| `GOOGLE_SHEET_ID` | Google Sheets spreadsheet id |
| `GOOGLE_CREDENTIALS_JSON` | **Full JSON content of `credentials.json`** (single line). Used instead of the local file on Render |
| `FB_VERIFY_TOKEN` | Facebook webhook verify token |
| `FB_PAGE_ACCESS_TOKEN` | Facebook page access token |
| `FB_APP_SECRET` | Facebook app secret |
| `CRON_SECRET` | Optional; protects `POST /tasks/followups` (manual trigger of the follow-up check) |

### Deploy steps

1. Push the repo to GitHub.
2. In Render: **New + → Blueprint** → select the repo (uses `render.yaml`),
   or **New + → Web Service** with runtime *Docker* and `dockerfilePath: ./Dockerfile`.
3. Set all env vars above in the service's **Environment** tab
   (`GOOGLE_CREDENTIALS_JSON` = content of your `credentials.json` on one line).
4. Health check path: `/health`.
5. Deploy. The service gets an HTTPS URL, e.g. `https://car-agent-backend.onrender.com`.

### Connect Facebook Messenger

Set the webhook callback in your Meta App to:

```
https://<YOUR-SERVICE>.onrender.com/facebook/webhook
```

with the verify token = `FB_VERIFY_TOKEN`.

### Point the admin frontend at the backend

```bash
# admin/.env.local
NEXT_PUBLIC_API_URL=https://<YOUR-SERVICE>.onrender.com
```

### Follow-ups

The follow-up loop runs in-process every 15 minutes and persists state in the
**FollowUps** tab of Google Sheets, so redeploys/restarts don't lose tracked
conversations. Note: on Render's free/Starter tiers instances idle out when
inactive; use a paid plan (or a manual `POST /tasks/followups?token=...`)
for reliable delivery timing.

---

## Project Structure

```
.
├── assets/                          # Demo GIF and media
├── langgraph.json                   # LangGraph project config
├── Makefile                         # Dev tasks (lint, test, format)
├── pyproject.toml                   # Project metadata & dependencies
├── .env.example                     # Environment variable template
├── src/
│   ├── server.py                    # FastAPI webhook server (Facebook Messenger)
│   ├── booking_agent/           # Primary: car rental booking agent
│   │   ├── graph.py                 # StateGraph definition
│   │   ├── state.py                 # State schema
│   │   ├── configuration.py         # Configurable parameters
│   │   ├── prompts.py               # System prompt (Sam, Hashim Car Rentals)
│   │   ├── utils.py                 # Helpers (message extraction, model loading)
│   │   ├── nodes/
│   │   │   ├── generate_response.py # LLM response generation
│   │   │   ├── find_slots.py        # Google Calendar free-slot lookup
│   │   │   └── _tools.py            # Tool binding & ToolNode
│   │   └── tools/
│   │       ├── get_available_cars.py
│   │       ├── check_car_availability.py
│   │       ├── save_booking.py
│   │       └── mark_car_unavailable.py

├── tests/
│   ├── unit_tests/
│   └── integration_tests/
│       ├── test_graph.py
│       └── cassettes/               # VCR recordings
└── prototypes/
    └── scheduling_agent.ipynb       # Early exploration notebook
```

---

## License

Commercial License. See [LICENSE](LICENSE) for details.

Copyright &copy; 2024 Panaversity.
