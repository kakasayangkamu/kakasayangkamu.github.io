const DATA_URL = 'data_upload.json';

let allVideos = [];
let filteredVideos = [];
let activeIndex = -1;

const mainPlayer = document.getElementById('mainPlayer');
const mainSource = document.getElementById('mainSource');
const nowPlayingTitle = document.getElementById('nowPlayingTitle');
const nowPlayingSize = document.getElementById('nowPlayingSize');
const nowPlayingDate = document.getElementById('nowPlayingDate');

const videoListEl = document.getElementById('videoList');
const searchInput = document.getElementById('searchInput');
const emptyStateEl = document.getElementById('emptyState');
const totalVideosEl = document.getElementById('totalVideos');
const totalSizeEl = document.getElementById('totalSize');

async function loadVideos() {
  try {
    const res = await fetch(DATA_URL + '?t=' + Date.now()); // cache-buster
    if (!res.ok) {
      throw new Error('Gagal mengambil data_upload.json: ' + res.status);
    }

    const data = await res.json();

    if (!Array.isArray(data)) {
      throw new Error('Format JSON harus berupa array');
    }

    // Sort by uploadedAt desc (terbaru di atas)
    allVideos = data
      .slice()
      .sort((a, b) => new Date(b.uploadedAt) - new Date(a.uploadedAt));

    filteredVideos = allVideos;
    updateStats();
    renderList();

    // Auto-play video pertama jika ada
    if (filteredVideos.length > 0) {
      setActiveVideo(0);
    }
  } catch (err) {
    console.error(err);
    nowPlayingTitle.textContent = 'Gagal memuat data_upload.json';
  }
}

function updateStats() {
  const count = allVideos.length;
  const totalSize = allVideos.reduce((sum, v) => sum + (v.sizeMB || 0), 0);

  totalVideosEl.textContent = `${count} video`;
  totalSizeEl.textContent = `${totalSize.toFixed(2)} MB`;
}

function renderList() {
  videoListEl.innerHTML = '';

  if (filteredVideos.length === 0) {
    emptyStateEl.style.display = 'block';
    return;
  }

  emptyStateEl.style.display = 'none';

  filteredVideos.forEach((video, index) => {
    const card = document.createElement('div');
    card.className = 'video-card';
    card.dataset.index = index;

    if (index === activeIndex) {
      card.classList.add('active');
    }

    const thumb = document.createElement('div');
    thumb.className = 'video-thumb';

    const info = document.createElement('div');
    info.className = 'video-info';

    const title = document.createElement('div');
    title.className = 'video-title';
    title.textContent = video.filename || 'Tanpa nama';

    const meta = document.createElement('div');
    meta.className = 'video-meta';

    const size = document.createElement('span');
    size.textContent = (video.sizeMB || 0).toFixed(2) + ' MB';

    const date = document.createElement('span');
    if (video.uploadedAt) {
      const d = new Date(video.uploadedAt);
      date.textContent = d.toLocaleString('id-ID', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } else {
      date.textContent = 'Tanggal tidak diketahui';
    }

    meta.appendChild(size);
    meta.appendChild(date);

    info.appendChild(title);
    info.appendChild(meta);

    card.appendChild(thumb);
    card.appendChild(info);

    card.addEventListener('click', () => {
      setActiveVideo(index);
    });

    videoListEl.appendChild(card);
  });

  highlightActiveCard();
}

function setActiveVideo(indexInFiltered) {
  const video = filteredVideos[indexInFiltered];
  if (!video || !video.url) return;

  activeIndex = indexInFiltered;

  mainSource.src = video.url;
  mainPlayer.load();
  mainPlayer.play().catch(() => {
    // auto-play mungkin diblokir browser, biarkan saja
  });

  nowPlayingTitle.textContent = video.filename || 'Tanpa nama';
  nowPlayingSize.textContent = `${(video.sizeMB || 0).toFixed(2)} MB`;

  if (video.uploadedAt) {
    const d = new Date(video.uploadedAt);
    nowPlayingDate.textContent =
      'Di-upload: ' +
      d.toLocaleString('id-ID', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
  } else {
    nowPlayingDate.textContent = '';
  }

  highlightActiveCard();
}

function highlightActiveCard() {
  const cards = videoListEl.querySelectorAll('.video-card');
  cards.forEach((card, idx) => {
    if (idx === activeIndex) {
      card.classList.add('active');
    } else {
      card.classList.remove('active');
    }
  });
}

searchInput.addEventListener('input', () => {
  const q = searchInput.value.toLowerCase().trim();

  if (!q) {
    filteredVideos = allVideos;
  } else {
    filteredVideos = allVideos.filter((v) =>
      (v.filename || '').toLowerCase().includes(q)
    );
  }

  activeIndex = -1;
  renderList();

  if (filteredVideos.length > 0) {
    setActiveVideo(0);
  } else {
    // kalau kosong, kosongkan player
    mainSource.src = '';
    mainPlayer.load();
    nowPlayingTitle.textContent = 'Tidak ada video yang cocok';
    nowPlayingSize.textContent = '';
    nowPlayingDate.textContent = '';
  }
});

document.addEventListener('DOMContentLoaded', loadVideos);
