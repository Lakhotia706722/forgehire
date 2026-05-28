import { FastifyInstance } from "fastify";
import { z } from "zod";
import { authenticate, requireCompany } from "../middleware/auth";
import { getPrismaClient } from "../config/database";
import { successResponse } from "@neuronhire/shared";

const smartMatchSchema = z.object({
  problemStatement: z.string().min(20),
  limit: z.number().int().min(1).max(20).optional(),
});

const hiringMatchQuerySchema = z.object({
  jobRequirements: z.string().min(10),
  budgetMin: z.coerce.number().min(0).optional(),
  budgetMax: z.coerce.number().min(0).optional(),
});

function tokenize(text: string): string[] {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .split(/\s+/)
    .filter((w) => w.length > 2);
}

function availabilityConfidence(status: string): "high" | "medium" | "low" {
  if (status === "available_now") return "high";
  if (status === "available_in_weeks") return "medium";
  return "low";
}

export async function engineerHiringRoutes(
  fastify: FastifyInstance,
): Promise<void> {
  const prisma = getPrismaClient();

  // Smart match mode: top engineers for a problem statement
  fastify.post(
    "/engineers/smart-match",
    { preHandler: [authenticate, requireCompany] },
    async (request: any) => {
      const body = smartMatchSchema.parse(request.body);
      const tokens = tokenize(body.problemStatement);
      const engineers = await prisma.engineerProfile.findMany({
        where: {
          user: { role: "engineer" },
          availabilityStatus: { in: ["available_now", "available_in_weeks"] },
        },
        include: {
          skills: { select: { skillName: true } },
        },
        take: 100,
      });

      const ranked = engineers
        .map((engineer) => {
          const skillNames = engineer.skills.map((s) => s.skillName);
          const skillTokens = tokenize(skillNames.join(" "));
          const profileTokens = tokenize(
            `${engineer.headline ?? ""} ${engineer.bio ?? ""}`,
          );
          const overlap = tokens.filter(
            (t) => skillTokens.includes(t) || profileTokens.includes(t),
          );
          const score = Math.min(
            100,
            Math.round(overlap.length * 8 + engineer.neuronScore / 20),
          );
          return {
            id: engineer.id,
            fullName: engineer.fullName,
            headline: engineer.headline,
            neuronScore: engineer.neuronScore,
            neuronTier: engineer.neuronTier,
            hourlyRate: Number(engineer.hourlyRate ?? 0),
            availabilityStatus: engineer.availabilityStatus,
            skills: skillNames,
            matchScore: score,
            recommendationReason:
              overlap.length > 0
                ? `Strong overlap in ${overlap.slice(0, 3).join(", ")}`
                : "High NeuronScore and relevant AI profile",
          };
        })
        .sort((a, b) => b.matchScore - a.matchScore)
        .slice(0, body.limit ?? 5);

      return successResponse(ranked);
    },
  );

  // Hiring match insight for one engineer
  fastify.get(
    "/engineers/:id/hiring-match",
    { preHandler: [authenticate, requireCompany] },
    async (request: any, reply) => {
      const { id } = request.params as { id: string };
      const query = hiringMatchQuerySchema.parse(request.query);
      const engineer = await prisma.engineerProfile.findUnique({
        where: { id },
        include: { skills: { select: { skillName: true } } },
      });
      if (!engineer) {
        return reply.code(404).send({ success: false, error: "Engineer not found" });
      }

      const reqTokens = tokenize(query.jobRequirements);
      const skillNames = engineer.skills.map((s) => s.skillName);
      const lowerSkills = skillNames.map((s) => s.toLowerCase());
      const matchedSkills = skillNames.filter((s) =>
        reqTokens.some((t) => s.toLowerCase().includes(t)),
      );
      const missingSkills = reqTokens.filter(
        (t) => !lowerSkills.some((s) => s.includes(t)),
      );
      const skillMatchScore =
        reqTokens.length > 0
          ? Math.round((matchedSkills.length / reqTokens.length) * 100)
          : 0;

      const rate = Number(engineer.hourlyRate ?? 0);
      let budgetFit: "within_range" | "above_budget" | "below_market" =
        "within_range";
      if (query.budgetMax != null && rate > query.budgetMax) budgetFit = "above_budget";
      else if (query.budgetMin != null && rate < query.budgetMin)
        budgetFit = "below_market";

      const availability = availabilityConfidence(engineer.availabilityStatus);

      return successResponse({
        skillMatchScore,
        matchedSkills,
        missingSkills,
        budgetFit,
        availabilityConfidence: availability,
        recommendationReason:
          matchedSkills.length > 0
            ? `${matchedSkills.slice(0, 3).join(", ")} align with your requirements`
            : "Limited explicit keyword overlap; review portfolio manually",
      });
    },
  );
}

