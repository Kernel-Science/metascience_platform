from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import logging

# Configure logging at startup
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

from .routes.health import router as health_router
from .routes.catalog import router as catalog_router
from .routes.analysis import router as analysis_router
from .routes.papers import router as papers_router
from .routes.network import router as network_router
from .routes.tools import router as tools_router
from .routes.review import router as review_router

logger.info("Initializing FastAPI application...")
app = FastAPI()

logger.info("Adding CORS middleware...")
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], allow_credentials=True, allow_methods=["*"], allow_headers=["*"],
)

logger.info("Including routers...")
app.include_router(health_router, prefix="/api")
app.include_router(catalog_router, prefix="/api")
app.include_router(analysis_router, prefix="/api")
app.include_router(papers_router, prefix="/api")
app.include_router(network_router, prefix="/api")
app.include_router(tools_router, prefix="/api")
app.include_router(review_router, prefix="/api")
logger.info("All routers included successfully")

if __name__ == "__main__":
    import uvicorn
    logger.info("Starting Metascience Backend API server...")
    uvicorn.run(app, host="0.0.0.0", port=8000, log_level="info")