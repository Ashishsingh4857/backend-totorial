import { Video } from "../models/video.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";
const getAllVideos = asyncHandler(async (req, res) => {
  const { page = 1, limit = 10, query, sortBy, sortType, userId } = req.query;
  //TODO: get all videos based on query, sort, pagination
});

const publishAVideo = asyncHandler(async (req, res) => {
  const { title, description, duration } = req.body;
  if (!title) {
    new ApiError(400, "title is required");
  }
  if (!description) {
    new ApiError(400, "description is required");
  }
  if (!duration) {
    new ApiError(400, "duration is required");
  }
  // get video, upload to cloudinary, create video
  const videoFileLocalPath = req.files?.videoFile?.[0]?.path;
  const thumbnailLocalPath = req.files?.thumbnail?.[0]?.path;

  if (!videoFileLocalPath) {
    new ApiError(400, "video file  is required");
  }
  if (!thumbnailLocalPath) {
    new ApiError(400, "thumbnail is required");
  }
  // upload local files in Cloudinary
  const video = await uploadOnCloudinary(videoFileLocalPath);
  const thumbnail = await uploadOnCloudinary(thumbnailLocalPath);
  if (!video.url) {
    new ApiError(500, "something went wrong");
  }
  if (!thumbnail.url) {
    new ApiError(500, "something went wrong");
  }
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

  if (!publishedVideo) {
    new ApiError(500, "something went wrong while uploading video");
  }
  return res
    .status(201)
    .json(new ApiResponse(200, publishedVideo, "video published successfully"));
});

const getVideoById = asyncHandler(async (req, res) => {
  const { videoId } = req.params;
  //TODO: get video by id
});

const updateVideo = asyncHandler(async (req, res) => {
  const { videoId } = req.params;
  //TODO: update video details like title, description, thumbnail
});

const deleteVideo = asyncHandler(async (req, res) => {
  const { videoId } = req.params;
  //TODO: delete video
});

const togglePublishStatus = asyncHandler(async (req, res) => {
  const { videoId } = req.params;
});

export {
  getAllVideos,
  publishAVideo,
  getVideoById,
  updateVideo,
  deleteVideo,
  togglePublishStatus,
};
