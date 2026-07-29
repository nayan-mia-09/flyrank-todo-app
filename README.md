# Task API — Containerized Postgres

A CRUD API for managing a to-do list, built with Node.js and Express, now backed by a containerized PostgreSQL database and orchestrated with Docker Compose.
Built as part of the FlyRank AI Backend Engineering track (Week 1, BE-A3 — third storage swap in the same repo: memory → SQLite → containerized Postgres).

## How to run

```bash
cp .env.example .env
docker compose up
```

Server runs on `http://localhost:3000`. Swagger docs at `http://localhost:3000/docs`.

That's it — one command brings up the API **and** the database together. No local Postgres install, no manual table setup. On first run, the `tasks` table is created automatically and seeded with 3 example tasks. Stop everything with `docker compose down`; your data survives because it lives in a named Docker volume, not inside the container.

## Why Postgres (and why Docker)

The previous version (BE-A2) used SQLite — a single file on disk, zero configuration, but ultimately a single-machine, single-file model. This week's upgrade moves storage to PostgreSQL, a real database server — the same kind of engine behind most production backends, FlyRank included.

Running Postgres via Docker means never installing or fighting version conflicts locally — the official `postgres` image behaves identically on any machine. Docker Compose then wraps *both* the API and the database into one file, so the whole stack starts and stops as a unit.

The API's endpoints and behavior are unchanged from Week 2 and BE-A2 — only the storage layer underneath moved, for the third time, from a JavaScript array → a SQLite file → Postgres rows in a container. Same routes, same responses, same validation. That consistency is the point: storage is just an implementation detail.

## Stack

| Layer | Technology |
|---|---|
| API | Node.js + Express |
| Database | PostgreSQL 16 (`postgres:16-alpine`) |
| Driver | `pg` (node-postgres), parameterized queries (`$1`, `$2`, …) |
| Orchestration | Docker + Docker Compose |
| Secrets | `.env` (git-ignored), `.env.example` committed |
| Persistence | Named Docker volume (`taskdata`) |

## Endpoints

| Method | Path         | Description             |
|--------|--------------|--------------------------|
| GET    | /            | API info                |
| GET    | /health      | Health check             |
| GET    | /tasks       | List all tasks           |
| GET    | /tasks/:id   | Get a single task        |
| POST   | /tasks       | Create a new task        |
| PUT    | /tasks/:id   | Update a task             |
| DELETE | /tasks/:id   | Delete a task             |

## Example request

```bash
curl -i -X POST http://localhost:3000/tasks -H "Content-Type: application/json" -d "{\"title\":\"Buy milk\"}"
```

```
HTTP/1.1 201 Created
Content-Type: application/json; charset=utf-8

{"id":4,"title":"Buy milk","done":false}
```

## Environment variables

Copy `.env.example` to `.env` before running. Required keys:

```
DATABASE_URL=postgres://postgres:dev@db:5432/tasks
```

`.env` is git-ignored — it never gets committed. `.env.example` holds the same keys with placeholder values so anyone cloning the repo knows what to set.

## Swagger UI

![Swagger UI screenshot](./public/swagger-screenshot.png)

## Database

Data lives in a Postgres container (`db` service), backed by the named volume `taskdata` — so it survives `docker compose down` / `docker compose up` cycles. On a fresh clone with no volume yet, the table is created and seeded automatically on first run.

![DB screenshot](./public/db_browser_img_1.png)

Example query, run inside the container: `docker exec -it taskdb psql -U postgres -d tasks -c "SELECT * FROM tasks WHERE done = true;"` — returned only the tasks marked complete, confirming reads/writes go straight to Postgres with no syncing layer involved.

## Mistakes made & how they were fixed

Four real issues came up while building this — kept here because working through them is most of what this assignment actually teaches.

**1. JSON syntax error in requests**
`SyntaxError: Expected double-quoted property name in JSON at position 30` — caused by single quotes or trailing commas in request bodies, or by sending a body on a `DELETE` request. Fixed by using strict double-quoted JSON and dropping the body entirely from `DELETE` calls (the id travels in the URL, not the payload).

**2. Table name mismatch**
`{ "error": "relation \"task\" does not exist" }` — SQL queries referenced the singular `task` while the table was created as `tasks`. Fixed by standardizing every CRUD query to the plural `tasks`.

**3. Missing Dockerfile during build**
`failed to solve: failed to read dockerfile: open Dockerfile: no such file or directory` — the file was either missing from the project root or saved with an unwanted extension (`Dockerfile.txt`). Fixed by creating a proper, extensionless `Dockerfile` at the root (`FROM node:22-alpine`, `WORKDIR`, `RUN npm install`, `CMD ["node", "server.js"]`).

**4. Volume compatibility & port conflict**
Postgres logged a directory-compatibility warning on the mounted volume, and `docker compose up` separately failed with `listen tcp 0.0.0.0:3000: bind: Only one usage of each socket address is normally permitted`. Fixed by pinning the image to `postgres:16-alpine` for clean volume handling, clearing stale volumes with `docker compose down -v`, and killing the local Node process that was already holding port 3000 before bringing the stack up again.

## Key takeaways

- **Secrets stay out of code.** All configuration lives in `.env`; services talk to each other over Docker's internal network by service name (`db`), never `localhost` or a hardcoded address.
- **Persistence is real.** `docker compose down` followed by `docker compose up` keeps every task record — the named volume, not the container, owns the data.
- **One command, any machine.** Clone the repo, `cp .env.example .env`, `docker compose up` — a working stack in under 2 minutes, no manual Postgres setup required.

## Notes

All CRUD operations use parameterized queries (`$1`, `$2`, …) via `pg`, keeping user input safe from SQL injection. This is the third storage engine this API has run on (memory → SQLite → Postgres) with identical routes and responses throughout — proof that swapping the storage layer never had to touch the API surface.