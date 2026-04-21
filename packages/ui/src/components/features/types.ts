export type CompetencyId = "c1" | "c2" | "c3" | "c4" | "c5";

export type CompetencyScores = Record<CompetencyId, number>;
export type CompetencyComments = Record<CompetencyId, string>;

export interface EssayCompetenciesProps {
  scores: CompetencyScores;
  comments: CompetencyComments;
}