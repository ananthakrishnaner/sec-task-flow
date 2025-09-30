import { useState, useMemo } from "react";
import { ProjectTask, AdHocTask, TaskStatus } from "@/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { TaskStatusBadge } from "@/components/TaskStatusBadge";
import { exportService, ExportOptions } from "@/lib/exportService";
import { useToast } from "@/hooks/use-toast";
import { 
  Calendar, 
  Filter, 
  Search, 
  TrendingUp, 
  Clock, 
  CheckCircle,
  Target,
  AlertCircle,
  BarChart3,
  Download,
  FileSpreadsheet,
  FileText
} from "lucide-react";
import { format, startOfWeek, endOfWeek, isWithinInterval, parseISO } from "date-fns";
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line
} from 'recharts';

interface DetailedProgressDashboardProps {
  projectTasks: ProjectTask[];
  adHocTasks: AdHocTask[];
}

interface TaskFilter {
  status: TaskStatus | 'all';
  timeframe: 'all' | 'this-week' | 'last-week' | 'this-month' | 'custom';
  squad: string;
  search: string;
  startDate: string;
  endDate: string;
  searchType: 'task-name' | 'description' | 'both';
}

const COLORS = {
  'To Do': 'hsl(var(--muted-foreground))',
  'In Progress': 'hsl(var(--primary))',
  'Blocked': 'hsl(var(--destructive))',
  'Testing': 'hsl(var(--warning))',
  'Complete': 'hsl(var(--success))'
};

export const DetailedProgressDashboard = ({ projectTasks, adHocTasks }: DetailedProgressDashboardProps) => {
  const [activeTab, setActiveTab] = useState('overview');
  const [isExporting, setIsExporting] = useState(false);
  const [showExportDialog, setShowExportDialog] = useState(false);
  const { toast } = useToast();
  
  const [filter, setFilter] = useState<TaskFilter>({
    status: 'all',
    timeframe: 'this-week',
    squad: 'all',
    search: '',
    startDate: '',
    endDate: '',
    searchType: 'both'
  });

  const [exportOptions, setExportOptions] = useState<ExportOptions>({
    includeProjectTasks: true,
    includeAdHocTasks: true,
    includeDailyLogs: true,
    includeMetrics: true
  });

  // Get unique squads for filter
  const squads = useMemo(() => {
    const uniqueSquads = [...new Set(projectTasks.map(task => task.squadName))];
    return uniqueSquads.filter(Boolean);
  }, [projectTasks]);

  // Filter tasks based on current filters
  const filteredTasks = useMemo(() => {
    const allTasks = [...projectTasks, ...adHocTasks];
    const now = new Date();
    
    return allTasks.filter(task => {
      // Status filter
      if (filter.status !== 'all' && task.status !== filter.status) return false;
      
      // Squad filter (only for project tasks)
      if (filter.squad !== 'all' && 'squadName' in task && task.squadName !== filter.squad) return false;
      
      // Search filter with enhanced options
      if (filter.search) {
        const searchLower = filter.search.toLowerCase();
        const matchesTaskName = task.taskName.toLowerCase().includes(searchLower);
        const matchesDescription = task.description.toLowerCase().includes(searchLower);
        
        switch (filter.searchType) {
          case 'task-name':
            if (!matchesTaskName) return false;
            break;
          case 'description':
            if (!matchesDescription) return false;
            break;
          case 'both':
            if (!matchesTaskName && !matchesDescription) return false;
            break;
        }
      }
      
      // Timeframe filter with custom date range support
      if (filter.timeframe !== 'all') {
        const taskDate = new Date(task.updatedAt);
        const weekStart = startOfWeek(now, { weekStartsOn: 1 });
        const weekEnd = endOfWeek(now, { weekStartsOn: 1 });
        
        switch (filter.timeframe) {
          case 'this-week':
            return isWithinInterval(taskDate, { start: weekStart, end: weekEnd });
          case 'last-week':
            const lastWeekStart = new Date(weekStart);
            lastWeekStart.setDate(lastWeekStart.getDate() - 7);
            const lastWeekEnd = new Date(weekEnd);
            lastWeekEnd.setDate(lastWeekEnd.getDate() - 7);
            return isWithinInterval(taskDate, { start: lastWeekStart, end: lastWeekEnd });
          case 'this-month':
            const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
            const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0);
            return isWithinInterval(taskDate, { start: monthStart, end: monthEnd });
          case 'custom':
            if (filter.startDate && filter.endDate) {
              const customStart = new Date(filter.startDate);
              const customEnd = new Date(filter.endDate);
              return isWithinInterval(taskDate, { start: customStart, end: customEnd });
            }
            return true;
        }
      }
      
      return true;
    });
  }, [projectTasks, adHocTasks, filter]);

  // Weekly progress calculations
  const weeklyProgress = useMemo(() => {
    const now = new Date();
    const weekStart = startOfWeek(now, { weekStartsOn: 1 });
    const weekEnd = endOfWeek(now, { weekStartsOn: 1 });
    
    const thisWeekTasks = [...projectTasks, ...adHocTasks].filter(task => {
      const taskDate = new Date(task.createdAt);
      return isWithinInterval(taskDate, { start: weekStart, end: weekEnd });
    });
    
    const completed = thisWeekTasks.filter(task => task.status === 'Complete').length;
    const inProgress = thisWeekTasks.filter(task => task.status === 'In Progress').length;
    const blocked = thisWeekTasks.filter(task => task.status === 'Blocked').length;
    const remaining = thisWeekTasks.filter(task => ['To Do', 'Testing'].includes(task.status)).length;
    
    const progressPercentage = thisWeekTasks.length > 0 ? (completed / thisWeekTasks.length) * 100 : 0;
    
    return {
      total: thisWeekTasks.length,
      completed,
      inProgress,
      blocked,
      remaining,
      progressPercentage,
      tasks: thisWeekTasks
    };
  }, [projectTasks, adHocTasks]);

  // Daily completion trend
  const dailyTrend = useMemo(() => {
    const last7Days = Array.from({ length: 7 }, (_, i) => {
      const date = new Date();
      date.setDate(date.getDate() - (6 - i));
      return {
        date: format(date, 'MMM dd'),
        day: format(date, 'EEE'),
        completed: 0
      };
    });
    
    [...projectTasks, ...adHocTasks].forEach(task => {
      if (task.status === 'Complete') {
        const completedDate = new Date(task.updatedAt);
        const dayIndex = last7Days.findIndex(day => 
          format(completedDate, 'MMM dd') === day.date
        );
        if (dayIndex !== -1) {
          last7Days[dayIndex].completed++;
        }
      }
    });
    
    return last7Days;
  }, [projectTasks, adHocTasks]);

  // Status distribution for filtered tasks
  const statusDistribution = useMemo(() => {
    const distribution = filteredTasks.reduce((acc, task) => {
      acc[task.status] = (acc[task.status] || 0) + 1;
      return acc;
    }, {} as Record<TaskStatus, number>);
    
    return Object.entries(distribution).map(([status, count]) => ({
      name: status,
      value: count,
      color: COLORS[status as TaskStatus]
    }));
  }, [filteredTasks]);

  const completedTasks = filteredTasks.filter(task => task.status === 'Complete');

  // Export functions for filtered data
  const handleExportExcel = async () => {
    if (filteredTasks.length === 0) {
      toast({
        title: "No Data to Export",
        description: "Apply filters to show tasks before exporting.",
        variant: "destructive",
      });
      return;
    }

    setIsExporting(true);
    try {
      const filteredProjectTasks = filteredTasks.filter(task => 'squadName' in task) as ProjectTask[];
      const filteredAdHocTasks = filteredTasks.filter(task => !('squadName' in task)) as AdHocTask[];

      // Generate date range info for export header
      const generateDateRangeInfo = (): string => {
        const now = new Date();
        const formatDate = (date: string) => new Date(date).toLocaleDateString('en-US', { 
          year: 'numeric', 
          month: 'long', 
          day: 'numeric' 
        });

        switch (filter.timeframe) {
          case 'this-week':
            const startOfWeek = new Date(now);
            startOfWeek.setDate(now.getDate() - now.getDay());
            const endOfWeek = new Date(startOfWeek);
            endOfWeek.setDate(startOfWeek.getDate() + 6);
            return `This Week Report (${formatDate(startOfWeek.toISOString())} - ${formatDate(endOfWeek.toISOString())})`;
          
          case 'last-week':
            const lastWeekStart = new Date(now);
            lastWeekStart.setDate(now.getDate() - now.getDay() - 7);
            const lastWeekEnd = new Date(lastWeekStart);
            lastWeekEnd.setDate(lastWeekStart.getDate() + 6);
            return `Last Week Report (${formatDate(lastWeekStart.toISOString())} - ${formatDate(lastWeekEnd.toISOString())})`;
          
          case 'this-month':
            const monthName = now.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
            return `${monthName} Report`;
          
          case 'custom':
            if (filter.startDate && filter.endDate) {
              return `Custom Report (${formatDate(filter.startDate)} - ${formatDate(filter.endDate)})`;
            }
            return 'Custom Date Range Report';
          
          default:
            return 'All Tasks Report';
        }
      };

      // Calculate metrics for filtered data
      const totalTasks = filteredTasks.length;
      const completedTasks = filteredTasks.filter(task => task.status === 'Complete').length;
      const inProgressTasks = filteredTasks.filter(task => task.status === 'In Progress').length;
      const blockedTasks = filteredTasks.filter(task => task.status === 'Blocked').length;

      const metrics = {
        totalTasks,
        completedTasks,
        inProgressTasks,
        blockedTasks,
        projectTasksCount: filteredProjectTasks.length,
        adHocTasksCount: filteredAdHocTasks.length,
        completionRate: totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0,
        weeklyCompletions: [0, 0, 0, 0], // Simplified for filtered data
        statusDistribution: filteredTasks.reduce((acc, task) => {
          acc[task.status] = (acc[task.status] || 0) + 1;
          return acc;
        }, {} as Record<TaskStatus, number>)
      };

      exportService.exportToExcel(filteredProjectTasks, filteredAdHocTasks, metrics, {
        ...exportOptions,
        includeProjectTasks: exportOptions.includeProjectTasks && filteredProjectTasks.length > 0,
        includeAdHocTasks: exportOptions.includeAdHocTasks && filteredAdHocTasks.length > 0,
        dateRangeInfo: generateDateRangeInfo()
      });

      setShowExportDialog(false);
      toast({
        title: "Export Successful",
        description: `Excel report with ${filteredTasks.length} filtered tasks has been downloaded.`,
      });
    } catch (error) {
      toast({
        title: "Export Failed",
        description: "Failed to export filtered data to Excel.",
        variant: "destructive",
      });
    } finally {
      setIsExporting(false);
    }
  };

  const handleExportPDF = async () => {
    if (filteredTasks.length === 0) {
      toast({
        title: "No Data to Export",
        description: "Apply filters to show tasks before exporting.",
        variant: "destructive",
      });
      return;
    }

    setIsExporting(true);
    try {
      const filteredProjectTasks = filteredTasks.filter(task => 'squadName' in task) as ProjectTask[];
      const filteredAdHocTasks = filteredTasks.filter(task => !('squadName' in task)) as AdHocTask[];

      // Generate date range info for PDF header
      const generateDateRangeInfo = (): string => {
        const now = new Date();
        const formatDate = (date: string) => new Date(date).toLocaleDateString('en-US', { 
          year: 'numeric', 
          month: 'long', 
          day: 'numeric' 
        });

        switch (filter.timeframe) {
          case 'this-week':
            const startOfWeek = new Date(now);
            startOfWeek.setDate(now.getDate() - now.getDay());
            const endOfWeek = new Date(startOfWeek);
            endOfWeek.setDate(startOfWeek.getDate() + 6);
            return `This Week Report (${formatDate(startOfWeek.toISOString())} - ${formatDate(endOfWeek.toISOString())})`;
          
          case 'last-week':
            const lastWeekStart = new Date(now);
            lastWeekStart.setDate(now.getDate() - now.getDay() - 7);
            const lastWeekEnd = new Date(lastWeekStart);
            lastWeekEnd.setDate(lastWeekStart.getDate() + 6);
            return `Last Week Report (${formatDate(lastWeekStart.toISOString())} - ${formatDate(lastWeekEnd.toISOString())})`;
          
          case 'this-month':
            const monthName = now.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
            return `${monthName} Report`;
          
          case 'custom':
            if (filter.startDate && filter.endDate) {
              return `Custom Report (${formatDate(filter.startDate)} - ${formatDate(filter.endDate)})`;
            }
            return 'Custom Date Range Report';
          
          default:
            return 'All Tasks Report';
        }
      };

      // Calculate metrics for filtered data
      const totalTasks = filteredTasks.length;
      const completedTasks = filteredTasks.filter(task => task.status === 'Complete').length;
      const inProgressTasks = filteredTasks.filter(task => task.status === 'In Progress').length;
      const blockedTasks = filteredTasks.filter(task => task.status === 'Blocked').length;

      const metrics = {
        totalTasks,
        completedTasks,
        inProgressTasks,
        blockedTasks,
        projectTasksCount: filteredProjectTasks.length,
        adHocTasksCount: filteredAdHocTasks.length,
        completionRate: totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0,
        weeklyCompletions: [0, 0, 0, 0], // Simplified for filtered data
        statusDistribution: filteredTasks.reduce((acc, task) => {
          acc[task.status] = (acc[task.status] || 0) + 1;
          return acc;
        }, {} as Record<TaskStatus, number>)
      };

      exportService.exportToPDF(filteredProjectTasks, filteredAdHocTasks, metrics, {
        ...exportOptions,
        includeProjectTasks: exportOptions.includeProjectTasks && filteredProjectTasks.length > 0,
        includeAdHocTasks: exportOptions.includeAdHocTasks && filteredAdHocTasks.length > 0,
        dateRangeInfo: generateDateRangeInfo()
      });

      setShowExportDialog(false);
      toast({
        title: "Export Successful",
        description: `PDF report with ${filteredTasks.length} filtered tasks has been downloaded.`,
      });
    } catch (error) {
      toast({
        title: "Export Failed",
        description: "Failed to export filtered data to PDF.",
        variant: "destructive",
      });
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Filter Controls */}
      <Card className="bg-card shadow-card border-border">
        <CardHeader className="p-4 sm:p-6">
          <CardTitle className="text-foreground flex items-center gap-2 text-base sm:text-lg">
            <Filter className="h-4 w-4 sm:h-5 sm:w-5" />
            <span className="truncate">Task Filters & Analytics</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="p-4 sm:p-6 pt-0">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-7 gap-3 sm:gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-muted-foreground">Status</label>
              <Select 
                value={filter.status} 
                onValueChange={(value: TaskStatus | 'all') => setFilter(prev => ({ ...prev, status: value }))}
              >
                <SelectTrigger className="bg-input border-border">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-popover border-border">
                  <SelectItem value="all">All Statuses</SelectItem>
                  <SelectItem value="To Do">To Do</SelectItem>
                  <SelectItem value="In Progress">In Progress</SelectItem>
                  <SelectItem value="Blocked">Blocked</SelectItem>
                  <SelectItem value="Testing">Testing</SelectItem>
                  <SelectItem value="Complete">Complete</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <label className="text-sm font-medium text-muted-foreground">Time Period</label>
              <Select 
                value={filter.timeframe} 
                onValueChange={(value: 'all' | 'this-week' | 'last-week' | 'this-month' | 'custom') => 
                  setFilter(prev => ({ ...prev, timeframe: value }))
                }
              >
                <SelectTrigger className="bg-input border-border">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-popover border-border">
                  <SelectItem value="all">All Time</SelectItem>
                  <SelectItem value="this-week">This Week</SelectItem>
                  <SelectItem value="last-week">Last Week</SelectItem>
                  <SelectItem value="this-month">This Month</SelectItem>
                  <SelectItem value="custom">Custom Range</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {filter.timeframe === 'custom' && (
              <>
                <div className="space-y-2 sm:col-span-2 lg:col-span-1">
                  <label className="text-sm font-medium text-muted-foreground">Start Date</label>
                  <Input
                    type="date"
                    value={filter.startDate}
                    onChange={(e) => setFilter(prev => ({ ...prev, startDate: e.target.value }))}
                    className="bg-input border-border"
                  />
                </div>
                
                <div className="space-y-2 sm:col-span-2 lg:col-span-1">
                  <label className="text-sm font-medium text-muted-foreground">End Date</label>
                  <Input
                    type="date"
                    value={filter.endDate}
                    onChange={(e) => setFilter(prev => ({ ...prev, endDate: e.target.value }))}
                    className="bg-input border-border"
                  />
                </div>
              </>
            )}
            
            <div className="space-y-2">
              <label className="text-sm font-medium text-muted-foreground">Squad</label>
              <Select 
                value={filter.squad} 
                onValueChange={(value: string) => setFilter(prev => ({ ...prev, squad: value }))}
              >
                <SelectTrigger className="bg-input border-border">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-popover border-border">
                  <SelectItem value="all">All Squads</SelectItem>
                  {squads.map(squad => (
                    <SelectItem key={squad} value={squad}>{squad}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <label className="text-sm font-medium text-muted-foreground">Search In</label>
              <Select 
                value={filter.searchType} 
                onValueChange={(value: 'task-name' | 'description' | 'both') => 
                  setFilter(prev => ({ ...prev, searchType: value }))
                }
              >
                <SelectTrigger className="bg-input border-border">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-popover border-border">
                  <SelectItem value="both">Task Name & Description</SelectItem>
                  <SelectItem value="task-name">Task Name Only</SelectItem>
                  <SelectItem value="description">Description Only</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <label className="text-sm font-medium text-muted-foreground">Search</label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search tasks..."
                  value={filter.search}
                  onChange={(e) => setFilter(prev => ({ ...prev, search: e.target.value }))}
                  className="pl-10 bg-input border-border"
                />
              </div>
            </div>
            
            <div className="space-y-2">
              <label className="text-sm font-medium text-muted-foreground">Results</label>
              <div className="text-lg font-bold text-foreground bg-gradient-primary/10 px-4 py-2 rounded-md border border-primary/20">
                {filteredTasks.length} tasks
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Weekly Progress Overview */}
      <Card className="bg-card shadow-card border-border">
        <CardHeader>
          <CardTitle className="text-foreground flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            This Week's Progress
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Completion Rate</span>
                <span className="text-sm font-medium text-foreground">
                  {weeklyProgress.progressPercentage.toFixed(0)}%
                </span>
              </div>
              <Progress value={weeklyProgress.progressPercentage} className="h-3" />
              <div className="text-xs text-muted-foreground">
                {weeklyProgress.completed} of {weeklyProgress.total} tasks completed
              </div>
            </div>
            
            <div className="text-center">
              <div className="text-2xl font-bold text-success">{weeklyProgress.completed}</div>
              <div className="text-sm text-muted-foreground">Completed</div>
            </div>
            
            <div className="text-center">
              <div className="text-2xl font-bold text-primary">{weeklyProgress.inProgress}</div>
              <div className="text-sm text-muted-foreground">In Progress</div>
            </div>
            
            <div className="text-center">
              <div className="text-2xl font-bold text-muted-foreground">{weeklyProgress.remaining}</div>
              <div className="text-sm text-muted-foreground">Remaining</div>
            </div>
          </div>
          
          {/* Export Section */}
          <div className="flex flex-col sm:flex-row gap-3 pt-4 border-t border-border">
            <div className="flex-1">
              <p className="text-sm text-muted-foreground">
                Export filtered results ({filteredTasks.length} tasks)
              </p>
            </div>
            <Dialog open={showExportDialog} onOpenChange={setShowExportDialog}>
              <DialogTrigger asChild>
                <Button
                  disabled={filteredTasks.length === 0}
                  variant="outline"
                  size="sm"
                  className="border-border text-foreground hover:bg-muted"
                >
                  <Download className="h-4 w-4 mr-2" />
                  Export Options
                </Button>
              </DialogTrigger>
              <DialogContent className="bg-card border-border">
                <DialogHeader>
                  <DialogTitle className="text-foreground">Export Options</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div className="space-y-3">
                    <Label className="text-foreground font-medium">Include in Export:</Label>
                    <div className="space-y-2">
                      <div className="flex items-center space-x-2">
                        <Checkbox 
                          id="progress-projectTasks"
                          checked={exportOptions.includeProjectTasks}
                          onCheckedChange={(checked) => 
                            setExportOptions(prev => ({ ...prev, includeProjectTasks: !!checked }))
                          }
                        />
                        <Label htmlFor="progress-projectTasks" className="text-foreground">Project Tasks</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Checkbox 
                          id="progress-adHocTasks"
                          checked={exportOptions.includeAdHocTasks}
                          onCheckedChange={(checked) => 
                            setExportOptions(prev => ({ ...prev, includeAdHocTasks: !!checked }))
                          }
                        />
                        <Label htmlFor="progress-adHocTasks" className="text-foreground">Ad-Hoc Tasks</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Checkbox 
                          id="progress-metrics"
                          checked={exportOptions.includeMetrics}
                          onCheckedChange={(checked) => 
                            setExportOptions(prev => ({ ...prev, includeMetrics: !!checked }))
                          }
                        />
                        <Label htmlFor="progress-metrics" className="text-foreground">Summary Metrics</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Checkbox 
                          id="progress-dailyLogs"
                          checked={exportOptions.includeDailyLogs}
                          onCheckedChange={(checked) => 
                            setExportOptions(prev => ({ ...prev, includeDailyLogs: !!checked }))
                          }
                        />
                        <Label htmlFor="progress-dailyLogs" className="text-foreground">Daily Progress</Label>
                      </div>
                    </div>
                  </div>
                  <div className="flex flex-col sm:flex-row gap-3 pt-4">
                    <Button 
                      onClick={handleExportExcel}
                      disabled={isExporting}
                      className="bg-primary hover:bg-primary-glow text-primary-foreground flex-1"
                    >
                      {isExporting ? (
                        <div className="w-4 h-4 rounded-full border-2 border-primary-foreground border-t-transparent animate-spin mr-2" />
                      ) : (
                        <FileSpreadsheet className="h-4 w-4 mr-2" />
                      )}
                      Excel Report
                    </Button>
                    <Button 
                      onClick={handleExportPDF}
                      disabled={isExporting}
                      className="bg-destructive hover:bg-destructive/90 text-destructive-foreground flex-1"
                    >
                      {isExporting ? (
                        <div className="w-4 h-4 rounded-full border-2 border-destructive-foreground border-t-transparent animate-spin mr-2" />
                      ) : (
                        <FileText className="h-4 w-4 mr-2" />
                      )}
                      PDF Report
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </CardContent>
      </Card>

      {/* Detailed Views */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="bg-card border border-border">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="completions">
            <CheckCircle className="h-4 w-4 mr-2" />
            Completions ({completedTasks.length})
          </TabsTrigger>
          <TabsTrigger value="trends">
            <TrendingUp className="h-4 w-4 mr-2" />
            Trends
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card className="bg-card shadow-card border-border">
              <CardHeader>
                <CardTitle className="text-foreground">Status Distribution</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={statusDistribution}
                      cx="50%"
                      cy="50%"
                      outerRadius={80}
                      dataKey="value"
                      label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    >
                      {statusDistribution.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card className="bg-card shadow-card border-border">
              <CardHeader>
                <CardTitle className="text-foreground">Daily Completion Trend</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={dailyTrend}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis dataKey="day" stroke="hsl(var(--muted-foreground))" />
                    <YAxis stroke="hsl(var(--muted-foreground))" />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: 'hsl(var(--card))', 
                        border: '1px solid hsl(var(--border))',
                        borderRadius: '8px'
                      }} 
                    />
                    <Bar dataKey="completed" fill="hsl(var(--success))" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="completions" className="space-y-4">
          <Card className="bg-card shadow-card border-border">
            <CardHeader>
              <CardTitle className="text-foreground">Completed Tasks</CardTitle>
            </CardHeader>
            <CardContent>
              {completedTasks.length === 0 ? (
                <div className="text-center py-8">
                  <CheckCircle className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                  <p className="text-muted-foreground">No completed tasks found with current filters</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {completedTasks.map(task => (
                    <div key={task.id} className="border border-border rounded-lg p-4 bg-muted/20">
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="font-medium text-foreground">{task.taskName}</h4>
                        <TaskStatusBadge status={task.status} />
                      </div>
                      <p className="text-sm text-muted-foreground mb-2">{task.description}</p>
                      <div className="flex items-center gap-4 text-xs text-muted-foreground">
                        <span>Completed: {format(new Date(task.updatedAt), 'MMM dd, yyyy')}</span>
                        {'squadName' in task && (
                          <span>Squad: {task.squadName}</span>
                        )}
                        {'spoc' in task && (
                          <span>SPOC: {task.spoc}</span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="trends" className="space-y-4">
          <Card className="bg-card shadow-card border-border">
            <CardHeader>
              <CardTitle className="text-foreground">Weekly Completion Trends</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={400}>
                <LineChart data={dailyTrend}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="date" stroke="hsl(var(--muted-foreground))" />
                  <YAxis stroke="hsl(var(--muted-foreground))" />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: 'hsl(var(--card))', 
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px'
                    }} 
                  />
                  <Line 
                    type="monotone" 
                    dataKey="completed" 
                    stroke="hsl(var(--primary))" 
                    strokeWidth={3}
                    dot={{ fill: 'hsl(var(--primary))', strokeWidth: 2, r: 6 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};