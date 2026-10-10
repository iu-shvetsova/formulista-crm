export type CrmAnalysisStatus =
  | "processing"
  | "delivering"
  | "success"
  | "invalid_composition"
  | "no_composition_found"
  | "error";

export type CrmAnalysis = {
  id: number;
  inputType: string;
  inputText: string | null;
  photoCount: number;
  profileSnapshot: {
    scalpType: string | null;
    dandruff: boolean | null;
    hairType: string | null;
    damageLevel: string | null;
  } | null;
  status: CrmAnalysisStatus;
  error: string | null;
  report: string | null;
  creditType: string | null;
  createdAt: string;
  updatedAt: string;
};
