from supabase import create_client, Client
from app.config import settings

# Initialize Supabase client with service role key (backend only)
supabase: Client = create_client(
    settings.supabase_url,
    settings.supabase_service_key
)


def get_supabase_client() -> Client:
    """
    Get Supabase client instance
    Returns client with service role privileges (bypass RLS)
    """
    return supabase
