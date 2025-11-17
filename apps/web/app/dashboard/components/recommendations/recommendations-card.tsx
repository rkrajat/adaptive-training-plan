import { XCircle } from "lucide-react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

import { FeedbackButton } from "../feedback";

interface RecommendationsCardProps {
  completion: string;
  isGenerating: boolean;
  error: Error | null;
  onRegenerate: () => void;
  recommendationId?: string;
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
  recommendationId,
}: RecommendationsCardProps) => {
  return (
    <Card className="mb-6 sm:mb-8">
      <CardHeader>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-0">
          <CardTitle className="text-lg sm:text-xl">
            Weekly Training Recommendation
          </CardTitle>
          <div className="flex flex-col sm:flex-row gap-2 sm:gap-0">
            {/* Feedback Button */}
            {recommendationId && !isGenerating && (
              <div className="mr-3">
                <FeedbackButton recommendationId={recommendationId} />
              </div>
            )}
            <Button
              onClick={onRegenerate}
              disabled={isGenerating}
              className="bg-orange-500 hover:bg-orange-600 w-full sm:w-auto"
              size="sm"
            >
              {isGenerating
                ? "Generating..."
                : completion
                ? "Regenerate"
                : "Get Recommendations"}
            </Button>
          </div>
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
          <div className="space-y-4">
            <div className="prose prose-sm sm:prose-base max-w-none prose-headings:font-semibold prose-h1:text-lg sm:prose-h1:text-xl prose-h2:text-base sm:prose-h2:text-lg prose-h3:text-sm sm:prose-h3:text-base prose-p:text-xs sm:prose-p:text-sm prose-p:leading-relaxed prose-ul:my-2 prose-ol:my-2 prose-li:my-1 prose-strong:text-gray-900 prose-strong:font-semibold overflow-hidden break-words">
              <div className="overflow-x-auto break-words">
                <ReactMarkdown
                  remarkPlugins={[remarkGfm]}
                  components={{
                    p: ({ children }) => (
                      <p className="break-words">{children}</p>
                    ),
                    li: ({ children }) => (
                      <li className="break-words">{children}</li>
                    ),
                    code: ({ children, className }) => {
                      const isInline = !className;
                      return isInline ? (
                        <code className="break-words bg-gray-100 px-1 py-0.5 rounded text-xs">
                          {children}
                        </code>
                      ) : (
                        <code className="block overflow-x-auto bg-gray-100 p-2 rounded text-xs whitespace-pre">
                          {children}
                        </code>
                      );
                    },
                    pre: ({ children }) => (
                      <pre className="overflow-x-auto bg-gray-100 p-2 rounded text-xs whitespace-pre-wrap break-words">
                        {children}
                      </pre>
                    ),
                  }}
                >
                  {completion}
                </ReactMarkdown>
              </div>
            </div>
          </div>
        )}

        {/* Empty State */}
        {!isGenerating && !completion && !error && (
          <div className="text-center py-8">
            <p className="text-sm text-gray-600">
              Click &quot;Get Recommendations&quot; to get your personalized
              training recommendation
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
