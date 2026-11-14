# Test Cases – Task Tracker

**How to use this file:** run each test once the environment is set up, then change **Result** to `Pass` or `Fail` and add notes. Log any bug you find in Section 3.

Status key: ⏳ Not run yet · ✅ Pass · ❌ Fail

---

## 1. Automated tests (PHPUnit)

Run from `backend/`:

```bash
php artisan test
```

| File | Tests | What it covers | Result |
|---|---|---|---|
| `tests/Feature/AuthTest.php` | 10 | Register; password stored as bcrypt; role can't be set at registration; duplicate email; registration validation; login success; generic login error; rate limit (429); `/api/user` requires login; logout | ⏳ |
| `tests/Feature/TaskCrudTest.php` | 10 | Create; `user_id` in the request is ignored; list newest first; show; edit; change status; delete; 404 for a missing task; summary counts; pagination | ⏳ |
| `tests/Feature/TaskValidationTest.php` | 7 | Empty title; whitespace-only title; title over 150 characters; invalid status (create and PATCH); update requires a title; past due date; invalid status filter | ⏳ |
| `tests/Feature/TaskFilterTest.php` | 6 | Case-insensitive search; status filter; combined; no other users' tasks in search results; `%` treated as text; SQL injection treated as text | ⏳ |
| `tests/Feature/TaskAuthorizationTest.php` | 10 | Guest gets 401 on every task endpoint; list shows own tasks only; another user's task: view, update, status change and delete all 404; `scope=all` forbidden for users; admin sees all tasks with owner names; admin can view but not modify others' tasks; admin default list shows own tasks only | ⏳ |
| **Total** | **43** | | ⏳ |

> Paste the final `php artisan test` output here once the tests have run.

```
(paste output)
```

---

## 2. Manual and Postman test cases

The Postman collection is `docs/postman/TaskTracker.postman_collection.json`. To use it:
- import the collection
- run **Auth → Login as Alice** first
- every request automatically fetches a CSRF token

| ID | Test (PDF §8 checklist) | Steps | Expected | Result | Notes |
|---|---|---|---|---|---|
| TC-01 | Add a task with valid data | Dashboard → Add task → fill in the title → Add task | Redirect to the dashboard, "Task added successfully." message, task at the top of the list | ⏳ | |
| TC-02 | Reject an empty title | Add task with an empty or spaces-only title. Then in Postman send `POST /api/tasks` with `{"title":""}` | UI shows "Please enter a task title." and nothing is sent. API returns 422 with the same message. | ⏳ | |
| TC-03 | Edit a task | Edit → change the title and description → Save | "Task updated successfully.", changes visible | ⏳ | |
| TC-04 | Update status | Change the status dropdown on a row | Badge changes, message shown, value persists after refresh | ⏳ | |
| TC-05 | Delete with confirmation | Delete → Cancel; then Delete → Delete | Cancel keeps the task; confirm removes it with "Task deleted successfully." | ⏳ | |
| TC-06 | Search by title | Log in as Alice, type `report` | Only titles containing "report" | ⏳ | |
| TC-07 | Filter by status | Choose "Completed" | Only Completed tasks; summary cards unchanged | ⏳ | |
| TC-08 | Search + filter | `report` + "In Progress" | Only tasks matching both | ⏳ | |
| TC-09 | Logged-out access | Log out, open `http://localhost:5173/`; Postman `GET /api/tasks` without logging in | Redirect to `/login`; API returns 401 | ⏳ | |
| TC-10 | Passwords hashed | MySQL: `SELECT email, password FROM users;` | Every password starts with `$2y$` | ⏳ | |
| TC-11 | View another user's task | As Alice, `GET /api/tasks/{id of a Bob task}` | 404 `Resource not found.` | ⏳ | |
| TC-12 | Modify another user's task | As Alice, `PUT`, `PATCH .../status` and `DELETE` on Bob's task | 404 each time; Bob's task unchanged | ⏳ | |
| TC-13 | User asks for all tasks | As Alice, `GET /api/tasks?scope=all` | 403 | ⏳ | |
| TC-14 | Admin modifies another user's task | As admin, `PUT /api/tasks/{Bob task}` | 403; the UI shows "View only" for that task | ⏳ | |
| TC-15 | Missing CSRF token | Postman `POST /api/tasks` with the `X-XSRF-TOKEN` header removed | 419 `CSRF token mismatch.` | ⏳ | |
| TC-16 | SQL injection in search | Search for `' OR 1=1 --` | No results, no error | ⏳ | |
| TC-17 | XSS in title | Create a task titled `<script>alert(1)</script>` | Shown as plain text; no alert | ⏳ | |
| TC-18 | Invalid status via API | `PATCH /api/tasks/{id}/status` with `{"status":"Done"}` | 422 "Please choose a valid status…" | ⏳ | |
| TC-19 | No raw errors | Set `APP_DEBUG=false`, stop MySQL, reload the dashboard | Generic "Something went wrong on the server" message; no stack trace or credentials anywhere | ⏳ | |
| TC-20 | Duplicate registration | Register with `alice@example.com` | "An account with this email already exists." | ⏳ | |
| TC-21 | Brute-force login | Send 6 wrong logins within a minute | The 6th returns 429; UI shows "Too many attempts…" | ⏳ | |
| TC-22 | Responsive layout | DevTools device toolbar: 360 px, 768 px, 1280 px | Cards on a phone, table on desktop, no horizontal scroll, menu collapses | ⏳ | |
| TC-23 | Pagination | As Alice, set `per_page=3` in Postman, or create more than 10 tasks in the UI | Page controls appear; filters are kept when changing page | ⏳ | |
| TC-24 | Admin overview | Log in as admin → "All users" | Every task shown with an owner column; only the admin's own tasks are editable | ⏳ | |

---

## 3. Bugs found and fixed

| # | Symptom | Cause | Fix | Where |
|---|---|---|---|---|
| 1 | Typing a space in the search box and pausing removed the space | The search text was trimmed before it was saved to the URL, and the URL value was synced back into the input | Send the text as typed; the API trims it | `frontend/src/components/TaskFilters.jsx` |
| | | | | |
