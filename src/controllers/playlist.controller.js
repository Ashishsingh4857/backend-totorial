import mongoose, { isValidObjectId } from "mongoose";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { Playlist } from "../models/playlist.model.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { Video } from "../models/video.model.js";
const createPlaylist = asyncHandler(async (req, res) => {
  const { name, description } = req.body;
  //input validation
  if (!name) throw new ApiError(400, "name field is required");
  if (!description) throw new ApiError(400, "description field is required");
  try {
    const playlist = await Playlist.create({
      name,
      description,
      owner: req.user?._id,
    });
    return res
      .status(201)
      .json(new ApiResponse(201, playlist, "playlist created successfully"));
  } catch (error) {
    throw new ApiError(
      500,
      "internal server error.unable to create playlist",
      error
    );
  }
});

const getUserPlaylists = asyncHandler(async (req, res) => {
  const { userId } = req.params;
  //TODO: get user playlists
});

const getPlaylistById = asyncHandler(async (req, res) => {
  const { playlistId } = req.params;

  // Input validation
  if (!isValidObjectId(playlistId)) {
    throw new ApiError(400, "Invalid playlistId");
  }

  const pipeline = [
    {
      $match: { _id: new mongoose.Types.ObjectId(playlistId) },
    },
    {
      $lookup: {
        from: "videos",
        foreignField: "_id",
        localField: "videos",
        as: "videos",
      },
    },
  ];

  try {
    const result = await Playlist.aggregate(pipeline);
    if (result.length === 0) {
      throw new ApiError(404, "We can't find playlist with this Id");
    }

    return res
      .status(200)
      .json(new ApiResponse(200, result[0], "Fetched playlist successfully"));
  } catch (error) {
    throw new ApiError(
      500,
      "Internal server error. While fetching playlist",
      error
    );
  }
});

const addVideoToPlaylist = asyncHandler(async (req, res) => {
  const { playlistId, videoId } = req.params;

  // Input validation
  if (!isValidObjectId(playlistId)) {
    throw new ApiError(400, "Invalid playlistId");
  }

  // Existence check
  const playlist = await Playlist.findById(playlistId);
  if (!playlist) {
    throw new ApiError(404, "We can't find playlist with this Id");
  }

  // Check if the current user is the owner of the playlist
  if (playlist.owner.toString() !== req.user?._id.toString()) {
    throw new ApiError(
      403,
      "You are not authorized to add videos to this playlist"
    );
  }

  // Video existence check
  if (!isValidObjectId(videoId)) {
    throw new ApiError(400, "Invalid videoId");
  }
  const video = await Video.findById(videoId);
  if (!video) {
    throw new ApiError(404, "We can't find video with this Id");
  }

  // Check if video is already in the playlist
  if (playlist.videos.includes(videoId)) {
    throw new ApiError(400, "Video is already in the playlist");
  }

  // Update video playlist in db
  try {
    const updatedPlaylist = await Playlist.findByIdAndUpdate(
      playlistId,
      { $push: { videos: videoId } },
      { new: true }
    );

    return res
      .status(201)
      .json(
        new ApiResponse(
          201,
          updatedPlaylist,
          "Video added to playlist successfully"
        )
      );
  } catch (error) {
    throw new ApiError(
      500,
      "Internal server error. Failed to add video to playlist",
      error
    );
  }
});

const removeVideoFromPlaylist = asyncHandler(async (req, res) => {
  const { playlistId, videoId } = req.params;

  // Input validation
  if (!isValidObjectId(playlistId)) {
    throw new ApiError(400, "Invalid playlistId");
  }

  // Existence check
  const playlist = await Playlist.findById(playlistId);
  if (!playlist) {
    throw new ApiError(404, "Playlist not found");
  }

  // Check if the current user is the owner of the playlist
  if (playlist.owner.toString() !== req.user?._id.toString()) {
    throw new ApiError(
      403,
      "You are not authorized to remove videos from this playlist"
    );
  }

  // Video existence check
  if (!isValidObjectId(videoId)) {
    throw new ApiError(400, "Invalid videoId");
  }
  const video = await Video.findById(videoId);
  if (!video) {
    throw new ApiError(404, "Video not found");
  }

  // Update video playlist in db - remove video from playlist
  try {
    const updatedPlaylist = await Playlist.findByIdAndUpdate(
      playlistId,
      { $pull: { videos: videoId } },
      { new: true }
    );

    if (!updatedPlaylist) {
      throw new ApiError(500, "Failed to update playlist");
    }

    if (!playlist.videos.includes(videoId)) {
      return res
        .status(200)
        .json(
          new ApiResponse(200, updatedPlaylist, "Video is not in the playlist")
        );
    }

    return res
      .status(200)
      .json(
        new ApiResponse(
          200,
          updatedPlaylist,
          "Video removed from playlist successfully"
        )
      );
  } catch (error) {
    throw new ApiError(
      500,
      "Internal server error. Failed to remove video from playlist",
      error
    );
  }
});
const deletePlaylist = asyncHandler(async (req, res) => {
  const { playlistId } = req.params;
  // TODO: delete playlist
});

const updatePlaylist = asyncHandler(async (req, res) => {
  const { playlistId } = req.params;
  const { name, description } = req.body;
  //TODO: update playlist
});
export {
  createPlaylist,
  getUserPlaylists,
  getPlaylistById,
  addVideoToPlaylist,
  removeVideoFromPlaylist,
  deletePlaylist,
  updatePlaylist,
};
