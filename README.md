# Smart Bookmark Organizer (Chrome Extension)

A Manifest V3 Chrome extension that smartly bookmarks the current tab, classifies it into a topic-based folder, and stores rich metadata for quick reference. The popup lets you explore all smart folders and open sites directly.

## Features
- **One-click smart bookmark:** Saves the active tab, detects its topic via title/URL/page metadata, and files it into a matching folder (creates folders automatically under a Smart Bookmarks root).
- **Metadata capture:** Stores domain, description/OG data, keyword hints, and a text snippet for at-a-glance context.
- **Folder explorer:** Popup lists all smart folders and lets you open bookmarked sites directly.
- **Lightweight heuristics:** No external APIs required; categorization runs locally using keyword matching.

## Project structure
```
manifest.json             # Extension manifest (MV3)
src/background.js         # Service worker for bookmarking, categorization, and metadata storage
src/popup.html            # Popup UI
src/popup.css             # Popup styling
src/popup.js              # Popup logic (save + folder explorer)
scripts/generate-icons.js # Recreates extension icons locally (keeps repository text-only)
assets/                   # Icon output lives here after running the generator
```

## Generate icons (text-only repo)
The repository avoids committing binary assets. Before loading the extension, generate the PNG icons:

```
node scripts/generate-icons.js
```

This creates `assets/icon16.png`, `assets/icon48.png`, and `assets/icon128.png` so Chrome can display the toolbar/action icons.

## Running the extension locally
1. Open **chrome://extensions** in Chrome.
2. Enable **Developer mode** (top-right toggle).
3. Click **Load unpacked** and select this repository folder.
4. Pin the extension to the toolbar for quick access.

## Quick console simulation
If you want to see the smart-folder and metadata flow without loading Chrome, run the Node-based simulator:

```
node scripts/simulate.js
```

It classifies four sample tabs, prints their stored metadata, and shows the resulting Smart Bookmarks tree in the console.

## How smart bookmarking works
- When you click **“Smart bookmark this tab”**, the popup asks the background service worker to:
  1. Capture page metadata (title, URL, meta description/keywords, OG tags, and a short text snippet) via an injected script.
  2. Score the page against a keyword map (Technology, Business, Education, Entertainment, News, Design, Science, Shopping, Travel, Sports) and fall back to **Unsorted** if no clear match exists.
  3. Ensure a **Smart Bookmarks** root folder and a child folder for the detected topic; create them if they don’t exist.
  4. Create (or reuse) the bookmark, then persist a metadata record in `chrome.storage.local` keyed by the bookmark ID.
- The popup’s folder explorer loads the Smart Bookmarks tree with stored metadata so you can open items directly.

## Ready-to-deploy notes
- No build step is required; the extension runs directly from source (ensure you ran `node scripts/generate-icons.js` first).
- All logic stays client-side—no external services or credentials needed.

## Next steps to publish
1. Verify functionality:
   - Load the unpacked extension and confirm bookmarking, topic folders, and metadata cards work as expected.
   - Test on a few sites across different categories to validate sorting heuristics.
2. Prepare assets:
   - Provide final icon artwork (16/48/128px) that meets Chrome Web Store guidelines.
   - Capture screenshots of the popup and write a clear store listing description.
3. Package the extension:
   - From the repository root, zip the contents (including `manifest.json`, `src`, and `assets`).
4. Submit to the **Chrome Web Store Developer Dashboard**:
   - Upload the zip, fill out listing details (description, screenshots, category), set visibility, and pay the one-time developer fee if not already done.
   - Publish and monitor the review status.
5. Post-launch hygiene:
   - Track user feedback, iterate on the categorization keyword map, and consider adding sync storage, manual topic overrides, or analytics (while respecting privacy).
