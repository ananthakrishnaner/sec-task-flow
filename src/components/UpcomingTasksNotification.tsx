import { useState, useMemo } from "react";
import { ProjectTask, AdHocTask } from "@/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Calendar, Clock, AlertTriangle, Bell, ChevronDown, ChevronUp, Target, User, Zap, Filter, LayoutList, CalendarRange } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { format, differenceInDays, isToday, isTomorrow, addDays, startOfDay } from "date-fns";

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
  description: string;
}

type FilterOption = 'all' | 'critical' | 'high' | 'medium' | 'low';
type ViewMode = 'list' | 'timeline';

export const UpcomingTasksNotification = ({ projectTasks, adHocTasks }: UpcomingTasksNotificationProps) => {
  const [filter, setFilter] = useState<FilterOption>('all');
  const [isExpanded, setIsExpanded] = useState(true);
  const [viewMode, setViewMode] = useState<ViewMode>('list');

  const upcomingTasks = useMemo(() => {
    const now = new Date();
    const tasks: UpcomingTask[] = [];

    // Check project tasks
    projectTasks.forEach(task => {
      if (task.status !== 'Complete') {
        const dueDate = new Date(task.deploymentDate);
        const daysUntilDue = differenceInDays(dueDate, now);
        
        // Show tasks due within next 14 days for tab view (extended from 7 days)
        if (daysUntilDue >= -1 && daysUntilDue <= 14) {
          tasks.push({
            id: task.id,
            taskName: task.taskName,
            dueDate: task.deploymentDate,
            type: 'project',
            status: task.status,
            daysUntilDue,
            squadName: task.squadName,
            spoc: task.spoc,
            description: task.description
          });
        }
      }
    });

    // Check ad-hoc tasks
    adHocTasks.forEach(task => {
      if (task.status !== 'Complete') {
        const dueDate = new Date(task.dueDate);
        const daysUntilDue = differenceInDays(dueDate, now);
        
        // Show tasks due within next 14 days for tab view
        if (daysUntilDue >= -1 && daysUntilDue <= 14) {
          tasks.push({
            id: task.id,
            taskName: task.taskName,
            dueDate: task.dueDate,
            type: 'adhoc',
            status: task.status,
            daysUntilDue,
            description: task.description
          });
        }
      }
    });

    // Sort by days until due (most urgent first)
    return tasks.sort((a, b) => a.daysUntilDue - b.daysUntilDue);
  }, [projectTasks, adHocTasks]);

  const getTaskUrgency = (daysUntilDue: number) => {
    if (daysUntilDue === -1) return { level: 'overdue', label: 'Overdue', color: 'bg-destructive text-destructive-foreground' };
    if (daysUntilDue === 0) return { level: 'critical', label: 'Due Today', color: 'bg-destructive text-destructive-foreground' };
    if (daysUntilDue === 1) return { level: 'high', label: 'Due Tomorrow', color: 'bg-warning text-warning-foreground' };
    if (daysUntilDue <= 3) return { level: 'medium', label: `Due in ${daysUntilDue} days`, color: 'bg-warning/80 text-warning-foreground' };
    if (daysUntilDue <= 7) return { level: 'low', label: `Due in ${daysUntilDue} days`, color: 'bg-muted text-muted-foreground' };
    return { level: 'upcoming', label: `Due in ${daysUntilDue} days`, color: 'bg-muted/50 text-muted-foreground' };
  };

  const formatDueDate = (dueDate: string) => {
    const date = new Date(dueDate);
    const now = new Date();
    const daysUntil = differenceInDays(date, now);
    
    if (daysUntil === -1) return 'Yesterday (Overdue)';
    if (isToday(date)) return 'Today';
    if (isTomorrow(date)) return 'Tomorrow';
    return format(date, 'MMM dd, yyyy');
  };

  const filteredTasks = useMemo(() => {
    if (filter === 'all') return upcomingTasks;
    
    return upcomingTasks.filter(task => {
      const urgency = getTaskUrgency(task.daysUntilDue);
      return urgency.level === filter;
    });
  }, [upcomingTasks, filter]);

  const urgencyStats = useMemo(() => {
    const stats = {
      overdue: 0,
      critical: 0,
      high: 0,
      medium: 0,
      low: 0,
      upcoming: 0
    };

    upcomingTasks.forEach(task => {
      const urgency = getTaskUrgency(task.daysUntilDue);
      stats[urgency.level as keyof typeof stats]++;
    });

    return stats;
  }, [upcomingTasks]);

  if (upcomingTasks.length === 0) {
    return (
      <Card className="bg-card shadow-card border-border">
        <CardContent className="p-8 text-center">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-success/10 flex items-center justify-center">
            <Bell className="h-8 w-8 text-success" />
          </div>
          <h3 className="text-lg font-medium text-foreground mb-2">All Caught Up!</h3>
          <p className="text-muted-foreground">No upcoming deployments or tasks due in the next 14 days.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Critical Alert Banner */}
      {(urgencyStats.overdue > 0 || urgencyStats.critical > 0) && (
        <Alert className="border-destructive/50 bg-destructive/10">
          <AlertTriangle className="h-4 w-4 text-destructive" />
          <AlertDescription className="text-destructive">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
              <div className="flex-1">
                <span className="font-semibold">
                  {urgencyStats.overdue > 0 && `${urgencyStats.overdue} overdue task${urgencyStats.overdue > 1 ? 's' : ''}`}
                  {urgencyStats.overdue > 0 && urgencyStats.critical > 0 && ' and '}
                  {urgencyStats.critical > 0 && `${urgencyStats.critical} task${urgencyStats.critical > 1 ? 's' : ''} due today`}!
                </span>
                <span className="hidden sm:inline ml-2">Immediate attention required.</span>
              </div>
            </div>
          </AlertDescription>
        </Alert>
      )}

      {/* Filter and Stats */}
      <Card className="bg-card shadow-card border-border">
        <CardHeader>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <CardTitle className="text-foreground flex items-center gap-2">
              <Bell className="h-5 w-5 text-warning" />
              Upcoming Deployments & Due Tasks
              <Badge variant="secondary" className="ml-2">
                {upcomingTasks.length}
              </Badge>
            </CardTitle>
            
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1 border border-border rounded-md p-1 bg-muted/50">
                <Button
                  variant={viewMode === 'list' ? 'secondary' : 'ghost'}
                  size="sm"
                  onClick={() => setViewMode('list')}
                  className="h-7 px-2"
                >
                  <LayoutList className="h-4 w-4" />
                </Button>
                <Button
                  variant={viewMode === 'timeline' ? 'secondary' : 'ghost'}
                  size="sm"
                  onClick={() => setViewMode('timeline')}
                  className="h-7 px-2"
                >
                  <CalendarRange className="h-4 w-4" />
                </Button>
              </div>
              
              <Filter className="h-4 w-4 text-muted-foreground" />
              <Select value={filter} onValueChange={(value: FilterOption) => setFilter(value)}>
                <SelectTrigger className="w-40 bg-input border-border">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-popover border-border">
                  <SelectItem value="all">All Tasks ({upcomingTasks.length})</SelectItem>
                  {urgencyStats.overdue > 0 && <SelectItem value="overdue">Overdue ({urgencyStats.overdue})</SelectItem>}
                  {urgencyStats.critical > 0 && <SelectItem value="critical">Critical ({urgencyStats.critical})</SelectItem>}
                  {urgencyStats.high > 0 && <SelectItem value="high">High ({urgencyStats.high})</SelectItem>}
                  {urgencyStats.medium > 0 && <SelectItem value="medium">Medium ({urgencyStats.medium})</SelectItem>}
                  {urgencyStats.low > 0 && <SelectItem value="low">Low ({urgencyStats.low})</SelectItem>}
                  {urgencyStats.upcoming > 0 && <SelectItem value="upcoming">Upcoming ({urgencyStats.upcoming})</SelectItem>}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        
        <CardContent>
          {/* Quick Stats */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4 mb-6">
            {urgencyStats.overdue > 0 && (
              <div className="text-center p-3 rounded-lg bg-destructive/10 border border-destructive/20">
                <div className="text-lg font-bold text-destructive">{urgencyStats.overdue}</div>
                <div className="text-xs text-destructive">Overdue</div>
              </div>
            )}
            {urgencyStats.critical > 0 && (
              <div className="text-center p-3 rounded-lg bg-destructive/10 border border-destructive/20">
                <div className="text-lg font-bold text-destructive">{urgencyStats.critical}</div>
                <div className="text-xs text-destructive">Due Today</div>
              </div>
            )}
            {urgencyStats.high > 0 && (
              <div className="text-center p-3 rounded-lg bg-warning/10 border border-warning/20">
                <div className="text-lg font-bold text-warning">{urgencyStats.high}</div>
                <div className="text-xs text-warning-foreground">Due Tomorrow</div>
              </div>
            )}
            {urgencyStats.medium > 0 && (
              <div className="text-center p-3 rounded-lg bg-warning/5 border border-warning/10">
                <div className="text-lg font-bold text-warning">{urgencyStats.medium}</div>
                <div className="text-xs text-muted-foreground">2-3 Days</div>
              </div>
            )}
            {urgencyStats.low > 0 && (
              <div className="text-center p-3 rounded-lg bg-muted/10 border border-muted/20">
                <div className="text-lg font-bold text-muted-foreground">{urgencyStats.low}</div>
                <div className="text-xs text-muted-foreground">This Week</div>
              </div>
            )}
            {urgencyStats.upcoming > 0 && (
              <div className="text-center p-3 rounded-lg bg-muted/5 border border-muted/10">
                <div className="text-lg font-bold text-muted-foreground">{urgencyStats.upcoming}</div>
                <div className="text-xs text-muted-foreground">Next Week</div>
              </div>
            )}
          </div>

          {/* Task View - List or Timeline */}
          {viewMode === 'list' ? (
            <div className="space-y-3">
              {filteredTasks.map((task) => {
                const urgency = getTaskUrgency(task.daysUntilDue);
                const isUrgent = urgency.level === 'overdue' || urgency.level === 'critical';
                
                return (
                  <Card
                    key={task.id}
                    className={`p-4 transition-all duration-200 hover:shadow-md ${
                      isUrgent ? 'border-destructive/30 bg-destructive/5' : 'border-border'
                    }`}
                  >
                    <div className="flex flex-col lg:flex-row lg:items-center gap-4">
                      <div className="flex-1 min-w-0 space-y-2">
                        <div className="flex items-center gap-2 mb-2">
                          <h4 className="font-semibold text-foreground truncate">{task.taskName}</h4>
                          <Badge 
                            variant="secondary" 
                            className={`text-xs flex-shrink-0 ${
                              task.type === 'project' 
                                ? 'bg-primary/10 text-primary' 
                                : 'bg-accent/10 text-accent'
                            }`}
                          >
                            {task.type === 'project' ? (
                              <Target className="h-3 w-3 mr-1" />
                            ) : (
                              <Zap className="h-3 w-3 mr-1" />
                            )}
                            {task.type === 'project' ? 'Project' : 'Ad-Hoc'}
                          </Badge>
                        </div>
                        
                        <p className="text-sm text-muted-foreground line-clamp-2">
                          {task.description}
                        </p>
                        
                        <div className="flex items-center gap-4 text-xs text-muted-foreground">
                          <div className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            <span>{formatDueDate(task.dueDate)}</span>
                          </div>
                          {task.squadName && (
                            <div className="hidden sm:flex items-center gap-1">
                              <User className="h-3 w-3" />
                              <span>{task.squadName}</span>
                            </div>
                          )}
                          {task.spoc && (
                            <div className="hidden lg:flex items-center gap-1">
                              <span>SPOC:</span>
                              <span className="font-medium">{task.spoc}</span>
                            </div>
                          )}
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-2 flex-shrink-0">
                        <Badge className={urgency.color}>
                          {urgency.label}
                        </Badge>
                        <Badge variant="outline" className="text-xs">
                          {task.status}
                        </Badge>
                      </div>
                    </div>
                  </Card>
                );
              })}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <TimelineView tasks={filteredTasks} getTaskUrgency={getTaskUrgency} />
            </div>
          )}

          {filteredTasks.length === 0 && filter !== 'all' && (
            <div className="text-center py-8">
              <p className="text-muted-foreground">No tasks found for the selected filter.</p>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setFilter('all')}
                className="mt-2"
              >
                Show all tasks
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

// Timeline View Component
interface TimelineViewProps {
  tasks: UpcomingTask[];
  getTaskUrgency: (daysUntilDue: number) => { level: string; label: string; color: string };
}

const TimelineView = ({ tasks, getTaskUrgency }: TimelineViewProps) => {
  const today = startOfDay(new Date());
  const timelineStart = today;
  const timelineEnd = addDays(today, 14);
  
  // Create date columns for the next 14 days
  const dateColumns = useMemo(() => {
    const dates = [];
    for (let i = 0; i <= 14; i++) {
      dates.push(addDays(timelineStart, i));
    }
    return dates;
  }, []);

  return (
    <div className="min-w-[900px]">
      {/* Timeline Header */}
      <div className="flex border-b border-border mb-4 pb-2">
        <div className="w-48 flex-shrink-0 font-semibold text-sm text-muted-foreground">Task</div>
        <div className="flex-1 grid grid-cols-15 gap-px">
          {dateColumns.map((date, idx) => {
            const isToday = startOfDay(date).getTime() === today.getTime();
            return (
              <div
                key={idx}
                className={`text-center text-xs ${
                  isToday ? 'text-primary font-bold' : 'text-muted-foreground'
                }`}
              >
                <div className="font-medium">{format(date, 'dd')}</div>
                <div className="text-[10px]">{format(date, 'EEE')}</div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Timeline Tasks */}
      <div className="space-y-2">
        {tasks.map((task) => {
          const dueDate = startOfDay(new Date(task.dueDate));
          const daysDiff = differenceInDays(dueDate, timelineStart);
          const urgency = getTaskUrgency(task.daysUntilDue);
          const isUrgent = urgency.level === 'overdue' || urgency.level === 'critical';
          
          // Calculate bar position and width
          const barStart = Math.max(0, Math.min(14, daysDiff));
          const barWidth = 1;
          
          return (
            <div key={task.id} className="flex items-center group">
              {/* Task Name */}
              <div className="w-48 flex-shrink-0 pr-4">
                <div className="flex items-center gap-2">
                  {task.type === 'project' ? (
                    <Target className="h-3 w-3 text-primary flex-shrink-0" />
                  ) : (
                    <Zap className="h-3 w-3 text-accent flex-shrink-0" />
                  )}
                  <span className="text-sm font-medium text-foreground truncate group-hover:text-primary transition-colors">
                    {task.taskName}
                  </span>
                </div>
                {task.squadName && (
                  <div className="text-xs text-muted-foreground mt-1 ml-5 truncate">
                    {task.squadName}
                  </div>
                )}
              </div>

              {/* Timeline Grid */}
              <div className="flex-1 grid grid-cols-15 gap-px relative">
                {/* Background cells */}
                {dateColumns.map((date, idx) => {
                  const isToday = startOfDay(date).getTime() === today.getTime();
                  return (
                    <div
                      key={idx}
                      className={`h-12 border-r border-border/30 ${
                        isToday ? 'bg-primary/5' : ''
                      }`}
                    />
                  );
                })}

                {/* Task Bar */}
                <div
                  className="absolute top-1/2 -translate-y-1/2 h-8 rounded group-hover:scale-105 transition-transform cursor-pointer"
                  style={{
                    left: `${(barStart / 15) * 100}%`,
                    width: `${(barWidth / 15) * 100}%`,
                  }}
                >
                  <div
                    className={`h-full rounded flex items-center justify-center px-2 ${
                      isUrgent
                        ? 'bg-destructive border-2 border-destructive'
                        : urgency.level === 'high'
                        ? 'bg-warning border-2 border-warning'
                        : urgency.level === 'medium'
                        ? 'bg-warning/60 border-2 border-warning/60'
                        : 'bg-primary border-2 border-primary'
                    }`}
                  >
                    <div className="w-2 h-2 bg-white rounded-full" />
                  </div>
                  
                  {/* Tooltip */}
                  <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 hidden group-hover:block z-10">
                    <div className="bg-popover border border-border rounded-lg shadow-elevated p-3 min-w-[200px]">
                      <div className="font-semibold text-sm text-foreground mb-1">{task.taskName}</div>
                      <div className="text-xs text-muted-foreground space-y-1">
                        <div className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          <span>{format(dueDate, 'MMM dd, yyyy')}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge className={`${urgency.color} text-xs`}>
                            {urgency.label}
                          </Badge>
                          <Badge variant="outline" className="text-xs">
                            {task.status}
                          </Badge>
                        </div>
                        {task.description && (
                          <p className="text-xs mt-2 line-clamp-2">{task.description}</p>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Today Indicator Line */}
      <div className="absolute top-0 bottom-0 border-l-2 border-primary pointer-events-none"
        style={{ left: 'calc(12rem + 0%)' }}>
        <div className="absolute -top-2 left-1/2 -translate-x-1/2 bg-primary text-primary-foreground text-[10px] px-1 rounded">
          Today
        </div>
      </div>
    </div>
  );
};