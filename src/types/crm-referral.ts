export type CrmReferralPerson = {
  id: number;
  telegramUserId: number;
  username: string | null;
};

export type CrmReferralStats = {
  friendsJoined: number;
  creditsEarned: number;
  monthsGifted: number;
};

// Реферальный блок карточки пользователя; список приглашённых грузится отдельно.
export type CrmUserReferral = {
  code: string | null;
  referredBy: (CrmReferralPerson & { joinedAt: string }) | null;
  stats: CrmReferralStats;
};

// Награды null, пока не выданы. subscriptionRewardMonths = 0 при заполненной дате —
// у пригласившей бессрочный доступ, месяц не начисляли.
export type CrmReferralFriend = CrmReferralPerson & {
  joinedAt: string;
  firstAnalysisRewardedAt: string | null;
  firstAnalysisRewardCredits: number | null;
  subscriptionRewardedAt: string | null;
  subscriptionRewardMonths: number | null;
  // Подруга оплатила подписку, а награда не выдана — можно выдать вручную.
  subscriptionRewardMissing: boolean;
  // Разбор подруги доставлен, а разборы пригласившей не начислены — можно выдать вручную.
  firstAnalysisRewardMissing: boolean;
};

export type CrmFirstAnalysisRewardResult = {
  credits: number;
};

export type CrmSubscriptionRewardResult = {
  months: number;
  paidUntil: string | null;
};
