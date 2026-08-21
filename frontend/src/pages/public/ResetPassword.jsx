import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { AuthLayout } from "../../components/layout/AuthLayout.jsx";
import { Input } from "../../components/common/Input.jsx";
import { Button } from "../../components/common/Button.jsx";
import { resetPasswordSchema } from "../../schemas/auth.schema.js";
import { resetPasswordRequest } from "../../api/auth.api.js";

export const ResetPassword = () => {
  const [params] = useSearchParams();
  const token = params.get("token");
  const navigate = useNavigate();
  const [serverError, setServerError] = useState(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm({ resolver: zodResolver(resetPasswordSchema) });

  const onSubmit = async (values) => {
    setServerError(null);
    try {
      await resetPasswordRequest({ token, password: values.password });
      navigate("/login", { replace: true });
    } catch (err) {
      setServerError(err.response?.data?.message || "Something went wrong");
    }
  };

  if (!token) {
    return (
      <AuthLayout title="Invalid link">
        <p className="text-sm text-ink/60">
          This reset link is missing its token.{" "}
          <Link to="/forgot-password" className="font-medium text-brand-600 hover:underline">
            Request a new one
          </Link>
          .
        </p>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout title="Choose a new password">
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <Input label="New password" type="password" error={errors.password?.message} {...register("password")} />
        <Input label="Confirm password" type="password" error={errors.confirmPassword?.message} {...register("confirmPassword")} />
        {serverError && <p className="text-sm text-red-500">{serverError}</p>}
        <Button type="submit" loading={isSubmitting} className="w-full">
          Reset password
        </Button>
      </form>
    </AuthLayout>
  );
};
