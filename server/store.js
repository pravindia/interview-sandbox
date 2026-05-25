import { offers, pages } from '../data/data.js';
function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

function escapeHtml(value) {
  return String(value || '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}

function promptTitleFromNotes(notes) {
  if (typeof notes !== 'string') return '';
  const firstLine = notes
    .split(/\r?\n/)
    .map((line) => line.trim())
    .find(Boolean);

  if (!firstLine) return '';

  return firstLine
    .replace(/^#+\s*/, '')
    .replace(/^[-*]\s+/, '')
    .replace(/^\d+\.\s+/, '')
    .replace(/\s+/g, ' ')
    .trim();
}

export function buildLandingPageHtml({ offerName, audience, angle, notes }) {
  const safeOffer = escapeHtml(offerName);
  const safeAudience = escapeHtml(audience);
  const safeAngle = escapeHtml(angle);
  const safeNotes = escapeHtml(notes || 'Confident, clear, conversion-focused landing page.');

  return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>${safeOffer}</title>
    <style>
      body { margin: 0; font-family: Georgia, serif; background: #f7f4ee; color: #18181b; }
      .hero { padding: 72px 24px 48px; background: linear-gradient(135deg, #20132f, #43235d); color: white; }
      .wrap { max-width: 980px; margin: 0 auto; }
      .eyebrow { display: inline-block; margin-bottom: 16px; padding: 8px 14px; border-radius: 999px; background: rgba(255,255,255,0.12); font: 600 12px/1 system-ui, sans-serif; letter-spacing: .12em; text-transform: uppercase; }
      h1 { font-size: 56px; line-height: 1.05; margin: 0 0 16px; }
      p.lead { max-width: 680px; font: 400 20px/1.6 system-ui, sans-serif; color: rgba(255,255,255,0.84); }
      .cta { display: inline-block; margin-top: 28px; padding: 14px 22px; border-radius: 999px; background: #f7b955; color: #25172d; text-decoration: none; font: 700 15px/1 system-ui, sans-serif; }
      .grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 18px; padding: 42px 24px; }
      .card { background: white; border: 1px solid #eadfce; border-radius: 22px; padding: 24px; box-shadow: 0 20px 40px rgba(32, 19, 47, 0.08); }
      .card h3 { margin-top: 0; font-size: 22px; }
      .section { padding: 0 24px 48px; }
      .section h2 { font-size: 34px; margin-bottom: 12px; }
      .section p, .section li { font: 400 18px/1.7 system-ui, sans-serif; color: #334155; }
      .notes { background: #fff6e5; border: 1px solid #f1d6a4; border-radius: 18px; padding: 20px; font: 500 14px/1.6 system-ui, sans-serif; color: #6b4d14; }
      @media (max-width: 860px) { h1 { font-size: 40px; } .grid { grid-template-columns: 1fr; } }
    </style>
  </head>
  <body>
    <section class="hero">
      <div class="wrap">
        <div class="eyebrow">${safeAudience}</div>
        <h1>${safeOffer}</h1>
        <p class="lead">${safeAngle}</p>
        <a class="cta" href="#apply">Book the next step</a>
      </div>
    </section>
    <section class="grid wrap">
      <div class="card">
        <h3>Why this converts</h3>
        <p>The page is built to make the offer feel premium, specific, and easy to act on.</p>
      </div>
      <div class="card">
        <h3>Who it is for</h3>
        <p>${safeAudience} who need a cleaner path from attention to conversion.</p>
      </div>
      <div class="card">
        <h3>Offer promise</h3>
        <p>${safeOffer} gives the prospect one clear next step instead of generic information overload.</p>
      </div>
    </section>
    <section class="section wrap">
      <h2>Messaging direction</h2>
      <p>${safeAngle}</p>
      <div class="notes"><strong>Page notes:</strong> ${safeNotes}</div>
    </section>
  </body>
</html>`;
}

export function listOffers() {
  return clone(offers);
}

export function listPages({ offerId } = {}) {
  const summaries = pages
    .filter((page) => !offerId || page.offerId === offerId)
    .map(({ id, offerId: currentOfferId, name, pageType, promptNotes, updatedAt }) => ({
      id,
      offerId: currentOfferId,
      name,
      pageType,
      promptTitle: promptTitleFromNotes(promptNotes),
      promptNotes,
      updatedAt,
    }))
    .sort((left, right) => right.updatedAt.localeCompare(left.updatedAt));

  return clone(summaries);
}

export function getPage(pageId) {
  const page = pages.find((item) => item.id === pageId);
  return page ? clone(page) : null;
}

export function deletePage(pageId) {
  const index = pages.findIndex((item) => item.id === pageId);
  if (index < 0) return null;
  const [removed] = pages.splice(index, 1);
  return clone(removed);
}

export function generateDraft(offerId, { pageType, notes }) {
  const offer = offers.find((item) => item.id === offerId);
  if (!offer) return null;

  return {
    id: `draft_${offerId}_${Date.now()}`,
    offerId,
    name: `${offer.name} Landing Page`,
    pageType: pageType || 'landing',
    promptNotes: notes || '',
    html: buildLandingPageHtml({
      offerName: offer.name,
      audience: offer.audience,
      angle: offer.angle,
      notes,
    }),
    updatedAt: new Date().toISOString(),
  };
}

export function savePage(pageId, body) {
  const html = typeof body?.html === 'string' ? body.html : null;
  const promptNotes = typeof body?.promptNotes === 'string' ? body.promptNotes : '';

  if (!html) return { error: 'invalid_html' };

  const existing = pages.find((item) => item.id === pageId);
  if (existing) {
    existing.html = html;
    existing.promptNotes = promptNotes;
    existing.updatedAt = new Date().toISOString();
    return { page: clone(existing) };
  }

  const offerId = String(pageId || '').replace(/^draft_/, '').split('_').slice(0, 3).join('_');
  const offer = offers.find((item) => item.id === offerId);
  if (!offer) return { error: 'offer_not_found' };

  const created = {
    id: pageId,
    offerId,
    name: `${offer.name} Landing Page`,
    pageType: 'landing',
    promptNotes,
    html,
    updatedAt: new Date().toISOString(),
  };
  pages.push(created);
  return { page: clone(created) };
}
