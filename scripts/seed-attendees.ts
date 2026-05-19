/**
 * Seed fake event attendees for matchmaking demos.
 * Run: npm run db:seed
 */
import { getServerClient } from "../lib/db/clients";

const SEED_ATTENDEES = [
  {
    name: "Elena Rossi",
    role: "CTO",
    company: "NeuralFabric",
    interests: ["agentic ai", "enterprise saas", "ml ops"],
    goals: "Meet AI infrastructure founders and design partners",
    availability: [
      {
        start: "2026-05-19T09:00:00+02:00",
        end: "2026-05-19T12:30:00+02:00",
      },
      {
        start: "2026-05-19T14:00:00+02:00",
        end: "2026-05-19T18:00:00+02:00",
      },
    ],
  },
  {
    name: "Marcus Chen",
    role: "Partner",
    company: "Alpine Ventures",
    interests: ["ai investing", "b2b saas", "founder coaching"],
    goals: "Source agentic workflow startups at seed and Series A",
    availability: [
      {
        start: "2026-05-19T13:00:00+02:00",
        end: "2026-05-19T17:00:00+02:00",
      },
    ],
  },
  {
    name: "Sofia Martins",
    role: "Head of AI",
    company: "MedCore Systems",
    interests: ["healthcare ai", "regulated industries", "rag"],
    goals: "Meet compliance-minded enterprise buyers and integrators",
    availability: [
      {
        start: "2026-05-19T10:00:00+02:00",
        end: "2026-05-19T13:00:00+02:00",
      },
    ],
  },
  {
    name: "James Okonkwo",
    role: "Founder",
    company: "StackRelay",
    interests: ["dev tools", "open source", "agent frameworks"],
    goals: "Find design partners for developer-focused agent tooling",
    availability: [
      {
        start: "2026-05-19T14:00:00+02:00",
        end: "2026-05-19T18:00:00+02:00",
      },
    ],
  },
  {
    name: "Anna Kowalski",
    role: "VP Sales",
    company: "Orbit CRM",
    interests: ["sales automation", "crm", "enterprise utility"],
    goals: "Connect with AI Week attendees evaluating sales agents",
    availability: [
      {
        start: "2026-05-19T09:30:00+02:00",
        end: "2026-05-19T12:00:00+02:00",
      },
    ],
  },
  {
    name: "David Park",
    role: "Research Scientist",
    company: "Politecnico Milano AI Lab",
    interests: ["multi-agent systems", "reasoning", "benchmarks"],
    goals: "Collaborate on applied multi-agent research demos",
    availability: [
      {
        start: "2026-05-19T15:00:00+02:00",
        end: "2026-05-19T18:00:00+02:00",
      },
    ],
  },
  {
    name: "Laura Bianchi",
    role: "Product Lead",
    company: "EventOS",
    interests: ["event tech", "networking products", "ux"],
    goals: "Meet founders building attendee networking experiences",
    availability: [
      {
        start: "2026-05-19T11:00:00+02:00",
        end: "2026-05-19T14:00:00+02:00",
      },
    ],
  },
  {
    name: "Tomás Rivera",
    role: "Angel Investor",
    company: "Independent",
    interests: ["pre-seed", "ai agents", "europe"],
    goals: "Meet technical founders before demo day",
    availability: [
      {
        start: "2026-05-19T16:00:00+02:00",
        end: "2026-05-19T18:00:00+02:00",
      },
    ],
  },
];

async function main() {
  const supabase = getServerClient();

  const { data: existing } = await supabase
    .from("attendees")
    .select("id")
    .neq("name", "Pending")
    .limit(1);

  if (existing && existing.length > 0) {
    console.log("Attendees already seeded — skipping (delete rows manually to re-seed).");
    return;
  }

  const { error } = await supabase.from("attendees").insert(
    SEED_ATTENDEES.map((a) => ({
      name: a.name,
      role: a.role,
      company: a.company,
      bio: `${a.role} at ${a.company}`,
      interests: a.interests,
      goals: a.goals,
      availability: a.availability,
    })),
  );

  if (error) {
    console.error("Seed failed:", error.message);
    process.exit(1);
  }

  console.log(`✓ Seeded ${SEED_ATTENDEES.length} attendees`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
