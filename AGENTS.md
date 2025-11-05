# Repository Guidelines

## Project Structure & Module Organization
- `server.js` boots the Express app, registers middleware, and wires upload/convert/download routes.
- `routes/` contains HTTP route handlers; each file maps directly to an `app.use` mount.
- `middlewares/` holds reusable Express middleware (logging, auth, validation) shared across routes.
- `config/` wraps infrastructure concerns such as the SQLite handle (`db.js`) and R2/S3 config.
- `utils/` provides shared services (scheduler, conversion pool, constants) while `public/` serves static assets and client templates.
- Runtime files live in `uploads/` and `db/database.db*`; keep them out of version control.

## Build, Test, and Development Commands
- `npm install` installs Node 18+ dependencies declared in `package.json`.
- `npm run dev` (alias `npm start`) launches the Express server on the configured `PORT`.
- `NODE_ENV=test npm run dev` is the current workaround for smoke-testing until a dedicated test runner is added.

## Coding Style & Naming Conventions
- Use 2-space indentation, single quotes, and trailing commas only where JavaScript requires them.
- Prefer `camelCase` for functions/variables, `PascalCase` for classes, and `SCREAMING_SNAKE_CASE` for constants exported from `utils/constants.js`.
- Keep modules focused: one primary export per file and avoid mixing routers, middleware, and helpers.
- Run `node server.js` to verify lint-equivalent feedback; no automated formatter is configured, so ensure diffs stay clean and idiomatic.

## Testing Guidelines
- No automated suite exists yet; add tests under `routes/__tests__/` using Jest when introducing new behavior.
- For now, cover critical flows by issuing HTTP calls against `/api/upload`, `/api/convert`, and `/api/download` with `curl` or Postman.
- Document manual test cases in PR descriptions and capture any regression scripts so they can become Jest specs later.

## Commit & Pull Request Guidelines
- Initialize Git locally and follow Conventional Commits (`feat:`, `fix:`, `chore:`) to keep history searchable.
- Keep commits scoped to one concern: route logic, middleware, or config tweaks should land separately.
- Pull requests must outline the change, link any tracking ticket, list manual tests (commands + outcomes), and include screenshots/GIFs for UI-facing updates.
- Flag migrations or config changes prominently and call out any required environment variable updates.

## Security & Configuration Tips
- Store secrets in `.env`; never commit it. Reference them through `utils/constants.js`.
- Review `config/r2.js` before enabling cloud storage; ensure credentials and buckets are set per environment.
- Clean up `uploads/` via the provided scheduler or manual scripts to avoid data retention issues.
