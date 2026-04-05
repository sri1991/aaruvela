import asyncio
import logging
import threading
from supabase import create_client, Client
from app.config import settings

logger = logging.getLogger(__name__)

# Initialize Supabase client with service role key (backend only)
# Timeout is handled at the httpx level via SUPABASE_CLIENT_TIMEOUT env or sensible default
supabase: Client = create_client(
    settings.supabase_url,
    settings.supabase_service_key,
)

# Lock to prevent concurrent thread access to the shared httpx/HTTP2 connection,
# which causes KeyError crashes in httpcore's HTTP2 stream bookkeeping.
_db_lock = threading.Lock()


def get_supabase_client() -> Client:
    """
    Get Supabase client instance.
    Returns client with service role privileges (bypass RLS).
    """
    return supabase


async def run_query(query_fn):
    """
    Run a synchronous Supabase/postgrest query in a thread-pool executor so it
    does NOT block the FastAPI async event loop.

    A threading lock serializes access to the shared httpx client to prevent
    KeyError crashes caused by concurrent HTTP/2 stream access across threads.

    Usage:
        result = await run_query(lambda: supabase.table("users").select("*").execute())
    """
    def _locked():
        with _db_lock:
            return query_fn()

    return await asyncio.to_thread(_locked)
