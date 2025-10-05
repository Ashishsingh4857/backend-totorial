import { v2 as cloudinary } from "cloudinary";
import fs from "fs";
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});
// method to upload files on cloudinary
export const uploadOnCloudinary = async (
  localFilePath,
  resource_type = "auto"
) => {
  if (!localFilePath) return null;

  try {
    const response = await cloudinary.uploader.upload(localFilePath, {
      resource_type,
    });

    fs.unlinkSync(localFilePath); // remove the locally saved temporary file as the upload operation got successful
    console.log("Upload completed: File deleted successfully", response);

    return response;
  } catch (error) {
    fs.unlinkSync(localFilePath); // remove the locally saved temporary file as the upload operation got failed
    console.error("Upload failed:", error);
    return null;
  }
};

export const destroyOnCloudinary = async (
  public_id,
  resource_type = "auto"
) => {
  if (!public_id) return null;
  try {
    const response = await cloudinary.uploader.destroy(public_id, {
      resource_type,
    });

    return response;
  } catch (error) {
    console.error("Error while destroying file on Cloudinary:", error);
    return null;
  }
};
