import { User } from './authStore';

export function requiresIdentityVerification(user: User | null) {
  if (!user) return false;
  if (user.onboarding_state && user.onboarding_state !== 'active') return false;
  return user.role !== 'admin';
}

export function getVerificationRoute(user: User | null) {
  if (!user) return '/(auth)/welcome';
  if (user.onboarding_state && user.onboarding_state !== 'active') return '/(auth)/pending-access';
  if (!requiresIdentityVerification(user)) return '/(app)/home';
  if (user.verification_status === 'verified') return '/(app)/home';

  if (!user.has_dni_front || !user.has_dni_back) {
    return '/(auth)/verify-doc';
  }

  if (!user.phone_verified_at) {
    return '/(auth)/verify-otp';
  }

  if (!user.has_selfie) {
    return '/(auth)/verify-selfie';
  }

  return '/(auth)/verify-selfie';
}
