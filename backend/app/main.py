from app.chat.routes import router as chat_router
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.core.config import settings
from app.database.base import Base, engine
from app.auth.routes import router as auth_router
from app.connections.routes import router as connections_router
from app.dictionaries.routes import router as dictionaries_router
from app.chat.routes import router as chat_router

# Create database tables
Base.metadata.create_all(bind=engine)

# Initialize FastAPI app
app = FastAPI(
    title=settings.APP_NAME,
    debug=settings.DEBUG,
    description="AI-powered Data Dictionary Agent API",
    version="1.0.0"
)

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.allowed_origins_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(auth_router)
app.include_router(connections_router)
app.include_router(dictionaries_router)
app.include_router(chat_router)


@app.get("/")
def root():
    """Root endpoint"""
    return {
        "message": "Data Dictionary Agent API",
        "version": "1.0.0",
        "status": "running"
    }


@app.get("/health")
def health_check():
    """Health check endpoint"""
    return {"status": "healthy"}


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
