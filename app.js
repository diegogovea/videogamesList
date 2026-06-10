// app.js — logica principal de la aplicacion

// =============================================
// Estado de la UI
// =============================================
let currentView = 'grid';       // 'grid' | 'list'
let currentSearch = '';
let currentStatusFilter = '';
let currentPlatformFilter = '';
let detailGameId = null;

// =============================================
// Helpers
// =============================================
const STATUS_LABELS = {
  backlog:   'Backlog',
  playing:   'Playing',
  completed: 'Completed',
  abandoned: 'Abandoned',
};

function statusBadge(status) {
  return `<span class="status-badge status-${status}">${STATUS_LABELS[status] || status}</span>`;
}

function formatDate(dateStr) {
  if (!dateStr) return '—';
  const [y, m, d] = dateStr.split('-');
  return `${d}/${m}/${y}`;
}

function ratingStars(r) {
  return r ? `⭐ ${r}/10` : '—';
}

function coverImg(game, cssClass) {
  if (game.image) {
    return `<img src="${game.image}" alt="${game.name}" class="${cssClass}" onerror="this.style.display='none';this.nextElementSibling.style.display='flex'" />
            <div class="${cssClass}-placeholder" style="display:none">🎮</div>`;
  }
  return `<div class="${cssClass}-placeholder">🎮</div>`;
}

// =============================================
// Filtrado
// =============================================
function getFiltered() {
  let games = getAll();

  if (currentSearch) {
    const q = currentSearch.toLowerCase();
    games = games.filter(g => g.name.toLowerCase().includes(q));
  }
  if (currentStatusFilter) {
    games = games.filter(g => g.status === currentStatusFilter);
  }
  if (currentPlatformFilter) {
    games = games.filter(g => g.platform === currentPlatformFilter);
  }
  return games;
}

// =============================================
// Render: Grid
// =============================================
function renderGrid(games) {
  const container = document.getElementById('grid-view');
  if (!games.length) { container.innerHTML = ''; return; }

  container.innerHTML = games.map(g => `
    <div class="game-card" data-id="${g.id}">
      ${g.rating ? `<div class="card-rating">⭐ ${g.rating}</div>` : ''}
      ${g.image
        ? `<img src="${g.image}" class="card-cover" alt="${g.name}" onerror="this.style.display='none';this.nextElementSibling.style.display='flex'" />
           <div class="card-cover-placeholder" style="display:none">🎮</div>`
        : `<div class="card-cover-placeholder">🎮</div>`
      }
      <div class="card-info">
        <div class="card-name" title="${g.name}">${g.name}</div>
        <div class="card-meta">
          <span class="card-platform">${g.platform || ''}</span>
          ${statusBadge(g.status)}
        </div>
      </div>
    </div>
  `).join('');

  container.querySelectorAll('.game-card').forEach(card => {
    card.addEventListener('click', () => openDetail(card.dataset.id));
  });
}

// =============================================
// Render: Lista
// =============================================
function renderList(games) {
  const tbody = document.getElementById('table-body');
  if (!games.length) { tbody.innerHTML = ''; return; }

  tbody.innerHTML = games.map(g => `
    <tr data-id="${g.id}">
      <td>
        ${g.image
          ? `<img src="${g.image}" class="table-cover" alt="${g.name}" onerror="this.style.display='none';this.nextElementSibling.style.display='flex'" />
             <div class="table-cover-placeholder" style="display:none">🎮</div>`
          : `<div class="table-cover-placeholder">🎮</div>`
        }
      </td>
      <td class="table-name">${g.name}</td>
      <td>${g.platform || '—'}</td>
      <td>${statusBadge(g.status)}</td>
      <td>${ratingStars(g.rating)}</td>
      <td>${formatDate(g.startDate)}</td>
      <td>${formatDate(g.endDate)}</td>
      <td>
        <div class="table-actions" onclick="event.stopPropagation()">
          <button class="btn-icon" title="Edit" onclick="openEditModal('${g.id}')">✏️</button>
          <button class="btn-icon danger" title="Delete" onclick="confirmDelete('${g.id}')">🗑️</button>
        </div>
      </td>
    </tr>
  `).join('');

  tbody.querySelectorAll('tr').forEach(row => {
    row.addEventListener('click', () => openDetail(row.dataset.id));
  });
}

// =============================================
// Render principal (decide grid o lista)
// =============================================
function render() {
  const games = getFiltered();
  const empty = document.getElementById('empty-state');
  const grid  = document.getElementById('grid-view');
  const list  = document.getElementById('list-view');

  document.getElementById('view-count').textContent =
    `${games.length} game${games.length !== 1 ? 's' : ''}`;

  if (!games.length) {
    empty.classList.remove('hidden');
    grid.classList.add('hidden');
    list.classList.add('hidden');
    return;
  }

  empty.classList.add('hidden');

  if (currentView === 'grid') {
    grid.classList.remove('hidden');
    list.classList.add('hidden');
    renderGrid(games);
  } else {
    list.classList.remove('hidden');
    grid.classList.add('hidden');
    renderList(games);
  }

  refreshPlatformFilter();
}

// =============================================
// Filtro de plataformas dinamico
// =============================================
function refreshPlatformFilter() {
  const sel = document.getElementById('filter-platform');
  const prev = sel.value;
  const platforms = getPlatforms();

  sel.innerHTML = '<option value="">All platforms</option>' +
    platforms.map(p => `<option value="${p}">${p}</option>`).join('');

  if (platforms.includes(prev)) sel.value = prev;
}

// =============================================
// Modal: Agregar / Editar
// =============================================
function openAddModal() {
  document.getElementById('modal-title').textContent = 'Add Game';
  document.getElementById('btn-submit').textContent = 'Save Game';
  document.getElementById('game-form').reset();
  document.getElementById('form-id').value = '';
  document.getElementById('rating-display').textContent = '5';
  document.getElementById('image-preview-wrapper').classList.add('hidden');
  setImageTab('url');
  document.getElementById('modal-overlay').classList.remove('hidden');
}

function openEditModal(id) {
  const g = getById(id);
  if (!g) return;

  document.getElementById('modal-title').textContent = 'Edit Game';
  document.getElementById('btn-submit').textContent = 'Update Game';
  document.getElementById('form-id').value = g.id;
  document.getElementById('form-name').value = g.name || '';
  document.getElementById('form-platform').value = g.platform || '';
  document.getElementById('form-status').value = g.status || 'backlog';
  document.getElementById('form-rating').value = g.rating || 5;
  document.getElementById('rating-display').textContent = g.rating || 5;
  document.getElementById('form-start-date').value = g.startDate || '';
  document.getElementById('form-end-date').value = g.endDate || '';
  document.getElementById('form-comment').value = g.comment || '';

  // imagen
  if (g.image && g.image.startsWith('http')) {
    setImageTab('url');
    document.getElementById('form-image-url').value = g.image;
  } else if (g.image) {
    setImageTab('url');
    document.getElementById('form-image-url').value = '';
  } else {
    setImageTab('url');
    document.getElementById('form-image-url').value = '';
  }

  if (g.image) {
    document.getElementById('image-preview').src = g.image;
    document.getElementById('image-preview-wrapper').classList.remove('hidden');
  } else {
    document.getElementById('image-preview-wrapper').classList.add('hidden');
  }

  document.getElementById('modal-overlay').classList.remove('hidden');
}

function closeModal() {
  document.getElementById('modal-overlay').classList.add('hidden');
}

function setImageTab(tab) {
  const urlPanel  = document.getElementById('image-url-panel');
  const filePanel = document.getElementById('image-file-panel');
  const tabUrl    = document.getElementById('tab-url');
  const tabFile   = document.getElementById('tab-file');

  if (tab === 'url') {
    urlPanel.classList.remove('hidden');
    filePanel.classList.add('hidden');
    tabUrl.classList.add('active');
    tabFile.classList.remove('active');
  } else {
    filePanel.classList.remove('hidden');
    urlPanel.classList.add('hidden');
    tabFile.classList.add('active');
    tabUrl.classList.remove('active');
  }
}

// =============================================
// Modal: Detalle
// =============================================
function openDetail(id) {
  const g = getById(id);
  if (!g) return;
  detailGameId = id;

  const content = document.getElementById('detail-content');
  content.innerHTML = `
    ${g.image
      ? `<img src="${g.image}" class="detail-cover" alt="${g.name}" onerror="this.style.display='none';this.nextElementSibling.style.display='flex'" />
         <div class="detail-cover-placeholder" style="display:none">🎮</div>`
      : `<div class="detail-cover-placeholder">🎮</div>`
    }
    <div class="detail-title">${g.name}</div>
    <div class="detail-meta">
      ${statusBadge(g.status)}
      <span class="detail-platform">${g.platform || 'No platform'}</span>
      ${g.rating ? `<span class="detail-rating">⭐ ${g.rating}/10</span>` : ''}
    </div>
    ${(g.startDate || g.endDate) ? `
      <div class="detail-dates">
        ${g.startDate ? `<span>▶ Started: ${formatDate(g.startDate)}</span>` : ''}
        ${g.endDate   ? `<span>🏁 Finished: ${formatDate(g.endDate)}</span>` : ''}
      </div>` : ''}
    ${g.comment ? `<div class="detail-comment">${g.comment}</div>` : ''}
  `;

  document.getElementById('detail-overlay').classList.remove('hidden');
}

function closeDetail() {
  document.getElementById('detail-overlay').classList.add('hidden');
  detailGameId = null;
}

// =============================================
// Eliminar
// =============================================
function confirmDelete(id) {
  if (!confirm('Delete this game? This action cannot be undone.')) return;
  deleteGame(id);
  render();
}

// =============================================
// Submit del formulario
// =============================================
async function handleFormSubmit(e) {
  e.preventDefault();

  const id      = document.getElementById('form-id').value;
  const name    = document.getElementById('form-name').value.trim();
  const platform= document.getElementById('form-platform').value.trim();
  const status  = document.getElementById('form-status').value;
  const rating  = parseInt(document.getElementById('form-rating').value, 10);
  const startDate = document.getElementById('form-start-date').value;
  const endDate   = document.getElementById('form-end-date').value;
  const comment = document.getElementById('form-comment').value.trim();

  // Resolver imagen
  let image = '';
  const urlPanel = document.getElementById('image-url-panel');
  const isUrlTab = !urlPanel.classList.contains('hidden');

  if (isUrlTab) {
    image = document.getElementById('form-image-url').value.trim();
  } else {
    const file = document.getElementById('form-image-file').files[0];
    if (file) {
      image = await fileToBase64(file);
    } else if (id) {
      // conservar imagen anterior si no se sube nueva
      const prev = getById(id);
      image = prev ? prev.image : '';
    }
  }

  const data = { name, platform, status, rating, startDate, endDate, comment, image };

  if (id) {
    updateGame(id, data);
  } else {
    addGame(data);
  }

  closeModal();
  render();
}

function fileToBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload  = e => resolve(e.target.result);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

// =============================================
// Inicializacion
// =============================================
document.addEventListener('DOMContentLoaded', () => {

  // Botones header / toolbar
  document.getElementById('btn-add').addEventListener('click', openAddModal);
  document.getElementById('btn-close-modal').addEventListener('click', closeModal);
  document.getElementById('btn-cancel').addEventListener('click', closeModal);
  document.getElementById('btn-close-detail').addEventListener('click', closeDetail);

  document.getElementById('btn-grid').addEventListener('click', () => {
    currentView = 'grid';
    document.getElementById('btn-grid').classList.add('active');
    document.getElementById('btn-list').classList.remove('active');
    render();
  });

  document.getElementById('btn-list').addEventListener('click', () => {
    currentView = 'list';
    document.getElementById('btn-list').classList.add('active');
    document.getElementById('btn-grid').classList.remove('active');
    render();
  });

  // Busqueda y filtros
  document.getElementById('search-input').addEventListener('input', e => {
    currentSearch = e.target.value;
    render();
  });
  document.getElementById('filter-status').addEventListener('change', e => {
    currentStatusFilter = e.target.value;
    render();
  });
  document.getElementById('filter-platform').addEventListener('change', e => {
    currentPlatformFilter = e.target.value;
    render();
  });

  // Rating slider
  document.getElementById('form-rating').addEventListener('input', e => {
    document.getElementById('rating-display').textContent = e.target.value;
  });

  // Tabs de imagen
  document.getElementById('tab-url').addEventListener('click', () => setImageTab('url'));
  document.getElementById('tab-file').addEventListener('click', () => setImageTab('file'));

  // Preview imagen URL
  document.getElementById('form-image-url').addEventListener('input', e => {
    const url = e.target.value.trim();
    if (url) {
      document.getElementById('image-preview').src = url;
      document.getElementById('image-preview-wrapper').classList.remove('hidden');
    } else {
      document.getElementById('image-preview-wrapper').classList.add('hidden');
    }
  });

  // Preview imagen archivo
  document.getElementById('form-image-file').addEventListener('change', e => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = ev => {
      document.getElementById('image-preview').src = ev.target.result;
      document.getElementById('image-preview-wrapper').classList.remove('hidden');
    };
    reader.readAsDataURL(file);
  });

  // Form submit
  document.getElementById('game-form').addEventListener('submit', handleFormSubmit);

  // Detalle: editar / eliminar
  document.getElementById('btn-edit-detail').addEventListener('click', () => {
    if (!detailGameId) return;
    const id = detailGameId;  // guardar antes de que closeDetail lo nullifique
    closeDetail();
    openEditModal(id);
  });

  document.getElementById('btn-delete-detail').addEventListener('click', () => {
    if (!detailGameId) return;
    const id = detailGameId;  // guardar antes de que closeDetail lo nullifique
    closeDetail();
    confirmDelete(id);
  });

  // Cerrar modales al click en overlay
  document.getElementById('modal-overlay').addEventListener('click', e => {
    if (e.target === document.getElementById('modal-overlay')) closeModal();
  });
  document.getElementById('detail-overlay').addEventListener('click', e => {
    if (e.target === document.getElementById('detail-overlay')) closeDetail();
  });

  // Render inicial
  render();
});
