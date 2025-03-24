import logging
import re
from typing import List, Dict, Any, Optional, Tuple
from datetime import datetime, timedelta
import numpy as np
from sqlalchemy.orm import Session

from app.db.models import News, Category, Interest, User
from app.core.config import settings

# LLM imports
from langchain.chains import LLMChain
from langchain_community.llms import HuggingFacePipeline, OpenAI
from langchain.prompts import PromptTemplate
from langchain.text_splitter import RecursiveCharacterTextSplitter
from langchain.chains.summarize import load_summarize_chain
from transformers import pipeline

# Set up logging
logger = logging.getLogger(__name__)

class NewsSummarizer:
    def __init__(self, db: Session):
        self.db = db
        
        # Initialize LLM based on settings
        self.llm = self._initialize_llm()
        
        # Text splitter for chunking
        self.text_splitter = RecursiveCharacterTextSplitter(
            chunk_size=1000,
            chunk_overlap=200,
            length_function=len,
        )

    def _initialize_llm(self):
        """Initialize the right LLM based on settings."""
        if settings.LLM_TYPE == "openai" and settings.LLM_API_KEY:
            try:
                return OpenAI(
                    temperature=0.1,
                    model_name="gpt-3.5-turbo-instruct",
                    openai_api_key=settings.LLM_API_KEY
                )
            except Exception as e:
                logger.error(f"Error initializing OpenAI model: {e}")
        
        # Default to huggingface
        try:
            # Use a tiny model that requires minimal resources
            model_id = "distilgpt2"  # Default to smaller model
            
            # Try with smaller configuration
            try:
                pipe = pipeline(
                    "text-generation",
                    model=model_id,
                    max_length=512,  # Reduced from 1024
                    temperature=0.1,
                    device=-1  # Force CPU usage
                )
                logger.info(f"Successfully loaded model: {model_id}")
                return HuggingFacePipeline(pipeline=pipe)
            except Exception as model_error:
                logger.error(f"Error loading model with default settings: {model_error}")
                
                # Try with minimal configuration
                try:
                    # Use a tiny TinyLlama model
                    model_id = "TinyLlama/TinyLlama-1.1B-Chat-v1.0"
                    pipe = pipeline(
                        "text-generation",
                        model=model_id,
                        max_length=256,
                        temperature=0.1,
                        device=-1  # Force CPU usage
                    )
                    logger.info(f"Successfully loaded fallback model: {model_id}")
                    return HuggingFacePipeline(pipeline=pipe)
                except Exception as tiny_error:
                    logger.error(f"Error loading tiny model: {tiny_error}")
                    
                    # Create a simple mock LLM that doesn't require model loading
                    class MockLLM:
                        def generate(self, prompts, **kwargs):
                            return [{"generated_text": "Unable to generate summary due to model limitations."}]
                    
                    logger.warning("Using mock LLM due to all model loading failures")
                    return HuggingFacePipeline(pipeline=MockLLM())
        except Exception as e:
            logger.error(f"Error initializing HuggingFace model: {e}")
            return None

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
        """Generate a concise summary for a news article using LLM."""
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
            
        # If LLM not available, use extractive summarization
        if not self.llm or not self.models_available():
            summary = self.extract_simple_summary(content)
            if not news.summary:
                news.summary = summary
                self.db.commit()
            return summary
        
        # Create a prompt for summarization
        prompt = PromptTemplate(
            input_variables=["title", "content", "verbose"],
            template="""
            Summarize the following news article in a {verbose} manner.
            Keep the summary objective and factual, covering the main points.
            
            Title: {title}
            
            Content: {content}
            
            Summary:
            """
        )
        
        try:
            # Create and run the chain
            chain = LLMChain(llm=self.llm, prompt=prompt)
            summary = chain.run(
                title=news.title, 
                content=content, 
                verbose="detailed" if verbose else "concise"
            )
            
            # Clean up the summary
            summary = summary.strip()
            
            # Update the article with the summary if not verbose
            if not verbose:
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

    def generate_category_summary(self, category_id: str, days: int = 1) -> str:
        """Generate a summary of recent news in a specific category."""
        if not self.models_available():
            return "Summarization service unavailable."
            
        category = self.db.query(Category).filter(Category.id == category_id).first()
        if not category:
            return "Category not found."
        
        # Get recent articles in this category
        cutoff_date = datetime.utcnow().replace(hour=0, minute=0, second=0, microsecond=0)
        news_items = (self.db.query(News)
                      .join(News.categories)
                      .filter(Category.id == category_id)
                      .filter(News.published_at >= cutoff_date)
                      .order_by(News.published_at.desc())
                      .limit(10)
                      .all())
        
        if not news_items:
            return f"No recent news in the {category.name} category."
        
        # Create summaries for each article if needed
        for news in news_items:
            if not news.summary or len(news.summary) < 100:
                self.summarize_article(str(news.id))
        
        # If LLM not available, just list the articles
        if not self.llm or not self.models_available():
            summary = f"Recent {category.name} news includes: "
            titles = [news.title for news in news_items[:5]]
            return summary + "; ".join(titles) + "."
        
        # Compile article information
        articles_text = ""
        for i, news in enumerate(news_items):
            articles_text += f"Article {i+1}: {news.title}\n"
            articles_text += f"Summary: {news.summary}\n\n"
        
        # Create a prompt for the category summary
        prompt = PromptTemplate(
            input_variables=["category", "articles"],
            template="""
            Based on these recent news articles in the category of {category}, 
            provide a concise summary (about 3-4 sentences) of the key trends, 
            developments, or important stories in this area:
            
            {articles}
            
            Summary of {category} news:
            """
        )
        
        try:
            chain = LLMChain(llm=self.llm, prompt=prompt)
            summary = chain.run(category=category.name, articles=articles_text)
            return summary.strip()
        except Exception as e:
            logger.error(f"Error generating category summary for {category.name}: {e}")
            return f"Recent news in {category.name}"

    def generate_user_digest(self, user_id: str, timeframe: str = "daily") -> Dict[str, Any]:
        """Generate a personalized news digest for a user."""
        user = self.db.query(User).filter(User.id == user_id).first()
        if not user:
            return {"error": "User not found"}
        
        # If LLM not available, generate a simple digest
        if not self.llm or not self.models_available():
            return self.generate_simple_digest(user_id, timeframe)
        
        # Get user's interests
        user_interests = user.interests
        if not user_interests:
            return self.generate_simple_digest(user_id, timeframe)
        
        # Determine time range based on timeframe
        cutoff_date = datetime.utcnow().replace(hour=0, minute=0, second=0, microsecond=0)
        if timeframe == "weekly":
            cutoff_date = cutoff_date - timedelta(days=7)
        
        # Get news matched to user interests
        news_by_interest = {}
        for interest in user_interests:
            # Create a query to find news relevant to this interest
            recent_news = (self.db.query(News)
                          .filter(News.published_at >= cutoff_date)
                          .order_by(News.published_at.desc())
                          .all())
            
            # Filter by relevance score if available
            relevant_news = []
            for news in recent_news:
                if news.relevance_scores and str(interest.id) in news.relevance_scores and news.relevance_scores[str(interest.id)] > 0.5:
                    relevant_news.append(news)
                    
            # If no relevant news with scores, just use latest news
            if not relevant_news:
                relevant_news = (self.db.query(News)
                                .filter(News.published_at >= cutoff_date)
                                .order_by(News.published_at.desc())
                                .limit(5)
                                .all())
            
            if relevant_news:
                news_by_interest[interest.name] = relevant_news[:5]  # Top 5 most relevant
        
        # Create digest content
        digest = {
            "user_id": str(user_id),
            "user_name": f"{user.first_name} {user.last_name}".strip(),
            "timestamp": datetime.utcnow().isoformat(),
            "timeframe": timeframe,
            "interests": {}
        }
        
        # Generate summaries for each interest
        for interest_name, news_list in news_by_interest.items():
            # Ensure all articles have summaries
            for news in news_list:
                if not news.summary or len(news.summary) < 100:
                    self.summarize_article(str(news.id))
            
            # Compile article information
            articles_text = ""
            for i, news in enumerate(news_list):
                articles_text += f"Article {i+1}: {news.title}\n"
                articles_text += f"Summary: {news.summary}\n\n"
            
            # Create a prompt for the interest summary
            prompt = PromptTemplate(
                input_variables=["interest", "articles"],
                template="""
                Based on these recent news articles related to {interest}, 
                provide a concise summary (about 3-4 sentences) of the key developments 
                or important stories in this area:
                
                {articles}
                
                Summary of {interest} news:
                """
            )
            
            try:
                chain = LLMChain(llm=self.llm, prompt=prompt)
                summary = chain.run(interest=interest_name, articles=articles_text)
                
                digest["interests"][interest_name] = {
                    "summary": summary.strip(),
                    "articles": [
                        {
                            "id": str(news.id),
                            "title": news.title,
                            "summary": news.summary,
                            "url": news.url,
                            "source": news.source.name if news.source else "",
                            "published_at": news.published_at.isoformat() if news.published_at else None
                        }
                        for news in news_list
                    ]
                }
            except Exception as e:
                logger.error(f"Error generating interest summary for {interest_name}: {e}")
                digest["interests"][interest_name] = {
                    "summary": f"Recent news related to {interest_name}",
                    "articles": [
                        {
                            "id": str(news.id),
                            "title": news.title,
                            "summary": news.summary,
                            "url": news.url,
                            "source": news.source.name if news.source else "",
                            "published_at": news.published_at.isoformat() if news.published_at else None
                        }
                        for news in news_list
                    ]
                }
        
        return digest
        
    def generate_simple_digest(self, user_id: str, timeframe: str = "daily") -> Dict[str, Any]:
        """Generate a simple digest without using ML models."""
        user = self.db.query(User).filter(User.id == user_id).first()
        if not user:
            return {"error": "User not found"}
        
        # Get recent news (no ML filtering)
        cutoff_date = datetime.utcnow().replace(hour=0, minute=0, second=0, microsecond=0)
        if timeframe == "weekly":
            cutoff_date = cutoff_date - timedelta(days=7)
            
        recent_news = self.db.query(News).filter(News.published_at >= cutoff_date).order_by(News.published_at.desc()).limit(15).all()
        
        # If no recent news, just get latest news without date filter
        if not recent_news:
            recent_news = self.db.query(News).order_by(News.published_at.desc()).limit(15).all()
        
        # Ensure all articles have summaries
        for news in recent_news:
            if not news.summary or len(news.summary) < 50:
                extractive_summary = self.extract_simple_summary(news.content or "")
                if extractive_summary:
                    news.summary = extractive_summary
                    self.db.commit()
        
        # Group by category if available
        news_by_category = {}
        for news in recent_news:
            for category in news.categories:
                if category.name not in news_by_category:
                    news_by_category[category.name] = []
                news_by_category[category.name].append(news)
        
        # Create digest content
        digest = {
            "user_id": str(user_id),
            "user_name": f"{user.first_name} {user.last_name}".strip(),
            "timestamp": datetime.utcnow().isoformat(),
            "timeframe": timeframe,
            "interests": {}
        }
        
        # Add category-based news
        for category, news_list in news_by_category.items():
            digest["interests"][category] = {
                "summary": f"Recent news in {category}",
                "articles": [
                    {
                        "id": str(news.id),
                        "title": news.title,
                        "summary": news.summary or "No summary available",
                        "url": news.url,
                        "source": news.source.name if news.source else "",
                        "published_at": news.published_at.isoformat() if news.published_at else None
                    }
                    for news in news_list[:5]
                ]
            }
        
        # If no categories, add a general section
        if not digest["interests"]:
            digest["interests"]["General News"] = {
                "summary": "Recent top news stories",
                "articles": [
                    {
                        "id": str(news.id),
                        "title": news.title,
                        "summary": news.summary or "No summary available",
                        "url": news.url,
                        "source": news.source.name if news.source else "",
                        "published_at": news.published_at.isoformat() if news.published_at else None
                    }
                    for news in recent_news[:10]
                ]
            }
        
        return digest

    def generate_trend_analysis(self, days: int = 7, category: Optional[str] = None) -> str:
        """Generate an analysis of news trends over time."""
        if not self.llm or not self.models_available():
            return "Trend analysis currently unavailable."
        
        # Get recent news
        try:
            cutoff_date = datetime.utcnow().replace(hour=0, minute=0, second=0, microsecond=0) - timedelta(days=days)
            query = self.db.query(News).filter(News.published_at >= cutoff_date)
            
            # Filter by category if provided
            if category:
                category_obj = self.db.query(Category).filter(Category.name == category).first()
                if category_obj:
                    query = query.join(News.categories).filter(Category.id == category_obj.id)
            
            news_items = query.order_by(News.published_at.desc()).limit(30).all()
            
            if not news_items:
                return "Insufficient data for trend analysis."
            
            # Compile titles and summaries
            news_text = ""
            for i, news in enumerate(news_items[:20]):  # Limit to 20 for manageability
                news_text += f"Article {i+1}: {news.title}\n"
                if news.summary:
                    news_text += f"Summary: {news.summary[:200]}...\n\n"
                else:
                    news_text += f"Published: {news.published_at}\n\n"
            
            # Create a prompt for trend analysis
            category_text = f" in the {category} category" if category else ""
            prompt = PromptTemplate(
                input_variables=["category_text", "news_text", "days"],
                template="""
                Based on these recent news articles{category_text} from the past {days} days, 
                identify 3-5 key trends or patterns. Provide a thoughtful analysis that highlights 
                emerging topics, shifts in focus, or recurring themes. Your analysis should be 
                insightful and concise (about 4-6 sentences).
                
                {news_text}
                
                Trend Analysis:
                """
            )
            
            try:
                chain = LLMChain(llm=self.llm, prompt=prompt)
                analysis = chain.run(
                    category_text=category_text,
                    news_text=news_text,
                    days=days
                )
                
                # Return just the string
                return analysis.strip()
            except Exception as e:
                logger.error(f"Error generating trend analysis: {e}")
                return "Trend analysis currently unavailable due to technical issues."
        except Exception as e:
            logger.error(f"Error retrieving news for trend analysis: {e}")
            return "Unable to retrieve news data for trend analysis."