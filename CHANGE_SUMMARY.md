## Change Summary

### What Changed
1. Fixed the generate flow to match the API response shape by reading the `draft` object returned from the server and updating UI state from it.
2. Fixed the save flow payload to match backend expectations by sending `html` and `promptNotes`.
3. Added unsaved-changes protection:
	- `confirmIfDirty()` prompts before switching offer/page when there are unsaved edits.
	- A `beforeunload` guard triggers the browser's native leave warning on refresh/close with unsaved edits.

### AI Tools or Agents Used
I had used co-pilot ( plan mode ) to understand the problem statement, the used co-pilot to fix the issues

### Product Decision — Save Behaviour

A generated draft does not appear in the Saved Pages list until the user explicitly clicks Save Page. The list represents committed member artifacts, not working state. A draft is in-progress until the user decides to keep it.

To make this safe, I added unsaved-change guards at every navigation point:

- Switching offers
- Opening a different saved page
- Generating a new draft over an existing unsaved one
- Closing or refreshing the browser tab (`beforeunload`)

All four guards use a single `confirmIfDirty(action)` helper so the behaviour is consistent and the message is easy to update in one place.

The dirty badge also now turns amber when there are unsaved changes, making the state visually obvious rather than just a text label.

### What I Verified

**Core vertical slice — walked end to end:**
- Select an offer → correct pages load for that offer only
- Enter prompt notes → generate → preview renders valid HTML
- Draft does not appear in Saved Pages list before save
- Click Save Page → page appears in Saved Pages list under the correct offer
- Refresh page → app restores last selected offer and last open page from localStorage
- Reopened page renders the same saved HTML

**Unsaved-change guards:**
- Switching offers with a dirty draft triggers the confirmation popup
- Clicking a different saved page with a dirty draft triggers the popup
- Generating again over an existing unsaved draft triggers the popup
- Choosing Cancel in any popup keeps the current draft intact

**Edge cases confirmed:**
- Saving a brand-new draft (never saved before) correctly derives the offerId from the draft ID and creates the page record
- Offer scoping is clean — switching offers clears the working state and version panel

