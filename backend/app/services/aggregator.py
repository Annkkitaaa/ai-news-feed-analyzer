import asyncio
import feedparser
import logging
import requests
from datetime import datetime, timedelta
from typing import List, Dict, Any, Optional
from bs4 import BeautifulSoup
from newspaper import Article
from urllib.parse import urlparse
import hashlib

from sqlalchemy.orm import Session
from app.db.models import News, NewsSource
from app.core.config import settings

# Set up logging
logger = logging.getLogger(__name__)

class NewsAggregator:
    def __init__(self, db: Session):
        self.db = db
        self.scrapegraph_api_key = settings.SCRAPEGRAPH_API_KEY
        self.news_api_key = settings.NEWS_API_KEY

    async def fetch_all_sources(self) -> List[Dict[str, Any]]:
        """Fetch news from all active sources in parallel."""
        sources = self.db.query(NewsSource).filter(NewsSource.is_active == True).all()
        tasks = []
        
        for source in sources:
            if source.source_type == "rss":
                tasks.append(self.fetch_rss(source))
            elif source.source_type == "api":
                tasks.append(self.fetch_api(source))
            elif source.source_type == "scraped":
                tasks.append(self.fetch_scraped(source))
        
        results = await asyncio.gather(*tasks, return_exceptions=True)
        
        # Filter out exceptions and log them
        all_articles = []
        for i, result in enumerate(results):
            if isinstance(result, Exception):
                logger.error(f"Error fetching source {sources[i].name}: {result}")
            else:
                all_articles.extend(result)
        
        return all_articles

    async def fetch_rss(self, source: NewsSource) -> List[Dict[str, Any]]:
        """Fetch news from an RSS feed."""
        try:
            feed = feedparser.parse(source.url)
            articles = []
            
            for entry in feed.entries:
                # Skip if we already have this URL
                if self._url_exists(entry.link):
                    continue
                
                # Parse the date in various formats
                published_date = None
                if hasattr(entry, 'published_parsed') and entry.published_parsed:
                    published_date = datetime(*entry.published_parsed[:6])
                elif hasattr(entry, 'updated_parsed') and entry.updated_parsed:
                    published_date = datetime(*entry.updated_parsed[:6])
                
                # Get the content
                content = ""
                if hasattr(entry, 'content') and entry.content:
                    content = entry.content[0].value
                elif hasattr(entry, 'summary') and entry.summary:
                    content = entry.summary
                
                # Get the author
                author = ""
                if hasattr(entry, 'author') and entry.author:
                    author = entry.author
                
                # Extract full content with newspaper3k if content is too short
                full_content = content
                if len(content) < 500:
                    try:
                        article = Article(entry.link)
                        article.download()
                        article.parse()
                        full_content = article.text
                        
                        # If no content was fetched from the RSS, use the article content
                        if not content:
                            content = full_content
                    except Exception as e:
                        logger.warning(f"Error fetching full content for {entry.link}: {e}")
                
                articles.append({
                    "title": entry.title,
                    "url": entry.link,
                    "content": full_content,
                    "summary": content[:500] + "..." if len(content) > 500 else content,
                    "published_at": published_date,
                    "author": author,
                    "image_url": self._extract_image_url(entry),
                    "source_id": source.id
                })
            
            return articles
        except Exception as e:
            logger.error(f"Error fetching RSS feed {source.url}: {e}")
            return []

    async def fetch_api(self, source: NewsSource) -> List[Dict[str, Any]]:
        """Fetch news from a news API like NewsAPI.org."""
        try:
            # For NewsAPI.org
            if "newsapi.org" in source.url:
                params = {"apiKey": self.news_api_key}
                if source.config and "params" in source.config:
                    params.update(source.config["params"])
                
                response = requests.get(source.url, params=params)
                response.raise_for_status()
                data = response.json()
                
                articles = []
                if "articles" in data:
                    for article_data in data["articles"]:
                        # Skip if we already have this URL
                        if self._url_exists(article_data["url"]):
                            continue
                        
                        # Parse the published date
                        published_date = None
                        if "publishedAt" in article_data and article_data["publishedAt"]:
                            try:
                                published_date = datetime.fromisoformat(article_data["publishedAt"].replace("Z", "+00:00"))
                            except (ValueError, TypeError):
                                pass
                        
                        # Get full content with newspaper3k
                        content = article_data.get("content", "")
                        try:
                            article = Article(article_data["url"])
                            article.download()
                            article.parse()
                            full_content = article.text
                        except Exception as e:
                            logger.warning(f"Error fetching full content for {article_data['url']}: {e}")
                            full_content = content
                        
                        articles.append({
                            "title": article_data.get("title", ""),
                            "url": article_data["url"],
                            "content": full_content,
                            "summary": article_data.get("description", ""),
                            "published_at": published_date,
                            "author": article_data.get("author", ""),
                            "image_url": article_data.get("urlToImage", ""),
                            "source_id": source.id
                        })
                
                return articles
            else:
                # Generic API handling
                params = {}
                if source.config and "params" in source.config:
                    params.update(source.config["params"])
                
                headers = {}
                if source.config and "headers" in source.config:
                    headers.update(source.config["headers"])
                
                response = requests.get(source.url, params=params, headers=headers)
                response.raise_for_status()
                data = response.json()
                
                # Process according to source-specific mappings
                mapper = source.config.get("data_mapping", {})
                articles = []
                
                for item in data.get(mapper.get("items_key", "items"), []):
                    # Skip if we already have this URL
                    url = self._extract_value(item, mapper.get("url", "url"))
                    if self._url_exists(url):
                        continue
                    
                    articles.append({
                        "title": self._extract_value(item, mapper.get("title", "title")),
                        "url": url,
                        "content": self._extract_value(item, mapper.get("content", "content")),
                        "summary": self._extract_value(item, mapper.get("summary", "summary")),
                        "published_at": self._parse_date(self._extract_value(item, mapper.get("published_at", "published_at"))),
                        "author": self._extract_value(item, mapper.get("author", "author")),
                        "image_url": self._extract_value(item, mapper.get("image_url", "image_url")),
                        "source_id": source.id
                    })
                
                return articles
        except Exception as e:
            logger.error(f"Error fetching API {source.url}: {e}")
            return []

    async def fetch_scraped(self, source: NewsSource) -> List[Dict[str, Any]]:
        """Fetch news by scraping a website using ScrapeGraph AI."""
        try:
            # Use ScrapeGraph AI if API key is available
            if self.scrapegraph_api_key:
                headers = {
                    "Authorization": f"Bearer {self.scrapegraph_api_key}",
                    "Content-Type": "application/json"
                }
                
                payload = {
                    "url": source.url,
                    "config": source.config.get("scrape_config", {})
                }
                
                response = requests.post(
                    "https://api.scrapegraph.ai/v1/scrape",
                    headers=headers,
                    json=payload
                )
                response.raise_for_status()
                data = response.json()
                
                articles = []
                for item in data.get("data", []):
                    # Skip if we already have this URL
                    if self._url_exists(item.get("url")):
                        continue
                    
                    # Get full content with newspaper3k if needed
                    content = item.get("content", "")
                    if not content or len(content) < 500:
                        try:
                            article = Article(item.get("url"))
                            article.download()
                            article.parse()
                            content = article.text
                        except Exception as e:
                            logger.warning(f"Error fetching full content for {item.get('url')}: {e}")
                    
                    articles.append({
                        "title": item.get("title", ""),
                        "url": item.get("url", ""),
                        "content": content,
                        "summary": item.get("description", "")[:500] + "..." if item.get("description", "") and len(item.get("description", "")) > 500 else item.get("description", ""),
                        "published_at": self._parse_date(item.get("published_date")),
                        "author": item.get("author", ""),
                        "image_url": item.get("image_url", ""),
                        "source_id": source.id
                    })
                
                return articles
            else:
                # Fallback to regular scraping
                response = requests.get(source.url)
                response.raise_for_status()
                soup = BeautifulSoup(response.content, "html.parser")
                
                articles = []
                selectors = source.config.get("selectors", {})
                article_selector = selectors.get("article", "article")
                
                for article_elem in soup.select(article_selector):
                    try:
                        # Extract URL
                        url_elem = article_elem.select_one(selectors.get("url", "a"))
                        if not url_elem or not url_elem.get("href"):
                            continue
                        
                        url = url_elem.get("href")
                        # Make URL absolute if it's relative
                        if not url.startswith(("http://", "https://")):
                            parsed_source_url = urlparse(source.url)
                            base_url = f"{parsed_source_url.scheme}://{parsed_source_url.netloc}"
                            url = f"{base_url}{url if url.startswith('/') else '/' + url}"
                        
                        # Skip if we already have this URL
                        if self._url_exists(url):
                            continue
                        
                        # Extract title
                        title_elem = article_elem.select_one(selectors.get("title", "h2, h3"))
                        title = title_elem.text.strip() if title_elem else ""
                        
                        # Extract image
                        image_elem = article_elem.select_one(selectors.get("image", "img"))
                        image_url = image_elem.get("src") if image_elem and image_elem.get("src") else ""
                        
                        # Make image URL absolute if it's relative
                        if image_url and not image_url.startswith(("http://", "https://")):
                            parsed_source_url = urlparse(source.url)
                            base_url = f"{parsed_source_url.scheme}://{parsed_source_url.netloc}"
                            image_url = f"{base_url}{image_url if image_url.startswith('/') else '/' + image_url}"
                        
                        # Get full content with newspaper3k
                        try:
                            article = Article(url)
                            article.download()
                            article.parse()
                            content = article.text
                            
                            # Get published date from article
                            published_date = article.publish_date
                            
                            # Get author from article
                            author = article.authors[0] if article.authors else ""
                        except Exception as e:
                            logger.warning(f"Error fetching full content for {url}: {e}")
                            content = ""
                            published_date = None
                            author = ""
                        
                        # Extract summary
                        summary_elem = article_elem.select_one(selectors.get("summary", "p"))
                        summary = summary_elem.text.strip() if summary_elem else ""
                        
                        articles.append({
                            "title": title,
                            "url": url,
                            "content": content,
                            "summary": summary if summary else (content[:500] + "..." if len(content) > 500 else content),
                            "published_at": published_date,
                            "author": author,
                            "image_url": image_url,
                            "source_id": source.id
                        })
                    except Exception as e:
                        logger.warning(f"Error processing article element: {e}")
                
                return articles
        except Exception as e:
            logger.error(f"Error scraping website {source.url}: {e}")
            return []

    def save_articles(self, articles: List[Dict[str, Any]]) -> List[News]:
        """Save fetched articles to the database."""
        saved_articles = []
        
        for article_data in articles:
            try:
                # Check if article already exists by URL
                existing = self.db.query(News).filter(News.url == article_data["url"]).first()
                if existing:
                    continue
                
                article = News(
                    title=article_data["title"],
                    url=article_data["url"],
                    content=article_data["content"],
                    summary=article_data["summary"],
                    published_at=article_data["published_at"],
                    author=article_data["author"],
                    image_url=article_data["image_url"],
                    source_id=article_data["source_id"]
                )
                
                self.db.add(article)
                self.db.commit()
                self.db.refresh(article)
                saved_articles.append(article)
            except Exception as e:
                self.db.rollback()
                logger.error(f"Error saving article {article_data.get('url')}: {e}")
        
        return saved_articles

    def clean_old_news(self, days: int = 30) -> int:
        """Delete news older than specified days."""
        cutoff_date = datetime.utcnow() - timedelta(days=days)
        count = self.db.query(News).filter(News.published_at < cutoff_date).delete()
        self.db.commit()
        return count

    def _url_exists(self, url: str) -> bool:
        """Check if a URL already exists in the database."""
        return self.db.query(News).filter(News.url == url).first() is not None

    def _extract_image_url(self, entry) -> str:
        """Extract image URL from RSS entry."""
        # Check for media:content
        if hasattr(entry, 'media_content') and entry.media_content:
            for media in entry.media_content:
                if 'url' in media and media['url'].lower().endswith(('.jpg', '.jpeg', '.png', '.gif')):
                    return media['url']
        
        # Check for enclosures
        if hasattr(entry, 'enclosures') and entry.enclosures:
            for enclosure in entry.enclosures:
                if 'href' in enclosure and enclosure['href'].lower().endswith(('.jpg', '.jpeg', '.png', '.gif')):
                    return enclosure['href']
                if 'url' in enclosure and enclosure['url'].lower().endswith(('.jpg', '.jpeg', '.png', '.gif')):
                    return enclosure['url']
        
        # Check for content
        if hasattr(entry, 'content') and entry.content:
            for content in entry.content:
                if 'value' in content:
                    soup = BeautifulSoup(content['value'], 'html.parser')
                    img = soup.find('img')
                    if img and img.get('src'):
                        return img.get('src')
        
        # Check for summary
        if hasattr(entry, 'summary') and entry.summary:
            soup = BeautifulSoup(entry.summary, 'html.parser')
            img = soup.find('img')
            if img and img.get('src'):
                return img.get('src')
        
        return ""

    def _extract_value(self, data: Dict[str, Any], key_path: str) -> Any:
        """Extract a value from nested dictionaries using a dot-separated path."""
        keys = key_path.split('.')
        value = data
        
        for key in keys:
            if isinstance(value, dict) and key in value:
                value = value[key]
            else:
                return None
        
        return value

    def _parse_date(self, date_str: Optional[str]) -> Optional[datetime]:
        """Parse a date string in various formats."""
        if not date_str:
            return None
        
        formats = [
            "%Y-%m-%dT%H:%M:%S%z",  # ISO format with timezone
            "%Y-%m-%dT%H:%M:%SZ",   # ISO format with Z
            "%Y-%m-%dT%H:%M:%S",    # ISO format without timezone
            "%Y-%m-%d %H:%M:%S",    # Common format
            "%Y-%m-%d",             # Just date
            "%d %b %Y %H:%M:%S",    # RSS common format
            "%a, %d %b %Y %H:%M:%S %z",  # RFC 822
        ]
        
        for fmt in formats:
            try:
                return datetime.strptime(date_str, fmt)
            except ValueError:
                continue
        
        # If all formats fail, log and return None
        logger.warning(f"Could not parse date: {date_str}")
        return None