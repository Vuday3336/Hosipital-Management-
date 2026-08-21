import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Link } from "react-router-dom";
import { AuthLayout } from "../../components/layout/AuthLayout.jsx";
import { Input } from "../../components/common/Input.jsx";
import { Button } from "../../components/common/Button.jsx";
import { forgotPasswordSchema } from "../../schemas/auth.schema.js";
import { forgotPasswordRequest } from "../../api/auth.api.js";

export const ForgotPassword = () => {
  const [sent, setSent] = useState(false);
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm({ resolver: zodResolver(forgotPasswordSchema) });

  const onSubmit = async (values) => {
    await forgotPasswordRequest(values);
    setSent(true);
  };

  return (
    <AuthLayout title="Reset your password" subtitle="We'll email you a reset link.">
      {sent ? (
        <p className="rounded-lg bg-brand-50 px-4 py-3 text-sm text-brand-700">
          If that email exists, a reset link is on its way.
        </p>
      ) : (
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <Input label="Email" type="email" placeholder="you@example.com" error={errors.email?.message} {...register("email")} />
          <Button type="submit" loading={isSubmitting} className="w-full">
            Send reset link
          </Button>
        </form>
      )}
      <p className="mt-6 text-center text-sm text-ink/50">
        <Link to="/login" className="font-medium text-brand-600 hover:underline">
          Back to sign in
        </Link>
      </p>
    </AuthLayout>
  );
};
