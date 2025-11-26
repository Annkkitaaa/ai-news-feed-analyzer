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

## Usage

### First Time Setup

1. **Open the frontend** at http://localhost:3000
2. **Register a new account** with your email and password
3. **Set up your interests** in your profile settings
4. **Fetch news manually** or wait for automatic hourly updates
5. **Browse your personalized feed**

### Test Account

For testing purposes, a test account has been created:
- **Email**: `test@example.com`
- **Password**: `testpassword123`

### API Endpoints

#### Authentication
- `POST /api/v1/register` - Register new user
- `POST /api/v1/login` - Login and get JWT token
- `GET /api/v1/me` - Get current user info
- `PUT /api/v1/me` - Update user profile

#### News
- `GET /api/v1/news/` - List all news (with filters, search, pagination)
- `GET /api/v1/news/{id}` - Get specific article
- `GET /api/v1/news/{id}/summary` - Get article summary
- `GET /api/v1/news/personalized/feed` - Get personalized news feed
- `GET /api/v1/news/trending/feed` - Get trending articles
- `GET /api/v1/news/digest` - Generate personalized digest
- `POST /api/v1/news/fetch` - Manually trigger news fetch
- `GET /api/v1/news/categories/list` - List all categories

#### Profiles & Subscriptions
- `GET /api/v1/profiles/interests` - Get user interests
- `POST /api/v1/profiles/interests` - Add interests
- `GET /api/v1/subscriptions/` - Get subscription settings
- `PUT /api/v1/subscriptions/` - Update email digest preferences

## Configuration

### News Sources

Edit the `RSS_SOURCES` in `backend/.env` to add more RSS feeds:

```env
RSS_SOURCES=https://news.ycombinator.com/rss,https://feeds.arstechnica.com/arstechnica/index,https://www.theverge.com/rss/index.xml
```

### Recommended Open RSS Feeds

These feeds work without authentication or paywalls:
- **Hacker News**: `https://news.ycombinator.com/rss`
- **Ars Technica**: `https://feeds.arstechnica.com/arstechnica/index`
- **The Verge**: `https://www.theverge.com/rss/index.xml`
- **TechCrunch**: `https://techcrunch.com/feed/`
- **Reddit**: `https://www.reddit.com/r/technology/.rss`
- **GitHub Trending**: `https://mshibanami.github.io/GitHubTrendingRSS/daily/all.xml`

### News API Integration

1. Get a free API key from [NewsAPI.org](https://newsapi.org/)
2. Add to `backend/.env`:
```env
NEWS_API_KEY=your-api-key-here
```

### Background Tasks

The system automatically runs these scheduled tasks:
- **News Fetching**: Every hour (configurable)
- **Daily Digests**: 8 AM UTC
- **Weekly Digests**: Mondays at 8 AM UTC
- **Old News Cleanup**: 3 AM UTC (keeps last 30 days)

To run Celery workers manually:
```bash
cd backend

# Start Celery worker
celery -A celery_worker worker --loglevel=info

# Start Celery beat (scheduler)
celery -A celery_worker beat --loglevel=info
```

## Testing

### Manual Testing

1. **Health Check:**
```bash
curl http://localhost:8000/health
```

2. **Register User:**
```bash
curl -X POST "http://localhost:8000/api/v1/register" \
  -H "Content-Type: application/json" \
  -d '{"email":"user@example.com","password":"password123"}'
```

3. **Login:**
```bash
curl -X POST "http://localhost:8000/api/v1/login" \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "username=user@example.com&password=password123"
```

4. **Fetch News (with auth token):**
```bash
curl -X POST "http://localhost:8000/api/v1/news/fetch" \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

### Running Tests

```bash
cd backend
pytest
```

## Known Issues & Limitations

### News Source Restrictions

Many premium news websites (CNN, NYT, WSJ, etc.) block web scraping with 403/401 errors. This is expected behavior. Recommendations:

1. **Use RSS feeds** from open sources (see Configuration section)
2. **Use News APIs** with valid API keys
3. **Configure proxy services** for enterprise deployments
4. **Stick to open/free sources** for development

### AI Model Warnings

The application may show warnings about:
- TensorFlow operations
- Transformers module compatibility
- Model parameter offloading

These are informational and don't affect functionality. The system includes fallbacks for all AI features.

### Windows Encoding

On Windows, ensure your terminal supports UTF-8 encoding to avoid display issues with special characters.

## Troubleshooting

### Backend won't start

**Missing dependencies:**
```bash
cd backend
pip install pymongo redis celery feedparser newspaper3k lxml_html_clean
```

**Database errors:**
- Delete `backend/newsfeed.db` and restart to recreate
- Check `DATABASE_URL` in `.env`

### Frontend won't start

**Missing dependencies:**
```bash
cd frontend
rm -rf node_modules package-lock.json
npm install
```

**API connection errors:**
- Check `REACT_APP_API_URL` in `frontend/.env`
- Ensure backend is running on port 8000
- Check CORS settings in `backend/.env`

### No news appearing

1. **Manually trigger fetch:**
   - Login to the app
   - Use the fetch button in the UI
   - Or call: `POST /api/v1/news/fetch`

2. **Check backend logs** for errors
3. **Verify RSS feeds** are accessible
4. **Check News API key** if using NewsAPI

### News fetch returns 403 errors

This is normal for many news sites. Solutions:
- Use open RSS feeds (see Configuration)
- Get API keys from news providers
- Configure different news sources

## Project Structure

```
ai-news-feed-analyzer/
