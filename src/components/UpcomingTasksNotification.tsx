import { useState, useMemo } from "react";
import { ProjectTask, AdHocTask } from "@/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import { Calendar, Clock, AlertTriangle, Bell, ChevronDown, ChevronUp, Target, User, Zap, Filter, LayoutList, CalendarRange, ChevronLeft, ChevronRight } from "lucide-react";
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
  const [weekOffset, setWeekOffset] = useState(0);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [calendarDate, setCalendarDate] = useState<Date | undefined>(new Date());
  const [showCalendarPicker, setShowCalendarPicker] = useState(false);
  const today = startOfDay(new Date());
  
  // Create date columns based on week offset
  const dateColumns = useMemo(() => {
    const dates = [];
    const startDate = addDays(today, weekOffset * 14);
    for (let i = 0; i < 14; i++) {
      dates.push(addDays(startDate, i));
    }
    return dates;
  }, [weekOffset]);

  const canGoBack = weekOffset > -4; // Allow going back up to 8 weeks in past
  const canGoForward = true; // Can always go forward to future dates

  // Group tasks by due date
  const tasksByDate = useMemo(() => {
    const grouped: { [key: string]: UpcomingTask[] } = {};
    
    tasks.forEach(task => {
      const dueDate = startOfDay(new Date(task.dueDate));
      const dateKey = format(dueDate, 'yyyy-MM-dd');
      
      if (!grouped[dateKey]) {
        grouped[dateKey] = [];
      }
      grouped[dateKey].push(task);
    });
    
    return grouped;
  }, [tasks]);

  return (
    <div className="w-full space-y-4">
      {/* Navigation Header with Calendar Picker */}
      <div className="flex items-center justify-between gap-4">
        <Button
          variant="outline"
          size="sm"
          onClick={() => setWeekOffset(prev => prev - 1)}
          disabled={!canGoBack}
          className="h-8"
        >
          <ChevronLeft className="h-4 w-4 mr-1" />
          Previous
        </Button>
        
        <div className="flex flex-col items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowCalendarPicker(!showCalendarPicker)}
            className="text-sm font-medium text-foreground hover:bg-accent"
          >
            <Calendar className="h-4 w-4 text-primary mr-2" />
            {weekOffset === 0 ? (
              "This Week & Next"
            ) : (
              `${format(dateColumns[0], 'MMM d')} - ${format(dateColumns[dateColumns.length - 1], 'MMM d, yyyy')}`
            )}
          </Button>
          
          {/* Calendar Picker Dropdown */}
          {showCalendarPicker && (
            <div className="absolute top-20 z-50 bg-popover border-2 border-border rounded-lg shadow-elevated p-4">
              <CalendarComponent
                mode="single"
                selected={calendarDate}
                onSelect={(date) => {
                  if (date) {
                    setCalendarDate(date);
                    // Calculate week offset based on selected date
                    const daysDiff = differenceInDays(startOfDay(date), today);
                    const newOffset = Math.floor(daysDiff / 14);
                    setWeekOffset(newOffset);
                    setShowCalendarPicker(false);
                  }
                }}
                className="rounded-md"
              />
            </div>
          )}
        </div>
        
        <Button
          variant="outline"
          size="sm"
          onClick={() => setWeekOffset(prev => prev + 1)}
          className="h-8"
        >
          Next
          <ChevronRight className="h-4 w-4 ml-1" />
        </Button>
      </div>

      {/* Calendar Grid */}
      <div className="grid grid-cols-7 gap-2">
        {dateColumns.map((date, idx) => {
          const dateKey = format(date, 'yyyy-MM-dd');
          const isToday = startOfDay(date).getTime() === today.getTime();
          const tasksForDate = tasksByDate[dateKey] || [];
          const isPast = date < today;
          const isSelected = selectedDate === dateKey;
          
          const handleDoubleClick = () => {
            setSelectedDate(isSelected ? null : dateKey);
          };
          
          return (
            <div
              key={idx}
              className={`relative group ${
                idx >= 7 ? 'mt-0' : ''
              }`}
            >
              {/* Calendar Day Box */}
              <div
                onDoubleClick={handleDoubleClick}
                className={`
                  aspect-square rounded-lg border-2 p-2 transition-all cursor-pointer
                  ${isSelected
                    ? 'border-accent bg-accent/20 shadow-lg ring-2 ring-accent/50'
                    : isToday 
                    ? 'border-primary bg-primary/10 shadow-lg' 
                    : isPast 
                    ? 'border-border/50 bg-muted/30' 
                    : 'border-border bg-card hover:border-primary/50 hover:shadow-md'
                  }
                `}
              >
                {/* Date Number */}
                <div className="flex flex-col h-full">
                  <div className={`text-center mb-1 ${
                    isToday ? 'text-primary font-bold text-lg' : 'text-foreground font-semibold'
                  }`}>
                    {format(date, 'd')}
                  </div>
                  <div className={`text-center text-[10px] mb-2 ${
                    isToday ? 'text-primary' : 'text-muted-foreground'
                  }`}>
                    {format(date, 'EEE')}
                  </div>

                  {/* Task Indicators */}
                  {tasksForDate.length > 0 && (
                    <div className="flex-1 flex flex-col gap-1 overflow-hidden">
                      {tasksForDate.slice(0, 3).map((task) => {
                        const urgency = getTaskUrgency(task.daysUntilDue);
                        const isUrgent = urgency.level === 'overdue' || urgency.level === 'critical';
                        
                        return (
                          <div
                            key={task.id}
                            className={`
                              text-[9px] px-1 py-0.5 rounded truncate font-medium
                              ${isUrgent
                                ? 'bg-destructive text-destructive-foreground'
                                : urgency.level === 'high'
                                ? 'bg-warning text-warning-foreground'
                                : urgency.level === 'medium'
                                ? 'bg-warning/60 text-warning-foreground'
                                : 'bg-primary/70 text-primary-foreground'
                              }
                            `}
                            title={task.taskName}
                          >
                            {task.taskName}
                          </div>
                        );
                      })}
                      {tasksForDate.length > 3 && (
                        <div className="text-[9px] text-muted-foreground text-center">
                          +{tasksForDate.length - 3} more
                        </div>
                      )}
                    </div>
                  )}

                  {/* Today Badge */}
                  {isToday && (
                    <div className="absolute top-1 right-1">
                      <div className="w-2 h-2 bg-primary rounded-full animate-pulse" />
                    </div>
                  )}
                </div>
              </div>

              {/* Detailed Hover/Selected Tooltip */}
              {tasksForDate.length > 0 && (
                <div className={`absolute top-full left-1/2 -translate-x-1/2 mt-2 z-50 ${
                  isSelected ? 'block' : 'hidden group-hover:block pointer-events-none'
                }`}>
                  <div className="bg-popover border-2 border-border rounded-lg shadow-elevated p-4 min-w-[280px] max-w-[320px]">
                    {/* Date Header */}
                    <div className="flex items-center gap-2 mb-3 pb-2 border-b border-border">
                      <Calendar className="h-4 w-4 text-primary" />
                      <span className="font-semibold text-foreground">
                        {format(date, 'EEEE, MMM d, yyyy')}
                      </span>
                    </div>

                    {/* Tasks List */}
                    <div className="space-y-3 max-h-[300px] overflow-y-auto">
                      {tasksForDate.map((task) => {
                        const urgency = getTaskUrgency(task.daysUntilDue);
                        const isUrgent = urgency.level === 'overdue' || urgency.level === 'critical';
                        
                        return (
                          <div
                            key={task.id}
                            className={`p-2 rounded-lg border ${
                              isUrgent ? 'border-destructive/30 bg-destructive/5' : 'border-border bg-card'
                            }`}
                          >
                            {/* Task Header */}
                            <div className="flex items-start gap-2 mb-2">
                              {task.type === 'project' ? (
                                <Target className="h-3 w-3 text-primary flex-shrink-0 mt-0.5" />
                              ) : (
                                <Zap className="h-3 w-3 text-accent flex-shrink-0 mt-0.5" />
                              )}
                              <div className="flex-1 min-w-0">
                                <div className="font-semibold text-sm text-foreground mb-1 break-words">
                                  {task.taskName}
                                </div>
                                {task.description && (
                                  <p className="text-xs text-muted-foreground line-clamp-2 mb-2">
                                    {task.description}
                                  </p>
                                )}
                              </div>
                            </div>

                            {/* Task Details */}
                            <div className="space-y-1.5 text-xs">
                              {/* Type and Status */}
                              <div className="flex items-center gap-2 flex-wrap">
                                <Badge 
                                  variant="secondary" 
                                  className={`text-[10px] px-1.5 py-0 ${
                                    task.type === 'project' 
                                      ? 'bg-primary/10 text-primary border-primary/20' 
                                      : 'bg-accent/10 text-accent border-accent/20'
                                  }`}
                                >
                                  {task.type === 'project' ? 'Project' : 'Ad-Hoc'}
                                </Badge>
                                <Badge variant="outline" className="text-[10px] px-1.5 py-0">
                                  {task.status}
                                </Badge>
                              </div>

                              {/* Urgency */}
                              <div className="flex items-center gap-1.5">
                                <AlertTriangle className="h-3 w-3 flex-shrink-0" />
                                <Badge className={`${urgency.color} text-[10px] px-1.5 py-0`}>
                                  {urgency.label}
                                </Badge>
                              </div>

                              {/* Squad */}
                              {task.squadName && (
                                <div className="flex items-center gap-1.5 text-muted-foreground">
                                  <User className="h-3 w-3 flex-shrink-0" />
                                  <span className="font-medium">{task.squadName}</span>
                                </div>
                              )}

                              {/* SPOC */}
                              {task.spoc && (
                                <div className="flex items-center gap-1.5 text-muted-foreground">
                                  <User className="h-3 w-3 flex-shrink-0" />
                                  <span>SPOC: <span className="font-medium">{task.spoc}</span></span>
                                </div>
                              )}

                              {/* Due Time */}
                              <div className="flex items-center gap-1.5 text-muted-foreground pt-1 border-t border-border/50">
                                <Clock className="h-3 w-3 flex-shrink-0" />
                                <span>
                                  {task.daysUntilDue < 0 
                                    ? `Overdue by ${Math.abs(task.daysUntilDue)} day${Math.abs(task.daysUntilDue) > 1 ? 's' : ''}`
                                    : task.daysUntilDue === 0
                                    ? 'Due today'
                                    : `Due in ${task.daysUntilDue} day${task.daysUntilDue > 1 ? 's' : ''}`
                                  }
                                </span>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Legend */}
      <div className="mt-6 pt-4 border-t border-border">
        <div className="flex flex-wrap items-center gap-4 text-xs">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded border-2 border-primary bg-primary/10" />
            <span className="text-muted-foreground">Today</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded bg-destructive" />
            <span className="text-muted-foreground">Overdue/Critical</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded bg-warning" />
            <span className="text-muted-foreground">High Priority</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded bg-warning/60" />
            <span className="text-muted-foreground">Medium Priority</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded bg-primary/70" />
            <span className="text-muted-foreground">Normal</span>
          </div>
        </div>
      </div>
    </div>
  );
};