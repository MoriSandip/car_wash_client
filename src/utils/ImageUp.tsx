import {
  beginApiRequest,
  requestApiConfirmation,
} from "@/redux/api/requestUi";
import { API_BASE_URL } from "@/redux/api/baseApi";
import { store } from "@/redux/store";

type TImageUploadResult = {
  data: {
    url: string;
  };
};

const imageUpload = async (image: File): Promise<TImageUploadResult> => {
  const confirmed = await requestApiConfirmation("uploadImage");
  if (!confirmed) {
    throw new Error("Image upload was cancelled.");
  }

  if (
    !["image/jpeg", "image/png", "image/webp"].includes(image.type) ||
    image.size === 0 ||
    image.size > 5 * 1024 * 1024
  ) {
    throw new Error("Choose a JPEG, PNG, or WebP image up to 5 MB.");
  }
  const token = store.getState().auth.token;
  if (!token) {
    throw new Error("Sign in before uploading an image.");
  }

  const bytes = new Uint8Array(await image.arrayBuffer());
  let binary = "";
  for (let offset = 0; offset < bytes.length; offset += 0x8000) {
    binary += String.fromCharCode(...bytes.subarray(offset, offset + 0x8000));
  }

  const finishRequest = beginApiRequest();
  try {
    const response = await fetch(`${API_BASE_URL}/uploads/images`, {
      method: "POST",
      headers: {
        authorization: `Bearer ${token}`,
        "content-type": "application/json",
      },
      body: JSON.stringify({
        image: btoa(binary),
        mimeType: image.type,
      }),
    });
    if (!response.ok) {
      const error = (await response.json()) as { message?: string };
      throw new Error(error.message || "Image upload failed.");
    }

    const result = (await response.json()) as {
      success: boolean;
      message?: string;
      data?: unknown;
    };
    const uploadedImage = result.data;
    if (
      !result.success ||
      typeof uploadedImage !== "object" ||
      uploadedImage === null ||
      !("data" in uploadedImage) ||
      typeof uploadedImage.data !== "object" ||
      uploadedImage.data === null ||
      !("url" in uploadedImage.data) ||
      typeof uploadedImage.data.url !== "string"
    ) {
      throw new Error(result.message || "Image upload failed.");
    }

    return { data: { url: uploadedImage.data.url } };
  } finally {
    finishRequest();
  }
};

export default imageUpload;
