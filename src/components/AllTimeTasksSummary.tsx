import { ProjectTask, AdHocTask } from "@/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CheckCircle, Calendar } from "lucide-react";
import { format } from "date-fns";

interface AllTimeTasksSummaryProps {
  projectTasks: ProjectTask[];
  adHocTasks: AdHocTask[];
}

export const AllTimeTasksSummary = ({ projectTasks, adHocTasks }: AllTimeTasksSummaryProps) => {
  const allCompletedTasks = [
    ...projectTasks.filter(task => task.status === "Complete"),
    ...adHocTasks.filter(task => task.status === "Complete")
  ];

  const getDateRange = () => {
    if (allCompletedTasks.length === 0) return null;

    const startDates = allCompletedTasks.map(task => 
      new Date('startDate' in task ? task.startDate : task.createdAt)
    );
    const earliestStartDate = new Date(Math.min(...startDates.map(d => d.getTime())));
    const today = new Date();

    return {
      from: format(earliestStartDate, 'MMM dd, yyyy'),
      to: format(today, 'MMM dd, yyyy')
    };
  };

  const dateRange = getDateRange();

  return (
    <Card className="bg-gradient-primary shadow-elevated border-0 text-primary-foreground">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base font-semibold">
          <CheckCircle className="h-5 w-5" />
          All-Time Completed Tasks
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        <div className="text-4xl font-bold">
          {allCompletedTasks.length}
        </div>
        {dateRange && (
          <div className="flex items-center gap-2 text-sm opacity-90">
            <Calendar className="h-4 w-4" />
            <span>
              {dateRange.from} - {dateRange.to}
            </span>
          </div>
        )}
        {!dateRange && (
          <div className="text-sm opacity-75">
            No completed tasks yet
          </div>
        )}
      </CardContent>
    </Card>
  );
};
