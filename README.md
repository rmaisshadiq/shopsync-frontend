# ShopSync Frontend 🎨

The user interface of **ShopSync**, a responsive, modern single-page application (SPA) built using **React**, **TypeScript**, and **Vite**. 

It features premium dark-mode styling, smooth hardware-accelerated animations, debounced cart synchronization, and an inline administrative control suite.

---

## 🛠️ Technology Stack

* **Build Tool & Bundler:** [Vite](https://vitejs.dev/) (Instant HMR, TypeScript-ready)
* **View Layer:** [React 18](https://react.dev/) (Hooks, Hooks lifecycle optimization)
* **Styling:** CSS-first [Tailwind CSS v4](https://tailwindcss.com/) with a dark custom palette
* **Animations:** [GSAP (GreenSock Animation Platform)](https://greensock.com/gsap/) for staggered grid cards loading and checkout modals transition
* **Session Identifier:** Crypto UUID generated once and persisted in `localStorage`

---

## ✨ Features & User Experience (UX)

### 1. Paginated Homepage Browse
* On first mount, the interface displays paginated products from the catalog.
* Staggered fade-in animations (GSAP) run automatically when switching pages or loading results.
* Pagination controls dynamically render ellipsis `…` buttons for clean navigation on larger catalogs.

### 2. Typo-Tolerant Search
* The search input triggers queries against the Elasticsearch-backed backend.
* Instantly switches between "All Products" (homepage catalog) and "Search Results" states.

### 3. Redis-Backed Cart Persistence
* Cart items (`Product` map) are synced to Redis in the background.
* Cart save calls are debounced by 800ms to avoid overloading the server on quick quantity increments.
* Automatically reloads cart state from Upstash Redis if the browser page is refreshed.

### 4. Admin Mode Toggle
* A toggle switch in the header transforms the user view into an Administrator controls view.
* **Add Product**: Displays a floating modal to register new products with real-time numeric constraint validations (Price > 0, Stock >= 0).
* **Edit/Delete Actions**: Product cards get action controls. Deletions show immediate layout changes (snappy UI) and automatically trigger a database reflow.

---

## 📋 Prerequisites

* **Node.js** (v18+)
* **NPM** (v9+)

---

## ⚙️ Configuration (`.env`)

A `.env` template is provided. Modify it to point to your backend API gateway:

```env
VITE_API_BASE_URL=http://localhost:8080/api
```

---

## 🚀 How to Run Locally

### 1. Install Dependencies
Run in the `frontend` folder:
```bash
npm install
```

### 2. Start Dev Server
Launch Vite development server:
```bash
npm run dev
```
Open [http://localhost:5173](http://localhost:5173) in your browser.

---

## 🏗️ Folder Structure

* `src/components/`
  * `ProductGrid.tsx` — Product cards grid with GSAP animation triggers.
  * `ProductModal.tsx` — Input form for Admin product registration and edits.
  * `CheckoutModal.tsx` — Checkout summary table and order actions.
  * `SearchBar.tsx` — Text input triggering backend search.
* `src/api.ts` — API client wrapper (sends `X-Session-ID` header).
* `src/session.ts` — Browser session ID provider.
