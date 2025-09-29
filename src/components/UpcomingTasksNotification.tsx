import { useState, useEffect, useMemo } from "react";
import { ProjectTask, AdHocTask } from "@/types";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Calendar, Clock, AlertTriangle, X, Bell, ChevronDown, ChevronUp } from "lucide-react";
import { format, differenceInDays, isToday, isTomorrow, addDays } from "date-fns";

interface UpcomingTasksNotificationProps {
  projectTasks: ProjectTask[];
  adHocTasks: AdHocTask[];
}

interface UpcomingTask {
  id: string;
  taskName: string;
  dueDate: string;
  type: 'project' | 'adhoc';
  status: string;
  daysUntilDue: number;
  squadName?: string;
  spoc?: string;
}

export const UpcomingTasksNotification = ({ projectTasks, adHocTasks }: UpcomingTasksNotificationProps) => {
  const [isDismissed, setIsDismissed] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);

  const upcomingTasks = useMemo(() => {
    const now = new Date();
    const tasks: UpcomingTask[] = [];

    // Check project tasks
    projectTasks.forEach(task => {
      if (task.status !== 'Complete') {
        const dueDate = new Date(task.deploymentDate);
        const daysUntilDue = differenceInDays(dueDate, now);
        
        // Show tasks due within next 7 days
        if (daysUntilDue >= 0 && daysUntilDue <= 7) {
          tasks.push({
            id: task.id,
            taskName: task.taskName,
            dueDate: task.deploymentDate,
            type: 'project',
            status: task.status,
            daysUntilDue,
            squadName: task.squadName,
            spoc: task.spoc
          });
        }
      }
    });

    // Check ad-hoc tasks
    adHocTasks.forEach(task => {
      if (task.status !== 'Complete') {
        const dueDate = new Date(task.dueDate);
        const daysUntilDue = differenceInDays(dueDate, now);
        
        // Show tasks due within next 7 days
        if (daysUntilDue >= 0 && daysUntilDue <= 7) {
          tasks.push({
            id: task.id,
            taskName: task.taskName,
            dueDate: task.dueDate,
            type: 'adhoc',
            status: task.status,
            daysUntilDue
          });
        }
      }
    });

    // Sort by days until due (most urgent first)
    return tasks.sort((a, b) => a.daysUntilDue - b.daysUntilDue);
  }, [projectTasks, adHocTasks]);

  // Reset dismissal when new urgent tasks appear
  useEffect(() => {
    const urgentTasks = upcomingTasks.filter(task => task.daysUntilDue <= 2);
    if (urgentTasks.length > 0) {
      setIsDismissed(false);
    }
  }, [upcomingTasks]);

  const getTaskUrgency = (daysUntilDue: number) => {
    if (daysUntilDue === 0) return { level: 'critical', label: 'Due Today', color: 'bg-destructive text-destructive-foreground' };
    if (daysUntilDue === 1) return { level: 'high', label: 'Due Tomorrow', color: 'bg-warning text-warning-foreground' };
    if (daysUntilDue <= 3) return { level: 'medium', label: `Due in ${daysUntilDue} days`, color: 'bg-warning/80 text-warning-foreground' };
    return { level: 'low', label: `Due in ${daysUntilDue} days`, color: 'bg-muted text-muted-foreground' };
  };

  const formatDueDate = (dueDate: string) => {
    const date = new Date(dueDate);
    if (isToday(date)) return 'Today';
    if (isTomorrow(date)) return 'Tomorrow';
    return format(date, 'MMM dd, yyyy');
  };

  if (upcomingTasks.length === 0 || isDismissed) {
    return null;
  }

  const criticalTasks = upcomingTasks.filter(task => task.daysUntilDue <= 1);
  const otherUpcomingTasks = upcomingTasks.filter(task => task.daysUntilDue > 1);

  return (
    <div className="mb-4 sm:mb-6">
      {/* Critical Tasks Alert */}
      {criticalTasks.length > 0 && (
        <Alert className="mb-4 border-destructive/50 bg-destructive/10">
          <AlertTriangle className="h-4 w-4 text-destructive" />
          <AlertDescription className="text-destructive">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
              <div className="flex-1">
                <span className="font-semibold">
                  {criticalTasks.length} task{criticalTasks.length > 1 ? 's' : ''} due {criticalTasks[0].daysUntilDue === 0 ? 'today' : 'tomorrow'}!
                </span>
                <span className="hidden sm:inline ml-2">Immediate attention required.</span>
              </div>
              <Button
                size="sm"
                variant="destructive"
                onClick={() => setIsExpanded(!isExpanded)}
                className="self-start sm:self-center"
              >
                <Bell className="h-3 w-3 mr-1" />
                <span className="hidden sm:inline">View Details</span>
                <span className="sm:hidden">View</span>
              </Button>
            </div>
          </AlertDescription>
        </Alert>
      )}

      {/* Upcoming Tasks Card */}
      {(upcomingTasks.length > criticalTasks.length || isExpanded) && (
        <Card className="bg-card shadow-card border-border border-l-4 border-l-primary">
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Bell className="h-4 w-4 text-primary" />
                <h3 className="font-semibold text-foreground">
                  Upcoming Deployments & Due Tasks
                </h3>
                <Badge variant="secondary" className="ml-2">
                  {upcomingTasks.length}
                </Badge>
              </div>
              <div className="flex items-center gap-1">
                {upcomingTasks.length > 3 && (
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => setIsExpanded(!isExpanded)}
                    className="h-6 px-2"
                  >
                    {isExpanded ? (
                      <ChevronUp className="h-3 w-3" />
                    ) : (
                      <ChevronDown className="h-3 w-3" />
                    )}
                  </Button>
                )}
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => setIsDismissed(true)}
                  className="h-6 px-2 text-muted-foreground hover:text-foreground"
                >
                  <X className="h-3 w-3" />
                </Button>
              </div>
            </div>

            <div className="space-y-2">
              {/* Show critical tasks first */}
              {criticalTasks.map((task) => {
                const urgency = getTaskUrgency(task.daysUntilDue);
                return (
                  <div
                    key={task.id}
                    className="flex flex-col sm:flex-row sm:items-center gap-2 p-3 rounded-lg bg-muted/30 border border-border"
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h4 className="font-medium text-foreground truncate">{task.taskName}</h4>
                        <Badge 
                          variant="secondary" 
                          className={`text-xs ${task.type === 'project' ? 'bg-primary/10 text-primary' : 'bg-accent/10 text-accent'}`}
                        >
                          {task.type === 'project' ? 'Project' : 'Ad-Hoc'}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-4 text-xs text-muted-foreground">
                        <div className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          <span>{formatDueDate(task.dueDate)}</span>
                        </div>
                        {task.squadName && (
                          <div className="hidden sm:flex items-center gap-1">
                            <span>Squad:</span>
                            <span className="font-medium">{task.squadName}</span>
                          </div>
                        )}
                        {task.spoc && (
                          <div className="hidden sm:flex items-center gap-1">
                            <span>SPOC:</span>
                            <span className="font-medium">{task.spoc}</span>
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge className={urgency.color}>
                        {urgency.label}
                      </Badge>
                      <Badge variant="outline" className="text-xs">
                        {task.status}
                      </Badge>
                    </div>
                  </div>
                );
              })}

              {/* Show other upcoming tasks if expanded or if no critical tasks */}
              {(isExpanded || criticalTasks.length === 0) && otherUpcomingTasks.slice(0, isExpanded ? undefined : 3).map((task) => {
                const urgency = getTaskUrgency(task.daysUntilDue);
                return (
                  <div
                    key={task.id}
                    className="flex flex-col sm:flex-row sm:items-center gap-2 p-3 rounded-lg bg-muted/10 border border-border"
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h4 className="font-medium text-foreground truncate">{task.taskName}</h4>
                        <Badge 
                          variant="secondary" 
                          className={`text-xs ${task.type === 'project' ? 'bg-primary/10 text-primary' : 'bg-accent/10 text-accent'}`}
                        >
                          {task.type === 'project' ? 'Project' : 'Ad-Hoc'}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-4 text-xs text-muted-foreground">
                        <div className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          <span>{formatDueDate(task.dueDate)}</span>
                        </div>
                        {task.squadName && (
                          <div className="hidden sm:flex items-center gap-1">
                            <span>Squad:</span>
                            <span className="font-medium">{task.squadName}</span>
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge className={urgency.color}>
                        {urgency.label}
                      </Badge>
                      <Badge variant="outline" className="text-xs">
                        {task.status}
                      </Badge>
                    </div>
                  </div>
                );
              })}

              {!isExpanded && otherUpcomingTasks.length > 3 && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setIsExpanded(true)}
                  className="w-full mt-2 text-muted-foreground hover:text-foreground"
                >
                  Show {otherUpcomingTasks.length - 3} more upcoming tasks
                  <ChevronDown className="h-3 w-3 ml-1" />
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};