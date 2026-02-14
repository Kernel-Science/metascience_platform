"use client";

import React, { useState } from "react";
import Image from "next/image";
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

interface NavbarProps {
  minimal?: boolean;
}

export const Navbar: React.FC<NavbarProps> = ({ minimal = false }) => {
  const router = useRouter();
  const pathname = usePathname();
  const { user, loading } = useAuth();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const getActiveTab = () => {
    if (pathname.startsWith("/research/search")) return "search";
    if (pathname.startsWith("/research/analysis")) return "analysis";
    if (pathname.startsWith("/research/history")) return "history";
    if (pathname.startsWith("/citation")) return "citation";
    if (pathname.startsWith("/review")) return "review";
    if (pathname.startsWith("/methods")) return "methods";

    return "";
  };

  const activeTab = getActiveTab();

  const handleTabClick = (tabId: string) => {
    if (tabId === "citation") {
      router.push("/citation");
    } else if (tabId === "review") {
      router.push("/review");
    } else if (tabId === "methods") {
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
    },
    {
      id: "analysis",
      label: "Analysis",
      icon: TrendingUp,
    },
    {
      id: "history",
      label: "History",
      icon: History,
    },
    {
      id: "citation",
      label: "Citation",
      icon: BookText,
    },
    {
      id: "review",
      label: "Paper Assessment",
      icon: FileCheck,
    },
    {
      id: "methods",
      label: "Methods",
      icon: Shield,
    },
  ];

  return (
    <header className="fixed top-4 left-1/2 z-50 w-[95%] max-w-7xl -translate-x-1/2">
      <nav className="brand-surface rounded-[2rem] px-3 py-2">
        <div className="flex items-center justify-between gap-2">
          <Button
            variant="light"
            className="flex h-auto items-center gap-3 rounded-[1.2rem] px-4 py-2 text-foreground hover:bg-[#E4D344]/40"
            onPress={handleLogoClick}
            aria-label="FQxI Metascience home"
          >
            <Image
              src="/FQXILogo.svg"
              alt="FQxI"
              width={78}
              height={40}
              priority
            />
            <span className="hidden text-sm font-semibold tracking-[0.18em] sm:inline">
              METASCIENCE
            </span>
          </Button>

          {minimal ? (
            <div className="flex items-center space-x-2">
              <Button
                className="rounded-full border border-foreground/75 bg-[#E4D344] px-6 py-2 font-semibold text-[#1D1D1B] hover:bg-[#d8c63f]"
                onPress={handleGoToApp}
              >
                Go to App
              </Button>
              {!loading &&
                (user ? (
                  <Button
                    isIconOnly
                    aria-label={`User profile: ${user.email}`}
                    className="rounded-full"
                    variant="light"
                    onPress={handleProfileClick}
                  >
                    <Avatar
                      className="h-6 w-6"
                      name={getInitials(user.email || "")}
                      size="sm"
                      src={getProfilePicture()}
                    />
                  </Button>
                ) : (
                  <Button
                    variant="light"
                    className="rounded-full border border-foreground/25 text-foreground"
                    onPress={handleSignIn}
                  >
                    <User className="h-4 w-4" />
                    <span className="ml-1 hidden sm:inline">Sign In</span>
                  </Button>
                ))}
            </div>
          ) : (
            <>
              <div className="hidden items-center gap-2 lg:flex">
                {navItems.map((tab) => {
                  const Icon = tab.icon;
                  const isActive = activeTab === tab.id;

                  return (
                    <button
                      key={tab.id}
                      className={`flex items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold tracking-[0.04em] transition-all duration-200 ${
                        isActive
                          ? "bg-foreground text-background"
                          : "text-foreground/80 hover:bg-[#E4D344]/40 hover:text-foreground"
                      }`}
                      onClick={() => handleTabClick(tab.id)}
                      aria-label={`${tab.label} tab`}
                    >
                      <Icon className="h-4 w-4" />
                      <span className="hidden xl:inline">{tab.label}</span>
                    </button>
                  );
                })}
              </div>

              <div className="flex items-center space-x-2 lg:hidden">
                <Button
                  isIconOnly
                  className="rounded-full border border-foreground/20 text-foreground"
                  variant="light"
                  onPress={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                  aria-label={isMobileMenuOpen ? "Close menu" : "Open menu"}
                >
                  {isMobileMenuOpen ? (
                    <X className="h-5 w-5" />
                  ) : (
                    <Menu className="h-5 w-5" />
                  )}
                </Button>
              </div>

              {!loading && (
                <div className="hidden items-center pl-2 lg:flex">
                  {user ? (
                    <Button
                      isIconOnly
                      className="rounded-full border border-foreground/15"
                      variant="light"
                      onPress={handleProfileClick}
                      aria-label={`User profile: ${user.email}`}
                    >
                      <Avatar
                        className="h-7 w-7"
                        name={getInitials(user.email || "")}
                        size="sm"
                        src={getProfilePicture()}
                      />
                    </Button>
                  ) : (
                    <Button
                      variant="light"
                      className="rounded-full border border-foreground/25 text-foreground"
                      onPress={handleSignIn}
                    >
                      <User className="h-4 w-4" />
                      <span className="ml-1 hidden xl:inline">Sign In</span>
                    </Button>
                  )}
                </div>
              )}
            </>
          )}
        </div>

        {!minimal && isMobileMenuOpen && (
          <div className="brand-surface absolute left-0 right-0 top-full z-20 mt-2 rounded-[1.5rem] p-3 lg:hidden">
            <div className="flex flex-col gap-2">
              {navItems.map((tab) => {
                const Icon = tab.icon;
                const isActive = activeTab === tab.id;

                return (
                  <button
                    key={tab.id}
                    className={`flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-semibold transition-all duration-200 ${
                      isActive
                        ? "bg-foreground text-background"
                        : "text-foreground/80 hover:bg-[#E4D344]/40 hover:text-foreground"
                    }`}
                    onClick={() => handleTabClick(tab.id)}
                  >
                    <Icon className="h-5 w-5" />
                    <span>{tab.label}</span>
                  </button>
                );
              })}

              {!loading && (
                <div className="mt-1 border-t border-foreground/12 pt-2">
                  {user ? (
                    <button
                      className="flex w-full items-center gap-3 rounded-xl px-4 py-3 text-sm font-semibold text-foreground/80 hover:bg-[#E4D344]/35"
                      onClick={handleProfileClick}
                    >
                      <Avatar
                        className="h-6 w-6"
                        name={getInitials(user.email || "")}
                        size="sm"
                        src={getProfilePicture()}
                      />
                      <span>Profile</span>
                    </button>
                  ) : (
                    <button
                      className="flex w-full items-center gap-3 rounded-xl px-4 py-3 text-sm font-semibold text-foreground/80 hover:bg-[#E4D344]/35"
                      onClick={handleSignIn}
                    >
                      <User className="h-5 w-5" />
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
