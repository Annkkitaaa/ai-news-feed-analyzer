import logging
import re
from typing import List, Dict, Any, Optional, Tuple
from datetime import datetime, timedelta
import numpy as np
from sqlalchemy.orm import Session

from app.db.models import News, Category, Interest, User
from app.core.config import settings

# Set up logging
logger = logging.getLogger(__name__)

class NewsSummarizer:
    def __init__(self, db: Session):
        self.db = db
        
        # Initialize LLM based on settings
        self.llm = self._initialize_llm()

    def _initialize_llm(self):
        """Initialize a lightweight LLM for summarization."""
        try:
            # Try to use a Hugging Face model
            from transformers import pipeline, AutoModelForCausalLM, AutoTokenizer

            try:
                # Try to load a small model suitable for summarization
                model_id = "facebook/bart-large-cnn"  # A good model for summarization
                
                pipe = pipeline(
                    "summarization",
                    model=model_id,
                    device_map="auto"
                )
                logger.info(f"Successfully loaded summarization model: {model_id}")
                
                # Simple wrapper class
                class SummarizerWrapper:
                    def __init__(self, pipeline):
                        self.pipeline = pipeline
                    
                    def __call__(self, text, **kwargs):
                        try:
                            max_length = kwargs.get("max_length", 150)
                            min_length = kwargs.get("min_length", 30)
                            
                            # Facebook BART models expect direct text, not prompts
                            # Extract just the content if it seems to be a prompt
                            content_match = re.search(r"Content:(.*?)Summary:", text, re.DOTALL)
                            if content_match:
                                text = content_match.group(1).strip()
                            
                            result = self.pipeline(text, max_length=max_length, min_length=min_length, do_sample=False)
                            return result[0]['summary_text']
                        except Exception as e:
                            logger.error(f"Error in summarization: {e}")
                            return "Summary unavailable."
                
                return SummarizerWrapper(pipe)
                
            except Exception as e:
                logger.error(f"Error loading BART summarization model: {e}")
                
                # Try with T5 - another good summarization model
                try:
                    model_id = "t5-small"  # Smaller summarization model
                    pipe = pipeline(
                        "summarization",
                        model=model_id,
                        device_map="auto"
                    )
                    logger.info(f"Successfully loaded T5 model: {model_id}")
                    
                    class T5Wrapper:
                        def __init__(self, pipeline):
                            self.pipeline = pipeline
                        
                        def __call__(self, text, **kwargs):
                            try:
                                # For T5, we format differently
                                if not text.startswith("summarize:"):
                                    # Extract just the content if it seems to be a prompt
                                    content_match = re.search(r"Content:(.*?)Summary:", text, re.DOTALL)
                                    if content_match:
                                        text = "summarize: " + content_match.group(1).strip()
                                    else:
                                        text = "summarize: " + text
                                
                                max_length = kwargs.get("max_length", 150)
                                min_length = kwargs.get("min_length", 30)
                                
                                result = self.pipeline(text, max_length=max_length, min_length=min_length, do_sample=False)
                                return result[0]['summary_text']
                            except Exception as e:
                                logger.error(f"Error in T5 summarization: {e}")
                                return "Summary unavailable."
                    
                    return T5Wrapper(pipe)
                
                except Exception as t5_error:
                    logger.error(f"Error loading T5 model: {t5_error}")
            
            # Final fallback - extractive summarizer
            class ExtractiveWrapper:
                def __init__(self):
                    pass
                
                def __call__(self, text, **kwargs):
                    return self.extract_simple_summary(text)
                
                def extract_simple_summary(self, text, max_sentences=5):
                    """Simple extractive summarization."""
                    if not text:
                        return ""
                    
                    # Extract just the content if it's a prompt
                    content_match = re.search(r"Content:(.*?)Summary:", text, re.DOTALL)
                    if content_match:
                        text = content_match.group(1).strip()
                    
                    # Split into sentences
                    sentences = re.split(r'(?<!\w\.\w.)(?<![A-Z][a-z]\.)(?<=\.|\?)\s', text)
                    
                    # Select first few sentences as summary
                    summary_sentences = sentences[:max_sentences]
                    
                    # Join and clean up
                    summary = ' '.join(summary_sentences).strip()
                    
                    return summary
            
            logger.warning("Using extractive summarization as fallback")
            return ExtractiveWrapper()
        
        except Exception as e:
            logger.error(f"Error initializing any summarization model: {e}")
            
            # Static fallback
            class StaticSummarizer:
                def __call__(self, text, **kwargs):
                    return "Summary not available due to technical limitations."
            
            return StaticSummarizer()

    def models_available(self):
        """Check if the LLM model is available."""
        return self.llm is not None

    def extract_simple_summary(self, text, max_sentences=5):
       """Simple extractive summarization that doesn't use ML models."""
       if not text:
           return ""
       
       # Split into sentences (simple approach)
       sentences = re.split(r'(?<!\w\.\w.)(?<![A-Z][a-z]\.)(?<=\.|\?)\s', text)
       
       # Keep first few sentences as summary (simple but effective for news)
       summary_sentences = sentences[:max_sentences]
       
       # Join and clean up
       summary = ' '.join(summary_sentences).strip()
       
       return summary
    
    def summarize_article(self, news_id: str, verbose: bool = False) -> str:
        """Generate a concise summary for a news article."""
        news = self.db.query(News).filter(News.id == news_id).first()
        if not news:
            return ""
        
        # If we already have a summary, return it unless we're forcing verbose
        if news.summary and len(news.summary) > 100 and not verbose:
            return news.summary
        
        # Prepare the content for summarization
        content = news.content if news.content else ""
        if len(content) > 10000:
            content = content[:10000]  # Limit content length
            
        # If no content, return title
        if not content:
            return news.title
            
        # If LLM not available or content is too short, use extractive summarization
        if not self.llm or len(content) < 300:
            summary = self.extract_simple_summary(content)
            if not news.summary:
                news.summary = summary
                self.db.commit()
            return summary
        
        try:
            # Use the LLM directly
            summary = self.llm(content, max_length=150, min_length=50)
            
            # Clean up the summary
            summary = summary.strip()
            
            # Update the article with the summary if not verbose
            if not verbose and summary:
                news.summary = summary
                self.db.commit()
            
            return summary
        except Exception as e:
            logger.error(f"Error summarizing article {news_id}: {e}")
            # Fallback to extractive summary
            summary = self.extract_simple_summary(content)
            if not news.summary:
                news.summary = summary
                self.db.commit()
            return summary

    def generate_user_digest(self, user_id: str, timeframe: str = "daily") -> Dict[str, Any]:
        """Generate a personalized news digest for a user."""
        logger.info(f"Generating {timeframe} digest for user {user_id}")
        
        user = self.db.query(User).filter(User.id == user_id).first()
        if not user:
            return {"error": "User not found"}
        
        # Determine date range based on timeframe
        now = datetime.utcnow()
        if timeframe == "daily":
            start_date = now - timedelta(days=1)
        elif timeframe == "weekly":
            start_date = now - timedelta(days=7)
        else:
            start_date = now - timedelta(days=1)  # Default to daily
        
        # Get user interests
        interest_ids = [interest.id for interest in user.interests]
        
        # Get news articles from the specified timeframe
        query = self.db.query(News).filter(News.published_at >= start_date)
        
        # If the user has interests, prioritize articles matching their interests
        if interest_ids:
            # This query assumes relevance_scores is a JSON field with interest IDs as keys
            # We'll order by published date if no interests match
            news_items = query.order_by(News.published_at.desc()).limit(20).all()
            
            # Filter and sort by relevance to user interests (done in Python for flexibility)
            scored_news = []
            for news in news_items:
                if not news.relevance_scores:
                    scored_news.append((news, 0))
                    continue
                
                # Calculate average relevance to user's interests
                relevance_sum = 0
                matches = 0
                for interest_id in interest_ids:
                    if str(interest_id) in news.relevance_scores:
                        relevance_sum += news.relevance_scores[str(interest_id)]
                        matches += 1
                
                avg_relevance = relevance_sum / matches if matches > 0 else 0
                scored_news.append((news, avg_relevance))
            
            # Sort by relevance score (highest first)
            scored_news.sort(key=lambda x: x[1], reverse=True)
            top_news = [item[0] for item in scored_news[:10]]
        else:
            # If no interests, just get recent news
            top_news = query.order_by(News.published_at.desc()).limit(10).all()
        
        # Ensure all articles have summaries
        for news in top_news:
            if not news.summary or len(news.summary) < 50:
                try:
                    self.summarize_article(str(news.id))
                except Exception as e:
                    logger.error(f"Error summarizing article for digest: {e}")
        
        # Group articles by category
        category_news = {}
        for news in top_news:
            for category in news.categories:
                if category.name not in category_news:
                    category_news[category.name] = []
                category_news[category.name].append(news)
        
        # Create category summaries (simple for now)
        category_summaries = {}
        for category, news_list in category_news.items():
            if news_list:
                category_summaries[category] = f"Top {len(news_list)} {category} stories from {timeframe} digest."
        
        # Create the final digest
        digest = {
            "user_id": str(user_id),
            "timestamp": datetime.utcnow().isoformat(),
            "timeframe": timeframe,
            "categories": category_summaries,
            "top_stories": [
                {
                    "id": str(news.id),
                    "title": news.title,
                    "summary": news.summary,
                    "url": news.url,
                    "source": news.source.name if news.source else "Unknown",
                    "published_at": news.published_at.isoformat() if news.published_at else None,
                    "categories": [cat.name for cat in news.categories]
                }
                for news in top_news
            ]
        }
        
        return digest