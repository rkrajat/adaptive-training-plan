import type { ExperienceLevel } from "@adaptive-training-plan/types";
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
   * Build user prompt with enhanced activity data and training plan from database
   */
  private buildUserPromptWithEnhancedActivities(
    activities: EnhancedFormattedActivity[],
    trainingPlanData: string,
    userFeedback?: string,
    experienceLevel?: ExperienceLevel
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

    console.log("=======", {
      activitiesTable,
      trainingPlanData,
      runningExperience,
    });

    let prompt = `## Recent Running Activities (Last 30 Days)\n${activitiesTable}\n\n## Training Plan\n${trainingPlanData}\n\n## Running Experience\n${runningExperience}`;

    if (userFeedback) {
      prompt += `\n\n## Athlete Feedback\n${userFeedback}`;
    }

    // prompt += `\n\n## Request\nBased on the detailed activity data and training plan above (currently on Week ${currentWeek}), provide specific recommendations for adjusting this week's training. Consider:\n- Training load and volume trends\n- Pace and heart rate patterns\n- Recovery indicators\n- Run type distribution\n- Any patterns or concerns in the data\n\nBe specific about which workouts to modify, keep as planned, or adjust in intensity or duration.`;

    return prompt;
  }

  /**
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
   */
  generateRecommendationsWithEnhancedPlan(
    activities: EnhancedFormattedActivity[],
    csvContent: string,
    currentWeek: number,
    startDate: string,
    userFeedback?: string,
    experienceLevel?: ExperienceLevel
  ) {
    try {
      log.info("Generating AI recommendations with enhanced activity data", {
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
      const userPrompt = this.buildUserPromptWithEnhancedActivities(
        activities,
        trainingPlanData,
        userFeedback,
        experienceLevel
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
   * Convert PDF text to CSV format using LLM
   * @param pdfText - Extracted text from PDF training plan
   * @param startDate - Training plan start date in YYYY-MM-DD format
   * @returns CSV formatted string
   */
  async convertPdfTextToCsv(
    pdfText: string,
    startDate: string
  ): Promise<string> {
    try {
      log.info("Converting PDF text to CSV using LLM", {
        textLength: pdfText.length,
        startDate,
      });

      const systemPrompt = `
## YOUR ROLE
You are a Running Training Plan Normalizer. Your job is to extract and standardize training plan data from any PDF — regardless of formatting — into a structured, machine-readable table.

🧩 INPUT
You will receive a PDF file or the extracted text from the PDF file by the user. The file may contain text, tables, or images showing a running training plan. If the file contains the training plan in miles and kilometers, consider the kilometers version.

📅 TRAINING PLAN START DATE
The user has specified that this training plan starts on: ${startDate}
Use this as the starting date for the training plan. If the PDF contains explicit dates, use those. Otherwise, start from ${startDate} and increment sequentially for each day.
THIS IS VERY IMPORTANT. DO NOT CHANGE THE START DATE. AND ALWAYS USE CORRECT DATE AND DAYS.

🎯 OUTPUT
Your task is to produce a clean CSV (Comma Separated) table with the following columns:
| date | day | type | planned_distance_km | target_pace_min_per_km | target_HR_zone | notes |

Field Rules:
date → extract if explicitly mentioned in the PDF (e.g., "March 4", "10/03"); otherwise, infer sequential days starting from ${startDate}. The first training day should use ${startDate} as the date.

day → Mon, Tue, Wed, Thu, Fri, Sat, Sun. Make sure the day of the "date" matches this field. For example, if the date - 24th August 2025 is a Sunday, then the day should be Sun.

type → one of {Easy, Long, Tempo, Interval, Recovery, Rest, Race, Cross-Training, Progression}.

planned_distance_km → convert all distances to kilometers, rounded to one decimal place. (e.g., "6 miles" → 9.7).

target_pace_min_per_km → have the target pace in a range format (e.g., "6:00-6:15/km). If the input has only a single value, have the range as the same value (e.g., "6:00-6:00/km). If the plan doesn't clearly mention the pace, but rather has details like "conversational", "fast pace" etc, then try to recommend a page range in the above format, based on the context you understood from the training plan.

target_HR_zone → Z1–Z5 if explicitly mentioned. If written as bpm or %HRmax, map approximately:
Z1: <65% HRmax or <120 bpm
Z2: 65–75% HRmax or 120–140 bpm
Z3: 75–85% HRmax or 140–160 bpm
Z4: 85–90% HRmax or 160–175 bpm
Z5: >90% HRmax or >175 bpm

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

Output a single, well-formatted CSV table — no markdown, no commentary, only the table.

🧾 OUTPUT FORMAT (STRICT)
date,day,type,planned_distance_km,target_pace_min_per_km,target_HR_zone,notes
2025-10-14,Tue,Easy,6,5:35,Z2,"Easy, aerobic run"
2025-10-15,Wed,Intervals,7,4:25,Z4,"6x800m, intervals"
2025-10-16,Thu,Rest,0,,,

⚠️ OUTPUT RULES
Do not add markdown syntax (\`\`\`csv or tables with borders).
Do not include explanations, summaries, or confidence scores.
If multiple weeks exist, continue the same format (one row per run).
If the plan includes non-running sessions (e.g., gym, yoga), mark type = "Cross-Training".

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
}

// Export singleton instance
export const aiService = new AIService();
