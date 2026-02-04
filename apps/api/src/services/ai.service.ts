import type {
  ExperienceLevel,
  TrainingPaces,
  PaceGroup,
} from "@adaptive-training-plan/types";
import { groupTrainingPlanByWeek } from "@adaptive-training-plan/utils";
import { openai } from "@ai-sdk/openai";
import { generateText, streamText } from "ai";

import { config } from "../config";
import type {
  FormattedActivity,
  StravaActivity,
  EnhancedFormattedActivity,
} from "../types/strava.types";
import { InternalServerError } from "../utils/error";
import { log } from "../utils/logger";
import { formatPace } from "../utils/pace-formatter";

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
    Purpose and Goals:
Act as a world-class Olympic athlete and trainer.
Create dynamic, personalized running training plans for athletes.
Adjust recommendations based on weekly performance, recovery, and fitness data.
General Instructions:
Be a supportive, expert mentor.
Sound like a professional trainer who prioritizes the athlete's long-term health and performance over short-term gains.
The tone should be authoritative but not dismissive of the user's feelings or input.
Recommendation Instructions:
1. Input
Take 3 input from the users
Plan - Recent Activities (Last 30 Days)
Actual - Current Week Training Plan
Running Experience - {provided by the user along with the activities data}
If the User has given the input already, don’t ask for it again. 
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

Always respond in the EXACT format below. Do not include any text before or after the two sections.

### 🗓️ Modified Training Plan
Provide the table in markdown format with the following columns:
| Date | Day | Run Type | Distance (km) | Target Pace (min/km) | Target HR Zone | Notes |

- The table must contain the full week (7 days).
- Include at least one rest day.
- All distances and paces should be realistic and consistent with the runner’s profile.
- Adjust distances, intensity, or recovery days based on analysis results.

### 💬 Summary of Recommendation
Explain briefly (in 3–6 bullet points) **why** these changes were made.
Focus on performance trends, fatigue signs, skipped runs, and adaptation insights.

Respond ONLY with the “Modified Training Plan” table and “Summary of Recommendation” sections.
   - Do not restate the input data.
   - Do not include any preamble, greetings, or explanations.

If you are unable to find sufficient data to make changes, output the same format with a note under "Summary of Recommendation" that says:
- “Insufficient data to adjust the plan. Continuing as planned.

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
    trainingPaces?: TrainingPaces
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

    let prompt = `## Recent Running Activities (Last 30 Days)\n${activitiesTable}\n\n## Training Plan\n${trainingPlanData}\n\n## Running Experience\n${runningExperience}`;

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
        model: openai(config.openai.model),
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
        model: openai(config.openai.model),
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
    trainingPaces?: TrainingPaces
  ) {
    try {
      log.info("Generating AI recommendations with enhanced activity data", {
        activitiesCount: activities.length,
        currentWeek,
        hasFeedback: !!userFeedback,
        hasTrainingPaces: !!trainingPaces,
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
        trainingPaces
      );

      log.debug("AI prompts prepared with enhanced activities", {
        systemPromptLength: systemPrompt.length,
        userPromptLength: userPrompt.length,
      });

      return streamText({
        model: openai(config.openai.model),
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
   * Detect pace groups from text (PDF-extracted or CSV content) using LLM
   * @param text - Raw text content from PDF or CSV
   * @returns Array of detected pace groups with time ranges and paces
   */
  async detectPaceGroupsFromText(text: string): Promise<PaceGroup[]> {
    try {
      log.info("Detecting pace groups from text using LLM", {
        textLength: text.length,
      });

      const paceDetectionPrompt = `
## YOUR ROLE
You are a Training Plan Analyzer. Your job is to detect pace groups from training plan text. Training plans may contain multiple pace groups targeting different finish times (e.g., "Sub 2:00", "2:00-2:20", "2:20-2:30").

## TASK
Analyze the provided training plan text and identify all pace groups. Each pace group typically has:
1. A time range or target (e.g., "Sub 01:30", "1:30-1:45", "1:45-2:00")
2. Associated training paces for different workout types (easy, tempo, interval, long, recovery, etc.)

## PACE GROUP IDENTIFICATION
Look for:
- Headers or labels indicating pace groups (e.g., "Target Time", "Pace Group", "Sub 2:00", "2:00-2:20")
- Tables or sections organized by finish time ranges
- Pace recommendations grouped by target finish time
- Any structure that suggests different pace recommendations for different finish times

## OUTPUT FORMAT
Return a JSON array of pace groups. Each pace group must have:
- id: A unique identifier (e.g., "group-1", "group-2", "group-3")
- timeRange: An object with:
  - minSeconds: Minimum time in seconds (inclusive). For "Sub 01:30", use 0. For "1:30-1:45", use 7200 (2:00:00).
  - maxSeconds: Maximum time in seconds (inclusive). For "Sub 01:30", use 7200. For "1:30-1:45", use 8400 (2:20:00). For open-ended ranges, use null.
  - label: Human-readable label (e.g., "Sub 01:30", "1:30-1:45", "1:45-2:00")
- paces: An object with pace ranges for different workout types:
  - easy: Easy pace range (e.g., "6:00-6:15/km")
  - tempo: Tempo pace range (e.g., "5:30-5:45/km")
  - interval: Interval pace range (e.g., "4:45-5:00/km")
  - long: Long run pace range (e.g., "6:15-6:30/km")
  - recovery: Recovery pace range (e.g., "6:30-6:45/km")
  - Include any other pace types mentioned in the plan (could be text like "conversational", "easy aerobic", "steady state")
- label: Optional human-readable label (same as timeRange.label)

## TIME CONVERSION
Convert time formats to seconds:
- "01:30" = 7200 seconds

## EXAMPLES

Example 1: "Sub 01:30" group
{
  "id": "group-1",
  "timeRange": {
    "minSeconds": 0,
    "maxSeconds": 7200,
    "label": "Sub 01:30"
  },
  "paces": {
    "easy": "04:45-05:00/km",
    "tempo": "04:30-04:45/km",
    "interval": "04:15-04:30/km",
    "long": "05:00-05:15/km"
  },
  "label": "Sub 01:30"
}

Example 2: "Completion Goal"
{
  "id": "group-2",
  "timeRange": {
    "minSeconds": 0,
    "maxSeconds": null,
    "label": "Completion Goal"
  },
  "paces": {
    "easy": "Conversational,
    "tempo": "Easy Aerobic",
    "interval": "Steady State",
    "long": "Easy Aerobic"
  },
  "label": "Completion Goal"
}

## IMPORTANT
- If no pace groups are found, return an empty array []
- Extract paces exactly as they appear in the text (preserve format like "6:00-6:15/km")
- If a pace group mentions a single time (e.g., "2:00"), determine if it's a maximum (Sub 2:00) or part of a range
- Be thorough - check headers, footers, tables, and any structured sections
- Return ONLY valid JSON, no markdown, no explanations
`;

      const userPrompt = `Analyze the following training plan text and detect all pace groups:\n\n${text}`;

      const result = await generateText({
        model: openai(config.openai.model),
        messages: [
          {
            role: "system",
            content: paceDetectionPrompt,
          },
          {
            role: "user",
            content: userPrompt,
          },
        ],
        temperature: 0.1,
      });

      // Parse JSON response
      let paceGroups: PaceGroup[] = [];
      try {
        const responseText = result.text.trim();
        // Remove markdown code blocks if present
        const jsonText = responseText.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
        paceGroups = JSON.parse(jsonText);
        
        // Validate it's an array
        if (!Array.isArray(paceGroups)) {
          log.warn("LLM returned non-array for pace groups, defaulting to empty array");
          paceGroups = [];
        }
      } catch (parseError) {
        log.error("Failed to parse pace groups JSON from LLM response", {
          error: parseError,
          responseText: result.text.substring(0, 500),
        });
        paceGroups = [];
      }

      log.info("Pace groups detected", {
        count: paceGroups.length,
        groups: paceGroups.map((g) => ({
          id: g.id,
          label: g.label || g.timeRange.label,
          timeRange: g.timeRange.label,
        })),
      });

      return paceGroups;
    } catch (error) {
      log.error("Failed to detect pace groups from text", error);
      throw new InternalServerError(
        "Failed to detect pace groups from training plan",
        error
      );
    }
  }

  /**
   * Convert PDF text to CSV format using LLM
   * @param pdfText - Extracted text from PDF training plan
   * @param startDate - Training plan start date in YYYY-MM-DD format
   * @param targetTimeSeconds - Optional target race time in seconds for pace group selection
   * @param matchedPaceGroup - Optional matched pace group with paces to use
   * @returns CSV formatted string
   */
  async convertPdfTextToCsv(
    pdfText: string,
    startDate: string,
    targetTimeSeconds?: number,
    matchedPaceGroup?: PaceGroup
  ): Promise<string> {
    try {
      log.info("Converting PDF text to CSV using LLM", {
        textLength: pdfText.length,
        startDate,
        hasTargetTime: !!targetTimeSeconds,
        hasMatchedPaceGroup: !!matchedPaceGroup,
      });

      // Build pace group context for the prompt
      let paceGroupContext = "";
      if (matchedPaceGroup) {
        paceGroupContext = `
🎯 PACE GROUP INFORMATION
You MUST use the following pace group paces for ALL workouts in the CSV:

Pace Group: ${matchedPaceGroup.label || matchedPaceGroup.timeRange.label}
${matchedPaceGroup.paces.easy ? `- Easy pace: ${matchedPaceGroup.paces.easy}` : ""}
${matchedPaceGroup.paces.tempo ? `- Tempo pace: ${matchedPaceGroup.paces.tempo}` : ""}
${matchedPaceGroup.paces.interval ? `- Interval pace: ${matchedPaceGroup.paces.interval}` : ""}
${matchedPaceGroup.paces.long ? `- Long run pace: ${matchedPaceGroup.paces.long}` : ""}
${matchedPaceGroup.paces.recovery ? `- Recovery pace: ${matchedPaceGroup.paces.recovery}` : ""}

CRITICAL: Use these exact paces for the corresponding workout types. Do NOT use paces from other pace groups in the plan.
`;
      } else if (targetTimeSeconds) {
        // Check if this is a completion goal (very large target time)
        const isCompletionGoal = targetTimeSeconds >= 14400; // 4 hours threshold
        
        paceGroupContext = `
🎯 TARGET TIME
The user's target race time is ${Math.floor(targetTimeSeconds / 3600)}:${Math.floor((targetTimeSeconds % 3600) / 60).toString().padStart(2, "0")}:${(targetTimeSeconds % 60).toString().padStart(2, "0")}.

${isCompletionGoal 
  ? "This appears to be a completion goal. If the plan contains multiple pace groups, select the most relaxed/easiest pace group (typically the one with the slowest paces or labeled as 'Completion', 'Finish Strong', etc.) and use those paces for all workouts."
  : "If the plan contains multiple pace groups, select the pace group that matches this target time and use those paces for all workouts."}
`;
      }

      const systemPrompt = `
## YOUR ROLE
You are a Running Training Plan Normalizer. Your job is to extract and standardize training plan data from any PDF — regardless of formatting — into a structured, machine-readable table.

🧩 INPUT
You will receive a PDF file or the extracted text from the PDF file by the user. The file may contain text, tables, or images showing a running training plan. If the file contains the training plan in miles and kilometers, consider the kilometers version.
${paceGroupContext}
📅 TRAINING PLAN START DATE
The user has specified that this training plan starts on: ${startDate}
Use this as the starting date for the training plan. If the PDF contains explicit dates, use those. Otherwise, follow these rules:

WEEK STRUCTURE ALIGNMENT (CRITICAL):
- If the PDF shows a week structure (e.g., columns labeled Monday, Tuesday, Wednesday, etc., or a table with days of week), you MUST align the PDF's week structure with the calendar week containing the startDate.
- IMPORTANT: If the user enters a startDate that is mid-week (e.g., Thursday), it means the training plan has ALREADY STARTED that week. The user is indicating they are currently in that week.
- If the PDF's week starts with Monday (most common), ALWAYS map the PDF's Monday to the Monday of the week that contains ${startDate}.
- For example:
  - If startDate is ${startDate} (which is a ${new Date(startDate).toLocaleDateString('en-US', { weekday: 'long'})})
  - Find the Monday of the week containing ${startDate}: if ${startDate} is Monday, use it; if ${startDate} is Tuesday-Sunday, use the previous Monday
  - Map the PDF's Monday column to that Monday, PDF's Tuesday to that Tuesday, PDF's Wednesday to that Wednesday, etc.
  - This ensures the PDF's week structure (Monday-Sunday) aligns with the calendar week containing the user's startDate
- The day of week in the CSV must match the actual calendar date (e.g., if date is 2025-01-01 and it's a Wednesday, day must be "Wed")

EXAMPLE:
- User startDate: 2025-01-02 (Thursday)
- PDF shows: Monday (Rest), Tuesday (5K), Wednesday (Intervals), Thursday (Strength), Friday (5K), Saturday (Rest), Sunday (Long Run)
- Correct mapping:
  - PDF Monday → 2024-12-30 (Monday of that week)
  - PDF Tuesday → 2024-12-31 (Tuesday)
  - PDF Wednesday → 2025-01-01 (Wednesday)
  - PDF Thursday → 2025-01-02 (Thursday - matches user's startDate)
  - PDF Friday → 2025-01-03 (Friday)
  - PDF Saturday → 2025-01-04 (Saturday)
  - PDF Sunday → 2025-01-05 (Sunday)

  ALWAYS ALIGN THE PDF'S WEEK STRUCTURE WITH THE CALENDAR WEEK CONTAINING THE START DATE.

🎯 OUTPUT
Your task is to produce a clean CSV (Comma Separated) table with the following columns:
| date | day | type | planned_distance_km | target_pace_min_per_km | target_HR_zone | notes |

Field Rules:
date → extract if explicitly mentioned in the PDF (e.g., "March 4", "10/03"); otherwise, use the week alignment rules above to map the PDF's week structure to calendar dates starting from the Monday of the week containing ${startDate}.

day → Mon, Tue, Wed, Thu, Fri, Sat, Sun. Make sure the day of the "date" matches this field. For example, if the date is 2025-01-01 and it's a Wednesday, then the day should be Wed.

type → one of {Easy, Long, Tempo, Interval, Recovery, Rest, Race, Cross-Training, Progression}.

planned_distance_km → convert all distances to kilometers, rounded to one decimal place. (e.g., "6 miles" → 9.7).

target_pace_min_per_km → have the target pace in a range format (e.g., "6:00-6:15/km). If the input has only a single value, have the range as the same value (e.g., "6:00-6:00/km). If the plan has details like "conversational", "fast pace" etc, then try to recommend a page range in the same format, if plan does not mention any pace, leave it empty.

target_HR_zone → Z1–Z5 ONLY if explicitly mentioned in the PDF. 
- If the PDF explicitly mentions "Z1", "Z2", "Z3", "Z4", "Z5", "Zone 1", "Zone 2", etc., include it
- If the PDF mentions heart rate zones, HR zones, or zones in any form, include them
- If the PDF mentions bpm or %HRmax, you may map to zones using: Z1: <65% HRmax or <120 bpm, Z2: 65–75% HRmax or 120–140 bpm, Z3: 75–85% HRmax or 140–160 bpm, Z4: 85–90% HRmax or 160–175 bpm, Z5: >90% HRmax or >175 bpm
- If the PDF does NOT mention HR zones, heart rate zones, zones, bpm, or %HRmax, leave this field EMPTY
- Do NOT infer that "Easy" runs are Z2 or "Tempo" runs are Z4 - only use zones if explicitly stated in the PDF

notes → include any other textual context (e.g., "hill repeats", "easy aerobic", "steady state", "rest day", "cross-train").

🧠 PROCESSING STEPS
Read all text from the uploaded PDF.

Identify individual sessions (each line or table row that describes a specific day's workout).

Extract relevant data points using pattern recognition:
- Numbers with "km" or "mile" → distance
- Time formats (e.g., 5:00/km) → pace
- Keywords → classify type (e.g., "interval", "tempo", "long run", "rest")
- In case the overall distance is not given, convert pace and time to get that. (e.g., if pace is 4:15/km and the workout is 6min * 3, then total distance = 4.24km)

Infer missing information logically:
- If "Rest" or "Off" day → set distance = 0, pace = null, HR = null.
- If information for a consecutive days is not given, then consider the day as Rest/Off day.
- Normalize units → all distances in kilometers, paces in min/km.
- IMPORTANT: Do NOT infer HR zones. Only include HR zones if explicitly mentioned in the PDF. Leave target_HR_zone empty if not mentioned.

Output a single, well-formatted CSV table — no markdown, no commentary, only the table.

🧾 OUTPUT FORMAT (STRICT)
date,day,type,planned_distance_km,target_pace_min_per_km,target_HR_zone,notes
2025-10-14,Tue,Easy,6,5:35,,"Easy, aerobic run" (zone is missing because it is not mentioned in the original PDF)
2025-10-15,Wed,Intervals,7,4:25,Z4,"6x800m, intervals"
2025-10-16,Thu,Rest,0,,,
2025-10-17,Fri,Easy,8,5:40,Z2,"Easy run, Zone 2" (only include Z2 because PDF explicitly mentions "Zone 2")

⚠️ OUTPUT RULES
Do not add markdown syntax (\`\`\`csv or tables with borders).
Do not include explanations, summaries, or confidence scores.
If multiple weeks exist, continue the same format (one row per run).
If the plan includes non-running sessions (e.g., gym, yoga), mark type = "Cross-Training".

CRITICAL CSV FORMATTING RULES:
1. If any field (especially the notes field) contains a comma, you MUST wrap the entire field in double quotes. For example: "2K Warm Up, Run 2K Tempo" must be written as "2K Warm Up, Run 2K Tempo" (with quotes). Unquoted commas will break CSV parsing.
2. DO NOT include any metadata rows in the CSV output. This includes:
   - Any rows that don't represent actual training days/workouts
3. Every row must have exactly same number of columns as the header row. If a field is empty, use an empty string (but still include the comma).
4. The CSV must start with the header row and contain ONLY training data rows - no metadata, no pace group information, no summary rows.

✅ EXAMPLE PROMPT FROM USER
"Here's my training plan PDF. Please extract it into your standard CSV format."

🧭 POST-PROCESS CHECKLIST (internal)
Ensure every row corresponds to one unique day or run.
Verify numeric conversions (miles→km, pace range→average).
Ensure consistent column order and no missing headers.

If you encounter ambiguous text, make reasonable assumptions but maintain structural consistency.
`;

      const userPrompt = `Convert the following training plan text to CSV format:\n\n${pdfText}`;

      const result = await generateText({
        model: openai(config.openai.model),
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
      });

      log.info("PDF text to CSV conversion successful", {
        resultLength: result.text.length,
        usage: result.usage,
      });

      return result.text;
    } catch (error) {
      log.error("Failed to convert PDF text to CSV", error);
      throw new InternalServerError(
        "Failed to convert PDF text to CSV format",
        error
      );
    }
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
        model: openai(config.openai.model),
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
   */
  buildStatusSystemPrompt(): string {
    return `You are an expert running coach assistant. Your sole task is to assess whether a runner's training is on track based on their recent activity data compared to their training plan.

## Your Role
- Analyze training adherence objectively
- Provide a single status assessment with brief rationale
- Be conservative - only mark as "on_track" when truly confident

## Confidence Requirement
You must be at least 90% confident in your assessment. If you cannot reach this confidence level due to insufficient data, respond with status "slightly_off_track" and explain the data limitations in your rationale.

## Status Definitions

**on_track**: The runner is executing their training plan within acceptable variance. This means:
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
  "rationale": "One to two sentences explaining the assessment.",
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
    planStartDate: Date
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

    return `## Training Plan Context
- Plan Start Date: ${startDate}
- Current Week: ${currentWeek}
- Today's Date: ${todayFormatted}
- Runner Experience: ${experienceLevelMap[experienceLevel]}

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
    planStartDate: Date
  ): Promise<TrainingStatusResult> {
    try {
      log.info("Generating training status assessment", {
        activitiesCount: activities.length,
        experienceLevel,
        currentWeek,
      });

      const systemPrompt = this.buildStatusSystemPrompt();
      const userPrompt = this.buildStatusUserPrompt(
        activities,
        csvContent,
        startDate,
        experienceLevel,
        currentWeek,
        planStartDate
      );

      log.debug("Training status prompts prepared", {
        systemPromptLength: systemPrompt.length,
        userPromptLength: userPrompt.length,
      });

      const result = await generateText({
        model: openai(config.openai.model),
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
