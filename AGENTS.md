# AGENTS.md

## Project

Adaptive Interviewer — an AI-powered technical interview agent for the ABTalks hackathon.

The product evaluates whether a candidate can use technical knowledge to build, debug, optimize, and operate real-world AI systems.

Read these files before making architectural or product decisions:

* `PRODUCT.md`
* `INTERVIEW_ENGINE.md`

These files are the source of truth for product behavior and interview-engine behavior.

---

## Core Principle

This is **not a fixed technical questionnaire**.

The interview must adapt to the candidate's answers.

The engine should maximize useful evidence about the candidate while minimizing redundant questions.

The candidate's profile is a signal, not proof of mastery.

---

## Engineering Principles

### Prefer simplicity

Do not introduce infrastructure unless it solves a real problem.

Avoid unnecessary:

* microservices
* databases
* queues
* agent frameworks
* vector databases
* authentication systems
* abstractions
* dependencies

The first implementation should be small, understandable, and reliable.

### Separate deterministic logic from LLM reasoning

Application code must control:

* session state
* question count
* curriculum coverage
* completion requirements
* duplicate detection
* validation
* error handling

The LLM may handle:

* answer evaluation
* evidence extraction
* uncertainty detection
* investigation selection
* question generation
* feedback generation

Never allow an LLM response to directly bypass deterministic application rules.

---

## Interview Engine Rules

The engine must:

* maintain state using `sessionId`
* conduct at least 8 questions
* cover at least 4 curriculum days
* finish by 12 questions
* adapt questions based on previous answers
* investigate weak or ambiguous evidence
* avoid repetitive questions
* increase difficulty when appropriate
* explore unknown areas
* distinguish topic weakness from broader competency weakness
* produce evidence-based final feedback

Refer to `INTERVIEW_ENGINE.md` for the complete specification.

---

## API Contract

The required endpoint is:

```http
POST /api/interview
```

The API must support:

### Starting an interview

```json
{
  "sessionId": "abc-123",
  "candidate": {}
}
```

### Continuing an interview

```json
{
  "sessionId": "abc-123",
  "message": "Candidate response"
}
```

### Completing an interview

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

Do not change the required external API contract without explicit approval.

---

## Code Organization

Keep responsibilities separated.

Suggested structure:

```text
src/
├── interview/
│   ├── engine
│   ├── evaluator
│   ├── decision
│   ├── question
│   ├── feedback
│   └── types
├── sessions/
├── api/
└── data/
```

The exact file structure may change if there is a good reason.

Do not create abstractions simply to match this example.

---

## LLM Integration

Keep the LLM provider replaceable.

Do not tightly couple the interview engine to one provider.

Prefer an interface such as:

```ts
interface LLMProvider {
  generate(...): Promise<...>;
}
```

The implementation should allow the model provider to be changed without rewriting the interview engine.

All structured LLM responses must be validated before being used.

Handle:

* malformed model output
* API failures
* timeouts
* rate limits
* missing environment variables
* unexpected responses

without corrupting interview state.

---

## State Safety

Interview state must only be updated after successful validation of the relevant operation.

A failed LLM request must not:

* increment the question count incorrectly
* mark an unanswered question as answered
* complete the interview
* destroy previous evidence
* corrupt the conversation history

---

## Testing

Every important deterministic rule should have tests.

At minimum test:

* new session
* continuation of an existing session
* unknown session
* minimum 8 questions
* minimum 4 curriculum days
* maximum 12 questions
* completion behavior
* duplicate-question prevention
* malformed LLM output
* LLM failure
* state preservation after failure

Test the interview engine independently from the HTTP layer where practical.

---

## Development Workflow

Before implementing a significant feature:

1. Read `PRODUCT.md`.
2. Read `INTERVIEW_ENGINE.md`.
3. Inspect the existing implementation.
4. Make the smallest change that satisfies the requirement.
5. Run relevant tests.
6. Fix regressions.
7. Update documentation when behavior changes.

Do not rewrite working code unnecessarily.

Do not change product behavior merely because a different implementation seems cleaner.

---

## Git Discipline

Make focused commits.

Preferred format:

```text
feat: ...
fix: ...
refactor: ...
test: ...
docs: ...
chore: ...
```

Do not make large unrelated commits.

Each commit should represent a meaningful piece of work that can be understood from the commit message.

Before committing:

* run tests
* verify the application still starts
* inspect the changed files
* avoid committing secrets

Never commit:

```text
.env
API keys
API tokens
private credentials
```

---

## Prompt Logging

Every meaningful prompt used to design, implement, debug, or improve the project must be recorded in:

```text
PROMPTS.md
```

Do not delete prompts simply because the resulting implementation was changed later.

The prompt history should accurately show how AI was used during development.

---

## Working With the Human

The human contributor is the project owner and final decision-maker.

When requirements are ambiguous:

* identify the ambiguity
* explain the relevant trade-off briefly
* ask before making a product-level change

Do not silently change the interview philosophy.

For implementation details, use reasonable engineering judgment without unnecessary questions.

---

## Do Not Over-Engineer

This is a hackathon project.

Prioritize:

1. working product
2. adaptive interview quality
3. reliable API
4. polished candidate experience
5. clear architecture
6. tests
7. deployment

Do not sacrifice the working product for architectural complexity.

---

## Definition of Done

A feature is not complete merely because the code compiles.

Before considering a feature complete:

* implementation works
* relevant tests pass
* API behavior is correct
* errors are handled
* state remains consistent
* documentation is updated when necessary
* no secrets are committed
