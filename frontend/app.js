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
const generateFormEl = document.getElementById('generateForm');
const notesInputEl = document.getElementById('notesInput');
const draftStatusEl = document.getElementById('draftStatus');
const previewFrameEl = document.getElementById('previewFrame');
const noticeEl = document.getElementById('notice');
const saveBtnEl = document.getElementById('saveBtn');
const generateBtnEl = document.getElementById('generateBtn');
const copyBtnEl = document.getElementById('copyBtn');
const visitBtnEl = document.getElementById('visitBtn');
const syncBadgeEl = document.getElementById('syncBadge');
const dirtyBadgeEl = document.getElementById('dirtyBadge');

async function api(path, options = {}) {
  const response = await fetch(path, {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  });

  if (!response.ok) {
    const error = new Error(`Request failed: ${response.status}`);
    error.status = response.status;
    throw error;
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

function removeLastOpenPage(offerId, pageId) {
  const current = readLastOpenPages();
  if (!current[offerId]) return;
  if (pageId && current[offerId] !== pageId) return;
  delete current[offerId];
  localStorage.setItem(LAST_OPEN_PAGE_KEY, JSON.stringify(current));
}

function setNotice(message) {
  noticeEl.textContent = message;
}

function escapeText(value) {
  return String(value || '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}

function cleanTitle(value) {
  return String(value || '').replace(/\s+/g, ' ').trim();
}

function titleFromDraftNote(notes) {
  if (typeof notes !== 'string') return '';
  const firstLine = notes
    .split(/\r?\n/)
    .map((line) => line.trim())
    .find(Boolean);

  if (!firstLine) return '';

  return cleanTitle(
    firstLine
      .replace(/^#+\s*/, '')
      .replace(/^[-*]\s+/, '')
      .replace(/^\d+\.\s+/, ''),
  );
}

function getSidebarPageTitle(page) {
  const promptTitle = cleanTitle(page?.promptTitle);
  if (promptTitle) return promptTitle;

  const draftNoteTitle = titleFromDraftNote(page?.promptNotes);
  if (draftNoteTitle) return draftNoteTitle;

  const pageName = cleanTitle(page?.name);
  if (pageName) return pageName;

  return 'Draft note';
}

function formatRelativeUpdatedAt(value) {
  const updatedAt = new Date(value);
  if (Number.isNaN(updatedAt.getTime())) return 'updated recently';

  const diffMs = updatedAt.getTime() - Date.now();
  const absDiffMs = Math.abs(diffMs);
  const minuteMs = 60 * 1000;
  const hourMs = 60 * minuteMs;
  const dayMs = 24 * hourMs;

  const rtf = new Intl.RelativeTimeFormat(undefined, { numeric: 'auto' });
  if (absDiffMs < hourMs) {
    return rtf.format(Math.round(diffMs / minuteMs), 'minute');
  }
  if (absDiffMs < dayMs) {
    return rtf.format(Math.round(diffMs / hourMs), 'hour');
  }
  if (absDiffMs < 30 * dayMs) {
    return rtf.format(Math.round(diffMs / dayMs), 'day');
  }

  return updatedAt.toLocaleString();
}

function confirmIfDirty() {
  if (!state.dirty) return true;
  return window.confirm('You have unsaved changes. Leave this draft without saving?');
}

function setLoading(loading, label = 'Idle') {
  state.loading = loading;
  syncBadgeEl.textContent = label;
  generateBtnEl.disabled = loading || !state.selectedOfferId;
  saveBtnEl.disabled = loading || !state.workingPage;
  copyBtnEl.disabled = !state.previewHtml;
  visitBtnEl.disabled = !state.previewHtml;
}

function updateDirtyBadge() {
  dirtyBadgeEl.textContent = state.dirty ? 'Unsaved draft changes' : 'No local draft edits';
  dirtyBadgeEl.className = state.dirty ? 'badge' : 'badge badge-muted';
}

function renderPreview() {
  previewFrameEl.srcdoc = state.previewHtml || EMPTY_PREVIEW;
}

function renderOffers() {
  offerListEl.innerHTML = '';
  state.offers.forEach((offer) => {
    const offerIcon = typeof offer.icon === 'string' && offer.icon.trim() ? offer.icon.trim() : '⭐';
    const button = document.createElement('button');
    button.type = 'button';
    button.className = `offer-item${offer.id === state.selectedOfferId ? ' active' : ''}`;
    button.innerHTML = `
      <strong class="offer-title">
        <span class="offer-icon" aria-hidden="true">${escapeText(offerIcon)}</span>
        <span>${escapeText(offer.name)}</span>
      </strong>
      <small>${escapeText(offer.angle)}</small>
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
    const sidebarTitle = getSidebarPageTitle(page);
    const updatedLabel = formatRelativeUpdatedAt(page.updatedAt);
    const row = document.createElement('div');
    row.className = 'page-row';

    const openButton = document.createElement('button');
    openButton.type = 'button';
    openButton.className = `page-item${page.id === state.selectedPageId ? ' active' : ''}`;
    openButton.innerHTML = `
      <strong>${escapeText(sidebarTitle)}</strong>
      <small>${page.pageType} · updated ${escapeText(updatedLabel)}</small>
    `;
    openButton.title = `Updated ${new Date(page.updatedAt).toLocaleString()}`;
    openButton.addEventListener('click', () => openPage(page.id));

    const deleteButton = document.createElement('button');
    deleteButton.type = 'button';
    deleteButton.className = 'page-delete-btn';
    deleteButton.innerHTML = '<span class="material-symbols-outlined" data-icon="delete">delete</span>';
    deleteButton.setAttribute('aria-label', `Delete ${sidebarTitle}`);
    deleteButton.title = `Delete ${sidebarTitle}`;
    deleteButton.addEventListener('click', () => deletePageById(page.id));

    row.appendChild(openButton);
    row.appendChild(deleteButton);
    pageListEl.appendChild(row);
  });
}

function renderWorkingState() {
  const offer = state.offers.find((item) => item.id === state.selectedOfferId);
  offerHeadingEl.textContent = offer ? offer.name : 'Choose an offer';
  offerMetaEl.textContent = offer ? `${offer.audience} · ${offer.angle}` : '';
  pageHeadingEl.textContent = state.workingPage ? getSidebarPageTitle(state.workingPage) : 'Generate a landing page';
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
  if (pageId !== state.selectedPageId && !confirmIfDirty()) {
    setNotice('Stayed on current draft. Save changes before switching pages.');
    return;
  }
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
  } catch (error) {
    if (error.status === 404) {
      removeLastOpenPage(state.selectedOfferId, pageId);
      state.selectedPageId = null;
      state.workingPage = null;
      state.notes = '';
      state.previewHtml = '';
      state.dirty = false;
      setNotice('That page is no longer available. It may have been a draft or deleted page.');
      await loadPages();
      renderPages();
      renderWorkingState();
      return;
    }

    setNotice(`Load failed: ${error.message}`);
  } finally {
    setLoading(false);
  }
}

async function selectOffer(offerId) {
  if (offerId !== state.selectedOfferId && !confirmIfDirty()) {
    setNotice('Stayed on current offer. Save changes before switching offers.');
    return;
  }
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

    const page = data.draft;
    if (!page) {
      throw new Error('Invalid generate response');
    }

    state.selectedPageId = page.id;
    state.workingPage = page;
    state.previewHtml = page.html || '';
    state.notes = page.promptNotes || state.notes;
    state.dirty = true;
    draftStatusEl.textContent = 'Generated draft';
    setNotice(`Generated draft for ${page.name}.`);
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
        html: state.previewHtml,
        promptNotes: state.notes,
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

async function deletePageById(pageId) {
  if (!pageId) return;

  const page = state.pages.find((item) => item.id === pageId);
  const title = page ? getSidebarPageTitle(page) : 'this page';
  const confirmed = window.confirm(`Delete ${title}? This cannot be undone.`);
  if (!confirmed) return;

  setLoading(true, 'Deleting…');
  try {
    const data = await api(`/api/pages/${pageId}`, { method: 'DELETE' });

    const deletingActivePage = state.selectedPageId === pageId;
    if (deletingActivePage) {
      state.selectedPageId = null;
      state.workingPage = null;
      state.notes = '';
      state.previewHtml = '';
      state.dirty = false;
      removeLastOpenPage(state.selectedOfferId, pageId);
    }

    await loadPages();
    if (data?.deleted) {
      setNotice(`Deleted ${title}.`);
    } else {
      removeLastOpenPage(state.selectedOfferId, pageId);
      setNotice(`${title} was already removed.`);
    }
    renderPages();
    renderWorkingState();
  } catch (error) {
    if (error.status === 404) {
      if (state.selectedPageId === pageId) {
        state.selectedPageId = null;
        state.workingPage = null;
        state.notes = '';
        state.previewHtml = '';
        state.dirty = false;
      }
      removeLastOpenPage(state.selectedOfferId, pageId);
      await loadPages();
      renderPages();
      renderWorkingState();
      setNotice(`${title} was already removed.`);
      return;
    }
    setNotice(`Delete failed: ${error.message}`);
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

function visitPreview() {
  if (!state.previewHtml) return;

  const blob = new Blob([state.previewHtml], { type: 'text/html;charset=utf-8' });
  const previewUrl = URL.createObjectURL(blob);
  const previewWindow = window.open(previewUrl, '_blank');

  if (!previewWindow) {
    URL.revokeObjectURL(previewUrl);
    setNotice('Visit blocked by browser popup settings.');
    return;
  }

  // Revoke after open so the browser can finish loading the blob document.
  window.setTimeout(() => URL.revokeObjectURL(previewUrl), 30000);
  setNotice('Opened preview in a new tab.');
}

notesInputEl.addEventListener('input', (event) => {
  state.notes = event.target.value;
  state.dirty = true;
  updateDirtyBadge();
});

notesInputEl.addEventListener('keydown', (event) => {
  if (event.key !== 'Enter' || (!event.metaKey && !event.ctrlKey)) return;
  event.preventDefault();
  generateFormEl.requestSubmit();
});

generateFormEl.addEventListener('submit', (event) => {
  event.preventDefault();
  generatePage();
});
saveBtnEl.addEventListener('click', savePage);
copyBtnEl.addEventListener('click', copyHtml);
visitBtnEl.addEventListener('click', visitPreview);

window.addEventListener('beforeunload', (event) => {
  if (!state.dirty) return;
  event.preventDefault();
  event.returnValue = '';
});

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
