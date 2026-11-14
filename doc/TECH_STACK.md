# Tech Stack – Task Tracker

**Project:** RTIH Intern – IT Technical Assignment (Task Tracker)
**Document:** Technology stack and architecture decisions
**Date:** 13 November 2026

---

## 1. Summary

The Task Tracker is a **React single-page application** backed by a **Laravel REST API** and a **MySQL 8** database.
- React talks to Laravel over HTTP, sending and receiving JSON (axios).
- Users log in with **Laravel Sanctum** in SPA mode: a secure session cookie plus CSRF protection.
- The database schema and sample data are defined in code with **Laravel migrations and seeders**. No hand-written `.sql` files are used.

| Layer | Technology | Version |
|---|---|---|
| Frontend framework | React | 19 |
| Build tool / dev server | Vite | 6+ |
| Client routing | React Router (`react-router-dom`) | 7 |
| HTTP client | axios (automatic `XSRF-TOKEN` handling) | 1.x |
| Styling / layout | Bootstrap (npm) | 5.3 |
| Backend framework | **Laravel** | 12 |
| Language | PHP | 8.2+ (8.3 recommended) |
| Authentication | Laravel Sanctum (SPA cookie mode) | 4.x |
| ORM / DB access | Eloquent + query builder (PDO prepared statements) | bundled |
| Schema & data | Migrations, factories, seeders | bundled |
| Database | **MySQL** Community Server | 8.0 / 8.4 LTS |
| Testing (backend) | PHPUnit feature tests (`php artisan test`) | bundled |
| Testing (API) | Postman | – |
| Package managers | Composer 2 (PHP), npm (Node.js 22 LTS) | – |
| Version control | Git | 2.x |

---

## 2. Backend – Laravel

**Choice:** Laravel, used purely as a JSON API. No Blade pages and no Inertia.

**Why Laravel:**
- The PDF explicitly allows Laravel.
- It covers most of the assignment's requirements with tested, standard tools:

| Assignment need | Laravel feature |
|---|---|
| Database tables & relationships | Migrations + Eloquent relationships (`User hasMany Task`) |
| Sample data | Factories + seeders |
| Server-side validation + friendly errors | Form Requests → automatic 422 JSON with field errors |
| Status values | PHP backed enums + `Rule::enum()` + model casts |
| Password hashing | `hashed` cast / `Hash::make()` → `password_hash()` (bcrypt) |
| Password check | `Auth::attempt()` → `Hash::check()` → `password_verify()` |
| Login for a React SPA | Sanctum stateful (session cookie) authentication |
| Only logged-in users | `auth:sanctum` middleware → 401 |
| Ownership / roles | `TaskPolicy` + `Gate::authorize()` |
| Prepared statements | Eloquent and the query builder always bind parameters through PDO |
| CSRF | Sanctum `XSRF-TOKEN` cookie + `VerifyCsrfToken` on every state-changing request |
| No raw errors to users | `APP_DEBUG=false` → generic messages; details only in `storage/logs` |
| Brute-force protection | `throttle` middleware on login and register |
| Pagination (bonus) | `paginate()` with metadata built in |
| Automated tests | PHPUnit feature tests with `RefreshDatabase` |

**Being able to explain what the framework does underneath** matters, because the PDF assesses awareness of secure coding. In particular:
- Eloquent uses PDO prepared statements.
- The bcrypt hasher wraps `password_hash()` and `password_verify()`.
- The CSRF middleware compares the header token with the session token using `hash_equals()`.

---

## 3. Frontend – React

**Choice:** React + Vite + React Router + axios + Bootstrap 5.

| Concern | Approach |
|---|---|
| Routing | Public routes: `/login`, `/register`. Protected routes: `/`, `/tasks/new`, `/tasks/:id/edit`. |
| Auth state | `AuthContext` loads `GET /api/user` on start; `ProtectedRoute` redirects guests (convenience only; the backend enforces access) |
| API client | One axios instance with `withCredentials` + `withXSRFToken`; interceptors handle 401 → login and 419 → refresh the CSRF cookie |
| Filters | Search and status are kept in the URL (`useSearchParams`) |
| Validation | HTML5 + inline messages; Laravel 422 `errors` mapped onto form fields |
| XSS | JSX auto-escaping; `dangerouslySetInnerHTML` is never used |
| Feedback | Bootstrap alerts/toasts; confirm modal before delete |
| Responsive | Bootstrap grid; table on desktop, cards on mobile |

There is no global state library. React state plus one context is enough.

---

## 4. Database – MySQL 8 via Migrations

**Choice:** MySQL Community Server 8.x, InnoDB, `utf8mb4`. MariaDB isn't used. The schema is managed **only** through Laravel migrations.

**Why migrations instead of `.sql` files:**
- The schema is version-controlled alongside the code. Each change is a new migration file, and Git shows how it evolved.
- The database is built with one command, `php artisan migrate --seed`, with no manual import step.
- Tests build a fresh MySQL schema automatically through `RefreshDatabase`.
- Migrations can be undone with `php artisan migrate:rollback`.

**Tables**

| Table | Key columns |
|---|---|
| `users` | `id`, `name`, `email` (unique), `password` (bcrypt), `role` ENUM('user','admin') default `user`, timestamps |
| `tasks` | `id`, `user_id` FK → `users.id` cascade on delete, `title` VARCHAR(150), `description` TEXT null, `status` ENUM('Pending','In Progress','Completed') default `Pending`, `priority` ENUM('Low','Medium','High'), `due_date` DATE null, timestamps |
| Laravel support tables | `sessions` (login sessions), `password_reset_tokens`, `cache` + `cache_locks` (rate limiter) |

**Indexes:** `tasks(user_id, status)` for the dashboard, and `tasks(title)` for search.

**Mass-assignment safety:**
- `users.role` and `tasks.user_id` are **not fillable**.
- So a request body can never make someone an admin or reassign a task.

The full migration details are in [BUILD_PLAN.md – Phase 1](BUILD_PLAN.md#phase-1--database-migrations-models-factories--seeders).

---

## 5. Architecture

### 5.1 Request flow

```
React (browser :5173)
   │  axios → /api/tasks   (cookie: laravel_session, header: X-XSRF-TOKEN)
   ▼
Vite proxy (dev) / same domain (prod)
   ▼
Laravel (:8000)
   ├─ statefulApi()       → session + CSRF check (419 on mismatch)
   ├─ auth:sanctum        → 401 if not logged in
   ├─ FormRequest         → 422 with field errors
   ├─ TaskPolicy          → 404 / 403 if not permitted
   ├─ Controller + Eloquent (prepared statements, scoped to the user)
   └─ TaskResource        → JSON response
```

### 5.2 Same-origin setup
- **Dev:** Vite forwards `/api` and `/sanctum` to `localhost:8000`, so the browser sees one origin.
- **Prod:** serve the React build (`frontend/dist`) and Laravel from the same domain. Set `SANCTUM_STATEFUL_DOMAINS`, `SESSION_DOMAIN` and `SESSION_SECURE_COOKIE=true` accordingly.
- Session cookies are `HttpOnly` and `SameSite=Lax`, so JavaScript can't read them.

---

## 6. Authentication & Authorization

| Action | `user` | `admin` |
|---|---|---|
| View own tasks | ✅ | ✅ |
| Create / edit / change status / delete own tasks | ✅ | ✅ |
| View all users' tasks | ❌ 403 | ✅ read-only |
| View another user's task | ❌ 404 | ✅ |
| Modify another user's task | ❌ 404 | ❌ 403 |

- **Rule:** only a task's owner can change it. Admins have read-only oversight.
- **Enforcement:** `TaskPolicy` is called from every controller action. `user_id` always comes from `$request->user()`.
- **404 for strangers:** non-owners get `denyAsNotFound()`, so they can't tell another user's task exists.

---

## 7. Security Controls

| Threat | Control |
|---|---|
| SQL injection | Eloquent/query builder parameter binding; no raw SQL with user input |
| XSS | React auto-escaping; JSON-only API; no `dangerouslySetInnerHTML` |
| CSRF | Sanctum `XSRF-TOKEN` cookie → `X-XSRF-TOKEN` header, checked on every POST/PUT/PATCH/DELETE (including login) |
| Weak password storage | bcrypt (`password_hash()`) via the `hashed` cast |
| Session fixation | `session()->regenerate()` on login; `invalidate()` + `regenerateToken()` on logout |
| IDOR | `TaskPolicy` ownership checks; user ID taken from the session |
| Privilege escalation | `role` not fillable; never accepted from requests |
| Brute force | `throttle:5,1` on login and register |
| Information leakage | `APP_DEBUG=false`; generic login error; `UserResource` hides password and token; `.env` git-ignored |
| Invalid input | Form Request validation, enum rules, length limits |

---

## 8. Development & Testing Tools

| Tool | Purpose |
|---|---|
| Composer / Artisan | Install Laravel, generate code, run migrations, seeders and tests |
| npm / Vite | Run and build React |
| MySQL Workbench | Inspect tables and data |
| PHPUnit (`php artisan test`) | Automated feature tests against a MySQL test database |
| Postman | Manual API tests, including forged requests (no session, wrong owner, no CSRF token) |
| Browser DevTools | Network, cookies, responsive checks |
| Git | Version control (`.env`, `vendor`, `node_modules`, `dist` are git-ignored) |

---

## 9. Backup & Restore

| Purpose | Command |
|---|---|
| Rebuild the schema + demo data from code | `php artisan migrate:fresh --seed` |
| Back up live data | `mysqldump -u root -p --single-transaction task_tracker > backup_YYYY-MM-DD.sql` |
| Restore live data | `mysql -u root -p task_tracker < backup_YYYY-MM-DD.sql` |

Migrations rebuild the **structure**. A `mysqldump` backup preserves the **data** users have entered. The dump is a generated backup file, not a project source file. In production, schedule a daily dump, keep dated copies off the server, and test restores regularly.

---

## 10. Alternatives Considered

| Option | Decision | Reason |
|---|---|---|
| Core PHP | Not used | More code to write and maintain; Laravel provides tested security building blocks |
| CodeIgniter 4 | Not used | Also allowed, but its SPA authentication story is weaker than Laravel Sanctum |
| Hand-written `.sql` schema | Not used | Migrations are versioned, can be rolled back, and are used by the tests |
| MariaDB | Not used | MySQL chosen as the single database |
| Sanctum API tokens / JWT in localStorage | Not used | Stealable through XSS; an HttpOnly session cookie + CSRF is safer for a same-domain SPA |
| Inertia / Laravel React starter kit | Not used | The assignment structure is easier to explain as a separate React frontend + JSON API |
| Redux / Zustand | Not used | Too much for one resource |
