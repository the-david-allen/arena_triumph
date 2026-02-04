"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { PreLandingPage } from "@/components/PreLandingPage";
import { MainLandingPage } from "@/components/MainLandingPage";

interface UserProfile {
  id: string;
  username: string | null;
  user_email: string | null;
}

export default function MainPage() {
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [needsSetup, setNeedsSetup] = useState(false);

  useEffect(() => {
    async function loadUserProfile() {
      const supabase = createClient();

      // Get current user
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        setIsLoading(false);
        return;
      }

      // Fetch user profile
      const { data, error } = await supabase
        .from("user_profiles")
        .select("id, username, user_email")
        .eq("id", user.id)
        .single();

      if (error) {
        console.error("Error fetching user profile:", error);
        setIsLoading(false);
        return;
      }

      setUserProfile(data);
      
      // Check if username equals email (needs setup)
      setNeedsSetup(data.username === data.user_email);
      setIsLoading(false);
    }

    loadUserProfile();
  }, []);

  function handleProfileComplete() {
    // Reload the page to show the main landing page
    window.location.reload();
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-lg text-muted-foreground">Loading...</div>
      </div>
    );
  }

  if (!userProfile) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-lg text-muted-foreground">
          Error loading profile. Please try refreshing the page.
        </div>
      </div>
    );
  }

  if (needsSetup) {
    return (
      <PreLandingPage
        userId={userProfile.id}
        onProfileComplete={handleProfileComplete}
      />
    );
  }

  return <MainLandingPage />;
}
