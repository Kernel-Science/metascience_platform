"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@heroui/button";
import { Input } from "@heroui/input";
import { Card } from "@heroui/card";
import { EyeIcon, EyeSlashIcon } from "@heroicons/react/24/outline";

import { useAuth } from "@/lib/auth/context";

export default function ResetPasswordPage() {
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isVisible, setIsVisible] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const router = useRouter();
  const { updatePassword } = useAuth();

  const toggleVisibility = () => setIsVisible(!isVisible);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    // Validation
    if (!password.trim() || !confirmPassword.trim()) {
      setError("Please fill in all fields");
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    if (password.length < 6) {
      setError("Password must be at least 6 characters long");
      return;
    }

    setLoading(true);

    try {
      const { error } = await updatePassword(password);

      if (error) {
        setError(error.message || "Failed to update password");
      } else {
        setSuccess("Password updated successfully! Redirecting...");
        setTimeout(() => {
          router.push("/research?tab=search");
        }, 2000);
      }
    } catch {
      setError("An unexpected error occurred");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen p-4">
      <Card className="w-full max-w-md p-6">
        <div className="text-center mb-6">
          <h1 className="text-2xl font-bold">Reset Password</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-2">
            Enter your new password below
          </p>
        </div>

        <form className="space-y-4" onSubmit={handleSubmit}>
          <Input
            label="New Password"
            placeholder="Enter your new password"
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

          <Input
            label="Confirm Password"
            placeholder="Confirm your new password"
            required
            type={isVisible ? "text" : "password"}
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            isDisabled={loading}
          />

          {error && (
            <div className="text-red-500 text-sm text-center p-2 bg-red-50 dark:bg-red-900/20 rounded">
              {error}
            </div>
          )}

          {success && (
            <div className="text-green-500 text-sm text-center p-2 bg-green-50 dark:bg-green-900/20 rounded">
              {success}
            </div>
          )}

          <Button
            className="w-full"
            color="primary"
            isLoading={loading}
            type="submit"
          >
            Update Password
          </Button>
        </form>

        <div className="mt-6 text-center">
          <Button
            variant="light"
            onClick={() => router.push("/research?tab=search")}
            isDisabled={loading}
          >
            Back to App
          </Button>
        </div>
      </Card>
    </div>
  );
}
