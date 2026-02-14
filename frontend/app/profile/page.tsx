"use client";

import { useState, useRef } from "react";
import { Button } from "@heroui/button";
import { Card, CardBody, CardHeader } from "@heroui/card";
import { Input } from "@heroui/input";
import { Avatar } from "@heroui/avatar";
import { Divider } from "@heroui/divider";
import { motion } from "framer-motion";
import { useTheme } from "next-themes";
import {
  User,
  Mail,
  Calendar,
  LogOut,
  Edit,
  Save,
  X,
  Camera,
  Sun,
  Moon,
} from "lucide-react";

import { useAuth } from "@/lib/auth/context";
import ProtectedRoute from "@/components/auth/ProtectedRoute";
import { Navbar } from "@/components/navbar";
import { createClient } from "@/lib/supabase/client";

export default function ProfilePage() {
  const { user, signOut } = useAuth();
  const { theme, setTheme } = useTheme();
  const [isEditing, setIsEditing] = useState(false);
  const [displayName, setDisplayName] = useState(
    user?.user_metadata?.full_name || "",
  );
  const [loading, setLoading] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const supabase = createClient();

  const handleSignOut = async () => {
    setLoading(true);
    await signOut();
  };

  const clearMessages = () => {
    setError(null);
    setSuccess(null);
  };

  const showError = (message: string) => {
    setError(message);
    setTimeout(() => setError(null), 5000);
  };

  const showSuccess = (message: string) => {
    setSuccess(message);
    setTimeout(() => setSuccess(null), 5000);
  };

  const handleSaveProfile = async () => {
    if (!user) return;

    setLoading(true);
    clearMessages();

    try {
      const { error } = await supabase.auth.updateUser({
        data: {
          full_name: displayName.trim() || undefined,
        },
      });

      if (error) {
        showError(error.message);
      } else {
        showSuccess("Profile updated successfully!");
        setIsEditing(false);
      }
    } catch {
      showError("Failed to update profile. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleCancelEdit = () => {
    setDisplayName(user?.user_metadata?.full_name || "");
    setIsEditing(false);
    clearMessages();
  };

  const handleAvatarClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileUpload = async (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const file = event.target.files?.[0];

    if (!file || !user) return;

    // Validate file type
    if (!file.type.startsWith("image/")) {
      showError("Please select an image file");

      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      showError("Image must be smaller than 5MB");

      return;
    }

    setUploadingAvatar(true);
    clearMessages();

    try {
      // Create unique filename
      const fileExt = file.name.split(".").pop();
      const fileName = `${user.id}/avatar.${fileExt}`;

      // Upload to Supabase Storage
      const { error: uploadError } = await supabase.storage
        .from("avatars")
        .upload(fileName, file, {
          upsert: true,
        });

      if (uploadError) {
        throw uploadError;
      }

      // Get public URL
      const {
        data: { publicUrl },
      } = supabase.storage.from("avatars").getPublicUrl(fileName);

      // Update user metadata with new avatar URL
      const { error: updateError } = await supabase.auth.updateUser({
        data: {
          avatar_url: publicUrl,
        },
      });

      if (updateError) {
        throw updateError;
      }

      showSuccess("Profile picture updated successfully!");
    } catch (err: any) {
      showError(err.message || "Failed to upload profile picture");
    } finally {
      setUploadingAvatar(false);
    }
  };

  const handleForgotPassword = async () => {
    if (!user?.email) return;

    setLoading(true);
    clearMessages();

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(user.email, {
        redirectTo: `${window.location.origin}/auth/reset-password`,
      });

      if (error) {
        showError(error.message);
      } else {
        showSuccess("Password reset email sent! Check your inbox.");
      }
    } catch {
      showError("Failed to send reset email. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const getInitials = (email: string) => {
    return email
      .split("@")[0]
      .split(".")
      .map((part) => part.charAt(0).toUpperCase())
      .join("")
      .slice(0, 2);
  };

  const getProfilePicture = () => {
    return user?.user_metadata?.avatar_url || user?.user_metadata?.picture;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  return (
    <ProtectedRoute>
      <div className="brand-app-shell">
        <Navbar />

        <main className="container mx-auto px-6 py-24 max-w-4xl">
          <motion.div
            animate={{ opacity: 1, y: 0 }}
            className="space-y-8"
            initial={{ opacity: 0, y: 20 }}
          >
            {/* Error/Success Messages */}
            {(error || success) && (
              <Card className={error ? "border-danger" : "border-success"}>
                <CardBody className="p-4">
                  <p
                    className={`text-center ${error ? "text-danger" : "text-success"}`}
                  >
                    {error || success}
                  </p>
                </CardBody>
              </Card>
            )}

            {/* Profile Header */}
            <Card>
              <CardHeader className="pb-4">
                <div className="flex items-center gap-4">
                  <User className="h-6 w-6 text-primary" />
                  <h1 className="text-2xl font-bold text-foreground">
                    Profile
                  </h1>
                </div>
              </CardHeader>
              <CardBody className="space-y-6">
                {/* Profile Picture and Basic Info */}
                <div className="flex flex-col sm:flex-row items-center gap-6">
                  <div className="relative group">
                    <Avatar
                      className="w-24 h-24 text-large cursor-pointer transition-opacity group-hover:opacity-75"
                      name={getInitials(user?.email || "")}
                      src={getProfilePicture()}
                      onClick={handleAvatarClick}
                    />

                    {/* Hover overlay with proper accessibility */}
                    <button
                      type="button"
                      className="absolute inset-0 bg-black/50 rounded-full opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer flex items-center justify-center"
                      onClick={handleAvatarClick}
                      aria-label="Upload profile picture"
                    >
                      {uploadingAvatar ? (
                        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-white" />
                      ) : (
                        <Camera className="w-6 h-6 text-white" />
                      )}
                    </button>

                    {/* Hidden file input */}
                    <input
                      ref={fileInputRef}
                      accept="image/*"
                      className="hidden"
                      type="file"
                      onChange={handleFileUpload}
                    />
                  </div>

                  <div className="flex-1 text-center sm:text-left">
                    {isEditing ? (
                      <div className="space-y-4">
                        <Input
                          label="Display Name"
                          placeholder="Enter your display name"
                          value={displayName}
                          onChange={(e) => setDisplayName(e.target.value)}
                        />
                        <div className="flex gap-2 justify-center sm:justify-start">
                          <Button
                            color="primary"
                            isLoading={loading}
                            size="sm"
                            startContent={<Save className="w-4 h-4" />}
                            onClick={handleSaveProfile}
                          >
                            Save
                          </Button>
                          <Button
                            size="sm"
                            startContent={<X className="w-4 h-4" />}
                            variant="ghost"
                            onClick={handleCancelEdit}
                          >
                            Cancel
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        <div className="flex items-center gap-2 justify-center sm:justify-start">
                          <h2 className="text-xl font-semibold text-foreground">
                            {displayName ||
                              user?.user_metadata?.full_name ||
                              "User"}
                          </h2>
                          <Button
                            isIconOnly
                            size="sm"
                            variant="ghost"
                            onClick={() => setIsEditing(true)}
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                        </div>
                        <p className="text-muted-foreground">{user?.email}</p>
                      </div>
                    )}
                  </div>
                </div>

                <Divider />

                {/* Account Information */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-foreground">
                    Account Information
                  </h3>

                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="flex items-center gap-3 p-3 rounded-lg bg-default-100/50">
                      <Mail className="w-5 h-5 text-primary" />
                      <div>
                        <p className="text-sm font-medium text-foreground">
                          Email
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {user?.email}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 p-3 rounded-lg bg-default-100/50">
                      <Calendar className="w-5 h-5 text-primary" />
                      <div>
                        <p className="text-sm font-medium text-foreground">
                          Joined
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {user?.created_at
                            ? formatDate(user.created_at)
                            : "Unknown"}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                <Divider />

                {/* Authentication Provider Info */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-foreground">
                    Authentication
                  </h3>

                  <div className="p-3 rounded-lg bg-default-100/50">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                        {user?.app_metadata?.provider === "google" ? (
                          <svg className="w-5 h-5" viewBox="0 0 24 24">
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
                        ) : (
                          <Mail className="w-5 h-5 text-primary" />
                        )}
                      </div>
                      <div>
                        <p className="text-sm font-medium text-foreground">
                          {user?.app_metadata?.provider === "google"
                            ? "Google Account"
                            : "Email Account"}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          Last signed in:{" "}
                          {user?.last_sign_in_at
                            ? formatDate(user.last_sign_in_at)
                            : "Unknown"}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                <Divider />

                {/* Theme Preferences */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-foreground">
                    Appearance
                  </h3>

                  <div className="p-4 rounded-lg bg-default-100/50">
                    <p className="text-sm font-medium text-foreground mb-4">
                      Theme Mode
                    </p>
                    <div className="grid grid-cols-2 gap-3">
                      <motion.button
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        className={`relative p-4 rounded-lg border-2 transition-all ${
                          theme === "light"
                            ? "border-primary bg-primary/10"
                            : "border-default-200 bg-default-50 hover:border-default-300"
                        }`}
                        onClick={() => setTheme("light")}
                      >
                        <div className="flex flex-col items-center gap-2">
                          <div
                            className={`p-3 rounded-full ${
                              theme === "light"
                                ? "bg-primary/20"
                                : "bg-default-100"
                            }`}
                          >
                            <Sun
                              className={`w-6 h-6 ${
                                theme === "light"
                                  ? "text-primary"
                                  : "text-default-500"
                              }`}
                            />
                          </div>
                          <span
                            className={`text-sm font-medium ${
                              theme === "light"
                                ? "text-primary"
                                : "text-default-700"
                            }`}
                          >
                            Light Mode
                          </span>
                        </div>
                        {theme === "light" && (
                          <motion.div
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            className="absolute top-2 right-2 w-5 h-5 bg-primary rounded-full flex items-center justify-center"
                          >
                            <svg
                              className="w-3 h-3 text-white"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={3}
                                d="M5 13l4 4L19 7"
                              />
                            </svg>
                          </motion.div>
                        )}
                      </motion.button>

                      <motion.button
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        className={`relative p-4 rounded-lg border-2 transition-all ${
                          theme === "dark"
                            ? "border-primary bg-primary/10"
                            : "border-default-200 bg-default-50 hover:border-default-300"
                        }`}
                        onClick={() => setTheme("dark")}
                      >
                        <div className="flex flex-col items-center gap-2">
                          <div
                            className={`p-3 rounded-full ${
                              theme === "dark"
                                ? "bg-primary/20"
                                : "bg-default-100"
                            }`}
                          >
                            <Moon
                              className={`w-6 h-6 ${
                                theme === "dark"
                                  ? "text-primary"
                                  : "text-default-500"
                              }`}
                            />
                          </div>
                          <span
                            className={`text-sm font-medium ${
                              theme === "dark"
                                ? "text-primary"
                                : "text-default-700"
                            }`}
                          >
                            Dark Mode
                          </span>
                        </div>
                        {theme === "dark" && (
                          <motion.div
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            className="absolute top-2 right-2 w-5 h-5 bg-primary rounded-full flex items-center justify-center"
                          >
                            <svg
                              className="w-3 h-3 text-white"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={3}
                                d="M5 13l4 4L19 7"
                              />
                            </svg>
                          </motion.div>
                        )}
                      </motion.button>
                    </div>
                  </div>
                </div>

                <Divider />

                {/* Actions */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-foreground">
                    Account Actions
                  </h3>

                  <div className="flex flex-col sm:flex-row gap-4">
                    {/* Only show forgot password for email accounts */}
                    {user?.app_metadata?.provider !== "google" && (
                      <Button
                        color="warning"
                        isLoading={loading}
                        startContent={<Mail className="w-4 h-4" />}
                        variant="flat"
                        onClick={handleForgotPassword}
                      >
                        Reset Password
                      </Button>
                    )}

                    <Button
                      color="danger"
                      isLoading={loading}
                      startContent={<LogOut className="w-4 h-4" />}
                      variant="flat"
                      onClick={handleSignOut}
                    >
                      Sign Out
                    </Button>
                  </div>
                </div>
              </CardBody>
            </Card>
          </motion.div>
        </main>
      </div>
    </ProtectedRoute>
  );
}
