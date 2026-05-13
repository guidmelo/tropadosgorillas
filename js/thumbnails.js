/* ================================================================
   TROPA DOS GORILLAS — thumbnails.js
   Carrega thumbnails reais para:
   - YouTube: via API pública de imagens (sem autenticação)
   - Instagram: via /api/ig-thumb (serverless function na Vercel)
================================================================ */

/* ----------------------------------------------------------------
   YOUTUBE THUMBNAIL
   Tenta maxresdefault → hqdefault como fallback
   Sem API key necessária — URL pública do YouTube
---------------------------------------------------------------- */
(function loadYouTubeThumbnail() {
  const player  = document.getElementById('yt-player');
  const imgEl   = player?.querySelector('.yt-thumb');
  if (!player || !imgEl) return;

  const videoId = player.dataset.videoId;
  if (!videoId) return;

  /* tenta a resolução máxima primeiro */
  const maxRes = `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`;
  const hqRes  = `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`;

  const testImg = new Image();
  testImg.onload = () => {
    /* maxresdefault retorna 120px quando não existe — usar hqdefault */
    imgEl.src = (testImg.naturalWidth <= 120) ? hqRes : maxRes;
  };
  testImg.onerror = () => { imgEl.src = hqRes; };
  testImg.src = maxRes;
})();

/* ----------------------------------------------------------------
   INSTAGRAM THUMBNAILS
   Busca via /api/ig-thumb (Vercel serverless function)
   Cada .ig-card deve ter data-ig-url com a URL do post

   O thumbnail é aplicado em .ig-thumb-bg como background-image
   Filtro grayscale + contraste é aplicado pelo CSS automaticamente
---------------------------------------------------------------- */
(function loadInstagramThumbnails() {
  const cards = document.querySelectorAll('.ig-card[data-ig-url]');
  if (!cards.length) return;

  /* sessionStorage como cache — evita re-fetch na mesma sessão */
  const CACHE_KEY = 'tpdg_ig_thumbs';
  let cache = {};
  try { cache = JSON.parse(sessionStorage.getItem(CACHE_KEY) || '{}'); }
  catch (_) { cache = {}; }

  function saveCache() {
    try { sessionStorage.setItem(CACHE_KEY, JSON.stringify(cache)); }
    catch (_) { /* quota excedida — sem problema */ }
  }

  function applyThumb(card, thumbUrl) {
    const bg = card.querySelector('.ig-thumb-bg');
    if (!bg) return;

    bg.style.backgroundImage = `url('${thumbUrl}')`;
    card.classList.add('has-thumb');
    card.classList.remove('ig-card-loading');
  }

  async function fetchThumb(igUrl) {
    /* usa a API serverless da Vercel para contornar CORS */
    const apiUrl = `/api/ig-thumb?url=${encodeURIComponent(igUrl)}`;
    const res    = await fetch(apiUrl);

    if (!res.ok) throw new Error(`API ${res.status}`);

    const data = await res.json();
    if (!data.url) throw new Error('sem thumbnail');

    return data.url;
  }

  cards.forEach(async (card) => {
    const igUrl = card.dataset.igUrl;
    if (!igUrl) return;

    /* inicia shimmer de loading */
    card.classList.add('ig-card-loading');

    /* verifica cache da sessão */
    if (cache[igUrl]) {
      applyThumb(card, cache[igUrl]);
      return;
    }

    try {
      const thumbUrl = await fetchThumb(igUrl);
      cache[igUrl]   = thumbUrl;
      saveCache();
      applyThumb(card, thumbUrl);
    } catch (err) {
      /* fallback gracioso — mantém placeholder estilizado */
      card.classList.remove('ig-card-loading');
      console.warn(`[TPDG] Thumbnail Instagram não carregou para ${igUrl}:`, err.message);
    }
  });
})();
