import React, { useState, useEffect } from "react";
import "./App.css";
import axios from "axios";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

// Sample game images for users to choose from
const SAMPLE_GAME_IMAGES = [
  "https://images.unsplash.com/photo-1543622748-5ee7237e8565?crop=entropy&cs=srgb&fm=jpg&ixid=M3w3NTY2NjZ8MHwxfHNlYXJjaHwxfHx2aWRlbyUyMGdhbWUlMjBjb3ZlcnN8ZW58MHx8fHwxNzU0OTYwMTk5fDA&ixlib=rb-4.1.0&q=85",
  "https://images.unsplash.com/photo-1580327332925-a10e6cb11baa?crop=entropy&cs=srgb&fm=jpg&ixid=M3w3NTY2NjZ8MHwxfHNlYXJjaHwyfHx2aWRlbyUyMGdhbWUlMjBjb3ZlcnN8ZW58MHx8fHwxNzU0OTYwMTk5fDA&ixlib=rb-4.1.0&q=85",
  "https://images.unsplash.com/photo-1553931122-eb3db723739f?crop=entropy&cs=srgb&fm=jpg&ixid=M3w3NTY2NjZ8MHwxfHNlYXJjaHwzfHx2aWRlbyUyMGdhbWUlMjBjb3ZlcnN8ZW58MHx8fHwxNzU0OTYwMTk5fDA&ixlib=rb-4.1.0&q=85",
  "https://images.unsplash.com/photo-1542751371-adc38448a05e?crop=entropy&cs=srgb&fm=jpg&ixid=M3w3NDk1Nzd8MHwxfHNlYXJjaHwxfHxnYW1pbmd8ZW58MHx8fHwxNzU0ODYwOTM3fDA&ixlib=rb-4.1.0&q=85",
  "https://images.unsplash.com/photo-1593305841991-05c297ba4575?crop=entropy&cs=srgb&fm=jpg&ixid=M3w3NDk1Nzd8MHwxfHNlYXJjaHwzfHxnYW1pbmd8ZW58MHx8fHwxNzU0ODYwOTM3fDA&ixlib=rb-4.1.0&q=85",
  "https://images.pexels.com/photos/7773547/pexels-photo-7773547.jpeg"
];

// Game Component with Image
const GameCard = ({ game, onEdit, onDelete }) => {
  const getStatusColor = (status) => {
    switch (status) {
      case "Platinum": return "bg-yellow-500";
      case "Completed": return "bg-green-500";
      case "In Progress": return "bg-blue-500";
      default: return "bg-gray-500";
    }
  };

  const getTrophyProgress = () => {
    if (game.trophies_total === 0) return 0;
    return (game.trophies_earned / game.trophies_total) * 100;
  };

  return (
    <div className="bg-gray-800 rounded-lg overflow-hidden shadow-lg hover:shadow-xl transition-shadow">
      {/* Game Image */}
      {game.image_url && (
        <div className="h-48 overflow-hidden">
          <img 
            src={game.image_url} 
            alt={game.name}
            className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
          />
        </div>
      )}
      
      <div className="p-6">
        <div className="flex justify-between items-start mb-4">
          <h3 className="text-xl font-bold text-white">{game.name}</h3>
          <div className="flex space-x-2">
            <button
              onClick={() => onEdit(game)}
              className="text-blue-400 hover:text-blue-300"
              title="Bearbeiten"
            >
              ✏️
            </button>
            <button
              onClick={() => onDelete(game.id)}
              className="text-red-400 hover:text-red-300"
              title="Löschen"
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
          <div className="space-y-1">
            <div className="flex justify-between">
              <span>Trophäen:</span>
              <span>{game.trophies_earned}/{game.trophies_total}</span>
            </div>
            {game.trophies_total > 0 && (
              <div className="w-full bg-gray-700 rounded-full h-2">
                <div 
                  className="bg-gradient-to-r from-yellow-400 to-yellow-600 h-2 rounded-full transition-all duration-500"
                  style={{ width: `${getTrophyProgress()}%` }}
                />
              </div>
            )}
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
    </div>
  );
};

// Game Form Modal with Image Selection
const GameModal = ({ game, isOpen, onClose, onSave }) => {
  const [formData, setFormData] = useState({
    name: "",
    image_url: "",
    time_played: "",
    completion_status: "Not Started",
    rating: 1,
    problems: "",
    notes: "",
    platinum_status: false,
    trophies_earned: 0,
    trophies_total: 0,
  });

  const [showImageSelector, setShowImageSelector] = useState(false);

  useEffect(() => {
    if (game) {
      setFormData(game);
    } else {
      setFormData({
        name: "",
        image_url: "",
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

  const selectImage = (imageUrl) => {
    setFormData({...formData, image_url: imageUrl});
    setShowImageSelector(false);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-gray-900 rounded-lg p-6 w-full max-w-4xl max-h-[90vh] overflow-y-auto">
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
          
          {/* Image Selection */}
          <div>
            <label className="block text-white mb-2">Spiel-Bild</label>
            <div className="space-y-3">
              {formData.image_url && (
                <div className="flex items-center space-x-4">
                  <img 
                    src={formData.image_url} 
                    alt="Preview" 
                    className="w-24 h-24 object-cover rounded"
                  />
                  <button
                    type="button"
                    onClick={() => setFormData({...formData, image_url: ""})}
                    className="text-red-400 hover:text-red-300"
                  >
                    Bild entfernen
                  </button>
                </div>
              )}
              
              <div className="flex space-x-2">
                <input
                  type="url"
                  placeholder="Bild-URL eingeben..."
                  value={formData.image_url}
                  onChange={(e) => setFormData({...formData, image_url: e.target.value})}
                  className="flex-1 bg-gray-800 text-white p-3 rounded"
                />
                <button
                  type="button"
                  onClick={() => setShowImageSelector(!showImageSelector)}
                  className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded"
                >
                  Vorlagen
                </button>
              </div>
              
              {showImageSelector && (
                <div className="grid grid-cols-3 gap-2 p-4 bg-gray-800 rounded">
                  <p className="col-span-3 text-gray-300 text-sm mb-2">Beispielbilder auswählen:</p>
                  {SAMPLE_GAME_IMAGES.map((imageUrl, index) => (
                    <img
                      key={index}
                      src={imageUrl}
                      alt={`Sample ${index + 1}`}
                      className="w-full h-20 object-cover rounded cursor-pointer hover:opacity-75"
                      onClick={() => selectImage(imageUrl)}
                    />
                  ))}
                </div>
              )}
            </div>
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

// Game Series Component
const GameSeriesCard = ({ series, onEdit, onDelete, onAddGame }) => {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <div className="bg-gray-800 rounded-lg p-6 shadow-lg">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-xl font-bold text-white cursor-pointer" 
            onClick={() => setIsExpanded(!isExpanded)}>
          🎮 {series.series_name} ({series.games.length} Spiele)
          <span className="ml-2">{isExpanded ? "▼" : "▶"}</span>
        </h3>
        <div className="flex space-x-2">
          <button
            onClick={() => onAddGame(series)}
            className="text-green-400 hover:text-green-300"
            title="Spiel hinzufügen"
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
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {series.games.map((game, index) => (
            <div key={index} className="bg-gray-700 rounded-lg overflow-hidden">
              {game.image_url && (
                <img 
                  src={game.image_url} 
                  alt={game.name}
                  className="w-full h-32 object-cover"
                />
              )}
              <div className="p-3">
                <h4 className="text-white font-medium">{game.name}</h4>
                <div className="text-sm text-gray-300 mt-1">
                  <div className="flex justify-between">
                    <span>Status:</span>
                    <span>{game.completion_status}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Bewertung:</span>
                    <span>{"⭐".repeat(game.rating)}</span>
                  </div>
                  {game.trophies_total > 0 && (
                    <div className="flex justify-between">
                      <span>Trophäen:</span>
                      <span>{game.trophies_earned}/{game.trophies_total}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
          {series.games.length === 0 && (
            <div className="col-span-full text-center py-8">
              <p className="text-gray-400">Keine Spiele in dieser Reihe</p>
            </div>
          )}
        </div>
      )}
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
          🎬 {series.series_name} ({series.movies.length} Filme)
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

// Game Series Modal
const GameSeriesModal = ({ series, isOpen, onClose, onSave }) => {
  const [formData, setFormData] = useState({
    series_name: "",
    games: [],
  });

  useEffect(() => {
    if (series) {
      setFormData(series);
    } else {
      setFormData({ series_name: "", games: [] });
    }
  }, [series, isOpen]);

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave(formData);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-gray-900 rounded-lg p-6 w-full max-w-2xl">
        <h2 className="text-2xl font-bold text-white mb-6">
          {series ? "Spielreihe bearbeiten" : "Neue Spielreihe"}
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
              placeholder="z.B. Grand Theft Auto"
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

// Add Movie/Game Modal
const AddToSeriesModal = ({ series, type, isOpen, onClose, onSave }) => {
  const [formData, setFormData] = useState(
    type === "game" ? {
      name: "",
      image_url: "",
      time_played: "",
      completion_status: "Not Started",
      rating: 1,
      problems: "",
      notes: "",
      platinum_status: false,
      trophies_earned: 0,
      trophies_total: 0,
    } : { title: "", notes: "" }
  );

  useEffect(() => {
    if (type === "game") {
      setFormData({
        name: "",
        image_url: "",
        time_played: "",
        completion_status: "Not Started",
        rating: 1,
        problems: "",
        notes: "",
        platinum_status: false,
        trophies_earned: 0,
        trophies_total: 0,
      });
    } else {
      setFormData({ title: "", notes: "" });
    }
  }, [isOpen, type]);

  const handleSubmit = (e) => {
    e.preventDefault();
    const isValid = type === "game" ? formData.name.trim() : formData.title.trim();
    if (isValid) {
      onSave(series.id, formData);
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-gray-900 rounded-lg p-6 w-full max-w-md max-h-[90vh] overflow-y-auto">
        <h2 className="text-xl font-bold text-white mb-4">
          {type === "game" ? "Spiel" : "Film"} zu "{series?.series_name}" hinzufügen
        </h2>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          {type === "game" ? (
            <>
              <div>
                <label className="block text-white mb-2">Spielname *</label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                  className="w-full bg-gray-800 text-white p-3 rounded"
                />
              </div>
              
              <div>
                <label className="block text-white mb-2">Bild-URL</label>
                <input
                  type="url"
                  value={formData.image_url}
                  onChange={(e) => setFormData({...formData, image_url: e.target.value})}
                  className="w-full bg-gray-800 text-white p-3 rounded"
                />
              </div>
              
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
            </>
          ) : (
            <>
              <div>
                <label className="block text-white mb-2">Filmtitel *</label>
                <input
                  type="text"
                  required
                  value={formData.title}
                  onChange={(e) => setFormData({...formData, title: e.target.value})}
                  className="w-full bg-gray-800 text-white p-3 rounded"
                />
              </div>
              
              <div>
                <label className="block text-white mb-2">Notizen</label>
                <textarea
                  value={formData.notes}
                  onChange={(e) => setFormData({...formData, notes: e.target.value})}
                  className="w-full bg-gray-800 text-white p-3 rounded h-20"
                />
              </div>
            </>
          )}
          
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
  const [gameSeries, setGameSeries] = useState([]);
  const [movieSeries, setMovieSeries] = useState([]);
  
  // Modal states
  const [isGameModalOpen, setIsGameModalOpen] = useState(false);
  const [isGameSeriesModalOpen, setIsGameSeriesModalOpen] = useState(false);
  const [isMovieSeriesModalOpen, setIsMovieSeriesModalOpen] = useState(false);
  const [isAddToSeriesModalOpen, setIsAddToSeriesModalOpen] = useState(false);
  
  // Selected items
  const [selectedGame, setSelectedGame] = useState(null);
  const [selectedGameSeries, setSelectedGameSeries] = useState(null);
  const [selectedMovieSeries, setSelectedMovieSeries] = useState(null);
  const [addToSeriesType, setAddToSeriesType] = useState("game");

  // Load data on component mount
  useEffect(() => {
    loadGames();
    loadGameSeries();
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

  const loadGameSeries = async () => {
    try {
      const response = await axios.get(`${API}/game-series`);
      setGameSeries(response.data);
    } catch (error) {
      console.error("Fehler beim Laden der Spielreihen:", error);
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

  // Game Series functions
  const handleSaveGameSeries = async (seriesData) => {
    try {
      if (selectedGameSeries) {
        await axios.put(`${API}/game-series/${selectedGameSeries.id}`, seriesData);
      } else {
        await axios.post(`${API}/game-series`, seriesData);
      }
      loadGameSeries();
      setIsGameSeriesModalOpen(false);
      setSelectedGameSeries(null);
    } catch (error) {
      console.error("Fehler beim Speichern der Spielreihe:", error);
    }
  };

  const handleDeleteGameSeries = async (seriesId) => {
    if (window.confirm("Spielreihe wirklich löschen?")) {
      try {
        await axios.delete(`${API}/game-series/${seriesId}`);
        loadGameSeries();
      } catch (error) {
        console.error("Fehler beim Löschen der Spielreihe:", error);
      }
    }
  };

  // Movie Series functions
  const handleSaveMovieSeries = async (seriesData) => {
    try {
      if (selectedMovieSeries) {
        await axios.put(`${API}/movie-series/${selectedMovieSeries.id}`, seriesData);
      } else {
        await axios.post(`${API}/movie-series`, seriesData);
      }
      loadMovieSeries();
      setIsMovieSeriesModalOpen(false);
      setSelectedMovieSeries(null);
    } catch (error) {
      console.error("Fehler beim Speichern der Filmreihe:", error);
    }
  };

  const handleDeleteMovieSeries = async (seriesId) => {
    if (window.confirm("Filmreihe wirklich löschen?")) {
      try {
        await axios.delete(`${API}/movie-series/${seriesId}`);
        loadMovieSeries();
      } catch (error) {
        console.error("Fehler beim Löschen der Filmreihe:", error);
      }
    }
  };

  const handleAddToSeries = async (seriesId, itemData) => {
    try {
      if (addToSeriesType === "game") {
        await axios.post(`${API}/game-series/${seriesId}/games`, itemData);
        loadGameSeries();
      } else {
        await axios.post(`${API}/movie-series/${seriesId}/movies`, itemData);
        loadMovieSeries();
      }
    } catch (error) {
      console.error("Fehler beim Hinzufügen:", error);
    }
  };

  return (
    <div className="min-h-screen bg-gray-900">
      <div className="container mx-auto px-4 py-8">
        <header className="text-center mb-8">
          <h1 className="text-4xl font-bold text-white mb-2">🎮 Meine Gaming & Film Sammlung</h1>
          <p className="text-gray-400">Organisiere deine Spiele, Spielreihen und Filme an einem Ort</p>
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
              onClick={() => setActiveTab("gameSeries")}
              className={`px-6 py-3 rounded-md transition-colors ${
                activeTab === "gameSeries"
                  ? "bg-blue-600 text-white"
                  : "text-gray-400 hover:text-white"
              }`}
            >
              🎯 Spielreihen
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

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
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

        {/* Game Series Tab */}
        {activeTab === "gameSeries" && (
          <div>
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-white">Meine Spielreihen ({gameSeries.length})</h2>
              <button
                onClick={() => {
                  setSelectedGameSeries(null);
                  setIsGameSeriesModalOpen(true);
                }}
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded flex items-center"
              >
                ➕ Neue Spielreihe
              </button>
            </div>

            <div className="space-y-4">
              {gameSeries.map((series) => (
                <GameSeriesCard
                  key={series.id}
                  series={series}
                  onEdit={(series) => {
                    setSelectedGameSeries(series);
                    setIsGameSeriesModalOpen(true);
                  }}
                  onDelete={handleDeleteGameSeries}
                  onAddGame={(series) => {
                    setSelectedGameSeries(series);
                    setAddToSeriesType("game");
                    setIsAddToSeriesModalOpen(true);
                  }}
                />
              ))}
            </div>

            {gameSeries.length === 0 && (
              <div className="text-center py-12">
                <p className="text-gray-400 text-lg">Noch keine Spielreihen hinzugefügt</p>
                <button
                  onClick={() => setIsGameSeriesModalOpen(true)}
                  className="mt-4 bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded"
                >
                  Erste Spielreihe hinzufügen
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
                  setSelectedMovieSeries(null);
                  setIsMovieSeriesModalOpen(true);
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
                    setSelectedMovieSeries(series);
                    setIsMovieSeriesModalOpen(true);
                  }}
                  onDelete={handleDeleteMovieSeries}
                  onAddMovie={(series) => {
                    setSelectedMovieSeries(series);
                    setAddToSeriesType("movie");
                    setIsAddToSeriesModalOpen(true);
                  }}
                />
              ))}
            </div>

            {movieSeries.length === 0 && (
              <div className="text-center py-12">
                <p className="text-gray-400 text-lg">Noch keine Filmreihen hinzugefügt</p>
                <button
                  onClick={() => setIsMovieSeriesModalOpen(true)}
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

        <GameSeriesModal
          series={selectedGameSeries}
          isOpen={isGameSeriesModalOpen}
          onClose={() => {
            setIsGameSeriesModalOpen(false);
            setSelectedGameSeries(null);
          }}
          onSave={handleSaveGameSeries}
        />

        <MovieSeriesModal
          series={selectedMovieSeries}
          isOpen={isMovieSeriesModalOpen}
          onClose={() => {
            setIsMovieSeriesModalOpen(false);
            setSelectedMovieSeries(null);
          }}
          onSave={handleSaveMovieSeries}
        />

        <AddToSeriesModal
          series={addToSeriesType === "game" ? selectedGameSeries : selectedMovieSeries}
          type={addToSeriesType}
          isOpen={isAddToSeriesModalOpen}
          onClose={() => {
            setIsAddToSeriesModalOpen(false);
            setSelectedGameSeries(null);
            setSelectedMovieSeries(null);
          }}
          onSave={handleAddToSeries}
        />
      </div>
    </div>
  );
}

export default App;