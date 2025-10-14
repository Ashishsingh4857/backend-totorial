import { Router } from "express";
import {
  getChannelStatsController,
  getChannelVideosController,
} from "../controllers/dashboard.controller.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";

const dashboardRouter = Router();

dashboardRouter.use(verifyJWT); // Apply verifyJWT middleware to all routes in this file

dashboardRouter.route("/stats").get(getChannelStatsController);
dashboardRouter.route("/videos").get(getChannelVideosController);

export default dashboardRouter;
