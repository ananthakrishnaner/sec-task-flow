import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TaskMetrics } from "@/types";
import { Activity, CheckCircle, Clock, AlertTriangle, TrendingUp } from "lucide-react";

interface DashboardMetricsProps {
  metrics: TaskMetrics;
}

export const DashboardMetrics = ({ metrics }: DashboardMetricsProps) => {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-3 sm:gap-4 mb-4 sm:mb-6">
      <Card className="bg-card-elevated shadow-card border-border">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 p-3 sm:p-4">
          <CardTitle className="text-xs sm:text-sm font-medium text-muted-foreground">Total Tasks</CardTitle>
          <Activity className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-primary" />
        </CardHeader>
        <CardContent className="p-3 pt-0 sm:p-4 sm:pt-0">
          <div className="text-xl sm:text-2xl font-bold text-foreground">{metrics.totalTasks}</div>
          <p className="text-xs text-muted-foreground">
            {metrics.projectTasksCount} project • {metrics.adHocTasksCount} ad-hoc
          </p>
        </CardContent>
      </Card>

      <Card className="bg-card-elevated shadow-card border-border">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 p-3 sm:p-4">
          <CardTitle className="text-xs sm:text-sm font-medium text-muted-foreground">Completed</CardTitle>
          <CheckCircle className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-success" />
        </CardHeader>
        <CardContent className="p-3 pt-0 sm:p-4 sm:pt-0">
          <div className="text-xl sm:text-2xl font-bold text-success">{metrics.completedTasks}</div>
          <p className="text-xs text-muted-foreground">
            {metrics.completionRate.toFixed(1)}% completion rate
          </p>
        </CardContent>
      </Card>

      <Card className="bg-card-elevated shadow-card border-border">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 p-3 sm:p-4">
          <CardTitle className="text-xs sm:text-sm font-medium text-muted-foreground">In Progress</CardTitle>
          <Clock className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-primary" />
        </CardHeader>
        <CardContent className="p-3 pt-0 sm:p-4 sm:pt-0">
          <div className="text-xl sm:text-2xl font-bold text-primary">{metrics.inProgressTasks}</div>
          <p className="text-xs text-muted-foreground">
            Active work items
          </p>
        </CardContent>
      </Card>

      <Card className="bg-card-elevated shadow-card border-border">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 p-3 sm:p-4">
          <CardTitle className="text-xs sm:text-sm font-medium text-muted-foreground">Blocked</CardTitle>
          <AlertTriangle className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-destructive" />
        </CardHeader>
        <CardContent className="p-3 pt-0 sm:p-4 sm:pt-0">
          <div className="text-xl sm:text-2xl font-bold text-destructive">{metrics.blockedTasks}</div>
          <p className="text-xs text-muted-foreground">
            Requires attention
          </p>
        </CardContent>
      </Card>

      <Card className="bg-card-elevated shadow-card border-border">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 p-3 sm:p-4">
          <CardTitle className="text-xs sm:text-sm font-medium text-muted-foreground">Weekly Trend</CardTitle>
          <TrendingUp className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-accent" />
        </CardHeader>
        <CardContent className="p-3 pt-0 sm:p-4 sm:pt-0">
          <div className="text-xl sm:text-2xl font-bold text-accent">{metrics.weeklyCompletions.reduce((a, b) => a + b, 0)}</div>
          <p className="text-xs text-muted-foreground">
            This week completed
          </p>
        </CardContent>
      </Card>
    </div>
  );
};