"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  validateUsername,
  checkUsernameAvailability,
  updateUserProfile,
} from "@/lib/username";
import { cn } from "@/lib/utils";

const CHARACTER_IMAGES = [
  "https://pub-0b8bdb0f1981442e9118b343565c1579.r2.dev/characters/bald_guy.png",
  "https://pub-0b8bdb0f1981442e9118b343565c1579.r2.dev/characters/black_gal.png",
  "https://pub-0b8bdb0f1981442e9118b343565c1579.r2.dev/characters/old_lady.png",
  "https://pub-0b8bdb0f1981442e9118b343565c1579.r2.dev/characters/white_dude.png",
  "https://pub-0b8bdb0f1981442e9118b343565c1579.r2.dev/characters/black_dude.png",
  "https://pub-0b8bdb0f1981442e9118b343565c1579.r2.dev/characters/white_gal.png",
];

interface PreLandingPageProps {
  userId: string;
  onProfileComplete: () => void;
}

export function PreLandingPage({ userId, onProfileComplete }: PreLandingPageProps) {
  const [username, setUsername] = useState("");
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [isSaveEnabled, setIsSaveEnabled] = useState(false);
  const [validationMessage, setValidationMessage] = useState("");
  const [isChecking, setIsChecking] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  async function handleCheckName() {
    setIsChecking(true);
    setValidationMessage("");
    setIsSaveEnabled(false);

    // First validate format
    const validation = validateUsername(username);
    if (!validation.isValid) {
      setValidationMessage(validation.message);
      setIsChecking(false);
      return;
    }

    // Then check availability
    const availability = await checkUsernameAvailability(username);
    if (availability.error) {
      setValidationMessage(availability.error);
      setIsChecking(false);
      return;
    }

    if (!availability.isAvailable) {
      setValidationMessage("Username taken");
      setIsChecking(false);
      return;
    }

    setValidationMessage("Username available");
    setIsSaveEnabled(true);
    setIsChecking(false);
  }

  async function handleSave() {
    setIsSaving(true);
    const selectedImageUrl = CHARACTER_IMAGES[selectedImageIndex];

    const result = await updateUserProfile(userId, username, selectedImageUrl);

    if (result.success) {
      onProfileComplete();
    } else {
      setValidationMessage(result.error || "Error saving profile");
      setIsSaving(false);
    }
  }

  function handleUsernameChange(value: string) {
    setUsername(value);
    setIsSaveEnabled(false);
    setValidationMessage("");
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-col lg:flex-row gap-8">
        {/* Left side - Username input */}
        <div className="flex-1 space-y-4">
          <div className="space-y-2">
            <label htmlFor="username" className="text-lg font-medium">
              Please enter a username:
            </label>
            <div className="flex items-center gap-2">
              <input
                id="username"
                type="text"
                value={username}
                onChange={(e) => handleUsernameChange(e.target.value)}
                maxLength={20}
                className={cn(
                  "w-52 rounded-md border bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2",
                  validationMessage === "Username taken"
                    ? "border-destructive focus-visible:ring-destructive"
                    : "border-input focus-visible:ring-ring"
                )}
                placeholder="Enter username"
                disabled={isChecking || isSaving}
              />
              <Button
                onClick={handleCheckName}
                disabled={!username || isChecking || isSaving}
              >
                {isChecking ? "Checking..." : "Check Name"}
              </Button>
            </div>

            {validationMessage && (
              <p
                className={cn(
                  "text-sm font-medium",
                  validationMessage === "Username available"
                    ? "text-green-600"
                    : "text-red-600"
                )}
              >
                {validationMessage}
              </p>
            )}
          </div>

          <Button
            onClick={handleSave}
            disabled={!isSaveEnabled || isSaving}
            className="w-full sm:w-auto"
          >
            {isSaving ? "Saving..." : "Save"}
          </Button>
        </div>

        {/* Right side - Character selection grid */}
        <div className="flex-1">
          <h3 className="text-lg font-medium mb-4">Select your character:</h3>
          <div className="grid grid-cols-2 gap-4">
            {CHARACTER_IMAGES.map((imageUrl, index) => (
              <button
                key={index}
                onClick={() => setSelectedImageIndex(index)}
                disabled={isSaving}
                className={cn(
                  "relative aspect-square rounded-lg overflow-hidden border-4 transition-all hover:scale-105",
                  selectedImageIndex === index
                    ? "border-primary shadow-lg"
                    : "border-transparent hover:border-primary/50"
                )}
              >
                <img
                  src={imageUrl}
                  alt={`Character ${index + 1}`}
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    // Fallback if image doesn't load
                    e.currentTarget.src = `https://via.placeholder.com/200?text=Character+${index + 1}`;
                  }}
                />
                {selectedImageIndex === index && (
                  <div className="absolute inset-0 bg-primary/20 flex items-center justify-center">
                    <div className="bg-primary text-primary-foreground rounded-full p-2">
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="24"
                        height="24"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <polyline points="20 6 9 17 4 12" />
                      </svg>
                    </div>
                  </div>
                )}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
