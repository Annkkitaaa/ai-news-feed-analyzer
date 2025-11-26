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

