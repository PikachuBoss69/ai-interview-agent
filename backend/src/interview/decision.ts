import { AnswerEvaluation, Candidate, Decision, GeneratedQuestion, InterviewStage, InterviewState, Investigation } from "./types";

export interface DecisionContext {
  candidate: Candidate;
  state: InterviewState;
  question: GeneratedQuestion;
  answerEvaluation: AnswerEvaluation;
}

export interface DecisionEngine {
  decide(context: DecisionContext): Promise<Decision>;
}

export class DevelopmentDecisionEngine implements DecisionEngine {
  async decide(context: DecisionContext): Promise<Decision> {
    const { state, answerEvaluation, question } = context;

    if (state.questionCount >= 12) {
      return { action: "FINISH" };
    }

    if (state.questionCount < 8) {
      if (state.coveredCurriculumDays.length < 4) {
        return this.continueInvestigation(question.targetArea, state.questionCount);
      }
      if (answerEvaluation.confidence === "low" || answerEvaluation.evidence.length === 0) {
        return this.continueInvestigation(question.targetArea, state.questionCount);
      }
      return this.newInvestigation(question.targetArea, state.questionCount);
    }

    if (state.coveredCurriculumDays.length < 4) {
      return this.continueInvestigation(question.targetArea, state.questionCount);
    }

    if (answerEvaluation.confidence === "low" || answerEvaluation.evidence.length === 0) {
      return this.continueInvestigation(question.targetArea, state.questionCount);
    }

    return {
      action: "ADVANCE_STAGE",
      stage: this.nextStage(state.stage),
    };
  }

  private continueInvestigation(targetArea: string, questionCount: number): Decision {
    const investigation: Investigation = {
      id: `investigation-${questionCount + 1}`,
      objective: "Collect more evidence about the candidate's technical reasoning.",
      hypothesis: "Current evidence is insufficient to determine depth.",
      targetArea,
      priority: "medium",
      createdAt: new Date().toISOString(),
    };
    return {
      action: "CONTINUE_INVESTIGATION",
      investigation,
    };
  }

  private newInvestigation(targetArea: string, questionCount: number): Decision {
    const investigation: Investigation = {
      id: `investigation-${questionCount + 2}`,
      objective: "Explore a new angle of the same topic.",
      hypothesis: "A broader investigation may provide additional evidence.",
      targetArea,
      priority: "low",
      createdAt: new Date().toISOString(),
    };
    return {
      action: "NEW_INVESTIGATION",
      investigation,
    };
  }

  private nextStage(stage: InterviewStage): InterviewStage {
    const stages = [
      InterviewStage.Establish,
      InterviewStage.Build,
      InterviewStage.Extend,
      InterviewStage.Break,
      InterviewStage.Disambiguate,
      InterviewStage.Optimize,
      InterviewStage.Operate,
      InterviewStage.Synthesize,
    ];

    const idx = stages.indexOf(stage);
    if (idx === -1 || idx === stages.length - 1) {
      return InterviewStage.Synthesize;
    }
    return stages[idx + 1];
  }
}
