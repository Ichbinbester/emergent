from fastapi import FastAPI, APIRouter, HTTPException
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

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# Create the main app without a prefix
app = FastAPI()

# Create a router with the /api prefix
api_router = APIRouter(prefix="/api")


# Define Models for Games
class Game(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    name: str
    image_url: str = ""  # URL for game cover image
    time_played: str  # "50 hours" or similar
    completion_status: str  # "Not Started", "In Progress", "Completed", "Platinum"
    rating: int = Field(ge=1, le=10)  # 1-10 scale
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
    rating: int = Field(ge=1, le=10, default=1)
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


# Define Models for Game Series
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


# Define Models for Movie Series
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


# Game Routes
@api_router.post("/games", response_model=Game)
async def create_game(game: GameCreate):
    game_dict = game.dict()
    game_obj = Game(**game_dict)
    await db.games.insert_one(game_obj.dict())
    return game_obj

@api_router.get("/games", response_model=List[Game])
async def get_games():
    games = await db.games.find().to_list(1000)
    return [Game(**game) for game in games]

@api_router.get("/games/{game_id}", response_model=Game)
async def get_game(game_id: str):
    game = await db.games.find_one({"id": game_id})
    if not game:
        raise HTTPException(status_code=404, detail="Game not found")
    return Game(**game)

@api_router.put("/games/{game_id}", response_model=Game)
async def update_game(game_id: str, game_update: GameUpdate):
    # Get existing game
    existing_game = await db.games.find_one({"id": game_id})
    if not existing_game:
        raise HTTPException(status_code=404, detail="Game not found")
    
    # Update only provided fields
    update_data = {}
    for field, value in game_update.dict().items():
        if value is not None:
            update_data[field] = value
    
    if update_data:
        await db.games.update_one({"id": game_id}, {"$set": update_data})
    
    # Return updated game
    updated_game = await db.games.find_one({"id": game_id})
    return Game(**updated_game)

@api_router.delete("/games/{game_id}")
async def delete_game(game_id: str):
    result = await db.games.delete_one({"id": game_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Game not found")
    return {"message": "Game deleted successfully"}


# Movie Series Routes
@api_router.post("/movie-series", response_model=MovieSeries)
async def create_movie_series(series: MovieSeriesCreate):
    series_dict = series.dict()
    series_obj = MovieSeries(**series_dict)
    await db.movie_series.insert_one(series_obj.dict())
    return series_obj

@api_router.get("/movie-series", response_model=List[MovieSeries])
async def get_movie_series():
    series_list = await db.movie_series.find().to_list(1000)
    return [MovieSeries(**series) for series in series_list]

@api_router.get("/movie-series/{series_id}", response_model=MovieSeries)
async def get_movie_series_by_id(series_id: str):
    series = await db.movie_series.find_one({"id": series_id})
    if not series:
        raise HTTPException(status_code=404, detail="Movie series not found")
    return MovieSeries(**series)

@api_router.put("/movie-series/{series_id}", response_model=MovieSeries)
async def update_movie_series(series_id: str, series_update: MovieSeriesUpdate):
    existing_series = await db.movie_series.find_one({"id": series_id})
    if not existing_series:
        raise HTTPException(status_code=404, detail="Movie series not found")
    
    update_data = {}
    for field, value in series_update.dict().items():
        if value is not None:
            update_data[field] = value
    
    if update_data:
        await db.movie_series.update_one({"id": series_id}, {"$set": update_data})
    
    updated_series = await db.movie_series.find_one({"id": series_id})
    return MovieSeries(**updated_series)

@api_router.delete("/movie-series/{series_id}")
async def delete_movie_series(series_id: str):
    result = await db.movie_series.delete_one({"id": series_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Movie series not found")
    return {"message": "Movie series deleted successfully"}

# Add movie to existing series
@api_router.post("/movie-series/{series_id}/movies")
async def add_movie_to_series(series_id: str, movie: Movie):
    series = await db.movie_series.find_one({"id": series_id})
    if not series:
        raise HTTPException(status_code=404, detail="Movie series not found")
    
    # Add movie to the movies array
    await db.movie_series.update_one(
        {"id": series_id}, 
        {"$push": {"movies": movie.dict()}}
    )
    
    updated_series = await db.movie_series.find_one({"id": series_id})
    return MovieSeries(**updated_series)


# Basic health check
@api_router.get("/")
async def root():
    return {"message": "Gaming & Movie Collection API is running!"}

# Include the router in the main app
app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()