import { Router, type IRouter } from "express";
import healthRouter from "./health";
import listingsRouter from "./listings";
import exchangesRouter from "./exchanges";
import safetyRouter from "./safety";
import storageRouter from "./storage";

const router: IRouter = Router();

router.use(healthRouter);
router.use(listingsRouter);
router.use(exchangesRouter);
router.use(safetyRouter);
router.use(storageRouter);

export default router;
