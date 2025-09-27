import { useState, useEffect } from "react";
import { ProjectTask, AdHocTask, TaskMetrics } from "@/types";
import { storageService } from "@/lib/storage";
import { exportService, ExportOptions } from "@/lib/exportService";
import { DashboardMetrics } from "@/components/DashboardMetrics";
import { TaskChartsSection } from "@/components/TaskChartsSection";
import { ProjectTaskForm } from "@/components/ProjectTaskForm";
import { AdHocTaskForm } from "@/components/AdHocTaskForm";
import { ProjectTasksList } from "@/components/ProjectTasksList";
import { AdHocTasksList } from "@/components/AdHocTasksList";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Shield, Plus, BarChart3, Download, Settings, FileSpreadsheet, FileText } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const Index = () => {
  const [projectTasks, setProjectTasks] = useState<ProjectTask[]>([]);
  const [adHocTasks, setAdHocTasks] = useState<AdHocTask[]>([]);
  const [showProjectForm, setShowProjectForm] = useState(false);
  const [showAdHocForm, setShowAdHocForm] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [showExportDialog, setShowExportDialog] = useState(false);
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

    return {
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
  };

  // Calculate actual weekly completions from task data
  const calculateWeeklyCompletions = (): number[] => {
    const weeks = Array(5).fill(0); // Last 5 weeks
    const now = new Date();
    
    const allCompletedTasks = [...projectTasks, ...adHocTasks].filter(task => task.status === "Complete");
    
    allCompletedTasks.forEach(task => {
      const taskDate = new Date(task.updatedAt);
      const daysDiff = Math.floor((now.getTime() - taskDate.getTime()) / (1000 * 60 * 60 * 24));
      const weekIndex = Math.floor(daysDiff / 7);
      
      if (weekIndex >= 0 && weekIndex < 5) {
        weeks[4 - weekIndex]++; // Reverse order (most recent first)
      }
    });
    
    return weeks;
  };

  const handleAddProjectTask = async (taskData: Omit<ProjectTask, 'id' | 'priority' | 'dailyLogs' | 'createdAt' | 'updatedAt'>) => {
    try {
      const newTask: ProjectTask = {
        ...taskData,
        id: crypto.randomUUID(),
        priority: projectTasks.length + 1,
        dailyLogs: [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      const updatedTasks = [...projectTasks, newTask];
      setProjectTasks(updatedTasks);
      await storageService.saveProjectTasks(updatedTasks);
      setShowProjectForm(false);
      
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
        id: crypto.randomUUID(),
        status: "To Do",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      const updatedTasks = [...adHocTasks, newTask];
      setAdHocTasks(updatedTasks);
      await storageService.saveAdHocTasks(updatedTasks);
      setShowAdHocForm(false);
      
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

  const handleDownloadJsonBackup = () => {
    try {
      storageService.downloadJsonBackup();
      toast({
        title: "Backup Downloaded",
        description: "JSON backup file has been downloaded successfully.",
      });
    } catch (error) {
      console.error('Error downloading backup:', error);
      toast({
        title: "Download Failed",
        description: "Failed to download backup. Please try again.",
        variant: "destructive",
      });
    }
  };

  const metrics = calculateMetrics();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gradient-primary animate-pulse"></div>
          <h2 className="text-xl font-semibold text-foreground mb-2">Loading CET...</h2>
          <p className="text-muted-foreground">Initializing your cybersecurity tracker</p>
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
                <h1 className="text-2xl font-bold text-foreground">
                  Cybersecurity Efficiency Tracker
                </h1>
                <p className="text-sm text-muted-foreground">
                  Real-time task management and reporting
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
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
                            id="dailyLogs"
                            checked={exportOptions.includeDailyLogs}
                            onCheckedChange={(checked) => 
                              setExportOptions(prev => ({ ...prev, includeDailyLogs: !!checked }))
                            }
                          />
                          <Label htmlFor="dailyLogs" className="text-foreground">Daily Progress Logs</Label>
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
                onClick={handleDownloadJsonBackup}
                className="border-border text-foreground hover:bg-muted"
              >
                <Download className="h-4 w-4 mr-2" />
                JSON Backup
              </Button>
              
              <Button 
                variant="outline"
                className="border-border text-foreground hover:bg-muted"
              >
                <Settings className="h-4 w-4 mr-2" />
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
            <TabsList className="bg-card border border-border">
              <TabsTrigger value="project" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
                Project Tasks
              </TabsTrigger>
              <TabsTrigger value="adhoc" className="data-[state=active]:bg-accent data-[state=active]:text-accent-foreground">
                Ad-Hoc Tasks
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
                        <span className="text-foreground">5.2 days</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Tasks overdue:</span>
                        <span className="text-destructive">3 tasks</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Most productive day:</span>
                        <span className="text-foreground">Wednesday</span>
                      </div>
                    </div>
                  </div>
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold text-foreground">Team Insights</h3>
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Most active squad:</span>
                        <span className="text-foreground">Security Team Alpha</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Pending sign-offs:</span>
                        <span className="text-warning">2 tasks</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Weekly velocity:</span>
                        <span className="text-success">+15%</span>
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