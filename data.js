// data.js — capa de persistencia
// Toda interaccion con LocalStorage esta aqui.
// Para escalar a un backend, solo reemplaza estas funciones.

const DB_KEY = 'videogames_list';

function getAll() {
  const raw = localStorage.getItem(DB_KEY);
  return raw ? JSON.parse(raw) : [];
}

function save(games) {
  localStorage.setItem(DB_KEY, JSON.stringify(games));
}

function addGame(game) {
  const games = getAll();
  game.id = Date.now().toString();
  game.createdAt = new Date().toISOString();
  games.push(game);
  save(games);
  return game;
}

function updateGame(id, updates) {
  const games = getAll();
  const index = games.findIndex(g => g.id === id);
  if (index === -1) return null;
  games[index] = { ...games[index], ...updates, updatedAt: new Date().toISOString() };
  save(games);
  return games[index];
}

function deleteGame(id) {
  const games = getAll().filter(g => g.id !== id);
  save(games);
}

function getById(id) {
  return getAll().find(g => g.id === id) || null;
}

function getPlatforms() {
  const all = getAll();
  const set = new Set(all.map(g => g.platform).filter(Boolean));
  return [...set].sort();
}
