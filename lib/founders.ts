export type FounderProfile = {
  id: "noel" | "newman";
  name: string;
  shortName: string;
  handle: string;
  initials: string;
  roleLabel: string;
  bio: string;
  tone: "cyan" | "ember";
  photoUrl?: string;
};

export const FOUNDER_PROFILES: FounderProfile[] = [
  {
    id: "noel",
    name: "Noel Fleming",
    shortName: "Noel",
    handle: "@noelfleming",
    initials: "NF",
    roleLabel: "Editorial + Platform Strategy",
    bio: "Co-proprietor focused on editorial leadership, community coverage, and platform strategy.",
    tone: "cyan",
    photoUrl: "/branding/noel.jpg",
  },
  {
    id: "newman",
    name: "Phil Newman",
    shortName: "Newman",
    handle: "@philnewman",
    initials: "PN",
    roleLabel: "Operations + Growth",
    bio: "Co-proprietor overseeing operations, growth, and multi-format content publishing workflows.",
    tone: "ember",
    photoUrl: "/branding/newman.png",
  },
];

export function getFounderByName(name: string) {
  const normalized = name.trim().toLowerCase();

  return FOUNDER_PROFILES.find((founder) => founder.name.toLowerCase() === normalized) ?? null;
}
