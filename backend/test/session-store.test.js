"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const session_store_1 = require("../src/interview/session-store");
const types_1 = require("../src/interview/types");
function makeBaseState(sessionId) {
    const now = new Date().toISOString();
    return {
        sessionId,
        candidate: { id: 'cand-' + sessionId },
        questionCount: 0,
        stage: types_1.InterviewStage.Establish,
        evidence: [],
        uncertainties: [],
        investigations: [],
        coveredTopics: [],
        coveredCurriculumDays: [],
        askedQuestions: [],
        messages: [],
        turns: [],
        status: "active",
        createdAt: now,
        updatedAt: now,
    };
}
function assert(cond, msg) {
    if (!cond)
        throw new Error(msg || "assertion failed");
}
// Run tests sequentially
(function run() {
    const store = new session_store_1.InMemorySessionStore();
    // create & retrieve
    const s1 = makeBaseState("s1");
    store.create(s1);
    const got = store.get("s1");
    assert(!!got, "created session should be retrievable");
    assert(got.sessionId === s1.sessionId, "sessionId should match");
    // has
    assert(store.has("s1") === true, "store.has should be true");
    assert(store.has("nope") === false, "store.has should be false for missing id");
    // update
    const updated = { ...s1, questionCount: 1, updatedAt: new Date().toISOString() };
    store.update(updated);
    const got2 = store.get("s1");
    assert(got2.questionCount === 1, "update should modify stored session");
    // delete
    const del = store.delete("s1");
    assert(del === true, "delete should return true");
    assert(store.get("s1") === undefined, "session should be removed");
    // duplicate create
    store.create(makeBaseState("dup"));
    let caught = false;
    try {
        store.create(makeBaseState("dup"));
    }
    catch (e) {
        caught = true;
    }
    assert(caught, "creating duplicate session should throw");
    // update nonexistent
    caught = false;
    try {
        store.update(makeBaseState("nonexistent"));
    }
    catch (e) {
        caught = true;
    }
    assert(caught, "updating nonexistent session should throw");
    console.log("All session-store tests passed");
})();
