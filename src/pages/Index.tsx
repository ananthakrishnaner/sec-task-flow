import { useState, useEffect } from "react";
import { ProjectTask, AdHocTask, TaskMetrics } from "@/types";
import { v4 as uuid } from 'uuid';
import { storageService } from "@/lib/storage";
import { exportService, ExportOptions } from "@/lib/exportService";
import { activityLogger } from "@/lib/activityLogger";
import { DashboardMetrics } from "@/components/DashboardMetrics";
import { TaskChartsSection } from "@/components/TaskChartsSection";
import { ProjectTaskForm } from "@/components/ProjectTaskForm";
import { AdHocTaskForm } from "@/components/AdHocTaskForm";
import { ProjectTasksList } from "@/components/ProjectTasksList";
import { AdHocTasksList } from "@/components/AdHocTasksList";
import { DetailedProgressDashboard } from "@/components/DetailedProgressDashboard";
import { Settings } from "@/pages/Settings";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Shield, Plus, BarChart3, Download, Settings as SettingsIcon, FileSpreadsheet, FileText, ArrowLeft, FileDown } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { ThemeToggle } from "@/components/ThemeToggle";

const Index = () => {
  const [projectTasks, setProjectTasks] = useState<ProjectTask[]>([]);
  const [adHocTasks, setAdHocTasks] = useState<AdHocTask[]>([]);
  const [showProjectForm, setShowProjectForm] = useState(false);
  const [showAdHocForm, setShowAdHocForm] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [showExportDialog, setShowExportDialog] = useState(false);
  const [currentView, setCurrentView] = useState<'dashboard' | 'settings'>('dashboard');
  const [exportOptions, setExportOptions] = useState<ExportOptions>({
    includeProjectTasks: true,
    includeAdHocTasks: true,
    includeDailyLogs: true,
    includeMetrics: true
  });
  const { toast } = useToast();

  // Load data on component mount
  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setIsLoading(true);
      const [projectTasksData, adHocTasksData] = await Promise.all([
        storageService.getProjectTasks(),
        storageService.getAdHocTasks()
      ]);
      setProjectTasks(projectTasksData);
      setAdHocTasks(adHocTasksData);
    } catch (error) {
      console.error('Error loading data:', error);
      toast({
        title: "Error Loading Data",
        description: "Failed to load tasks. Please refresh the page.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Calculate metrics
  const calculateMetrics = (): TaskMetrics => {
    const allTasks = [...projectTasks, ...adHocTasks];
    const totalTasks = allTasks.length;
    const completedTasks = allTasks.filter(task => task.status === "Complete").length;
    const inProgressTasks = allTasks.filter(task => task.status === "In Progress").length;
    const blockedTasks = allTasks.filter(task => task.status === "Blocked").length;
    
    const statusDistribution = allTasks.reduce((acc, task) => {
      acc[task.status] = (acc[task.status] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    // Calculate real weekly completions based on actual data
    const weeklyCompletions = calculateWeeklyCompletions();

    const metrics = {
      totalTasks,
      completedTasks,
      inProgressTasks,
      blockedTasks,
      projectTasksCount: projectTasks.length,
      adHocTasksCount: adHocTasks.length,
      completionRate: totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0,
      weeklyCompletions,
      statusDistribution: statusDistribution as any
    };

    console.log('Calculated metrics:', metrics);
    return metrics;
  };

  // Calculate actual weekly completions from task data
  const calculateWeeklyCompletions = (): number[] => {
    const weeks = Array(5).fill(0); // Last 5 weeks
    const now = new Date();
    
    // Get all tasks - only count actual task completions, not daily log activities
    const allTasks = [...projectTasks, ...adHocTasks];
    
    console.log('Calculating weekly completions for tasks:', allTasks.length);
    
    // Only check actual task completion dates, not daily logs
    allTasks.forEach(task => {
      // Check if task itself was completed
      if (task.status === "Complete") {
        const taskDate = new Date(task.updatedAt);
        const daysDiff = Math.floor((now.getTime() - taskDate.getTime()) / (1000 * 60 * 60 * 24));
        const weekIndex = Math.floor(daysDiff / 7);
        
        console.log(`Task ${task.taskName} completed ${daysDiff} days ago, week ${weekIndex}`);
        
        if (weekIndex >= 0 && weekIndex < 5) {
          weeks[4 - weekIndex]++; // Most recent week is last index
        }
      }
      
      // Note: Daily logs are for activity tracking only and don't count toward completion metrics
    });
    
    console.log('Weekly completions:', weeks);
    return weeks;
  };

  // Calculate detailed analytics
  const calculateDetailedAnalytics = () => {
    const allTasks = [...projectTasks, ...adHocTasks];
    const completedTasks = allTasks.filter(task => task.status === "Complete");
    
    // Average completion time
    let avgCompletionTime = 0;
    if (completedTasks.length > 0) {
      const totalDays = completedTasks.reduce((sum, task) => {
        const startDate = new Date('startDate' in task ? task.startDate : task.createdAt);
        const endDate = new Date(task.updatedAt);
        const days = Math.floor((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
        return sum + Math.max(days, 0);
      }, 0);
      avgCompletionTime = totalDays / completedTasks.length;
    }

    // Tasks overdue (due date passed but not complete)
    const now = new Date();
    const overdueTasks = allTasks.filter(task => {
      if (task.status === "Complete") return false;
      const dueDate = new Date('deploymentDate' in task ? task.deploymentDate : task.dueDate);
      return dueDate < now;
    }).length;

    // Most active squad
    const squadCounts = projectTasks.reduce((acc, task) => {
      acc[task.squadName] = (acc[task.squadName] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    const mostActiveSquad = Object.entries(squadCounts)
      .sort(([,a], [,b]) => b - a)[0]?.[0] || "No squads";

    // Pending security sign-offs
    const pendingSignOffs = projectTasks.filter(task => 
      !task.securitySignOff && task.status !== "Complete"
    ).length;

    // Weekly velocity (tasks completed this week vs last week)
    const thisWeekCompletions = metrics.weeklyCompletions[4] || 0;
    const lastWeekCompletions = metrics.weeklyCompletions[3] || 0;
    const velocityChange = lastWeekCompletions > 0 
      ? ((thisWeekCompletions - lastWeekCompletions) / lastWeekCompletions) * 100 
      : 0;

    // Most productive day (based on daily logs)
    const dayCompletions = { 
      Monday: 0, Tuesday: 0, Wednesday: 0, Thursday: 0, 
      Friday: 0, Saturday: 0, Sunday: 0 
    };
    
    projectTasks.forEach(task => {
      task.dailyLogs.forEach(log => {
        if (log.status === "Complete") {
          const dayName = new Date(log.date).toLocaleDateString('en-US', { weekday: 'long' });
          if (dayName in dayCompletions) {
            dayCompletions[dayName as keyof typeof dayCompletions]++;
          }
        }
      });
    });

    const mostProductiveDay = Object.entries(dayCompletions)
      .sort(([,a], [,b]) => b - a)[0]?.[0] || "No data";

    return {
      avgCompletionTime: avgCompletionTime.toFixed(1),
      overdueTasks,
      mostActiveSquad,
      pendingSignOffs,
      velocityChange,
      mostProductiveDay
    };
  };

  const handleAddProjectTask = async (taskData: Omit<ProjectTask, 'id' | 'priority' | 'dailyLogs' | 'createdAt' | 'updatedAt'>) => {
    try {
      const newTask: ProjectTask = {
        ...taskData,
        id: uuid(),
        priority: projectTasks.length + 1,
        dailyLogs: [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      const updatedTasks = [...projectTasks, newTask];
      setProjectTasks(updatedTasks);
      await storageService.saveProjectTasks(updatedTasks);
      setShowProjectForm(false);
      
      // Log task creation
      activityLogger.logTaskCreated(newTask.id, newTask.taskName, 'project');
      
      toast({
        title: "Project Task Added",
        description: `"${taskData.taskName}" has been added successfully.`,
      });
    } catch (error) {
      console.error('Error adding project task:', error);
      toast({
        title: "Error",
        description: "Failed to add project task. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleAddAdHocTask = async (taskData: Omit<AdHocTask, 'id' | 'status' | 'createdAt' | 'updatedAt'>) => {
    try {
      const newTask: AdHocTask = {
        ...taskData,
        id: uuid(),
        status: "To Do",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      const updatedTasks = [...adHocTasks, newTask];
      setAdHocTasks(updatedTasks);
      await storageService.saveAdHocTasks(updatedTasks);
      setShowAdHocForm(false);
      
      // Log task creation
      activityLogger.logTaskCreated(newTask.id, newTask.taskName, 'adhoc');
      
      toast({
        title: "Ad-Hoc Task Added",
        description: `"${taskData.taskName}" has been added successfully.`,
      });
    } catch (error) {
      console.error('Error adding ad-hoc task:', error);
      toast({
        title: "Error",
        description: "Failed to add ad-hoc task. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleExportToPDF = () => {
    try {
      const metrics = calculateMetrics();
      exportService.exportToPDF(projectTasks, adHocTasks, metrics, exportOptions);
      setShowExportDialog(false);
      toast({
        title: "PDF Export Successful",
        description: "PDF report has been downloaded successfully.",
      });
    } catch (error) {
      console.error('Error exporting to PDF:', error);
      toast({
        title: "PDF Export Failed",
        description: "Failed to export PDF. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleUpdateProjectTasks = async (updatedTasks: ProjectTask[]) => {
    try {
      setProjectTasks(updatedTasks);
      await storageService.saveProjectTasks(updatedTasks);
    } catch (error) {
      console.error('Error updating project tasks:', error);
      toast({
        title: "Error",
        description: "Failed to save project tasks. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleUpdateAdHocTasks = async (updatedTasks: AdHocTask[]) => {
    try {
      setAdHocTasks(updatedTasks);
      await storageService.saveAdHocTasks(updatedTasks);
    } catch (error) {
      console.error('Error updating ad-hoc tasks:', error);
      toast({
        title: "Error",
        description: "Failed to save ad-hoc tasks. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleExportToExcel = () => {
    try {
      const metrics = calculateMetrics();
      exportService.exportToExcel(projectTasks, adHocTasks, metrics, exportOptions);
      setShowExportDialog(false);
      toast({
        title: "Export Successful",
        description: "Excel report has been downloaded successfully.",
      });
    } catch (error) {
      console.error('Error exporting to Excel:', error);
      toast({
        title: "Export Failed",
        description: "Failed to export data. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleExportToCSV = () => {
    try {
      exportService.exportToCSV(projectTasks, adHocTasks);
      toast({
        title: "Export Successful",
        description: "CSV file has been downloaded successfully.",
      });
    } catch (error) {
      console.error('Error exporting to CSV:', error);
      toast({
        title: "Export Failed",
        description: "Failed to export data. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleDataImported = () => {
    // Refresh all data after import
    loadData();
  };

  const metrics = calculateMetrics();
  const detailedAnalytics = calculateDetailedAnalytics();

  // Show settings view
  if (currentView === 'settings') {
    return <Settings 
      onDataImported={handleDataImported} 
      onGoBack={() => setCurrentView('dashboard')}
    />;
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
          <div className="text-center">
            <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-gradient-primary animate-pulse shadow-glow"></div>
            <h2 className="text-2xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent mb-3">TRACKER</h2>
            <p className="text-muted-foreground font-medium">Initializing Advanced Task Management...</p>
          </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card shadow-card">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-gradient-primary">
                <Shield className="h-6 w-6 text-primary-foreground" />
              </div>
              <div>
                <h1 className="text-3xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                  TRACKER
                </h1>
                <p className="text-sm text-muted-foreground font-medium">
                  Advanced Task Management System
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <ThemeToggle />
              
              <Dialog open={showExportDialog} onOpenChange={setShowExportDialog}>
                <DialogTrigger asChild>
                  <Button 
                    variant="outline"
                    className="border-border text-foreground hover:bg-muted"
                  >
                    <Download className="h-4 w-4 mr-2" />
                    Export Report
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
                            id="projectTasks"
                            checked={exportOptions.includeProjectTasks}
                            onCheckedChange={(checked) => 
                              setExportOptions(prev => ({ ...prev, includeProjectTasks: !!checked }))
                            }
                          />
                          <Label htmlFor="projectTasks" className="text-foreground">Project Tasks</Label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Checkbox 
                            id="adHocTasks"
                            checked={exportOptions.includeAdHocTasks}
                            onCheckedChange={(checked) => 
                              setExportOptions(prev => ({ ...prev, includeAdHocTasks: !!checked }))
                            }
                          />
                          <Label htmlFor="adHocTasks" className="text-foreground">Ad-Hoc Tasks</Label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Checkbox 
                            id="metrics"
                            checked={exportOptions.includeMetrics}
                            onCheckedChange={(checked) => 
                              setExportOptions(prev => ({ ...prev, includeMetrics: !!checked }))
                            }
                          />
                          <Label htmlFor="metrics" className="text-foreground">Summary Metrics</Label>
                        </div>
                      </div>
                    </div>
                    <div className="flex gap-3 pt-4">
                      <Button 
                        onClick={handleExportToExcel}
                        className="bg-primary hover:bg-primary-glow text-primary-foreground flex-1"
                      >
                        <FileSpreadsheet className="h-4 w-4 mr-2" />
                        Excel Report
                      </Button>
                      <Button 
                        onClick={handleExportToPDF}
                        className="bg-destructive hover:bg-destructive/90 text-destructive-foreground flex-1"
                      >
                        <FileDown className="h-4 w-4 mr-2" />
                        PDF Report
                      </Button>
                      <Button 
                        onClick={handleExportToCSV}
                        variant="outline"
                        className="border-border text-foreground hover:bg-muted flex-1"
                      >
                        <FileText className="h-4 w-4 mr-2" />
                        CSV Export
                      </Button>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>
              
              <Button 
                variant="outline"
                onClick={() => setCurrentView('settings')}
                className="border-border text-foreground hover:bg-muted"
              >
                <SettingsIcon className="h-4 w-4 mr-2" />
                Settings
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-6 py-8">
        {/* Metrics Dashboard */}
        <DashboardMetrics metrics={metrics} />

        {/* Charts Section */}
        <TaskChartsSection metrics={metrics} />

        {/* Task Management Tabs */}
        <Tabs defaultValue="project" className="space-y-6">
          <div className="flex items-center justify-between">
            <TabsList className="bg-card border border-border grid grid-cols-4 w-full">
              <TabsTrigger value="project" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
                Project Tasks
              </TabsTrigger>
              <TabsTrigger value="adhoc" className="data-[state=active]:bg-accent data-[state=active]:text-accent-foreground">
                Ad-Hoc Tasks
              </TabsTrigger>
              <TabsTrigger value="detailed" className="data-[state=active]:bg-secondary data-[state=active]:text-secondary-foreground">
                <BarChart3 className="h-4 w-4 mr-2" />
                Progress
              </TabsTrigger>
              <TabsTrigger value="analytics" className="data-[state=active]:bg-secondary data-[state=active]:text-secondary-foreground">
                <BarChart3 className="h-4 w-4 mr-2" />
                Analytics
              </TabsTrigger>
            </TabsList>

            <div className="flex gap-2">
              <Button 
                onClick={() => setShowProjectForm(true)}
                className="bg-primary hover:bg-primary-glow text-primary-foreground"
              >
                <Plus className="h-4 w-4 mr-2" />
                Project Task
              </Button>
              <Button 
                onClick={() => setShowAdHocForm(true)}
                className="bg-accent hover:bg-accent-muted text-accent-foreground"
              >
                <Plus className="h-4 w-4 mr-2" />
                Ad-Hoc Task
              </Button>
            </div>
          </div>

          <TabsContent value="project" className="space-y-6">
            <ProjectTaskForm 
              onSubmit={handleAddProjectTask}
              isVisible={showProjectForm}
              onCancel={() => setShowProjectForm(false)}
            />
            <ProjectTasksList 
              tasks={projectTasks}
              onUpdateTasks={handleUpdateProjectTasks}
            />
          </TabsContent>

          <TabsContent value="adhoc" className="space-y-6">
            <AdHocTaskForm 
              onSubmit={handleAddAdHocTask}
              isVisible={showAdHocForm}
              onCancel={() => setShowAdHocForm(false)}
            />
            <AdHocTasksList 
              tasks={adHocTasks}
              onUpdateTasks={handleUpdateAdHocTasks}
            />
          </TabsContent>

          <TabsContent value="detailed" className="space-y-6">
            <DetailedProgressDashboard 
              projectTasks={projectTasks}
              adHocTasks={adHocTasks}
            />
          </TabsContent>

          <TabsContent value="analytics">
            <Card className="bg-card shadow-card border-border">
              <CardHeader>
                <CardTitle className="text-foreground">Detailed Analytics</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold text-foreground">Task Performance</h3>
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Average completion time:</span>
                        <span className="text-foreground">
                          {detailedAnalytics.avgCompletionTime === "0.0" ? "No data" : `${detailedAnalytics.avgCompletionTime} days`}
                        </span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Tasks overdue:</span>
                        <span className={detailedAnalytics.overdueTasks > 0 ? "text-destructive" : "text-foreground"}>
                          {detailedAnalytics.overdueTasks} tasks
                        </span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Most productive day:</span>
                        <span className="text-foreground">{detailedAnalytics.mostProductiveDay}</span>
                      </div>
                    </div>
                  </div>
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold text-foreground">Team Insights</h3>
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Most active squad:</span>
                        <span className="text-foreground">{detailedAnalytics.mostActiveSquad}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Pending sign-offs:</span>
                        <span className={detailedAnalytics.pendingSignOffs > 0 ? "text-warning" : "text-foreground"}>
                          {detailedAnalytics.pendingSignOffs} tasks
                        </span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Weekly velocity:</span>
                        <span className={
                          detailedAnalytics.velocityChange > 0 ? "text-success" : 
                          detailedAnalytics.velocityChange < 0 ? "text-destructive" : "text-foreground"
                        }>
                          {detailedAnalytics.velocityChange > 0 ? "+" : ""}{detailedAnalytics.velocityChange.toFixed(0)}%
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
};

export default Index;