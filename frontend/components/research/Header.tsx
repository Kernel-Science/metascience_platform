"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { Button } from "@heroui/button";
import { Avatar } from "@heroui/avatar";
import {
  Search,
  TrendingUp,
  BookText,
  FileCheck,
  Shield,
  User,
  History,
} from "lucide-react";
import { useAuth } from "@/lib/auth/context";

import { Logo } from "@/components/icons";
import { Article } from "@/types";

interface HeaderProps {
  activeTab?: string;
  setActiveTab?: (tab: string) => void;
  papers?: Article[];
  trendAnalysis?: any;
  citationAnalysis?: any;
  minimal?: boolean;
}

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  setActiveTab,
  minimal = false,
}) => {
  const router = useRouter();
  const { user, loading } = useAuth();

  const handleTabClick = (tabId: string) => {
    if (tabId === "citation") {
      router.push("/citation");
    } else if (tabId === "review") {
      router.push("/review");
    } else if (tabId === "Methods") {
      router.push("/methods");
    } else if (
      tabId === "search" ||
      tabId === "analysis" ||
      tabId === "history"
    ) {
      // Always navigate with URL parameter for consistency
      router.push(`/research?tab=${tabId}`);
    } else if (setActiveTab) {
      setActiveTab(tabId);
    }
  };

  const handleGoToApp = () => {
    router.push("/research?tab=search");
  };

  const handleSignIn = () => {
    router.push("/auth/login");
  };

  const handleProfileClick = () => {
    router.push("/profile");
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

  return (
    <header className="fixed top-4 left-1/2 transform -translate-x-1/2 z-50">
      <nav className="backdrop-blur-md bg-white/20 border border-white/30 rounded-full px-2 py-2 shadow-lg shadow-black/10">
        <div className="flex items-center space-x-4">
          {/* Logo Section */}
          <Button
            variant="ghost"
            className="flex items-center space-x-2 px-4 py-2 rounded-full hover:bg-white/20"
            onPress={() => router.push("/")}
            aria-label="Metascience home"
          >
            <Logo />
            <span className="font-bold text-lg text-gray-900 dark:text-gray-100 hidden sm:inline">
              Metascience
            </span>
          </Button>
          {minimal ? (
            <div className="flex items-center space-x-2">
              <Button
                className="bg-gray-900 text-white px-6 py-2 rounded-full font-semibold hover:bg-gray-800 transition-colors"
                onPress={handleGoToApp}
              >
                Go to app
              </Button>
              {/* Auth buttons for minimal header */}
              {!loading &&
                (user ? (
                  <Button
                    isIconOnly
                    aria-label={`User profile: ${user.email}`}
                    className="rounded-full"
                    variant="ghost"
                    onPress={handleProfileClick}
                  >
                    <Avatar
                      className="w-6 h-6"
                      name={getInitials(user.email || "")}
                      size="sm"
                      src={getProfilePicture()}
                    />
                  </Button>
                ) : (
                  <Button
                    variant="ghost"
                    className="rounded-full"
                    onPress={handleSignIn}
                  >
                    <User className="w-4 h-4" />
                    <span className="hidden sm:inline ml-1">Sign In</span>
                  </Button>
                ))}
            </div>
          ) : (
            <>
              {/* Navigation Tabs */}
              {[
                {
                  id: "search",
                  label: "Search",
                  icon: Search,
                  disabled: false,
                },
                {
                  id: "analysis",
                  label: "Analysis",
                  icon: TrendingUp,
                  disabled: false,
                },
                {
                  id: "history",
                  label: "History",
                  icon: History,
                  disabled: false,
                },
                {
                  id: "citation",
                  label: "Citation",
                  icon: BookText,
                  disabled: false,
                },
                {
                  id: "review",
                  label: "Paper Assessment",
                  icon: FileCheck,
                  disabled: false,
                },
                {
                  id: "Methods",
                  label: "Methods",
                  icon: Shield,
                  disabled: false,
                },
              ].map((tab) => {
                const Icon = tab.icon;
                const isActive = activeTab === tab.id;

                return (
                  <button
                    key={tab.id}
                    className={`relative flex items-center space-x-2 px-4 py-2 rounded-full text-sm font-medium transition-all duration-200 ${isActive
                        ? "bg-white/90 text-gray-900 dark:bg-gray-900 dark:text-gray-100 shadow-md"
                        : tab.disabled
                          ? "text-gray-400 cursor-not-allowed opacity-50"
                          : "text-gray-700 dark:text-gray-300 hover:bg-white/40 dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-gray-100"
                      }`}
                    disabled={tab.disabled}
                    onClick={() => handleTabClick(tab.id)}
                    aria-label={`${tab.label} tab`}
                  >
                    <Icon className="w-4 h-4" />
                    <span className="hidden sm:inline">{tab.label}</span>
                  </button>
                );
              })}

              {/* User Profile Avatar or Sign In */}
              {!loading && (
                <div className="flex items-center pl-2">
                  {user ? (
                    <Button
                      isIconOnly
                      className="rounded-full"
                      variant="ghost"
                      onPress={handleProfileClick}
                      aria-label={`User profile: ${user.email}`}
                    >
                      <Avatar
                        className="w-7 h-7"
                        name={getInitials(user.email || "")}
                        size="sm"
                        src={getProfilePicture()}
                      />
                    </Button>
                  ) : (
                    <Button
                      variant="ghost"
                      className="rounded-full"
                      onPress={handleSignIn}
                    >
                      <User className="w-4 h-4" />
                      <span className="hidden sm:inline ml-1">Sign In</span>
                    </Button>
                  )}
                </div>
              )}
            </>
          )}
        </div>
      </nav>
    </header>
  );
};
