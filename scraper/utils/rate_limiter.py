"""
Token bucket rate limiter for polite scraping.
Used as a manual throttle when needed beyond Scrapy's DOWNLOAD_DELAY.
"""
import time
import threading


class TokenBucket:
    """Thread-safe token bucket for rate limiting."""

    def __init__(self, rate: float = 1.0, burst: int = 1):
        """
        Args:
            rate: tokens per second to add
            burst: max tokens (burst capacity)
        """
        self.rate = rate
        self.burst = burst
        self._tokens = burst
        self._last_refill = time.monotonic()
        self._lock = threading.Lock()

    def _refill(self):
        now = time.monotonic()
        elapsed = now - self._last_refill
        self._tokens = min(self.burst, self._tokens + elapsed * self.rate)
        self._last_refill = now

    def consume(self, tokens: int = 1) -> float:
        """
        Consume tokens. Returns the time to wait (0 if available immediately).
        """
        with self._lock:
            self._refill()
            if self._tokens >= tokens:
                self._tokens -= tokens
                return 0.0
            wait_time = (tokens - self._tokens) / self.rate
            return wait_time

    def wait_and_consume(self, tokens: int = 1):
        """Block until a token is available, then consume it."""
        wait = self.consume(tokens)
        if wait > 0:
            time.sleep(wait)


# Default limiter: 1 request per 1.5 seconds
default_limiter = TokenBucket(rate=1 / 1.5, burst=1)
