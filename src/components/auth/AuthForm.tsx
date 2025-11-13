"use client";

/**
 * Reusable authentication form component
 * Supports both login and registration modes
 */

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { signIn, signUp, isValidEmail, validatePassword } from "@/lib/auth";
import { useToast } from "@/hooks/use-toast";

export type AuthMode = "login" | "register";

interface AuthFormProps {
  mode: AuthMode;
  redirectTo?: string;
}

export function AuthForm({ mode, redirectTo = "/projects" }: AuthFormProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    fullName: "",
    confirmPassword: "",
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const isRegisterMode = mode === "register";

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    // Email validation
    if (!formData.email) {
      newErrors.email = "Email is required";
    } else if (!isValidEmail(formData.email)) {
      newErrors.email = "Please enter a valid email address";
    }

    // Password validation
    if (!formData.password) {
      newErrors.password = "Password is required";
    } else if (isRegisterMode) {
      const passwordValidation = validatePassword(formData.password);
      if (!passwordValidation.isValid) {
        newErrors.password = passwordValidation.errors[0] || "";
      }
    }

    // Register-specific validations
    if (isRegisterMode) {
      if (!formData.fullName) {
        newErrors.fullName = "Full name is required";
      }

      if (!formData.confirmPassword) {
        newErrors.confirmPassword = "Please confirm your password";
      } else if (formData.password !== formData.confirmPassword) {
        newErrors.confirmPassword = "Passwords do not match";
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setIsLoading(true);
    setErrors({});

    try {
      if (isRegisterMode) {
        // Handle registration
        const result = await signUp({
          email: formData.email,
          password: formData.password,
          fullName: formData.fullName,
        });

        if (result.success) {
          toast({
            title: "Account created!",
            description: result.data?.needsEmailVerification
              ? "Please check your email to verify your account."
              : "You can now log in to your account.",
          });

          // Redirect to login if email verification is needed
          if (result.data?.needsEmailVerification) {
            router.push("/login?verified=false");
          } else {
            router.push(redirectTo as any);
          }
        } else {
          toast({
            title: "Registration failed",
            description: result.error?.message || "An error occurred during registration",
            variant: "destructive",
          });
        }
      } else {
        // Handle login
        const result = await signIn({
          email: formData.email,
          password: formData.password,
        });

        if (result.success) {
          toast({
            title: "Welcome back!",
            description: "You have successfully logged in.",
          });
          router.push(redirectTo as any);
          router.refresh();
        } else {
          toast({
            title: "Login failed",
            description: result.error?.message || "Invalid email or password",
            variant: "destructive",
          });
        }
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "An unexpected error occurred. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleChange = (field: string) => (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData((prev) => ({ ...prev, [field]: e.target.value }));
    // Clear error for this field when user starts typing
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: "" }));
    }
  };

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle>{isRegisterMode ? "Create an account" : "Welcome back"}</CardTitle>
        <CardDescription>
          {isRegisterMode
            ? "Enter your details to create your account"
            : "Enter your credentials to access your account"}
        </CardDescription>
      </CardHeader>
      <form onSubmit={handleSubmit}>
        <CardContent className="space-y-4">
          {isRegisterMode && (
            <div className="space-y-2">
              <label htmlFor="fullName" className="text-sm font-medium">
                Full Name
              </label>
              <Input
                id="fullName"
                type="text"
                placeholder="John Doe"
                value={formData.fullName}
                onChange={handleChange("fullName")}
                disabled={isLoading}
                className={errors.fullName ? "border-red-500" : ""}
              />
              {errors.fullName && <p className="text-sm text-red-500">{errors.fullName}</p>}
            </div>
          )}

          <div className="space-y-2">
            <label htmlFor="email" className="text-sm font-medium">
              Email
            </label>
            <Input
              id="email"
              type="email"
              placeholder="you@example.com"
              value={formData.email}
              onChange={handleChange("email")}
              disabled={isLoading}
              className={errors.email ? "border-red-500" : ""}
            />
            {errors.email && <p className="text-sm text-red-500">{errors.email}</p>}
          </div>

          <div className="space-y-2">
            <label htmlFor="password" className="text-sm font-medium">
              Password
            </label>
            <Input
              id="password"
              type="password"
              placeholder={isRegisterMode ? "Create a strong password" : "••••••••"}
              value={formData.password}
              onChange={handleChange("password")}
              disabled={isLoading}
              className={errors.password ? "border-red-500" : ""}
            />
            {errors.password && <p className="text-sm text-red-500">{errors.password}</p>}
          </div>

          {isRegisterMode && (
            <div className="space-y-2">
              <label htmlFor="confirmPassword" className="text-sm font-medium">
                Confirm Password
              </label>
              <Input
                id="confirmPassword"
                type="password"
                placeholder="Confirm your password"
                value={formData.confirmPassword}
                onChange={handleChange("confirmPassword")}
                disabled={isLoading}
                className={errors.confirmPassword ? "border-red-500" : ""}
              />
              {errors.confirmPassword && (
                <p className="text-sm text-red-500">{errors.confirmPassword}</p>
              )}
            </div>
          )}

          {!isRegisterMode && (
            <div className="flex justify-end">
              <Link href="/forgot-password" className="text-sm text-primary hover:underline">
                Forgot password?
              </Link>
            </div>
          )}
        </CardContent>

        <CardFooter className="flex flex-col space-y-4">
          <Button type="submit" className="w-full" disabled={isLoading}>
            {isLoading ? "Please wait..." : isRegisterMode ? "Create account" : "Sign in"}
          </Button>

          <p className="text-sm text-center text-muted-foreground">
            {isRegisterMode ? "Already have an account?" : "Don't have an account?"}{" "}
            <Link
              href={isRegisterMode ? "/login" : "/register"}
              className="text-primary hover:underline font-medium"
            >
              {isRegisterMode ? "Sign in" : "Create account"}
            </Link>
          </p>
        </CardFooter>
      </form>
    </Card>
  );
}
