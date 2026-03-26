import { AuthSync } from "@/components/auth-sync";

export default function OnboardingLayout({ children }: { children: React.ReactNode }) {
  return <AuthSync>{children}</AuthSync>;
}
