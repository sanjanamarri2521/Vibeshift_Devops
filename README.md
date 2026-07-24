# VibeShift

VibeShift is an AI-powered mood journaling app. You write a short entry about your day, and an AI model analyzes the emotional tone of the text and dynamically repaints the UI — generating a matching gradient color palette, a stress level score, and a short mood summary. Every entry is logged to a PostgreSQL database.

## Features

- Free-text journal entry input
- AI-driven sentiment analysis (Groq — Llama 3.1 8B Instant)
- Dynamic UI theming — the AI freely chooses gradient colors matching the vibe of the text, no hardcoded color rules
- Stress level visualization
- Persistent logging to PostgreSQL
- Fully containerized with Docker & Docker Compose
- CI/CD pipeline via GitHub Actions, deploying automatically to a GCP VM on every merge to `main`

## Tech Stack

| Layer            | Technology                                         |
| ---------------- | -------------------------------------------------- |
| Framework        | Next.js 16 (App Router, TypeScript)                |
| Styling          | Tailwind CSS                                       |
| AI Model         | Groq API (Llama 3.1 8B Instant)                    |
| Database         | PostgreSQL (Cloud SQL in production)               |
| Containerization | Docker, Docker Compose                             |
| CI               | GitHub Actions (ESLint, Prettier, build checks)    |
| CD               | GitHub Actions + SSH deploy to GCP Compute Engine  |
| Hosting          | Google Cloud Platform (Compute Engine + Cloud SQL) |

## Architecture

**Request flow:**

```
User Input → Next.js API Route → Groq AI (sentiment analysis)
→ Generate mood data (colors, stress level, summary) → Save to PostgreSQL
→ Return JSON → Frontend updates UI theme dynamically
```

**Deployment flow:**

```
Developer pushes to dev → Pull Request to main
   → CI runs (lint, format check, build)
   → Merge to main
   → CD triggers: GitHub Actions SSHs into GCP VM
   → Pulls latest code → Rebuilds Docker image → Restarts container
```

**Environments:**

| Environment               | Database Connection                              |
| ------------------------- | ------------------------------------------------ |
| Local dev (`npm run dev`) | Local PostgreSQL on `localhost`                  |
| Local Docker Compose      | Containerized PostgreSQL (`postgres-db` service) |
| Production (GCP)          | Cloud SQL PostgreSQL (Public IP, SSL)            |

## Getting Started (Local Development)

```bash
git clone https://github.com/sanjanamarri2521/Vibeshift_Devops.git
cd Vibeshift_Devops
npm install
```

Create a `.env.local` file:

```
DATABASE_URL=postgresql://postgres:<password>@localhost:5432/vibeshift_db
GROQ_API_KEY=<your_groq_api_key>
```

Run the dev server:

```bash
npm run dev
```

Visit `http://localhost:3000`.

## Running with Docker Compose

Create a `.env.docker` file with your database and API credentials, then:

```bash
docker compose up -d --build
docker compose ps
```

Visit `http://localhost:3000`.

To stop:

```bash
docker compose down
```

## CI Pipeline

On every pull request to `dev` or `main`, and on every push to `dev`, GitHub Actions runs:

1. Checkout code
2. Set up Node.js 20
3. Install dependencies (`npm ci`)
4. Check formatting (`prettier --check .`)
5. Run linter (`eslint .`)
6. Run production build (`next build`)

Workflow file: `.github/workflows/ci.yml`

## CD Pipeline

On every push to `main`, GitHub Actions automatically deploys to the GCP VM:

1. SSH into the GCP Compute Engine instance
2. `git pull origin main`
3. `docker compose down`
4. `docker compose build`
5. `docker compose up -d`
6. `docker system prune -f`

Workflow file: `.github/workflows/cd.yml`

**Required GitHub repository secrets:**

| Secret        | Description                             |
| ------------- | --------------------------------------- |
| `GCP_HOST`    | External IP of the GCP VM               |
| `GCP_USER`    | SSH username on the VM                  |
| `GCP_SSH_KEY` | Private SSH key for GitHub Actions      |
| `GCP_APP_DIR` | Path to the project directory on the VM |

## Deployment Infrastructure (GCP)

- **Compute:** `e2-micro` VM (Compute Engine, free tier), Ubuntu, running Docker
- **Database:** Cloud SQL PostgreSQL, `db-f1-micro` (shared core, free-tier eligible), SSL-required connections
- **Networking:** Firewall rule allowing inbound TCP on port `3000`; Cloud SQL authorized network scoped to the VM's external IP

## Challenges & Fixes Along the Way

- **AI model deprecation / quota limits:** Switched from Gemini to Groq (Llama 3.1) for reliable free-tier access and to let the AI choose colors freely instead of hardcoding mood → color mappings.
- **Local vs. Docker DB confusion:** Split environment files — `.env.local` for host development, `.env.docker` for containerized environments — since Docker networking requires the database hostname to be the service name (`postgres-db`), not `localhost`.
- **Oversized Cloud SQL defaults:** GCP's instance creation flow defaulted to a production-tier 8vCPU/64GB instance; corrected by explicitly selecting Enterprise edition → Sandbox preset → Shared core → `db-f1-micro`.
- **Malformed connection string:** A database password containing special characters (`@`, `/`, `"`) broke URL parsing in the connection string, causing the app to connect to a garbled hostname. Fixed by resetting to an alphanumeric password.
- **SSL certificate verification failure:** Cloud SQL requires SSL; added `sslmode=no-verify` to the connection string to allow encrypted connections without validating Google's internal CA (acceptable for this dev/practice deployment).
- **SSH authentication for CD:** Created a dedicated `github-actions` deploy user on the VM with its own SSH key pair, added to the `docker` group, to avoid permission and key-mismatch issues.
- **Stale VM git state:** Used `git fetch` + `git reset --hard origin/main` in the CD script to guarantee the VM always matches `main` exactly, rather than relying on `git pull`.

## Key DevOps Concepts Practiced

- Git branching workflow (`dev` → PR → `main`)
- Environment variable management across local, Docker, and cloud contexts
- Docker image creation & multi-container orchestration
- Container networking
- Automated CI (lint, format, build validation)
- Automated CD (SSH-based deployment)
- Cloud VM provisioning and free-tier cost management
- Managed cloud database integration (Cloud SQL)
- Production debugging across multiple layers (Git, SSH, Docker, environment config, application logs)

## License

Personal learning project — not licensed for production use.
