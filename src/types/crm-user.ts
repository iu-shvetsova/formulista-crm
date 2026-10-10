export type CrmProfileStatus = "complete" | "in_progress" | "not_started";
export type CrmSubscriptionStatus = "active" | "expired" | "none";

export type CrmUserListItem = {
  id: number;
  telegramUserId: number;
  username: string | null;
  profileStatus: CrmProfileStatus;
  subscriptionStatus: CrmSubscriptionStatus;
  lifetimeAccess: boolean;
  paidUntil: string | null;
  freeAnalysisCredits: number;
  subscriptionAnalysisCredits: number;
};

export type CrmUserPayment = {
  id: number;
  provider: string;
  currency: string;
  amount: number;
  status: string;
  planId: string | null;
  telegramPaymentChargeId: string | null;
  providerPaymentChargeId: string | null;
  paidAt: string | null;
  createdAt: string;
};

export type CrmUserDetails = CrmUserListItem & {
  firstName: string | null;
  lastName: string | null;
  profile: {
    scalpType: string | null;
    dandruff: boolean | null;
    hairType: string | null;
    damageLevel: string | null;
    completedAt: string | null;
  } | null;
  subscriptionCreditsResetAt: string | null;
  totalAnalysisCredits: number;
  payments: CrmUserPayment[];
  createdAt: string;
  updatedAt: string;
};

export const profileStatusLabels: Record<CrmProfileStatus, string> = {
  complete: "Complete",
  in_progress: "In progress",
  not_started: "Not started",
};

export const subscriptionStatusLabels: Record<CrmSubscriptionStatus, string> = {
  active: "Active",
  expired: "Expired",
  none: "None",
};
