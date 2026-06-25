/* ════════════════════════════════════════════════
   PS MOVIZ HUT — Frontend Logic
   ════════════════════════════════════════════════ */

"use strict";

// ─── State ───────────────────────────────────────────────
let currentCategory = 'all';
let currentPlayerLinks = [];
let currentQualityLinks = {};

// ─── Intro Animation ─────────────────────────────────────
(function initIntro() {
  const introScreen = document.getElementById('intro-screen');
  const introVideo  = document.getElementById('intro-video');
  const app         = document.getElementById('app');
  const skipBtn     = document.getElementById('skip-btn');

  function showApp() {
    introScreen.style.transition = 'opacity 0.8s';
    introScreen.style.opacity = '0';
    setTimeout(() => {
      introScreen.classList.add('hidden');
      app.classList.remove('hidden');
    }, 800);
  }

  // Auto-dismiss when video ends
  introVideo.addEventListener('ended', showApp);

  // Skip button
  skipBtn.addEventListener('click', showApp);

  // Fallback: dismiss after 8s even if video fails
  setTimeout(showApp, 8000);

  // If video fails to load, show app immediately
  introVideo.addEventListener('error', () => setTimeout(showApp, 1000));
})();

// ─── Sidebar Nav ─────────────────────────────────────────
document.querySelectorAll('.nav-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    currentCategory = btn.dataset.cat;
  });
});

// Mobile menu toggle
document.getElementById('menu-toggle').addEventListener('click', () => {
  document.getElementById('sidebar').classList.toggle('open');
});

// ─── Search Input ─────────────────────────────────────────
document.getElementById('search-input').addEventListener('keydown', e => {
  if (e.key === 'Enter') sendSearch();
});

// ─── Quick Search Chips ───────────────────────────────────
function quickSearch(title) {
  document.getElementById('search-input').value = title;
  sendSearch();
}

// ─── Main Search ──────────────────────────────────────────
async function sendSearch() {
  const input = document.getElementById('search-input');
  const query = input.value.trim();
  if (!query) {
    shakeInput();
    return;
  }

  // Show user message
  addUserMessage(query);
  input.value = '';

  // Show typing indicator
  const typingId = addTypingMessage();

  try {
    const results = await fetchSearch(query);
    removeMessage(typingId);
    displayResults(query, results);
  } catch (err) {
    removeMessage(typingId);
    addErrorMessage(`Search failed: ${err.message}. Please try again.`);
  }
}

async function fetchSearch(query) {
  const catParam = currentCategory !== 'all' ? `&cat=${encodeURIComponent(currentCategory)}` : '';
  const resp = await fetch(`/api/search?q=${encodeURIComponent(query)}${catParam}`);
  const data = await resp.json();
  if (data.error) throw new Error(data.error);
  return data;
}

// ─── Display Results ──────────────────────────────────────
function displayResults(query, data) {
  const chat = document.getElementById('chat-area');

  if (!data.results || data.results.length === 0) {
    addBotMessage(`
      <div class="bubble-header"><i class="fa-solid fa-circle-exclamation" style="color:var(--red)"></i> NO RESULTS</div>
      <p>No movies found for <b>"${escHtml(query)}"</b> on Moviesda.</p>
      <p style="color:#888;font-size:13px">Try different spelling or a shorter keyword.</p>
    `);
    return;
  }

  let cardsHtml = `<div class="results-grid">`;
  data.results.forEach((movie, i) => {
    const poster = movie.poster || 'https://via.placeholder.com/150x220/1A1A1A/7B2FBE?text=No+Poster';
    const year   = movie.year || extractYear(movie.title) || '';
    cardsHtml += `
      <div class="movie-card" onclick="openMovieModal('${escAttr(movie.link)}', '${escAttr(movie.title)}', '${escAttr(poster)}', '${escAttr(year)}')">
        <img src="${escHtml(poster)}" alt="${escHtml(movie.title)}" loading="lazy"
             onerror="this.src='https://via.placeholder.com/150x220/1A1A1A/7B2FBE?text=No+Poster'"/>
        <div class="movie-card-badge">TAMIL</div>
        <div class="movie-card-info">
          <div class="movie-card-title">${escHtml(movie.title)}</div>
          ${year ? `<div class="movie-card-year"><i class="fa-solid fa-calendar-days"></i> ${year}</div>` : ''}
        </div>
      </div>`;
  });
  cardsHtml += `</div>`;

  addBotMessage(`
    <div class="bubble-header"><i class="fa-solid fa-film"></i> FOUND ${data.results.length} RESULT${data.results.length > 1 ? 'S' : ''} FOR "${escHtml(query).toUpperCase()}"</div>
    <p style="color:#888;font-size:12px;margin-bottom:8px">Click a movie to see details, watch online, or download.</p>
    ${cardsHtml}
  `);

  scrollToBottom();
}

// ─── Movie Modal ──────────────────────────────────────────
async function openMovieModal(url, title, poster, year) {
  const modal   = document.getElementById('movie-modal');
  const content = document.getElementById('modal-content');

  // Show loading
  modal.classList.remove('hidden');
  content.innerHTML = `
    <div style="padding:40px;text-align:center">
      <div class="spinner" style="margin:0 auto 14px;width:36px;height:36px;border-top-color:var(--red)"></div>
      <p style="color:#888">Fetching movie details from Moviesda…</p>
    </div>`;

  try {
    const resp = await fetch(`/api/movie?url=${encodeURIComponent(url)}`);
    const details = await resp.json();

    if (details.error) {
      // Use what we already know from the listing page
      renderModalContent(content, {
        title: title, year: year, poster: poster,
        description: 'Details could not be loaded. Visit the movie page directly.',
        watch_links: [], download_links: {}
      }, url);
      return;
    }

    // Fill in from listing page if missing
    if (!details.poster) details.poster = poster;
    if (!details.year)   details.year   = year || extractYear(details.title);
    if (!details.title)  details.title  = title;

    renderModalContent(content, details, url);
  } catch (err) {
    content.innerHTML = `<div style="padding:24px;color:var(--red)"><i class="fa-solid fa-triangle-exclamation"></i> Failed to load details: ${err.message}</div>`;
  }
}

function renderModalContent(container, d, originalUrl) {
  const poster = d.poster || 'https://via.placeholder.com/140x210/1A1A1A/7B2FBE?text=No+Poster';
  const hasWatch    = d.watch_links && d.watch_links.length > 0;
  const hasDownload = d.download_links && Object.keys(d.download_links).length > 0;

  // Store current quality links globally
  currentPlayerLinks = d.watch_links || [];
  currentQualityLinks = d.download_links || {};

  // Watch links section
  let watchSection = '';
  if (hasWatch) {
    watchSection = `<div class="watch-section">
      <div class="quality-label-title"><i class="fa-solid fa-play"></i> WATCH ONLINE</div>`;
    d.watch_links.forEach((wl, i) => {
      watchSection += `
        <div class="watch-link-item" onclick="playLink('${escAttr(wl.url)}', '${escAttr(d.title)}')">
          <i class="fa-solid fa-circle-play"></i>
          <div class="watch-link-text">${escHtml(wl.label || `Stream ${i+1}`)}</div>
          <i class="fa-solid fa-chevron-right" style="margin-left:auto;color:#555"></i>
        </div>`;
    });
    watchSection += `</div>`;
  }

  // Download links section
  let dlSection = '';
  if (hasDownload) {
    dlSection = `<div class="quality-section">
      <div class="quality-label-title"><i class="fa-solid fa-download"></i> DOWNLOAD LINKS</div>
      <div class="quality-grid">`;
    Object.entries(d.download_links).forEach(([quality, links]) => {
      links.forEach((link, i) => {
        dlSection += `
          <button class="quality-btn" onclick="downloadLink('${escAttr(link.url)}', '${escAttr(d.title)}', '${escAttr(quality)}')">
            <i class="fa-solid fa-file-arrow-down"></i>
            ${escHtml(quality)}${links.length > 1 ? ` (${i+1})` : ''}
          </button>`;
      });
    });
    dlSection += `</div></div>`;
  }

  // If neither watch nor download, show external link
  if (!hasWatch && !hasDownload) {
    watchSection = `
      <div style="margin-top:14px;padding:14px;border:2px dashed var(--purple);color:#888;text-align:center;font-size:13px">
        <i class="fa-solid fa-link"></i> Links not scraped automatically.<br/>
        <a href="${escHtml(originalUrl)}" target="_blank" style="color:var(--purple-light);font-weight:700">
          Open on Moviesda <i class="fa-solid fa-external-link"></i>
        </a>
      </div>`;
  }

  container.innerHTML = `
    <div class="detail-header">
      <img class="detail-poster" src="${escHtml(poster)}" alt="${escHtml(d.title)}"
           onerror="this.src='https://via.placeholder.com/140x210/1A1A1A/7B2FBE?text=No+Poster'"/>
      <div class="detail-info">
        <div class="detail-title">${escHtml(d.title)}</div>
        ${d.year ? `<div class="detail-year"><i class="fa-solid fa-calendar"></i> ${escHtml(d.year)}</div>` : ''}
        <p class="detail-desc">${escHtml(d.description || 'No description available.')}</p>
        <div class="detail-actions">
          ${hasWatch ? `<button class="action-btn btn-watch" onclick="playLink('${escAttr(d.watch_links[0].url)}', '${escAttr(d.title)}')"><i class="fa-solid fa-play"></i> Watch Online</button>` : ''}
          ${hasDownload ? `<button class="action-btn btn-download" onclick="scrollToDownload()"><i class="fa-solid fa-download"></i> Download</button>` : ''}
          <a href="${escHtml(originalUrl)}" target="_blank" class="action-btn" style="background:var(--dark3);border-color:var(--purple);color:var(--text);text-decoration:none">
            <i class="fa-solid fa-external-link"></i> Moviesda
          </a>
        </div>
      </div>
    </div>
    <div id="detail-links">
      ${watchSection}
      ${dlSection}
    </div>
  `;
}

function closeModal() {
  document.getElementById('movie-modal').classList.add('hidden');
}

function scrollToDownload() {
  document.getElementById('detail-links').scrollIntoView({ behavior: 'smooth' });
}

// ─── Player ───────────────────────────────────────────────
function playLink(url, title) {
  closeModal();
  const playerModal = document.getElementById('player-modal');
  const videoWrap   = document.getElementById('player-container');
  const iframeWrap  = document.getElementById('player-iframe-wrap');
  const video       = document.getElementById('main-player');
  const iframe      = document.getElementById('player-iframe');

  playerModal.classList.remove('hidden');

  const isEmbed = url.includes('embed') || url.includes('iframe') ||
                  url.includes('player') || url.includes('.php') ||
                  (!url.includes('.mp4') && !url.includes('.m3u8') && !url.includes('.webm'));

  if (isEmbed) {
    videoWrap.style.display = 'none';
    iframeWrap.classList.remove('hidden');
    iframe.src = url;
  } else {
    iframeWrap.classList.add('hidden');
    videoWrap.style.display = 'block';
    iframe.src = '';
    video.src = url;
    video.load();
    video.play().catch(() => {});
    setupPlayerEvents(video);
  }
}

function closePlayer() {
  const video  = document.getElementById('main-player');
  const iframe = document.getElementById('player-iframe');
  video.pause(); video.src = '';
  iframe.src = '';
  document.getElementById('player-modal').classList.add('hidden');
}

function setupPlayerEvents(video) {
  video.addEventListener('timeupdate', updateProgress);
  video.addEventListener('loadedmetadata', updateProgress);

  const progressBar = document.getElementById('player-progress-bar');
  progressBar.addEventListener('click', (e) => {
    const rect = progressBar.getBoundingClientRect();
    const pct  = (e.clientX - rect.left) / rect.width;
    video.currentTime = pct * video.duration;
  });
}

function updateProgress() {
  const video    = document.getElementById('main-player');
  const fill     = document.getElementById('player-progress-fill');
  const thumb    = document.getElementById('player-thumb');
  const timeEl   = document.getElementById('player-time');
  const pct      = video.duration ? (video.currentTime / video.duration) * 100 : 0;
  fill.style.width = pct + '%';
  thumb.style.left = pct + '%';
  timeEl.textContent = `${fmtTime(video.currentTime)} / ${fmtTime(video.duration || 0)}`;
}

function togglePlay() {
  const video = document.getElementById('main-player');
  const icon  = document.getElementById('play-icon');
  if (video.paused) { video.play(); icon.className = 'fa-solid fa-pause'; }
  else              { video.pause(); icon.className = 'fa-solid fa-play'; }
}

function toggleMute() {
  const video  = document.getElementById('main-player');
  const icon   = document.getElementById('vol-icon');
  const slider = document.getElementById('volume-slider');
  video.muted = !video.muted;
  icon.className = video.muted ? 'fa-solid fa-volume-xmark' : 'fa-solid fa-volume-high';
  slider.value = video.muted ? 0 : video.volume;
}

function setVolume(val) {
  const video = document.getElementById('main-player');
  const icon  = document.getElementById('vol-icon');
  video.volume = parseFloat(val);
  video.muted  = val == 0;
  icon.className = val == 0 ? 'fa-solid fa-volume-xmark' :
                   val < 0.5 ? 'fa-solid fa-volume-low' : 'fa-solid fa-volume-high';
}

function toggleFullscreen() {
  const container = document.getElementById('player-container');
  if (!document.fullscreenElement) container.requestFullscreen();
  else document.exitFullscreen();
}

// ─── Download ─────────────────────────────────────────────
function downloadLink(url, title, quality) {
  // Try to trigger a direct download
  const a = document.createElement('a');
  a.href     = url;
  a.download = `${title} [${quality}]`;
  a.target   = '_blank';
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
}

// ─── Chat Helpers ─────────────────────────────────────────
function addUserMessage(text) {
  const chat = document.getElementById('chat-area');
  const id   = 'msg-' + Date.now();
  const div  = document.createElement('div');
  div.className = 'msg user-msg';
  div.id = id;
  div.innerHTML = `<div class="bubble"><p>${escHtml(text)}</p></div>`;
  chat.appendChild(div);
  scrollToBottom();
  return id;
}

function addBotMessage(html) {
  const chat = document.getElementById('chat-area');
  const id   = 'msg-' + Date.now();
  const div  = document.createElement('div');
  div.className = 'msg bot-msg';
  div.id = id;
  div.innerHTML = `
    <img src="/assets/logo.png" alt="Bot" class="bot-avatar"/>
    <div class="bubble">${html}</div>`;
  chat.appendChild(div);
  scrollToBottom();
  return id;
}

function addTypingMessage() {
  const chat = document.getElementById('chat-area');
  const id   = 'typing-' + Date.now();
  const div  = document.createElement('div');
  div.className = 'msg bot-msg';
  div.id = id;
  div.innerHTML = `
    <img src="/assets/logo.png" alt="Bot" class="bot-avatar"/>
    <div class="bubble">
      <div class="bubble-header">PS MOVIZ HUT</div>
      <div class="typing-dots"><span></span><span></span><span></span></div>
      <p style="color:#888;font-size:12px;margin-top:6px">Searching Moviesda across all pages…</p>
    </div>`;
  chat.appendChild(div);
  scrollToBottom();
  return id;
}

function addErrorMessage(text) {
  return addBotMessage(`
    <div class="bubble-header" style="color:var(--red)"><i class="fa-solid fa-triangle-exclamation"></i> ERROR</div>
    <p>${escHtml(text)}</p>
  `);
}

function removeMessage(id) {
  const el = document.getElementById(id);
  if (el) el.remove();
}

function scrollToBottom() {
  const chat = document.getElementById('chat-area');
  setTimeout(() => chat.scrollTo({ top: chat.scrollHeight, behavior: 'smooth' }), 50);
}

function shakeInput() {
  const input = document.getElementById('input-wrapper');
  input.style.animation = 'none';
  input.offsetHeight;
  input.style.animation = 'shake 0.4s';
  setTimeout(() => input.style.animation = '', 400);
}

// ─── Utilities ────────────────────────────────────────────
function escHtml(s) {
  if (!s) return '';
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}
function escAttr(s) {
  if (!s) return '';
  return String(s).replace(/'/g, "\\'").replace(/"/g, '&quot;');
}
function fmtTime(sec) {
  const m = Math.floor(sec / 60);
  const s = Math.floor(sec % 60);
  return `${m}:${s.toString().padStart(2, '0')}`;
}
function extractYear(title) {
  const m = (title || '').match(/\b(20\d{2})\b/);
  return m ? m[1] : '';
}

// Close modals on overlay click
document.getElementById('movie-modal').addEventListener('click', function(e) {
  if (e.target === this) closeModal();
});
document.getElementById('player-modal').addEventListener('click', function(e) {
  if (e.target === this) closePlayer();
});

// Add shake keyframe dynamically
const style = document.createElement('style');
style.textContent = `
@keyframes shake {
  0%, 100% { transform: translateX(0); }
  20%       { transform: translateX(-5px); }
  40%       { transform: translateX(5px); }
  60%       { transform: translateX(-4px); }
  80%       { transform: translateX(4px); }
}`;
document.head.appendChild(style);
