import { asyncHandler } from "../utils/asyncHandler.js";
import mongoose, { isValidObjectId } from "mongoose";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { Comment } from "../models/comment.model.js";
import { Video } from "../models/video.model.js";
const getVideoComments = asyncHandler(async (req, res) => {
  const { videoId } = req.params;
  const { page = 1, limit = 10 } = req.query;

  // Input validation
  if (!isValidObjectId(videoId)) {
    throw new ApiError(400, "Invalid videoId");
  }

  if (isNaN(page) || page < 1) throw new ApiError(400, "Invalid page number");
  if (isNaN(limit) || limit < 1)
    throw new ApiError(400, "Invalid limit number");

  // Check if video exists
  const video = await Video.findById(videoId);
  if (!video) {
    throw new ApiError(404, "Video not found");
  }

  // Pipeline construction
  const pipeline = [
    //1st pipeline
    //This stage filters the comments to only include those that belong to the specified video.
    { $match: { video: new mongoose.Types.ObjectId(videoId) } },
    //2nd pipeline
    //join the users collection to populate the owner field.
    {
      $lookup: {
        from: "users",
        foreignField: "_id",
        localField: "owner",
        as: "owner",
      },
    },
    //3rd pipeline
    //join with the likes collection to populate the likes field.
    {
      $lookup: {
        from: "likes",
        foreignField: "comment",
        localField: "_id",
        as: "likes",
      },
    },
    //4th pipeline
    //
    {
      $addFields: {
        likesCount: { $size: "$likes" },
        owner: { $first: "$owner" },
        isLiked: {
          $cond: {
            if: { $in: [req.user?._id, "$likes.likedBy"] },
            then: true,
            else: false,
          },
        },
      },
    },
    //5th pipeline
    { $sort: { createdAt: -1 } },
    //6th pipeline
    // This stage divides the pipeline into two branches: metadata and data. The metadata branch calculates the total count of comments, while the data branch paginates the comments.
    {
      $facet: {
        metadata: [{ $count: "total" }],
        data: [
          { $skip: (page - 1) * limit },
          { $limit: parseInt(limit) },
          {
            $project: {
              content: 1,
              createdAt: 1,
              likesCount: 1,
              owner: {
                username: 1,
                fullName: 1,
                "avatar.url": 1,
              },
              isLiked: 1,
            },
          },
        ],
      },
    },
  ];

  try {
    const comments = await Comment.aggregate(pipeline);
    if (!comments || comments[0].data.length === 0) {
      throw new ApiError(404, "No comments found");
    }

    return res.status(200).json(
      new ApiResponse(
        200,
        {
          comments: comments[0].data,
          pagination: {
            currentPage: parseInt(page),
            limit: parseInt(limit),
            totalComments: comments[0].metadata[0].total,
          },
        },
        "Comments fetched successfully"
      )
    );
  } catch (error) {
    throw new ApiError(
      500,
      "Internal server error while fetching comments",
      error
    );
  }
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
