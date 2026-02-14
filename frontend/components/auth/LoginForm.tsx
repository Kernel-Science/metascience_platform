"use client";

import { useState, useEffect } from "react";
import { EyeIcon, EyeSlashIcon } from "@heroicons/react/24/outline";

import { Button } from "@heroui/button";
import { Input } from "@heroui/input";
import { Card } from "@heroui/card";

import { useAuth } from "@/lib/auth/context";
import { useRouter, useSearchParams } from "next/navigation";

export default function LoginForm() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLogin, setIsLogin] = useState(true);
  const [isVisible, setIsVisible] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const { signIn, signUp, signInWithGoogle, resetPassword } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const next = searchParams.get("next") || "/research?tab=search";

  useEffect(() => {
    // Clear error and success messages when switching between login/signup
    setError(null);
    setSuccess(null);
  }, [isLogin]);

  const toggleVisibility = () => setIsVisible(!isVisible);

  const getErrorMessage = (error: any): string => {
    if (!error) return "An unexpected error occurred";

    const message = error.message || String(error);

    // Provide user-friendly error messages
    if (message.includes("Invalid login credentials")) {
      return "Invalid email or password. Please try again.";
    }
    if (message.includes("Email not confirmed")) {
      return "Please verify your email address before signing in.";
    }
    if (message.includes("User already registered")) {
      return "An account with this email already exists. Please sign in instead.";
    }
    if (message.includes("Password should be at least")) {
      return "Password must be at least 6 characters long.";
    }
    if (message.includes("Unable to validate email address")) {
      return "Please enter a valid email address.";
    }
    if (message.includes("Signups not allowed")) {
      return "Sign ups are currently disabled. Please contact support.";
    }

    return message;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(null);

    // Validation
    if (!email.trim() || !password.trim()) {
      setError("Please fill in all fields");
      setLoading(false);
      return;
    }

    try {
      const { error } = isLogin
        ? await signIn(email, password)
        : await signUp(email, password);

      if (error) {
        setError(getErrorMessage(error));
      } else {
        if (isLogin) {
          // Redirect after successful sign in
          router.push(next);
        } else {
          // Show success message for sign up
          setSuccess(
            "Account created! Please check your email to verify your account.",
          );
          // Optionally redirect to login or research page after a delay
          setTimeout(() => {
            router.push(next);
          }, 2000);
        }
      }
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const { error } = await signInWithGoogle();

      if (error) {
        setError(getErrorMessage(error));
        setLoading(false);
      }
      // Note: Don't set loading to false on success as the page will redirect
      // The OAuth flow will redirect automatically
    } catch (err) {
      setError(getErrorMessage(err));
      setLoading(false);
    }
  };

  const handleForgotPassword = async () => {
    if (!email.trim()) {
      setError("Please enter your email address first");
      return;
    }

    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const { error } = await resetPassword(email);

      if (error) {
        setError(getErrorMessage(error));
      } else {
        setSuccess("Password reset email sent! Check your inbox.");
      }
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="brand-app-shell flex min-h-screen items-center justify-center p-4">
      <Card className="brand-surface w-full max-w-md rounded-3xl p-6">
        <div className="text-center mb-6">
          <h1 className="brand-heading text-2xl text-foreground">
            {isLogin ? "Sign In" : "Sign Up"}
          </h1>
          <p className="mt-2 text-foreground/72">
            {isLogin ? "Welcome back!" : "Create your account"}
          </p>
        </div>

        <form className="space-y-4" onSubmit={handleSubmit}>
          <Input
            label="Email"
            placeholder="Enter your email"
            required
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            isDisabled={loading}
          />

          <Input
            label="Password"
            placeholder="Enter your password"
            required
            type={isVisible ? "text" : "password"}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            isDisabled={loading}
            endContent={
              <button
                className="focus:outline-none"
                type="button"
                onClick={toggleVisibility}
                disabled={loading}
              >
                {isVisible ? (
                  <EyeSlashIcon className="w-5 h-5 text-gray-400" />
                ) : (
                  <EyeIcon className="w-5 h-5 text-gray-400" />
                )}
              </button>
            }
          />

          {/* Forgot Password Link */}
          {isLogin && (
            <div className="text-right">
              <button
                type="button"
                className="text-sm text-foreground hover:underline disabled:opacity-50"
                onClick={handleForgotPassword}
                disabled={loading}
              >
                Forgot password?
              </button>
            </div>
          )}

          {error && (
            <div className="rounded bg-red-50 p-2 text-center text-sm text-red-600">
              {error}
            </div>
          )}

          {success && (
            <div className="rounded bg-green-50 p-2 text-center text-sm text-green-600">
              {success}
            </div>
          )}

          <Button
            className="w-full"
            color="primary"
            isLoading={loading}
            type="submit"
          >
            {isLogin ? "Sign In" : "Sign Up"}
          </Button>
        </form>

        <div className="mt-4">
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-300" />
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="bg-[var(--fqxi-paper)] px-2 text-foreground/55">
                Or continue with
              </span>
            </div>
          </div>

          <Button
            className="w-full mt-4"
            isLoading={loading}
            variant="bordered"
            onClick={handleGoogleSignIn}
          >
            <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24">
              <path
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                fill="currentColor"
              />
              <path
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                fill="currentColor"
              />
              <path
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                fill="currentColor"
              />
              <path
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                fill="currentColor"
              />
            </svg>
            {isLogin ? "Sign in with Google" : "Sign up with Google"}
          </Button>
        </div>

        <div className="mt-6 text-center">
          <button
            className="text-foreground hover:underline disabled:opacity-50"
            type="button"
            onClick={() => setIsLogin(!isLogin)}
            disabled={loading}
          >
            {isLogin
              ? "Don't have an account? Sign up"
              : "Already have an account? Sign in"}
          </button>
        </div>
      </Card>
    </div>
  );
}
