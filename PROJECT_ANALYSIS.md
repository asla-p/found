# REFIND – Project Analysis & Scope of Improvement

## 1. Project Overview

### 1.1 Purpose
**REFIND** is a **Lost & Found web application** where:
- **Users** can report lost items (item name, colour, details, location, optional image) or report found items (item name, location, image).
- **Admins** can review submissions, approve/reject lost-item reports, and accept found-item uploads.

### 1.2 Tech Stack
| Layer | Technology |
|-------|------------|
| Frontend | HTML, CSS, vanilla JavaScript |
| Backend | Node.js, Express (with CORS) |
| Storage | JSON files (`backend/lost.json`, `backend/found.json`) |

### 1.3 Folder Structure
```
found it hehee/
├── index.html              # Minimal "Home" page (not main entry)
├── home/
│   ├── index.html          # Main portal: Lost | Found | Admin
│   ├── style.css
│   └── script.js
├── lost/
│   ├── lost.html           # Report lost item form
│   ├── script.js           # addLostItem() – local preview only
│   └── style.css
├── found/
│   ├── found.html          # Report found item form
│   ├── script.js           # addItem() – local preview only
│   └── style.css
├── admin/
│   ├── admin.html          # Admin panel (static + dynamic mismatch)
│   ├── script.js           # Fetches lost/found, approve/reject/accept
│   └── style.css
└── backend/
    ├── server.js           # Only admin routes; missing bootstrap & CRUD
    ├── lost.json
    ├── found.json
    └── package.json
```

---

## 2. Current Architecture & Data Flow

### 2.1 Intended Flow
1. User opens **home** → chooses **Lost** or **Found**.
2. User submits form → data sent to backend (POST `/lost` or POST `/found`) → stored in JSON.
3. Admin opens **admin** → sees lists from GET `/lost` and GET `/found` → approves/rejects or accepts via POST admin endpoints.
4. Backend updates `lost.json` / `found.json` with status.

### 2.2 What Exists in Code
- **Backend:** Only three routes in `server.js`: `POST /admin/lost/approve`, `POST /admin/lost/reject`, `POST /admin/found/accept`. No `require`, no `app` creation, no `fs`/`lostFile`/`foundFile`, no GET/POST for `/lost` or `/found`, no `listen()`.
- **Lost form:** `addLostItem()` in `lost/script.js` only renders a preview in `#result`; it **does not** call the API. Inline script in `lost.html` references `lostForm` and `message` (IDs that don’t exist).
- **Found form:** Same: `addItem()` only shows preview; inline script references `foundForm` and `message` (missing).
- **Admin:** `admin/script.js` expects `#lostItems` and `#foundItems` and uses `approveLost(index)` etc. `admin.html` has neither those divs nor the same button handlers (it has static cards and `approve(this)` / `reject(this)`).

---

## 3. What Works vs What’s Broken

### 3.1 Broken or Incomplete
| Area | Issue |
|------|--------|
| **Backend** | Server does not run: missing Express setup, `fs`/paths, GET/POST `/lost`, GET/POST `/found`, `app.listen()`. |
| **Lost submission** | Form never sends data to API; `addLostItem()` is local-only. Inline form handler uses wrong element IDs. |
| **Found submission** | Same: no API call; inline handler uses non-existent `foundForm` / `message`. |
| **Admin page** | HTML has no `#lostItems` or `#foundItems` → script fails on load. Button handlers (`approve`/`reject`) don’t match script (`approveLost`/`rejectLost`/`acceptFound`). |
| **Images** | File inputs exist but no `multipart/form-data` or file upload endpoint; images are never sent or stored. |
| **Entry point** | Root `index.html` is a bare “Home”; real portal is `home/index.html`. Unclear which URL to use. |

### 3.2 Partially Working (if backend were complete)
- Admin script logic (fetch + approve/reject/accept) is coherent and matches the existing backend admin routes.
- Admin backend routes correctly read/write JSON by index and set status.

### 3.3 Working as-is
- Static UI: home portal, lost/found forms, admin layout and styling.
- Local-only behaviour: lost/found forms show an in-page preview after “Submit”.
- CSS: basic but consistent across admin, lost, found, home.

---

## 4. Scope of Improvement

### 4.1 Critical (Must-fix for a working app)

1. **Complete the backend (`backend/server.js`)**
   - Add: `express`, `fs`, `path`, `cors`, `body-parser` (or `express.json()`).
   - Define `lostFile` and `foundFile` paths, ensure JSON files exist (e.g. `[]`).
   - Implement:
     - `GET /lost` → read and return `lost.json`.
     - `GET /found` → read and return `found.json`.
     - `POST /lost` → validate body, append to `lost.json`, return success.
     - `POST /found` → validate body, append to `found.json`, return success.
   - Keep existing `POST /admin/lost/approve`, `reject`, `POST /admin/found/accept`.
   - Call `app.listen(3000)` (or use env for port).

2. **Wire lost form to API**
   - In `lost/script.js`, have `addLostItem()` (or a single form handler) collect fields, send `POST /lost` with JSON (e.g. `item`, `colour`, `details`, `location`), then show success/error in `#result`. Remove or fix duplicate inline script in `lost.html` (use one submission path and correct IDs).

3. **Wire found form to API**
   - Same idea: one handler that POSTs to `POST /found` and shows result. Fix IDs in `found.html` so they match the script (`result` vs `message`, form id if using `FormData`).

4. **Align admin HTML with admin script**
   - Add two containers: `<div id="lostItems"></div>` and `<div id="foundItems"></div>` in `admin.html`.
   - Remove or replace static placeholder cards so the dynamic list from `script.js` is the single source of truth. Ensure buttons call `approveLost(index)`, `rejectLost(index)`, `acceptFound(index)`.

5. **Clear entry point**
   - Either make root `index.html` redirect to `home/index.html` or make it the main “Lost & Found Portal” so users have one obvious URL.

---

### 4.2 Security & Robustness

6. **Admin authentication**
   - Admin routes are open. Add simple auth (e.g. session or token, or basic password check) so only authorised users can approve/reject/accept.

7. **Stop using array index as public identifier**
   - Index-based IDs break when list order or filtering changes. Prefer stable IDs: e.g. add `id` (UUID or increment) to each item in JSON and use that in admin endpoints and UI.

8. **XSS prevention**
   - Admin script injects `item.item`, `item.details`, etc. into `innerHTML` with no escaping. Escape text (or use `textContent` / safe DOM APIs) before rendering to avoid XSS if someone submits malicious content.

9. **Input validation**
   - Backend: validate and sanitise POST body (required fields, types, length). Return 400 with clear messages for invalid input.

10. **CORS and API base URL**
    - Keep CORS configured for the front-end origin. Prefer a configurable API base URL (e.g. env or config) instead of hardcoded `http://localhost:3000` so it works in other environments.

---

### 4.3 User Experience & Consistency

11. **Error handling on frontend**
    - Replace raw `alert()` with in-page messages where possible. On fetch errors (network, 4xx/5xx), show a clear message and optionally retry.

12. **Loading and feedback**
    - Show loading state when fetching lost/found lists and when submitting forms. Disable buttons during submit to avoid double submissions.

13. **Navigation**
    - Home uses paths like `/lost/lost.html`, `/found.html`, `/admin.html`. These assume the server serves from project root. Either document how to run (e.g. static server root) or use relative paths so it works from `file://` or different bases.

14. **Form consistency**
    - Use one pattern: either a single `<form>` with `id` and `submit` handler, or a single button that calls one function. Remove duplicate handlers and wrong IDs so lost/found forms behave consistently.

15. **Admin: filter by status**
    - Allow viewing only “pending” items so admins can focus on what needs action.

---

### 4.4 Data & Features

16. **Image upload (optional but valuable)**
    - Backend: add `multipart/form-data` handling (e.g. `multer`), save files under a dedicated folder, store filename or path in `lost.json`/`found.json`. Frontend: send form as `FormData` with the file. Optionally show thumbnails in admin and in confirmation views.

17. **Timestamps**
    - Add `createdAt` (and optionally `updatedAt`) to each record for sorting and “reported on” display.

18. **Contact / claim flow (future)**
    - For “found” items: optional contact field or “claim” request so loser and finder can be connected (with privacy in mind).

---

### 4.5 Code Quality & Maintainability

19. **Single source of truth for API URL**
    - One config (e.g. `const API_BASE = '...'`) or build-time env so changing backend URL doesn’t require edits in every file.

20. **Backend structure**
    - Split routes (e.g. `routes/lost.js`, `routes/found.js`, `routes/admin.js`) and keep `server.js` for app setup and `listen`. Eases testing and future changes.

21. **Error handling and logging**
    - Backend: try/catch around file read/write, return 500 and log errors. Avoid exposing internal details in responses.

22. **README and run instructions**
    - Add a short README: how to install (`npm install` in `backend`), how to run server, which URL to open for the portal, and that frontend expects backend on port 3000 (or configured URL).

---

## 5. Priority Summary

| Priority | Focus |
|----------|--------|
| **P0** | Complete backend (bootstrap + GET/POST lost/found), wire lost/found forms to API, fix admin HTML/script mismatch, clear entry point. |
| **P1** | Stable IDs instead of index, XSS fix in admin, input validation, basic admin auth. |
| **P2** | Better errors/loading in UI, navigation/paths, optional image upload, timestamps. |
| **P3** | Refactor routes, configurable API URL, README, filter by status, future claim flow. |

This gives you a full picture of the project and a concrete scope of improvement from “make it run end-to-end” to “harden, polish, and extend.”
