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


## Prompt #002

We are now moving from project setup to the first implementation layer of the Adaptive Interviewer.

Before making changes, read:

* `PRODUCT.md`
* `INTERVIEW_ENGINE.md`
* `AGENTS.md`

Also inspect the current `backend/` implementation created in the previous task.

For this task, do NOT implement the interview behavior yet.

Your job is to design and implement the TypeScript domain types/interfaces for the interview engine.

Create a clean domain model for:

1. Candidate
2. InterviewState
3. Evidence
4. Uncertainty
5. Investigation
6. GeneratedQuestion
7. AnswerEvaluation
8. Decision
9. InterviewStage
10. InterviewTurn
11. Message

Requirements:

* Follow the concepts defined in `INTERVIEW_ENGINE.md`.
* Keep the types strongly typed.
* Avoid `any`.
* Use discriminated unions where they make the model clearer.
* Keep LLM/provider-specific details out of the core domain types.
* Do not introduce a database.
* Do not introduce an LLM SDK.
* Do not implement QuestionGenerator, AnswerEvaluator, DecisionEngine, or FeedbackGenerator yet.
* Do not implement the `/api/interview` endpoint yet.
* Do not modify the frontend.
* Do not add unnecessary dependencies.

Important design constraint:

The domain model must distinguish between:

* what we have evidence for,
* what remains uncertain,
* and what the engine is currently investigating.

Evidence must not be represented as a single numerical candidate score.

The model must support:

* multiple competencies being demonstrated by one answer
* evidence accumulating across multiple questions
* contradictions
* confidence levels
* curriculum coverage
* adaptive investigations
* the 8-stage interview structure
* the 8–12 question budget

Before coding, briefly explain the proposed type structure and any assumptions that need to be made.

Then implement it.

After implementation:

1. Run TypeScript compilation.
2. Fix any type errors.
3. Report the files created/changed.
4. Explain any design decisions that differ from the specification.

Do not commit anything.

## Prompt #003

Review the `Candidate` type you just created in `backend/src/interview/types.ts`.

Before changing it, search the repository for the supplied `candidate.json` schema or any documentation defining the candidate object expected by the hackathon.

Do not invent candidate fields.

Align the `Candidate` type with the actual supplied schema while preserving the interview engine's needs.

Also inspect whether the repository already contains curriculum data or a curriculum schema. Do not create one yet if it does not exist; just report what you find.

Do not modify any other interview types in this task.

Run the TypeScript build after the change.

Report:

1. Where the candidate schema was found.
2. What the actual candidate fields are.
3. What changed in `Candidate`.
4. Whether a curriculum schema/data source already exists.

Do not commit anything.
