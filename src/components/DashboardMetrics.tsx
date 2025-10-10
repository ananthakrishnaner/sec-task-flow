import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TaskMetrics } from "@/types";
import { Activity, CheckCircle, Clock, AlertTriangle, TrendingUp } from "lucide-react";

interface DashboardMetricsProps {
  metrics: TaskMetrics;
  privacyMode?: boolean;
}

export const DashboardMetrics = ({ metrics, privacyMode = false }: DashboardMetricsProps) => {
  return (
    <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-2 sm:gap-4 mb-4 sm:mb-6">
      <Card className="bg-card-elevated shadow-card border-border hover:shadow-elevated hover:scale-[1.02] transition-all duration-200 col-span-2 lg:col-span-1">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 p-2.5 sm:p-4">
          <CardTitle className="text-xs sm:text-sm font-medium text-muted-foreground">Total Tasks</CardTitle>
          <Activity className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-primary flex-shrink-0" />
        </CardHeader>
        <CardContent className="p-2.5 pt-0 sm:p-4 sm:pt-0">
          <div className="text-lg sm:text-2xl font-bold text-foreground">{privacyMode ? '***' : metrics.totalTasks}</div>
          {!privacyMode && (
            <p className="text-[10px] sm:text-xs text-muted-foreground truncate">
              {metrics.projectTasksCount} project • {metrics.adHocTasksCount} ad-hoc
            </p>
          )}
        </CardContent>
      </Card>

      <Card className="bg-card-elevated shadow-card border-border hover:shadow-elevated hover:scale-[1.02] transition-all duration-200 col-span-1">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 p-2.5 sm:p-4">
          <CardTitle className="text-xs sm:text-sm font-medium text-muted-foreground truncate">Completed</CardTitle>
          <CheckCircle className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-success flex-shrink-0" />
        </CardHeader>
        <CardContent className="p-2.5 pt-0 sm:p-4 sm:pt-0">
          <div className="text-lg sm:text-2xl font-bold text-success">{privacyMode ? '***' : metrics.completedTasks}</div>
          {!privacyMode && (
            <p className="text-[10px] sm:text-xs text-muted-foreground truncate">
              {metrics.completionRate.toFixed(1)}% rate
            </p>
          )}
        </CardContent>
      </Card>

      <Card className="bg-card-elevated shadow-card border-border hover:shadow-elevated hover:scale-[1.02] transition-all duration-200 col-span-1">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 p-2.5 sm:p-4">
          <CardTitle className="text-xs sm:text-sm font-medium text-muted-foreground truncate">In Progress</CardTitle>
          <Clock className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-primary flex-shrink-0" />
        </CardHeader>
        <CardContent className="p-2.5 pt-0 sm:p-4 sm:pt-0">
          <div className="text-lg sm:text-2xl font-bold text-primary">{privacyMode ? '***' : metrics.inProgressTasks}</div>
          {!privacyMode && (
            <p className="text-[10px] sm:text-xs text-muted-foreground truncate">
              Active items
            </p>
          )}
        </CardContent>
      </Card>

      <Card className="bg-card-elevated shadow-card border-border hover:shadow-elevated hover:scale-[1.02] transition-all duration-200 col-span-1">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 p-2.5 sm:p-4">
          <CardTitle className="text-xs sm:text-sm font-medium text-muted-foreground truncate">Blocked</CardTitle>
          <AlertTriangle className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-destructive flex-shrink-0" />
        </CardHeader>
        <CardContent className="p-2.5 pt-0 sm:p-4 sm:pt-0">
          <div className="text-lg sm:text-2xl font-bold text-destructive">{privacyMode ? '***' : metrics.blockedTasks}</div>
          {!privacyMode && (
            <p className="text-[10px] sm:text-xs text-muted-foreground truncate">
              Needs attention
            </p>
          )}
        </CardContent>
      </Card>

      <Card className="bg-card-elevated shadow-card border-border hover:shadow-elevated hover:scale-[1.02] transition-all duration-200 col-span-1">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 p-2.5 sm:p-4">
          <CardTitle className="text-xs sm:text-sm font-medium text-muted-foreground truncate">Weekly</CardTitle>
          <TrendingUp className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-accent flex-shrink-0" />
        </CardHeader>
        <CardContent className="p-2.5 pt-0 sm:p-4 sm:pt-0">
          <div className="text-lg sm:text-2xl font-bold text-accent">{privacyMode ? '***' : metrics.weeklyCompletions.reduce((a, b) => a + b, 0)}</div>
          {!privacyMode && (
            <p className="text-[10px] sm:text-xs text-muted-foreground truncate">
              This week
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
};