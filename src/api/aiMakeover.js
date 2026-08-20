/**
 * Mock API Service for AI Avatar Makeover
 * Simulates sending a selfie to an AI model and receiving an 80s retro style avatar.
 */

export const generateAIAvatar = async (fileBase64) => {
  return new Promise((resolve, reject) => {
    // Simulate network delay and AI processing time
    setTimeout(() => {
      if (!fileBase64) {
        reject(new Error("No image provided."));
        return;
      }
      // Return a generated placeholder image matching the "80s style retro makeover" prompt
      resolve({
        success: true,
        message: "Avatar generated successfully!",
        imageUrl: "https://i.pravatar.cc/300?img=12" // Placeholder for an 80s looking avatar
      });
    }, 2500); // 2.5 second delay
  });
};
