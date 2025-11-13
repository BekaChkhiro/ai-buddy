"use client";

/**
 * User menu dropdown component
 * Shows user profile info and logout button
 */

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { LogOut, Settings, UserCircle } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { signOut } from "@/lib/auth";
import { getCurrentProfile } from "@/lib/supabase/queries";
import { createBrowserClient } from "@/lib/supabase/client";
import { useToast } from "@/hooks/use-toast";
import type { Profile } from "@/types";

export function UserMenu() {
  const router = useRouter();
  const { toast } = useToast();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    loadProfile();
  }, []);

  async function loadProfile() {
    try {
      const supabase = createBrowserClient();
      const profileData = await getCurrentProfile(supabase);
      setProfile(profileData);
    } catch (error) {
      console.error("Failed to load profile:", error);
    }
  }

  async function handleLogout() {
    setIsLoading(true);

    try {
      const result = await signOut();

      if (result.success) {
        toast({
          title: "Logged out",
          description: "You have been successfully logged out.",
        });
        router.push("/login" as any);
        router.refresh();
      } else {
        toast({
          title: "Error",
          description: result.error?.message || "Failed to log out",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "An unexpected error occurred",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  }

  const getInitials = (name: string | null): string => {
    if (!name) return "U";
    return name
      .split(" ")
      .map((part) => part[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="relative h-10 w-10 rounded-full">
          <Avatar className="h-10 w-10">
            <AvatarImage src={profile?.avatarUrl || undefined} alt={profile?.fullName || "User"} />
            <AvatarFallback>{getInitials(profile?.fullName || null)}</AvatarFallback>
          </Avatar>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-56" align="end" forceMount>
        <DropdownMenuLabel className="font-normal">
          <div className="flex flex-col space-y-1">
            <p className="text-sm font-medium leading-none">{profile?.fullName || "User"}</p>
            <p className="text-xs leading-none text-muted-foreground">{profile?.email || ""}</p>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={() => router.push("/profile" as any)}>
          <UserCircle className="mr-2 h-4 w-4" />
          <span>Profile</span>
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => router.push("/settings" as any)}>
          <Settings className="mr-2 h-4 w-4" />
          <span>Settings</span>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={handleLogout} disabled={isLoading}>
          <LogOut className="mr-2 h-4 w-4" />
          <span>{isLoading ? "Logging out..." : "Log out"}</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
