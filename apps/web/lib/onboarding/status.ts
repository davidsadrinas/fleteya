export type ProfileOnboardingFields = {
  phone: string | null | undefined;
  role: string;
};

/** Step 1: name + phone + role not yet saved (phone empty in DB). */
export function profileMissingBasics(profile: ProfileOnboardingFields): boolean {
  return !profile.phone?.trim();
}

/** Step 2 for drivers: profile says driver but no drivers row (e.g. failed insert). */
export function driverRowMissing(role: string, driverId: string | null | undefined): boolean {
  return role === "driver" && !driverId;
}

export function shouldRedirectToOnboarding(
  profile: ProfileOnboardingFields,
  driverId: string | null | undefined
): boolean {
  if (profileMissingBasics(profile)) return true;
  if (driverRowMissing(profile.role, driverId)) return true;
  return false;
}
