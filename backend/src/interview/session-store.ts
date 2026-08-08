import { InterviewState } from "./types";

/** Simple in-memory session store for InterviewState. */
export interface SessionStore {
  create(session: InterviewState): void;
  get(sessionId: string): InterviewState | undefined;
  update(session: InterviewState): void;
  delete(sessionId: string): boolean;
  has(sessionId: string): boolean;
}

/**
 * InMemorySessionStore stores InterviewState objects in a Map.
 * Behavior:
 * - create throws if a session with the same sessionId already exists
 * - update throws if the session does not already exist
 * - get and delete behave like typical Map operations
 *
 * The store clones stored and returned objects via JSON serialization to
 * reduce accidental external mutation of the in-memory state.
 */
export class InMemorySessionStore implements SessionStore {
  private map: Map<string, InterviewState> = new Map();

  create(session: InterviewState): void {
    if (!session?.sessionId) {
      throw new Error("session.sessionId is required");
    }
    if (this.map.has(session.sessionId)) {
      throw new Error(`session with id '${session.sessionId}' already exists`);
    }
    // clone before storing
    const copy = deepClone(session);
    this.map.set(copy.sessionId, copy);
  }

  get(sessionId: string): InterviewState | undefined {
    const found = this.map.get(sessionId);
    return found ? deepClone(found) : undefined;
  }

  update(session: InterviewState): void {
    if (!session?.sessionId) {
      throw new Error("session.sessionId is required");
    }
    if (!this.map.has(session.sessionId)) {
      throw new Error(`cannot update non-existent session '${session.sessionId}'`);
    }
    const copy = deepClone(session);
    this.map.set(copy.sessionId, copy);
  }

  delete(sessionId: string): boolean {
    return this.map.delete(sessionId);
  }

  has(sessionId: string): boolean {
    return this.map.has(sessionId);
  }
}

function deepClone<T>(v: T): T {
  return JSON.parse(JSON.stringify(v));
}
