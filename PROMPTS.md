## Prompt #001

We are building an AI-powered adaptive technical interviewer for the ABTalks hackathon.

Before writing application logic, inspect the repository and read these files completely:

* `PRODUCT.md`
* `INTERVIEW_ENGINE.md`
* `AGENTS.md`

These documents are the source of truth for the product behavior, interview-engine design, and development rules.

For this task, ONLY initialize the project foundation.

Requirements:

1. Set up a TypeScript monorepo-style structure with:

   * `backend/`
   * `frontend/`

2. Backend:

   * Node.js
   * Express
   * TypeScript
   * sensible development scripts
   * environment-variable support
   * basic health endpoint

3. Frontend:

   * React
   * Vite
   * TypeScript

4. Create a clean `.gitignore` that excludes:

   * `node_modules`
   * `.env`
   * build output
   * other appropriate local/generated files

5. Create appropriate `.env.example` files without real credentials.

6. Do NOT implement the interview engine yet.

7. Do NOT integrate an LLM yet.

8. Do NOT add a database yet.

9. Do NOT add authentication.

10. Do NOT add unnecessary dependencies or frameworks.

The repository must remain easy to understand and easy for another coding agent to continue if we switch agents later.

Before modifying files, briefly inspect the existing repository and determine whether anything already exists that should be preserved.

After implementation:

* verify both projects can install and start
* verify the backend health endpoint works
* verify the frontend starts successfully
* report exactly which files you created or changed
* do not make unrelated changes.

Do not commit anything. I will handle Git commits separately.
