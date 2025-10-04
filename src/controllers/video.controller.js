import { Video } from "../models/video.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import {
  destroyOnCloudinary,
  uploadOnCloudinary,
} from "../utils/cloudinary.js";
const getAllVideos = asyncHandler(async (req, res) => {
  const {
    page = 1,
    limit = 10,
    sortBy = "createdAt",
    sortType = -1,
    title,
    userId,
    query,
  } = req.query;

  // get all videos based on query, sort, pagination
  // Input Validation
  if (isNaN(page) || page < 1) throw new ApiError(400, "Invalid page number");
  if (isNaN(limit) || limit < 1)
    throw new ApiError(400, "Invalid limit number");

  const validSortFields = ["createdAt", "title", "userId"]; // Add more fields as needed
  if (!validSortFields.includes(sortBy))
    throw new ApiError(400, "Invalid sort field");

  let mongoQuery = {};

  if (query) {
    // Assuming 'query' is a stringified JSON object
    try {
      const parsedQuery = JSON.parse(query);
      // Now you can use parsedQuery in your MongoDB query
      mongoQuery = { ...parsedQuery };
    } catch (error) {
      console.error("Error parsing query:", error);
      throw new ApiError(400, "Invalid query format");
    }
  }

  if (title) {
    if (typeof title !== "string") {
      throw new ApiError(400, "Invalid title format");
    }
    mongoQuery.title = title;
  }
  if (userId) mongoQuery.userId = userId;

  // Pagination
  const skip = (page - 1) * limit; // calculates how many items to skip

  try {
    const videos = await Video.find(mongoQuery)
      .skip(skip)
      .limit(limit)
      .sort({ [sortBy]: sortType });
    if (!videos) throw new ApiError(404, null, "no video found");

    return res
      .status(200)
      .json(new ApiResponse(200, videos, "videos fetching successfully"));
  } catch (error) {
    throw new ApiError(500, "ERROR:fetching videos");
  }
});

const publishAVideo = asyncHandler(async (req, res) => {
  const { title, description, duration } = req.body;
  if (!title) throw new ApiError(400, "title is required");

  if (!description) throw new ApiError(400, "description is required");

  if (!duration) throw new ApiError(400, "duration is required");

  // get video, upload to cloudinary, create video
  const videoFileLocalPath = req.files?.videoFile?.[0]?.path;
  const thumbnailLocalPath = req.files?.thumbnail?.[0]?.path;

  if (!videoFileLocalPath) throw new ApiError(400, "video file  is required");

  if (!thumbnailLocalPath) throw new ApiError(400, "thumbnail is required");

  // upload local files in Cloudinary
  const video = await uploadOnCloudinary(videoFileLocalPath);
  const thumbnail = await uploadOnCloudinary(thumbnailLocalPath);
  if (!video?.url) throw new ApiError(500, "something went wrong");

  if (!thumbnail.url) throw new ApiError(500, "something went wrong");

  //upload in database
  const createdVideo = await Video.create({
    title,
    description,
    duration,
    videoFile: video.url,
    thumbnail: thumbnail.url,
  });
  //check video is created
  const publishedVideo = await Video.findById(createdVideo._id);

  if (!publishedVideo)
    throw new ApiError(500, "something went wrong while uploading video");

  return res
    .status(201)
    .json(new ApiResponse(200, publishedVideo, "video published successfully"));
});

const getVideoById = asyncHandler(async (req, res) => {
  const { videoId } = req.params;
  if (!videoId) throw new ApiError(400, "VIDEO ID is required ");

  //find in db
  const videoExist = await Video.findById(videoId);
  if (!videoExist) throw new ApiError(404, "video not found");

  return res
    .status(200)
    .json(new ApiResponse(200, videoExist, "video fetch successfully"));
});

const updateVideo = asyncHandler(async (req, res) => {
  const { videoId } = req.params;
  //TODO: update video details like title, description, thumbnail
  if (!videoId) throw new ApiError(400, "VIDEO ID is required ");

  //check video is exist
  const videoExist = await Video.findById(videoId);
  if (!videoExist) throw new ApiError(400, "video does not exist");
  //files
  const thumbnailLocalPath = req.file?.path;
  if (!thumbnailLocalPath) throw new ApiError(400, "file is required");

  //update on Cloudinary
  const updatedThumbnail = await uploadOnCloudinary(thumbnailLocalPath);
  if (!updatedThumbnail?.url) throw new ApiError(500, "something went wrong");

  // todo : delete old file from Cloudinary
  const video = await Video.findByIdAndUpdate(videoId, {
    $set: { thumbnail: updatedThumbnail.url },
  });
  if (!video)
    throw new ApiError(500, "something went wrong while updating video");

  return res
    .status(200)
    .json(new ApiResponse(200, video, "video updated successfully"));
});

const deleteVideo = asyncHandler(async (req, res) => {
  const { videoId } = req.params;
  if (!videoId) throw new ApiError(400, "VIDEO ID is required ");

  const videoExist = await Video.findById(videoId);

  if (!videoExist) throw new ApiError(400, "video does not exist");
  await Video.deleteOne({ _id: videoExist?._id });
  return res
    .status(200)
    .json(new ApiResponse(200, {}, "video deleted successfully"));
});

const togglePublishStatus = asyncHandler(async (req, res) => {
  const { videoId } = req.params;
  const { isPublished } = req.body;
  if (!isPublished)
    throw new ApiError(400, "isPublished parameter is required");
  if (!videoId) throw new ApiError(400, "VIDEO ID is required ");
  //existence check
  const videoExist = await Video.findById(videoId);
  if (!videoExist) throw new ApiError(400, "video does not exist");
  const updatedVideo = await Video.findByIdAndUpdate(videoExist?._id, {
    $set: { isPublished: isPublished },
  });

  return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        { isPublished: updatedVideo.isPublished },
        "video publication status updated successfully"
      )
    );
});

export {
  getAllVideos,
  publishAVideo,
  getVideoById,
  updateVideo,
  deleteVideo,
  togglePublishStatus,
};
