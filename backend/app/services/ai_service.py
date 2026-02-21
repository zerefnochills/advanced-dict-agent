"""
AI Service for generating data dictionary descriptions using Claude (Anthropic)
Handles API calls, retries, error handling, and response parsing
"""

import os
import logging
from typing import Dict, List, Optional, Any
from anthropic import Anthropic, APIError, RateLimitError, APITimeoutError
from tenacity import retry, stop_after_attempt, wait_exponential, retry_if_exception_type
from app.core.config import settings

logger = logging.getLogger(__name__)


class AIService:
    """Service for AI-powered data dictionary generation using Claude"""

    def __init__(self, api_key: Optional[str] = None):
        """
        Initialize AI Service with Anthropic API key
        
        Args:
            api_key: Anthropic API key (defaults to environment variable)
        """
        self.api_key = api_key or settings.ANTHROPIC_API_KEY or os.getenv("ANTHROPIC_API_KEY")
        if not self.api_key:
            raise ValueError("ANTHROPIC_API_KEY not found in environment or parameters")

        self.client = Anthropic(api_key=self.api_key)
        self.model = "claude-sonnet-4-20250514"
        self.max_tokens = 2000

    @retry(
        stop=stop_after_attempt(3),
        wait=wait_exponential(multiplier=1, min=2, max=10),
        retry=retry_if_exception_type((RateLimitError, APITimeoutError)),
        reraise=True
    )
    def _call_claude(self, system_prompt: str, user_prompt: str) -> str:
        try:
            response = self.client.messages.create(
                model=self.model,
                max_tokens=self.max_tokens,
                system=system_prompt,
                messages=[{"role": "user", "content": user_prompt}]
            )

            return response.content[0].text

        except RateLimitError as e:
            logger.warning(f"Rate limit hit, retrying... {e}")
            raise
        except APITimeoutError as e:
            logger.warning(f"API timeout, retrying... {e}")
            raise
        except APIError as e:
            logger.error(f"Claude API error: {e}")
            raise
        except Exception as e:
            logger.error(f"Unexpected error calling Claude: {e}")
            raise


# Singleton instance
_ai_service_instance: Optional[AIService] = None


def get_ai_service(api_key: Optional[str] = None) -> AIService:
    global _ai_service_instance

    if _ai_service_instance is None or api_key:
        _ai_service_instance = AIService(api_key=api_key)

    return _ai_service_instance
