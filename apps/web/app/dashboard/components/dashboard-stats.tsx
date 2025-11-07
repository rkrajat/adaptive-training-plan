import { Archive, Heart, Zap } from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface StatCardConfig {
  icon: React.ReactNode;
  label: string;
  value: string;
}

/**
 * Dashboard statistics cards showing key metrics
 * TODO: Replace hardcoded values with dynamic data from API
 */
export const DashboardStats = () => {
  const stats: StatCardConfig[] = [
    {
      icon: <Zap className="h-4 w-4 text-emerald-500" />,
      label: "Avg Pace",
      value: "5:12 /km",
    },
    {
      icon: <Heart className="h-4 w-4 text-orange-500 fill-orange-500" />,
      label: "Avg HR",
      value: "152 bpm",
    },
    {
      icon: <Zap className="h-4 w-4 text-emerald-500" />,
      label: "Weekly Distance",
      value: "42.3 km",
    },
    {
      icon: <Archive className="h-4 w-4 text-gray-600" />,
      label: "Sleep Score",
      value: "82/100",
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-6 sm:mb-8">
      {stats.map((stat) => (
        <Card key={stat.label}>
          <CardHeader className="pb-2">
            <CardTitle className="text-xs sm:text-sm font-medium flex items-center gap-2 text-muted-foreground">
              {stat.icon}
              {stat.label}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-xl sm:text-2xl font-bold">{stat.value}</div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};
