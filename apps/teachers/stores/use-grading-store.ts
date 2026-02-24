import { create } from "zustand";

interface GradingState {
  scores: Record<string, number | null>;
  comments: Record<string, string>;
  generalComment: string;

  setScore: (compId: string, score: number) => void;
  setComment: (compId: string, comment: string) => void;
  setGeneralComment: (comment: string) => void;
  reset: () => void;

  getTotalScore: () => number;
  canSave: () => boolean;
}

const initialState = {
  scores: { c1: null, c2: null, c3: null, c4: null, c5: null },
  comments: { c1: "", c2: "", c3: "", c4: "", c5: "" },
  generalComment: "",
};

export const useGradingStore = create<GradingState>((set, get) => ({
  ...initialState,

  setScore: (compId, score) => set((state) => ({ scores: { ...state.scores, [compId]: score } })),

  setComment: (compId, comment) =>
    set((state) => ({ comments: { ...state.comments, [compId]: comment } })),

  setGeneralComment: (comment) => set({ generalComment: comment }),

  reset: () => set(initialState),

  getTotalScore: () => {
    const { scores } = get();
    return Object.values(scores).reduce((total: number, score) => total + (score || 0), 0);
  },

  canSave: () => {
    const { scores, comments, generalComment } = get();

    const allScoresGiven = Object.values(scores).every((score) => score !== null);

    const allCommentsGiven = Object.values(comments).every((comment) => comment.trim().length >= 5);

    const hasGeneralComment = generalComment.trim().length >= 10;

    return allScoresGiven && allCommentsGiven && hasGeneralComment;
  },
}));
