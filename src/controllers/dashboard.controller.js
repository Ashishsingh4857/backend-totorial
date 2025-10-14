import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { Video } from "../models/video.model.js";
import mongoose from "mongoose";
import { Subscription } from "../models/subscription.model.js";
// Service functions
const getChannelStats = async (userID) => {
  //get channel stats  total views,total,likes,total,videos
  const pipeline = [
    {
      $match: { owner: new mongoose.Types.ObjectId(userID) },
    },
    {
      $lookup: {
        from: "likes",
        foreignField: "video",
        localField: "_id",
        as: "likes",
      },
    },
    {
      $group: {
        _id: null,
        totalVideos: { $sum: 1 },
        totalViews: { $sum: "$views" },
        totalLikes: { $sum: { $size: "$likes" } },
      },
    },
  ];

  const result = await Video.aggregate(pipeline);
  return result[0];
};
//get channel videos
const getChannelVideos = async (userID) => {
  const pipeline = [
    {
      $match: { owner: new mongoose.Types.ObjectId(userID) },
    },
    {
      $lookup: {
        from: "likes",
        foreignField: "video",
        localField: "_id",
        as: "likes",
      },
    },
    {
      $addFields: {
        createdAt: { $dateToParts: { date: "$createdAt" } },
        likesCount: { $size: "$likes" },
      },
    },
    {
      $project: {
        _id: 1,
        "videoFile.url": 1,
        "thumbnail.url": 1,
        title: 1,
        description: 1,
        createdAt: { year: 1, month: 1, day: 1 },
        views: 1,
        isPublished: 1,
        likesCount: 1,
      },
    },
  ];

  const videos = await Video.aggregate(pipeline);
  return videos;
};
//get channel subscribers
const getTotalSubscribers = async (userID) => {
  const count = await Subscription.countDocuments({ channel: userID });
  return count;
};
//controllers
const getChannelStatsController = asyncHandler(async (req, res) => {
  const userID = req.user?._id;
  try {
    const stats = await getChannelStats(userID);
    const totalSubscribers = await getTotalSubscribers(userID);

    return res
      .status(200)
      .json(
        new ApiResponse(
          200,
          { stats, totalSubscribers },
          "Channel stats fetched successfully"
        )
      );
  } catch (error) {
    throw new ApiError(
      500,
      "internal server error.while fetching Channel stats",
      error
    );
  }
});

const getChannelVideosController = asyncHandler(async (req, res) => {
  const userID = req.user?._id;
  try {
    const videos = await getChannelVideos(userID);

    if (!videos || videos.length === 0) {
      return res
        .status(404)
        .json(new ApiResponse(404, null, "No videos found"));
    }

    return res
      .status(200)
      .json(new ApiResponse(200, videos, "Videos fetched successfully"));
  } catch (error) {
    throw new ApiError(
      500,
      "internal server error.while fetching Channel videos",
      error
    );
  }
});

export { getChannelStatsController, getChannelVideosController };
