export type CrmIngredientStatus = "new" | "added" | "ignored";

export type CrmIngredient = {
  name: string;
  suggestedInci: string | null;
  status: CrmIngredientStatus;
};
