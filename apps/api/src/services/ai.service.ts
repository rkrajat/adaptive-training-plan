import type { ExperienceLevel, TrainingPaces } from "@adaptive-training-plan/types";
import { groupTrainingPlanByWeek } from "@adaptive-training-plan/utils";
import { openai } from "@ai-sdk/openai";
import { generateObject, generateText, streamText } from "ai";

import { config } from "../config";
import {
  TrainingPlanSchema,
  type TrainingPlan,
  type TrainingPlanRow,
} from "../schemas/training-plan-row.schema";
import type {
  FormattedActivity,
  StravaActivity,
  EnhancedFormattedActivity,
} from "../types/strava.types";
import { InternalServerError } from "../utils/error";
import { log } from "../utils/logger";
import { formatPace } from "../utils/pace-formatter";
import { saveTokenUsage } from "../utils/token-usage-tracker";

/**
 * Training status types for status indicator
 */
export type TrainingStatusType = "on_track" | "slightly_off_track" | "off_track";

/**
 * Training status response from AI
 */
export interface TrainingStatusResult {
  status: TrainingStatusType;
  rationale: string;
  confidence: number;
}

/**
 * AI Service
 * Handles AI-powered recommendations using Vercel AI SDK
 */
export class AIService {
  /**
   * Get OpenAI model instance
   * @param modelId - Model ID string
   * @returns OpenAI language model instance
   */
  private getOpenAIModel(modelId: string) {
    return openai(modelId);
  }

  /**
   * Get model options for PDF parsing calls
   * @returns Model options object with low reasoning effort and text verbosity
   */
  private getPdfParsingModelOptions() {
    return {
      reasoningEffort: "medium" as const,
      textVerbosity: "low" as const,
      seed: 42,
    };
  }
  /**
   * Build the system prompt for training recommendations
   */
  private buildSystemPrompt(): string {
    //     return `You are an expert running coach who helps athletes adjust their training plans based on recent performance, health data, and feedback.

    // Your role is to:
    // 1. Analyze the athlete's recent activity data (distance, heart rate, sleep)
    // 2. Consider their current training plan for the week
    // 3. Take into account any feedback they've provided
    // 4. Provide intelligent, data-driven adjustments to optimize their training

    // Be specific, actionable, and explain your reasoning. Focus on:
    // - Training load and recovery balance
    // - Heart rate trends and what they indicate
    // - Sleep quality impact on training capacity
    // - Injury prevention
    // - Progressive overload principles

    // Format your response as clear, actionable recommendations in markdown format.`;

    return `
## Purpose and Goals
Act as a world-class Olympic athlete and trainer who genuinely cares about each athlete's success.
Create dynamic, personalized running training plans for athletes.
Adjust recommendations based on weekly performance, recovery, and fitness data.

## Your Coaching Personality

You are a friendly, supportive coach who has been working with this athlete for months. You know them, you're invested in their success, and you communicate like a trusted mentor—not a robot reading data points.

### Voice and Tone Guidelines:
- **Warm and conversational**: Write like you're talking to a friend over coffee, not generating a medical report
- **Encouragement first**: Always acknowledge effort and what went well before suggesting changes
- **Human language**: Avoid clinical phrases like "Analysis indicates..." or "Data suggests..." or "Performance trend shows..."
- **Personal pronouns**: Use "you" frequently. Occasionally use "I think" or "I'd suggest" to sound human
- **Empathy for struggles**: When training didn't go as planned, be understanding—life happens, bodies need rest, motivation ebbs and flows
- **Celebrate wins**: When things go well, genuinely congratulate them. A PR deserves excitement!

### Tone Examples - DO vs DON'T:

❌ DON'T say: "Analysis indicates 3 of 5 planned runs were skipped. Recommend reducing weekly volume by 15% to prevent overtraining risk."
✅ DO say: "I noticed you only got 3 runs in this week—life happens! Let's ease back into things with a lighter week so you can build momentum again without overdoing it."

❌ DON'T say: "Heart rate data suggests inadequate recovery between sessions."
✅ DO say: "Your body might need a bit more recovery time between hard efforts. Let's space things out a little more this week."

❌ DON'T say: "Weekly mileage exceeded target by 12%. Positive adaptation observed."
✅ DO say: "You crushed it this week! That extra mileage shows you're feeling strong. Let's ride that momentum while keeping things sustainable."

❌ DON'T say: "Performance trend indicates fatigue accumulation."
✅ DO say: "I can see the hard work catching up with you—that's totally normal after a few solid weeks. A little extra rest now will pay off big time later."
## Recommendation Instructions
1. Input
Take 3 input from the users
Plan - Recent Activities (Last 30 Days)
Actual - Current Week Training Plan
Running Experience - {provided by the user along with the activities data}
If the User has given the input already, don't ask for it again. 
2. File Mapping Rules
Consider the data with the name “Recent Activities (Last 30 Days)” as Planned Runs dataset.
Consider the data with the name “Current Week Training Plan” as Actual Runs dataset.
Never confuse the two. Planned runs are the training schedule. Actual runs are the executed workouts.
Always align planned vs actuals using the date and day fields.
3. Schema Definitions
Planned Runs Dataset Schema
date: YYYY-MM-DD (planned date of run)
day: Day of week (Mon, Tue, …)
planned_run_type: Run type (Easy, Interval, Tempo, Long, Rest, Strength, Progression)


planned_distance_km: Distance in kilometers (numeric)
target_pace_min_per_km: Planned pace range in min/km (string, e.g. "5:30-5:45")
target_hr_zone: Planned heart rate zone (string, e.g. "Z2")
Actual Runs Dataset Schema
date: YYYY-MM-DD (date run was performed)
day: Day of week (Mon, Tue, …)
actual_run_type: Optional - Run type performed (Easy, Interval, Tempo, Long, Rest)
actual_distance_km: Distance in kilometers (numeric)
avg_pace_min_per_km: Average pace in min/km (string, e.g. "5:42")
avg_hr_bpm: Average heart rate in bpm (integer)
max_hr_bpm: Optional - Maximum heart rate in bpm (integer)
sleep_score: Optional - Sleep quality score 0–100 (integer)
recovery_pct: Optional - Recovery from last run, percentage 0–100 (integer)
notes: Optional - free-text notes (string)
4. Training Plan Adjustment Decision Tree (Pseudo-code)
INPUT:
- Planned Runs (date, type, distance, target pace, target HR zone)
- Actual Runs (date, type, distance, avg pace, avg HR)
- Running Experience (Beginner, Intermediate, Expert)

STEP 0: DATA SCOPING
Use only recent data:
For distance and load deviation → last 2 weeks of runs
If the user provides more than 2 weeks → ignore older data.

STEP 1: DATA VALIDATION
For each planned run:
    If no actual run data → mark as "Skipped"

STEP 2: COMPARE PLANNED vs ACTUAL
If Running Experience = “Beginner”
For each completed run:
    If |actual distance - planned distance| > 10% → flag "Distance Deviation"
    If avg pace outside planned pace range by > 10 sec/km → flag "Pace Deviation"
    If avg HR > target zone by > 5 bpm → flag "HR Drift"
If Running Experience = “Intermediate”
	For each completed run:
    If |actual distance - planned distance| > 15% → flag "Distance Deviation"
    If avg pace outside planned pace range by > 10 sec/km → flag "Pace Deviation"
    If avg HR > target zone by > 5 bpm → flag "HR Drift"
Else
	For each completed run:
    If |actual distance - planned distance| > 20% → flag "Distance Deviation"
    If avg pace outside planned pace range by > 10 sec/km → flag "Pace Deviation"
    If avg HR > target zone by > 5 bpm → flag "HR Drift"

STEP 3: FATIGUE DETECTION
If Running Experience = “Beginner”
For each run or daily status:
    If easy run avg HR unusually high (>70% HRmax) → flag "Hidden Fatigue"
    If 1+ consecutive hard runs without easy/rest → flag "Overload Risk"
    If 2 run with Distance Deviation in last week → flag "Overload Risk"
If Running Experience = “Intermediate”
For each run or daily status:
    If easy run avg HR unusually high (>70% HRmax) → flag "Hidden Fatigue"
    If 2+ consecutive hard runs without easy/rest → flag "Overload Risk"
    If 2 run with Distance Deviation in last week → flag "Overload Risk"
Else
For each run or daily status:
    If easy run avg HR unusually high (>70% HRmax) → flag "Hidden Fatigue"
    If 2+ consecutive hard runs without easy/rest → flag "Overload Risk"
    If 2 run with Distance Deviation in last week → flag "Overload Risk"

STEP 4: PERFORMANCE TREND
If Running Experience = “Beginner”
Across the week:
    If pace faster at same HR → mark "Positive Adaptation"
    If pace slower at higher HR → mark "Negative Adaptation"
    If 2 skipped run in last two week → mark "Inconsistency"
If Running Experience = “Intermediate”
Across the week:
    If pace faster at same HR → mark "Positive Adaptation"
    If pace slower at higher HR → mark "Negative Adaptation"
    If 3 skipped run in last two week → mark "Inconsistency"
Else
Across the week:
    If pace faster at same HR → mark "Positive Adaptation"
    If pace slower at higher HR → mark "Negative Adaptation"
    If 4 skipped run in last two week → mark "Inconsistency"

STEP 5: DECISION RULES
If Running Experience = “Beginner”
If "Fatigue" OR "Overload Risk":
    - Replace next hard run with Easy or Rest
    - Reduce total mileage by 10–20%
    - Increase easy run pace target by +10–15 sec/km
Else if "Positive Adaptation":
    - Progress as planned
    - Optionally increase interval intensity (shorter recoveries or slightly faster pace)
    - Increase long run distance by 5–10%
Else if "Negative Adaptation":
    - Keep mileage constant
    - Maintain current intensity (do not progress)
    - Add 1 extra recovery/easy day
Else if "Inconsistency":
    - Do NOT make up missed sessions
    - Resume with current week’s plan but cap volume at -10% from target
Else:
    - Continue progression as planned
If Running Experience = “Intermediate”
If "Fatigue" OR "Overload Risk":
    - Replace next hard run with Easy or Rest
    - Reduce total mileage by 10–20%
    - Increase easy run pace target by +10–15 sec/km
Else if "Positive Adaptation":
    - Progress as planned
    - Optionally increase interval intensity (shorter recoveries or slightly faster pace)
    - Increase long run distance by 5–10%
Else if "Negative Adaptation":
    - Keep mileage constant
    - Maintain current intensity (do not progress)
    - Add 1 extra recovery/easy day
Else if "Inconsistency":
    - Do NOT make up missed sessions
    - Resume with current week’s plan but cap volume at -10% from target
Else:
    - Continue progression as planned
Else
If "Fatigue" OR "Overload Risk":
    - Replace next hard run with Easy or Rest
    - Reduce total mileage by 10%
    - Increase easy run pace target by +10 sec/km
Else if "Positive Adaptation":
    - Progress as planned
    - Increase interval intensity (shorter recoveries or slightly faster pace)
    - Increase long run distance by 10%
Else if "Negative Adaptation":
    - Keep mileage constant
    - Maintain current intensity (do not progress)
    - Add 1 extra recovery/easy day
Else if "Inconsistency":
    - Do NOT make up missed sessions
    - Resume with current week’s plan but cap volume at -10% from target
Else:
    - Continue progression as planned

STEP 6: REGENERATE MODIFIED PLAN
For next week:
    - Assign Run Type (Easy, Interval, Tempo, Long, Rest)
    - Set Distance (adjusted per Step 5)
    - Set Target Pace / HR Zone
    - Ensure at least 1 rest day
    - Ensure long run ≤ 30–35% of total weekly mileage

6. TRAINING PACE SELECTION RULES (IMPORTANT)
You may receive two sources of training paces:
A) PLAN-EMBEDDED PACES: Paces specified in the training plan CSV (target_pace_min_per_km column)
B) VDOT-CALCULATED PACES: A separate "Training Pace Zones" section with paces derived from the athlete's race goal

PRIORITY ORDER - ALWAYS follow this hierarchy:
1. FIRST PRIORITY: Use paces from the training plan if they exist
   - If the plan has multiple pace groups or pace recommendations, select the most appropriate pace based on the athlete's target finish time and the workout type
   - Use your expert judgment to match the right pace group to each workout
2. FALLBACK: Only use VDOT-calculated paces when the training plan does NOT specify target paces
   - The VDOT paces are provided as a fallback reference only
   - Use them to fill in gaps when the plan lacks pace guidance

NEVER override plan-specified paces with VDOT-calculated paces. The coach who created the plan knows the athlete's specific needs.

5.Instruction to LLM:
When all the inputs are provided - a) Plan - Recent Activities (Last 30 Days) b) Actual - Current Week Training Plan c) Running Experience - “Beginner”, “Intermediate”, “Expert” are provided:
Parse each input using the schema definitions.
Align planned vs actuals by date and day.
Apply the Decision Tree step by step.
Generate a Modified Training Plan for the upcoming week based on findings in a tabular format.
Clearly explain deviations, fatigue risks, and reasoning for modifications.

## Output Format
Always respond in the EXACT format below. Do not include any text before the two sections.

### 🗓️ Modified Training Plan
Provide the table in markdown format with the following columns:
| Date | Day | Run Type | Distance (km) | Target Pace (min/km) | Target HR Zone | Notes |

- The table must contain the full week (7 days).
- Include at least one rest day.
- All distances and paces should be realistic and consistent with the runner's profile.
- Adjust distances, intensity, or recovery days based on analysis results.

### 💬 Coach's Notes

Write 2-3 paragraphs of conversational coaching feedback. This is where your friendly coaching personality shines! Include:

1. **Opening acknowledgment**: Start by recognizing how the week went. If they crushed it, celebrate! If they struggled, be empathetic and understanding. Use the athlete's first name if provided to make it personal (e.g., "Great work this week, Rajat!").

2. **Explain your adjustments**: In friendly, human language, explain why you made the changes you did. Connect it to their recent training and how their body is responding. Avoid clinical language—imagine you're explaining this to them after a run.

3. **Encouragement for the week ahead**: End with motivation and confidence. Help them see how this week fits into their bigger goals. Make them feel supported and excited to train.

**Length guidance**: Keep it concise but warm—about 3-5 sentences per paragraph. More detail for weeks with significant changes, shorter for routine weeks.

Respond ONLY with the "Modified Training Plan" table and "Coach's Notes" sections.
   - Do not restate the input data.
   - Do not include any preamble before the Modified Training Plan section.

If you are unable to find sufficient data to make changes, output the same format with a friendly note under "Coach's Notes" explaining that you're keeping things as planned and encouraging them to keep at it.

    `;
  }

  /**
   * @deprecated
   * Format training plan CSV for AI prompt context
   * Uses shared utility for accurate CSV parsing and week grouping
   */
  formatTrainingPlanForPrompt(
    csvContent: string,
    currentWeek: number,
    startDate: string
  ): string {
    // Use shared utility to properly parse and group training plan by week
    const { headers, groupedWeeks, error } = groupTrainingPlanByWeek(
      csvContent,
      startDate
    );

    if (error || groupedWeeks.length === 0) {
      return "No training plan data available";
    }

    // Include context around current week (previous week to +2 weeks)
    const startWeek = Math.max(1, currentWeek - 1);
    const endWeek = currentWeek + 2;

    // Filter weeks in the context window
    const relevantWeeks = groupedWeeks.filter(
      (week: { weekNumber: number; rows: Record<string, string>[] }) =>
        week.weekNumber >= startWeek && week.weekNumber <= endWeek
    );

    if (relevantWeeks.length === 0) {
      return `No training data available for week ${currentWeek}`;
    }

    // Format header
    let formattedPlan = `Training Plan Structure:\n`;
    formattedPlan += `Headers: ${headers.join(", ")}\n\n`;
    formattedPlan += `Current Week (Week ${currentWeek}) and Context:\n\n`;

    // Format each week's data
    for (const week of relevantWeeks) {
      const weekMarker = week.weekNumber === currentWeek ? ">>> " : "    ";
      formattedPlan += `${weekMarker}Week ${week.weekNumber}:\n`;

      // Format each day in the week
      for (const row of week.rows) {
        formattedPlan += `${weekMarker}  `;
        // Create a compact representation of the row
        const rowData = headers
          .map((header: string) => `${header}: ${row[header] || "N/A"}`)
          .join(", ");
        formattedPlan += `${rowData}\n`;
      }

      formattedPlan += "\n";
    }

    log.debug("Training plan formatted for AI prompt", {
      totalWeeks: groupedWeeks.length,
      relevantWeeks: relevantWeeks.length,
      currentWeek,
      formattedLength: formattedPlan.length,
    });

    return formattedPlan;
  }

  /**
   * Build the user prompt with activities and training context
   */
  private buildUserPrompt(
    activities: FormattedActivity[],
    currentWeekPlan: string,
    userFeedback?: string
  ): string {
    const activitiesText = activities
      .map(
        (activity) =>
          `- ${activity.name} (${activity.type}): ${(
            activity.distance / 1000
          ).toFixed(2)}km in ${Math.floor(activity.movingTime / 60)} minutes` +
          (activity.averageHeartrate
            ? ` | Avg HR: ${activity.averageHeartrate} bpm`
            : "")
      )
      .join("\n");

    let prompt = `## Recent Activities (Last 30 Days)\n${activitiesText}\n\n## Current Week Training Plan\n${currentWeekPlan}`;

    if (userFeedback) {
      prompt += `\n\n## Athlete Feedback\n${userFeedback}`;
    }

    // prompt += `\n\n## Request\nBased on the above data, provide specific recommendations for adjusting this week's training plan. Consider training load, recovery needs, and any patterns you see in the data.`;

    return prompt;
  }

  /**
   * @deprecated
   * Build user prompt with training plan from database
   */
  private buildUserPromptWithTrainingPlan(
    activities: FormattedActivity[],
    trainingPlanData: string,
    currentWeek: number,
    userFeedback?: string
  ): string {
    const activitiesText = activities
      .map(
        (activity) =>
          `- ${activity.name} (${activity.type}): ${(
            activity.distance / 1000
          ).toFixed(2)}km in ${Math.floor(activity.movingTime / 60)} minutes` +
          (activity.averageHeartrate
            ? ` | Avg HR: ${activity.averageHeartrate} bpm`
            : "")
      )
      .join("\n");

    let prompt = `## Recent Activities (Last 30 Days)\n${activitiesText}\n\n## Training Plan\n${trainingPlanData}`;

    if (userFeedback) {
      prompt += `\n\n## Athlete Feedback\n${userFeedback}`;
    }

    prompt += `\n\n## Request\nBased on the recent activities and the training plan above (currently on Week ${currentWeek}), provide specific recommendations for adjusting this week's training. Consider training load, recovery needs, and any patterns you see in the data. Be specific about which workouts to modify or keep as planned.`;

    return prompt;
  }

  /**
   * Format training paces for AI prompt context
   * These are VDOT-calculated fallback paces - plan-embedded paces take priority
   */
  private formatTrainingPacesForPrompt(paces: TrainingPaces): string {
    return `## Training Pace Zones (VDOT-Calculated - FALLBACK ONLY)
**IMPORTANT**: These paces are calculated from the athlete's race goal using VDOT formula.
Use these ONLY when the training plan does NOT specify target paces. Plan-embedded paces ALWAYS take priority.

| Zone | Pace Range |
|------|------------|
| Easy/Recovery | ${formatPace(paces.easy.maxPace)} - ${formatPace(paces.easy.minPace)} /km |
| Long Run | ${formatPace(paces.longRun.maxPace)} - ${formatPace(paces.longRun.minPace)} /km |
| Marathon | ${formatPace(paces.marathon.maxPace)} - ${formatPace(paces.marathon.minPace)} /km |
| Threshold/Tempo | ${formatPace(paces.threshold.maxPace)} - ${formatPace(paces.threshold.minPace)} /km |
| Interval | ${formatPace(paces.interval.maxPace)} - ${formatPace(paces.interval.minPace)} /km |
| Repetition | ${formatPace(paces.repetition.maxPace)} - ${formatPace(paces.repetition.minPace)} /km |`;
  }

  /**
   * Build user prompt with enhanced activity data and training plan from database
   */
  private buildUserPromptWithEnhancedActivities(
    activities: EnhancedFormattedActivity[],
    trainingPlanData: string,
    userFeedback?: string,
    experienceLevel?: ExperienceLevel,
    trainingPaces?: TrainingPaces,
    athleteFirstName?: string
  ): string {
    // Format activities as a structured table
    const activitiesTable = activities
      .map(
        (activity) =>
          `${activity.date} (${activity.day}): ` +
          `${activity.actual_distance_km}km @ ${activity.avg_pace_min_per_km}/km` +
          (activity.actual_run_type ? ` [${activity.actual_run_type}]` : "") +
          (activity.avg_hr_bpm ? ` | HR: ${activity.avg_hr_bpm}` : "") +
          (activity.max_hr_bpm ? `/${activity.max_hr_bpm} bpm` : " bpm") +
          (activity.sleep_score ? ` | Sleep: ${activity.sleep_score}` : "") +
          (activity.recovery_pct
            ? ` | Recovery: ${activity.recovery_pct}%`
            : "") +
          (activity.notes ? ` | Notes: ${activity.notes}` : "")
      )
      .join("\n");

    // Map database experience level values to prompt-compatible values
    const experienceLevelMap: Record<ExperienceLevel, string> = {
      beginner: "Beginner",
      intermediate: "Intermediate",
      advanced: "Expert",
    };

    // Use provided experience level or default to 'Intermediate'
    const runningExperience = experienceLevel
      ? experienceLevelMap[experienceLevel]
      : "Intermediate";

    // Add athlete's first name for personalization
    const athleteNameSection = athleteFirstName
      ? `## Athlete\nFirst Name: ${athleteFirstName}\n\n`
      : "";

    let prompt = `${athleteNameSection}## Recent Running Activities (Last 30 Days)\n${activitiesTable}\n\n## Training Plan\n${trainingPlanData}\n\n## Running Experience\n${runningExperience}`;

    // Add training paces if available (calculated from VDOT or plan-embedded)
    if (trainingPaces) {
      prompt += `\n\n${this.formatTrainingPacesForPrompt(trainingPaces)}`;
    }

    if (userFeedback) {
      prompt += `\n\n## Athlete Feedback\n${userFeedback}`;
    }

    // prompt += `\n\n## Request\nBased on the detailed activity data and training plan above (currently on Week ${currentWeek}), provide specific recommendations for adjusting this week's training. Consider:\n- Training load and volume trends\n- Pace and heart rate patterns\n- Recovery indicators\n- Run type distribution\n- Any patterns or concerns in the data\n\nBe specific about which workouts to modify, keep as planned, or adjust in intensity or duration.`;

    return prompt;
  }

  /**
   * @deprecated
   * Build prompt from raw Strava activities (for backward compatibility with existing route)
   */
  buildPromptFromRawActivities(activities: StravaActivity[]): string {
    if (activities.length === 0) {
      return `The user has no running activities in the last 30 days. Provide guidance on getting started with a training plan.`;
    }

    // Format activities data
    const formattedActivities = activities
      .filter((activity) => activity.type === "Run")
      .map((activity) => {
        const distanceKm = (activity.distance / 1000).toFixed(2);
        const durationMin = Math.round(activity.moving_time / 60);
        const paceMinPerKm =
          activity.moving_time / 60 / (activity.distance / 1000);
        const pace = `${Math.floor(paceMinPerKm)}:${String(
          Math.round((paceMinPerKm % 1) * 60)
        ).padStart(2, "0")}`;
        const date = new Date(activity.start_date).toLocaleDateString("en-US", {
          month: "short",
          day: "numeric",
        });
        const heartRate = activity.average_heartrate
          ? `${Math.round(activity.average_heartrate)} bpm`
          : "N/A";

        return `- ${date}: ${distanceKm}km in ${durationMin}min (${pace}/km), HR: ${heartRate}`;
      })
      .join("\n");

    // Calculate summary statistics
    const totalDistance = activities
      .filter((activity) => activity.type === "Run")
      .reduce((sum, activity) => sum + activity.distance / 1000, 0);
    const totalRuns = activities.filter(
      (activity) => activity.type === "Run"
    ).length;
    const avgDistance = totalRuns > 0 ? totalDistance / totalRuns : 0;

    const prompt = `You are an expert running coach analyzing a runner's training data. Based on the following 30-day activity history, provide personalized training recommendations.

**Runner's Recent Activity (Last 30 Days):**
${formattedActivities}

**Summary:**
- Total runs: ${totalRuns}
- Total distance: ${totalDistance.toFixed(2)}km
- Average distance per run: ${avgDistance.toFixed(2)}km

**Instructions:**
Analyze this data and provide:

1. **Performance Analysis** (2-3 sentences):
   - Overall training volume and consistency
   - Notable patterns (e.g., increasing/decreasing mileage, pace trends)
   - Heart rate insights if available

2. **Recommended Adjustments** (3-4 specific bullet points):
   - Weekly mileage recommendations
   - Workout type suggestions (easy runs, tempo, intervals, long run)
   - Recovery considerations
   - Any cautionary notes about overtraining or undertraining

Keep the tone professional but encouraging. Be specific and actionable.`;

    return prompt;
  }

  /**
   * @deprecated
   * Generate training recommendations using AI
   */
  async generateRecommendations(
    activities: FormattedActivity[],
    currentWeekPlan: string,
    userFeedback?: string
  ): Promise<string> {
    try {
      log.info("Generating AI recommendations", {
        activitiesCount: activities.length,
        hasFeedback: !!userFeedback,
      });

      const systemPrompt = this.buildSystemPrompt();
      const userPrompt = this.buildUserPrompt(
        activities,
        currentWeekPlan,
        userFeedback
      );

      log.debug("AI prompts prepared", {
        systemPromptLength: systemPrompt.length,
        userPromptLength: userPrompt.length,
      });

      const result = await generateText({
        model: this.getOpenAIModel(config.openai.model),
        messages: [
          {
            role: "system",
            content: systemPrompt,
          },
          {
            role: "user",
            content: userPrompt,
          },
        ],
        temperature: config.openai.temperature,
      });

      log.info("AI recommendations generated successfully", {
        responseLength: result.text.length,
        usage: result.usage,
      });

      return result.text;
    } catch (error) {
      log.error("Failed to generate AI recommendations", error);
      throw new InternalServerError(
        "Failed to generate training recommendations",
        error
      );
    }
  }

  /**
   * @deprecated
   * Generate training recommendations with training plan from database
   */
  async generateRecommendationsWithPlan(
    activities: FormattedActivity[],
    csvContent: string,
    currentWeek: number,
    startDate: string,
    userFeedback?: string
  ): Promise<string> {
    try {
      log.info("Generating AI recommendations with training plan", {
        activitiesCount: activities.length,
        currentWeek,
        hasFeedback: !!userFeedback,
      });

      const systemPrompt = this.buildSystemPrompt();
      const trainingPlanData = this.formatTrainingPlanForPrompt(
        csvContent,
        currentWeek,
        startDate
      );
      const userPrompt = this.buildUserPromptWithTrainingPlan(
        activities,
        trainingPlanData,
        currentWeek,
        userFeedback
      );

      log.debug("AI prompts prepared with training plan", {
        systemPromptLength: systemPrompt.length,
        userPromptLength: userPrompt.length,
      });

      const result = await generateText({
        model: this.getOpenAIModel(config.openai.model),
        messages: [
          {
            role: "system",
            content: systemPrompt,
          },
          {
            role: "user",
            content: userPrompt,
          },
        ],
        temperature: config.openai.temperature,
      });

      log.info("AI recommendations generated successfully with training plan", {
        responseLength: result.text.length,
        usage: result.usage,
      });

      return result.text;
    } catch (error) {
      log.error(
        "Failed to generate AI recommendations with training plan",
        error
      );
      throw new InternalServerError(
        "Failed to generate training recommendations",
        error
      );
    }
  }

  /**
   * Generate training recommendations with enhanced activity data and training plan from database
   * Includes training paces from VDOT calculation when available
   */
  generateRecommendationsWithEnhancedPlan(
    activities: EnhancedFormattedActivity[],
    csvContent: string,
    currentWeek: number,
    startDate: string,
    userFeedback?: string,
    experienceLevel?: ExperienceLevel,
    trainingPaces?: TrainingPaces,
    athleteFirstName?: string
  ) {
    try {
      log.info("Generating AI recommendations with enhanced activity data", {
        activitiesCount: activities.length,
        currentWeek,
        hasFeedback: !!userFeedback,
        hasTrainingPaces: !!trainingPaces,
        hasAthleteName: !!athleteFirstName,
      });

      const systemPrompt = this.buildSystemPrompt();
      const trainingPlanData = this.formatTrainingPlanForPrompt(
        csvContent,
        currentWeek,
        startDate
      );
      const userPrompt = this.buildUserPromptWithEnhancedActivities(
        activities,
        trainingPlanData,
        userFeedback,
        experienceLevel,
        trainingPaces,
        athleteFirstName
      );

      log.debug("AI prompts prepared with enhanced activities", {
        systemPromptLength: systemPrompt.length,
        userPromptLength: userPrompt.length,
      });

      return streamText({
        model: this.getOpenAIModel(config.openai.model),
        messages: [
          {
            role: "system",
            content: systemPrompt,
          },
          {
            role: "user",
            content: userPrompt,
          },
        ],
        temperature: config.openai.temperature,
      });
    } catch (error) {
      log.error(
        "Failed to generate AI recommendations with enhanced data",
        error
      );
      throw new InternalServerError(
        "Failed to generate training recommendations",
        error
      );
    }
  }

  /**
   * Format time from seconds to HH:MM:SS or MM:SS format
   * @param seconds - Time in seconds
   * @returns Formatted time string (e.g., "2:00:00" or "1:30:00")
   */
  private formatTimeFromSeconds(seconds: number): string {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = Math.round(seconds % 60);
    
    if (hours > 0) {
      return `${hours}:${String(minutes).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
    }
    return `${minutes}:${String(secs).padStart(2, '0')}`;
  }

  /**
   * Build the system prompt for PDF to structured plan conversion
   * @param startDate - Training plan start date in YYYY-MM-DD format
   * @param targetTimeSeconds - Optional target race time in seconds for pace group matching
   * @param errorContext - Optional error context from previous failed attempt
   * @returns System prompt string
   */
  private buildPdfConversionSystemPrompt(
    startDate: string,
    targetTimeSeconds?: number,
    errorContext?: string
  ): string {
    let prompt = `
## YOUR ROLE
You are a Running Training Plan Normalizer. Your job is to extract and standardize training plan data from any PDF — regardless of formatting — into a structured JSON format.

## CRITICAL EXTRACTION RULE
EXTRACT ONLY WHAT IS EXPLICITLY WRITTEN IN THE SOURCE. DO NOT:
- Add explanations, clarifications, or additional context that isn't in the source
- Infer or expand on what's written (e.g., don't add workout details, effort levels, or instructions that aren't explicitly stated)
- Change the wording or format (e.g., if source says "bike, swim, strength, etc." keep it as is, don't change to "bike/elliptical/strength/yoga")
- Add workout details that aren't explicitly mentioned
- Summarize or paraphrase - extract the exact text when possible
- If the source has minimal information, keep the extracted fields minimal

## INPUT
You will receive extracted text from a PDF file containing a running training plan. The file may contain text or tables showing a running training plan. If the file contains the training plan in miles and kilometers, consider the kilometers version.

## TRAINING PLAN START DATE
The user has specified that this training plan starts on: ${startDate}
Use this as the starting date for the training plan. If the PDF contains explicit dates, use those. Otherwise, start from ${startDate} and increment sequentially for each day.
THIS IS VERY IMPORTANT. DO NOT CHANGE THE START DATE. AND ALWAYS USE CORRECT DATE AND DAYS.

## OUTPUT FORMAT
You must output a JSON object with a "rows" array. Each row represents one day's workout with these fields:

- date: YYYY-MM-DD format (e.g., "2025-10-14")
- day: Day abbreviation that MUST match the date (Mon, Tue, Wed, Thu, Fri, Sat, Sun)
- type: One of: Easy, Long, Tempo, Interval, Recovery, Rest, Race, Cross-Training, Progression
- planned_distance_km: Number in kilometers, rounded to one decimal, or null if not specified
- target_pace_min_per_km: Pace range string like "5:30-5:45", try to infer from the text if it includes keywords like "easy", "moderate", "fast", "hard", "pace"
    If it cannot be inferred, use null
- target_HR_zone: One of: Z1, Z2, Z3, Z4, Z5, or null if not specified
- notes: Any additional context (max 300 chars), or null if not present

## FIELD RULES

### date
Extract if explicitly mentioned in the PDF (e.g., "March 4", "10/03"). Otherwise, infer sequential days starting from ${startDate}.

### day
MUST match the actual day of the date. For example:
- If date is 2025-08-24 (a Sunday), day MUST be "Sun"
- If date is 2025-08-25 (a Monday), day MUST be "Mon"

### type
Classify based on keywords, matching to the closest available value:
- "easy", "recovery", "jog", "steady" → Easy or Recovery (use Recovery if "recovery" is mentioned, otherwise Easy)
- "long", "long run" → Long
- "tempo", "threshold" → Tempo
- "interval", "speed", "track" → Interval
- Repetition patterns (e.g., "4 x 2k", "6 x 800m", "10 x 400m", "5 x 3mins", "N x distance") → Interval (even if combined with other descriptions like "Target Pace Workout")
- "rest", "off" → Rest
- "race" → Race
- "gym", "strength", "yoga", "pilates", "cross" → Cross-Training
- "progression" → Progression

**Priority rule**: 
- Repetition patterns (e.g., "4 x 2k", "5 x 3mins", "10-12 x 600m") → Interval (highest priority for classification, unless explicitly overridden by type keywords like "threshold" or "tempo")
- If explicit type keywords are present (e.g., "threshold", "tempo", "interval", "easy"), use those even if repetition patterns are also present. For example, "Threshold: 5 x 3mins" → Tempo (not Interval).
- If no explicit type keywords but repetition pattern exists (e.g., "4 x 2k at target pace", "Target Pace Workout: 4 x 2k"), classify as Interval (not Long or other types).

For ambiguous descriptions without explicit keywords (e.g., "steady", "moderate", "comfortable"), scan the entire plan first: if similar descriptions appear elsewhere, classify them consistently using the same type.
If no similar descriptions exist, analyze the context and choose the best matching type.

For compound types (e.g., "Rest+Pilates", "Rest or Pilates", "Rest OR Cross Training"):
- If one type is clearly primary (e.g., "Rest+Pilates" where Rest is the main activity), use that type
- For "OR" options (e.g., "Rest OR Cross Training"), prefer the active/specific option over Rest (e.g., "Rest OR 30mins Cross Training" → Cross-Training, not Rest)
- If both are equally important, prefer the more specific type (e.g., "Rest+Pilates" → Cross-Training if Pilates is the focus, or Rest if rest is emphasized)
- The type field is REQUIRED - always select the best matching value

### planned_distance_km
- ONLY include if distance is explicitly mentioned in the plan (e.g., "5km", "3 miles", "10K")
- Convert miles to km: multiply by 1.609
- Round to one decimal place
- For Rest days, use 0
- Use null if distance is not specified (even if time is given, e.g., "45 min run" without distance → null)
- DO NOT calculate distance from workout descriptions (e.g., "10 x 600m" → null unless explicitly stated as total distance)
- DO NOT estimate or guess distances

### target_pace_min_per_km
- Use range format: "5:30-5:45"
- If single value given, repeat it: "5:30-5:30"
- ONLY include if pace is explicitly mentioned OR if pace-related keywords are present in the workout description itself
- Pace-related keywords include: "pace", "easy pace", "moderate pace", "fast pace", "hard pace", "tempo pace", "interval pace", "recovery pace", "long pace", "5K pace", "10K pace", "marathon pace", "threshold pace", etc.
- When pace-related keywords are present in the workout description:
  - First, check if the workout description contains explicit pace values (e.g., "4:15/km", "6:00 pace")
  - If explicit pace values exist in the workout description, use those values
  - If no explicit values but keywords are present (e.g., "Easy Pace"), infer the pace from the workout's context if possible, otherwise use null
  - DO NOT infer pace from other workouts in the plan or from pace group definitions elsewhere - only use pace information present in the current workout description
- If no pace-related keywords are present in the workout description, use null (even if pace is mentioned elsewhere in the plan)
- For Rest/Cross-Training, use null

### target_HR_zone
Map to Z1-Z5 if mentioned. Approximate mappings:
- Z1: <65% HRmax or <120 bpm
- Z2: 65–75% HRmax or 120–140 bpm
- Z3: 75–85% HRmax or 140–160 bpm
- Z4: 85–90% HRmax or 160–175 bpm
- Z5: >90% HRmax or >175 bpm
For Rest/Cross-Training, use empty string ""
Use null if HR is not specified

### notes
CRITICAL: Extract ONLY what is explicitly written in the source text. Do NOT:
- Add explanations, clarifications, or additional context, unless required by the Schema.
- Infer or expand on what's written (e.g., don't add "Keep effort easy to moderate" if it's not in the source)
- Add workout details that aren't explicitly mentioned
- Summarize or paraphrase - extract the exact text when possible
- If the source has minimal notes, keep the notes field minimal
- Preserve the original wording and structure from the source

## PROCESSING RULES
1. Each row = one unique day
2. If a day has no workout info, mark as Rest with distance 0
3. Non-running sessions (gym, yoga) → type = "Cross-Training"
4. Ensure dates are sequential with no gaps
5. CRITICAL: Extract information exactly as written - do not add new content unless required by the Schema.
${targetTimeSeconds ? `

## PACE GROUP DETECTION AND MATCHING
The user's target race time is: ${this.formatTimeFromSeconds(targetTimeSeconds)}

When extracting the training plan:
1. The text may contain pace groups in different formats - as separate rows, as a table, as a list, as a different section.
2. Look for pace groups in the text (e.g., "Sub 2:00", "2:00-2:20", "1:45-2:00", "Completion Goal", "Sub 01:30", "2:00-2:30")
3. Match the user's target time (${this.formatTimeFromSeconds(targetTimeSeconds)}) to the appropriate pace group:
   - For "Sub X" goals (e.g., "Sub 2:00"): match if target time ≤ X (e.g., if target is 1:55:00 and plan has "Sub 2:00", use that group)
   - For ranges (e.g., "2:00-2:20"): match if target time falls within the range (inclusive)
   - For "Completion" goals or open-ended ranges: use the most relaxed/easiest pace group (highest time range or no upper limit)
   - If multiple matches, prefer the most specific match (smallest range that contains the target)
   - If no exact match, use the closest pace group (smallest difference from target time)
4. Use the paces from the matched pace group for each workout type:
   - Easy runs → use easy pace from matched group
   - Tempo runs → use tempo pace from matched group
   - Interval runs → use interval pace from matched group
   - Long runs → use long pace from matched group
   - Recovery runs → use recovery pace from matched group
   - If a pace group specifies paces for other workout types, use those as well
5. If no pace groups are found in the text or no match is found:
   - Use the paces explicitly specified in the plan for each workout
   - If no explicit paces are given, estimate based on the target time using standard training pace calculations
` : ''}
`;

    if (errorContext) {
      prompt += `

## PREVIOUS ATTEMPT FAILED
Your previous response had validation errors. Please fix these issues:

${errorContext}

Pay special attention to:
1. Ensuring the "day" field matches the actual day of the "date"
2. Using valid type values: Easy, Long, Tempo, Interval, Recovery, Rest, Race, Cross-Training, Progression
3. Using valid HR zones: Z1, Z2, Z3, Z4, Z5, or empty string
4. Rest days should have planned_distance_km = 0
`;
    }

    return prompt;
  }

  /**
   * Convert PDF text to structured training plan using generateObject()
   * Uses Zod schema validation for guaranteed output format
   * @param pdfText - Extracted text from PDF training plan
   * @param startDate - Training plan start date in YYYY-MM-DD format
   * @param errorContext - Optional error context from previous failed attempt for retry
   * @returns Validated TrainingPlan object
   */
  async convertPdfTextToStructuredPlan(
    pdfText: string,
    startDate: string,
    targetTimeSeconds?: number,
    errorContext?: string,
    filename?: string
  ): Promise<TrainingPlan> {
    try {
      log.info("Converting PDF text to structured plan using generateObject", {
        textLength: pdfText.length,
        startDate,
        targetTimeSeconds,
        isRetry: !!errorContext,
      });

      const systemPrompt = this.buildPdfConversionSystemPrompt(startDate, targetTimeSeconds, errorContext);
      const userPrompt = `Extract the training plan from this text:\n\n${pdfText}`;

      const result = await generateObject({
        model: this.getOpenAIModel(config.openai.model),
        schema: TrainingPlanSchema,
        messages: [
          {
            role: "system",
            content: systemPrompt,
          },
          {
            role: "user",
            content: userPrompt,
          },
        ],
        temperature: 0.1,
        ...this.getPdfParsingModelOptions(),
      });

      log.info("PDF text to structured plan conversion successful", {
        rowCount: result.object.rows.length,
        usage: result.usage,
      });

      // Save token usage data
      if (filename) {
        await saveTokenUsage({
          modelName: config.openai.model,
          filename,
          method: "text",
          usage: result.usage,
          metadata: {
            startDate,
            targetTimeSeconds,
            textLength: pdfText.length,
          },
        });
      }

      return result.object;
    } catch (error) {
      log.error("Failed to convert PDF text to structured plan", error);
      throw new InternalServerError(
        "Failed to convert PDF text to structured format",
        error
      );
    }
  }

  /**
   * Convert PDF images to structured training plan using GPT-4o vision capability
   * Used when PDF pages contain images instead of extractable text
   * @param images - Array of PNG image buffers (rendered PDF pages)
   * @param textContent - Any extractable text from the PDF (may be sparse/empty)
   * @param startDate - Training plan start date in YYYY-MM-DD format
   * @param errorContext - Optional error context from previous failed attempt
   * @returns Validated TrainingPlan object
   */
  async convertPdfImagesToStructuredPlan(
    images: Buffer[],
    textContent: string,
    startDate: string,
    targetTimeSeconds?: number,
    errorContext?: string,
    filename?: string
  ): Promise<TrainingPlan> {
    try {
      log.info("Converting PDF images to structured plan using vision", {
        imageCount: images.length,
        textLength: textContent.length,
        startDate,
        targetTimeSeconds,
        isRetry: !!errorContext,
        totalImageSizeBytes: images.reduce((sum, img) => sum + img.length, 0),
      });

      const systemPrompt = this.buildPdfConversionSystemPrompt(startDate, targetTimeSeconds, errorContext);

      // Build user message content with text and images
      type ContentPart =
        | { type: "text"; text: string }
        | { type: "image"; image: Buffer; mimeType: "image/png" };

      const userTextContent = `Extract the training plan from the provided images. The training plan starts on ${startDate}.${
        textContent.trim()
          ? `\n\nAdditional extracted text from the PDF:\n${textContent}`
          : ""
      }`;

      const userContent: ContentPart[] = [
        {
          type: "text",
          text: userTextContent,
        },
        // Add each image as an ImagePart
        ...images.map(
          (img): ContentPart => ({
            type: "image" as const,
            image: img,
            mimeType: "image/png" as const,
          })
        ),
      ];

      const result = await generateObject({
        model: this.getOpenAIModel(config.openai.model),
        schema: TrainingPlanSchema,
        messages: [
          {
            role: "system",
            content: systemPrompt,
          },
          {
            role: "user",
            content: userContent,
          },
        ],
        temperature: 0.1,
        ...this.getPdfParsingModelOptions(),
      });

      log.info("PDF images to structured plan conversion successful", {
        rowCount: result.object.rows.length,
        usage: result.usage,
      });

      // Save token usage data
      if (filename) {
        await saveTokenUsage({
          modelName: config.openai.model,
          filename,
          method: "vision",
          usage: result.usage,
          metadata: {
            startDate,
            targetTimeSeconds,
            imageCount: images.length,
            textLength: textContent.length,
          },
        });
      }

      return result.object;
    } catch (error) {
      log.error("Failed to convert PDF images to structured plan", error);
      throw new InternalServerError(
        "Failed to convert PDF images to structured format",
        error
      );
    }
  }

  /**
   * Update CSV with matched pace group based on target time
   * Uses LLM to detect pace groups from CSV text and regenerate CSV with matched paces
   * @param csvText - CSV content as string
   * @param targetTimeSeconds - Target race time in seconds
   * @param startDate - Training plan start date in YYYY-MM-DD format
   * @returns Updated CSV content with matched pace group paces
   */
  async updateCsvWithMatchedPaceGroup(
    csvText: string,
    targetTimeSeconds: number,
    startDate: string
  ): Promise<string> {
    try {
      log.info("Updating CSV with matched pace group", {
        csvLength: csvText.length,
        targetTimeSeconds,
        startDate,
      });

      // Build prompt that instructs LLM to detect pace groups and update paces
      const systemPrompt = this.buildPdfConversionSystemPrompt(startDate, targetTimeSeconds);
      
      const userPrompt = `Update the following CSV training plan by detecting pace groups and matching the user's target time (${this.formatTimeFromSeconds(targetTimeSeconds)}) to the appropriate pace group. Use the paces from the matched pace group for each workout type.

Current CSV:
${csvText}

Return the updated CSV with the same structure, but with paces updated based on the matched pace group.`;

      const result = await generateText({
        model: this.getOpenAIModel(config.openai.model),
        messages: [
          {
            role: "system",
            content: systemPrompt,
          },
          {
            role: "user",
            content: userPrompt,
          },
        ],
        temperature: 0.1,
        ...this.getPdfParsingModelOptions(),
      });

      let updatedCsv = result.text.trim();

      // Remove markdown code block syntax if present
      if (updatedCsv.startsWith("```")) {
        const lines = updatedCsv.split("\n");
        // Remove first line (```csv or ```)
        lines.shift();
        // Remove last line (```)
        if (lines[lines.length - 1]?.trim() === "```") {
          lines.pop();
        }
        updatedCsv = lines.join("\n").trim();
      }

      log.info("CSV updated with matched pace group", {
        originalLength: csvText.length,
        updatedLength: updatedCsv.length,
      });

      return updatedCsv;
    } catch (error) {
      log.error("Failed to update CSV with matched pace group", error);
      throw new InternalServerError(
        "Failed to update CSV with matched pace group",
        error
      );
    }
  }

  /**
   * Convert structured training plan to CSV string
   * @param plan - Validated TrainingPlan object
   * @returns CSV formatted string
   */
  structuredPlanToCsv(plan: TrainingPlan): string {
    const headers = "date,day,type,planned_distance_km,target_pace_min_per_km,target_HR_zone,notes";

    const rows = plan.rows.map((row: TrainingPlanRow) => {
      // Handle nullable fields - convert null to empty string for CSV
      const pace = row.target_pace_min_per_km ?? "";
      const hrZone = row.target_HR_zone ?? "";
      
      // Escape notes field for CSV (double quotes inside, wrap in quotes)
      const escapedNotes = row.notes
        ? `"${row.notes.replace(/"/g, '""')}"`
        : '""';

      return `${row.date},${row.day},${row.type},${row.planned_distance_km},${pace},${hrZone},${escapedNotes}`;
    });

    return [headers, ...rows].join("\n");
  }

  /**
   * @deprecated Use convertPdfTextToStructuredPlan instead
   * Convert PDF text to CSV format using LLM (legacy method)
   * @param pdfText - Extracted text from PDF training plan
   * @param startDate - Training plan start date in YYYY-MM-DD format
   * @returns CSV formatted string
   */
  async convertPdfTextToCsv(
    pdfText: string,
    startDate: string
  ): Promise<string> {
    // Use new structured method and convert to CSV
    const structuredPlan = await this.convertPdfTextToStructuredPlan(pdfText, startDate);
    return this.structuredPlanToCsv(structuredPlan);
  }

  /**
   * Stream training recommendations using AI (for backward compatibility)
   * Returns a streaming result for use with the existing streaming endpoint
   */
  streamRecommendationsFromActivities(activities: StravaActivity[]) {
    try {
      log.info("Streaming AI recommendations", {
        activitiesCount: activities.length,
      });

      const prompt = this.buildPromptFromRawActivities(activities);

      log.debug("AI prompt prepared for streaming", {
        promptLength: prompt.length,
      });

      return streamText({
        model: this.getOpenAIModel(config.openai.model),
        messages: [
          {
            role: "system",
            content:
              "You are an expert running coach providing personalized training recommendations based on activity data.",
          },
          {
            role: "user",
            content: prompt,
          },
        ],
        temperature: config.openai.temperature,
      });
    } catch (error) {
      log.error("Failed to stream AI recommendations", error);
      throw new InternalServerError(
        "Failed to generate training recommendations",
        error
      );
    }
  }

  /**
   * Build the system prompt for training status assessment
   * Focused on determining if training is on track, slightly off track, or off track
   * Delivers assessment in a friendly, coach-like voice
   */
  buildStatusSystemPrompt(): string {
    return `You are a friendly, supportive running coach giving a quick training check-in. Your task is to assess whether a runner's training is on track and deliver the news like a coach who genuinely cares about their athlete.

## Your Role
- Assess training adherence based on plan vs. actual activities
- Deliver your assessment in a warm, encouraging voice
- Be conservative - only mark as "on_track" when truly confident
- **Always include specific stats** (runs completed, distances, key workouts) to show you know their training

## Your Coaching Personality

You're a supportive coach who has been working with this athlete. You communicate like a trusted mentor—not a robot reading data points.

### Voice and Tone Guidelines:
- **Warm and conversational**: Write like you're giving a quick check-in after practice
- **Use the athlete's first name** when provided to make it personal
- **Include specific numbers**: Mention runs completed, distances, or key workouts to show you're paying attention
- **Encouragement regardless of status**: Celebrate wins, empathize with struggles, motivate for what's next
- **Human language**: Avoid clinical phrases like "Analysis indicates..." or "Data suggests..."

### Tone Examples - DO vs DON'T:

**For "on_track":**
❌ DON'T: "Completed 4 of 5 planned runs with distances within target range."
✅ DO: "You're crushing it, Rajat! 4 out of 5 runs done and you nailed that 15km long run. Keep this momentum going!"

**For "slightly_off_track":**
❌ DON'T: "Missed 2 of 5 planned runs. Mileage 20% below target."
✅ DO: "3 out of 5 runs this week—not bad! Life happens. You still logged 25km, which keeps you in the game."

**For "off_track":**
❌ DON'T: "Significant deviation from plan. 4 of 6 runs missed."
✅ DO: "Only 2 runs this week, and I know that's not what you planned. Let's regroup—even a light week keeps the habit alive!"

## Confidence Requirement
You must be at least 90% confident in your assessment. If you cannot reach this confidence level due to insufficient data, respond with status "slightly_off_track" and explain the data limitations in a friendly way.

## Status Definitions

**on_track**: The runner is executing their training plan within acceptable variance:
- Completing 80%+ of planned runs
- Distances within 15% of targets
- Run types generally match plan (long runs, easy runs, tempo runs happening as scheduled)

**slightly_off_track**: Minor deviations that don't significantly impact training goals:
- Completing 60-80% of planned runs
- Some workouts missed or modified
- Distances 15-30% off target
- Minor scheduling adjustments

**off_track**: Significant deviation from training plan:
- Completing less than 60% of planned runs
- Major workouts (long runs, key sessions) consistently missed
- Distances more than 30% off target
- Extended gaps in training

## Experience Level Consideration
- **Beginner**: More lenient thresholds, expect more variance
- **Intermediate**: Standard thresholds as defined above
- **Expert**: Tighter expectations, these runners should hit their marks more precisely

## Output Format
Respond ONLY with valid JSON in this exact format:
{
  "status": "on_track" | "slightly_off_track" | "off_track",
  "rationale": "A brief, friendly coach-style message (2-3 sentences). Sound like a supportive coach giving a quick check-in. Include specific stats (runs completed, distances, key workouts) naturally woven into the message. Use the athlete's first name if provided. Be encouraging regardless of status.",
  "confidence": <number between 90-100>
}`;
  }

  /**
   * Calculate the start date of a given week number based on plan start date
   * Week 1 starts on planStartDate, Week 2 starts 7 days later, etc.
   */
  private getWeekStartDate(planStartDate: Date, weekNumber: number): Date {
    const startDate = new Date(planStartDate);
    startDate.setHours(0, 0, 0, 0);

    const targetStart = new Date(startDate);
    targetStart.setDate(startDate.getDate() + (weekNumber - 1) * 7);

    return targetStart;
  }

  /**
   * Build the user prompt for training status assessment
   * Formats training plan, activities, and context for status evaluation
   * Filters data to only include previous week (full) + current week (up to today)
   */
  buildStatusUserPrompt(
    activities: EnhancedFormattedActivity[],
    csvContent: string,
    startDate: string,
    experienceLevel: ExperienceLevel,
    currentWeek: number,
    planStartDate: Date,
    athleteFirstName?: string
  ): string {
    const previousWeek = currentWeek > 1 ? currentWeek - 1 : 1;
    const today = new Date();
    today.setHours(23, 59, 59, 999);

    // Calculate week boundaries
    const previousWeekStart = this.getWeekStartDate(planStartDate, previousWeek);
    const previousWeekEnd = new Date(previousWeekStart);
    previousWeekEnd.setDate(previousWeekEnd.getDate() + 6);
    previousWeekEnd.setHours(23, 59, 59, 999);

    const currentWeekStart = this.getWeekStartDate(planStartDate, currentWeek);

    // Group activities by week
    const previousWeekActivities = activities.filter((activity) => {
      const activityDate = new Date(activity.date);
      return activityDate >= previousWeekStart && activityDate <= previousWeekEnd;
    });

    const currentWeekActivities = activities.filter((activity) => {
      const activityDate = new Date(activity.date);
      return activityDate >= currentWeekStart && activityDate <= today;
    });

    // Format activities table for a week
    const formatActivitiesTable = (weekActivities: EnhancedFormattedActivity[]): string => {
      if (weekActivities.length === 0) {
        return "No activities recorded";
      }
      return weekActivities
        .map(
          (activity) =>
            `| ${activity.date} | ${activity.actual_run_type || "Run"} | ${activity.actual_distance_km.toFixed(1)} | ${activity.avg_pace_min_per_km} | ${activity.avg_hr_bpm || "N/A"} |`
        )
        .join("\n");
    };

    // Get training plan for current and previous week
    const { groupedWeeks } = groupTrainingPlanByWeek(csvContent, startDate);

    const currentWeekPlan = groupedWeeks.find((week) => week.weekNumber === currentWeek);
    const previousWeekPlan = groupedWeeks.find((week) => week.weekNumber === previousWeek);

    // Format week's plan with optional filtering for current week
    const formatWeekPlan = (
      week: { weekNumber: number; rows: Record<string, string>[] } | undefined,
      weekLabel: string,
      isCurrentWeek: boolean
    ): string => {
      if (!week || week.rows.length === 0) {
        return `${weekLabel}: No data available`;
      }

      let filteredRows = week.rows;

      // For current week, only include days up to today
      if (isCurrentWeek) {
        filteredRows = week.rows.filter((row) => {
          const rowDateStr = row["date"] || row["Date"];
          if (!rowDateStr) return false;
          const rowDate = new Date(rowDateStr);
          return rowDate <= today;
        });
      }

      if (filteredRows.length === 0) {
        return `${weekLabel}: No planned runs up to today`;
      }

      const planRows = filteredRows
        .map((row) => {
          const date = row["date"] || row["Date"] || "N/A";
          const type = row["type"] || row["Type"] || row["planned_run_type"] || "N/A";
          const distance = row["planned_distance_km"] || row["distance"] || "N/A";
          const pace = row["target_pace_min_per_km"] || row["pace"] || "N/A";
          return `| ${date} | ${type} | ${distance} | ${pace} |`;
        })
        .join("\n");

      return `${weekLabel}:\n| Date | Type | Distance (km) | Target Pace |\n|------|------|---------------|-------------|\n${planRows}`;
    };

    // Map experience level to prompt-friendly format
    const experienceLevelMap: Record<ExperienceLevel, string> = {
      beginner: "Beginner",
      intermediate: "Intermediate",
      advanced: "Expert",
    };

    // Format today's date for context
    const todayFormatted = today.toISOString().split("T")[0];

    // Add athlete's first name for personalization
    const athleteNameSection = athleteFirstName
      ? `\n- Athlete First Name: ${athleteFirstName}`
      : "";

    return `## Training Plan Context
- Plan Start Date: ${startDate}
- Current Week: ${currentWeek}
- Today's Date: ${todayFormatted}
- Runner Experience: ${experienceLevelMap[experienceLevel]}${athleteNameSection}

## Training Plan (Previous Week - Full Week)
${formatWeekPlan(previousWeekPlan, `Week ${previousWeek}`, false)}

## Training Plan (Current Week - Up to Today)
${formatWeekPlan(currentWeekPlan, `Week ${currentWeek}`, true)}

## Actual Activities

### Week ${previousWeek} (Previous Week - Full Week)
| Date | Type | Distance (km) | Pace (min/km) | Avg HR |
|------|------|---------------|---------------|--------|
${formatActivitiesTable(previousWeekActivities)}

### Week ${currentWeek} (Current Week - Up to Today)
| Date | Type | Distance (km) | Pace (min/km) | Avg HR |
|------|------|---------------|---------------|--------|
${formatActivitiesTable(currentWeekActivities)}

## Assessment Request
Based on the above data, determine if this runner's training is on track, slightly off track, or off track. Consider:
1. How many planned runs were completed vs skipped (compare plan rows to actual activities for each week)
2. Whether distances match the plan
3. If key workouts (long runs, tempo runs) were executed
4. The runner's experience level when setting expectations
5. For the current week, only assess runs that should have happened by today

Provide your assessment in the required JSON format.`;
  }

  /**
   * Generate training status assessment using AI
   * Returns structured status with rationale and confidence
   */
  async generateTrainingStatus(
    activities: EnhancedFormattedActivity[],
    csvContent: string,
    startDate: string,
    experienceLevel: ExperienceLevel,
    currentWeek: number,
    planStartDate: Date,
    athleteFirstName?: string
  ): Promise<TrainingStatusResult> {
    try {
      log.info("Generating training status assessment", {
        activitiesCount: activities.length,
        experienceLevel,
        currentWeek,
        hasAthleteName: !!athleteFirstName,
      });

      const systemPrompt = this.buildStatusSystemPrompt();
      const userPrompt = this.buildStatusUserPrompt(
        activities,
        csvContent,
        startDate,
        experienceLevel,
        currentWeek,
        planStartDate,
        athleteFirstName
      );

      log.debug("Training status prompts prepared", {
        systemPromptLength: systemPrompt.length,
        userPromptLength: userPrompt.length,
      });

      const result = await generateText({
        model: this.getOpenAIModel(config.openai.model),
        messages: [
          {
            role: "system",
            content: systemPrompt,
          },
          {
            role: "user",
            content: userPrompt,
          },
        ],
        temperature: 0.1, // Low temperature for consistent, deterministic output
      });

      log.debug("AI response received for training status", {
        responseLength: result.text.length,
        usage: result.usage,
      });

      // Parse JSON response
      const parsedResponse = this.parseStatusResponse(result.text);

      log.info("Training status assessment generated successfully", {
        status: parsedResponse.status,
        confidence: parsedResponse.confidence,
      });

      return parsedResponse;
    } catch (error) {
      log.error("Failed to generate training status", error);
      throw new InternalServerError(
        "Failed to generate training status assessment",
        error
      );
    }
  }

  /**
   * Parse and validate the AI response for training status
   */
  private parseStatusResponse(responseText: string): TrainingStatusResult {
    try {
      // Try to extract JSON from the response (handle potential markdown code blocks)
      let jsonString = responseText.trim();

      // Remove markdown code block if present
      if (jsonString.startsWith("```json")) {
        jsonString = jsonString.slice(7);
      } else if (jsonString.startsWith("```")) {
        jsonString = jsonString.slice(3);
      }
      if (jsonString.endsWith("```")) {
        jsonString = jsonString.slice(0, -3);
      }
      jsonString = jsonString.trim();

      const parsed = JSON.parse(jsonString) as {
        status?: unknown;
        rationale?: unknown;
        confidence?: unknown;
      };

      // Validate status
      const validStatuses: TrainingStatusType[] = ["on_track", "slightly_off_track", "off_track"];
      if (!parsed.status || !validStatuses.includes(parsed.status as TrainingStatusType)) {
        log.warn("Invalid status in AI response, defaulting to slightly_off_track", {
          receivedStatus: parsed.status,
        });
        parsed.status = "slightly_off_track";
      }

      // Validate rationale
      if (!parsed.rationale || typeof parsed.rationale !== "string") {
        parsed.rationale = "Unable to provide detailed assessment.";
      }

      // Validate confidence
      const confidence = Number(parsed.confidence);
      if (isNaN(confidence) || confidence < 0 || confidence > 100) {
        parsed.confidence = 90;
      }

      return {
        status: parsed.status as TrainingStatusType,
        rationale: parsed.rationale as string,
        confidence: parsed.confidence as number,
      };
    } catch (parseError) {
      log.error("Failed to parse training status response", {
        error: parseError,
        responseText: responseText.substring(0, 200),
      });

      // Return a safe default
      return {
        status: "slightly_off_track",
        rationale: "Unable to assess training status due to parsing error.",
        confidence: 90,
      };
    }
  }
}

// Export singleton instance
export const aiService = new AIService();
