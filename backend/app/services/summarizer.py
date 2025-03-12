import logging
from typing import List, Dict, Any, Optional, Tuple
from datetime import datetime
import numpy as np
from sqlalchemy.orm import Session

from app.db.models import News, Category, Interest, User
from app.core.config import settings

# LLM imports
from langchain.chains import LLMChain
from langchain.llms import HuggingFacePipeline, OpenAI
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
        if settings.LLM_TYPE == "openai":
            return OpenAI(
                temperature=0.1,
                model_name="gpt-3.5-turbo-instruct",
                openai_api_key=settings.LLM_API_KEY
            )
        else:  # Default to huggingface
            try:
                # Initialize pipeline for summarization and text generation
                pipe = pipeline(
                    "text-generation",
                    model=settings.LLM_MODEL_ID,
                    max_length=2048,
                    temperature=0.1,
                    top_p=0.95,
                    repetition_penalty=1.15
                )
                
                return HuggingFacePipeline(pipeline=pipe)
            except Exception as e:
                logger.error(f"Error initializing HuggingFace model: {e}")
                # Default to a smaller model as fallback
                try:
                    pipe = pipeline(
                        "text-generation",
                        model="distilgpt2",
                        max_length=1024,
                        temperature=0.1
                    )
                    return HuggingFacePipeline(pipeline=pipe)
                except Exception as e2:
                    logger.error(f"Error initializing fallback model: {e2}")
                    return None

    def summarize_article(self, news_id: str, verbose: bool = False) -> str:
        """Generate a concise summary for a news article using LLM."""
        news = self.db.query(News).filter(News.id == news_id).first()
        if not news or not self.llm:
            return ""
        
        # If we already have a summary, return it unless we're forcing verbose
        if news.summary and len(news.summary) > 100 and not verbose:
            return news.summary
        
        # Prepare the content for summarization
        content = news.content if news.content else ""
        if len(content) > 10000:
            content = content[:10000]  # Limit content length
        
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
            return news.summary if news.summary else ""

    def generate_category_summary(self, category_id: str, days: int = 1) -> str:
        """Generate a summary of recent news in a specific category."""
        if not self.llm:
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
        if not user or not self.llm:
            return {"error": "User not found or summarization service unavailable."}
        
        # Get user's interests
        user_interests = user.interests
        if not user_interests:
            return {"error": "User has no specified interests."}
        
        # Determine time range based on timeframe
        cutoff_date = datetime.utcnow().replace(hour=0, minute=0, second=0, microsecond=0)
        if timeframe == "weekly":
            days_to_subtract = 7
        else:  # Default to daily
            days_to_subtract = 1
        
        # Get news matched to user interests
        news_by_interest = {}
        for interest in user_interests:
            # Create a query to find news relevant to this interest
            recent_news = (self.db.query(News)
                          .filter(News.published_at >= cutoff_date)
                          .order_by(News.published_at.desc())
                          .all())
            
            # Filter by relevance score
            relevant_news = []
            for news in recent_news:
                if not news.relevance_scores:
                    continue
                    
                if str(interest.id) in news.relevance_scores and news.relevance_scores[str(interest.id)] > 0.5:
                    relevant_news.append(news)
            
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

    def generate_trend_analysis(self, days: int = 7, category: Optional[str] = None) -> str:
        """Generate an analysis of news trends over time."""
        if not self.llm:
            return "Trend analysis service unavailable."
        
        # Get recent news
        cutoff_date = datetime.utcnow().replace(hour=0, minute=0, second=0, microsecond=0)
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
            return analysis.strip()
        except Exception as e:
            logger.error(f"Error generating trend analysis: {e}")
            return "Trend analysis currently unavailable."