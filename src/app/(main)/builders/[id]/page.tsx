import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import type { Profile } from "@/types/database";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { BuilderActions } from "@/components/builders/builder-actions";
import {
  MapPin,
  Code2,
  Link2,
  Globe,
  Mail,
  MessageCircle,
  AtSign,
  Clock,
} from "lucide-react";

function getStatusColor(status: Profile["status"]) {
  switch (status) {
    case "available":
      return "bg-green-500/15 text-green-400 border-green-500/25";
    case "looking_for_team":
      return "bg-yellow-500/15 text-yellow-400 border-yellow-500/25";
    case "networking":
      return "bg-gray-500/15 text-gray-400 border-gray-500/25";
    default:
      return "";
  }
}

function formatLabel(str: string) {
  return str
    .split("_")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}

function getInitials(name: string | null) {
  if (!name) return "?";
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

type ExternalLink = {
  label: string;
  url: string;
  icon: React.ReactNode;
};

function getExternalLinks(profile: Profile): ExternalLink[] {
  const links: ExternalLink[] = [];
  if (profile.github_url)
    links.push({
      label: "GitHub",
      url: profile.github_url,
      icon: <Code2 className="size-4" />,
    });
  if (profile.x_url)
    links.push({
      label: "X (Twitter)",
      url: profile.x_url,
      icon: <AtSign className="size-4" />,
    });
  if (profile.linkedin_url)
    links.push({
      label: "LinkedIn",
      url: profile.linkedin_url,
      icon: <Link2 className="size-4" />,
    });
  if (profile.website_url)
    links.push({
      label: "Website",
      url: profile.website_url,
      icon: <Globe className="size-4" />,
    });
  if (profile.telegram_url)
    links.push({
      label: "Telegram",
      url: profile.telegram_url,
      icon: <MessageCircle className="size-4" />,
    });
  if (profile.discord_url)
    links.push({
      label: "Discord",
      url: profile.discord_url,
      icon: <MessageCircle className="size-4" />,
    });
  if (profile.email_contact)
    links.push({
      label: "Email",
      url: `mailto:${profile.email_contact}`,
      icon: <Mail className="size-4" />,
    });
  return links;
}

export default async function BuilderProfilePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: profile, error } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", id)
    .single();

  if (error || !profile) {
    notFound();
  }

  const builder = profile as Profile;
  const externalLinks = getExternalLinks(builder);

  return (
    <div className="mx-auto max-w-4xl px-4 py-8">
      {/* Header */}
      <div className="mb-8 flex flex-col gap-6 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex items-start gap-4">
          <Avatar className="size-20">
            {builder.avatar_url && (
              <AvatarImage
                src={builder.avatar_url}
                alt={builder.full_name ?? "Builder"}
              />
            )}
            <AvatarFallback className="text-lg">
              {getInitials(builder.full_name)}
            </AvatarFallback>
          </Avatar>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">
              {builder.full_name ?? builder.username ?? "Anonymous"}
            </h1>
            {builder.username && (
              <p className="text-muted-foreground">@{builder.username}</p>
            )}
            {(builder.location_city || builder.location_country) && (
              <p className="mt-1 flex items-center gap-1 text-sm text-muted-foreground">
                <MapPin className="size-3.5" />
                {[builder.location_city, builder.location_country]
                  .filter(Boolean)
                  .join(", ")}
              </p>
            )}
            <div className="mt-2 flex flex-wrap items-center gap-1.5">
              <Badge className={getStatusColor(builder.status)}>
                {formatLabel(builder.status)}
              </Badge>
              <Badge variant="secondary">{formatLabel(builder.modality)}</Badge>
            </div>
          </div>
        </div>

        <BuilderActions builderId={builder.id} profile={builder} />
      </div>

      {/* Bio */}
      {builder.bio && (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>About</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="whitespace-pre-line text-muted-foreground">
              {builder.bio}
            </p>
          </CardContent>
        </Card>
      )}

      <div className="grid gap-6 md:grid-cols-2">
        {/* Stack */}
        {builder.stack.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Tech Stack</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-1.5">
                {builder.stack.map((tech) => (
                  <Badge key={tech} variant="secondary">
                    {tech}
                  </Badge>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Roles */}
        {builder.roles.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Roles</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-1.5">
                {builder.roles.map((role) => (
                  <Badge key={role} variant="outline">
                    {formatLabel(role)}
                  </Badge>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* External Links */}
      {externalLinks.length > 0 && (
        <>
          <Separator className="my-6" />
          <Card>
            <CardHeader>
              <CardTitle>Links</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-2 sm:grid-cols-2">
                {externalLinks.map((link) => (
                  <a
                    key={link.label}
                    href={link.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 rounded-md p-2 text-sm text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                  >
                    {link.icon}
                    {link.label}
                  </a>
                ))}
              </div>
            </CardContent>
          </Card>
        </>
      )}

      {/* Hackathon History */}
      <Separator className="my-6" />
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="size-4" />
            Hackathon History
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            No hackathon history yet.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
