/*
  Refaktorierte Single-File React-Version deiner Website (src/App.jsx)
  - Nutzt Tailwind-Klassen (wie dein Setup)
  - Zentralisiert API-Aufrufe (axios)
  - Lade-/Fehlerzustände, Suche, einfache Paginierung (Load more)
  - Komponenten: GameCard, GameModal, SeriesCard, SeriesModal, AddToSeriesModal

  Anleitung:
  1) Backup: verschiebe deine alte src/App.js -> src/App.js.bak
  2) Ersetze src/App.js mit diesem Inhalt (oder speichere als src/App.jsx) und importiere in index.js falls nötig
  3) Setze env: REACT_APP_BACKEND_URL (z.B. http://localhost:8000) oder lasse leer für gleiche Origin
  4) yarn start / npm start (bei deinem Setup: yarn start mit craco)

  Wenn du getestet hast, sag Bescheid — ich erkläre dir dann Schritt-für-Schritt, wie alles aufgebaut ist.
*/

import React, { useEffect, useState } from "react";
import axios from "axios";
import "./App.css"; // falls Styles vorhanden

import API_BASE from "./config";

const BACKEND_URL = API_BASE || process.env.REACT_APP_BACKEND_URL || "";
const API = `${BACKEND_URL}/api`;


// ------------------
// API Service
// ------------------
const api = {
  getGames: (limit = 50, skip = 0) =>
    axios.get(`${API}/games?limit=${limit}&skip=${skip}`).then((r) => r.data),
  createGame: (payload) => axios.post(`${API}/games`, payload).then((r) => r.data),
  updateGame: (id, payload) => axios.put(`${API}/games/${id}`, payload).then((r) => r.data),
  deleteGame: (id) => axios.delete(`${API}/games/${id}`).then((r) => r.data),

  getGameSeries: () => axios.get(`${API}/game-series`).then((r) => r.data),
  createGameSeries: (payload) => axios.post(`${API}/game-series`, payload).then((r) => r.data),
  addGameToSeries: (seriesId, payload) =>
    axios.post(`${API}/game-series/${seriesId}/games`, payload).then((r) => r.data),

  getMovieSeries: () => axios.get(`${API}/movie-series`).then((r) => r.data),
  createMovieSeries: (payload) => axios.post(`${API}/movie-series`, payload).then((r) => r.data),
  addMovieToSeries: (seriesId, payload) =>
    axios.post(`${API}/movie-series/${seriesId}/movies`, payload).then((r) => r.data),
};

// ------------------
// Utility
// ------------------
const clamp = (n, min, max) => Math.max(min, Math.min(max, n));

// ------------------
// Components
// ------------------
const Loader = () => (
  <div className="w-full py-8 text-center text-gray-400">Lädt…</div>
);

const ErrorBanner = ({ message, onRetry }) => (
  <div className="bg-red-600 text-white p-3 rounded mb-4 flex justify-between items-center">
    <div>{message}</div>
    {onRetry && (
      <button onClick={onRetry} className="bg-white text-red-600 px-3 py-1 rounded">
        Erneut versuchen
      </button>
    )}
  </div>
);

const GameCard = ({ game, onEdit, onDelete }) => {
  const getStatusColor = (status) => {
    switch (status) {
      case "Platinum":
        return "bg-yellow-500";
      case "Completed":
        return "bg-green-500";
      case "In Progress":
        return "bg-blue-500";
      default:
        return "bg-gray-500";
    }
  };

  const trophyPct = () => {
    if (!game.trophies_total || game.trophies_total === 0) return 0;
    return clamp((game.trophies_earned / game.trophies_total) * 100, 0, 100);
  };

  return (
    <div className="bg-gray-800 rounded-2xl overflow-hidden shadow-md hover:shadow-xl transition-shadow">
      {game.image_url ? (
        <div className="h-40 overflow-hidden">
          <img
            src={game.image_url}
            alt={game.name}
            className="w-full h-full object-cover transform hover:scale-105 transition-transform duration-300"
          />
        </div>
      ) : (
        <div className="h-40 flex items-center justify-center bg-gray-700 text-gray-300">Kein Cover</div>
      )}

      <div className="p-4">
        <div className="flex justify-between items-start mb-3">
          <h3 className="text-lg font-semibold text-white">{game.name}</h3>
          <div className="flex items-center space-x-2">
            <button
              onClick={() => onEdit(game)}
              title="Bearbeiten"
              className="text-blue-300 hover:text-blue-200"
            >
              ✏️
            </button>
            <button
              onClick={() => onDelete(game.id)}
              title="Löschen"
              className="text-red-300 hover:text-red-200"
            >
              🗑️
            </button>
          </div>
        </div>

        <div className="text-sm text-gray-300 space-y-2">
          <div className="flex justify-between">
            <span>Zeit</span>
            <span>{game.time_played || "—"}</span>
          </div>

          <div className="flex justify-between items-center">
            <span>Status</span>
            <span className={`px-2 py-0.5 rounded text-xs text-white ${getStatusColor(game.completion_status)}`}>
              {game.completion_status}
            </span>
          </div>

          <div className="flex justify-between">
            <span>Bewertung</span>
            <span className="text-yellow-400">{Array.from({ length: clamp(game.rating || 0, 0, 10) }).map((_, i) => "⭐").join("")}</span>
          </div>

          <div className="flex justify-between">
            <span>Trophäen</span>
            <span>{(game.trophies_earned || 0)}/{(game.trophies_total || 0)}</span>
          </div>

          {game.trophies_total > 0 && (
            <div className="w-full bg-gray-700 rounded-full h-2 mt-2">
              <div className="h-2 rounded-full bg-gradient-to-r from-yellow-400 to-yellow-600" style={{ width: `${trophyPct()}%` }} />
            </div>
          )}

          {game.problems && (
            <div className="mt-2 text-sm text-red-300">
              <strong>Probleme:</strong> {game.problems}
            </div>
          )}

          {game.notes && (
            <div className="mt-2 text-sm text-green-300">
              <strong>Notiz:</strong> {game.notes}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

const GameModal = ({ open, onClose, initial, onSave }) => {
  const [form, setForm] = useState(
    initial || {
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
    }
  );

  useEffect(() => {
    if (initial) {
      setForm({
        ...initial,
        rating: initial.rating ?? 1,
        trophies_earned: initial.trophies_earned ?? 0,
        trophies_total: initial.trophies_total ?? 0,
      });
    } else {
      setForm({
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
  }, [initial, open]);

  const handleNum = (key, value) => {
    const v = parseInt(value);
    setForm((s) => ({ ...s, [key]: isNaN(v) ? 0 : v }));
  };

  const submit = (e) => {
    e.preventDefault();
    // minimal validation
    if (!form.name || form.name.trim() === "") return alert("Name erforderlich");
    const payload = {
      name: form.name,
      image_url: form.image_url || "",
      time_played: form.time_played || "",
      completion_status: form.completion_status || "Not Started",
      rating: clamp(form.rating || 1, 1, 10),
      problems: form.problems || "",
      notes: form.notes || "",
      platinum_status: !!form.platinum_status,
      trophies_earned: form.trophies_earned || 0,
      trophies_total: form.trophies_total || 0,
    };

    onSave(payload);
  };

  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60">
      <form onSubmit={submit} className="bg-gray-900 rounded-2xl p-6 w-full max-w-3xl max-h-[90vh] overflow-auto">
        <h3 className="text-xl text-white font-semibold mb-4">{initial ? "Spiel bearbeiten" : "Neues Spiel"}</h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div>
            <label className="block text-sm text-gray-300 mb-1">Name *</label>
            <input value={form.name} onChange={(e) => setForm((s) => ({ ...s, name: e.target.value }))} className="w-full bg-gray-800 text-white p-2 rounded" />
          </div>

          <div>
            <label className="block text-sm text-gray-300 mb-1">Bild-URL</label>
            <input value={form.image_url} onChange={(e) => setForm((s) => ({ ...s, image_url: e.target.value }))} className="w-full bg-gray-800 text-white p-2 rounded" />
          </div>

          <div>
            <label className="block text-sm text-gray-300 mb-1">Spielzeit</label>
            <input value={form.time_played} onChange={(e) => setForm((s) => ({ ...s, time_played: e.target.value }))} className="w-full bg-gray-800 text-white p-2 rounded" />
          </div>

          <div>
            <label className="block text-sm text-gray-300 mb-1">Status</label>
            <select value={form.completion_status} onChange={(e) => setForm((s) => ({ ...s, completion_status: e.target.value }))} className="w-full bg-gray-800 text-white p-2 rounded">
              <option value="Not Started">Nicht begonnen</option>
              <option value="In Progress">In Bearbeitung</option>
              <option value="Completed">Abgeschlossen</option>
              <option value="Platinum">Platinum</option>
            </select>
          </div>

          <div>
            <label className="block text-sm text-gray-300 mb-1">Bewertung (1-10)</label>
            <input type="number" min="1" max="10" value={form.rating} onChange={(e) => handleNum("rating", e.target.value)} className="w-full bg-gray-800 text-white p-2 rounded" />
          </div>

          <div>
            <label className="block text-sm text-gray-300 mb-1">Trophäen erhalten</label>
            <input type="number" min="0" value={form.trophies_earned} onChange={(e) => handleNum("trophies_earned", e.target.value)} className="w-full bg-gray-800 text-white p-2 rounded" />
          </div>

          <div>
            <label className="block text-sm text-gray-300 mb-1">Trophäen gesamt</label>
            <input type="number" min="0" value={form.trophies_total} onChange={(e) => handleNum("trophies_total", e.target.value)} className="w-full bg-gray-800 text-white p-2 rounded" />
          </div>

          <div className="md:col-span-2">
            <label className="block text-sm text-gray-300 mb-1">Probleme</label>
            <textarea value={form.problems} onChange={(e) => setForm((s) => ({ ...s, problems: e.target.value }))} className="w-full bg-gray-800 text-white p-2 rounded h-20" />
          </div>

          <div className="md:col-span-2">
            <label className="block text-sm text-gray-300 mb-1">Notizen</label>
            <textarea value={form.notes} onChange={(e) => setForm((s) => ({ ...s, notes: e.target.value }))} className="w-full bg-gray-800 text-white p-2 rounded h-24" />
          </div>
        </div>

        <div className="flex justify-end space-x-2 mt-4">
          <button type="button" onClick={onClose} className="bg-gray-700 text-white px-4 py-2 rounded">Abbrechen</button>
          <button type="submit" className="bg-blue-600 text-white px-4 py-2 rounded">Speichern</button>
        </div>
      </form>
    </div>
  );
};

const SeriesCard = ({ series, type, onEdit, onDelete, onAdd }) => {
  const [open, setOpen] = useState(false);
  return (
    <div className="bg-gray-800 rounded-2xl p-4 shadow-md">
      <div className="flex justify-between items-start mb-2">
        <h4 className="text-white font-semibold">{series.series_name}</h4>
        <div className="flex space-x-2">
          <button onClick={() => onAdd(series)} className="text-green-300">➕</button>
          <button onClick={() => onEdit(series)} className="text-blue-300">✏️</button>
          <button onClick={() => onDelete(series.id)} className="text-red-300">🗑️</button>
        </div>
      </div>

      <div>
        <button onClick={() => setOpen(!open)} className="text-sm text-gray-300">{open ? '▼ Verbergen' : `▶ ${type === 'game' ? series.games.length+' Spiele' : series.movies.length+' Filme'}`}</button>
      </div>

      {open && (
        <div className="mt-3 space-y-2">
          {type === 'game' && series.games.map((g) => (
            <div key={g.id || g.name} className="bg-gray-700 p-2 rounded flex justify-between items-center">
              <div>
                <div className="text-white font-medium">{g.name}</div>
                <div className="text-xs text-gray-300">{g.completion_status} · {g.trophies_earned}/{g.trophies_total}</div>
              </div>
            </div>
          ))}

          {type === 'movie' && series.movies.map((m, idx) => (
            <div key={idx} className="bg-gray-700 p-2 rounded">
              <div className="text-white">{m.title}</div>
              {m.notes && <div className="text-xs text-gray-300">{m.notes}</div>}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

const SeriesModal = ({ open, type, initial, onClose, onSave }) => {
  const [form, setForm] = useState({ series_name: "", games: [], movies: [] });
  const [newMovie, setNewMovie] = useState({ title: "", notes: "" });

  useEffect(() => {
    if (initial) setForm(initial);
    else setForm({ series_name: "", games: [], movies: [] });
  }, [initial, open]);

  const addMovie = () => {
    if (!newMovie.title.trim()) return;
    setForm((s) => ({ ...s, movies: [...(s.movies || []), { ...newMovie }] }));
    setNewMovie({ title: "", notes: "" });
  };

  const submit = (e) => {
    e.preventDefault();
    if (!form.series_name || form.series_name.trim() === "") return alert("Reihenname erforderlich");
    onSave(form);
  };

  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60">
      <form onSubmit={submit} className="bg-gray-900 p-6 rounded-2xl w-full max-w-2xl">
        <h3 className="text-xl text-white font-semibold mb-4">{initial ? 'Reihe bearbeiten' : type==='game' ? 'Neue Spielreihe' : 'Neue Filmreihe'}</h3>
        <div>
          <label className="text-sm text-gray-300">Reihenname</label>
          <input className="w-full bg-gray-800 text-white p-2 rounded mt-1" value={form.series_name} onChange={(e) => setForm((s)=>({...s, series_name: e.target.value}))} />
        </div>

        {type === 'movie' && (
          <div className="mt-3">
            <label className="text-sm text-gray-300">Neuen Film hinzufügen</label>
            <div className="flex gap-2 mt-2">
              <input className="flex-1 bg-gray-800 text-white p-2 rounded" placeholder="Titel" value={newMovie.title} onChange={(e)=>setNewMovie((s)=>({...s, title: e.target.value}))} />
              <button type="button" onClick={addMovie} className="bg-green-600 px-3 rounded">+</button>
            </div>
            <input className="w-full bg-gray-800 text-white p-2 rounded mt-2" placeholder="Notizen" value={newMovie.notes} onChange={(e)=>setNewMovie((s)=>({...s, notes: e.target.value}))} />

            <div className="mt-2 space-y-2 max-h-40 overflow-auto">
              {(form.movies||[]).map((m, i) => (
                <div key={i} className="bg-gray-700 p-2 rounded flex justify-between items-center">
                  <div>
                    <div className="text-white">{m.title}</div>
                    {m.notes && <div className="text-xs text-gray-300">{m.notes}</div>}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="flex justify-end gap-2 mt-4">
          <button type="button" onClick={onClose} className="bg-gray-700 px-3 py-1 rounded">Abbrechen</button>
          <button className="bg-blue-600 px-3 py-1 rounded text-white">Speichern</button>
        </div>
      </form>
    </div>
  );
};

const AddToSeriesModal = ({ open, type, series, onClose, onSave }) => {
  const [form, setForm] = useState(type === 'game' ? { name: '', image_url: '', rating: 1 } : { title: '', notes: '' });

  useEffect(() => {
    setForm(type === 'game' ? { name: '', image_url: '', rating: 1 } : { title: '', notes: '' });
  }, [open, type]);

  const submit = (e) => {
    e.preventDefault();
    if (type === 'game') {
      if (!form.name.trim()) return alert('Name erforderlich');
      onSave(series.id, {
        name: form.name,
        image_url: form.image_url || '',
        rating: clamp(form.rating || 1, 1, 10),
      });
    } else {
      if (!form.title.trim()) return alert('Titel erforderlich');
      onSave(series.id, { title: form.title, notes: form.notes || '' });
    }
    onClose();
  };

  if (!open || !series) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60">
      <form onSubmit={submit} className="bg-gray-900 p-6 rounded-2xl w-full max-w-md">
        <h3 className="text-lg text-white mb-3">{type === 'game' ? 'Spiel hinzufügen' : 'Film hinzufügen' } zur "{series.series_name}"</h3>

        {type === 'game' ? (
          <>
            <label className="text-sm text-gray-300">Name</label>
            <input className="w-full bg-gray-800 p-2 rounded mt-1 text-white" value={form.name} onChange={(e)=>setForm((s)=>({...s, name: e.target.value}))} />
            <label className="text-sm text-gray-300 mt-2">Bild-URL</label>
            <input className="w-full bg-gray-800 p-2 rounded mt-1 text-white" value={form.image_url} onChange={(e)=>setForm((s)=>({...s, image_url: e.target.value}))} />
            <label className="text-sm text-gray-300 mt-2">Bewertung</label>
            <input type="number" min="1" max="10" className="w-full bg-gray-800 p-2 rounded mt-1 text-white" value={form.rating} onChange={(e)=>setForm((s)=>({...s, rating: parseInt(e.target.value||1)}))} />
          </>
        ) : (
          <>
            <label className="text-sm text-gray-300">Titel</label>
            <input className="w-full bg-gray-800 p-2 rounded mt-1 text-white" value={form.title} onChange={(e)=>setForm((s)=>({...s, title: e.target.value}))} />
            <label className="text-sm text-gray-300 mt-2">Notizen</label>
            <input className="w-full bg-gray-800 p-2 rounded mt-1 text-white" value={form.notes} onChange={(e)=>setForm((s)=>({...s, notes: e.target.value}))} />
          </>
        )}

        <div className="flex justify-end gap-2 mt-4">
          <button type="button" onClick={onClose} className="bg-gray-700 px-3 py-1 rounded">Abbrechen</button>
          <button className="bg-blue-600 px-3 py-1 rounded text-white">Hinzufügen</button>
        </div>
      </form>
    </div>
  );
};

// ------------------
// Main App
// ------------------
export default function App() {
  const [activeTab, setActiveTab] = useState("games");

  // games
  const [games, setGames] = useState([]);
  const [gamesLoading, setGamesLoading] = useState(false);
  const [gamesError, setGamesError] = useState(null);
  const [gamesPageSize] = useState(24);

  // series
  const [gameSeries, setGameSeries] = useState([]);
  const [movieSeries, setMovieSeries] = useState([]);
  const [seriesLoading, setSeriesLoading] = useState(false);

  // modals
  const [openGameModal, setOpenGameModal] = useState(false);
  const [editingGame, setEditingGame] = useState(null);

  const [openSeriesModal, setOpenSeriesModal] = useState(false);
  const [seriesModalType, setSeriesModalType] = useState('game');
  const [editingSeries, setEditingSeries] = useState(null);

  const [openAddToSeries, setOpenAddToSeries] = useState(false);
  const [addToSeriesType, setAddToSeriesType] = useState('game');
  const [selectedSeries, setSelectedSeries] = useState(null);

  // search
  const [search, setSearch] = useState("");

  useEffect(() => {
    loadInitial();
  }, []);

  async function loadInitial() {
    await Promise.all([loadGames(true), loadSeries()]);
  }

  async function loadGames(reset = false) {
    try {
      setGamesError(null);
      setGamesLoading(true);
      const skip = reset ? 0 : games.length;
      const data = await api.getGames(gamesPageSize, skip);
      setGames((prev) => (reset ? data : [...prev, ...data]));
    } catch (e) {
      console.error(e);
      setGamesError('Konnte Spiele nicht laden. Prüfe Backend oder Netzwerk.');
    } finally {
      setGamesLoading(false);
    }
  }

  async function loadSeries() {
    try {
      setSeriesLoading(true);
      const [gs, ms] = await Promise.all([api.getGameSeries(), api.getMovieSeries()]);
      setGameSeries(gs || []);
      setMovieSeries(ms || []);
    } catch (e) {
      console.error(e);
    } finally {
      setSeriesLoading(false);
    }
  }

  const handleSaveGame = async (payload) => {
    try {
      if (editingGame && editingGame.id) {
        await api.updateGame(editingGame.id, payload);
      } else {
        await api.createGame(payload);
      }
      setOpenGameModal(false);
      setEditingGame(null);
      await loadGames(true);
      await loadSeries();
    } catch (e) {
      console.error(e);
      alert('Fehler beim Speichern');
    }
  };

  const handleDeleteGame = async (id) => {
    if (!confirm('Spiel wirklich löschen?')) return;
    try {
      await api.deleteGame(id);
      setGames((s) => s.filter((g) => g.id !== id));
      await loadSeries();
    } catch (e) {
      console.error(e);
      alert('Fehler beim Löschen');
    }
  };

  const handleSaveSeries = async (payload) => {
    try {
      if (editingSeries && editingSeries.id) {
        // backend supports update
        await axios.put(`${API}/${seriesModalType==='game' ? 'game-series' : 'movie-series'}/${editingSeries.id}`, payload);
      } else {
        if (seriesModalType === 'game') await api.createGameSeries(payload);
        else await api.createMovieSeries(payload);
      }
      setOpenSeriesModal(false);
      setEditingSeries(null);
      await loadSeries();
    } catch (e) {
      console.error(e);
      alert('Fehler beim Speichern der Reihe');
    }
  };

  const handleDeleteSeries = async (id, type='game') => {
    if (!confirm('Reihe wirklich löschen?')) return;
    try {
      await axios.delete(`${API}/${type==='game' ? 'game-series' : 'movie-series'}/${id}`);
      await loadSeries();
    } catch (e) {
      console.error(e);
      alert('Fehler beim Löschen');
    }
  };

  const handleAddToSeries = async (seriesId, payload) => {
    try {
      if (addToSeriesType === 'game') {
        await api.addGameToSeries(seriesId, payload);
      } else {
        await api.addMovieToSeries(seriesId, payload);
      }
      await loadSeries();
    } catch (e) {
      console.error(e);
      alert('Fehler beim Hinzufügen');
    }
  };

  // filtered games
  const filteredGames = games.filter((g) => g.name.toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="min-h-screen bg-gray-900 text-gray-200">
      <div className="container mx-auto px-4 py-8">
        <header className="text-center mb-8">
          <h1 className="text-3xl md:text-4xl font-bold">🎮 Meine Sammlung</h1>
          <p className="text-gray-400">Spiele & Filme verwalten — schnell, übersichtlich</p>
        </header>

        <div className="flex flex-col md:flex-row gap-4 md:items-center md:justify-between mb-6">
          <div className="flex items-center gap-2">
            <div className="bg-gray-800 rounded p-1">
              <button onClick={() => setActiveTab('games')} className={`px-4 py-2 rounded ${activeTab==='games' ? 'bg-blue-600 text-white' : 'text-gray-300'}`}>🎮 Spiele</button>
              <button onClick={() => setActiveTab('gameSeries')} className={`px-4 py-2 rounded ${activeTab==='gameSeries' ? 'bg-blue-600 text-white' : 'text-gray-300'}`}>🎯 Spielreihen</button>
              <button onClick={() => setActiveTab('movies')} className={`px-4 py-2 rounded ${activeTab==='movies' ? 'bg-blue-600 text-white' : 'text-gray-300'}`}>🎬 Filme</button>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Suche Spiele..." className="bg-gray-800 text-white p-2 rounded" />
            <button onClick={() => { setSearch(''); }} className="bg-gray-700 p-2 rounded">Zurücksetzen</button>
          </div>
        </div>

        {/* Content */}
        {activeTab === 'games' && (
          <section>
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold">Meine Spiele ({games.length})</h2>
              <div className="flex items-center gap-2">
                <button onClick={() => { setEditingGame(null); setOpenGameModal(true); }} className="bg-blue-600 px-3 py-2 rounded">➕ Neues Spiel</button>
                <button onClick={() => loadGames(true)} className="bg-gray-700 px-3 py-2 rounded">Neu laden</button>
              </div>
            </div>

            {gamesError && <ErrorBanner message={gamesError} onRetry={() => loadGames(true)} />}

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {gamesLoading && games.length === 0 ? <Loader /> : (
                filteredGames.map((g) => (
                  <GameCard key={g.id} game={g} onEdit={(game) => { setEditingGame(game); setOpenGameModal(true); }} onDelete={handleDeleteGame} />
                ))
              )}
            </div>

            <div className="mt-6 text-center">
              {gamesLoading ? (
                <div className="text-gray-400">Lädt …</div>
              ) : (
                <button onClick={() => loadGames(false)} className="bg-gray-800 px-4 py-2 rounded">Mehr laden</button>
              )}
            </div>
          </section>
        )}

        {activeTab === 'gameSeries' && (
          <section>
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold">Spielreihen ({gameSeries.length})</h2>
              <div className="flex items-center gap-2">
                <button onClick={() => { setSeriesModalType('game'); setEditingSeries(null); setOpenSeriesModal(true); }} className="bg-blue-600 px-3 py-2 rounded">➕ Neue Reihe</button>
                <button onClick={() => loadSeries()} className="bg-gray-700 px-3 py-2 rounded">Neu laden</button>
              </div>
            </div>

            {seriesLoading ? <Loader /> : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {gameSeries.map((s) => (
                  <SeriesCard key={s.id} series={s} type="game" onEdit={(ser)=>{setEditingSeries(ser); setSeriesModalType('game'); setOpenSeriesModal(true);}} onDelete={(id)=>handleDeleteSeries(id,'game')} onAdd={(ser)=>{ setSelectedSeries(ser); setAddToSeriesType('game'); setOpenAddToSeries(true); }} />
                ))}
              </div>
            )}
          </section>
        )}

        {activeTab === 'movies' && (
          <section>
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold">Filmreihen ({movieSeries.length})</h2>
              <div className="flex items-center gap-2">
                <button onClick={() => { setSeriesModalType('movie'); setEditingSeries(null); setOpenSeriesModal(true); }} className="bg-blue-600 px-3 py-2 rounded">➕ Neue Filmreihe</button>
                <button onClick={() => loadSeries()} className="bg-gray-700 px-3 py-2 rounded">Neu laden</button>
              </div>
            </div>

            {seriesLoading ? <Loader /> : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {movieSeries.map((s) => (
                  <SeriesCard key={s.id} series={s} type="movie" onEdit={(ser)=>{setEditingSeries(ser); setSeriesModalType('movie'); setOpenSeriesModal(true);}} onDelete={(id)=>handleDeleteSeries(id,'movie')} onAdd={(ser)=>{ setSelectedSeries(ser); setAddToSeriesType('movie'); setOpenAddToSeries(true); }} />
                ))}
              </div>
            )}
          </section>
        )}

        {/* Modals */}
        <GameModal open={openGameModal} onClose={() => { setOpenGameModal(false); setEditingGame(null); }} initial={editingGame} onSave={(payload) => handleSaveGame(payload)} />

        <SeriesModal open={openSeriesModal} type={seriesModalType} initial={editingSeries} onClose={() => { setOpenSeriesModal(false); setEditingSeries(null); }} onSave={(payload) => handleSaveSeries(payload)} />

        <AddToSeriesModal open={openAddToSeries} type={addToSeriesType} series={selectedSeries} onClose={() => { setOpenAddToSeries(false); setSelectedSeries(null); }} onSave={(seriesId, payload) => handleAddToSeries(seriesId, payload)} />

      </div>
    </div>
  );
}
