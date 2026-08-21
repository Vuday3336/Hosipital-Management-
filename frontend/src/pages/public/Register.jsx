import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Link, useNavigate } from "react-router-dom";
import { AuthLayout } from "../../components/layout/AuthLayout.jsx";
import { Input } from "../../components/common/Input.jsx";
import { Button } from "../../components/common/Button.jsx";
import { registerSchema } from "../../schemas/auth.schema.js";
import { useAuthActions } from "../../hooks/useAuth.js";

export const Register = () => {
  const { register: doRegister } = useAuthActions();
  const navigate = useNavigate();
  const [serverError, setServerError] = useState(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm({ resolver: zodResolver(registerSchema) });

  const onSubmit = async (values) => {
    setServerError(null);
    try {
      const user = await doRegister(values);
      navigate(`/${user.role}`, { replace: true });
    } catch (err) {
      setServerError(err.response?.data?.message || "Something went wrong");
    }
  };

  return (
    <AuthLayout title="Create a patient account" subtitle="Staff accounts are provisioned by an admin.">
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <Input label="Full name" placeholder="Jane Doe" error={errors.name?.message} {...register("name")} />
        <Input label="Email" type="email" placeholder="you@example.com" error={errors.email?.message} {...register("email")} />
        <Input label="Phone (optional)" placeholder="+1 555 0100" error={errors.phone?.message} {...register("phone")} />
        <Input label="Password" type="password" placeholder="At least 8 characters" error={errors.password?.message} {...register("password")} />
        {serverError && <p className="text-sm text-red-500">{serverError}</p>}
        <Button type="submit" loading={isSubmitting} className="w-full">
          Create account
        </Button>
      </form>
      <p className="mt-6 text-center text-sm text-ink/50">
        Already have an account?{" "}
        <Link to="/login" className="font-medium text-brand-600 hover:underline">
          Sign in
        </Link>
      </p>
    </AuthLayout>
  );
};
