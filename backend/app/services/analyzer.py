import logging
import re
from typing import List, Dict, Any, Optional, Tuple
from datetime import datetime, timedelta
import os
import numpy as np
from sqlalchemy.orm import Session
from sqlalchemy import func

from app.db.models import News, Interest, User, Category, news_category
from app.db.models import ReadHistory
from app.core.config import settings

# Set up logging
logger = logging.getLogger(__name__)

# Module-level model cache — initialized once, reused across all requests
_cached_llm = None
_cached_embedding_model = None


class NewsAnalyzer:
    def __init__(self, db: Session):
        self.db = db
        
        # Initialize LLM based on settings
        self.llm = self._initialize_llm()
        
        # Initialize embedding model
        self.embedding_model = self._initialize_embedding_model()
        
        # Text splitter for chunking
        self.text_splitter = None  # We'll define this if needed
        
        # Cached category embeddings
        self.category_embeddings = None
        self.interest_embeddings = None

    def _initialize_llm(self):
        """Initialize Groq API client for text generation (open-source Llama model)."""
        global _cached_llm
        if _cached_llm is not None:
            return _cached_llm

        try:
            from groq import Groq
            from app.core.config import settings

            if not settings.GROQ_API_KEY:
                logger.warning("GROQ_API_KEY not set. AI analysis will use rule-based fallback.")
                _cached_llm = self._rule_based_generator()
                return _cached_llm

            client = Groq(api_key=settings.GROQ_API_KEY)
            model = settings.GROQ_MODEL

            class GroqGenerator:
                def __init__(self, client, model):
                    self.client = client
                    self.model = model

                def __call__(self, prompt, **kwargs):
                    try:
                        response = self.client.chat.completions.create(
                            model=self.model,
                            messages=[{"role": "user", "content": prompt[:4000]}],
                            max_tokens=512,
                            temperature=0.5,
                        )
                        return response.choices[0].message.content.strip()
                    except Exception as e:
                        logger.error(f"Groq generation error: {e}")
                        return "Analysis not available."

            logger.info(f"Groq analyzer initialized with model: {model}")
            _cached_llm = GroqGenerator(client, model)
            return _cached_llm

        except ImportError:
            logger.error("groq package not installed. Run: pip install groq")
            _cached_llm = self._rule_based_generator()
            return _cached_llm
        except Exception as e:
            logger.error(f"Error initializing Groq analyzer: {e}")
            _cached_llm = self._rule_based_generator()
            return _cached_llm

    def _rule_based_generator(self):
        """Simple rule-based fallback when no LLM API is configured."""
        class RuleBasedGenerator:
            def __call__(self, prompt, **kwargs):
                if "trend" in prompt.lower():
                    return "Recent news shows diverse topics across technology, economy, and current events."
                elif "summary" in prompt.lower() or "summarize" in prompt.lower():
                    return "The article discusses important developments highlighting key findings and their implications."
                else:
                    return "Multiple important factors should be considered in this analysis."
        return RuleBasedGenerator()

    def _initialize_embedding_model(self):
        """Initialize a lightweight ONNX-based embedding model via fastembed."""
        global _cached_embedding_model
        if _cached_embedding_model is not None:
            return _cached_embedding_model

        try:
            from fastembed import TextEmbedding

            # BAAI/bge-small-en-v1.5 — ~130 MB, no PyTorch needed
            model = TextEmbedding(model_name="BAAI/bge-small-en-v1.5")

            class EmbeddingWrapper:
                def __init__(self, model):
                    self.model = model

                def embed_documents(self, texts):
                    try:
                        return list(self.model.embed(texts))
                    except Exception as e:
                        logger.error(f"Error encoding texts: {e}")
                        return [np.zeros(384) for _ in range(len(texts))]

            logger.info("fastembed embedding model loaded: BAAI/bge-small-en-v1.5")
            _cached_embedding_model = EmbeddingWrapper(model)
            return _cached_embedding_model

        except ImportError:
            logger.error("fastembed not installed. Run: pip install fastembed")
            _cached_embedding_model = self._dummy_embedding()
            return _cached_embedding_model
        except Exception as e:
            logger.error(f"Error initializing embedding model: {e}")
            _cached_embedding_model = self._dummy_embedding()
            return _cached_embedding_model

    def _dummy_embedding(self):
        class DummyEmbedding:
            def embed_documents(self, texts):
                return [np.zeros(384) for _ in range(len(texts))]
        logger.warning("Using dummy embeddings — article categorization will not work properly.")
        return DummyEmbedding()

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
                try:
                    # Use SQLAlchemy relationship instead of raw SQL
                    category = self.db.query(Category).filter(Category.id == cat_id).first()
                    if category and category not in news.categories:
                        news.categories.append(category)
                    matched_cats.append(cat_id)
                except Exception as e:
                    logger.error(f"Error associating category {cat_id} with news {news_id}: {e}")
            
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
            # Safer way to get read count
            read_count = self.db.query(func.count("*")).filter(ReadHistory.news_id == news.id).scalar() or 0
            news.read_count = read_count
        
        results.sort(key=lambda x: (getattr(x, 'read_count', 0) * 0.7 + (x.published_at.timestamp() * 0.3)), reverse=True)
        
        return results[:limit]

    def summarize_article(self, news_id: str, verbose: bool = False) -> str:
        """Generate a concise summary for a news article using LLM or extractive methods."""
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
        
        # Create a prompt for summarization
        prompt = f"""Please summarize the following news article in a {"detailed" if verbose else "concise"} manner.
Keep the summary objective and factual, covering the main points.

Title: {news.title}

Content: {content}

Summary:"""
        
        try:
            # Use the LLM directly
            summary = self.llm(prompt)
            
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

    def generate_digest(self, user_id: str, timeframe: str = "daily") -> Dict[str, Any]:
        """Generate a personalized news digest for a user."""
        user = self.db.query(User).filter(User.id == user_id).first()
        if not user:
            return {"error": "User not found"}
        
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
        
        # Create a digest summary for each category using the LLM or fallback
        category_summaries = {}
        for category, news_list in categories.items():
            if len(news_list) < 2:
                category_summaries[category] = f"Recent news about {category}."
                continue
                
            titles = [news.title for news in news_list[:5]]
            titles_text = "\n".join([f"- {title}" for title in titles])
            
            if self.llm:
                try:
                    prompt = f"""Based on these recent news titles in the category of {category}, provide a brief 
1-2 sentence summary of the current trends or important developments:

{titles_text}

Summary:"""
                    
                    category_summary = self.llm(prompt)
                    category_summaries[category] = category_summary.strip()
                except Exception as e:
                    logger.error(f"Error generating category digest for {category}: {e}")
                    category_summaries[category] = f"Recent developments in {category}"
            else:
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
    
    def generate_trend_analysis(self, days: int = 7, category: Optional[str] = None) -> str:
        """Generate an analysis of news trends over time."""
        try:
            # Get recent news
            cutoff_date = datetime.utcnow().replace(hour=0, minute=0, second=0, microsecond=0) - timedelta(days=days)
            query = self.db.query(News).filter(News.published_at >= cutoff_date)
            
            # Filter by category if provided
            if category:
                category_obj = self.db.query(Category).filter(Category.name == category).first()
                if category_obj:
                    query = query.join(News.categories).filter(Category.id == category_obj.id)
            
            news_items = query.order_by(News.published_at.desc()).limit(30).all()
            
            if not news_items:
                return "Insufficient data for trend analysis. No articles found for the specified period."
            
            # Build a simple text representation of the news items
            titles_text = "\n".join([f"- {news.title}" for news in news_items[:10]])
            
            if self.llm:
                # Create a prompt for trend analysis
                prompt = f"""Based on these recent news headlines from the past {days} days, identify 3-5 key trends. 
Provide a thoughtful analysis in 4-6 sentences that highlights emerging topics and recurring themes.

Headlines:
{titles_text}

Trend Analysis:"""
                
                try:
                    # Get analysis from LLM
                    analysis = self.llm(prompt)
                    return analysis.strip()
                except Exception as e:
                    logger.error(f"Error using LLM for trend analysis: {e}")
            
            # Fallback: Generate an analysis based on categories
            category_counts = {}
            for news in news_items:
                for cat in news.categories:
                    category_counts[cat.name] = category_counts.get(cat.name, 0) + 1
            
            if category_counts:
                top_categories = sorted(category_counts.items(), key=lambda x: x[1], reverse=True)
                top_cat_name = top_categories[0][0]
                return f"""Recent news analysis reveals {len(news_items)} articles with a concentration in {top_cat_name}.
This suggests significant developments in the {top_cat_name} sector currently dominating the news cycle.
Other trending topics include {', '.join([cat for cat, _ in top_categories[1:3]])}, indicating diverse but related interests.
These trends reflect shifting public attention and evolving priorities in the current information landscape."""
            else:
                return f"""Analysis of recent news shows diverse topics being covered over the past {days} days.
No single category dominates the current news cycle, suggesting a balanced distribution of public interest.
The variety of covered topics indicates a dynamic information landscape with multiple competing narratives.
This pattern is typical during periods of transition when no single issue commands overwhelming attention."""
        
        except Exception as e:
            logger.error(f"Error in trend analysis: {e}")
            return f"Unable to analyze trends at this time. Error: {str(e)}"

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