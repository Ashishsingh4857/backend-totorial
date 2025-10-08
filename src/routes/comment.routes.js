import { Router } from "express";
import {
  addComment,
  getVideoComments,
  updateComment,
  deleteComment,
} from "../controllers/comment.controller";
import { verifyJWT } from "../middlewares/auth.middleware";
const commentRouter = Router();
app.use(verifyJWT); // Apply verifyJWT middleware to all routes in this file
commentRouter.route("/:videoId").get(getVideoComments).post(addComment);
commentRouter.route("/c/:commentId").patch(updateComment).delete(deleteComment);
export default commentRouter;
