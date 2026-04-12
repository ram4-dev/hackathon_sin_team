export type Profile = {
  id: string;
  username: string | null;
  full_name: string | null;
  avatar_url: string | null;
  bio: string | null;
  location_city: string | null;
  location_country: string | null;
  location_lat: number | null;
  location_lng: number | null;
  stack: string[];
  roles: string[];
  modality: "remote" | "in-person" | "both";
  status: "available" | "looking_for_team" | "networking";
  github_url: string | null;
  x_url: string | null;
  linkedin_url: string | null;
  website_url: string | null;
  telegram_url: string | null;
  discord_url: string | null;
  email_contact: string | null;
  is_admin: boolean;
  created_at: string;
  updated_at: string;
};

export type Hackathon = {
  id: string;
  name: string;
  organizer: string | null;
  description: string | null;
  start_date: string | null;
  end_date: string | null;
  registration_deadline: string | null;
  modality: "remote" | "in-person" | "hybrid";
  location_city: string | null;
  location_country: string | null;
  location_lat: number | null;
  location_lng: number | null;
  category: string | null;
  tags: string[];
  prize_pool: string | null;
  official_url: string | null;
  requirements: string | null;
  image_url: string | null;
  is_featured: boolean;
  status: "upcoming" | "active" | "past";
  created_by: string | null;
  created_at: string;
  updated_at: string;
};

export type LfgPost = {
  id: string;
  type: "looking_for_team" | "looking_for_members";
  hackathon_id: string | null;
  author_id: string;
  title: string;
  description: string | null;
  skills_offered: string[];
  roles_needed: string[];
  modality: "remote" | "in-person" | "both" | null;
  timezone: string | null;
  language: string;
  level_expected: string | null;
  status: "open" | "in_conversation" | "closed";
  created_at: string;
  updated_at: string;
  // Joined fields
  author?: Profile;
  hackathon?: Hackathon;
};

export type SavedItem = {
  id: string;
  user_id: string;
  item_type: "hackathon" | "builder";
  item_id: string;
  created_at: string;
};

export type HackathonInterest = {
  id: string;
  user_id: string;
  hackathon_id: string;
  created_at: string;
};

export type Notification = {
  id: string;
  user_id: string;
  type: "new_hackathon" | "team_match" | "interest" | "deadline";
  title: string;
  message: string | null;
  link: string | null;
  is_read: boolean;
  created_at: string;
};

export const ROLES = [
  "backend",
  "frontend",
  "fullstack",
  "AI",
  "design",
  "product",
  "growth",
  "mobile",
  "devops",
  "data",
] as const;

export const STACKS = [
  "React",
  "Next.js",
  "Vue",
  "Angular",
  "Node.js",
  "Python",
  "Go",
  "Rust",
  "Java",
  "TypeScript",
  "Solidity",
  "Swift",
  "Kotlin",
  "Flutter",
  "PostgreSQL",
  "MongoDB",
  "AWS",
  "GCP",
  "Docker",
  "Kubernetes",
] as const;

export const HACKATHON_CATEGORIES = [
  "AI/ML",
  "Web3/Blockchain",
  "Fintech",
  "Health",
  "Education",
  "Climate",
  "Social Impact",
  "Gaming",
  "Developer Tools",
  "Open Source",
  "General",
] as const;
