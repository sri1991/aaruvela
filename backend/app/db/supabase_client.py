import asyncio
import logging
from supabase import create_client, Client
from app.config import settings

logger = logging.getLogger(__name__)

# Initialize Supabase client with service role key (backend only)
# Timeout is handled at the httpx level via SUPABASE_CLIENT_TIMEOUT env or sensible default
supabase: Client = create_client(
    settings.supabase_url,
    settings.supabase_service_key,
)


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

    Usage:
        result = await run_query(lambda: supabase.table("users").select("*").execute())
    """
    return await asyncio.to_thread(query_fn)
