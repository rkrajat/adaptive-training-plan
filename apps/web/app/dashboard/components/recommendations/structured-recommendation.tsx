"use client";

import { useState, useMemo } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import {
  ChevronDown,
  ChevronUp,
  Lightbulb,
  Calendar,
  Target,
  Heart,
  Sparkles,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { cn } from "@/lib/utils";
import { DiffMarkdownRenderer } from "./diff-markdown-renderer";

interface OriginalPlanData {
  csvContent: string;
  currentWeek: number;
  startDate: string;
}

interface StructuredRecommendationProps {
  markdown: string;
  originalPlan?: OriginalPlanData;
}

interface ParsedSection {
  id: string;
  title: string;
  icon: React.ReactNode;
  content: string;
  colorClass: string;
}

/**
 * Parse recommendation markdown into structured sections
 */
const parseRecommendation = (markdown: string): ParsedSection[] => {
  const sections: ParsedSection[] = [];

  // Define section patterns (case-insensitive)
  const sectionPatterns = [
    {
      id: "summary",
      patterns: [/###?\s*(?:\ud83c\udfaf\s*)?Summary/i, /###?\s*(?:\ud83d\udcdd\s*)?Overview/i],
      title: "Summary",
      icon: <Sparkles className="h-4 w-4" />,
      colorClass: "text-purple-600 dark:text-purple-400",
    },
    {
      id: "modified-plan",
      patterns: [/###?\s*(?:\ud83d\uddd3\ufe0f?\s*)?Modified Training Plan/i],
      title: "Modified Training Plan",
      icon: <Calendar className="h-4 w-4" />,
      colorClass: "text-blue-600 dark:text-blue-400",
    },
    {
      id: "key-focus",
      patterns: [
        /###?\s*(?:\ud83c\udfaf\s*)?Key (?:Workout )?Focus/i,
        /###?\s*(?:\u2b50\s*)?Priority Workouts?/i,
        /###?\s*(?:\ud83d\udcaa\s*)?Important Workouts?/i,
      ],
      title: "Key Focus",
      icon: <Target className="h-4 w-4" />,
      colorClass: "text-amber-600 dark:text-amber-400",
    },
    {
      id: "recovery",
      patterns: [
        /###?\s*(?:\ud83d\udc9a\s*)?Recovery/i,
        /###?\s*(?:\ud83d\ude34\s*)?Rest/i,
        /###?\s*(?:\u2764\ufe0f?\s*)?Health/i,
      ],
      title: "Recovery Notes",
      icon: <Heart className="h-4 w-4" />,
      colorClass: "text-green-600 dark:text-green-400",
    },
    {
      id: "rationale",
      patterns: [
        /###?\s*(?:\ud83d\udca1\s*)?Rationale/i,
        /###?\s*(?:\ud83d\udd0d\s*)?Reasoning/i,
        /###?\s*(?:\ud83e\udde0\s*)?Analysis/i,
        /###?\s*(?:Why|What\'?s? Changed)/i,
      ],
      title: "Rationale",
      icon: <Lightbulb className="h-4 w-4" />,
      colorClass: "text-orange-600 dark:text-orange-400",
    },
  ];

  // Find all section matches and their positions
  const matches: Array<{
    id: string;
    title: string;
    icon: React.ReactNode;
    colorClass: string;
    start: number;
    headerEnd: number;
    matchText: string;
  }> = [];

  for (const section of sectionPatterns) {
    for (const pattern of section.patterns) {
      const match = markdown.match(pattern);
      if (match && match.index !== undefined) {
        matches.push({
          id: section.id,
          title: section.title,
          icon: section.icon,
          colorClass: section.colorClass,
          start: match.index,
          headerEnd: match.index + match[0].length,
          matchText: match[0],
        });
        break; // Only use first matching pattern
      }
    }
  }

  // Sort matches by position
  matches.sort((a, b) => a.start - b.start);

  // Extract content for each section
  for (let idx = 0; idx < matches.length; idx++) {
    const match = matches[idx];
    const nextMatch = matches[idx + 1];
    const contentStart = match.headerEnd;
    const contentEnd = nextMatch ? nextMatch.start : markdown.length;
    const content = markdown.slice(contentStart, contentEnd).trim();

    if (content) {
      sections.push({
        id: match.id,
        title: match.title,
        icon: match.icon,
        content,
        colorClass: match.colorClass,
      });
    }
  }

  // If no sections found, return the whole content as "Details"
  if (sections.length === 0 && markdown.trim()) {
    sections.push({
      id: "details",
      title: "Recommendation Details",
      icon: <Sparkles className="h-4 w-4" />,
      content: markdown,
      colorClass: "text-foreground",
    });
  }

  return sections;
};

/**
 * Extract a one-line summary from the recommendation
 */
const extractSummary = (markdown: string): string | null => {
  // Look for the first paragraph after any heading
  const lines = markdown.split("\n");
  let foundHeading = false;

  for (const line of lines) {
    const trimmed = line.trim();

    // Skip empty lines
    if (!trimmed) continue;

    // Skip headings
    if (trimmed.startsWith("#")) {
      foundHeading = true;
      continue;
    }

    // Skip table rows
    if (trimmed.startsWith("|")) continue;

    // Found a paragraph-like line after heading
    if (foundHeading) {
      // Strip markdown formatting for summary
      const plainText = trimmed
        .replace(/\*\*(.*?)\*\*/g, "$1") // Bold
        .replace(/\*(.*?)\*/g, "$1") // Italic
        .replace(/`(.*?)`/g, "$1") // Code
        .replace(/\[(.*?)\]\(.*?\)/g, "$1"); // Links

      // Limit length
      if (plainText.length > 150) {
        return plainText.slice(0, 147) + "...";
      }
      return plainText;
    }
  }

  return null;
};

/**
 * Collapsible Section Component
 */
const SectionBlock = ({
  section,
  defaultOpen = true,
  isModifiedPlan = false,
  originalPlan,
}: {
  section: ParsedSection;
  defaultOpen?: boolean;
  isModifiedPlan?: boolean;
  originalPlan?: OriginalPlanData;
}) => {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen}>
      <CollapsibleTrigger asChild>
        <Button
          variant="ghost"
          className="w-full justify-between p-3 h-auto hover:bg-muted/50"
        >
          <span className={cn("flex items-center gap-2 font-medium", section.colorClass)}>
            {section.icon}
            {section.title}
          </span>
          {isOpen ? (
            <ChevronUp className="h-4 w-4 text-muted-foreground" />
          ) : (
            <ChevronDown className="h-4 w-4 text-muted-foreground" />
          )}
        </Button>
      </CollapsibleTrigger>
      <CollapsibleContent className="px-3 pb-3">
        {isModifiedPlan && originalPlan ? (
          <DiffMarkdownRenderer
            markdown={`### Modified Training Plan\n${section.content}`}
            originalPlan={originalPlan}
          />
        ) : (
          <div className="prose prose-sm max-w-none dark:prose-invert prose-headings:font-semibold prose-p:text-sm prose-p:leading-relaxed prose-ul:my-2 prose-li:my-1">
            <ReactMarkdown remarkPlugins={[remarkGfm]}>
              {section.content}
            </ReactMarkdown>
          </div>
        )}
      </CollapsibleContent>
    </Collapsible>
  );
};

/**
 * Structured Recommendation Component
 * Parses AI recommendation markdown and displays it in organized, collapsible sections
 */
export const StructuredRecommendation = ({
  markdown,
  originalPlan,
}: StructuredRecommendationProps) => {
  const sections = useMemo(() => parseRecommendation(markdown), [markdown]);
  const quickSummary = useMemo(() => extractSummary(markdown), [markdown]);

  // Determine which sections should be open by default
  const getDefaultOpen = (sectionId: string) => {
    // Key sections open by default
    return ["summary", "modified-plan", "key-focus"].includes(sectionId);
  };

  if (sections.length === 0) {
    return (
      <div className="text-sm text-muted-foreground">
        No recommendation content available.
      </div>
    );
  }

  // If there's only one section and it's the fallback "details", render it directly
  if (sections.length === 1 && sections[0].id === "details") {
    return (
      <DiffMarkdownRenderer markdown={markdown} originalPlan={originalPlan} />
    );
  }

  return (
    <div className="space-y-2.5 sm:space-y-4">
      {/* Quick Summary Card */}
      {/* {quickSummary && (
        <div className="p-3 rounded-lg bg-purple-50 dark:bg-purple-950/20 border border-purple-200 dark:border-purple-800">
          <div className="flex items-start gap-2">
            <Sparkles className="h-4 w-4 text-purple-600 dark:text-purple-400 mt-0.5 flex-shrink-0" />
            <p className="text-sm text-purple-800 dark:text-purple-200 leading-relaxed">
              {quickSummary}
            </p>
          </div>
        </div>
      )} */}

      {/* Structured Sections */}
      <div className="border rounded-lg divide-y divide-border">
        {sections.map((section) => (
          <SectionBlock
            key={section.id}
            section={section}
            defaultOpen={getDefaultOpen(section.id)}
            isModifiedPlan={section.id === "modified-plan"}
            originalPlan={originalPlan}
          />
        ))}
      </div>
    </div>
  );
};
