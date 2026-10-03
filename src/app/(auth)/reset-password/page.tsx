import { ResetPasswordForm } from "@/app/(auth)/reset-password/reset-form";

export default function ResetPasswordPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-[radial-gradient(ellipse_at_top,_#efe6d8_0%,_#faf7f2_45%,_#f5efe6_100%)] p-4">
      <ResetPasswordForm />
    </div>
  );
}
