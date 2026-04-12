"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@clerk/nextjs";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Bookmark, BookmarkCheck, Heart, HeartOff, Users } from "lucide-react";

export function HackathonActions({
  hackathonId,
  interestedCount: initialCount,
}: {
  hackathonId: string;
  interestedCount: number;
}) {
  const { userId } = useAuth();
  const supabase = createClient();
  const [isInterested, setIsInterested] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  const [interestedCount, setInterestedCount] = useState(initialCount);
  const [loadingInterest, setLoadingInterest] = useState(false);
  const [loadingSave, setLoadingSave] = useState(false);

  useEffect(() => {
    async function checkState() {
      if (!userId) return;

      const [interestResult, savedResult] = await Promise.all([
        supabase
          .from("hackathon_interests")
          .select("id")
          .eq("user_id", userId)
          .eq("hackathon_id", hackathonId)
          .maybeSingle(),
        supabase
          .from("saved_items")
          .select("id")
          .eq("user_id", userId)
          .eq("item_type", "hackathon")
          .eq("item_id", hackathonId)
          .maybeSingle(),
      ]);

      if (interestResult.data) setIsInterested(true);
      if (savedResult.data) setIsSaved(true);
    }
    checkState();
  }, [hackathonId, userId, supabase]);

  async function handleToggleInterest() {
    setLoadingInterest(true);
    try {
      if (!userId) return;

      if (isInterested) {
        await supabase
          .from("hackathon_interests")
          .delete()
          .eq("user_id", userId)
          .eq("hackathon_id", hackathonId);
        setIsInterested(false);
        setInterestedCount((c) => Math.max(0, c - 1));
      } else {
        await supabase.from("hackathon_interests").insert({
          user_id: userId,
          hackathon_id: hackathonId,
        });
        setIsInterested(true);
        setInterestedCount((c) => c + 1);
      }
    } finally {
      setLoadingInterest(false);
    }
  }

  async function handleToggleSave() {
    setLoadingSave(true);
    try {
      if (!userId) return;

      if (isSaved) {
        await supabase
          .from("saved_items")
          .delete()
          .eq("user_id", userId)
          .eq("item_type", "hackathon")
          .eq("item_id", hackathonId);
        setIsSaved(false);
      } else {
        await supabase.from("saved_items").insert({
          user_id: userId,
          item_type: "hackathon",
          item_id: hackathonId,
        });
        setIsSaved(true);
      }
    } finally {
      setLoadingSave(false);
    }
  }

  return (
    <div className="flex items-center gap-2">
      <Button
        variant={isInterested ? "default" : "outline"}
        onClick={handleToggleInterest}
        disabled={loadingInterest}
      >
        {isInterested ? (
          <HeartOff className="mr-1.5 size-4" />
        ) : (
          <Heart className="mr-1.5 size-4" />
        )}
        {isInterested ? "Not Interested" : "I'm Interested"}
        <span className="ml-1.5 flex items-center gap-1 text-xs text-muted-foreground">
          <Users className="size-3" />
          {interestedCount}
        </span>
      </Button>

      <Button
        variant={isSaved ? "secondary" : "outline"}
        onClick={handleToggleSave}
        disabled={loadingSave}
      >
        {isSaved ? (
          <BookmarkCheck className="mr-1.5 size-4" />
        ) : (
          <Bookmark className="mr-1.5 size-4" />
        )}
        {isSaved ? "Saved" : "Save"}
      </Button>
    </div>
  );
}
