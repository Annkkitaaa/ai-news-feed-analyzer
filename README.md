# AI News Feed Analyzer

An intelligent news aggregation and personalization platform powered by AI. Collects news from RSS feeds and APIs, summarizes articles using open-source LLMs via Groq, and delivers personalized feeds based on user interests.

## Features

- **Multi-Source News Aggregation** — RSS feeds, NewsAPI, and web scraping
- **AI Summarization** — Llama 3.1 8B via Groq API (free, fast, open-source model)
- **Semantic Article Categorization** — ONNX-based embeddings (fastembed, no PyTorch required)
- **Personalized Feed** — Articles ranked by relevance to your interests
- **Trend Analysis** — AI-generated summaries of what's happening across categories
- **Email Digests** — Daily/weekly personalized newsletters via Celery background tasks
- **Reading History & Analytics** — Track what you've read
- **JWT Authentication** — Secure login and session management

## Tech Stack

| Layer | Technology |
|---|---|
| Backend | FastAPI 0.100+, SQLAlchemy 2.0+, SQLite |
| AI Summarization | [Groq API](https://console.groq.com) — Llama 3.1 8B Instant |
| Embeddings | fastembed (BAAI/bge-small-en-v1.5, ONNX, ~130 MB) |
| News Aggregation | feedparser, newspaper4k, BeautifulSoup4 |
| Background Tasks | Celery 5.2+ + Redis |
| Frontend | React 18, Zustand, Tailwind CSS, Chart.js |
| Auth | JWT (python-jose + passlib) |

## Quick Start

### Prerequisites

- Python 3.12+
- Node.js 20+
- Redis (for background tasks)

### 1. Get a free Groq API key

Sign up at [console.groq.com](https://console.groq.com) → API Keys → Create API Key.

### 2. Configure the backend

Edit `backend/.env` and add your key:

```env
GROQ_API_KEY=your-groq-api-key-here
```

The full `backend/.env` template (already created):

```env
PROJECT_NAME=News Feed Analyzer
API_V1_STR=/api/v1
SECRET_KEY=change-this-to-a-real-secret-key
DATABASE_URL=sqlite:///./newsfeed.db

# Groq — open-source Llama model via API
GROQ_API_KEY=your-groq-api-key-here
GROQ_MODEL=llama-3.1-8b-instant

# Optional: free key from https://newsapi.org
NEWS_API_KEY=

# RSS sources (comma-separated)
RSS_SOURCES=https://feeds.feedburner.com/TechCrunch,https://rss.cnn.com/rss/edition.rss,https://feeds.bbci.co.uk/news/rss.xml

# Celery / Redis
REDIS_HOST=localhost
REDIS_PORT=6379

# Email digests (optional)
EMAILS_ENABLED=False
```

### 3. Install and run

**Terminal 1 — Backend:**
```bash
cd backend
pip install -r requirements.txt
python main.py
```

**Terminal 2 — Frontend:**
```bash
cd frontend
npm install
npm start
```

**Terminal 3 — Celery worker** (for background news fetching):
```bash
cd backend
celery -A celery_worker worker --loglevel=info
```

**Terminal 4 — Celery beat** (scheduler):
```bash
cd backend
celery -A celery_worker beat --loglevel=info
```

### 4. Open the app

| URL | Description |
|---|---|
| http://localhost:3000 | Frontend UI |
| http://localhost:8000 | Backend API |
| http://localhost:8000/docs | Interactive API docs (Swagger) |

## First Time Setup

1. Open http://localhost:3000 and register an account
2. Go to Profile → add your interests (Technology, Business, etc.)
3. Click **Fetch News** to pull the first batch of articles
4. Browse your personalized feed

**Test account** (pre-seeded): `test@example.com` / `testpassword123`

## API Reference

### Authentication
| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/api/v1/register` | Register new user |
| `POST` | `/api/v1/login` | Login, returns JWT token |
| `GET` | `/api/v1/me` | Get current user |

### News
| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/v1/news/` | List articles (filter, search, paginate) |
| `GET` | `/api/v1/news/{id}` | Article detail |
| `GET` | `/api/v1/news/{id}/summary` | AI-generated summary (Groq) |
| `GET` | `/api/v1/news/personalized/feed` | Feed ranked by your interests |
| `GET` | `/api/v1/news/trending/feed` | Trending articles |
| `GET` | `/api/v1/news/digest` | Personalized digest |
| `GET` | `/api/v1/news/trends/analysis` | AI trend analysis (Groq) |
| `POST` | `/api/v1/news/fetch` | Manually trigger news fetch |
| `GET` | `/api/v1/news/categories/list` | All categories |

### Profiles & Subscriptions
| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/v1/profiles/me` | Profile with interests |
| `GET/POST` | `/api/v1/profiles/interests` | Manage interests |
| `GET` | `/api/v1/profiles/read-history` | Reading history |
| `GET` | `/api/v1/subscriptions/status` | Email digest settings |
| `POST` | `/api/v1/subscriptions/subscribe` | Subscribe to digests |

## Adding News Sources

Edit `RSS_SOURCES` in `backend/.env`. Some reliable open feeds:

```env
RSS_SOURCES=https://news.ycombinator.com/rss,https://feeds.arstechnica.com/arstechnica/index,https://www.theverge.com/rss/index.xml,https://feeds.feedburner.com/TechCrunch,https://feeds.bbci.co.uk/news/rss.xml,https://www.reddit.com/r/technology/.rss
```

For NewsAPI (broader coverage), get a free key at [newsapi.org](https://newsapi.org) and set `NEWS_API_KEY`.

## Background Tasks (Celery)

| Task | Schedule |
|---|---|
| Fetch news from all sources | Every hour |
| Send daily digests | 8 AM UTC |
| Send weekly digests | Mondays 8 AM UTC |
| Clean articles older than 30 days | 3 AM UTC |

## Docker Compose

```bash
docker-compose up --build
```

This starts: backend, frontend, Celery worker, Celery beat, Redis.

> **Note:** Update `GROQ_API_KEY` in `docker-compose.yml` or pass it as an environment variable before running.

## Troubleshooting

### Backend won't start
```bash
cd backend
pip install -r requirements.txt
```
If the database is corrupted, delete `backend/newsfeed.db` — it will be recreated on restart.

### No news appearing
- Click **Fetch News** in the UI, or call `POST /api/v1/news/fetch` with your token
- Check that RSS sources in `backend/.env` are accessible

### 403 errors in logs from NYT/CNN
Expected — these sites block scrapers. The app handles this gracefully and still saves the RSS entry title and description. Use open feeds (Hacker News, BBC, Ars Technica, The Verge) for full content.

### fastembed symlink warning on Windows
Cosmetic only. To suppress, enable Windows Developer Mode or run Python as administrator.

### Frontend won't connect to backend
- Confirm backend is running on port 8000
- Check `REACT_APP_API_URL=http://localhost:8000/api/v1` in `frontend/.env`
- Check `BACKEND_CORS_ORIGINS` in `backend/.env` includes `http://localhost:3000`
