import { Router } from "express";
import type { Request } from "express";
import { requireAuth, getAuthUser } from "../middleware/require-auth";
import { createCheckoutUrl, createCustomerPortalUrl } from "../lib/polar/polar";

const billingRouter = Router();

function getBaseUrl(req: Request): string {
  return `${req.protocol}://${req.get("host")}`;
}

billingRouter.post("/checkout", requireAuth, async (req, res, next) => {
  try {
    const user = getAuthUser(res);
    const url = await createCheckoutUrl({
      customerExternalId: user.id,
      requestUrl: getBaseUrl(req),
    });
    res.json({ url });
  } catch (error) {
    next(error);
  }
});

billingRouter.post("/portal", requireAuth, async (req, res, next) => {
  try {
    const user = getAuthUser(res);
    const url = await createCustomerPortalUrl({
      customerExternalId: user.id,
      requestUrl: getBaseUrl(req),
    });
    res.json({ url });
  } catch (error) {
    next(error);
  }
});

// public rehna chahiye: browser yahin redirect hota hai
billingRouter.get("/success", (_req, res) => {
  res.send("Done. You can close this tab and return to Nightcode.");
});

export default billingRouter;