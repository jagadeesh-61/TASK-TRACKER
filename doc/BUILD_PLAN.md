# Phase-wise Build Plan – Task Tracker

**Project:** RTIH Intern – IT Technical Assignment (Task Tracker)
**Stack:** React (frontend) · Laravel REST API (backend) · MySQL 8 (database)
**Date:** 13 November 2026

This plan breaks everything the assignment PDF asks for into phases, in build order. Each phase gives a goal, the work to do, the files it produces, and a **"Done when"** checklist. A phase is complete only when every item on that checklist passes.

**Database approach:** the schema and sample data are defined in code, using **Laravel migrations, factories and seeders**. No hand-written `.sql` files are used. The database is built with one command: `php artisan migrate --seed`.

---

## Phase Overview

| # | Phase | PDF reference | Est. time |
|---|---|---|---|
| 0 | Environment & project setup | §2 Technology | 1.5 h |
| 1 | Database: migrations, models, seeders | §3, §4 | 2 h |
| 2 | Backend foundation: API routes, Sanctum, error handling | §2 | 1.5 h |
| 3 | Frontend foundation: React skeleton | §2, §5 | 2 h |
| 4 | **Level 1** – Basic task CRUD | Level 1 | 3 h |
| 5 | **Level 2** – Status, search, filter, validation | Level 2 | 2 h |
| 6 | **Level 3** – Login, authorization, security | Level 3 | 3.5 h |
| 7 | Bonus – summary, pagination, priority, due date | §9 | 1.5 h |
| 8 | Testing – PHPUnit feature tests + Postman + manual | §8 | 2.5 h |
| 9 | Documentation & submission | §6, §10 | 2 h |
| | **Total** | | **≈ 21.5 h (2–3 days)** |

The PDF asks for Level 1 to be finished before Levels 2 and 3, and this plan follows that order. However, the Phase 1 migrations already include `users.role` and `tasks.user_id`, so Level 3 doesn't force a schema rewrite. In the final code, every task is created for the logged-in user (see Phase 6).

---

## Phase 0 – Environment & Project Setup

**Goal:** Every tool is installed, and fresh Laravel and React projects both run.

### Tools to install

| Tool | Version | Purpose |
|---|---|---|
| PHP | 8.2+ (extensions: `pdo_mysql`, `mbstring`, `openssl`, `tokenizer`, `xml`, `ctype`, `fileinfo`, `curl`) | Runs Laravel |
| Composer | 2.x | PHP package manager (installs Laravel) |
| MySQL Community Server | 8.0 or 8.4 LTS | Database |
| MySQL Workbench (or CLI) | 8.x | Inspect data, backups |
| Node.js | 22 LTS (includes npm) | React tooling |
| Git | 2.x | Version control |
| VS Code | latest | Editor |
| Postman | latest | API testing |

> Use **MySQL Server**. XAMPP's bundled database is MariaDB, so don't use it.

### Tasks
- [ ] Install the tools and check versions: `php -v`, `composer -V`, `mysql --version`, `node -v`.
- [ ] Create the project root `task-tracker/` and run `git init`.
- [ ] Install the Laravel API's dependencies (the `backend/` project is already in the repo): `cd backend && composer install`.
- [ ] Install the React app's dependencies (React, React Router, axios, Bootstrap): `cd frontend && npm install`.
- [ ] In MySQL, create two databases, `task_tracker` and `task_tracker_test`, plus an app user. Use the Workbench GUI or one-off CLI commands; no `.sql` file is needed.
- [ ] Configure `backend/.env`:
  ```
  APP_NAME="Task Tracker"
  APP_ENV=local
  APP_DEBUG=true            # false in production / review demo
  APP_URL=http://localhost:8000
  FRONTEND_URL=http://localhost:5173

  DB_CONNECTION=mysql
  DB_HOST=127.0.0.1
  DB_PORT=3306
  DB_DATABASE=task_tracker
  DB_USERNAME=task_app
  DB_PASSWORD=********

  SESSION_DRIVER=database
  SESSION_DOMAIN=null
  SANCTUM_STATEFUL_DOMAINS=localhost:5173,127.0.0.1:5173
  ```
- [ ] Update `.env.example` with the same keys and **placeholder** values. Laravel's `.gitignore` already excludes `.env` and `vendor/`.

### Done when
- [ ] `php artisan serve` shows the Laravel welcome page at `http://localhost:8000`.
- [ ] `npm run dev` shows the React page at `http://localhost:5173`.
- [ ] `php artisan migrate` connects to MySQL and creates Laravel's default tables.
- [ ] The first Git commit has been made.

---

## Phase 1 – Database: Migrations, Models, Factories & Seeders

**Goal:** One command builds the whole database, with sample data, from code.

### 1.1 Enums (PHP backed enums, used everywhere for consistency)

| File | Values |
|---|---|
| `app/Enums/UserRole.php` | `User = 'user'`, `Admin = 'admin'` |
| `app/Enums/TaskStatus.php` | `Pending = 'Pending'`, `InProgress = 'In Progress'`, `Completed = 'Completed'` |
| `app/Enums/TaskPriority.php` | `Low`, `Medium`, `High` (bonus) |

### 1.2 Migrations

**Default `users` migration** (ships with Laravel): `id`, `name`, `email` (unique), `password`, `remember_token`, `timestamps`.

**New: `xxxx_add_role_to_users_table.php`**
```php
$table->enum('role', ['user', 'admin'])->default('user')->after('password');
```

**New: `xxxx_create_tasks_table.php`**

| Column | Migration code | Notes |
|---|---|---|
| `id` | `$table->id()` | PK, BIGINT UNSIGNED |
| `user_id` | `$table->foreignId('user_id')->constrained()->cascadeOnDelete()` | FK → `users.id` |
| `title` | `$table->string('title', 150)` | Required |
| `description` | `$table->text('description')->nullable()` | Optional |
| `status` | `$table->enum('status', ['Pending','In Progress','Completed'])->default('Pending')` | MySQL rejects invalid values |
| `priority` | `$table->enum('priority', ['Low','Medium','High'])->default('Medium')` | Bonus |
| `due_date` | `$table->date('due_date')->nullable()` | Bonus |
| `created_at`, `updated_at` | `$table->timestamps()` | Matches the PDF's `created_at` |
| index | `$table->index(['user_id', 'status'])` | Speeds up the dashboard query |
| index | `$table->index('title')` | Speeds up title search |

Laravel's defaults already give **InnoDB** and **utf8mb4**.

### 1.3 Models

- **`app/Models/User.php`**
  - `$fillable`: `name`, `email`, `password`
  - `role` is deliberately **not** fillable, so a user can't promote themselves through mass assignment
  - casts: `password => 'hashed'`, `role => UserRole::class`
  - `tasks()` → `hasMany(Task::class)`
  - `isAdmin(): bool`
- **`app/Models/Task.php`**
  - `$fillable`: `title`, `description`, `status`, `priority`, `due_date`
  - `user_id` is deliberately **not** fillable; it's always set from the logged-in user
  - casts: `status => TaskStatus::class`, `priority => TaskPriority::class`, `due_date => 'date'`
  - `user()` → `belongsTo(User::class)`
  - Query scopes: `scopeSearch($q, $term)` and `scopeStatus($q, $status)`

### 1.4 Factories & seeders

- [ ] `database/factories/TaskFactory.php`: realistic titles and descriptions, a random status, priority and due date.
- [ ] `database/seeders/UserSeeder.php`, with fixed test accounts (shown in the README):

  | Name | Email | Password | Role |
  |---|---|---|---|
  | Admin User | `admin@example.com` | `Admin@123` | admin |
  | Alice Sharma | `alice@example.com` | `User@1234` | user |
  | Bob Kumar | `bob@example.com` | `User@1234` | user |

- [ ] `database/seeders/TaskSeeder.php`: about 8 tasks per user, covering every status. Alice and Bob each get a task with a similar title, so it's easy to test that search never leaks the other user's tasks.
- [ ] `DatabaseSeeder.php` calls `UserSeeder` and `TaskSeeder`.

### Commands
```bash
php artisan migrate --seed          # first time
php artisan migrate:fresh --seed    # reset everything to the seed state
```

### Done when
- [ ] `php artisan migrate:fresh --seed` runs with no errors on an empty database.
- [ ] MySQL shows `users` and `tasks` with the foreign key and indexes, and the seed rows.
- [ ] Passwords in `users.password` start with `$2y$` (bcrypt).
- [ ] The schema reasoning is written down for the review: why ENUMs, why the foreign key and cascade, why those indexes, why `role` and `user_id` aren't fillable.

---

## Phase 2 – Backend Foundation (Laravel API)

**Goal:** API routing, Sanctum SPA authentication, consistent JSON responses and safe error handling.

### Tasks
- [ ] `bootstrap/app.php`:
  - `->withMiddleware(fn ($m) => $m->statefulApi())`. This gives requests from the React origin session-cookie authentication **and CSRF protection**.
  - `->withExceptions(...)`: always render JSON for `api/*` requests, with the 404/403/401/422 messages kept consistent.
- [ ] `config/sanctum.php`: stateful domains come from `.env` (`localhost:5173`).
- [ ] `config/cors.php`: `paths: ['api/*', 'sanctum/csrf-cookie']`, `supports_credentials: true`, `allowed_origins: [env('FRONTEND_URL')]`.
- [ ] `routes/api.php`: a health route `GET /api/health`.
- [ ] Use **API Resources** for all responses, so the JSON shape is controlled and no hidden columns leak:
  - `app/Http/Resources/TaskResource.php`
  - `app/Http/Resources/UserResource.php`, which never exposes `password` or `remember_token`
- [ ] Error safety:
  - With `APP_DEBUG=false`, Laravel returns generic messages. No stack traces, SQL or credentials are shown.
  - Real errors go to `storage/logs/laravel.log`.

### Response conventions
```json
// success (resource)
{ "data": { "id": 1, "title": "…", "status": "Pending", … }, "message": "Task created" }
// validation error (422) – Laravel's built-in format
{ "message": "The title field is required.", "errors": { "title": ["The title field is required."] } }
```

### Status codes
`200` OK · `201` Created · `204` No content · `401` Unauthenticated · `403` Forbidden · `404` Not found · `419` CSRF token mismatch · `422` Validation error · `429` Too many requests · `500` Server error

### Done when
- [ ] `GET http://localhost:8000/api/health` returns JSON in Postman.
- [ ] An unknown `/api/...` route returns a JSON 404.
- [ ] With `APP_DEBUG=false` and the database stopped, the API returns a generic 500 message with no internal details.

---

## Phase 3 – Frontend Foundation (React)

**Goal:** A React shell with routing, layout, a pre-configured API client and shared UI.

### Tasks
- [ ] `vite.config.js`: proxy `/api` and `/sanctum` → `http://localhost:8000`. The browser then sees one origin, which makes cookies and CSRF simple.
- [ ] Import Bootstrap CSS and JS in `main.jsx`.
- [ ] `src/api/client.js`: an axios instance:
  ```js
  axios.create({ baseURL: '/', withCredentials: true, withXSRFToken: true,
                 headers: { Accept: 'application/json' } })
  ```
  axios automatically reads Laravel's `XSRF-TOKEN` cookie and sends it as the `X-XSRF-TOKEN` header. A response interceptor handles 401 (redirect to login) and 419 (fetch a fresh CSRF cookie and retry once).
- [ ] `src/api/auth.js` and `src/api/tasks.js`: one function per endpoint.
- [ ] Routes (`react-router-dom`):
  - `/login`, `/register`
  - `/` (dashboard), `/tasks/new`, `/tasks/:id/edit`
  - `*` (404)
- [ ] Layout: `Layout`, `Navbar`, `NotFoundPage`.
- [ ] Shared UI:
  - `AlertMessage` / toast for success and error messages
  - `StatusBadge`
  - `Spinner`
  - `ConfirmModal`
  - `FieldError`

### Done when
- [ ] Every route renders a placeholder page.
- [ ] The dashboard calls `/api/health` through the proxy and shows the result.
- [ ] The layout works at 360 px (phone) and at desktop width.

---

## Phase 4 – Level 1: Basic Task Management

**Goal:** Full create, read, update and delete for tasks, end to end.

### Backend

```php
// routes/api.php
Route::apiResource('tasks', TaskController::class);
```

| Method | Endpoint | Controller method | Success |
|---|---|---|---|
| `GET` | `/api/tasks` | `index` – newest first | 200 |
| `GET` | `/api/tasks/{task}` | `show` | 200 / 404 |
| `POST` | `/api/tasks` | `store` – `{title, description}` | 201 |
| `PUT` | `/api/tasks/{task}` | `update` – title and description | 200 / 404 |
| `DELETE` | `/api/tasks/{task}` | `destroy` | 200 / 404 |

- [ ] `app/Http/Controllers/Api/TaskController.php`: generate it with `php artisan make:controller Api/TaskController --api --model=Task`.
- [ ] Each action returns a `TaskResource` and a message: "Task added", "Task updated" or "Task deleted".
- [ ] Tasks are created with `$request->user()->tasks()->create(...)`, so the owner always comes from the logged-in user (see Phase 6).

### Frontend
- [ ] `DashboardPage`: a table on desktop and cards on mobile. Columns: title, description (truncated), status badge, created date, actions.
- [ ] A `TaskForm` component, reused by `TaskCreatePage` and `TaskEditPage`.
- [ ] The edit page fetches the task and pre-fills the form.
- [ ] Delete → `ConfirmModal` ("Delete '<title>'? This cannot be undone.") → API call → the list refreshes.
- [ ] A success message after every add, update and delete.
- [ ] An empty state: "No tasks yet – add your first task".

### Done when
- [ ] Add, list, edit and delete (with confirmation) all work against MySQL and survive a refresh.
- [ ] A clear message appears after every action.

---

## Phase 5 – Level 2: Status, Search, Filter & Validation

**Goal:** Status workflow, search by title, filter by status, and validation on both sides.

### Backend
- [ ] Status endpoint: `PATCH /api/tasks/{task}/status` with body `{status}`.
- [ ] Listing filters: `GET /api/tasks?search=<text>&status=<status>`, using the model scopes:
  ```php
  $tasks = Task::query()
      ->search($request->string('search'))     // where('title', 'like', "%{$term}%") – bound parameter
      ->status($request->input('status'))      // validated against the TaskStatus enum
      ->latest()->get();
  ```
- [ ] **Form Requests**, which hold the server-side validation. Laravel returns a 422 with field errors automatically.

| Request class | Rules |
|---|---|
| `StoreTaskRequest` | `title`: `required\|string\|max:150` · `description`: `nullable\|string\|max:2000` · `status`: `sometimes\|Rule::enum(TaskStatus::class)` |
| `UpdateTaskRequest` | same as Store |
| `UpdateTaskStatusRequest` | `status`: `required\|Rule::enum(TaskStatus::class)` |
| `TaskIndexRequest` | `search`: `nullable\|string\|max:100` · `status`: `nullable\|Rule::enum(TaskStatus::class)` |

- [ ] Friendly messages through `messages()`, e.g. `'title.required' => 'Please enter a task title.'`.
- [ ] Laravel's `TrimStrings` middleware (on by default) turns a whitespace-only title into an empty one, so `required` rejects it.

### Frontend
- [ ] A status dropdown on each task row. Changing it sends the PATCH immediately and shows a message.
- [ ] A status field on the edit form.
- [ ] A `TaskFilters` bar:
  - a search box, debounced by about 300 ms
  - a status dropdown (All / Pending / In Progress / Completed)
  - a "Clear" button
- [ ] Filters are kept in the URL (`useSearchParams`), so they survive refresh and can be bookmarked.
- [ ] Client-side validation:
  - `required` and `maxLength`
  - an inline error under the field
  - Submit is blocked while the form is invalid
- [ ] Server 422 `errors` are mapped to the matching fields. This covers cases where the client checks are bypassed.
- [ ] A "No tasks match your filters" empty state.

### Done when
- [ ] Status can be changed from the list and from the edit form.
- [ ] Search and filter work alone and combined.
- [ ] An empty or whitespace-only title is rejected by the UI **and** by the API when sent directly from Postman.

---

## Phase 6 – Level 3: Login, Authorization & Security

**Goal:** Only authenticated users can use the app, each user is limited to their own data, and every security item in the PDF is covered.

### 6.1 Authentication (Sanctum SPA – session cookie)

| Method | Endpoint | Purpose |
|---|---|---|
| `GET` | `/sanctum/csrf-cookie` | Sets the `XSRF-TOKEN` cookie. The React app calls this before login and register. |
| `POST` | `/api/register` | `RegisterRequest` validates the input, the user is created with role `user`, then logged in |
| `POST` | `/api/login` | `Auth::attempt()`, then `$request->session()->regenerate()` |
| `POST` | `/api/logout` | `Auth::guard('web')->logout()`, then invalidate the session and regenerate the token |
| `GET` | `/api/user` | Current user (`UserResource`) or 401 |

- [ ] `app/Http/Controllers/Api/AuthController.php` with `register`, `login`, `logout` and `me`.
- [ ] `RegisterRequest`:
  - `name`: `required|max:100`
  - `email`: `required|email|unique:users`
  - `password`: `required|confirmed|Password::min(8)->letters()->numbers()`
- [ ] Login failure always returns the same message: "Invalid email or password" (422).
- [ ] **Rate limiting** on login and register: `throttle:5,1`, i.e. 5 attempts per minute → 429.
- [ ] All task routes are wrapped in `Route::middleware('auth:sanctum')` → 401 when the user isn't logged in.

**Password hashing and the PDF requirement:**
- The `hashed` cast and `Hash::make()` use Laravel's bcrypt hasher, which calls PHP's **`password_hash()`** internally.
- `Auth::attempt()` checks passwords through `Hash::check()`, which calls **`password_verify()`**.
- Be ready to explain this in the review.

### 6.2 Roles & authorization rules

| Action | `user` | `admin` |
|---|---|---|
| View own tasks | ✅ | ✅ |
| Create / edit / change status / delete own tasks | ✅ | ✅ |
| View all users' tasks (`?scope=all`) | ❌ 403 | ✅ read-only |
| View another user's single task | ❌ 404 | ✅ |
| Modify another user's task | ❌ 404 | ❌ 403 |

**Rule:** only a task's owner can change it. Admins have read-only oversight.

**Enforcement (backend only, never just the UI):**
- [ ] `app/Policies/TaskPolicy.php`. Laravel discovers it automatically.
  - `view`: owner or admin. Otherwise `Response::denyAsNotFound()`, so a user can't tell another user's task exists.
  - `update`, `delete`, `updateStatus`: owner only. A non-owner admin gets `deny()` (403); everyone else gets `denyAsNotFound()` (404).
- [ ] Every controller action calls `Gate::authorize('<ability>', $task)`.
- [ ] `index`: normal users always get `$request->user()->tasks()`. `scope=all` is honoured only when `$request->user()->isAdmin()`, otherwise 403. The admin listing eager-loads `user:id,name` to show the owner's name.
- [ ] `store`: `$request->user()->tasks()->create($request->validated())`. `user_id` is never taken from the request; it isn't fillable and isn't in the validated data.
- [ ] Registration can never set `role`: it isn't fillable and isn't validated.

### 6.3 CSRF protection
- [ ] Handled by Sanctum SPA mode plus `statefulApi()`:
  1. React calls `GET /sanctum/csrf-cookie`, and Laravel sets the `XSRF-TOKEN` cookie.
  2. axios sends that value in the `X-XSRF-TOKEN` header on every request.
  3. Laravel's CSRF middleware checks it on every `POST`, `PUT`, `PATCH` and `DELETE`, including login and register. A missing or wrong token gets **419**.
- [ ] Defence in depth: session cookies are `HttpOnly`, `SameSite=Lax`, and `Secure` in production.

### 6.4 SQL injection
- [ ] Every query goes through Eloquent or the query builder, which use **PDO prepared statements** with bound parameters.
- [ ] Rule: no `DB::raw()`, `whereRaw()` or `orderByRaw()` with user input. Any column used for sorting is checked against a whitelist.

### 6.5 XSS
- [ ] React escapes everything rendered through JSX. **`dangerouslySetInnerHTML` is never used.**
- [ ] The API returns `application/json` only. No Blade views render user content.
- [ ] Test: a title of `<script>alert(1)</script>` is shown as plain text.

### 6.6 Frontend auth
- [ ] `AuthContext`:
  - calls `GET /api/user` on load
  - holds `user` and `loading`
  - provides `login()`, `register()` and `logout()`, each of which calls `/sanctum/csrf-cookie` first
- [ ] A `ProtectedRoute` that redirects to `/login` when there is no user.
- [ ] `LoginPage` and `RegisterPage` with field errors and a password confirmation field.
- [ ] The navbar shows the user's name, a role badge and Logout.
- [ ] Admin only: an "All users' tasks" toggle that shows the owner column, with edit/delete hidden on tasks the admin doesn't own.

### Done when
- [ ] While logged out, `/` redirects to login and `/api/tasks` returns 401.
- [ ] Passwords are bcrypt hashes (`$2y$...`).
- [ ] As Alice, sending `GET`, `PUT`, `PATCH` or `DELETE` to Bob's task from Postman → 404.
- [ ] As admin, `PUT` on Bob's task → 403. `GET ?scope=all` → 200.
- [ ] A request with no CSRF token → 419.
- [ ] A 6th failed login within a minute → 429.

---

## Phase 7 – Bonus Features (Optional)

| Feature | Backend | Frontend |
|---|---|---|
| **Dashboard summary** | `GET /api/tasks/summary` → `selectRaw('status, COUNT(*) as total')->groupBy('status')` (no user input inside the raw SQL), scoped to the user | 4 Bootstrap cards above the list. They refresh after every change. |
| **Pagination** | `->paginate($request->integer('per_page', 10))->withQueryString()`. Laravel adds `meta` and `links` automatically. | A `Pagination` component that keeps the search and filter |
| **Priority** | `priority` field + `Rule::enum(TaskPriority::class)` | A select in the form, a badge in the list |
| **Due date** | `due_date`: `nullable\|date\|after_or_equal:today` on create | A date input. Overdue tasks are highlighted. |

> Register `GET /api/tasks/summary` **before** `apiResource('tasks')`, so `summary` isn't treated as a task ID.

### Done when
- [ ] Summary counts match the list.
- [ ] Pagination works together with search and filter.
- [ ] Priority and due date save, edit and display correctly.

---

## Phase 8 – Testing

**Goal:** Prove every item on the PDF's testing checklist with automated tests, Postman requests and manual checks.

### 8.1 Automated tests (PHPUnit, built into Laravel)
- Configure `phpunit.xml` to use the **MySQL** test database: `DB_CONNECTION=mysql`, `DB_DATABASE=task_tracker_test`.
- Feature tests use the `RefreshDatabase` trait, which runs the migrations, so no SQL file is needed.
- Run them with `php artisan test`.

| Test file | Covers |
|---|---|
| `tests/Feature/AuthTest.php` | Register, login, logout, wrong password, duplicate email, password stored hashed, throttling |
| `tests/Feature/TaskCrudTest.php` | Create, list, show, update, delete |
| `tests/Feature/TaskValidationTest.php` | Empty or whitespace title, title too long, invalid status |
| `tests/Feature/TaskFilterTest.php` | Search, status filter, combined, search never returns other users' tasks |
| `tests/Feature/TaskAuthorizationTest.php` | Guest → 401; user vs another user's task → 404; admin read-all → 200; admin modify others → 403; `scope=all` as user → 403 |

### 8.2 Test cases (manual + Postman + PHPUnit)

| ID | Test (PDF §8) | Method | Expected |
|---|---|---|---|
| TC-01 | Add a task with valid data | UI + PHPUnit | 201, task listed, "Task added" |
| TC-02 | Reject an empty title | UI + Postman + PHPUnit | UI blocks; API 422 "Please enter a task title." |
| TC-03 | Edit a task | UI + PHPUnit | Saved, "Task updated" |
| TC-04 | Update status | UI + PHPUnit | Badge updates, persists after refresh |
| TC-05 | Delete with confirmation | UI | Cancel keeps it; confirm removes it |
| TC-06 | Search by title | UI + PHPUnit | Only matching titles |
| TC-07 | Filter by status | UI + PHPUnit | Only that status |
| TC-08 | Search + filter combined | UI + PHPUnit | Both applied |
| TC-09 | Logged-out access to dashboard / API | Browser + Postman + PHPUnit | Redirect / 401 |
| TC-10 | Passwords hashed | MySQL Workbench + PHPUnit | `$2y$...`, `Hash::check` passes |
| TC-11 | User reads another user's task | Postman + PHPUnit | 404 |
| TC-12 | User edits / deletes another user's task | Postman + PHPUnit | 404, task unchanged |
| TC-13 | User requests `?scope=all` | Postman + PHPUnit | 403 |
| TC-14 | Admin edits another user's task | Postman + PHPUnit | 403 |
| TC-15 | Missing CSRF token | Postman | 419 |
| TC-16 | SQL injection in search (`' OR 1=1 --`) | UI + PHPUnit | Treated as text, no extra rows |
| TC-17 | XSS payload in title | UI | Shown as plain text |
| TC-18 | Invalid status via API | Postman + PHPUnit | 422 |
| TC-19 | DB down with `APP_DEBUG=false` | Manual | Generic error, no credentials or trace |
| TC-20 | Register with an existing email | UI + PHPUnit | "The email has already been taken." |
| TC-21 | Brute-force login | Postman | 429 after 5 attempts |
| TC-22 | Responsive layout | DevTools (360 / 768 / 1280 px) | Usable, no horizontal scroll |

### Tasks
- [ ] Write the feature tests and get `php artisan test` all green.
- [ ] Build a Postman collection (`docs/postman/TaskTracker.postman_collection.json`) with a pre-request script that fetches `/sanctum/csrf-cookie` and sets the `X-XSRF-TOKEN` header.
- [ ] Record the results in `docs/TEST_CASES.md`, plus a bug log: symptom, cause, fix, commit.

### Done when
- [ ] `php artisan test` passes. Paste the output into `TEST_CASES.md`.
- [ ] All 22 test cases are recorded as Pass.

---

## Phase 9 – Documentation & Submission

### Deliverables checklist

| # | Deliverable (PDF §6) | Where |
|---|---|---|
| 1 | Complete source code | `backend/`, `frontend/` |
| 2 | Database recreation | Migrations + seeders: `php artisan migrate --seed` (see note below) |
| 3 | README: setup, PHP/MySQL config, test logins, roles & permissions | `README.md` |
| 4 | Screenshots | `docs/screenshots/` |
| 5 | Levels completed + known limitations | `README.md` |
| 6 | Test cases + results + bugs fixed | `docs/TEST_CASES.md`, PHPUnit output, Postman collection |
| 7 | Backup & restore note | `README.md` |
| 8 | AI tool used + one change made after review | `README.md` |

> **Note on the SQL export:** PDF §6 asks for "an SQL export file (for example, `database.sql`)". This project defines the database in **migrations and seeders** instead, which are versioned, readable and run with a single command. The README must state this clearly and give the exact commands. If the reviewers insist on a file, it can be **generated** at the end with `mysqldump` (Section "Backup & Restore") rather than written by hand.

### README sections
1. Overview & features
2. Tech stack (link to `docs/TECH_STACK.md`)
3. Prerequisites
4. Setup:
   - **Backend:** `composer install` → `cp .env.example .env` → `php artisan key:generate` → set the DB values → `php artisan migrate --seed` → `php artisan serve`
   - **Frontend:** `npm install` → `npm run dev`
5. Test login credentials (seed accounts only)
6. Roles & permissions
7. API reference
8. Running tests (`php artisan test`)
9. Levels completed & known limitations
10. Backup & restore
11. AI assistance disclosure

### Screenshots to capture
- [ ] Login and register pages, including a validation error
- [ ] Dashboard: summary cards, list, status badges
- [ ] Add and edit forms, including a validation error
- [ ] Delete confirmation modal
- [ ] Search and filter in use
- [ ] Admin "all tasks" view
- [ ] Mobile view
- [ ] Postman: 401 / 404 / 403 / 419 responses
- [ ] `php artisan test` passing

### Submission checks
- [ ] `.env` is **not** included; only `.env.example`, with placeholders.
- [ ] `vendor/`, `node_modules/` and `frontend/dist/` are excluded.
- [ ] No real passwords, keys or credentials anywhere.
- [ ] `APP_DEBUG=false` is documented for the demo.
- [ ] A fresh clone → follow the README → the app runs. Test this in a clean folder.
- [ ] Final commit, then push the repo or create the ZIP.

---

## Appendix A – Folder Structure (key files)

```
task-tracker/
├── backend/                          # Laravel API
│   ├── app/
│   │   ├── Enums/
│   │   │   ├── UserRole.php
│   │   │   ├── TaskStatus.php
│   │   │   └── TaskPriority.php
│   │   ├── Http/
│   │   │   ├── Controllers/Api/
│   │   │   │   ├── AuthController.php
│   │   │   │   └── TaskController.php
│   │   │   ├── Requests/
│   │   │   │   ├── RegisterRequest.php
│   │   │   │   ├── LoginRequest.php
│   │   │   │   ├── TaskIndexRequest.php
│   │   │   │   ├── StoreTaskRequest.php
│   │   │   │   ├── UpdateTaskRequest.php
│   │   │   │   └── UpdateTaskStatusRequest.php
│   │   │   └── Resources/
│   │   │       ├── TaskResource.php
│   │   │       └── UserResource.php
│   │   ├── Models/
│   │   │   ├── User.php
│   │   │   └── Task.php
│   │   └── Policies/
│   │       └── TaskPolicy.php
│   ├── bootstrap/app.php             # statefulApi(), JSON exceptions
│   ├── config/{sanctum,cors}.php
│   ├── database/
│   │   ├── migrations/               # schema (replaces .sql files)
│   │   ├── factories/TaskFactory.php
│   │   └── seeders/{DatabaseSeeder,UserSeeder,TaskSeeder}.php
│   ├── routes/api.php
│   ├── tests/Feature/                # PHPUnit feature tests
│   ├── phpunit.xml                   # MySQL test database
│   └── .env.example
├── frontend/                         # React (Vite)
│   ├── vite.config.js                # /api + /sanctum proxy → Laravel
│   └── src/
│       ├── main.jsx
│       ├── App.jsx
│       ├── api/{client,auth,tasks}.js
│       ├── context/AuthContext.jsx
│       ├── components/
│       │   ├── Layout.jsx
│       │   ├── Navbar.jsx
│       │   ├── ProtectedRoute.jsx
│       │   ├── TaskList.jsx
│       │   ├── TaskForm.jsx
│       │   ├── TaskFilters.jsx
│       │   ├── StatusBadge.jsx
│       │   ├── SummaryCards.jsx
│       │   ├── Pagination.jsx
│       │   ├── ConfirmModal.jsx
│       │   ├── AlertMessage.jsx
│       │   └── FieldError.jsx
│       └── pages/
│           ├── LoginPage.jsx
│           ├── RegisterPage.jsx
│           ├── DashboardPage.jsx
│           ├── TaskCreatePage.jsx
│           ├── TaskEditPage.jsx
│           └── NotFoundPage.jsx
├── docs/
│   ├── TECH_STACK.md
│   ├── BUILD_PLAN.md
│   ├── TEST_CASES.md
│   ├── postman/
│   └── screenshots/
├── .gitignore
└── README.md
```

## Appendix B – API Reference

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| GET | `/sanctum/csrf-cookie` | – | Set the CSRF cookie |
| GET | `/api/health` | – | Health check |
| POST | `/api/register` | – (throttled) | Create account and log in |
| POST | `/api/login` | – (throttled) | Log in |
| POST | `/api/logout` | ✅ | Log out |
| GET | `/api/user` | ✅ | Current user |
| GET | `/api/tasks` | ✅ | List (`search`, `status`, `page`, `per_page`, `scope=all` for admin) |
| GET | `/api/tasks/summary` | ✅ | Counts by status |
| GET | `/api/tasks/{task}` | ✅ owner / admin | Single task |
| POST | `/api/tasks` | ✅ | Create |
| PUT | `/api/tasks/{task}` | ✅ owner | Update |
| PATCH | `/api/tasks/{task}/status` | ✅ owner | Change status |
| DELETE | `/api/tasks/{task}` | ✅ owner | Delete |

All `POST`, `PUT`, `PATCH` and `DELETE` requests require the `X-XSRF-TOKEN` header. axios adds it automatically.

## Appendix C – Mapping to Evaluation Criteria

| Criterion (PDF §7) | Weight | Phases |
|---|---|---|
| Core functionality | 35% | 4, 5 |
| PHP and MySQL | 25% | 1, 2, 4, 5 |
| Validation, security, authorization | 20% | 5, 6 |
| Frontend and usability | 10% | 3, 4, 5, 7 |
| Code quality and documentation | 10% | 8, 9 |
