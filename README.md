# Smart Bookmark Organizer (Chrome Extension)

A Manifest V3 Chrome extension that smartly bookmarks the current tab, classifies it into a topic-based folder, and stores rich metadata for quick reference. The popup focuses on saving, quick folder corrections, custom folder creation, reminders, and a one-click Dashboard button that opens the full manager where you can edit or clean up bookmarks with extra notes/tags.

## Features
- **One-click smart bookmark:** Saves the active tab, detects its topic via title/URL/page metadata, and files it into a matching folder (creates folders automatically under a Smart Bookmarks root). The classifier now weights metadata/snippets far above the domain or title so content-rich pages (e.g., YouTube engineering interviews) land in the right folder instead of generic entertainment.
- **Metadata capture:** Stores domain, description/OG data, keyword hints, and a text snippet for at-a-glance context.
- **Folder control without clutter:** The popup shows the captured metadata, auto-selected folder picker, and a **Create & move** field so you can immediately send the saved tab to a brand-new folder if the suggestion is wrong—no mini list required.
- **Full manager page:** A wide **Dashboard** button opens a tab that shows every smart folder with controls to edit titles, add notes/tags, reminders, or delete bookmarks/folders.
- **Drag-and-drop organizer:** Grid-based manager handles lots of folders at once, lets you drag bookmarks onto any folder to move them, or pick a new folder while editing metadata.
- **Endless folder palettes:** Each folder gets its own auto-generated color palette (surface/border/accent/text) so large grids stay visually scannable; when creating a folder from the popup you can also choose your own color.
- **Lightweight heuristics:** No external APIs required; categorization runs locally using keyword matching, extra software-engineering/deployment terms, and URL-path cues.
- **Fine-grained tech/learning folders:** Software items now land in focused folders such as **React & Frontend**, **Backend & APIs**, **DevOps & Delivery**, **Data Structures & Algorithms**, **Architecture & Design**, or **Engineering Management**; learning content splits into **Language Learning**, **Instructional Design/LMS**, and **Marketing Learning** when metadata supports it.
- **Metadata-aware search:** The manager search box checks folder titles plus bookmark titles, URLs, descriptions/snippets, notes, domains, tags, and reminders so you can find anything even inside large folders.
- **Filter/search the manager:** Use the folder-type filter or search box on the manager page to quickly jump to a subset of folders when you have many.
- **Reminders:** Set or clear reminders from the popup or manager; defaults to none if you leave the field blank, and reminder notifications will fire at the scheduled time.

## Project structure
```
manifest.json             # Extension manifest (MV3)
src/background.js         # Service worker for bookmarking, categorization, and metadata storage
src/popup.html            # Popup UI
src/popup.css             # Popup styling
src/popup.js              # Popup logic (save + folder and reminder controls)
src/manage.html           # Full-page manager for editing/deleting bookmarks and metadata
src/manage.css            # Manager styling
src/manage.js             # Manager interactions and background calls
src/icon-base64.json      # Shared Base64 artwork used to paint the toolbar icon
scripts/generate-icons.js # Recreates extension icons locally (keeps repository text-only)
assets/                   # Icon output lives here after running the generator
```

## Optional: export PNG toolbar icons
The toolbar icon now renders directly from the bundled Base64 artwork, so you can load the extension without generating any files. If you need standalone PNGs (for Chrome Web Store uploads or manual packaging), run:

```
npm install        # runs the postinstall hook
# or
npm run generate:icons
```

The script emits `assets/icon16.png`, `assets/icon48.png`, and `assets/icon128.png` derived from the provided design while keeping the repo text-only.

## Running the extension locally
1. (Optional) Run `npm install` if you want to use the console simulator or export the PNG icons.
2. Open **chrome://extensions** in Chrome.
3. Enable **Developer mode** (top-right toggle).
4. Click **Load unpacked** and select this repository folder.
5. Pin the extension to the toolbar for quick access.
6. From the popup, click **Dashboard** (or open the Options link) to open the full manager page where you can edit bookmark titles, add notes/tags/reminders, move items to another folder (drag cards or pick a folder in Edit), or delete items/folders.
7. When prompted, allow notification access so reminder alarms can surface a toast at the scheduled time.

## Quick console simulation
If you want to see the smart-folder and metadata flow without loading Chrome, run the Node-based simulator:

```
node scripts/simulate.js
```

It classifies sample tabs across finance, Arabic faith content, and multiple YouTube pages (home, engineering interviews, Kubernetes deployment podcast), prints their stored metadata/tags, and shows the resulting Smart Bookmarks tree in the console.

## How smart bookmarking works
- When you click **“Smart bookmark this tab”**, the popup asks the background service worker to:
  1. Capture page metadata (title, URL, meta description/keywords, OG tags, and a short text snippet) via an injected script.
  2. Score the page against a weighted keyword map (React/frontend, backend/APIs, DevOps/delivery, data structures & algorithms, architecture/design, engineering management/leadership, engineering interviews, general software, language learning, LMS/marketing courses, plus the existing finance/business/entertainment/news/design/science/shopping/travel/sports/faith profiles) using metadata/snippets first, URL-path cues second, and domain last, and fall back to **Unsorted** if no clear match exists.
  3. Derive tags (including **course** for sites like Udemy/Coursera/Almentor/edX/LinkedIn Learning and **tutorial** for playlists or walkthrough pages) alongside tech/topic hints.
  4. Ensure a **Smart Bookmarks** root folder and a child folder for the detected topic; create them if they don’t exist.
  5. Create (or reuse) the bookmark, then persist a metadata record in `chrome.storage.local` keyed by the bookmark ID.
- The popup keeps saving streamlined: it shows the metadata snapshot, auto-selected folder picker, a custom folder creator, and reminder control alongside a single **Dashboard** button to dive into full management.

## Ready-to-deploy notes
- No build step is required; the extension runs directly from source and paints its toolbar icon at runtime.
- All logic stays client-side—no external services or credentials needed.

## Next steps to publish
1. Verify functionality:
   - Load the unpacked extension and confirm bookmarking, topic folders, and metadata cards work as expected.
   - Test on a few sites across different categories to validate sorting heuristics.
2. Prepare assets:
   - Run `npm run generate:icons` to export PNG artwork (16/48/128px) for Chrome Web Store guidelines or replace the Base64 data with your final icon design.
   - Capture screenshots of the popup and write a clear store listing description.
3. Package the extension:
   - From the repository root, zip the contents (including `manifest.json`, `src`, and `assets`).
4. Submit to the **Chrome Web Store Developer Dashboard**:
   - Upload the zip, fill out listing details (description, screenshots, category), set visibility, and pay the one-time developer fee if not already done.
   - Publish and monitor the review status.
5. Post-launch hygiene:
   - Track user feedback, iterate on the categorization keyword map, and consider adding sync storage, manual topic overrides, or analytics (while respecting privacy).
