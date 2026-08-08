# Interview Engine Specification

## 1. Purpose

The Interview Engine conducts an adaptive technical interview.

The goal is not to determine whether a candidate can recall curriculum definitions.

The goal is to gather enough evidence to determine whether the candidate can:

* understand technical concepts
* apply those concepts
* build systems using them
* diagnose failures
* reason about edge cases
* make engineering trade-offs
* optimize systems
* operate systems in production
* combine multiple concepts into a coherent solution

The curriculum defines the candidate's knowledge domain. It does **not** define a fixed sequence of questions.

The engine should maximize useful evidence while minimizing redundant questions.

---

## 2. Core Principle

After every candidate response, the engine should ask:

> **What is the most valuable thing we can learn about this candidate next?**

The engine should therefore continuously:

1. evaluate the candidate's response
2. record evidence
3. identify uncertainty
4. identify possible weaknesses or contradictions
5. determine what should be investigated next
6. generate an appropriate question
7. continue until sufficient evidence has been collected

The candidate should experience a natural conversation rather than a visible assessment algorithm.

---

## 3. Interview Structure

The interview has eight evidence objectives:

1. **Establish**
2. **Build**
3. **Extend**
4. **Break**
5. **Disambiguate**
6. **Optimize**
7. **Operate**
8. **Synthesize**

These are not eight fixed questions.

They represent the types of evidence the engine should attempt to collect.

The actual questions, topics, and order may change depending on the candidate's profile and previous answers.

### Establish

Determine the candidate's actual level rather than trusting their profile alone.

### Build

Determine whether the candidate can turn knowledge into an implementation or working system.

### Extend

Introduce a changed requirement or constraint and determine whether the candidate can adapt their solution.

### Break

Introduce a realistic failure and evaluate the candidate's debugging and diagnostic reasoning.

### Disambiguate

When a weakness is observed, determine what caused it.

For example, a poor answer to a RAG debugging question could indicate:

* weak RAG knowledge
* weak general debugging ability
* misunderstanding of the scenario
* inability to communicate the reasoning

The engine should test these possibilities rather than immediately labeling the candidate as weak.

### Optimize

Evaluate reasoning about:

* latency
* cost
* scalability
* resource usage
* performance
* quality/performance trade-offs

### Operate

Evaluate production thinking, including where relevant:

* reliability
* monitoring
* deployment
* security
* access control
* failure handling
* observability

### Synthesize

Give the candidate an opportunity to combine multiple concepts into a realistic engineering problem.

---

## 4. Candidate Model

The engine receives the supplied candidate profile before the interview.

The candidate profile is a **signal**, not a verdict.

Completed missions, skipped missions, failed attempts, and learning history can influence which areas are worth exploring, but interview evidence takes precedence over assumptions based on the profile.

The engine must never conclude:

> "The candidate completed this mission, therefore they are strong at this topic."

Instead:

> "The candidate completed this mission, therefore this topic is available for deeper evaluation."

---

## 5. Interview State

Each interview session maintains its own state.

Conceptually:

```ts
interface InterviewState {
  sessionId: string;
  candidate: Candidate;

  questionCount: number;
  stage: InterviewStage;

  evidence: Evidence[];
  uncertainties: Uncertainty[];

  coveredTopics: string[];
  coveredCurriculumDays: number[];

  askedQuestions: string[];

  currentFocus?: Investigation;

  messages: Message[];

  status: "active" | "completed";
}
```

The exact TypeScript representation may change during implementation, but the engine must preserve these concepts.

---

## 6. Evidence

Evidence represents what the candidate has demonstrated through an answer.

An answer can provide evidence about multiple competencies.

```ts
interface Evidence {
  questionId: string;
  topic: string;

  competencies: {
    conceptual?: EvidenceLevel;
    implementation?: EvidenceLevel;
    systemDesign?: EvidenceLevel;
    debugging?: EvidenceLevel;
    edgeCases?: EvidenceLevel;
    tradeoffs?: EvidenceLevel;
    optimization?: EvidenceLevel;
    production?: EvidenceLevel;
    security?: EvidenceLevel;
  };

  observations: string[];
  missing: string[];
  contradictions: string[];

  confidence: "low" | "medium" | "high";
}
```

Evidence levels:

```ts
type EvidenceLevel =
  | "strong"
  | "moderate"
  | "weak"
  | "none";
```

The system should avoid pretending that a single answer gives precise numerical knowledge of a candidate.

Evidence should accumulate over multiple answers.

---

## 7. Uncertainty

An uncertainty represents something the engine does not yet know sufficiently well.

```ts
interface Uncertainty {
  area: string;
  reason: string;
  priority: "low" | "medium" | "high";
}
```

Example:

```text
Area:
debugging

Reason:
Candidate struggled with a RAG failure scenario, but it is unclear
whether the weakness comes from RAG knowledge or general debugging.

Priority:
high
```

An uncertainty should normally lead to an investigation rather than an immediate negative judgment.

---

## 8. Investigation

An investigation represents a question the engine wants to answer about the candidate.

```ts
interface Investigation {
  objective: string;
  hypothesis: string;
  targetArea: string;
}
```

Example:

```text
Objective:
Determine whether the candidate has a general debugging weakness.

Hypothesis:
The candidate may understand individual AI concepts but lack a
systematic debugging methodology.

Target area:
debugging
```

The question generator uses the investigation to produce a natural question.

---

## 9. Adaptive Question Selection

The engine must not simply select:

```text
next curriculum day → next question
```

Instead, it should consider:

1. unresolved investigations
2. important uncertainties
3. competency coverage
4. curriculum coverage
5. previous questions
6. candidate profile
7. current interview stage
8. remaining question budget

The preferred question is the one that provides the most useful new evidence.

---

## 10. Diagnostic Reasoning

When a candidate performs poorly, the engine should consider multiple explanations.

Example:

```text
Observed:
Candidate struggled to diagnose a RAG failure.

Possible explanations:
A. Weak RAG knowledge
B. Weak debugging ability
C. Misunderstood the scenario
D. Weak reasoning under uncertainty
```

The engine should generate a follow-up or related question capable of distinguishing between these possibilities.

For example, instead of immediately asking another RAG question, it could present an unrelated production debugging scenario.

If the candidate performs well there, the engine gains evidence that the original weakness may have been topic-specific.

If they struggle again, confidence in a general debugging weakness increases.

---

## 11. Related Topic Principle

Adaptive questions should be connected enough to feel like a coherent interview.

The engine should avoid abrupt jumps such as:

```text
RAG → MCP → embeddings → Docker → security
```

unless there is a meaningful reason.

A transition should preferably preserve one of:

* the engineering problem
* the competency being investigated
* the system being discussed
* the underlying reasoning skill

Example:

```text
RAG failure
    ↓
general debugging
    ↓
performance failure
    ↓
production reliability
```

This allows the interview to explore different topics without feeling random.

---

## 12. Question Generator

The question generator converts an engine decision into a natural question.

It should receive:

```ts
interface QuestionContext {
  candidate: Candidate;
  state: InterviewState;
  decision: Decision;
  relevantCurriculum: CurriculumDay[];
}
```

It should produce:

```ts
interface GeneratedQuestion {
  id: string;
  text: string;

  targetArea: string;
  curriculumDays: number[];

  purpose: string;
}
```

`purpose` is internal and must not be shown to the candidate.

The generator must consider the previous conversation so that questions feel connected.

---

## 13. Question Quality Rules

A generated question should:

* have a clear evaluation purpose
* be answerable using the candidate's background
* provide new evidence
* avoid unnecessary repetition
* fit naturally into the conversation
* avoid revealing the interview strategy
* preferably test reasoning rather than memorization
* be appropriately difficult for the candidate
* remain grounded in the curriculum when curriculum knowledge is required

Questions should generally prefer realistic engineering situations over definition-only questions.

### Weak

> What is RAG?

### Better

> Your RAG application retrieves relevant documents but still produces
> incorrect answers. How would you investigate the problem?

The second question can reveal knowledge, implementation thinking, debugging ability, and evaluation methodology simultaneously.

---

## 14. Answer Evaluator

The evaluator determines what the candidate's answer actually demonstrates.

It must not simply assign a total score.

Conceptually:

```ts
interface AnswerEvaluation {
  evidence: Evidence[];
  missing: string[];
  contradictions: string[];
  confidence: "low" | "medium" | "high";
}
```

The evaluator should distinguish between:

> "This answer demonstrates weak evidence of debugging ability."

and:

> "This candidate is bad at debugging."

The former is acceptable.

The latter requires additional evidence.

---

## 15. Candidate Model Updates

After every answer:

```text
Candidate Answer
      ↓
Answer Evaluation
      ↓
Evidence
      ↓
Update existing evidence
      ↓
Update uncertainties
      ↓
Resolve or create investigations
```

New evidence should not automatically erase previous evidence.

For example:

```text
Question 4:
RAG debugging → weak evidence

Question 5:
General debugging → strong evidence

Final interpretation:
General debugging appears strong,
while RAG-specific troubleshooting remains uncertain.
```

This is more accurate than simply replacing the first result.

---

## 16. Decision Engine

The Decision Engine determines what should happen next.

```ts
type Decision =
  | {
      action: "CONTINUE_INVESTIGATION";
      investigation: Investigation;
    }
  | {
      action: "NEW_INVESTIGATION";
      investigation: Investigation;
    }
  | {
      action: "ADVANCE_STAGE";
      stage: InterviewStage;
    }
  | {
      action: "FINISH";
    };
```

The Decision Engine should consider:

* evidence already collected
* unresolved uncertainty
* contradictions
* curriculum coverage
* competency coverage
* question count
* previous questions
* candidate performance
* current stage

---

## 17. Hard Rules vs AI Judgment

The LLM should provide judgment.

The application should enforce hard constraints.

### Application-owned rules

```text
Minimum questions = 8

Minimum curriculum days = 4

Maximum questions = 12

No duplicate questions

Interview must maintain sessionId

Invalid model output must not corrupt session state
```

### AI-owned decisions

```text
Which area is worth investigating?

Is a weakness worth probing?

Should difficulty increase?

Is a candidate answer sufficient?

Which topic provides useful new evidence?

What question naturally tests the objective?
```

This separation is intentional.

The LLM should not be trusted to enforce deterministic submission requirements.

---

## 18. Interview Budget

The target interview length is approximately 8–10 questions.

The engine must:

* never finish before 8 questions
* never finish before covering at least 4 curriculum days
* preferably finish around 8–10 questions when sufficient evidence exists
* force completion at 12 questions

Follow-up questions count toward the question count.

The engine should prefer diagnostic depth over unnecessary breadth when the evidence is particularly valuable.

---

## 19. Coverage

The interview must cover at least four curriculum days.

However, curriculum coverage should not become a checklist.

Bad behavior:

```text
Day 7 → question
Day 8 → question
Day 9 → question
Day 10 → question
```

Preferred behavior:

```text
Choose a meaningful engineering problem
        ↓
Use relevant curriculum concepts
        ↓
Explore the candidate's reasoning
        ↓
Move to another area when additional evidence
from the current area has diminishing value
```

The engine should track curriculum coverage internally so the hard requirement is always satisfied.

---

## 20. Difficulty Adaptation

Difficulty should adapt to demonstrated ability.

### Strong performance

The engine may:

* increase complexity
* introduce additional constraints
* introduce failures
* require trade-off reasoning
* move toward production scenarios

### Weak performance

The engine may:

* simplify the scenario
* isolate one concept
* ask a related diagnostic question
* test the same competency in another context

The engine should not punish a candidate for one weak answer.

---

## 21. Contradictions

The engine should detect contradictions between:

* candidate profile and interview evidence
* earlier and later answers
* claimed understanding and demonstrated reasoning

A contradiction should trigger investigation rather than automatic judgment.

Example:

```text
Profile:
MCP completed successfully.

Interview:
Candidate cannot explain basic MCP tool interaction.

Action:
Generate another MCP-related scenario from a different angle.
```

The objective is to determine whether the contradiction is genuine.

---

## 22. Completion

The engine may finish when:

```text
questionCount >= 8
AND
coveredCurriculumDays >= 4
AND
sufficient evidence has been collected
AND
important unresolved uncertainties have been investigated
```

At 12 questions, the interview must finish.

The engine should not continue indefinitely simply because some uncertainty remains.

Perfect knowledge of a candidate is impossible within the interview budget.

The goal is **sufficiently useful evidence**.

---

## 23. Feedback

After completion, the Feedback Generator receives the structured evidence rather than relying entirely on the raw conversation.

The final response must conform to the required API format:

```json
{
  "summary": "...",
  "strengths": [],
  "gaps": [],
  "next": []
}
```

Feedback must be:

* evidence-based
* concise
* actionable
* specific to the candidate
* derived from demonstrated behavior

Avoid generic feedback such as:

> "Keep learning AI and practice more."

Prefer:

> "You demonstrated strong system-design reasoning, but your debugging approach relied on changing configuration before establishing which component was failing. Practice isolating retrieval, generation, and latency failures independently."

---

## 24. Overall Architecture

The engine follows this conceptual loop:

```text
Candidate
    ↓
Question
    ↓
Answer
    ↓
Answer Evaluator
    ↓
Evidence
    ↓
Uncertainty / Contradiction
    ↓
Decision Engine
    ↓
Investigation
    ↓
Question Generator
    ↓
Next Question
    ↓
...
    ↓
Completion
    ↓
Feedback Generator
    ↓
Final Feedback
```

The main orchestrator is responsible for controlling this lifecycle.

Conceptually:

```ts
class InterviewEngine {
  start(candidate: Candidate): Promise<InterviewTurn>;

  processAnswer(
    session: InterviewSession,
    answer: string
  ): Promise<InterviewTurn>;
}
```

---

## 25. Component Responsibilities

### Interview Engine

Owns the interview lifecycle and state transitions.

### Answer Evaluator

Determines what an answer demonstrates.

### Decision Engine

Determines what evidence should be collected next.

### Question Generator

Turns the investigation objective into a natural question.

### Feedback Generator

Converts accumulated evidence into final candidate feedback.

### Session Store

Maintains interview state by `sessionId`.

No component should take responsibility for another component's primary role.

---

## 26. Design Goal

The finished system should not feel like:

> "An LLM asking eight technical questions."

It should feel like:

> **"An experienced technical interviewer who listens to the candidate, notices weaknesses, tests them from different angles, increases difficulty when appropriate, and produces evidence-based feedback."**

The candidate should never need to understand the internal evaluation strategy.

The interview should feel natural even though the engine is systematically collecting evidence underneath.

---

## 27. Non-Goals

The first version should not attempt to implement:

* long-term candidate memory
* user accounts
* complex multi-agent orchestration
* vector databases
* RAG for the interviewer itself
* numerical psychological/personality scoring
* automated hiring decisions
* unnecessarily complex infrastructure

The engine should prioritize **reliable adaptive interviewing** over architectural complexity.

---

## 28. Implementation Principle

Build the deterministic engine first.

Then integrate the LLM components.

Do not allow the LLM to directly control session state or bypass interview constraints.

All model outputs should be structured, validated, and converted into safe internal types before modifying the session.

---

## 29. Success Criteria

The engine is successful if:

1. It conducts a coherent interview across multiple curriculum areas.
2. It asks at least 8 questions.
3. It covers at least 4 curriculum days.
4. Questions adapt to candidate answers.
5. Weak answers can trigger diagnostic investigation.
6. Strong answers can increase difficulty.
7. The engine can distinguish topic weakness from broader competency weakness.
8. Questions do not become predictable from the candidate profile.
9. The engine avoids unnecessary repeated questions.
10. Final feedback is grounded in interview evidence.
11. The interview feels conversational rather than like a quiz.
12. The system reliably satisfies the required `/api/interview` contract.
