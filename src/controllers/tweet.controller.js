import { asyncHandler } from "../utils/asyncHandler.js";
import { Tweet } from "../models/tweet.model.js";
import mongoose, { isValidObjectId } from "mongoose";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
const createTweet = asyncHandler(async (req, res) => {
  const { content } = req.body;

  // Input validation
  if (!content || typeof content !== "string" || content.trim() === "") {
    throw new ApiError(400, "Content field is required");
  }
  //create tweet in db
  try {
    const newTweet = await Tweet.create({
      content: content.trim(),
      owner: req.user?._id,
    });

    return res
      .status(201)
      .json(new ApiResponse(201, newTweet, "Tweet created successfully"));
  } catch (error) {
    throw new ApiError(
      500,
      "Internal server error. Unable to create tweet",
      error
    );
  }
});

const getUserTweets = asyncHandler(async (req, res) => {
  const { userId } = req.params;
  // Input validation
  if (!isValidObjectId(userId)) {
    throw new ApiError(400, "Invalid userId");
  }

  const pipeline = [
    {
      $match: {
        owner: new mongoose.Types.ObjectId(userId),
      },
    },
    //join the users collection
    {
      $lookup: {
        from: "users",
        localField: "owner",
        foreignField: "_id",
        as: "ownerDetails",
        pipeline: [
          {
            $project: {
              username: 1,
              "avatar.url": 1,
            },
          },
        ],
      },
    },
    //join the likes collection
    {
      $lookup: {
        from: "likes",
        localField: "_id",
        foreignField: "tweet",
        as: "likeDetails", //return array
        pipeline: [
          {
            $project: {
              likedBy: 1,
            },
          },
        ],
      },
    },
    {
      $addFields: {
        likesCount: {
          $size: "$likeDetails", //count the likeDetails array
        },
        ownerDetails: {
          $first: "$ownerDetails", //add the first value of ownerDetails []
        },
        isLiked: {
          $cond: {
            if: { $in: [req.user?._id, "$likeDetails.likedBy"] }, //match the user  in like likeDetails.likedBy
            then: true,
            else: false,
          },
        },
      },
    },
    //sort by
    {
      $sort: {
        createdAt: -1,
      },
    },
    //field to include
    {
      $project: {
        content: 1,
        ownerDetails: 1,
        likesCount: 1,
        createdAt: 1,
        isLiked: 1,
      },
    },
  ];
  try {
    const userTweets = await Tweet.aggregate(pipeline);

    if (!userTweets || userTweets?.length === 0) {
      throw new ApiError(404, "No tweets found for the given user");
    }

    return res
      .status(200)
      .json(new ApiResponse(200, userTweets, "Tweets fetched successfully"));
  } catch (error) {
    throw new ApiError(
      500,
      "internal server error while fetching tweet",
      error
    );
  }
});

const updateTweet = asyncHandler(async (req, res) => {
  const { tweetId } = req.params;
  const { content } = req.body;

  // Input validation
  if (!isValidObjectId(tweetId)) {
    throw new ApiError(400, "Invalid tweetId");
  }

  if (!content || typeof content !== "string" || content.trim() === "") {
    throw new ApiError(400, "Content field is required");
  }
  //existence check ownership check
  const existingTweet = await Tweet.findOne({
    _id: tweetId,
    owner: req.user._id,
  });

  if (!existingTweet) {
    throw new ApiError(404, "Tweet not found or you don't have permission");
  }

  //update in db
  try {
    const updatedTweet = await Tweet.findByIdAndUpdate(
      tweetId,
      {
        $set: {
          content: content.trim(),
        },
      },
      {
        new: true,
      }
    );

    return res
      .status(200)
      .json(new ApiResponse(200, updatedTweet, "Tweet updated successfully"));
  } catch (error) {
    throw new ApiError(
      500,
      "Internal server error. Unable to update tweet",
      error
    );
  }
});

const deleteTweet = asyncHandler(async (req, res) => {
  const { tweetId } = req.params;
  // Input validation
  if (!isValidObjectId(tweetId)) {
    throw new ApiError(400, "Invalid tweetId");
  }
  //existence check ownership check
  const existingTweet = await Tweet.findOne({
    _id: tweetId,
    owner: req.user?._id,
  });
  if (!existingTweet) {
    throw new ApiError(404, "Tweet not found or you don't have permission");
  }
  try {
    await Tweet.deleteOne({ _id: tweetId });
    return res
      .status(200)
      .json(new ApiResponse(200, null, "tweet deleted successfully"));
  } catch (error) {
    throw new ApiError(
      500,
      "Internal server error. Unable to delete tweet",
      error
    );
  }
});

export { createTweet, getUserTweets, updateTweet, deleteTweet };
