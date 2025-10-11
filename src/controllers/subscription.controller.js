import { asyncHandler } from "../utils/asyncHandler.js";
import { Subscription } from "../models/subscription.model.js";
import { User } from "../models/user.model.js";
import { isValidObjectId } from "mongoose";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";

const toggleSubscription = asyncHandler(async (req, res) => {
  const { channelId } = req.params;

  // Input validation
  if (!isValidObjectId(channelId)) {
    throw new ApiError(400, "Invalid channelId");
  }

  // Existence check
  const channel = await User.findById(channelId); // channelId = userId
  if (!channel) {
    throw new ApiError(
      400,
      "Invalid channelId ! No channel found with this id"
    );
  }

  // Check if already subscribed
  const existedSubscription = await Subscription.findOne({
    subscriber: req.user?._id,
    channel: channelId,
  });

  if (existedSubscription) {
    await Subscription.deleteOne({ _id: existedSubscription?._id });
    return res
      .status(200)
      .json(
        new ApiResponse(
          200,
          { isSubscribed: false },
          "channel unsubscribed successfully"
        )
      );
  }

  // If not subscribed then create new subscriber
  try {
    const newSubscription = await Subscription.create({
      subscriber: req.user?._id,
      channel: channelId,
    });

    return res
      .status(201)
      .json(
        new ApiResponse(
          201,
          { isSubscribed: true },
          "channel subscribed successfully"
        )
      );
  } catch (error) {
    throw new ApiError(
      500,
      "Internal server error. Could not toggle Subscription",
      error
    );
  }
});

// controller to return subscriber list of a channel
const getUserChannelSubscribers = asyncHandler(async (req, res) => {
  const { channelId } = req.params;
});

// controller to return channel list to which user has subscribed
const getSubscribedChannels = asyncHandler(async (req, res) => {
  const { subscriberId } = req.params;
});
export { toggleSubscription, getUserChannelSubscribers, getSubscribedChannels };
