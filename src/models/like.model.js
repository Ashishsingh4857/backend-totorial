import mongoose, { Schema } from "mongoose";
const likeSchema = new Schema(
  {
    video: { type: Schema.Types.ObjectId, ref: "Video" },
    comment: { type: Schema.Types.ObjectId, ref: "Comment" },
    likedBy: {
      _id: {
        type: Schema.Types.ObjectId,
        ref: "User",
        required: true,
      },
      username: {
        type: String,
      },
    },
    tweet: { type: Schema.Types.ObjectId, ref: "Tweet" },
  },
  { timestamps: true }
);
export const Like = mongoose.model("Like", likeSchema);
