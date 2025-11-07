import { XCircle } from "lucide-react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

interface RecommendationsCardProps {
  completion: string;
  isGenerating: boolean;
  error: Error | null;
  onRegenerate: () => void;
}

/**
 * Card component to display AI-generated training recommendations
 * Handles loading, error, content, and empty states
 */
export const RecommendationsCard = ({
  completion,
  isGenerating,
  error,
  onRegenerate,
}: RecommendationsCardProps) => {
  return (
    <Card className="mb-8">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Weekly Training Recommendation</CardTitle>
          <Button
            onClick={onRegenerate}
            disabled={isGenerating}
            className="bg-orange-500 hover:bg-orange-600"
          >
            {isGenerating ? "Generating..." : "Regenerate"}
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {/* Loading State */}
        {isGenerating && !completion && (
          <div className="space-y-4">
            <div className="h-4 bg-gray-200 rounded animate-pulse w-3/4"></div>
            <div className="h-4 bg-gray-200 rounded animate-pulse w-full"></div>
            <div className="h-4 bg-gray-200 rounded animate-pulse w-5/6"></div>
            <div className="h-4 bg-gray-200 rounded animate-pulse w-2/3"></div>
          </div>
        )}

        {/* Error State */}
        {error && !completion && (
          <Alert variant="destructive">
            <XCircle className="h-4 w-4" />
            <AlertTitle>Failed to generate recommendation</AlertTitle>
            <AlertDescription>
              {error.message}
              <Button
                onClick={onRegenerate}
                variant="link"
                className="mt-2 p-0 h-auto text-red-700 hover:text-red-800"
              >
                Try again →
              </Button>
            </AlertDescription>
          </Alert>
        )}

        {/* Streaming/Completed Content */}
        {completion && (
          <div className="prose prose-sm max-w-none prose-headings:font-semibold prose-h1:text-xl prose-h2:text-lg prose-h3:text-base prose-p:text-sm prose-p:leading-relaxed prose-ul:my-2 prose-ol:my-2 prose-li:my-1 prose-strong:text-gray-900 prose-strong:font-semibold">
            <ReactMarkdown remarkPlugins={[remarkGfm]}>
              {completion}
            </ReactMarkdown>
          </div>
        )}

        {/* Empty State */}
        {!isGenerating && !completion && !error && (
          <div className="text-center py-8">
            <p className="text-sm text-gray-600">
              Click &quot;Regenerate&quot; to get your personalized training
              recommendation
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
