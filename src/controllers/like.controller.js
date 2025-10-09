import { asyncHandler } from "../utils/asyncHandler.js";
import { isValidObjectId } from "mongoose";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { Video } from "../models/video.model.js";
import { Like } from "../models/like.model.js";
import { Comment } from "../models/comment.model.js";
import { Tweet } from "../models/tweet.model.js";

// Utility function to toggle likes for videos, comments, and tweets.
const toggleLike = async (req, res, type, id) => {
  // Input validation
  if (!isValidObjectId(id)) {
    throw new ApiError(400, `Invalid ${type}Id`);
  }

  // Existence check
  const model = type === "video" ? Video : type === "comment" ? Comment : Tweet;
  const item = await model.findById(id);
  if (!item) {
    throw new ApiError(404, `${type} not found`);
  }

  // Check if already liked
  const existingLike = await Like.findOne({
    [type]: id,
    "likedBy._id": req.user?._id,
  });

  if (existingLike) {
    // Check if the current user is the owner of the like
    if (existingLike.likedBy._id.toString() !== req.user?._id.toString()) {
      throw new ApiError(403, "You are not authorized to unlike this");
    }
    // When a user unlikes an item, the like is deleted from the database
    await Like.deleteOne({ _id: existingLike._id });
    return res
      .status(200)
      .json(
        new ApiResponse(200, { isLiked: false }, `${type} unliked successfully`)
      );
  }

  // Create like in database
  try {
    const newLike = await Like.create({
      likedBy: {
        _id: req.user?._id,
        username: req.user?.username,
      },
      [type]: id,
    });
    return res
      .status(201)
      .json(
        new ApiResponse(201, { isLiked: true }, `${type} liked successfully`)
      );
  } catch (error) {
    throw new ApiError(
      500,
      "Internal server error. Could not toggle like",
      error
    );
  }
};

const toggleVideoLike = asyncHandler(async (req, res) => {
  const { videoId } = req.params;
  await toggleLike(req, res, "video", videoId);
});

const toggleCommentLike = asyncHandler(async (req, res) => {
  const { commentId } = req.params;
  await toggleLike(req, res, "comment", commentId);
});

const toggleTweetLike = asyncHandler(async (req, res) => {
  const { tweetId } = req.params;

  await toggleLike(req, res, "Tweet", tweetId);
});

const getLikedVideos = asyncHandler(async (req, res) => {
  //TODO: get all liked videos
});

export { toggleCommentLike, toggleTweetLike, toggleVideoLike, getLikedVideos };
