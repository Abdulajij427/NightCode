// Keep Bun's watch root at the monorepo root so shared workspace files,
// including Prisma's generated client, are watched during development.
import "./packages/server/src/index";
