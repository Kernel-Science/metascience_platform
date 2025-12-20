"use client";

import React, { useState } from "react";
import { useRouter, usePathname } from "next/navigation";
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
  Menu,
  X,
} from "lucide-react";
import { useAuth } from "@/lib/auth/context";

import { Logo } from "@/components/icons";

interface NavbarProps {
  minimal?: boolean;
}

export const Navbar: React.FC<NavbarProps> = ({ minimal = false }) => {
  const router = useRouter();
  const pathname = usePathname();
  const { user, loading } = useAuth();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Determine active tab from pathname
  const getActiveTab = () => {
    if (pathname.startsWith("/research/search")) return "search";
    if (pathname.startsWith("/research/analysis")) return "analysis";
    if (pathname.startsWith("/research/history")) return "history";
    if (pathname.startsWith("/citation")) return "citation";
    if (pathname.startsWith("/review")) return "review";
    if (pathname.startsWith("/methods")) return "Methods";
    return "";
  };

  const activeTab = getActiveTab();

  const handleTabClick = (tabId: string) => {
    if (tabId === "citation") {
      router.push("/citation");
    } else if (tabId === "review") {
      router.push("/review");
    } else if (tabId === "Methods") {
      router.push("/methods");
    } else if (tabId === "search") {
      router.push("/research/search");
    } else if (tabId === "analysis") {
      router.push("/research/analysis");
    } else if (tabId === "history") {
      router.push("/research/history");
    }
    setIsMobileMenuOpen(false);
  };

  const handleGoToApp = () => {
    router.push("/research/search");
    setIsMobileMenuOpen(false);
  };

  // Navigate to the public home page when clicking the logo
  const handleLogoClick = () => {
    router.push("/");
    setIsMobileMenuOpen(false);
  };

  const handleSignIn = () => {
    router.push("/auth/login");
    setIsMobileMenuOpen(false);
  };

  const handleProfileClick = () => {
    router.push("/profile");
    setIsMobileMenuOpen(false);
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

  const navItems = [
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
  ];

  return (
    <header className="fixed top-4 left-1/2 transform -translate-x-1/2 z-50 w-[95%] max-w-7xl">
      <nav className="relative backdrop-blur-md bg-white/20 border border-white/30 rounded-full px-2 py-2 shadow-lg shadow-black/10">
        <div className="flex items-center justify-between">
          {/* Logo Section */}
          <Button
            variant="ghost"
            className="flex items-center space-x-2 px-4 py-2 rounded-full hover:bg-white/20"
            onPress={handleLogoClick}
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
              {/* Desktop Navigation Tabs */}
              <div className="hidden lg:flex items-center space-x-2">
                {navItems.map((tab) => {
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
                      <span className="hidden xl:inline">{tab.label}</span>
                    </button>
                  );
                })}
              </div>

              {/* Mobile Menu Button */}
              <div className="lg:hidden flex items-center space-x-2">
                <Button
                  isIconOnly
                  className="rounded-full"
                  variant="ghost"
                  onPress={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                  aria-label={isMobileMenuOpen ? "Close menu" : "Open menu"}
                >
                  {isMobileMenuOpen ? (
                    <X className="w-5 h-5" />
                  ) : (
                    <Menu className="w-5 h-5" />
                  )}
                </Button>
              </div>

              {/* User Profile Avatar or Sign In (Desktop) */}
              {!loading && (
                <div className="hidden lg:flex items-center pl-2">
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
                      <span className="hidden xl:inline ml-1">Sign In</span>
                    </Button>
                  )}
                </div>
              )}
            </>
          )}
        </div>

        {/* Mobile Menu Dropdown */}
        {!minimal && isMobileMenuOpen && (
          <div className="absolute top-full left-0 right-0 mt-2 lg:hidden backdrop-blur-xl bg-white/90 dark:bg-gray-900/90 border border-white/30 rounded-3xl px-2 py-4 shadow-lg shadow-black/10">
            <div className="flex flex-col space-y-2">
              {navItems.map((tab) => {
                const Icon = tab.icon;
                const isActive = activeTab === tab.id;

                return (
                  <button
                    key={tab.id}
                    className={`flex items-center space-x-3 px-4 py-3 rounded-full text-sm font-medium transition-all duration-200 ${isActive
                        ? "bg-white/90 text-gray-900 dark:bg-gray-900 dark:text-gray-100 shadow-md"
                        : tab.disabled
                          ? "text-gray-400 cursor-not-allowed opacity-50"
                          : "text-gray-700 dark:text-gray-300 hover:bg-white/40 dark:hover:bg-gray-800"
                      }`}
                    disabled={tab.disabled}
                    onClick={() => handleTabClick(tab.id)}
                  >
                    <Icon className="w-5 h-5" />
                    <span>{tab.label}</span>
                  </button>
                );
              })}

              {/* Mobile Auth Button */}
              {!loading && (
                <div className="pt-2 border-t border-white/20">
                  {user ? (
                    <button
                      className="flex items-center space-x-3 px-4 py-3 rounded-full text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-white/40 dark:hover:bg-gray-800 w-full transition-all duration-200"
                      onClick={handleProfileClick}
                    >
                      <Avatar
                        className="w-6 h-6"
                        name={getInitials(user.email || "")}
                        size="sm"
                        src={getProfilePicture()}
                      />
                      <span>Profile</span>
                    </button>
                  ) : (
                    <button
                      className="flex items-center space-x-3 px-4 py-3 rounded-full text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-white/40 dark:hover:bg-gray-800 w-full transition-all duration-200"
                      onClick={handleSignIn}
                    >
                      <User className="w-5 h-5" />
                      <span>Sign In</span>
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>
        )}
      </nav>
    </header>
  );
};
