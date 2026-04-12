"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@clerk/nextjs";
import { createClient } from "@/lib/supabase/client";
import type { Profile } from "@/types/database";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import {
  Bookmark,
  BookmarkCheck,
  ExternalLink,
  Code2,
  Link2,
  Globe,
  Mail,
  MessageCircle,
  AtSign,
} from "lucide-react";

type ContactLink = {
  label: string;
  url: string;
  icon: React.ReactNode;
};

function getContactLinks(profile: Profile): ContactLink[] {
  const links: ContactLink[] = [];

  if (profile.github_url) {
    links.push({
      label: "GitHub",
      url: profile.github_url,
      icon: <Code2 className="size-4" />,
    });
  }
  if (profile.x_url) {
    links.push({
      label: "X (Twitter)",
      url: profile.x_url,
      icon: <AtSign className="size-4" />,
    });
  }
  if (profile.linkedin_url) {
    links.push({
      label: "LinkedIn",
      url: profile.linkedin_url,
      icon: <Link2 className="size-4" />,
    });
  }
  if (profile.website_url) {
    links.push({
      label: "Website",
      url: profile.website_url,
      icon: <Globe className="size-4" />,
    });
  }
  if (profile.telegram_url) {
    links.push({
      label: "Telegram",
      url: profile.telegram_url,
      icon: <MessageCircle className="size-4" />,
    });
  }
  if (profile.discord_url) {
    links.push({
      label: "Discord",
      url: profile.discord_url,
      icon: <MessageCircle className="size-4" />,
    });
  }
  if (profile.email_contact) {
    links.push({
      label: "Email",
      url: `mailto:${profile.email_contact}`,
      icon: <Mail className="size-4" />,
    });
  }

  return links;
}

export function BuilderActions({
  builderId,
  profile,
}: {
  builderId: string;
  profile: Profile;
}) {
  const { userId } = useAuth();
  const supabase = createClient();
  const [isSaved, setIsSaved] = useState(false);
  const [saving, setSaving] = useState(false);

  const contactLinks = getContactLinks(profile);

  useEffect(() => {
    async function checkSaved() {
      if (!userId) return;

      const { data } = await supabase
        .from("saved_items")
        .select("id")
        .eq("user_id", userId)
        .eq("item_type", "builder")
        .eq("item_id", builderId)
        .maybeSingle();

      if (data) {
        setIsSaved(true);
      }
    }
    checkSaved();
  }, [builderId, userId, supabase]);

  async function handleToggleSave() {
    setSaving(true);
    try {
      if (!userId) return;

      if (isSaved) {
        await supabase
          .from("saved_items")
          .delete()
          .eq("user_id", userId)
          .eq("item_type", "builder")
          .eq("item_id", builderId);
        setIsSaved(false);
      } else {
        await supabase.from("saved_items").insert({
          user_id: userId,
          item_type: "builder",
          item_id: builderId,
        });
        setIsSaved(true);
      }
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="flex items-center gap-2">
      <Button
        variant={isSaved ? "secondary" : "outline"}
        onClick={handleToggleSave}
        disabled={saving}
      >
        {isSaved ? (
          <BookmarkCheck className="mr-1.5 size-4" />
        ) : (
          <Bookmark className="mr-1.5 size-4" />
        )}
        {isSaved ? "Saved" : "Save Builder"}
      </Button>

      {contactLinks.length > 0 && (
        <DropdownMenu>
          <DropdownMenuTrigger
            render={
              <Button variant="default">
                <ExternalLink className="mr-1.5 size-4" />
                Contact
              </Button>
            }
          />
          <DropdownMenuContent align="end">
            <DropdownMenuLabel>External Links</DropdownMenuLabel>
            <DropdownMenuSeparator />
            {contactLinks.map((link) => (
              <DropdownMenuItem
                key={link.label}
                render={
                  <a
                    href={link.url}
                    target="_blank"
                    rel="noopener noreferrer"
                  />
                }
              >
                {link.icon}
                {link.label}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      )}
    </div>
  );
}
