import React, { useState, useEffect } from "react";
import "./App.css";
import axios from "axios";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

// Game Component
const GameCard = ({ game, onEdit, onDelete }) => {
  const getStatusColor = (status) => {
    switch (status) {
      case "Platinum": return "bg-yellow-500";
      case "Completed": return "bg-green-500";
      case "In Progress": return "bg-blue-500";
      default: return "bg-gray-500";
    }
  };

  return (
    <div className="bg-gray-800 rounded-lg p-6 shadow-lg hover:shadow-xl transition-shadow">
      <div className="flex justify-between items-start mb-4">
        <h3 className="text-xl font-bold text-white">{game.name}</h3>
        <div className="flex space-x-2">
          <button
            onClick={() => onEdit(game)}
            className="text-blue-400 hover:text-blue-300"
          >
            ✏️
          </button>
          <button
            onClick={() => onDelete(game.id)}
            className="text-red-400 hover:text-red-300"
          >
            🗑️
          </button>
        </div>
      </div>
      
      <div className="space-y-2 text-gray-300">
        <div className="flex justify-between">
          <span>Zeit:</span>
          <span>{game.time_played || "Nicht angegeben"}</span>
        </div>
        <div className="flex justify-between">
          <span>Status:</span>
          <span className={`px-2 py-1 rounded text-xs ${getStatusColor(game.completion_status)} text-white`}>
            {game.completion_status}
          </span>
        </div>
        <div className="flex justify-between">
          <span>Bewertung:</span>
          <span>{"⭐".repeat(game.rating)}</span>
        </div>
        {game.platinum_status && (
          <div className="flex justify-between">
            <span>🏆 Platinum:</span>
            <span className="text-yellow-400">Ja</span>
          </div>
        )}
        <div className="flex justify-between">
          <span>Trophäen:</span>
          <span>{game.trophies_earned}/{game.trophies_total}</span>
        </div>
        {game.problems && (
          <div>
            <span className="text-red-400">Probleme:</span>
            <p className="text-sm mt-1">{game.problems}</p>
          </div>
        )}
        {game.notes && (
          <div>
            <span className="text-green-400">Notizen:</span>
            <p className="text-sm mt-1">{game.notes}</p>
          </div>
        )}
      </div>
    </div>
  );
};

// Game Form Modal
const GameModal = ({ game, isOpen, onClose, onSave }) => {
  const [formData, setFormData] = useState({
    name: "",
    time_played: "",
    completion_status: "Not Started",
    rating: 1,
    problems: "",
    notes: "",
    platinum_status: false,
    trophies_earned: 0,
    trophies_total: 0,
  });

  useEffect(() => {
    if (game) {
      setFormData(game);
    } else {
      setFormData({
        name: "",
        time_played: "",
        completion_status: "Not Started",
        rating: 1,
        problems: "",
        notes: "",
        platinum_status: false,
        trophies_earned: 0,
        trophies_total: 0,
      });
    }
  }, [game, isOpen]);

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave(formData);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-gray-900 rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <h2 className="text-2xl font-bold text-white mb-6">
          {game ? "Spiel bearbeiten" : "Neues Spiel hinzufügen"}
        </h2>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-white mb-2">Name *</label>
            <input
              type="text"
              required
              value={formData.name}
              onChange={(e) => setFormData({...formData, name: e.target.value})}
              className="w-full bg-gray-800 text-white p-3 rounded"
            />
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-white mb-2">Spielzeit</label>
              <input
                type="text"
                placeholder="z.B. 50 Stunden"
                value={formData.time_played}
                onChange={(e) => setFormData({...formData, time_played: e.target.value})}
                className="w-full bg-gray-800 text-white p-3 rounded"
              />
            </div>
            
            <div>
              <label className="block text-white mb-2">Status</label>
              <select
                value={formData.completion_status}
                onChange={(e) => setFormData({...formData, completion_status: e.target.value})}
                className="w-full bg-gray-800 text-white p-3 rounded"
              >
                <option value="Not Started">Nicht begonnen</option>
                <option value="In Progress">In Bearbeitung</option>
                <option value="Completed">Abgeschlossen</option>
                <option value="Platinum">Platinum</option>
              </select>
            </div>
          </div>
          
          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-white mb-2">Bewertung (1-10)</label>
              <input
                type="number"
                min="1"
                max="10"
                value={formData.rating}
                onChange={(e) => setFormData({...formData, rating: parseInt(e.target.value)})}
                className="w-full bg-gray-800 text-white p-3 rounded"
              />
            </div>
            
            <div>
              <label className="block text-white mb-2">Trophäen erhalten</label>
              <input
                type="number"
                min="0"
                value={formData.trophies_earned}
                onChange={(e) => setFormData({...formData, trophies_earned: parseInt(e.target.value)})}
                className="w-full bg-gray-800 text-white p-3 rounded"
              />
            </div>
            
            <div>
              <label className="block text-white mb-2">Trophäen gesamt</label>
              <input
                type="number"
                min="0"
                value={formData.trophies_total}
                onChange={(e) => setFormData({...formData, trophies_total: parseInt(e.target.value)})}
                className="w-full bg-gray-800 text-white p-3 rounded"
              />
            </div>
          </div>
          
          <div>
            <label className="flex items-center text-white">
              <input
                type="checkbox"
                checked={formData.platinum_status}
                onChange={(e) => setFormData({...formData, platinum_status: e.target.checked})}
                className="mr-2"
              />
              Platinum Trophäe erhalten 🏆
            </label>
          </div>
          
          <div>
            <label className="block text-white mb-2">Probleme</label>
            <textarea
              value={formData.problems}
              onChange={(e) => setFormData({...formData, problems: e.target.value})}
              className="w-full bg-gray-800 text-white p-3 rounded h-20"
              placeholder="Bekannte Probleme oder Bugs..."
            />
          </div>
          
          <div>
            <label className="block text-white mb-2">Notizen</label>
            <textarea
              value={formData.notes}
              onChange={(e) => setFormData({...formData, notes: e.target.value})}
              className="w-full bg-gray-800 text-white p-3 rounded h-20"
              placeholder="Persönliche Notizen zum Spiel..."
            />
          </div>
          
          <div className="flex space-x-4 pt-4">
            <button
              type="submit"
              className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded"
            >
              Speichern
            </button>
            <button
              type="button"
              onClick={onClose}
              className="bg-gray-600 hover:bg-gray-700 text-white px-6 py-2 rounded"
            >
              Abbrechen
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// Movie Series Component
const MovieSeriesCard = ({ series, onEdit, onDelete, onAddMovie }) => {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <div className="bg-gray-800 rounded-lg p-6 shadow-lg">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-xl font-bold text-white cursor-pointer" 
            onClick={() => setIsExpanded(!isExpanded)}>
          {series.series_name} ({series.movies.length} Filme)
          <span className="ml-2">{isExpanded ? "▼" : "▶"}</span>
        </h3>
        <div className="flex space-x-2">
          <button
            onClick={() => onAddMovie(series)}
            className="text-green-400 hover:text-green-300"
            title="Film hinzufügen"
          >
            ➕
          </button>
          <button
            onClick={() => onEdit(series)}
            className="text-blue-400 hover:text-blue-300"
          >
            ✏️
          </button>
          <button
            onClick={() => onDelete(series.id)}
            className="text-red-400 hover:text-red-300"
          >
            🗑️
          </button>
        </div>
      </div>
      
      {isExpanded && (
        <div className="space-y-2">
          {series.movies.map((movie, index) => (
            <div key={index} className="bg-gray-700 p-3 rounded flex justify-between">
              <div>
                <h4 className="text-white font-medium">{movie.title}</h4>
                {movie.notes && (
                  <p className="text-gray-300 text-sm mt-1">{movie.notes}</p>
                )}
              </div>
            </div>
          ))}
          {series.movies.length === 0 && (
            <p className="text-gray-400 text-center py-4">Keine Filme hinzugefügt</p>
          )}
        </div>
      )}
    </div>
  );
};

// Movie Series Modal
const MovieSeriesModal = ({ series, isOpen, onClose, onSave }) => {
  const [formData, setFormData] = useState({
    series_name: "",
    movies: [],
  });

  const [newMovie, setNewMovie] = useState({ title: "", notes: "" });

  useEffect(() => {
    if (series) {
      setFormData(series);
    } else {
      setFormData({ series_name: "", movies: [] });
    }
    setNewMovie({ title: "", notes: "" });
  }, [series, isOpen]);

  const addMovie = () => {
    if (newMovie.title.trim()) {
      setFormData({
        ...formData,
        movies: [...formData.movies, { ...newMovie }]
      });
      setNewMovie({ title: "", notes: "" });
    }
  };

  const removeMovie = (index) => {
    setFormData({
      ...formData,
      movies: formData.movies.filter((_, i) => i !== index)
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave(formData);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-gray-900 rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <h2 className="text-2xl font-bold text-white mb-6">
          {series ? "Filmreihe bearbeiten" : "Neue Filmreihe"}
        </h2>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-white mb-2">Reihenname *</label>
            <input
              type="text"
              required
              value={formData.series_name}
              onChange={(e) => setFormData({...formData, series_name: e.target.value})}
              className="w-full bg-gray-800 text-white p-3 rounded"
              placeholder="z.B. Star Wars"
            />
          </div>
          
          <div>
            <label className="block text-white mb-2">Neuen Film hinzufügen</label>
            <div className="flex space-x-2 mb-2">
              <input
                type="text"
                value={newMovie.title}
                onChange={(e) => setNewMovie({...newMovie, title: e.target.value})}
                className="flex-1 bg-gray-800 text-white p-3 rounded"
                placeholder="Filmtitel"
              />
              <button
                type="button"
                onClick={addMovie}
                className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded"
              >
                +
              </button>
            </div>
            <input
              type="text"
              value={newMovie.notes}
              onChange={(e) => setNewMovie({...newMovie, notes: e.target.value})}
              className="w-full bg-gray-800 text-white p-3 rounded"
              placeholder="Notizen (optional)"
            />
          </div>
          
          <div>
            <label className="block text-white mb-2">Filme in dieser Reihe</label>
            <div className="space-y-2 max-h-40 overflow-y-auto">
              {formData.movies.map((movie, index) => (
                <div key={index} className="bg-gray-700 p-3 rounded flex justify-between items-center">
                  <div>
                    <h4 className="text-white">{movie.title}</h4>
                    {movie.notes && <p className="text-gray-300 text-sm">{movie.notes}</p>}
                  </div>
                  <button
                    type="button"
                    onClick={() => removeMovie(index)}
                    className="text-red-400 hover:text-red-300"
                  >
                    🗑️
                  </button>
                </div>
              ))}
            </div>
          </div>
          
          <div className="flex space-x-4 pt-4">
            <button
              type="submit"
              className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded"
            >
              Speichern
            </button>
            <button
              type="button"
              onClick={onClose}
              className="bg-gray-600 hover:bg-gray-700 text-white px-6 py-2 rounded"
            >
              Abbrechen
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// Add Movie Modal
const AddMovieModal = ({ series, isOpen, onClose, onSave }) => {
  const [movie, setMovie] = useState({ title: "", notes: "" });

  useEffect(() => {
    setMovie({ title: "", notes: "" });
  }, [isOpen]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (movie.title.trim()) {
      onSave(series.id, movie);
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-gray-900 rounded-lg p-6 w-full max-w-md">
        <h2 className="text-xl font-bold text-white mb-4">
          Film zu "{series?.series_name}" hinzufügen
        </h2>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-white mb-2">Filmtitel *</label>
            <input
              type="text"
              required
              value={movie.title}
              onChange={(e) => setMovie({...movie, title: e.target.value})}
              className="w-full bg-gray-800 text-white p-3 rounded"
            />
          </div>
          
          <div>
            <label className="block text-white mb-2">Notizen</label>
            <textarea
              value={movie.notes}
              onChange={(e) => setMovie({...movie, notes: e.target.value})}
              className="w-full bg-gray-800 text-white p-3 rounded h-20"
            />
          </div>
          
          <div className="flex space-x-4">
            <button
              type="submit"
              className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded"
            >
              Hinzufügen
            </button>
            <button
              type="button"
              onClick={onClose}
              className="bg-gray-600 hover:bg-gray-700 text-white px-6 py-2 rounded"
            >
              Abbrechen
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// Main App Component
function App() {
  const [activeTab, setActiveTab] = useState("games");
  const [games, setGames] = useState([]);
  const [movieSeries, setMovieSeries] = useState([]);
  const [isGameModalOpen, setIsGameModalOpen] = useState(false);
  const [isSeriesModalOpen, setIsSeriesModalOpen] = useState(false);
  const [isAddMovieModalOpen, setIsAddMovieModalOpen] = useState(false);
  const [selectedGame, setSelectedGame] = useState(null);
  const [selectedSeries, setSelectedSeries] = useState(null);

  // Load data on component mount
  useEffect(() => {
    loadGames();
    loadMovieSeries();
  }, []);

  const loadGames = async () => {
    try {
      const response = await axios.get(`${API}/games`);
      setGames(response.data);
    } catch (error) {
      console.error("Fehler beim Laden der Spiele:", error);
    }
  };

  const loadMovieSeries = async () => {
    try {
      const response = await axios.get(`${API}/movie-series`);
      setMovieSeries(response.data);
    } catch (error) {
      console.error("Fehler beim Laden der Filmreihen:", error);
    }
  };

  // Game functions
  const handleSaveGame = async (gameData) => {
    try {
      if (selectedGame) {
        await axios.put(`${API}/games/${selectedGame.id}`, gameData);
      } else {
        await axios.post(`${API}/games`, gameData);
      }
      loadGames();
      setIsGameModalOpen(false);
      setSelectedGame(null);
    } catch (error) {
      console.error("Fehler beim Speichern des Spiels:", error);
    }
  };

  const handleDeleteGame = async (gameId) => {
    if (window.confirm("Spiel wirklich löschen?")) {
      try {
        await axios.delete(`${API}/games/${gameId}`);
        loadGames();
      } catch (error) {
        console.error("Fehler beim Löschen des Spiels:", error);
      }
    }
  };

  // Movie Series functions
  const handleSaveSeries = async (seriesData) => {
    try {
      if (selectedSeries) {
        await axios.put(`${API}/movie-series/${selectedSeries.id}`, seriesData);
      } else {
        await axios.post(`${API}/movie-series`, seriesData);
      }
      loadMovieSeries();
      setIsSeriesModalOpen(false);
      setSelectedSeries(null);
    } catch (error) {
      console.error("Fehler beim Speichern der Filmreihe:", error);
    }
  };

  const handleDeleteSeries = async (seriesId) => {
    if (window.confirm("Filmreihe wirklich löschen?")) {
      try {
        await axios.delete(`${API}/movie-series/${seriesId}`);
        loadMovieSeries();
      } catch (error) {
        console.error("Fehler beim Löschen der Filmreihe:", error);
      }
    }
  };

  const handleAddMovieToSeries = async (seriesId, movie) => {
    try {
      await axios.post(`${API}/movie-series/${seriesId}/movies`, movie);
      loadMovieSeries();
    } catch (error) {
      console.error("Fehler beim Hinzufügen des Films:", error);
    }
  };

  return (
    <div className="min-h-screen bg-gray-900">
      <div className="container mx-auto px-4 py-8">
        <header className="text-center mb-8">
          <h1 className="text-4xl font-bold text-white mb-2">🎮 Meine Gaming & Film Sammlung</h1>
          <p className="text-gray-400">Organisiere deine Spiele und Filme an einem Ort</p>
        </header>

        {/* Tab Navigation */}
        <div className="flex justify-center mb-8">
          <div className="flex bg-gray-800 rounded-lg p-1">
            <button
              onClick={() => setActiveTab("games")}
              className={`px-6 py-3 rounded-md transition-colors ${
                activeTab === "games"
                  ? "bg-blue-600 text-white"
                  : "text-gray-400 hover:text-white"
              }`}
            >
              🎮 Spiele
            </button>
            <button
              onClick={() => setActiveTab("movies")}
              className={`px-6 py-3 rounded-md transition-colors ${
                activeTab === "movies"
                  ? "bg-blue-600 text-white"
                  : "text-gray-400 hover:text-white"
              }`}
            >
              🎬 Filme & Serien
            </button>
          </div>
        </div>

        {/* Games Tab */}
        {activeTab === "games" && (
          <div>
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-white">Meine Spiele ({games.length})</h2>
              <button
                onClick={() => {
                  setSelectedGame(null);
                  setIsGameModalOpen(true);
                }}
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded flex items-center"
              >
                ➕ Neues Spiel
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {games.map((game) => (
                <GameCard
                  key={game.id}
                  game={game}
                  onEdit={(game) => {
                    setSelectedGame(game);
                    setIsGameModalOpen(true);
                  }}
                  onDelete={handleDeleteGame}
                />
              ))}
            </div>

            {games.length === 0 && (
              <div className="text-center py-12">
                <p className="text-gray-400 text-lg">Noch keine Spiele hinzugefügt</p>
                <button
                  onClick={() => setIsGameModalOpen(true)}
                  className="mt-4 bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded"
                >
                  Erstes Spiel hinzufügen
                </button>
              </div>
            )}
          </div>
        )}

        {/* Movies Tab */}
        {activeTab === "movies" && (
          <div>
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-white">Meine Filme & Serien ({movieSeries.length})</h2>
              <button
                onClick={() => {
                  setSelectedSeries(null);
                  setIsSeriesModalOpen(true);
                }}
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded flex items-center"
              >
                ➕ Neue Filmreihe
              </button>
            </div>

            <div className="space-y-4">
              {movieSeries.map((series) => (
                <MovieSeriesCard
                  key={series.id}
                  series={series}
                  onEdit={(series) => {
                    setSelectedSeries(series);
                    setIsSeriesModalOpen(true);
                  }}
                  onDelete={handleDeleteSeries}
                  onAddMovie={(series) => {
                    setSelectedSeries(series);
                    setIsAddMovieModalOpen(true);
                  }}
                />
              ))}
            </div>

            {movieSeries.length === 0 && (
              <div className="text-center py-12">
                <p className="text-gray-400 text-lg">Noch keine Filmreihen hinzugefügt</p>
                <button
                  onClick={() => setIsSeriesModalOpen(true)}
                  className="mt-4 bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded"
                >
                  Erste Filmreihe hinzufügen
                </button>
              </div>
            )}
          </div>
        )}

        {/* Modals */}
        <GameModal
          game={selectedGame}
          isOpen={isGameModalOpen}
          onClose={() => {
            setIsGameModalOpen(false);
            setSelectedGame(null);
          }}
          onSave={handleSaveGame}
        />

        <MovieSeriesModal
          series={selectedSeries}
          isOpen={isSeriesModalOpen}
          onClose={() => {
            setIsSeriesModalOpen(false);
            setSelectedSeries(null);
          }}
          onSave={handleSaveSeries}
        />

        <AddMovieModal
          series={selectedSeries}
          isOpen={isAddMovieModalOpen}
          onClose={() => {
            setIsAddMovieModalOpen(false);
            setSelectedSeries(null);
          }}
          onSave={handleAddMovieToSeries}
        />
      </div>
    </div>
  );
}

export default App;