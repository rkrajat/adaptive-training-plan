import type {
  RaceDistance,
  RaceGoal,
  PaceGroup,
} from "@adaptive-training-plan/types";
import {
  getCurrentWeekNumber,
  recalculateCsvDates,
  matchPaceGroupToTargetTime,
  getDefaultPaceGroup,
  getMostRelaxedPaceGroup,
} from "@adaptive-training-plan/utils";
import mongoose from "mongoose";

import { TrainingPlan, type ITrainingPlan } from "../models/TrainingPlan";
import {
  TrainingPlanVersion,
  type ITrainingPlanVersion,
} from "../models/TrainingPlanVersion";
import { User } from "../models/User";
import type {
  TrainingPlanResponse,
  TrainingPlanWithContentResponse,
  TrainingPlanWithVersionsResponse,
  TrainingPlanVersionResponse,
  ListTrainingPlansResponse,
  TrainingPlanUploadRequest,
} from "../types/api.types";
import { parseCsvBuffer } from "../utils/csv-parser";
import { validateCsvStructure, validateCsvFile } from "../utils/csv-validator";
import {
  AppError,
  InternalServerError,
  NotFoundError,
  ForbiddenError,
} from "../utils/error";
import { log } from "../utils/logger";

import { aiService } from "./ai.service";
import { pdfToCsvService } from "./pdf-to-csv.service";
import { vdotService } from "./vdot.service";

/**
 * Training Plan Service
 * Handles training plan CRUD operations and version management
 */
export class TrainingPlanService {
  /**
   * Process training plan file and generate CSV content
   * This is the core logic extracted for testability
   * @param file - Uploaded file (PDF or CSV)
   * @param metadata - Training plan metadata including race goal
   * @param fileType - "pdf" or "csv"
   * @returns Generated CSV content string
   */
  private async processTrainingPlanFile(
    file: Express.Multer.File,
    metadata: TrainingPlanUploadRequest,
    fileType: "csv" | "pdf"
  ): Promise<string> {
    let csvContent: string;
    let paceGroups: PaceGroup[] = [];
    let matchedPaceGroup: PaceGroup | null = null;

    if (fileType === "pdf") {
      log.info("Converting PDF to CSV", { filename: file.originalname });

      // Step 1: Extract PDF text
      const extractedText = await pdfToCsvService.extractTextFromPdf(
        file.buffer
      );

      // Step 2: Detect pace groups and match if raceGoal exists
      if (metadata.raceGoal) {
        log.info("Detecting pace groups from PDF text", {
          textLength: extractedText.length,
          targetTimeSeconds: metadata.raceGoal.targetTimeSeconds,
        });

        paceGroups = await aiService.detectPaceGroupsFromText(extractedText);

        log.info("Pace groups detected from PDF", {
          count: paceGroups.length,
          groups: paceGroups.map((g) => ({
            id: g.id,
            label: g.label || g.timeRange.label,
            timeRange: `${g.timeRange.minSeconds}-${g.timeRange.maxSeconds ?? "null"}`,
            paces: Object.keys(g.paces),
          })),
        });

        if (paceGroups.length > 0) {
          // Try to match based on target time
          matchedPaceGroup = matchPaceGroupToTargetTime(
            paceGroups,
            metadata.raceGoal.targetTimeSeconds
          );

          // If no match found, check if this is an open-ended goal (very large target time)
          // For open-ended goals like "Completion", use the most relaxed pace group
          if (!matchedPaceGroup) {
            // Check if target time is very large (suggests completion goal)
            // Half marathon completion: > 3 hours (10800 seconds)
            // Marathon completion: > 6 hours (21600 seconds)
            // Use a threshold of 4 hours (14400 seconds) to detect completion goals
            const isCompletionGoal = metadata.raceGoal.targetTimeSeconds >= 14400;
            
            if (isCompletionGoal) {
              matchedPaceGroup = getMostRelaxedPaceGroup(paceGroups);
              log.info("Using most relaxed pace group for completion goal", {
                targetTimeSeconds: metadata.raceGoal.targetTimeSeconds,
                matchedGroupId: matchedPaceGroup?.id,
                matchedGroupLabel: matchedPaceGroup?.label || matchedPaceGroup?.timeRange.label,
              });
            } else {
              // Fallback to default (first group)
              matchedPaceGroup = getDefaultPaceGroup(paceGroups);
            }
          }

          if (matchedPaceGroup) {
            log.info("Matched pace group for target time", {
              targetTimeSeconds: metadata.raceGoal.targetTimeSeconds,
              matchedGroupId: matchedPaceGroup.id,
              matchedGroupLabel:
                matchedPaceGroup.label || matchedPaceGroup.timeRange.label,
              timeRange: matchedPaceGroup.timeRange.label,
              paces: matchedPaceGroup.paces,
            });
          } else {
            log.warn("No pace group matched, using default");
          }
        } else {
          log.info("No pace groups detected in PDF");
        }
      }

      // Step 3: Convert PDF to CSV with matched pace group
      const conversionResult = await pdfToCsvService.convertPdfToCsv(
        file.buffer,
        metadata.startDate,
        metadata.raceGoal?.targetTimeSeconds,
        matchedPaceGroup || undefined
      );

      if (!conversionResult.success || !conversionResult.csvContent) {
        const errorMessage =
          conversionResult.error?.message ||
          "Failed to convert PDF to training plan format";
        throw new AppError(errorMessage, 400);
      }

      csvContent = conversionResult.csvContent;

      log.info("PDF converted to CSV successfully", {
        csvLength: csvContent.length,
        lineCount: csvContent.split("\n").length,
        hasMatchedPaceGroup: !!matchedPaceGroup,
      });

      // Log CSV preview and paces used
      const csvPreview = csvContent.substring(0, 500);
      const csvLines = csvContent.split("\n").slice(0, 5);
      log.debug("Generated CSV preview", {
        preview: csvPreview,
        firstLines: csvLines,
        pacesUsed: matchedPaceGroup
          ? {
              easy: matchedPaceGroup.paces.easy,
              tempo: matchedPaceGroup.paces.tempo,
              interval: matchedPaceGroup.paces.interval,
              long: matchedPaceGroup.paces.long,
              recovery: matchedPaceGroup.paces.recovery,
            }
          : undefined,
      });
    } else {
      // Handle CSV files
      csvContent = parseCsvBuffer(file.buffer);

      log.debug("Original CSV content", {
        csvLength: csvContent.length,
        lineCount: csvContent.split("\n").length,
        preview: csvContent.substring(0, 500),
      });

      // Step 2: Detect pace groups and match if raceGoal exists
      if (metadata.raceGoal) {
        log.info("Detecting pace groups from CSV content", {
          csvLength: csvContent.length,
          targetTimeSeconds: metadata.raceGoal.targetTimeSeconds,
        });

        paceGroups = await aiService.detectPaceGroupsFromText(csvContent);

        log.info("Pace groups detected from CSV", {
          count: paceGroups.length,
          groups: paceGroups.map((g) => ({
            id: g.id,
            label: g.label || g.timeRange.label,
            timeRange: `${g.timeRange.minSeconds}-${g.timeRange.maxSeconds ?? "null"}`,
            paces: Object.keys(g.paces),
          })),
        });

        if (paceGroups.length > 0) {
          // Try to match based on target time
          matchedPaceGroup = matchPaceGroupToTargetTime(
            paceGroups,
            metadata.raceGoal.targetTimeSeconds
          );

          // If no match found, check if this is an open-ended goal (very large target time)
          // For open-ended goals like "Completion", use the most relaxed pace group
          if (!matchedPaceGroup) {
            // Check if target time is very large (suggests completion goal)
            // Half marathon completion: > 3 hours (10800 seconds)
            // Marathon completion: > 6 hours (21600 seconds)
            // Use a threshold of 4 hours (14400 seconds) to detect completion goals
            const isCompletionGoal = metadata.raceGoal.targetTimeSeconds >= 14400;
            
            if (isCompletionGoal) {
              matchedPaceGroup = getMostRelaxedPaceGroup(paceGroups);
              log.info("Using most relaxed pace group for completion goal", {
                targetTimeSeconds: metadata.raceGoal.targetTimeSeconds,
                matchedGroupId: matchedPaceGroup?.id,
                matchedGroupLabel: matchedPaceGroup?.label || matchedPaceGroup?.timeRange.label,
              });
            } else {
              // Fallback to default (first group)
              matchedPaceGroup = getDefaultPaceGroup(paceGroups);
            }
          }

          if (matchedPaceGroup) {
            log.info("Matched pace group for target time", {
              targetTimeSeconds: metadata.raceGoal.targetTimeSeconds,
              matchedGroupId: matchedPaceGroup.id,
              matchedGroupLabel:
                matchedPaceGroup.label || matchedPaceGroup.timeRange.label,
              timeRange: matchedPaceGroup.timeRange.label,
              paces: matchedPaceGroup.paces,
            });
          } else {
            log.warn("No pace group matched, using default");
          }
        } else {
          log.info("No pace groups detected in CSV");
        }

        // Note: For CSV files, we don't filter/format the CSV content yet in Part 1
        // This will be done in Part 2 if needed
        log.debug("Final CSV content (no filtering applied in Part 1)", {
          csvLength: csvContent.length,
          lineCount: csvContent.split("\n").length,
          preview: csvContent.substring(0, 500),
          sampleRows: csvContent.split("\n").slice(0, 5),
        });
      }
    }

    // Validate CSV structure (for both converted PDFs and direct CSV uploads)
    validateCsvStructure(csvContent);

    return csvContent;
  }

  /**
   * Create a new training plan with initial version
   * Uses MongoDB transactions to ensure atomicity
   */
  async createTrainingPlan(
    userId: string,
    file: Express.Multer.File,
    metadata: TrainingPlanUploadRequest,
    fileType: "csv" | "pdf" = "csv"
  ): Promise<TrainingPlanWithContentResponse> {
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      log.info("Creating training plan", { userId, metadata, fileType });

      validateCsvFile(file);

      // Process file and generate CSV content
      const csvContent = await this.processTrainingPlanFile(
        file,
        metadata,
        fileType
      );

      // Calculate VDOT and training paces from race goal
      let raceGoal: RaceGoal | undefined;
      if (metadata.raceGoal) {
        raceGoal = vdotService.createRaceGoal(
          metadata.raceGoal.distance as RaceDistance,
          metadata.raceGoal.targetTimeSeconds
        );

        log.info("VDOT calculated for race goal", {
          userId,
          distance: raceGoal.distanceLabel,
          vdot: raceGoal.vdot,
        });

        // Update user with race goal and training paces
        await User.findByIdAndUpdate(
          userId,
          { raceGoal },
          { session }
        );

        log.info("User race goal updated", { userId, vdot: raceGoal.vdot });
      }

      // Create training plan
      const trainingPlanData = {
        userId: new mongoose.Types.ObjectId(userId),
        csvContent,
        metadata: {
          name: metadata.name,
          goal: metadata.goal,
          raceName: metadata.raceName,
          raceDate: metadata.raceDate ? new Date(metadata.raceDate) : undefined,
          raceDistance: metadata.raceDistance,
          targetTime: metadata.targetTime,
        },
        source: "user_upload" as const,
        isActive: true,
        startDate: new Date(metadata.startDate),
      };

      const [trainingPlan] = await TrainingPlan.create([trainingPlanData], {
        session,
      });

      log.info("Training plan created", {
        trainingPlanId: trainingPlan._id,
        userId,
      });

      // Create initial version
      const versionData = {
        trainingPlanId: trainingPlan._id as mongoose.Types.ObjectId,
        versionNumber: 1,
        csvContent,
        metadata: trainingPlan.metadata,
        changeType: "created" as const,
        changeDescription: "Initial plan upload",
      };

      await TrainingPlanVersion.create([versionData], { session });

      log.info("Initial version created", {
        trainingPlanId: trainingPlan._id,
        versionNumber: 1,
      });

      // Commit transaction
      await session.commitTransaction();

      return this.formatTrainingPlanWithContent(trainingPlan);
    } catch (error) {
      await session.abortTransaction();
      log.error("Failed to create training plan", error, { userId });

      if (error instanceof AppError) {
        throw error;
      }
      throw new InternalServerError("Failed to create training plan", error);
    } finally {
      await session.endSession();
    }
  }

  /**
   * Get training plan by ID
   */
  async getTrainingPlan(
    planId: string,
    userId: string
  ): Promise<TrainingPlanWithContentResponse> {
    try {
      log.info("Fetching training plan", { planId, userId });

      const trainingPlan = await TrainingPlan.findById(planId);

      if (!trainingPlan) {
        throw new NotFoundError("Training plan not found");
      }

      // Verify ownership
      if (String(trainingPlan.userId) !== userId) {
        throw new ForbiddenError(
          "You do not have permission to access this training plan"
        );
      }

      return this.formatTrainingPlanWithContent(trainingPlan);
    } catch (error) {
      if (error instanceof NotFoundError || error instanceof ForbiddenError) {
        throw error;
      }
      log.error("Failed to fetch training plan", error, { planId, userId });
      throw new InternalServerError("Failed to fetch training plan", error);
    }
  }

  /**
   * Get all training plans for a user
   */
  async getUserTrainingPlans(
    userId: string,
    isActive?: boolean
  ): Promise<ListTrainingPlansResponse> {
    try {
      log.info("Fetching user training plans", { userId, isActive });

      const query: Record<string, unknown> = {
        userId: new mongoose.Types.ObjectId(userId),
      };

      if (isActive !== undefined) {
        query.isActive = isActive;
      }

      const trainingPlans = await TrainingPlan.find(query).sort({
        createdAt: -1,
      });

      return {
        plans: trainingPlans.map((plan) =>
          isActive
            ? this.formatTrainingPlanWithContent(plan)
            : this.formatTrainingPlan(plan)
        ),
      };
    } catch (error) {
      log.error("Failed to fetch user training plans", error, { userId });
      throw new InternalServerError(
        "Failed to fetch user training plans",
        error
      );
    }
  }

  /**
   * Get training plan with all versions
   */
  async getTrainingPlanWithVersions(
    planId: string,
    userId: string
  ): Promise<TrainingPlanWithVersionsResponse> {
    try {
      log.info("Fetching training plan with versions", { planId, userId });

      const trainingPlan = await TrainingPlan.findById(planId);

      if (!trainingPlan) {
        throw new NotFoundError("Training plan not found");
      }

      // Verify ownership
      if (String(trainingPlan.userId) !== userId) {
        throw new ForbiddenError(
          "You do not have permission to access this training plan"
        );
      }

      // Fetch all versions
      const versions = await TrainingPlanVersion.find({
        trainingPlanId: planId,
      }).sort({ versionNumber: -1 });

      return {
        ...this.formatTrainingPlanWithContent(trainingPlan),
        versions: versions.map((version) => this.formatVersion(version)),
      };
    } catch (error) {
      if (error instanceof NotFoundError || error instanceof ForbiddenError) {
        throw error;
      }
      log.error("Failed to fetch training plan with versions", error, {
        planId,
        userId,
      });
      throw new InternalServerError(
        "Failed to fetch training plan with versions",
        error
      );
    }
  }

  /**
   * Format training plan for API response (without CSV content)
   */
  private formatTrainingPlan(plan: ITrainingPlan): TrainingPlanResponse {
    // Calculate current week dynamically based on start date
    const currentWeek = getCurrentWeekNumber(plan.startDate);

    return {
      id: String(plan._id),
      userId: String(plan.userId),
      metadata: {
        name: plan.metadata.name,
        goal: plan.metadata.goal,
        raceName: plan.metadata.raceName,
        raceDate: plan.metadata.raceDate?.toISOString(),
        raceDistance: plan.metadata.raceDistance,
        targetTime: plan.metadata.targetTime,
      },
      source: plan.source,
      isActive: plan.isActive,
      currentWeek,
      startDate: plan.startDate.toISOString(),
      createdAt: plan.createdAt.toISOString(),
      updatedAt: plan.updatedAt.toISOString(),
    };
  }

  /**
   * Format training plan with CSV content for API response
   */
  private formatTrainingPlanWithContent(
    plan: ITrainingPlan
  ): TrainingPlanWithContentResponse {
    return {
      ...this.formatTrainingPlan(plan),
      csvContent: plan.csvContent,
    };
  }

  /**
   * Format training plan version for API response
   */
  private formatVersion(
    version: ITrainingPlanVersion
  ): TrainingPlanVersionResponse {
    return {
      id: String(version._id),
      trainingPlanId: String(version.trainingPlanId),
      versionNumber: version.versionNumber,
      metadata: {
        name: version.metadata.name,
        goal: version.metadata.goal,
        raceName: version.metadata.raceName,
        raceDate: version.metadata.raceDate?.toISOString(),
        raceDistance: version.metadata.raceDistance,
        targetTime: version.metadata.targetTime,
      },
      changeType: version.changeType,
      changeDescription: version.changeDescription,
      createdAt: version.createdAt.toISOString(),
      updatedAt: version.updatedAt.toISOString(),
    };
  }

  /**
   * Update training plan start date
   * Recalculates CSV dates to maintain consistency with the new start date
   */
  async updateStartDate(
    planId: string,
    userId: string,
    startDate: string
  ): Promise<TrainingPlanWithContentResponse> {
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      log.info("Updating training plan start date", { planId, userId });

      const trainingPlan = await TrainingPlan.findById(planId);

      if (!trainingPlan) {
        throw new NotFoundError("Training plan not found");
      }

      // Verify ownership
      if (String(trainingPlan.userId) !== userId) {
        throw new ForbiddenError(
          "You do not have permission to update this training plan"
        );
      }

      const oldStartDate = trainingPlan.startDate.toISOString().split("T")[0];
      const newStartDate = startDate;

      // Recalculate CSV dates to match new start date
      const updatedCsvContent = recalculateCsvDates(
        trainingPlan.csvContent,
        oldStartDate,
        newStartDate
      );

      log.info("CSV dates recalculated for new start date", {
        planId,
        oldStartDate,
        newStartDate,
      });

      // Update both start date and CSV content
      trainingPlan.startDate = new Date(startDate);
      trainingPlan.csvContent = updatedCsvContent;
      await trainingPlan.save({ session });

      // Create a new version to track this change
      const latestVersion = await TrainingPlanVersion.findOne({
        trainingPlanId: planId,
      }).sort({ versionNumber: -1 });

      const newVersionNumber = (latestVersion?.versionNumber || 0) + 1;

      await TrainingPlanVersion.create(
        [
          {
            trainingPlanId: trainingPlan._id,
            versionNumber: newVersionNumber,
            csvContent: updatedCsvContent,
            metadata: trainingPlan.metadata,
            changeType: "start_date_updated" as const,
            changeDescription: `Start date updated from ${oldStartDate} to ${newStartDate}`,
          },
        ],
        { session }
      );

      log.info("Training plan version created for start date update", {
        planId,
        versionNumber: newVersionNumber,
      });

      // Commit transaction
      await session.commitTransaction();

      return this.formatTrainingPlanWithContent(trainingPlan);
    } catch (error) {
      await session.abortTransaction();
      log.error("Failed to update training plan start date", error, {
        planId,
        userId,
      });

      if (error instanceof NotFoundError || error instanceof ForbiddenError) {
        throw error;
      }

      throw new InternalServerError(
        "Failed to update training plan start date",
        error
      );
    } finally {
      await session.endSession();
    }
  }

  /**
   * Delete training plan
   */
  async deleteTrainingPlan(planId: string, userId: string): Promise<void> {
    try {
      log.info("Deleting training plan", { planId, userId });

      const trainingPlan = await TrainingPlan.findById(planId);

      if (!trainingPlan) {
        throw new NotFoundError("Training plan not found");
      }

      // Verify ownership
      if (String(trainingPlan.userId) !== userId) {
        throw new ForbiddenError(
          "You do not have permission to delete this training plan"
        );
      }

      // Delete the training plan
      await TrainingPlan.deleteOne({ _id: planId });

      log.info("Training plan deleted successfully", { planId });
    } catch (error) {
      log.error("Failed to delete training plan", error, { planId, userId });
      throw new InternalServerError("Failed to delete training plan", error);
    }
  }
}

// Export singleton instance
export const trainingPlanService = new TrainingPlanService();
