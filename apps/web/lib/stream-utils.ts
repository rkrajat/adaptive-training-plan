/**
 * Utilities for handling streamed AI responses with embedded metadata
 */

interface RecommendationMetadata {
  recommendationId: string | null;
  cleanContent: string;
}

/**
 * Extracts recommendation metadata from streamed response content
 *
 * The backend appends metadata at the end of the AI-generated content
 * in the format: __META__:recId=<mongodb_object_id>
 *
 * This function:
 * 1. Extracts the recommendation ID from the metadata
 * 2. Returns the clean content with metadata removed
 *
 * @param content - The full streamed content including metadata
 * @returns Object with recommendationId and cleanContent
 *
 * @example
 * const result = extractRecommendationMetadata(
 *   "AI recommendation text...__META__:recId=67abc123..."
 * );
 * // result.recommendationId = "67abc123..."
 * // result.cleanContent = "AI recommendation text..."
 */
export const extractRecommendationMetadata = (
  content: string,
): RecommendationMetadata => {
  // Match the metadata pattern at the end of content
  // MongoDB ObjectIds are 24 character hex strings
  const metadataPattern = /__META__:recId=([a-f0-9]{24})$/;
  const match = content.match(metadataPattern);

  if (match) {
    const recommendationId = match[1];
    // Remove metadata from content and trim any trailing whitespace
    const cleanContent = content.replace(metadataPattern, "").trimEnd();

    return {
      recommendationId,
      cleanContent,
    };
  }

  // No metadata found - return original content
  return {
    recommendationId: null,
    cleanContent: content,
  };
};
