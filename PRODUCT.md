# Product Definition — Adaptive Interviewer

## 1. Product

**Adaptive Interviewer** is an AI-powered technical interviewer that evaluates whether a candidate can use their knowledge to build, debug, optimize, and operate real-world AI systems.

It is not a technical quiz and it is not a fixed questionnaire.

---

## 2. Core Idea

The interviewer should behave like an experienced technical interviewer.

It should:

* listen to the candidate's answers
* identify what the answer demonstrates
* recognize uncertainty and weaknesses
* investigate weaknesses from different angles
* increase difficulty when the candidate performs strongly
* explore areas that have not yet been evaluated
* avoid wasting questions on things already established
* produce evidence-based feedback at the end

The candidate should feel that the interviewer is **responding to their answers**, rather than following a predetermined script.

---

## 3. Candidate Experience

The candidate should experience a natural technical conversation.

They should not see:

* the internal interview stages
* competency scores
* confidence levels
* weaknesses detected by the engine
* investigation hypotheses
* the next planned topic
* the curriculum coverage strategy

The candidate should only see the interviewer's questions and the final feedback.

---

## 4. Personalization

The candidate's supplied learning history should influence the interview, but must not determine it.

Profile information is used to:

* understand the candidate's background
* identify potentially useful areas to explore
* select appropriate difficulty
* provide context for the interview

The interview must independently verify the candidate's actual ability through their answers.

A completed mission is evidence of exposure, not proof of mastery.

---

## 5. Interview Philosophy

The interview should progressively determine whether the candidate can:

**Understand → Build → Adapt → Debug → Reason → Optimize → Operate → Synthesize**

The exact path is adaptive.

The same candidate should not receive a predictable sequence simply because their profile is visible.

---

## 6. Real-World Focus

Questions should favor realistic engineering situations over isolated definitions.

The interviewer should test questions such as:

* How would you build this?
* What would you change if the requirements changed?
* What would you investigate if this failed?
* How would you know which component caused the failure?
* What would you do if performance degraded?
* What trade-off would you make?
* What happens in an unexpected or adversarial situation?
* How would you operate this system in production?

---

## 7. Diagnostic Interviewing

A weak answer should not immediately become a negative judgment.

The interviewer should determine why the candidate struggled.

For example:

A candidate performs poorly on a RAG debugging scenario.

Possible explanations include:

* weak RAG knowledge
* weak general debugging ability
* misunderstanding of the scenario
* difficulty reasoning under uncertainty

The interviewer should use a related but sufficiently different question to distinguish between these possibilities.

---

## 8. Production Readiness

The product is not primarily trying to determine whether the candidate can answer textbook questions.

It is trying to gather evidence about whether the candidate could contribute to building and operating a real system.

Relevant areas may include:

* implementation
* system design
* debugging
* reliability
* performance
* scalability
* cost
* security
* deployment
* observability
* trade-offs

Not every area needs to appear as a separate question. Evidence can come from the same scenario.

---

## 9. Final Feedback

The final feedback should answer:

### What does this candidate appear to do well?

### Where did the interview reveal gaps?

### What should they work on next?

Feedback must be based on evidence gathered during the interview.

It should avoid generic statements that could apply to any candidate.

---

## 10. Product Goal

The final product should make a candidate feel:

> "This interviewer actually listened to how I reasoned."

And a judge should be able to understand:

> "This is not simply an LLM generating questions. There is an adaptive assessment engine deciding what evidence it still needs."
