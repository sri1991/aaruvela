from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from app.config import settings

# Import routers
from app.auth.routes import router as auth_router
from app.members.routes import router as members_router
# from app.payments.routes import router as payments_router
# from app.chat.routes import router as chat_router
from app.admin.routes import router as admin_router

app = FastAPI(
    title="Community App API",
    description="Backend API for community application with controlled membership",
    version="1.0.0",
    docs_url="/api/docs",
    redoc_url="/api/redoc"
)

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
    return {
        "message": "Community App API",
        "version": "1.0.0",
        "status": "running"
    }


@app.get("/health")
async def health_check():
    """Health check endpoint for monitoring"""
    return JSONResponse(
        status_code=200,
        content={
            "status": "healthy",
            "environment": settings.environment
        }
    )


# Register routers
app.include_router(auth_router, prefix="/auth", tags=["Authentication"])
app.include_router(members_router, prefix="/members", tags=["Membership"])
# app.include_router(payments_router, prefix="/payments", tags=["Payments"])
# app.include_router(chat_router, prefix="/chat", tags=["Chat"])
app.include_router(admin_router, prefix="/admin", tags=["Admin"])


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "app.main:app",
        host=settings.api_host,
        port=settings.api_port,
        reload=True if settings.environment == "development" else False
    )