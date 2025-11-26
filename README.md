# AI News Feed Analyzer

An intelligent news aggregation and personalization platform powered by AI and NLP technologies. This full-stack application collects news from multiple sources, analyzes content using machine learning, and delivers personalized news feeds tailored to user interests.

## Features

### Core Functionality
- **Multi-Source News Aggregation**: Fetches news from RSS feeds, News APIs, and web scraping
- **AI-Powered Analysis**: Uses NLP and machine learning for:
  - Automatic article categorization
  - Content summarization (BART, T5 models)
  - Semantic similarity matching
  - Trending topic identification
- **Personalized News Feeds**: Delivers relevant articles based on user interests
- **Automated Email Digests**: Daily, weekly, or custom interval news summaries
- **User Management**: JWT-based authentication with profile customization
- **Reading History**: Track engagement and reading patterns

### Technical Features
- RESTful API with comprehensive endpoints
- Async operations for efficient I/O handling
- Background task processing with Celery
- Responsive React frontend with modern UI
- Multi-database architecture (PostgreSQL/SQLite + MongoDB)
- Graceful AI model fallbacks for reliability

## Architecture

### Tech Stack

**Backend:**
- FastAPI 0.95+ (async Python web framework)
- SQLAlchemy 2.0+ (ORM)
- PostgreSQL/SQLite (relational data)
- MongoDB (optional, for flexible content storage)
- Redis (caching & message broker)
- Celery 5.2+ (background tasks)

**AI/ML:**
- Transformers (HuggingFace models)
- Sentence-Transformers (semantic embeddings)
- LangChain 0.0.173+ (LLM orchestration)
- PyTorch (deep learning)
- PEFT (parameter-efficient fine-tuning)

**News Aggregation:**
- Feedparser 6.0+ (RSS parsing)
- Newspaper3k 0.2.8+ (article extraction)
- BeautifulSoup4 (HTML parsing)
- Scrapy 2.8+ (web scraping)
- Selenium 4.9+ (browser automation)

**Frontend:**
- React 18.2+
- React Router 6.10+ (routing)
- Zustand 4.3+ (state management)
- Tailwind CSS 3.3+ (styling)
- Chart.js (data visualization)
- Axios 1.3+ (HTTP client)

## Installation

### Prerequisites
- Python 3.12+
- Node.js 20+
- npm 11+
- Git

### Backend Setup

1. **Clone the repository:**
```bash
git clone <repository-url>
cd ai-news-feed-analyzer
```

2. **Install Python dependencies:**
```bash
cd backend
pip install -r requirements.txt
```

3. **Configure environment variables:**

Create or edit `backend/.env`:
```env
# Base Settings
PROJECT_NAME=NewsFlow
API_V1_STR=/api/v1
SECRET_KEY=your-secret-key-here
ACCESS_TOKEN_EXPIRE_MINUTES=11520

# CORS
BACKEND_CORS_ORIGINS=http://localhost:3000,http://localhost:8000

# Database - SQLite (development)
DATABASE_URL=sqlite:///./newsfeed.db

# Database - PostgreSQL (production)
# DATABASE_URL=postgresql://user:password@localhost:5432/news_feed

# MongoDB (optional)
# MONGODB_URL=mongodb://localhost:27017/newsfeed

# Email Settings (optional)
EMAILS_ENABLED=False
SMTP_TLS=True
SMTP_PORT=587
SMTP_HOST=smtp.gmail.com
SMTP_USER=your-email@gmail.com
SMTP_PASSWORD=your-password
EMAILS_FROM_EMAIL=noreply@newsflow.com
EMAILS_FROM_NAME=NewsFlow

# LLM Settings
LLM_TYPE=huggingface
LLM_MODEL_ID=TinyLlama/TinyLlama-1.1B-Chat-v1.0
LLM_API_KEY=

# News API Settings
NEWS_API_KEY=your-newsapi-key
NEWS_UPDATE_INTERVAL_MINUTES=60
RSS_SOURCES=https://news.ycombinator.com/rss,https://rss.nytimes.com/services/xml/rss/nyt/Technology.xml
```

4. **Initialize the database:**
```bash
# Database tables are automatically created on first run
python main.py
```

### Frontend Setup

1. **Install Node.js dependencies:**
```bash
cd frontend
npm install
```

2. **Configure environment variables:**

Create or edit `frontend/.env`:
```env
REACT_APP_API_URL=http://localhost:8000/api/v1
```

## Running the Application

### Development Mode

**Option 1: Run Backend and Frontend Separately**

Terminal 1 - Backend:
```bash
cd backend
python main.py
```

Terminal 2 - Frontend:
```bash
cd frontend
npm start
```

**Option 2: Using Docker Compose (Production)**

```bash
docker-compose up --build
```

### Access Points

- **Frontend UI**: http://localhost:3000
- **Backend API**: http://localhost:8000
- **API Documentation**: http://localhost:8000/docs
- **Alternative API Docs**: http://localhost:8000/redoc

