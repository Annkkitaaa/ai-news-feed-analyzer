import logging
import re
from typing import List, Dict, Any, Optional, Tuple
from datetime import datetime
import os
import numpy as np
from sqlalchemy.orm import Session
from sqlalchemy import func

from app.db.models import News, Interest, User, Category, news_category
from app.core.config import settings

# LLM and embedding imports
from langchain.chains import LLMChain
from langchain_community.llms import HuggingFacePipeline, OpenAI
from langchain.prompts import PromptTemplate
from langchain_community.embeddings import HuggingFaceEmbeddings
from langchain.text_splitter import RecursiveCharacterTextSplitter
from langchain_community.vectorstores import FAISS
from sentence_transformers import SentenceTransformer
from transformers import pipeline

# Set up logging
logger = logging.getLogger(__name__)

class NewsAnalyzer:
    def __init__(self, db: Session):
        self.db = db
        
        # Initialize LLM based on settings
        self.llm = self._initialize_llm()
        
        # Initialize embedding model
        self.embedding_model = self._initialize_embedding_model()
        
        # Text splitter for chunking
        self.text_splitter = RecursiveCharacterTextSplitter(
            chunk_size=1000,
            chunk_overlap=200,
            length_function=len,
        )
        
        # Cached category embeddings
        self.category_embeddings = None
        self.interest_embeddings = None

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
                # Fall back to HuggingFace
        
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

    def _initialize_embedding_model(self):
        """Initialize the embedding model."""
        try:
            # Use all-MiniLM-L6-v2 for embeddings - good balance of performance and quality
            model_name = "all-MiniLM-L6-v2"
            return HuggingFaceEmbeddings(model_name=model_name)
        except Exception as e:
            logger.error(f"Error initializing embedding model: {e}")
            return None

    # Add a method to check if LLM and embedding models are available
    def models_available(self):
        """Check if both LLM and embedding models are available."""
        return self.llm is not None and self.embedding_model is not None

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

    def categorize_news(self, news_ids: List[str]) -> Dict[str, List[str]]:
        """Categorize news articles into predefined categories."""
        categories = self.db.query(Category).all()
        result_mapping = {}
        
        if not self.embedding_model:
            logger.error("Embedding model not initialized")
            return result_mapping
        
        # Get or create category embeddings
        if not self.category_embeddings:
            self._build_category_embeddings(categories)
        
        # Process each news article
        for news_id in news_ids:
            news = self.db.query(News).filter(News.id == news_id).first()
            if not news:
                continue
            
            # Create document embedding
            doc_content = f"{news.title} {news.summary} {news.content[:5000]}"
            doc_embedding = self.embedding_model.embed_documents([doc_content])[0]
            
            # Find closest matching categories (top 3)
            matches = []
            for cat_id, cat_embedding in self.category_embeddings.items():
                similarity = self._calculate_similarity(doc_embedding, cat_embedding)
                if similarity > 0.6:  # Only consider reasonably good matches
                    matches.append((cat_id, similarity))
            
            # Sort by similarity score (descending)
            matches.sort(key=lambda x: x[1], reverse=True)
            top_matches = matches[:3]
            
            # Associate article with matched categories
            matched_cats = []
            for cat_id, _ in top_matches:
                self.db.execute(
                    news_category.insert().values(
                        news_id=news_id,
                        category_id=cat_id
                    )
                )
                matched_cats.append(cat_id)
            
            result_mapping[news_id] = matched_cats
        
        self.db.commit()
        return result_mapping

    def compute_interest_relevance(self, news_ids: List[str]) -> Dict[str, Dict[str, float]]:
        """Compute relevance scores between news articles and user interests."""
        if not self.embedding_model:
            logger.error("Embedding model not initialized")
            return {}
        
        interests = self.db.query(Interest).all()
        
        # Get or create interest embeddings
        if not self.interest_embeddings:
            self._build_interest_embeddings(interests)
        
        # Process each news article
        result_mapping = {}
        
        for news_id in news_ids:
            news = self.db.query(News).filter(News.id == news_id).first()
            if not news:
                continue
            
            # Create document embedding
            doc_content = f"{news.title} {news.summary} {news.content[:5000]}"
            doc_embedding = self.embedding_model.embed_documents([doc_content])[0]
            
            # Calculate similarity to each interest
            relevance_scores = {}
            for interest in interests:
                if interest.id in self.interest_embeddings:
                    similarity = self._calculate_similarity(
                        doc_embedding, 
                        self.interest_embeddings[interest.id]
                    )
                    relevance_scores[str(interest.id)] = float(similarity)
            
            # Update the news article with relevance scores
            news.relevance_scores = relevance_scores
            result_mapping[str(news_id)] = relevance_scores
        
        self.db.commit()
        return result_mapping

    def get_personalized_news(self, user_id: str, limit: int = 10) -> List[News]:
        """Get personalized news for a specific user based on their interests."""
        user = self.db.query(User).filter(User.id == user_id).first()
        if not user:
            return []
        
        # Get the user's interests
        user_interests = user.interests
        if not user_interests:
            # If user has no specified interests, return recent news
            return self.db.query(News).order_by(News.published_at.desc()).limit(limit).all()
        
        interest_ids = [str(interest.id) for interest in user_interests]
        
        # Collect recent news (last 3 days) that match user interests
        cutoff_date = datetime.utcnow().replace(hour=0, minute=0, second=0, microsecond=0)
        news_items = self.db.query(News).filter(News.published_at >= cutoff_date).all()
        
        # If no news with relevance scores, just return recent news
        if not news_items or all(not news.relevance_scores for news in news_items):
            return self.db.query(News).order_by(News.published_at.desc()).limit(limit).all()
        
        scored_news = []
        for news in news_items:
            if not news.relevance_scores:
                continue
            
            # Calculate an overall relevance score for this user
            relevance_sum = 0
            for interest_id in interest_ids:
                if interest_id in news.relevance_scores:
                    relevance_sum += news.relevance_scores[interest_id]
            
            avg_relevance = relevance_sum / len(interest_ids) if interest_ids else 0
            if avg_relevance > 0.2:  # Apply a minimum threshold
                scored_news.append((news, avg_relevance))
        
        # Sort by relevance score (highest first)
        scored_news.sort(key=lambda x: x[1], reverse=True)
        
        # Return the top 'limit' results
        result = [item[0] for item in scored_news[:limit]]
        
        # If not enough relevant news, pad with recent news
        if len(result) < limit:
            existing_ids = [news.id for news in result]
            additional_news = (self.db.query(News)
                              .filter(News.id.notin_(existing_ids))
                              .order_by(News.published_at.desc())
                              .limit(limit - len(result))
                              .all())
            result.extend(additional_news)
        
        return result

    def get_trending_news(self, category: Optional[str] = None, limit: int = 10) -> List[News]:
        """Get trending news articles based on recency and user engagement."""
        query = self.db.query(News)
        
        # Filter by category if provided
        if category:
            category_obj = self.db.query(Category).filter(Category.name == category).first()
            if category_obj:
                query = query.join(News.categories).filter(Category.id == category_obj.id)
        
        # Consider articles from the last 2 days
        cutoff_date = datetime.utcnow().replace(hour=0, minute=0, second=0, microsecond=0)
        query = query.filter(News.published_at >= cutoff_date)
        
        # Order by recency first
        results = query.order_by(News.published_at.desc()).limit(limit * 2).all()
        
        # If no results, remove the date filter and try again
        if not results:
            query = self.db.query(News)
            if category:
                category_obj = self.db.query(Category).filter(Category.name == category).first()
                if category_obj:
                    query = query.join(News.categories).filter(Category.id == category_obj.id)
            results = query.order_by(News.published_at.desc()).limit(limit).all()
            return results
        
        # Further prioritize by read count
        for news in results:
            read_count_query = self.db.query(func.count(News.read_history)).filter(News.id == news.id)
            news.read_count = read_count_query.scalar() or 0
        
        results.sort(key=lambda x: (x.read_count * 0.7 + (x.published_at.timestamp() * 0.3)), reverse=True)
        
        return results[:limit]

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

    def generate_digest(self, user_id: str, timeframe: str = "daily") -> Dict[str, Any]:
        """Generate a personalized news digest for a user."""
        user = self.db.query(User).filter(User.id == user_id).first()
        if not user:
            return {"error": "User not found"}
        
        # If LLM not available, generate a simple digest
        if not self.llm or not self.models_available():
            return self.generate_simple_digest(user_id, timeframe)
        
        # Get personalized news items
        personalized_news = self.get_personalized_news(user_id, limit=15)
        
        # Create summaries for top articles if needed
        for news in personalized_news[:5]:
            if not news.summary or len(news.summary) < 100:
                self.summarize_article(str(news.id))
        
        # Group articles by category
        categories = {}
        for news in personalized_news:
            for category in news.categories:
                if category.name not in categories:
                    categories[category.name] = []
                categories[category.name].append(news)
        
        # Create a digest summary for each category
        category_summaries = {}
        for category, news_list in categories.items():
            if len(news_list) < 2:
                continue
                
            titles = [news.title for news in news_list[:5]]
            titles_text = "\n".join([f"- {title}" for title in titles])
            
            prompt = PromptTemplate(
                input_variables=["category", "titles"],
                template="""
                Based on these recent news titles in the category of {category}, provide a brief 
                1-2 sentence summary of the current trends or important developments:
                
                {titles}
                
                Summary:
                """
            )
            
            try:
                chain = LLMChain(llm=self.llm, prompt=prompt)
                summary = chain.run(category=category, titles=titles_text)
                category_summaries[category] = summary.strip()
            except Exception as e:
                logger.error(f"Error generating category digest for {category}: {e}")
                category_summaries[category] = f"Recent developments in {category}"
        
        # Create the final digest
        digest = {
            "user_id": str(user_id),
            "timestamp": datetime.utcnow().isoformat(),
            "timeframe": timeframe,
            "overview": category_summaries,
            "top_stories": [
                {
                    "id": str(news.id),
                    "title": news.title,
                    "summary": news.summary,
                    "url": news.url,
                    "source": news.source.name if news.source else "",
                    "published_at": news.published_at.isoformat() if news.published_at else None
                }
                for news in personalized_news[:10]
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
        
        # Create a digest with categorized sections
        sections = []
        
        # Add category-based sections
        for category, category_news in news_by_category.items():
            sections.append({
                "title": category,
                "articles": [
                    {
                        "id": str(news.id),
                        "title": news.title,
                        "summary": news.summary or "No summary available",
                        "url": news.url,
                        "source": news.source.name if news.source else "",
                        "published_at": news.published_at.isoformat() if news.published_at else None
                    }
                    for news in category_news[:5]
                ]
            })
        
        # Add a general section with all news if no categories
        if not sections:
            sections.append({
                "title": "Recent News",
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
            })
        
        # Create the final digest
        digest = {
            "user_id": str(user_id),
            "timestamp": datetime.utcnow().isoformat(),
            "timeframe": timeframe,
            "sections": sections
        }
        
        return digest

    def generate_trend_analysis(self, days: int = 7, category: Optional[str] = None) -> Dict[str, Any]:
        """Generate an analysis of news trends over time."""
        if not self.models_available():
            return {
                "analysis": "Trend analysis currently unavailable.",
                "days": days,
                "category": category,
                "generated_at": datetime.utcnow().isoformat()
            }
        
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
            return {
                "analysis": "Insufficient data for trend analysis.",
                "days": days,
                "category": category,
                "generated_at": datetime.utcnow().isoformat()
            }
        
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
            
            # Create the response object
            return {
                "analysis": analysis.strip(),
                "days": days,
                "category": category,
                "generated_at": datetime.utcnow().isoformat()
            }
        except Exception as e:
            logger.error(f"Error generating trend analysis: {e}")
            return {
                "analysis": "Trend analysis currently unavailable due to technical issues.",
                "days": days,
                "category": category,
                "generated_at": datetime.utcnow().isoformat()
            }

    def _build_category_embeddings(self, categories: List[Category]) -> None:
        """Build and cache embeddings for all categories."""
        self.category_embeddings = {}
        
        for category in categories:
            # Prepare category description
            description = f"{category.name}: {category.description}" if category.description else category.name
            
            # Create embedding
            try:
                embedding = self.embedding_model.embed_documents([description])[0]
                self.category_embeddings[str(category.id)] = embedding
            except Exception as e:
                logger.error(f"Error creating embedding for category {category.name}: {e}")

    def _build_interest_embeddings(self, interests: List[Interest]) -> None:
        """Build and cache embeddings for all interests."""
        self.interest_embeddings = {}
        
        for interest in interests:
            # Create a rich description from interest name, description, and keywords
            keywords_text = ", ".join(interest.keywords) if interest.keywords else ""
            description = f"{interest.name}: {interest.description} Keywords: {keywords_text}"
            
            # Create embedding
            try:
                embedding = self.embedding_model.embed_documents([description])[0]
                self.interest_embeddings[str(interest.id)] = embedding
            except Exception as e:
                logger.error(f"Error creating embedding for interest {interest.name}: {e}")

    def _calculate_similarity(self, embedding1, embedding2):
        """Calculate cosine similarity between two embeddings."""
        # Convert to numpy arrays
        vec1 = np.array(embedding1)
        vec2 = np.array(embedding2)
        
        # Calculate cosine similarity
        dot_product = np.dot(vec1, vec2)
        norm1 = np.linalg.norm(vec1)
        norm2 = np.linalg.norm(vec2)
        
        if norm1 == 0 or norm2 == 0:
            return 0.0
            
        return dot_product / (norm1 * norm2)