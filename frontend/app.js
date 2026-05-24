const ACTIVE_OFFER_KEY = 'lf_active_offer_id';
const LAST_OPEN_PAGE_KEY = 'lf_last_open_page_by_offer';
const EMPTY_PREVIEW = '<!doctype html><html><body style="font-family:system-ui,sans-serif;padding:40px;color:#334155"><h1>Generate or open a saved page</h1><p>Your landing page preview will appear here.</p></body></html>';

const state = {
  offers: [],
  pages: [],
  selectedOfferId: null,
  selectedPageId: null,
  workingPage: null,
  notes: '',
  previewHtml: '',
  dirty: false,
  loading: false,
};

const offerListEl = document.getElementById('offerList');
const pageListEl = document.getElementById('pageList');
const offerHeadingEl = document.getElementById('offerHeading');
const offerMetaEl = document.getElementById('offerMeta');
const pageHeadingEl = document.getElementById('pageHeading');
const pageCountEl = document.getElementById('pageCount');
const notesInputEl = document.getElementById('notesInput');
const htmlSnippetEl = document.getElementById('htmlSnippet');
const draftStatusEl = document.getElementById('draftStatus');
const previewFrameEl = document.getElementById('previewFrame');
const noticeEl = document.getElementById('notice');
const saveBtnEl = document.getElementById('saveBtn');
const generateBtnEl = document.getElementById('generateBtn');
const copyBtnEl = document.getElementById('copyBtn');
const syncBadgeEl = document.getElementById('syncBadge');
const dirtyBadgeEl = document.getElementById('dirtyBadge');

async function api(path, options = {}) {
  const response = await fetch(path, {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  });

  if (!response.ok) {
    throw new Error(`Request failed: ${response.status}`);
  }

  return response.json();
}

function readLastOpenPages() {
  try {
    return JSON.parse(localStorage.getItem(LAST_OPEN_PAGE_KEY) || '{}');
  } catch {
    return {};
  }
}

function writeLastOpenPage(offerId, pageId) {
  const current = readLastOpenPages();
  current[offerId] = pageId;
  localStorage.setItem(LAST_OPEN_PAGE_KEY, JSON.stringify(current));
}

function setNotice(message) {
  noticeEl.textContent = message;
}

function setLoading(loading, label = 'Idle') {
  state.loading = loading;
  syncBadgeEl.textContent = label;
  generateBtnEl.disabled = loading || !state.selectedOfferId;
  saveBtnEl.disabled = loading || !state.workingPage;
  copyBtnEl.disabled = !state.previewHtml;
}

function updateDirtyBadge() {
  dirtyBadgeEl.textContent = state.dirty ? 'Unsaved draft changes' : 'No local draft edits';
  dirtyBadgeEl.className = state.dirty ? 'badge' : 'badge badge-muted';
}

function renderPreview() {
  previewFrameEl.srcdoc = state.previewHtml || EMPTY_PREVIEW;
  htmlSnippetEl.textContent = state.previewHtml || 'Generate a page to inspect the HTML snapshot.';
}

function renderOffers() {
  offerListEl.innerHTML = '';
  state.offers.forEach((offer) => {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = `offer-item${offer.id === state.selectedOfferId ? ' active' : ''}`;
    button.innerHTML = `
      <strong>${offer.name}</strong>
      <small>${offer.angle}</small>
    `;
    button.addEventListener('click', () => selectOffer(offer.id));
    offerListEl.appendChild(button);
  });
}

function renderPages() {
  pageListEl.innerHTML = '';
  pageCountEl.textContent = `${state.pages.length} pages`;

  if (!state.pages.length) {
    pageListEl.innerHTML = '<div class="notice">No saved pages for this offer yet.</div>';
    return;
  }

  state.pages.forEach((page) => {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = `page-item${page.id === state.selectedPageId ? ' active' : ''}`;
    button.innerHTML = `
      <strong>${page.name}</strong>
      <small>${page.pageType} · updated ${new Date(page.updatedAt).toLocaleDateString()}</small>
    `;
    button.addEventListener('click', () => openPage(page.id));
    pageListEl.appendChild(button);
  });
}

function renderWorkingState() {
  const offer = state.offers.find((item) => item.id === state.selectedOfferId);
  offerHeadingEl.textContent = offer ? offer.name : 'Choose an offer';
  offerMetaEl.textContent = offer ? `${offer.audience} · ${offer.angle}` : '';
  pageHeadingEl.textContent = state.workingPage ? state.workingPage.name : 'Generate a landing page';
  notesInputEl.value = state.notes;
  draftStatusEl.textContent = state.workingPage ? 'Draft loaded' : 'No draft yet';
  renderPreview();
  updateDirtyBadge();
  setLoading(state.loading, syncBadgeEl.textContent || 'Idle');
}

async function loadOffers() {
  const data = await api('/api/offers');
  state.offers = data.offers;
  const remembered = localStorage.getItem(ACTIVE_OFFER_KEY);
  state.selectedOfferId = remembered && data.offers.some((item) => item.id === remembered)
    ? remembered
    : data.offers[0]?.id || null;
}

async function loadPages() {
  if (!state.selectedOfferId) return;
  const data = await api(`/api/pages?offerId=${encodeURIComponent(state.selectedOfferId)}`);
  state.pages = data.pages;
}

async function openPage(pageId) {
  if (!pageId) return;
  setLoading(true, 'Loading page…');
  try {
    const data = await api(`/api/pages/${pageId}`);
    state.selectedPageId = pageId;
    state.workingPage = data.page;
    state.notes = data.page.promptNotes || '';
    state.previewHtml = data.page.html || '';
    state.dirty = false;
    writeLastOpenPage(state.selectedOfferId, pageId);
    setNotice(`Opened ${data.page.name}.`);
    renderPages();
    renderWorkingState();
  } finally {
    setLoading(false);
  }
}

async function selectOffer(offerId) {
  state.selectedOfferId = offerId;
  localStorage.setItem(ACTIVE_OFFER_KEY, offerId);
  setLoading(true, 'Loading pages…');
  try {
    await loadPages();
    state.selectedPageId = null;
    state.workingPage = null;
    state.notes = '';
    state.previewHtml = '';
    state.dirty = false;
    renderOffers();
    renderPages();
    renderWorkingState();

    const rememberedPages = readLastOpenPages();
    const rememberedPageId = rememberedPages[offerId];
    if (rememberedPageId) {
      await openPage(rememberedPageId);
    } else {
      setNotice('Ready to generate a landing page for this offer.');
    }
  } finally {
    setLoading(false);
  }
}

async function generatePage() {
  if (!state.selectedOfferId) return;
  setLoading(true, 'Generating…');
  try {
    const data = await api(`/api/offers/${state.selectedOfferId}/generate-page`, {
      method: 'POST',
      body: JSON.stringify({
        pageType: 'landing',
        notes: state.notes,
      }),
    });

    state.selectedPageId = data.page.id;
    state.workingPage = data.page;
    state.previewHtml = data.page.html || '';
    state.notes = data.page.promptNotes || state.notes;
    state.dirty = true;
    draftStatusEl.textContent = 'Generated draft';
    setNotice(`Generated draft for ${data.page.name}.`);
    renderWorkingState();
  } catch (error) {
    setNotice(`Generate failed: ${error.message}`);
  } finally {
    setLoading(false);
  }
}

async function savePage() {
  if (!state.workingPage?.id) return;
  setLoading(true, 'Saving…');
  try {
    const data = await api(`/api/pages/${state.workingPage.id}/save`, {
      method: 'POST',
      body: JSON.stringify({
        content: state.previewHtml,
        notes: state.notes,
      }),
    });

    state.workingPage = data.page;
    state.selectedPageId = data.page.id;
    state.previewHtml = data.page.html || '';
    state.notes = data.page.promptNotes || state.notes;
    state.dirty = false;
    writeLastOpenPage(state.selectedOfferId, data.page.id);
    await loadPages();
    setNotice(`Saved ${data.page.name}.`);
    renderPages();
    renderWorkingState();
  } catch (error) {
    setNotice(`Save failed: ${error.message}`);
  } finally {
    setLoading(false);
  }
}

async function copyHtml() {
  if (!state.previewHtml) return;
  try {
    await navigator.clipboard.writeText(state.previewHtml);
    setNotice('Copied HTML to clipboard.');
  } catch (error) {
    setNotice(`Copy failed: ${error.message}`);
  }
}

notesInputEl.addEventListener('input', (event) => {
  state.notes = event.target.value;
  state.dirty = true;
  updateDirtyBadge();
});

generateBtnEl.addEventListener('click', generatePage);
saveBtnEl.addEventListener('click', savePage);
copyBtnEl.addEventListener('click', copyHtml);

async function init() {
  setLoading(true, 'Booting…');
  try {
    await loadOffers();
    renderOffers();
    await selectOffer(state.selectedOfferId);
  } catch (error) {
    setNotice(`Failed to load app: ${error.message}`);
  } finally {
    setLoading(false);
  }
}

init();
