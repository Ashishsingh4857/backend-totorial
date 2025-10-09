import { asyncHandler } from "../utils/asyncHandler.js";
import { isValidObjectId } from "mongoose";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { Comment } from "../models/comment.model.js";
import { Video } from "../models/video.model.js";
const getVideoComments = asyncHandler(async (req, res) => {
  //TODO: get all comments for a video
  const { videoId } = req.params;
  const { page = 1, limit = 10 } = req.query;
});

const addComment = asyncHandler(async (req, res) => {
  const { videoId } = req.params;
  const { content } = req.body;

  // Input validation
  if (!isValidObjectId(videoId)) {
    throw new ApiError(400, "Invalid videoId");
  }

  if (!content || typeof content !== "string") {
    throw new ApiError(400, "Content field is required");
  }

  // Existence check
  const video = await Video.findById(videoId);
  if (!video) {
    throw new ApiError(404, "Video not found");
  }

  // Add comment to DB
  try {
    const comment = await Comment.create({
      content: content.toString(),
      owner: req.user?._id,
      video: videoId,
    });

    return res
      .status(201)
      .json(new ApiResponse(201, comment, "Comment added successfully"));
  } catch (error) {
    throw new ApiError(500, "Failed to add comment", error);
  }
});

const updateComment = asyncHandler(async (req, res) => {
  const { commentId } = req.params;
  const { content } = req.body;

  // Input validation
  if (!isValidObjectId(commentId)) {
    throw new ApiError(400, "Invalid commentId");
  }

  if (!content || typeof content !== "string") {
    throw new ApiError(400, "Content field is required");
  }

  // Existence check and ownership
  const comment = await Comment.findOne({
    _id: commentId,
    owner: req.user?._id,
  });

  if (!comment) {
    throw new ApiError(404, "Comment not found or you don't have permission");
  }

  // Update comment
  try {
    const updatedComment = await Comment.findByIdAndUpdate(
      commentId,
      { $set: { content: content } },
      { new: true }
    );

    return res
      .status(200)
      .json(
        new ApiResponse(200, updatedComment, "Comment updated successfully")
      );
  } catch (error) {
    throw new ApiError(
      500,
      "Internal server error. Could not update comment",
      error
    );
  }
});
const deleteComment = asyncHandler(async (req, res) => {
  const { commentId } = req.params;

  // Input validation
  if (!isValidObjectId(commentId)) {
    throw new ApiError(400, "Invalid commentId");
  }
  // Existence check and ownership -videoOwner,commentOwner
  //id:commentId = true
  //owner: commentOwner or videoOwner

  const comment = await Comment.findOne({
    _id: commentId,
    $or: [
      { owner: req.user?._id }, // true if logged in user is a owner of the comment
      {
        video: {
          // true if logged in user is a owner of the video
          $in: await Video.find({
            owner: req.user?._id,
          }).distinct("_id"), //finding the unique value
        },
      },
    ],
  });

  if (!comment) {
    throw new ApiError(404, "Comment not found or you don't have permission");
  }
  try {
    await Comment.findByIdAndDelete(commentId);

    return res
      .status(200)
      .json(new ApiResponse(200, null, "Comment deleted successfully"));
  } catch (error) {
    throw new ApiError(500, "Internal server error", error);
  }
});
export { getVideoComments, addComment, updateComment, deleteComment };
