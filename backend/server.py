from fastapi import FastAPI, APIRouter, HTTPException, Query
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field
from typing import List, Optional
import uuid
from datetime import datetime

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# safer env reading
MONGO_URL = os.getenv('MONGO_URL')
DB_NAME = os.getenv('DB_NAME')
if not MONGO_URL or not DB_NAME:
    raise RuntimeError("MONGO_URL and DB_NAME must be set in environment variables (.env).")

CORS_ORIGINS = os.getenv('CORS_ORIGINS', '*')

# MongoDB connection
client = AsyncIOMotorClient(MONGO_URL)
db = client[DB_NAME]

# Create the main app without a prefix
app = FastAPI()

# Create a router with the /api prefix
api_router = APIRouter(prefix="/api")

# --- Helper to sanitize Mongo documents (remove _id) ---
def sanitize_doc(doc: dict) -> dict:
    if not doc:
        return doc
    return {k: v for k, v in doc.items() if k != "_id"}

# --- Models ---
class Game(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    name: str
    image_url: str = ""
    time_played: str = ""
    completion_status: str = "Not Started"
    rating: int = Field(..., ge=1, le=10)
    problems: str = ""
    notes: str = ""
    platinum_status: bool = False
    trophies_earned: int = 0
    trophies_total: int = 0
    created_at: datetime = Field(default_factory=datetime.utcnow)

class GameCreate(BaseModel):
    name: str
    image_url: str = ""
    time_played: str = ""
    completion_status: str = "Not Started"
    rating: int = Field(default=1, ge=1, le=10)
    problems: str = ""
    notes: str = ""
    platinum_status: bool = False
    trophies_earned: int = 0
    trophies_total: int = 0

class GameUpdate(BaseModel):
    name: Optional[str] = None
    image_url: Optional[str] = None
    time_played: Optional[str] = None
    completion_status: Optional[str] = None
    rating: Optional[int] = Field(None, ge=1, le=10)
    problems: Optional[str] = None
    notes: Optional[str] = None
    platinum_status: Optional[bool] = None
    trophies_earned: Optional[int] = None
    trophies_total: Optional[int] = None

class GameSeries(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    series_name: str
    games: List[Game] = []
    created_at: datetime = Field(default_factory=datetime.utcnow)

class GameSeriesCreate(BaseModel):
    series_name: str
    games: List[GameCreate] = []

class GameSeriesUpdate(BaseModel):
    series_name: Optional[str] = None
    games: Optional[List[Game]] = None

class Movie(BaseModel):
    title: str
    notes: str = ""

class MovieSeries(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    series_name: str
    movies: List[Movie] = []
    created_at: datetime = Field(default_factory=datetime.utcnow)

class MovieSeriesCreate(BaseModel):
    series_name: str
    movies: List[Movie] = []

class MovieSeriesUpdate(BaseModel):
    series_name: Optional[str] = None
    movies: Optional[List[Movie]] = None

# --- Routes (with sanitation & pagination where it makes sense) ---

# Games
@api_router.post("/games", response_model=Game)
async def create_game(game: GameCreate):
    game_dict = game.dict()
    game_obj = Game(**game_dict)
    await db.games.insert_one(game_obj.dict())
    return game_obj

@api_router.get("/games", response_model=List[Game])
async def get_games(limit: int = Query(100, gt=0, le=1000), skip: int = Query(0, ge=0)):
    cursor = db.games.find().skip(skip).limit(limit)
    docs = await cursor.to_list(length=limit)
    return [Game(**sanitize_doc(d)) for d in docs]

@api_router.get("/games/{game_id}", response_model=Game)
async def get_game(game_id: str):
    game = await db.games.find_one({"id": game_id})
    if not game:
        raise HTTPException(status_code=404, detail="Game not found")
    return Game(**sanitize_doc(game))

@api_router.put("/games/{game_id}", response_model=Game)
async def update_game(game_id: str, game_update: GameUpdate):
    existing_game = await db.games.find_one({"id": game_id})
    if not existing_game:
        raise HTTPException(status_code=404, detail="Game not found")
    update_data = {k: v for k, v in game_update.dict().items() if v is not None}
    if update_data:
        await db.games.update_one({"id": game_id}, {"$set": update_data})
    updated_game = await db.games.find_one({"id": game_id})
    return Game(**sanitize_doc(updated_game))

@api_router.delete("/games/{game_id}")
async def delete_game(game_id: str):
    result = await db.games.delete_one({"id": game_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Game not found")
    return {"message": "Game deleted successfully"}

# Game Series
@api_router.post("/game-series", response_model=GameSeries)
async def create_game_series(series: GameSeriesCreate):
    series_dict = series.dict()
    series_obj = GameSeries(**series_dict)
    await db.game_series.insert_one(series_obj.dict())
    return series_obj

@api_router.get("/game-series", response_model=List[GameSeries])
async def get_game_series(limit: int = Query(100, gt=0, le=1000), skip: int = Query(0, ge=0)):
    cursor = db.game_series.find().skip(skip).limit(limit)
    docs = await cursor.to_list(length=limit)
    return [GameSeries(**sanitize_doc(d)) for d in docs]

@api_router.get("/game-series/{series_id}", response_model=GameSeries)
async def get_game_series_by_id(series_id: str):
    series = await db.game_series.find_one({"id": series_id})
    if not series:
        raise HTTPException(status_code=404, detail="Game series not found")
    return GameSeries(**sanitize_doc(series))

@api_router.put("/game-series/{series_id}", response_model=GameSeries)
async def update_game_series(series_id: str, series_update: GameSeriesUpdate):
    existing_series = await db.game_series.find_one({"id": series_id})
    if not existing_series:
        raise HTTPException(status_code=404, detail="Game series not found")
    update_data = {k: v for k, v in series_update.dict().items() if v is not None}
    if update_data:
        await db.game_series.update_one({"id": series_id}, {"$set": update_data})
    updated_series = await db.game_series.find_one({"id": series_id})
    return GameSeries(**sanitize_doc(updated_series))

@api_router.delete("/game-series/{series_id}")
async def delete_game_series(series_id: str):
    result = await db.game_series.delete_one({"id": series_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Game series not found")
    return {"message": "Game series deleted successfully"}

@api_router.post("/game-series/{series_id}/games", response_model=GameSeries)
async def add_game_to_series(series_id: str, game: GameCreate):
    series = await db.game_series.find_one({"id": series_id})
    if not series:
        raise HTTPException(status_code=404, detail="Game series not found")
    game_obj = Game(**game.dict())
    await db.game_series.update_one({"id": series_id}, {"$push": {"games": game_obj.dict()}})
    updated_series = await db.game_series.find_one({"id": series_id})
    return GameSeries(**sanitize_doc(updated_series))

# Movie Series
@api_router.post("/movie-series", response_model=MovieSeries)
async def create_movie_series(series: MovieSeriesCreate):
    series_dict = series.dict()
    series_obj = MovieSeries(**series_dict)
    await db.movie_series.insert_one(series_obj.dict())
    return series_obj

@api_router.get("/movie-series", response_model=List[MovieSeries])
async def get_movie_series(limit: int = Query(100, gt=0, le=1000), skip: int = Query(0, ge=0)):
    cursor = db.movie_series.find().skip(skip).limit(limit)
    docs = await cursor.to_list(length=limit)
    return [MovieSeries(**sanitize_doc(d)) for d in docs]

@api_router.get("/movie-series/{series_id}", response_model=MovieSeries)
async def get_movie_series_by_id(series_id: str):
    series = await db.movie_series.find_one({"id": series_id})
    if not series:
        raise HTTPException(status_code=404, detail="Movie series not found")
    return MovieSeries(**sanitize_doc(series))

@api_router.put("/movie-series/{series_id}", response_model=MovieSeries)
async def update_movie_series(series_id: str, series_update: MovieSeriesUpdate):
    existing_series = await db.movie_series.find_one({"id": series_id})
    if not existing_series:
        raise HTTPException(status_code=404, detail="Movie series not found")
    update_data = {k: v for k, v in series_update.dict().items() if v is not None}
    if update_data:
        await db.movie_series.update_one({"id": series_id}, {"$set": update_data})
    updated_series = await db.movie_series.find_one({"id": series_id})
    return MovieSeries(**sanitize_doc(updated_series))

@api_router.delete("/movie-series/{series_id}")
async def delete_movie_series(series_id: str):
    result = await db.movie_series.delete_one({"id": series_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Movie series not found")
    return {"message": "Movie series deleted successfully"}

@api_router.post("/movie-series/{series_id}/movies", response_model=MovieSeries)
async def add_movie_to_series(series_id: str, movie: Movie):
    series = await db.movie_series.find_one({"id": series_id})
    if not series:
        raise HTTPException(status_code=404, detail="Movie series not found")
    await db.movie_series.update_one({"id": series_id}, {"$push": {"movies": movie.dict()}})
    updated_series = await db.movie_series.find_one({"id": series_id})
    return MovieSeries(**sanitize_doc(updated_series))

# Basic health check
@api_router.get("/")
async def root():
    return {"message": "Gaming & Movie Collection API is running!"}

# Include router and middleware
app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=CORS_ORIGINS.split(',') if isinstance(CORS_ORIGINS, str) else CORS_ORIGINS,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# Startup: create useful indexes
@app.on_event("startup")
async def startup_db():
    try:
        await db.games.create_index("id", unique=True)
        await db.game_series.create_index("id", unique=True)
        await db.movie_series.create_index("id", unique=True)
        logger.info("Ensured indices for collections.")
    except Exception as e:
        logger.exception("Error creating indices: %s", e)

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()
