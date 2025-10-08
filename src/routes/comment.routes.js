import { Router } from "express";
import {
  addComment,
  getVideoComments,
  updateComment,
  deleteComment,
} from "../controllers/comment.controller.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";
const commentRouter = Router();
commentRouter.use(verifyJWT); // Apply verifyJWT middleware to all routes in this file
commentRouter.route("/:videoId").get(getVideoComments).post(addComment);
commentRouter.route("/c/:commentId").patch(updateComment).delete(deleteComment);
export default commentRouter;
