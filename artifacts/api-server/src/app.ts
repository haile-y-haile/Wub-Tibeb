import express, { type Express } from "express";
import cors from "cors";
import pinoHttp from "pino-http";
import router from "./routes";
import { logger } from "./lib/logger";
import { clerkMiddleware } from "@clerk/express";
import { publishableKeyFromHost } from "@clerk/shared/keys";
import { CLERK_PROXY_PATH, clerkProxyMiddleware, getClerkProxyHost } from "./middlewares/clerkProxyMiddleware";
import { MarketError } from "./lib/marketplace";
import type { Request, Response, NextFunction } from "express";

const app: Express = express();

app.use(
  pinoHttp({
    logger,
    serializers: {
      req(req) {
        return {
          id: req.id,
          method: req.method,
          url: req.url?.split("?")[0],
        };
      },
      res(res) {
        return {
          statusCode: res.statusCode,
        };
      },
    },
  }),
);
app.use(CLERK_PROXY_PATH, clerkProxyMiddleware());
app.use(cors({ origin: false }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(clerkMiddleware((req) => ({
  publishableKey: publishableKeyFromHost(getClerkProxyHost(req) ?? "", process.env.CLERK_PUBLISHABLE_KEY),
})));
app.use("/api", (req,res,next) => {
  res.setHeader("Cache-Control","no-store");
  res.setHeader("X-Content-Type-Options","nosniff");
  const origin=req.get("origin");
  const host=req.get("x-forwarded-host") ?? req.get("host");
  if(!["GET","HEAD","OPTIONS"].includes(req.method) && origin && new URL(origin).host!==host) {
    res.status(403).json({error:"Cross-origin request rejected"}); return;
  }
  next();
});

app.use("/api", router);
app.use((err: any, req: Request,res: Response,_next: NextFunction) => {
  if(err?.name==="ZodError") {res.status(400).json({error:"Invalid input",details:err.issues});return;}
  if(err instanceof MarketError) {res.status(err.status).json({error:err.message});return;}
  req.log.error({err},"Request failed");
  res.status(500).json({error:"Something went wrong. Please try again."});
});

export default app;
