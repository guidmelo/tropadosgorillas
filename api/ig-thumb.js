/* ================================================================
   TROPA DOS GORILLAS — api/ig-thumb.js
   Vercel Serverless Function (Node.js 18+)

   Recebe: GET /api/ig-thumb?url=https://www.instagram.com/p/...
   Retorna: { url: "https://cdn.instagram.com/..." }

   Estratégia em cascata:
   1. Tenta Instagram com user-agent de crawler social (facebookexternalhit)
   2. Extrai og:image da resposta HTML
   3. Cache de 24h via Vercel Edge Network (Cache-Control)
================================================================ */

export default async function handler(req, res) {
  /* apenas GET */
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { url } = req.query;

  if (!url || !url.includes('instagram.com')) {
    return res.status(400).json({ error: 'URL do Instagram inválida' });
  }

  /* headers que imitam um crawler social — Instagram serve og:image para eles */
  const HEADERS = {
    'User-Agent':      'facebookexternalhit/1.1 (+http://www.facebook.com/externalhit_uatext.php)',
    'Accept':          'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
    'Accept-Language': 'pt-BR,pt;q=0.9,en;q=0.8',
    'Accept-Encoding': 'gzip, deflate, br',
    'Cache-Control':   'no-cache',
  };

  try {
    const response = await fetch(url, {
      method:   'GET',
      headers:  HEADERS,
      redirect: 'follow',
      signal:   AbortSignal.timeout(8000), /* timeout de 8s */
    });

    if (!response.ok) {
      return res.status(502).json({ error: `Instagram respondeu ${response.status}` });
    }

    const html = await response.text();

    /* extrai og:image — duas variações de ordem dos atributos */
    const thumb =
      extractMeta(html, 'property="og:image"',  'content') ||
      extractMeta(html, 'name="og:image"',       'content') ||
      extractMeta(html, 'property="og:image:url"', 'content');

    if (thumb) {
      /* cache de 24h no edge da Vercel */
      res.setHeader('Cache-Control', 's-maxage=86400, stale-while-revalidate=3600');
      res.setHeader('Access-Control-Allow-Origin', '*');
      return res.status(200).json({ url: thumb });
    }

    return res.status(404).json({ error: 'og:image não encontrado no HTML' });

  } catch (err) {
    const msg = err.name === 'TimeoutError' ? 'Timeout ao contatar Instagram' : err.message;
    return res.status(500).json({ error: msg });
  }
}

/* ----------------------------------------------------------------
   Helper: extrai content de uma meta tag por seletor parcial
---------------------------------------------------------------- */
function extractMeta(html, selector, attr) {
  /* padrão 1: <meta property="og:image" content="..." /> */
  const re1 = new RegExp(`<meta[^>]+${selector}[^>]+${attr}="([^"]+)"`, 'i');
  /* padrão 2: <meta content="..." property="og:image" /> */
  const re2 = new RegExp(`<meta[^>]+${attr}="([^"]+)"[^>]+${selector}`, 'i');

  const m = html.match(re1) || html.match(re2);
  if (!m) return null;

  /* decodifica entidades HTML básicas */
  return m[1].replace(/&amp;/g, '&').replace(/&#39;/g, "'");
}
