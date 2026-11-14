# Task Tracker

A task management web app built for the **RTIH Intern – IT Technical Assignment**. You can register, log in, and create, view, edit, delete, search and filter your own tasks. Each user's tasks are private to them.

| Layer | Technology |
|---|---|
| Frontend | React 19 + Vite, React Router, axios, Bootstrap 5 |
| Backend | Laravel 12 REST API (PHP 8.2+), Laravel Sanctum (session-cookie auth) |
| Database | MySQL 8, schema and sample data defined with Laravel migrations + seeders |
| Tests | PHPUnit feature tests (`php artisan test`), Postman collection |

> **New to PHP or MySQL?** Follow the step-by-step **[Setup Guide](docs/SETUP_GUIDE.md)**: it covers installing every tool and the exact commands to run.

More detail: [docs/TECH_STACK.md](docs/TECH_STACK.md) · [docs/BUILD_PLAN.md](docs/BUILD_PLAN.md) · [docs/TEST_CASES.md](docs/TEST_CASES.md)

---

## 1. Features

**Level 1 – Task management**
- Add a task with a title and description.
- See all your tasks in a table (desktop) or as cards (phone).
- Edit a task.
- Delete a task after confirming in a dialog.
- A message confirms every add, update and delete.

**Level 2 – Status, search, validation**
- Each task has a status: Pending, In Progress or Completed. You can change it from the list or from the edit form.
- Search by title, filter by status, or both together. The filters are kept in the URL, so they survive a page refresh.
- Fields are validated in the browser **and** on the server, with friendly messages next to each field.

**Level 3 – Login, authorization, security**
- Register and log in. Passwords are stored as bcrypt hashes.
- The dashboard and the API are only available to logged-in users.
- Two roles, `user` and `admin`, with ownership rules enforced by the backend. See [Section 5](#5-roles-and-permissions).
- Every request that changes data is protected with a CSRF token. Login and register are limited to 5 attempts per minute.

**Bonus**
- Summary cards: total, pending, in-progress and completed counts.
- Pagination: 10 tasks per page.
- Priority (Low / Medium / High) and due date, with overdue tasks highlighted.

---

## 2. Prerequisites

| Tool | Version |
|---|---|
| PHP | 8.2 or newer, with the `pdo_mysql`, `mbstring`, `openssl`, `tokenizer`, `xml`, `ctype`, `fileinfo` and `curl` extensions enabled |
| Composer | 2.x |
| MySQL Community Server | 8.0 or 8.4 |
| Node.js | 20 or newer (22 LTS recommended), includes npm |

> Use MySQL Server, not the MariaDB bundled with XAMPP.

---

## 3. Setup

### 3.1 Create the databases (one time)

Open the MySQL shell (`mysql -u root -p`) and run the commands below. Replace `choose_a_password` with a password of your own.

```sql
CREATE DATABASE task_tracker      CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE DATABASE task_tracker_test CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE USER 'task_app'@'localhost' IDENTIFIED BY 'choose_a_password';
GRANT ALL PRIVILEGES ON task_tracker.*      TO 'task_app'@'localhost';
GRANT ALL PRIVILEGES ON task_tracker_test.* TO 'task_app'@'localhost';
FLUSH PRIVILEGES;
```

`task_tracker_test` is used only by the automated tests. The tests wipe it on every run.

### 3.2 Backend (Laravel API)

```bash
cd backend
composer install
cp .env.example .env          # Windows PowerShell: Copy-Item .env.example .env
php artisan key:generate
```

Edit `backend/.env` and set `DB_USERNAME` and `DB_PASSWORD` to the MySQL user from step 3.1. Then build the tables, load the sample data and start the API:

```bash
php artisan migrate --seed    # creates all tables and loads the demo users and tasks
php artisan serve             # API at http://127.0.0.1:8000
```

To reset the database to the demo data at any time, run `php artisan migrate:fresh --seed`.

### 3.3 Frontend (React)

In a second terminal:

```bash
cd frontend
npm install
npm run dev                   # app at http://localhost:5173
```

Open **http://localhost:5173**. The Vite dev server forwards `/api` and `/sanctum` requests to Laravel on port 8000. To the browser, the app and the API share one origin, so cookies work without any CORS setup.

### 3.4 Production build (optional)

1. Run `npm run build` in `frontend/`. It writes the static app to `frontend/dist/`.
2. Serve `frontend/dist/` and `backend/public/` from the **same domain**, e.g. with Apache or Nginx, routing `/api` and `/sanctum` to Laravel.
3. In `backend/.env`, set:
   - `APP_ENV=production` and `APP_DEBUG=false`
   - `SESSION_SECURE_COOKIE=true` (HTTPS)
   - `SANCTUM_STATEFUL_DOMAINS=<your domain>`

---

## 4. Test login details

These are sample accounts created by the seeder. They are not real credentials.

| Role | Email | Password |
|---|---|---|
| Admin | `admin@example.com` | `Admin@123` |
| User | `alice@example.com` | `User@1234` |
| User | `bob@example.com` | `User@1234` |

Alice and Bob each have a task called **"Prepare monthly report"**. Searching for it as either user shows that the search never returns someone else's task.

---

## 5. Roles and permissions

| Action | `user` | `admin` |
|---|---|---|
| View, create, edit, change status of and delete **own** tasks | ✅ | ✅ |
| View **all** users' tasks ("All users" toggle, `?scope=all`) | ❌ 403 | ✅ read-only |
| Open another user's task by ID | ❌ 404 | ✅ view only |
| Edit, change status of or delete another user's task | ❌ 404 | ❌ 403 |

**The rule:** only a task's owner can change it. Admins can oversee every task but can't change other people's work. That keeps each task the responsibility of one person.

**How it's enforced (backend):**
- **Ownership policy:** `app/Policies/TaskPolicy.php` is checked with `Gate::authorize()` in every controller action.
- **Owner comes from the session:** a new task's owner is always the logged-in user (`$request->user()->tasks()->create(...)`). `user_id` and `role` are not mass-assignable, so sending them in a request has no effect.
- **No leaks about other users' tasks:** a normal user who asks for another user's task gets the same `404 Resource not found.` as for a task that doesn't exist.
- **Not just hidden buttons:** the UI hides buttons the user can't use, but every rule is checked again on the server. The PHPUnit tests and the Postman collection send forged requests to prove it.
- **Fixed role on registration:** self-registered accounts are always `user`. Admin accounts come only from the seeder (or a database change).

---

## 6. Security summary

| Requirement (PDF Level 3) | Implementation |
|---|---|
| `password_hash()` / `password_verify()` | The User model's `hashed` cast and `Hash::make()` use Laravel's bcrypt hasher, which calls PHP's `password_hash()`. `Auth::attempt()` checks passwords with `password_verify()`. Stored values start with `$2y$`. |
| Only logged-in users | `auth:sanctum` middleware on all task routes → 401. React's `ProtectedRoute` redirects guests to `/login`. |
| Users can't access others' tasks | `TaskPolicy` + scoped queries (see Section 5) |
| Prepared statements | Every query goes through Eloquent or the query builder, which use PDO parameter binding. There is no raw SQL containing user input. The search term is bound as a parameter, and `%` and `_` in it are escaped. |
| Output escaping (XSS) | React escapes everything rendered in JSX. `dangerouslySetInnerHTML` is never used. The API returns JSON only. |
| CSRF | Sanctum SPA mode: Laravel sets an `XSRF-TOKEN` cookie, and axios sends it back as the `X-XSRF-TOKEN` header. Laravel checks it on every POST, PUT, PATCH and DELETE, **including login and register**, and returns 419 if it's missing or wrong. |
| No raw errors or credentials shown | With `APP_DEBUG=false`, Laravel returns generic messages. Details go to `storage/logs/laravel.log`. Credentials live only in the git-ignored `.env`. |
| Extra | Session ID regenerated on login. Session invalidated on logout. Session cookies are `HttpOnly` and `SameSite=Lax`. Login and register limited to 5 per minute. Login errors say "Invalid email or password" whether the email or the password was wrong. |

---

## 7. API reference

All task endpoints require login. Every POST, PUT, PATCH and DELETE request must include the `X-XSRF-TOKEN` header (axios adds it automatically).

| Method | Endpoint | Description |
|---|---|---|
| GET | `/sanctum/csrf-cookie` | Sets the CSRF cookie |
| GET | `/api/health` | Health check |
| POST | `/api/register` | `{name, email, password, password_confirmation}` |
| POST | `/api/login` | `{email, password}` |
| POST | `/api/logout` | End the session |
| GET | `/api/user` | Current user |
| GET | `/api/tasks` | List tasks. Query: `search`, `status`, `page`, `per_page` (max 50), `scope=all` (admin only) |
| GET | `/api/tasks/summary` | Counts by status (`scope=all` for admin) |
| GET | `/api/tasks/{id}` | One task |
| POST | `/api/tasks` | `{title, description?, status?, priority?, due_date?}` |
| PUT | `/api/tasks/{id}` | Update a task |
| PATCH | `/api/tasks/{id}/status` | `{status}` |
| DELETE | `/api/tasks/{id}` | Delete a task |

Status codes used: `200`, `201`, `401` not logged in, `403` forbidden, `404` not found, `419` CSRF failure, `422` validation error (field messages under `errors`), `429` too many attempts.

---

## 8. Database design

Defined in `backend/database/migrations/`:

| Table | Columns | Why |
|---|---|---|
| `users` | `id`, `name`, `email` (unique), `password` (bcrypt), `role` ENUM('user','admin') default `user`, timestamps | `role` drives authorization; the unique email is the login identifier |
| `tasks` | `id`, `user_id` → `users.id` (foreign key, cascade on delete), `title` VARCHAR(150), `description` TEXT null, `status` ENUM('Pending','In Progress','Completed') default `Pending`, `priority` ENUM('Low','Medium','High') default `Medium`, `due_date` DATE null, `created_at`, `updated_at` | The foreign key ties each task to exactly one owner. ENUM makes MySQL itself reject invalid values. |
| Indexes | `tasks(user_id, status)`, `tasks(title)` | Speed up the dashboard query ("my tasks with status X") and title search |
| Support tables | `sessions` (login sessions), `cache` + `cache_locks` (rate limiter), `password_reset_tokens` (Laravel default) | |

**Why migrations instead of a `.sql` file:**
- The schema is code. Git tracks every change.
- Migrations can be rolled back.
- The automated tests build a fresh copy of the database from them.
- `php artisan migrate --seed` creates exactly the same database on any machine.

If a single SQL file is required, generate one from the migrated database with `mysqldump` (Section 10) rather than writing it by hand.

---

## 9. Running the tests

```bash
cd backend
php artisan test
```

The **43 feature tests** run against the MySQL database `task_tracker_test`. They cover:
- authentication: register, login, logout, password hashing, throttling
- task CRUD, summary counts and pagination
- validation
- search and filter, including SQL-injection and wildcard attempts
- authorization: guests, cross-user access, admin read-only

The manual and Postman test cases with their results are in [docs/TEST_CASES.md](docs/TEST_CASES.md). The Postman collection is [docs/postman/TaskTracker.postman_collection.json](docs/postman/TaskTracker.postman_collection.json).

---

## 10. Backup and restore

| Purpose | Command |
|---|---|
| Back up the live data | `mysqldump -u task_app -p --single-transaction task_tracker > backup_YYYY-MM-DD.sql` |
| Restore into an existing database | `mysql -u task_app -p task_tracker < backup_YYYY-MM-DD.sql` |
| Rebuild the empty schema + demo data from code | `php artisan migrate:fresh --seed` |

`--single-transaction` takes a consistent snapshot without locking InnoDB tables, so the app keeps working during the backup.

For a real deployment:
- Schedule the dump daily (Windows Task Scheduler or cron).
- Keep several dated copies on a different machine or in cloud storage.
- Test a restore into a scratch database regularly.

---

## 11. Status

| Level | Status |
|---|---|
| Level 1 – Basic task management | Implemented |
| Level 2 – Status, search, validation | Implemented |
| Level 3 – Login, authorization, security | Implemented |
| Bonus – summary, pagination, priority, due date | Implemented |

**Known limitations**
- No password reset or email verification.
- Admin accounts can only be created by the seeder or directly in the database; there is no admin management screen.
- Search matches titles only (not descriptions), using `LIKE`. That's fine at this scale; a large dataset would need full-text search.
- The "due date cannot be in the past" rule uses the server's time zone (UTC by default), so it can be off by one day near midnight in other time zones.
- In development, the frontend and API must run on the same origin through the Vite proxy. A different-origin deployment needs the CORS and Sanctum domain settings described in Section 3.4.

---

## 12. Screenshots

Screenshots are not included yet. Capture and add them after completing a local end-to-end run.

---

## 13. AI assistance

- **Tool used:** Claude Code (Anthropic, Claude Opus 5.5) helped draft the project plan, the Laravel and React code, the tests and this documentation.
- **One change made after reviewing the generated code:** the initial session check now surfaces API failures instead of silently treating them as a signed-out session, and demo seeders preserve existing account and task data.
- **A bug found during review:** the search box first trimmed spaces before saving the search to the URL. Because the trimmed value was synced back into the input, typing a space and pausing deleted the space. The fix sends the text as typed and lets the API trim it (`frontend/src/components/TaskFilters.jsx`).
