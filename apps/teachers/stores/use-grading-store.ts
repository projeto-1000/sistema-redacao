import { create } from "zustand";

// Definindo a interface do Highlight
interface Highlight {
  id: string;
  text: string;
  compId: string;
}

interface GradingState {
  scores: Record<string, number | null>;
  comments: Record<string, string>;
  generalComment: string;

  // Novo estado para os destaques
  highlights: Highlight[];

  activeHighlightComp: string | null;
  setActiveHighlightComp: (id: string | null) => void;

  // Funções para gerenciar destaques
  addHighlight: (highlight: Highlight) => void;
  removeHighlight: (id: string) => void;

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
  highlights: [], // Inicializa como array vazio
  activeHighlightComp: null,
};

export const useGradingStore = create<GradingState>((set, get) => ({
  ...initialState,

  // Gerenciamento de Destaques
  addHighlight: (highlight) =>
    set((state) => ({
      highlights: [...state.highlights, highlight],
    })),

  removeHighlight: (id) =>
    set((state) => ({
      highlights: state.highlights.filter((h) => h.id !== id),
    })),

  // Setters básicos
  setScore: (compId, score) =>
    set((state) => ({
      scores: { ...state.scores, [compId.toLowerCase()]: score },
    })),

  setComment: (compId, comment) =>
    set((state) => ({
      comments: { ...state.comments, [compId.toLowerCase()]: comment },
    })),

  setGeneralComment: (comment) => set({ generalComment: comment }),

  setActiveHighlightComp: (id) => set({ activeHighlightComp: id }),

  reset: () => set(initialState),

  getTotalScore: () => {
    const { scores } = get();
    return Object.values(scores).reduce((total: number, score) => total + (score || 0), 0);
  },

  canSave: () => {
    const { scores, comments, generalComment } = get();

    // Validação: Todas as notas devem estar preenchidas
    const allScoresGiven = Object.values(scores).every((score) => score !== null);

    // Validação: Todos os comentários por competência devem ter tamanho mínimo
    const allCommentsGiven = Object.values(comments).every((comment) => comment.trim().length >= 5);

    // Validação: Comentário geral obrigatório
    const hasGeneralComment = generalComment.trim().length >= 10;

    return allScoresGiven && allCommentsGiven && hasGeneralComment;
  },
}));
