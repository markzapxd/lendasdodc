import { z } from "zod";

const publicEnvironmentSchema = z.object({
  NEXT_PUBLIC_SUPABASE_URL: z.string().url(),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().min(1),
});

const { NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY } = process.env;

const parsedPublicEnvironment = publicEnvironmentSchema.safeParse({
  NEXT_PUBLIC_SUPABASE_URL,
  NEXT_PUBLIC_SUPABASE_ANON_KEY,
});

if (!parsedPublicEnvironment.success) {
  const invalidVariables = parsedPublicEnvironment.error.issues
    .map((issue) => issue.path[0])
    .filter((variable): variable is string => typeof variable === "string");
  const variableList = invalidVariables.join(", ") || "an unknown variable";

  throw new Error(`Invalid public environment configuration: ${variableList}.`);
}

export const publicEnv = parsedPublicEnvironment.data;
export type PublicEnv = typeof publicEnv;
