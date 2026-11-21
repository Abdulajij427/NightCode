import type { RequestHandler } from "express";
import { getAvailableCreditsBalance } from "../lib/polar/polar";

export const requireCreditsBalance: RequestHandler = async (_req, res, next) => {
  const user = res.locals.authUser as { id: string } | undefined;

  if (!user) {
    res.status(401).json({ error: "Authentication required." });
    return;
  }

  let creditsBalance: number;
  try {
    creditsBalance = await getAvailableCreditsBalance(user.id);
  } catch {
    res.status(503).json({ error: "Unable to verify credits balance right now." });
    return;
  }

  if (creditsBalance <= 0) {
    res.status(402).json({ error: "No credits remaining. Run /upgrade to buy more credits." });
    return;
  }

  next();
};

























// import type { RequestHandler } from "express";
// import { getAvailableCreditsBalance } from "../lib/polar/polar";


// // type declaration
// declare global {
//   namespace Express {
//     interface Request {
//       userId?: string;
//     }
//   }
// }
// export {};




// // main middleware
// export const requireCreditsBalance: RequestHandler = async (req, res, next) => {
//   const userId = req.userId; // set earlier by your requireAuth middleware

//   if (!userId) {
//     res.status(401).json({ error: "Unauthorized" });
//     return;
//   }

//   let creditsBalance: number;
//   try {
//     creditsBalance = await getAvailableCreditsBalance(userId);
//   } catch {
//     res.status(503).json({ error: "Unable to verify credits balance right now." });
//     return;
//   }

//   // Simple launch-time gate: only start new work when the customer still has
//   // credits left. It does not reserve the full eventual cost of the request,
//   // so low-volume apps may tolerate small overspend on edge cases.
//   if (creditsBalance <= 0) {
//     res.status(402).json({ error: "No credits remaining. Run /upgrade to buy more credits." });
//     return;
//   }

//   next();
// };