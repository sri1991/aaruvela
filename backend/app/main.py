import logging
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded

from app.config import settings
from app.auth.routes import router as auth_router, limiter
from app.members.routes import router as members_router
from app.admin.routes import router as admin_router

# Configure root logger for the application
logging.basicConfig(
    level=logging.DEBUG if settings.environment == "development" else logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
)
logger = logging.getLogger(__name__)

app = FastAPI(
    title="Community App API",
    description="Backend API for community application with controlled membership",
    version="1.0.0",
    docs_url="/api/docs",
    redoc_url="/api/redoc",
)

# Register slowapi rate limiter + its 429 exception handler
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/")
async def root():
    """Root endpoint"""
    return {"message": "Community App API", "version": "1.0.0", "status": "running"}


@app.get("/health")
async def health_check():
    """Health check endpoint for monitoring"""
    return JSONResponse(
        status_code=200,
        content={"status": "healthy", "environment": settings.environment},
    )


# Register routers
app.include_router(auth_router, prefix="/auth", tags=["Authentication"])
app.include_router(members_router, prefix="/members", tags=["Membership"])
app.include_router(admin_router, prefix="/admin", tags=["Admin"])


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "app.main:app",
        host=settings.api_host,
        port=settings.api_port,
        reload=settings.environment == "development",
    )