# Prompt #001

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


# Prompt #002

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

# Prompt #003

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

# Prompt #004
We are implementing the next small piece of the Adaptive Interviewer: session state management.

Before making changes, read:

* `PRODUCT.md`
* `INTERVIEW_ENGINE.md`
* `AGENTS.md`

Inspect the existing interview domain types in:

`backend/src/interview/types.ts`

### Goal

Implement an in-memory session store for `InterviewState`.

The store must allow the application to:

1. Create a new interview session.
2. Retrieve an existing session by `sessionId`.
3. Update an existing session.
4. Delete a session.
5. Determine whether a session exists.

Use a simple in-memory data structure such as a `Map`.

### Requirements

Create the session store inside the interview domain, for example:

`backend/src/interview/session-store.ts`

Expose a small class or interface with methods equivalent to:

```ts
create(session: InterviewState): void;
get(sessionId: string): InterviewState | undefined;
update(session: InterviewState): void;
delete(sessionId: string): boolean;
has(sessionId: string): boolean;
```

Use the existing `InterviewState` type.

### Important

* Do NOT implement the interview engine.
* Do NOT implement `/api/interview`.
* Do NOT integrate an LLM.
* Do NOT add a database.
* Do NOT add authentication.
* Do NOT add new dependencies.
* Do NOT modify the frontend.

### State safety

The store must not silently overwrite an existing session when `create()` is called with an already-used `sessionId`.

Choose a sensible behavior, such as throwing a clear error.

Similarly, `update()` should not silently create a session that does not exist.

### Testing

Add focused unit tests for:

* creating and retrieving a session
* checking existence
* updating a session
* deleting a session
* attempting to create a duplicate session
* attempting to update a nonexistent session

Use the simplest testing approach compatible with the current project. Do not introduce a large testing framework unless necessary.

### Verification

After implementation:

1. Run the backend TypeScript build.
2. Run the session-store tests.
3. Report files created/changed.
4. Report any design decisions.

Do not commit anything.

# Prompt #005

Make only the following cleanup changes to the session-store implementation.

1. Add this script to `backend/package.json`:

```json
"test": "npm run build && node dist/test/session-store.test.js"
```

Preserve all existing scripts.

2. In `backend/test/session-store.test.ts`, remove the use of `any` in the catch blocks. We only need to verify that an exception occurred, so use `catch {}` where appropriate.

3. Do not change the session-store implementation.

4. Do not change the interview domain types.

5. Do not add dependencies.

6. Run:

```bash
npm run build
npm test
```

Both must succeed.

Report exactly what changed.

Do not commit anything.

# Prompt #006

We are now implementing the first behavioral part of the Adaptive Interview Engine.

Before making changes, read:

* `PRODUCT.md`
* `INTERVIEW_ENGINE.md`
* `AGENTS.md`
* `backend/src/interview/types.ts`
* `backend/src/interview/session-store.ts`

Do not redesign the existing domain model unless a concrete implementation problem requires it.

## Goal

Implement the first part of `InterviewEngine`:

* creating a new interview session
* initializing its state correctly
* generating the first interview question through a provider interface

Create the engine inside the interview domain, for example:

`backend/src/interview/engine.ts`

### Start behavior

Implement:

```ts
start(candidate: Candidate, sessionId: string): Promise<InterviewTurn>
```

When starting:

1. Reject an empty/invalid `sessionId`.
2. Reject a session if that `sessionId` already exists.
3. Create an `InterviewState`.
4. Set:

   * `questionCount` to `0`
   * stage to `InterviewStage.Establish`
   * empty evidence
   * empty uncertainties
   * empty investigations
   * empty covered topics
   * empty curriculum coverage
   * empty asked-question list
   * empty messages
   * empty turns
   * status to `"active"`
5. Store the state using the existing `InMemorySessionStore`.
6. Generate the first question through a `QuestionGenerator` abstraction.

## QuestionGenerator

Create an interface that represents question generation without coupling the engine to an LLM provider.

For example:

```ts
interface QuestionGenerator {
  generate(context: QuestionContext): Promise<GeneratedQuestion>;
}
```

The exact interface may differ if there is a better type-safe design, but the separation must remain.

For the first implementation, create a simple deterministic/mock question generator for development and testing.

It should generate an Establish-stage question without calling an LLM.

Do NOT integrate an LLM yet.

## Important state rule

The generated first question must be recorded in the interview state:

* add its ID to `askedQuestions`
* add the interviewer message to `messages`
* increment `questionCount` appropriately according to the meaning defined in `INTERVIEW_ENGINE.md`

Be careful here: distinguish between a question being generated/asked and a question being answered. The state must remain consistent with our 8–12 question budget.

Return an `InterviewTurn` containing the generated question.

## Tests

Add focused tests for:

1. starting a new interview
2. correct initial stage
3. first question generation
4. session persistence
5. duplicate session rejection
6. invalid session ID rejection
7. generated question being recorded in state

Do not test LLM behavior because no LLM exists yet.

## Constraints

* Do NOT implement `processAnswer()` yet.
* Do NOT implement AnswerEvaluator yet.
* Do NOT implement DecisionEngine yet.
* Do NOT implement FeedbackGenerator yet.
* Do NOT implement `/api/interview` yet.
* Do NOT add a database.
* Do NOT modify the frontend.
* Do NOT add unnecessary dependencies.
* Do NOT commit anything.

Run:

```bash
npm run build
npm test
```

Both must pass.

At the end, report:

* files created/changed
* how `InterviewEngine.start()` works
* how the question generator abstraction works
* how question counting is handled
* test results
* any assumptions made

# Prompt #007

Before implementing any additional interview functionality, modernize the TypeScript module-resolution configuration.

Read the existing:

* `backend/tsconfig.json`
* `frontend/tsconfig.json`
* `backend/package.json`
* `frontend/package.json`

Make ONLY the following configuration changes:

### Backend

The backend is a Node.js application.

Change:

```json
"module": "CommonJS",
"moduleResolution": "node"
```

to the modern Node configuration:

```json
"module": "NodeNext",
"moduleResolution": "NodeNext"
```

Keep the existing strictness and other useful compiler options unless a concrete compatibility issue requires a change.

### Frontend

The frontend is a Vite application using a bundler.

Change:

```json
"module": "ESNext",
"moduleResolution": "Node"
```

to:

```json
"module": "ESNext",
"moduleResolution": "Bundler"
```

Do not change the frontend architecture.

### Verification

After making the changes:

1. Run the backend build.
2. Run the backend tests.
3. Run the frontend build.
4. Fix any compatibility issues caused specifically by this configuration migration.

Do NOT:

* change the interview engine
* change the domain types
* add dependencies
* integrate an LLM
* add a database
* add an API route
* modify the interview behavior
* modify unrelated files

Report:

* exact files changed
* whether the backend build passed
* whether backend tests passed
* whether frontend build passed
* any compatibility changes required

Do not commit anything.


# Prompt #008

Make one focused correction to the current `InterviewEngine.start()` implementation.

Read the existing `backend/src/interview/engine.ts` and its tests.

### Problem

The first generated question contains:

```ts
curriculumDays: [1]
```

but the resulting `InterviewState` currently leaves:

```ts
coveredCurriculumDays: []
```

This makes the session state inconsistent with the question that was actually asked.

### Change

After generating the first question, update:

```ts
state.coveredCurriculumDays
```

using the curriculum day IDs from:

```ts
generatedQuestion.curriculumDays
```

Do not hardcode `[1]`.

The implementation should use the generated question's metadata so it remains correct if the mock question changes later.

Avoid duplicate curriculum day IDs.

### Test

Add a focused test proving that after `InterviewEngine.start()`:

* the generated question contains its curriculum day(s)
* the persisted interview state contains those same curriculum day(s)
* duplicate curriculum day IDs are not introduced

### Do NOT change

* QuestionGenerator architecture
* Candidate types
* SessionStore
* InterviewStage
* questionCount behavior
* processAnswer
* LLM integration
* API
* frontend
* dependencies

Run:

```bash
npm run build
npm test
```

Do not commit anything.

Report the files changed and test results.


# Prompt #009

We are implementing the next isolated component of the Adaptive Interviewer: the Answer Evaluator.

Before making changes, read:

* `PRODUCT.md`
* `INTERVIEW_ENGINE.md`
* `AGENTS.md`
* `backend/src/interview/types.ts`
* `backend/src/interview/engine.ts`
* `backend/src/interview/session-store.ts`

## Goal

Create the Answer Evaluator abstraction that will eventually be powered by an LLM.

For now, implement only a deterministic development evaluator so that the engine can be tested without an LLM.

Create it inside the interview domain, for example:

`backend/src/interview/evaluator.ts`

## Interface

Define an abstraction similar to:

```ts
interface AnswerEvaluator {
  evaluate(context: EvaluationContext): Promise<AnswerEvaluation>;
}
```

The evaluation context should contain enough information to evaluate an answer, including:

* candidate
* current interview state
* current question
* candidate answer

Keep the evaluator independent from any particular LLM provider.

## Development evaluator

Create a deterministic evaluator for development/testing.

It must NOT pretend to perform sophisticated semantic evaluation.

It may use simple deterministic rules to produce structured output, for example based on whether an answer is empty, extremely short, or contains meaningful content.

The important purpose is to verify the data flow:

```text
candidate answer
      ↓
AnswerEvaluator
      ↓
AnswerEvaluation
      ↓
Evidence
```

Do not claim that keyword matching represents real candidate assessment.

## Evaluation requirements

The returned `AnswerEvaluation` must contain:

* evidence
* missing
* contradictions
* confidence

The evaluator should be capable of returning multiple `Evidence` items because one answer can provide evidence about multiple competencies.

Do not introduce numerical candidate scores.

## Tests

Create focused tests for:

1. meaningful answer produces structured evidence
2. empty answer is handled safely
3. very short answer produces weak evidence
4. evaluation contains valid confidence
5. evaluation can contain multiple evidence items
6. evaluator does not mutate the interview state

## Constraints

Do NOT:

* implement `processAnswer()`
* implement DecisionEngine
* implement QuestionGenerator changes
* integrate an LLM
* add a database
* add API routes
* modify the frontend
* add unnecessary dependencies
* change the session store

Run:

```bash
npm run build
npm test
```

Both must pass.

Report:

* files created/changed
* the evaluator interface
* how the deterministic evaluator works
* test results
* any assumptions

Do not commit anything.


# Prompt #010

We need to revise the deterministic development evaluator before connecting it to the interview engine.

Read:

* `backend/src/interview/evaluator.ts`
* `backend/test/evaluator.test.ts`
* `INTERVIEW_ENGINE.md`

### Problem

The current evaluator uses keywords such as:

* build
* debug
* deploy
* latency
* security

to infer specific competencies.

This is not acceptable even as a development evaluator because keyword presence does not prove that a candidate demonstrated the competency.

For example:

> "I don't know how to debug this."

should not produce debugging evidence simply because the word "debug" appears.

### New purpose of the development evaluator

The development evaluator is ONLY a deterministic stand-in for testing the interview data flow.

It must NOT pretend to perform semantic technical assessment.

Use only these broad signals:

#### Empty answer

Return:

* no evidence
* low confidence
* missing response information

#### Very short answer

Return:

* one weak generic evidence item
* low confidence
* indicate that insufficient detail was provided

Do not assign specific competency strengths from the content.

#### Sufficiently detailed answer

Return:

* one generic evidence item indicating that the candidate provided a substantive response
* moderate confidence

The evidence may leave all specific competency fields undefined.

Do NOT infer:

* debugging ability
* implementation ability
* system design ability
* optimization ability
* security ability
* trade-off ability

from keywords.

### Important

The real LLM-backed evaluator will later perform semantic assessment.

The development evaluator exists only so that we can test:

```text
candidate answer
    ↓
AnswerEvaluator
    ↓
AnswerEvaluation
    ↓
InterviewEngine
```

### Update tests

Modify the tests so they verify:

1. empty answer → no evidence
2. very short answer → one weak generic evidence item
3. sufficiently detailed answer → substantive generic evidence
4. confidence is valid
5. evaluator does not mutate state
6. no competency is falsely inferred from keywords

Add a regression test such as:

```text
"I don't know how to debug this."
```

and verify that it does NOT produce debugging evidence.

Also verify that an answer containing words like "latency", "security", or "deploy" does not automatically create competency evidence.

### Constraints

Do not:

* change `AnswerEvaluator` interface
* change domain types
* implement `processAnswer`
* implement DecisionEngine
* integrate an LLM
* add dependencies
* modify frontend
* modify session store

Run:

```bash
npm run build
npm test
```

Do not commit anything.

Report exactly what changed and the test results.


# Prompt #011

We are now implementing the Decision Engine for the Adaptive Interviewer.

Before making changes, read:

* `PRODUCT.md`
* `INTERVIEW_ENGINE.md`
* `AGENTS.md`
* `backend/src/interview/types.ts`
* `backend/src/interview/engine.ts`
* `backend/src/interview/evaluator.ts`
* `backend/src/interview/session-store.ts`

## Goal

Create a Decision Engine abstraction that determines what the interviewer should investigate after an answer has been evaluated.

Create it inside the interview domain, for example:

`backend/src/interview/decision.ts`

The Decision Engine will eventually be LLM-assisted, but for now implement a deterministic development version.

---

## Interface

Create an abstraction similar to:

```ts
interface DecisionEngine {
  decide(context: DecisionContext): Promise<Decision>;
}
```

`DecisionContext` should contain enough information to make a decision, including:

* candidate
* current interview state
* current question
* answer evaluation

Keep it independent of any LLM provider.

---

## Development Decision Engine

The deterministic implementation must follow the hard interview constraints from `INTERVIEW_ENGINE.md`.

It should make simple decisions based on state and evaluation.

### Rules

#### Rule 1 — Never finish too early

If:

```text
questionCount < 8
```

the decision must NOT be `FINISH`.

#### Rule 2 — Maximum question limit

If:

```text
questionCount >= 12
```

return:

```text
FINISH
```

#### Rule 3 — Investigate weak evidence

If the evaluation contains weak evidence or low confidence, the engine should be capable of returning:

```text
CONTINUE_INVESTIGATION
```

with an `Investigation`.

The investigation should identify what remains uncertain.

Do not claim a specific competency weakness merely from the development evaluator's generic evidence.

#### Rule 4 — Curriculum coverage

If fewer than 4 curriculum days have been covered, the engine should avoid finishing even if the candidate appears strong.

#### Rule 5 — Normal continuation

If there is no important unresolved uncertainty and the interview has not reached the minimum completion conditions, return a sensible continuation decision.

Use `ADVANCE_STAGE` or `NEW_INVESTIGATION` where appropriate rather than inventing a new action type.

---

## Important distinction

The Decision Engine must NOT generate the next question.

Its responsibility ends at:

> "What should we investigate next?"

The QuestionGenerator will later convert that decision into an actual candidate-facing question.

The separation must remain:

```text
AnswerEvaluation
       ↓
DecisionEngine
       ↓
Decision
       ↓
QuestionGenerator
```

---

## Investigation quality

An investigation should contain:

* objective
* hypothesis
* target area

However, because the current deterministic evaluator does not provide semantic competency evidence, do not invent sophisticated hypotheses.

For example, a safe development investigation might be:

```text
objective:
"Collect more evidence about the candidate's technical reasoning."

hypothesis:
"Current evidence is insufficient to determine depth."

targetArea:
current question target area
```

The future LLM-backed evaluator and decision engine will make these much more intelligent.

---

## Tests

Create focused tests for:

1. fewer than 8 questions cannot finish
2. 12 questions must finish
3. fewer than 4 curriculum days cannot finish
4. weak/low-confidence evaluation can trigger an investigation
5. normal continuation produces a valid non-finish decision
6. decision engine does not mutate interview state
7. decisions conform to the existing `Decision` discriminated union

Do not test LLM behavior.

---

## Constraints

Do NOT:

* implement `processAnswer()`
* modify `InterviewEngine.start()`
* modify `QuestionGenerator`
* integrate an LLM
* add a database
* add API routes
* modify frontend
* add dependencies
* create new decision action types unless absolutely required by a concrete specification conflict

Use the existing `Decision` type from `types.ts`.

Run:

```bash
npm run build
npm test
```

Both must pass.

Report:

* files created/changed
* DecisionEngine interface
* deterministic decision rules
* test results
* any assumptions

Do not commit anything.


# Prompt #012

We are now implementing `InterviewEngine.processAnswer()`.

Before making changes, read:

* `PRODUCT.md`
* `INTERVIEW_ENGINE.md`
* `AGENTS.md`
* `backend/src/interview/types.ts`
* `backend/src/interview/session-store.ts`
* `backend/src/interview/engine.ts`
* `backend/src/interview/evaluator.ts`
* `backend/src/interview/decision.ts`
* all existing interview tests

## Goal

Connect the existing components into one deterministic end-to-end interview flow.

The engine should orchestrate:

```text
candidate answer
      ↓
AnswerEvaluator
      ↓
AnswerEvaluation
      ↓
DecisionEngine
      ↓
Decision
      ↓
QuestionGenerator
      ↓
updated InterviewState
```

Do NOT put evaluator or decision logic directly inside `InterviewEngine`.

---

## Method

Add:

```ts
processAnswer(
  sessionId: string,
  answer: string
): Promise<InterviewTurn>
```

Use the existing `sessionId` to retrieve the interview state.

---

## Required behavior

### 1. Validate session

Reject:

* empty sessionId
* nonexistent session
* completed session

Do not create a new session during `processAnswer()`.

---

### 2. Validate answer

Reject an invalid answer where appropriate.

An empty answer should NOT crash the application. The evaluator is explicitly capable of evaluating an empty answer, so allow an empty/whitespace answer to reach the evaluator.

The engine should distinguish:

* invalid request data
* a valid but empty candidate response

Do not silently discard a valid candidate response.

---

### 3. Record candidate answer

Create a candidate `Message` containing:

* unique message ID
* role `"candidate"`
* answer content
* question ID
* timestamp

Add it to the session's chronological `messages`.

---

### 4. Evaluate the answer

Call the injected `AnswerEvaluator`.

Pass it:

* candidate
* current state
* current question
* candidate answer message

Do not modify the evaluator's responsibilities.

---

### 5. Store evaluation evidence

After evaluation:

* append returned evidence to `state.evidence`
* preserve existing evidence
* do not replace previous evidence

If appropriate, update the session's uncertainties based on the evaluation.

Do NOT invent sophisticated uncertainty logic yet. The current development evaluator is intentionally simple.

---

### 6. Make a decision

Call the injected `DecisionEngine`.

Pass it the current state after the answer/evaluation has been incorporated.

The engine should not generate the decision itself.

---

### 7. Handle FINISH

If the DecisionEngine returns:

```ts
{ action: "FINISH" }
```

then:

* mark the session `status = "completed"`
* update `updatedAt`
* record the completed turn
* do not generate another question
* return an `InterviewTurn` containing:

  * current question
  * candidate answer
  * evaluation
  * FINISH decision

The API layer will later convert this into the required final feedback response.

Do NOT implement FeedbackGenerator yet.

---

### 8. Handle continuation decisions

For:

```text
CONTINUE_INVESTIGATION
NEW_INVESTIGATION
ADVANCE_STAGE
```

generate the next question using the existing `QuestionGenerator`.

The QuestionGenerator should receive the updated state and the decision.

If the decision advances the stage, update:

```ts
state.stage
```

before generating the next question.

Record the new question:

* add question ID to `askedQuestions`
* add its curriculum days to `coveredCurriculumDays` without duplicates
* add interviewer message
* increment `questionCount`

Preserve all previous messages, evidence, and turns.

---

## Turn handling

The current `InterviewTurn` type allows optional fields.

Use it consistently:

For a completed answer:

```text
question
answer
evaluation
decision
```

must all be present.

For the initial question:

only the question is present because no candidate answer exists yet.

Do not redesign the type in this task unless the existing type makes the required behavior impossible.

---

## Question count

`questionCount` represents the number of questions that have been asked to the candidate.

Therefore:

* first question = 1
* after generating question 2 = 2
* etc.

Do not increment the count when merely receiving an answer.

---

## State consistency

Update state only after each operation succeeds.

If evaluator, decision engine, or question generation throws:

* do not mark the interview completed
* do not increment question count for a question that was never generated
* do not lose previous evidence
* do not corrupt the stored session

Because the current session store uses copies, explicitly persist the final updated state using `store.update()`.

---

## Dependency injection

Update `InterviewEngine` so it can receive:

* SessionStore
* QuestionGenerator
* AnswerEvaluator
* DecisionEngine

with sensible development defaults.

This keeps the engine testable and will allow us to replace the deterministic implementations with LLM-backed implementations later.

---

## Tests

Add focused end-to-end engine tests for:

1. start interview → receive first question
2. answer first question → receive second question
3. candidate answer is stored in messages
4. evaluation evidence accumulates
5. question count increases only when a new question is generated
6. curriculum coverage accumulates without duplicates
7. `ADVANCE_STAGE` updates the stage
8. `CONTINUE_INVESTIGATION` generates another question
9. `FINISH` completes the session without generating another question
10. nonexistent session is rejected
11. completed session cannot accept another answer
12. evaluator failure does not corrupt the session
13. decision engine failure does not corrupt the session
14. question generation failure does not corrupt the session

Use deterministic/mock components only.

Do not integrate an LLM.

---

## Constraints

Do NOT:

* implement FeedbackGenerator
* implement `/api/interview`
* add an LLM SDK
* add a database
* add authentication
* modify frontend
* add unnecessary dependencies

Do not rewrite working components unnecessarily.

Run:

```bash
npm run build
npm test
```

Both must pass.

Report:

* files changed
* how `processAnswer()` works
* dependency injection changes
* state-update behavior
* test results
* any assumptions

Do not commit anything.


# Prompt #013

Review the current `backend/src/interview/engine.ts` and `backend/test/engine.test.ts`.

We found three state/flow consistency issues. Fix ONLY these.

### 1. DecisionEngine must see accumulated evidence

Current flow is effectively:

```text
Answer
  ↓
AnswerEvaluator
  ↓
DecisionEngine
  ↓
state.evidence updated
```

Change it to:

```text
Answer
  ↓
AnswerEvaluator
  ↓
append evaluation.evidence to state.evidence
  ↓
DecisionEngine
```

The DecisionEngine must receive the updated state containing evidence from the current answer as well as all previous evidence.

Do not mutate the evaluator's input state before evaluation.

---

### 2. `processAnswer()` must return the newly generated pending turn

`InterviewTurn` represents one question.

The existing state model should remain:

```text
turn 1:
  question
  answer
  evaluation
  decision

turn 2:
  question
  [waiting for answer]
```

Therefore:

#### When continuing the interview

After processing the current answer and generating the next question:

* complete the current turn
* create a new pending turn for the new question
* append it to `state.turns`
* persist the state
* return the NEW pending `InterviewTurn`

The returned turn should contain:

* `turnNumber`
* `question`
* `timestamp`

It should NOT incorrectly return the previous question as the current interviewer question.

#### When FINISH is returned

There is no next question.

Return the completed current turn containing:

* question
* answer
* evaluation
* decision
* timestamp

Do not generate another question.

Do not redesign `InterviewTurn`.

---

### 3. Persist investigations

If the DecisionEngine returns:

```text
CONTINUE_INVESTIGATION
```

or:

```text
NEW_INVESTIGATION
```

append the returned `decision.investigation` to:

```ts
state.investigations
```

Preserve previous investigations.

Do not invent additional investigation logic.

`ADVANCE_STAGE` does not create an investigation.

---

## Tests

Update/add tests proving:

1. answering Q1 returns Q2, not Q1
2. Q1 remains completed in `state.turns`
3. Q2 exists as a pending turn with no answer/evaluation/decision
4. DecisionEngine receives state containing current-answer evidence
5. investigations returned by the DecisionEngine are persisted
6. previous investigations are preserved
7. FINISH returns the completed current turn and creates no new question

Keep all existing tests.

Run:

```bash
npm run build
npm test
```

Both must pass.

Do NOT:

* redesign `InterviewTurn`
* modify domain types unless absolutely required
* modify AnswerEvaluator
* modify DecisionEngine
* modify QuestionGenerator
* add an LLM
* add a database
* add API routes
* modify frontend
* add dependencies

Do not commit anything.

Report exactly what changed and the test results.


# Prompt #014

We are now implementing the HTTP API required by the ABTalks hackathon.

Before changing anything, read:

* `PRODUCT.md`
* `INTERVIEW_ENGINE.md`
* `AGENTS.md`
* `backend/src/app.ts`
* `backend/src/index.ts`
* `backend/src/interview/engine.ts`
* `backend/src/interview/types.ts`
* all existing backend interview tests

## Goal

Expose exactly one interview endpoint:

```http
POST /api/interview
```

The API layer must be thin.

It should translate HTTP requests into calls to `InterviewEngine`. It must NOT contain interview decision logic.

---

## Request contract

### Start interview

Request:

```json
{
  "sessionId": "abc-123",
  "candidate": {}
}
```

When `message` is absent:

1. Validate that `sessionId` is a non-empty string.
2. Validate that `candidate` is an object.
3. Call:

```ts
engine.start(candidate, sessionId)
```

Return HTTP 200 with:

```json
{
  "reply": "...",
  "done": false
}
```

`reply` should contain the generated first question's text.

Do not expose internal engine state.

---

### Continue interview

Request:

```json
{
  "sessionId": "abc-123",
  "message": "..."
}
```

When `message` is present:

1. Validate that `sessionId` is a non-empty string.
2. Validate that `message` is a string.
3. Call:

```ts
engine.processAnswer(sessionId, message)
```

If the returned turn contains a new pending question:

return:

```json
{
  "reply": "...next question...",
  "done": false
}
```

If the returned turn represents a completed interview:

return:

```json
{
  "reply": "Interview completed.",
  "done": true,
  "feedback": {
    "summary": "...",
    "strengths": [],
    "gaps": [],
    "next": []
  }
}
```

For now, because FeedbackGenerator does not exist yet, use a clearly marked deterministic placeholder feedback implementation.

Do NOT build a sophisticated feedback system in this task.

---

## Routing architecture

Keep separation:

```text
HTTP request
    ↓
controller
    ↓
InterviewEngine
    ↓
domain components
```

Create a focused controller/router if appropriate.

Do not put business logic inside `app.ts`.

---

## Error handling

Add appropriate HTTP error handling.

At minimum:

* malformed request → 400
* invalid/nonexistent session → 400 or 404 as appropriate
* completed session → 400 or 409 as appropriate
* unexpected internal error → 500

Do not expose stack traces or internal implementation details to the client.

Use a consistent JSON error shape, for example:

```json
{
  "error": "..."
}
```

Do not add authentication.

---

## Important API contract constraint

The hackathon requires:

```http
POST /api/interview
```

There should NOT be separate `/start` and `/answer` endpoints.

The same endpoint determines whether this is:

* a new interview, based on the presence of `candidate`
* a continuation, based on the presence of `message`

Handle ambiguous requests deliberately.

For example, reject a request that contains neither `candidate` nor `message`.

Do not silently start or continue an interview when required information is missing.

---

## Tests

Add API-level tests.

Do not add a testing framework unless absolutely necessary. Follow the existing project's lightweight testing approach if practical.

Test at minimum:

1. start request returns first question
2. continuation request returns next question
3. candidate message reaches the engine
4. completed interview returns `done: true`
5. final response contains required feedback shape
6. missing sessionId → 400
7. missing candidate on start → 400
8. missing message on continuation → 400
9. malformed request → 400
10. engine errors are converted to appropriate HTTP errors
11. internal errors do not expose stack traces
12. API does not expose internal interview state

---

## Constraints

Do NOT:

* modify InterviewEngine behavior unless required to satisfy the API contract
* modify AnswerEvaluator
* modify DecisionEngine
* modify QuestionGenerator
* implement real FeedbackGenerator
* integrate an LLM
* add a database
* add authentication
* modify frontend
* add unnecessary dependencies

Keep the controller thin.

Run:

```bash
npm run build
npm test
```

Both must pass.

Also manually verify the endpoint with curl if practical.

Report:

* files created/changed
* endpoint behavior
* request/response examples
* error handling
* test results
* manual curl verification

Do not commit anything.


# Prompt #015
We manually tested the live `/api/interview` endpoint.

The API successfully processed the first answer, but the next question had identical text to the first question.

This is because `MockQuestionGenerator` currently generates a new question ID but uses the same hardcoded question text.

Fix the development question generator so that it produces a deterministic but varied interview sequence.

### Goal

The development generator should provide different questions across interview stages so we can meaningfully test:

```text
question
→ answer
→ evaluation
→ decision
→ next question
```

Do NOT integrate an LLM.

Do NOT make the generator randomly choose questions.

### Development question sequence

Create a small deterministic question bank representing the intended interview progression:

1. Establish

   * candidate's real project/system experience

2. Build

   * how they would implement or extend something

3. Extend

   * deeper reasoning / design decision

4. Break

   * debugging, failure, or edge-case scenario

5. Disambiguate

   * probe an uncertainty revealed by previous answers

6. Optimize

   * performance, scalability, reliability, or trade-offs

7. Operate

   * production deployment, monitoring, incidents, or maintainability

8. Synthesize

   * bring the candidate's reasoning together / production readiness

Each question must have appropriate:

* `targetArea`
* `curriculumDays`
* `purpose`
* `difficulty`

The questions should be technically meaningful enough to exercise the engine, but they are still deterministic development questions.

### Important

The generator should use the current interview state and decision where appropriate.

Do not simply use:

```ts
question-${questionCount}
```

with identical text.

The generated question ID must remain unique.

The question generator should avoid returning a question whose ID already exists in:

```ts
state.askedQuestions
```

### Stage handling

The development generator should respect the current `InterviewStage`.

If the DecisionEngine advances the stage, the next question should correspond to that stage.

If the decision is:

```text
CONTINUE_INVESTIGATION
```

the next question should remain focused on the relevant current target area rather than blindly advancing through the sequence.

If the decision is:

```text
NEW_INVESTIGATION
```

the next question should explore a different angle while remaining related to the investigation target.

Do not build sophisticated adaptive reasoning into the generator. The DecisionEngine remains responsible for deciding what happens next.

### Tests

Update/add tests to verify:

1. first question is Establish
2. subsequent questions do not all have identical text
3. generated question IDs are unique
4. generated questions contain curriculum metadata
5. stage-appropriate questions are generated
6. asked question IDs are not repeated
7. CONTINUE_INVESTIGATION keeps the target area relevant
8. the existing engine tests continue to pass

Do not modify:

* AnswerEvaluator
* DecisionEngine
* SessionStore
* API contract
* frontend
* domain types unless absolutely necessary

Run:

```bash
npm run build
npm test
```

Do not commit anything.

Report the exact question sequence/strategy used by the development generator and the test results.



# Prompt #016

We found a behavioral flaw in the current `DevelopmentDecisionEngine`.

The current implementation treats:

```ts
state.coveredCurriculumDays.length < 4
```

as a reason to always return `CONTINUE_INVESTIGATION`.

This is incorrect.

### Important architectural distinction

Curriculum coverage is a **completion constraint**, not an instruction to remain in the current investigation.

We want:

```text
Weak / uncertain evidence
        ↓
CONTINUE_INVESTIGATION
```

but:

```text
Insufficient curriculum coverage
        ↓
Continue the interview / explore another area
```

It must NOT automatically mean:

```text
stay on the same topic
```

---

## New deterministic rules

Implement the following ordering.

### Rule 1 — Hard maximum

If:

```ts
state.questionCount >= 12
```

return:

```ts
{ action: "FINISH" }
```

This rule has the highest priority.

---

### Rule 2 — Minimum interview length

If:

```ts
state.questionCount < 8
```

the engine must NEVER return `FINISH`.

It may return:

* `CONTINUE_INVESTIGATION`
* `NEW_INVESTIGATION`
* `ADVANCE_STAGE`

depending on the available evidence and current state.

---

### Rule 3 — Weak evidence

If:

```ts
answerEvaluation.confidence === "low"
```

or:

```ts
answerEvaluation.evidence.length === 0
```

return:

```text
CONTINUE_INVESTIGATION
```

The investigation should remain focused on the current target area.

Do not invent competency weaknesses.

---

### Rule 4 — Sufficient evidence before minimum

If:

```text
questionCount < 8
AND
evaluation is not weak
```

do NOT use curriculum coverage as a reason to investigate the current topic.

Instead, explore another area.

Use the existing `NEW_INVESTIGATION` or `ADVANCE_STAGE` decision types.

Prefer `ADVANCE_STAGE` when the current evidence is sufficient.

---

### Rule 5 — After minimum length

When:

```text
questionCount >= 8
```

and:

```text
curriculumDays < 4
```

the interview still cannot finish.

However, it should continue by exploring another area or advancing the stage rather than automatically investigating the current topic.

Prefer `ADVANCE_STAGE` when evidence is sufficient.

---

### Rule 6 — Completion eligibility

Only consider `FINISH` when all hard completion constraints are satisfied:

```text
questionCount >= 8
AND
curriculumDays >= 4
```

However, remember that the hard maximum at 12 always finishes regardless of curriculum coverage.

The deterministic engine does not need sophisticated final-quality assessment yet.

For now, once the minimum conditions are satisfied and the interview is at an appropriate point, it may return `ADVANCE_STAGE` until the maximum is reached.

Do not invent new completion rules.

---

## Expected behavior

For Q1:

```text
questionCount = 1
coveredCurriculumDays = [1]
confidence = medium
```

the decision should NOT be:

```text
CONTINUE_INVESTIGATION
```

merely because only one curriculum day is covered.

It should advance/explore.

For:

```text
questionCount = 1
confidence = low
```

it should:

```text
CONTINUE_INVESTIGATION
```

For:

```text
questionCount = 8
coveredCurriculumDays = [1, 2, 3]
confidence = medium
```

it must NOT finish, but should continue by advancing/exploring.

For:

```text
questionCount = 12
coveredCurriculumDays = [1, 2]
```

it must:

```text
FINISH
```

---

## Tests

Update the existing Decision Engine tests.

Add explicit regression tests for:

1. Q1 with medium confidence and one curriculum day does NOT investigate merely because coverage is low.
2. low-confidence Q1 DOES trigger `CONTINUE_INVESTIGATION`.
3. fewer than 8 questions can return `ADVANCE_STAGE`.
4. fewer than 8 questions can return `NEW_INVESTIGATION`.
5. questionCount 8 with only 3 curriculum days cannot finish.
6. questionCount 8 with sufficient evidence advances/explores rather than automatically investigating the current topic.
7. questionCount 12 always returns `FINISH`, even with fewer than 4 curriculum days.
8. existing state is not mutated.
9. decisions remain members of the existing `Decision` discriminated union.

Keep the Decision Engine independent from the QuestionGenerator.

Do not modify the API.

Do not modify the AnswerEvaluator.

Do not modify the QuestionGenerator.

Do not modify domain types unless absolutely required.

Run:

```bash
npm run build
npm test
```

Do not commit anything.

Report exactly what changed and the test results.


# Prompt #017

We need to test the weak-answer/investigation path properly.

Do NOT modify `DevelopmentAnswerEvaluator`.

Do NOT add word-count heuristics, keyword heuristics, or any other fake semantic assessment.

The development evaluator should remain a simple deterministic placeholder.

### Goal

Use dependency injection to test that `InterviewEngine.processAnswer()` correctly handles a weak evaluation.

Create a test-only `AnswerEvaluator` implementation inside the engine test file (or another test-only file if cleaner) that deliberately returns:

```ts
{
  evidence: [],
  missing: ["Insufficient evidence for testing."],
  contradictions: [],
  confidence: "low",
  ...
}
```

The exact shape must match the existing `AnswerEvaluation` type.

Also create/use a deterministic question generator suitable for the test if necessary.

### Test scenario

Start an interview with:

```text
sessionId = "weak-answer-test"
candidate = { id: "cand-1", displayName: "Test Candidate" }
```

The first question should be generated normally.

Then call:

```ts
engine.processAnswer(
  "weak-answer-test",
  "some test answer"
)
```

using the injected weak evaluator.

Verify all of the following:

1. `processAnswer()` completes the current question.
2. The returned decision is:

```text
CONTINUE_INVESTIGATION
```

3. The investigation is persisted in `InterviewState.investigations`.
4. The investigation target area matches the current question's `targetArea`.
5. A new question is generated.
6. The new question is returned as the pending question.
7. The previous turn contains:

   * the candidate answer
   * the evaluation
   * the decision
8. The new turn has:

   * a question
   * no answer
   * no evaluation
   * no decision
9. The interview remains active.
10. The current stage does not advance when the decision is `CONTINUE_INVESTIGATION`.
11. The generated follow-up question remains relevant to the investigation target area.
12. The original question ID is not reused.

### Important architectural requirement

The test must demonstrate dependency injection.

Do not modify production code merely to make the test easier.

The existing constructor already supports:

```ts
new InterviewEngine(
  store,
  questionGenerator,
  answerEvaluator,
  decisionEngine
)
```

Use that capability.

If the existing implementation does not correctly satisfy the above behavior, make the **smallest production change necessary**.

Do not change:

* `DevelopmentAnswerEvaluator`
* `DevelopmentDecisionEngine` rules
* API contract
* frontend
* domain types unless absolutely necessary

### Add regression coverage

Also verify that the existing strong/substantive-answer path still works.

The test suite should therefore cover both:

```text
strong evaluation
    ↓
ADVANCE_STAGE
    ↓
new stage question
```

and:

```text
weak evaluation
    ↓
CONTINUE_INVESTIGATION
    ↓
same-stage/relevant follow-up
```

Run:

```bash
npm run build
npm test
```

Do not commit anything.

Report:

* exact files changed
* what production code, if any, had to change
* what the new tests prove
* build result
* test result


# Prompt #018

Add a focused regression test for the medium-confidence evaluation path.

### Goal

Verify that a medium-confidence evaluation containing evidence is treated as sufficient evidence for normal progression.

Do NOT modify:

* `DevelopmentAnswerEvaluator`
* `DevelopmentDecisionEngine` production logic unless the test exposes an actual bug
* `QuestionGenerator`
* API
* frontend
* domain types

### Test

Using the existing dependency-injection pattern in `backend/test/engine.test.ts`, create a test-only evaluator that returns:

```ts
{
  evaluationId: "medium-evaluation",
  evidence: [
    {
      id: "medium-evidence",
      questionId: "<current-question-id>",
      topic: "<current-question-target-area>",
      competencies: {},
      observations: ["Test evidence."],
      missing: [],
      contradictions: [],
      confidence: "medium",
      createdAt: new Date().toISOString()
    }
  ],
  missing: [],
  contradictions: [],
  confidence: "medium",
  evaluatedAt: new Date().toISOString()
}
```

Start an interview and process an answer using this evaluator.

Verify:

1. The evaluation confidence is `medium`.
2. The evaluation contains evidence.
3. The decision is NOT `CONTINUE_INVESTIGATION`.
4. The interview advances normally.
5. The next question is generated.
6. The next question corresponds to the next stage when the decision is `ADVANCE_STAGE`.
7. The previous turn is completed with the answer, evaluation, and decision.
8. The returned turn is the new pending turn.
9. The interview remains active.
10. The state is persisted correctly.

Also explicitly verify that:

```text
medium confidence + evidence
```

does NOT get treated as:

```text
weak evidence
```

### Regression intent

This test should protect against accidentally changing the Decision Engine to something like:

```ts
if (answerEvaluation.confidence !== "high") {
    return CONTINUE_INVESTIGATION;
}
```

That would be incorrect.

The intended distinction is:

```text
low confidence OR no evidence
        → CONTINUE_INVESTIGATION

medium confidence + evidence
        → normal progression

high confidence + evidence
        → normal progression
```

Do not claim that the development evaluator has determined the technical correctness of the answer. This test is only about the contract between evaluation output and decision behavior.

Run:

```bash
npm run build
npm test
```

Do not commit anything.

Report:

* files changed
* whether production code changed
* what the regression test proves
* build result
* test result

# Prompt #019 — Integrate the Frontend with the Interview API

We now have a working backend HTTP API for the interview engine.

Before changing anything, inspect:

- `PRODUCT.md`
- `AGENTS.md`
- `INTERVIEW_ENGINE.md`
- `frontend/src/`
- `frontend/package.json`
- `backend/src/api/interview-controller.ts`
- `backend/src/app.ts`

Also inspect the existing frontend UI and determine how it currently represents:

- the candidate/interview start state
- the current question
- the candidate's answer
- loading state
- errors
- interview completion

### Goal

Connect the existing frontend UI to:

```http
POST /api/interview
```

# Prompt #020 — Configure Frontend API Proxy

The frontend interview client from Prompt #019 is implemented, but the development setup currently sends browser requests directly from the Vite origin to `http://localhost:3000`.

This creates a cross-origin development problem because:

- Vite frontend normally runs on `http://localhost:5173`
- backend runs on `http://localhost:3000`

We do NOT want to add CORS middleware to the backend for this development setup.

Instead, configure the Vite development server to proxy `/api` requests to the backend.

## First inspect

Read:

- `frontend/package.json`
- `frontend/src/App.tsx`
- `frontend/index.html`
- any existing `frontend/vite.config.*`
- `backend/src/app.ts`
- `backend/src/index.ts`

Do not modify anything until you understand the current setup.

## Goal

Configure Vite so:

Browser
  ↓
http://localhost:5173/api/interview
  ↓
Vite proxy
  ↓
http://localhost:3000/api/interview

# Prompt #021 — Design the LLM Integration Boundary

We have now completed the deterministic development pipeline:

Candidate
→ InterviewEngine
→ QuestionGenerator
→ AnswerEvaluator
→ DecisionEngine
→ next question

The HTTP API and basic frontend integration are also working.

The current implementations are intentionally deterministic development implementations:

- MockQuestionGenerator
- DevelopmentAnswerEvaluator
- DevelopmentDecisionEngine

Do NOT replace them with an LLM yet.

The goal of this task is to study the project requirements and design the correct LLM integration boundary before implementation.

## First: inspect the project

Read these files completely before making changes:

- `PRODUCT.md`
- `INTERVIEW_ENGINE.md`
- `AGENTS.md`
- `PROMPTS.md`
- `backend/src/interview/types.ts`
- `backend/src/interview/engine.ts`
- `backend/src/interview/evaluator.ts`
- `backend/src/interview/decision.ts`
- `backend/src/interview/session-store.ts`
- `backend/src/api/interview-controller.ts`
- `backend/src/app.ts`
- `backend/package.json`

Also inspect the frontend only where necessary to understand the current API contract.

Do not rely on assumptions from previous conversations if the repository contains the authoritative specification.

## Goal

Determine exactly which responsibilities should belong to:

1. deterministic backend code
2. the LLM question planner/generator
3. the LLM answer evaluator
4. the deterministic decision/policy layer
5. the InterviewEngine orchestration layer

Do not implement the LLM provider yet.

## Candidate profile → question planning

Determine what information from `Candidate` should be supplied to the question-planning model.

The first question should be capable of being personalized based on the candidate profile rather than always being:

"Describe a real system you have built..."

For example, if the candidate profile contains projects, skills, experience, or other relevant information, the planner should be able to use those details.

Do not invent candidate fields that do not exist in the current domain model or specification.

## Interview state → question planning

Determine which parts of `InterviewState` are relevant to question generation.

The planner may need information such as:

- current stage
- previous questions
- covered topics
- covered curriculum days
- evidence
- uncertainties
- investigations
- current focus
- question count
- candidate profile

But do NOT blindly send the entire state to an LLM.

Define a minimal structured planning context.

The context should allow the model to understand:

- what has already been asked
- what has already been established
- what remains uncertain
- what the current investigation is
- what stage the interview is in
- what should be explored next

## Question generator contract

Review the existing:

```ts
interface QuestionGenerator
```

# Prompt #022 — Implement the LLM Boundary Without a Real Provider

We have completed the architecture review for LLM integration.

Do NOT connect to OpenAI, Anthropic, Gemini, or any external LLM provider yet.

The goal of this task is to implement and test the internal LLM boundary using a deterministic fake provider.

## First inspect

Read:

- `backend/src/interview/types.ts`
- `backend/src/interview/engine.ts`
- `backend/src/interview/evaluator.ts`
- `backend/src/interview/decision.ts`
- `backend/test/engine.test.ts`
- `backend/test/evaluator.test.ts`
- `backend/test/decision.test.ts`
- `backend/package.json`
- `PROMPTS.md`
- `PRODUCT.md`
- `INTERVIEW_ENGINE.md`

Use the repository specification as authoritative.

Do not modify anything until the current architecture is understood.

---

# Goal

Introduce a small provider abstraction that allows the future system to use an LLM while keeping the existing deterministic implementations available for tests and fallback.

The desired architecture is:

```text
InterviewEngine
      │
      ├── QuestionGenerator
      │       ↓
      │   LLM-backed generator
      │
      ├── AnswerEvaluator
      │       ↓
      │   LLM-backed evaluator
      │
      └── DecisionEngine
              ↓
        deterministic policy

```
# Prompt #022.1 — Harden the LLM Boundary

Review the current LLM boundary implementation from Prompt #022.

Files:

- backend/src/interview/llm-provider.ts
- backend/src/interview/llm-adapters.ts
- backend/src/interview/fake-llm-provider.ts
- backend/test/llm-adapter.test.ts

Do NOT add a real LLM provider.

Do NOT install AJV or another validation library yet unless the existing repository already uses one.

The current adapters are too permissive and must be hardened.

## Question validation

`LLMQuestionGenerator` must validate the provider result rather than silently repair missing/invalid fields.

Reject the provider result when:

- object is missing
- id is missing or not a string
- text is missing or not a string
- targetArea is missing or not a string
- curriculumDays is missing, not an array, or contains invalid values
- purpose is missing or not a string
- difficulty is not one of the valid domain values
- question ID already exists in `state.askedQuestions`

Do not silently replace invalid provider values with defaults.

Do not use `as any` to bypass validation.

The generated question must not mutate interview state.

## Evaluation validation

`LLMEvaluator` must validate the provider result rather than normalize invalid values into valid-looking data.

Reject when:

- evaluationId is missing or invalid
- evidence is not an array
- confidence is not `low | medium | high`
- evaluatedAt is invalid/missing if required by the domain
- an evidence item is malformed
- evidence confidence is invalid
- evidence questionId does not exactly equal `context.question.id`

Do NOT do this:

```ts
questionId: ev.questionId ?? context.question.id