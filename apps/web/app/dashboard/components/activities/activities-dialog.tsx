"use client";

import { Archive } from "lucide-react";

import type { Activity } from "@adaptive-training-plan/types";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer";
import { useMediaQuery } from "@/hooks/use-media-query";

import { ActivityListItem } from "./activity-list-item";

interface ActivitiesDialogProps {
  activities: Activity[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

/**
 * Empty state component when no activities exist
 */
const EmptyState = () => (
  <div className="flex flex-col items-center justify-center py-12 text-center">
    <Archive className="h-12 w-12 text-muted-foreground mb-4" />
    <h3 className="text-lg font-semibold text-foreground">
      No activities found
    </h3>
    <p className="text-sm text-muted-foreground mt-2">
      You haven&apos;t logged any activities in the last 30 days.
    </p>
  </div>
);

/**
 * Activity list content shared between Dialog and Drawer
 */
const ActivityListContent = ({ activities }: { activities: Activity[] }) => {
  if (activities.length === 0) {
    return <EmptyState />;
  }

  return (
    <div className="pb-4">
      {activities.map((activity) => (
        <ActivityListItem key={activity.id} activity={activity} />
      ))}
    </div>
  );
};

/**
 * Responsive dialog/drawer for displaying recent Strava activities
 * Uses Drawer (bottom sheet) on mobile, Dialog on desktop
 */
export const ActivitiesDialog = ({
  activities,
  open,
  onOpenChange,
}: ActivitiesDialogProps) => {
  const isMobile = useMediaQuery("(max-width: 767px)");

  const title = "Your last 30 days Strava activities";

  // Mobile: Use Drawer (bottom sheet)
  if (isMobile) {
    return (
      <Drawer open={open} onOpenChange={onOpenChange}>
        <DrawerContent className="max-h-[90vh]">
          <DrawerHeader className="text-left">
            <DrawerTitle>{title}</DrawerTitle>
          </DrawerHeader>
          <div className="flex-1 overflow-auto px-4 pb-6">
            <ActivityListContent activities={activities} />
          </div>
        </DrawerContent>
      </Drawer>
    );
  }

  // Desktop: Use Dialog
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-hidden flex flex-col">
        <DialogHeader className="flex-shrink-0">
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>
        <div className="overflow-y-auto flex-1 -mx-6 px-6">
          <ActivityListContent activities={activities} />
        </div>
      </DialogContent>
    </Dialog>
  );
};
