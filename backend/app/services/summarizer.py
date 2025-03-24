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

    