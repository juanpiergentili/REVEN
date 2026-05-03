export const TRIAL_MAX_LISTINGS = 5;

export function isTrialUser(profile: Record<string, any> | null | undefined): boolean {
  return profile?.discountCode === 'REVENFREE60';
}

export function isTrialExpired(profile: Record<string, any> | null | undefined): boolean {
  if (!isTrialUser(profile) || !profile?.trialEndDate) return false;
  const end: Date = profile.trialEndDate?.toDate?.() ?? new Date(profile.trialEndDate);
  return end < new Date();
}

export function getTrialDaysRemaining(profile: Record<string, any> | null | undefined): number {
  if (!isTrialUser(profile) || !profile?.trialEndDate) return 0;
  const end: Date = profile.trialEndDate?.toDate?.() ?? new Date(profile.trialEndDate);
  return Math.max(0, Math.ceil((end.getTime() - Date.now()) / 86_400_000));
}

export function getTrialEndDate(profile: Record<string, any> | null | undefined): Date | null {
  if (!profile?.trialEndDate) return null;
  return profile.trialEndDate?.toDate?.() ?? new Date(profile.trialEndDate);
}
