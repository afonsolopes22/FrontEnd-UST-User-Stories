# DevLens

> AI-powered evaluation of User Story implementations against Azure DevOps acceptance criteria.

**Live:** [ust-testing-platform.onrender.com](https://ust-testing-platform.onrender.com)  
**Repository:** [AMSNextGen25-26/ust-testing-platform](https://github.com/AMSNextGen25-26/ust-testing-platform)

---

Admin Account:<br>
email: laercio@cgi.com<br>
pw: cgi

---

## What it does

1. **Connects to Azure DevOps** — reads work items and linked pull requests via PAT
2. **Evaluates with AI** — scores acceptance criteria compliance and code quality in real time
3. **Gives actionable feedback** — passed/failed criteria, code quality score, improvement suggestions

---

## Stack

| Layer | Technology |
|---|---|
| Framework | **Next.js 16** (App Router) |
| UI | **React 19** + **Tailwind CSS 4** + **shadcn/ui** |
| Auth | **NextAuth v4** (GitHub OAuth) |
| Database | **Supabase** (per-user history) |
| Backend | REST + SSE streaming (`tfc-userstories.onrender.com`) |

---

## Getting started

> **All commands must be run inside the `apps/web` folder.**

```bash
cd apps/web

# Install dependencies
npm install

# Run dev server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

Before running evaluations, go to **Settings** and configure your **Azure DevOps** organization (org name, project, PAT, repo URL).

---

## Key pages

| Route | Description |
|---|---|
| `/analyze` | Enter a Work Item ID and trigger evaluation |
| `/user-story` | Live streaming terminal + results per work item |
| `/user-stories` | All evaluated work items with scores |
| `/history` | Full submission log, searchable |
| `/achievements` | Gamification — unlock and equip name tags |
| `/settings` | Azure DevOps org configuration |
| `/faq` | Setup guide and PAT instructions |

---

## Gamification

Users unlock **name tags** by meeting quality thresholds across their evaluations. The active tag is displayed next to the user's name in the navbar.

### Achievements

| Tag | Requirement |
|---|---|
| **Newbie** | Always unlocked — default tag |
| **Bullseye** | 5 user stories with score ≥ 70% and code quality ≥ 50% |
| **The Sniper** | 3 user stories with a perfect score of 100% |
| **Batman** | 10 user stories with score ≥ 70% and code quality ≥ 50% |
| **Ghost** | 3 user stories with zero failed acceptance criteria |
| **Unlucky** | 1 user story with score below 50% |

Only the **last submission per work item** counts toward progress.

> Set `is_admin = true` on a user row in Supabase to unlock all achievements for that user.

---

---

## Supabase tables

### `user`

| Column | Type | Notes |
|---|---|---|
| `id` | `uuid` | Primary key |
| `github_id` | `text` | GitHub user ID — unique |
| `name` | `text` | Display name |
| `email` | `text` | Email from GitHub |
| `avatar_url` | `text` | GitHub avatar |
| `active_tag` | `text` | Currently equipped name tag (default `'NEWBIE'`) |
| `is_admin` | `boolean` | If `true`, all achievements are unlocked (default `false`) |

**Migration:**
```sql
ALTER TABLE "user" ADD COLUMN IF NOT EXISTS active_tag TEXT NOT NULL DEFAULT 'NEWBIE';
ALTER TABLE "user" ADD COLUMN IF NOT EXISTS is_admin BOOLEAN NOT NULL DEFAULT false;
```

---

### `organization`

| Column | Type | Notes |
|---|---|---|
| `id` | `uuid` | Primary key |
| `user_id` | `text` | GitHub user ID — **unique per user** |
| `name` | `text` | Display name |
| `azure_org` | `text` | Azure DevOps organization slug |
| `azure_project` | `text` | Azure DevOps project name |
| `azure_pat` | `text` | Personal Access Token (stored encrypted) |
| `azure_repo_url` | `text` | Repository URL |
| `backend_id` | `integer` | ID returned by the evaluation backend |

> One row per user (`user_id` unique constraint, upserted on save).

---

### `user_story`

| Column | Type | Notes |
|---|---|---|
| `id` | `uuid` | Primary key |
| `user_id` | `text` | GitHub user ID |
| `azure_work_item_id` | `text` | Azure DevOps work item ID |
| `user_story` | `text` | Work item title |
| `score` | `integer` | Acceptance criteria score (0–100) |
| `code_quality` | `integer` | Code quality score (0–100) |
| `summary` | `text` | AI-generated evaluation summary |
| `met_criteria` | `text[]` | Passed acceptance criteria |
| `failed_criteria` | `text[]` | Failed acceptance criteria |
| `improvements` | `text[]` | Suggested improvements |
| `notes` | `text[]` | Additional AI notes |
| `github_url` | `text` | PR / repo URL |
| `acceptance_criteria` | `text` | Raw acceptance criteria text |
| `created_at` | `timestamptz` | Auto-set by Supabase |

> Max **100 most recent submissions per user** — oldest is deleted automatically when the limit is reached.
