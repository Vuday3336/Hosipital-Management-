import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { AuthLayout } from "../../components/layout/AuthLayout.jsx";
import { Input } from "../../components/common/Input.jsx";
import { Button } from "../../components/common/Button.jsx";
import { loginSchema } from "../../schemas/auth.schema.js";
import { useAuthActions } from "../../hooks/useAuth.js";

export const Login = () => {
  const { login } = useAuthActions();
  const navigate = useNavigate();
  const location = useLocation();
  const [serverError, setServerError] = useState(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm({ resolver: zodResolver(loginSchema) });

  const onSubmit = async (values) => {
    setServerError(null);
    try {
      const user = await login(values);
      navigate(location.state?.from?.pathname || `/${user.role}`, { replace: true });
    } catch (err) {
      setServerError(err.response?.data?.message || "Something went wrong");
    }
  };

  return (
    <AuthLayout title="Sign in" subtitle="Access your dashboard.">
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <Input label="Email" type="email" placeholder="you@example.com" error={errors.email?.message} {...register("email")} />
        <Input label="Password" type="password" placeholder="••••••••" error={errors.password?.message} {...register("password")} />
        {serverError && <p className="text-sm text-red-500">{serverError}</p>}
        <div className="flex items-center justify-end">
          <Link to="/forgot-password" className="text-sm font-medium text-brand-600 hover:underline">
            Forgot password?
          </Link>
        </div>
        <Button type="submit" loading={isSubmitting} className="w-full">
          Sign in
        </Button>
      </form>
      <p className="mt-6 text-center text-sm text-ink/50">
        New patient?{" "}
        <Link to="/register" className="font-medium text-brand-600 hover:underline">
          Create an account
        </Link>
      </p>
    </AuthLayout>
  );
};
