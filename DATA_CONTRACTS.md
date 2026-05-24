# Data Contracts

## Browser Storage

### `lf_active_offer_id`

- Scope:
  browser-local UI state
- Stores:
  the currently selected offer id
- Expected shape:
  string

### `lf_last_open_page_by_offer`

- Scope:
  browser-local UI convenience state
- Stores:
  a JSON object mapping `offerId -> pageId`
- Expected shape:

```json
{
  "offer_founder_sprint": "page_founder_lp_01",
  "offer_webinar_system": "page_webinar_lp_01"
}
```

## API Contracts

### `GET /api/offers`

Response:

```json
{
  "offers": [
    {
      "id": "offer_founder_sprint",
      "name": "Founder Sprint",
      "angle": "Premium positioning for service founders",
      "audience": "Service businesses"
    }
  ]
}
```

### `GET /api/pages?offerId=<id>`

Purpose:
- return page summaries for one offer only

Response:

```json
{
  "pages": [
    {
      "id": "page_founder_lp_01",
      "offerId": "offer_founder_sprint",
      "name": "Founder Sprint Landing Page",
      "pageType": "landing",
      "updatedAt": "2026-05-20T09:15:00.000Z"
    }
  ]
}
```

### `GET /api/pages/:id`

Purpose:
- return the full saved payload for one page

Response:

```json
{
  "page": {
    "id": "page_founder_lp_01",
    "offerId": "offer_founder_sprint",
    "name": "Founder Sprint Landing Page",
    "pageType": "landing",
    "promptNotes": "Confident, premium, direct response tone",
    "html": "<!doctype html>...",
    "updatedAt": "2026-05-20T09:15:00.000Z"
  }
}
```

### `POST /api/offers/:offerId/generate-page`

Purpose:
- return a deterministic local stub draft for the selected offer

Request:

```json
{
  "pageType": "landing",
  "notes": "Premium direct response angle"
}
```

Response:

```json
{
  "draft": {
    "id": "draft_offer_founder_sprint_001",
    "offerId": "offer_founder_sprint",
    "name": "Founder Sprint Landing Page",
    "pageType": "landing",
    "promptNotes": "Premium direct response angle",
    "html": "<!doctype html>...",
    "updatedAt": "2026-05-22T02:00:00.000Z"
  },
  "generated": true
}
```

### `POST /api/pages/:id/save`

Request:

```json
{
  "html": "<!doctype html>...</html>",
  "promptNotes": "Premium direct response angle"
}
```

Response:

```json
{
  "page": {
    "id": "draft_offer_founder_sprint_001",
    "offerId": "offer_founder_sprint",
    "name": "Founder Sprint Landing Page",
    "pageType": "landing",
    "promptNotes": "Premium direct response angle",
    "html": "<!doctype html>...</html>",
    "updatedAt": "2026-05-22T02:00:00.000Z"
  }
}
```

## Precedence Rules

- selected offer is the source of truth for which page summaries appear in the list
- saved page detail owns the persisted `html` and `promptNotes`
- generation can produce a working draft before save, but it is not a saved member artifact until persisted
- local UI state may remember the last open page, but it must not cross offers incorrectly

## Product Slice Rule

This exercise is centered on one product slice:

- generate landing page
- preview landing page
- save landing page
- reopen landing page

Do not widen beyond that unless you finish early and can defend the extra scope.
