import { useState, useEffect } from "react";
import { ProjectTask, AdHocTask, TaskMetrics } from "@/types";
import { storageService } from "@/lib/storage";
import { DashboardMetrics } from "@/components/DashboardMetrics";
import { TaskChartsSection } from "@/components/TaskChartsSection";
import { ProjectTaskForm } from "@/components/ProjectTaskForm";
import { AdHocTaskForm } from "@/components/AdHocTaskForm";
import { ProjectTasksList } from "@/components/ProjectTasksList";
import { AdHocTasksList } from "@/components/AdHocTasksList";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Shield, Plus, BarChart3, Download, Settings } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const Index = () => {
  const [projectTasks, setProjectTasks] = useState<ProjectTask[]>([]);
  const [adHocTasks, setAdHocTasks] = useState<AdHocTask[]>([]);
  const [showProjectForm, setShowProjectForm] = useState(false);
  const [showAdHocForm, setShowAdHocForm] = useState(false);
  const { toast } = useToast();

  // Load data on component mount
  useEffect(() => {
    setProjectTasks(storageService.getProjectTasks());
    setAdHocTasks(storageService.getAdHocTasks());
  }, []);

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

    return {
      totalTasks,
      completedTasks,
      inProgressTasks,
      blockedTasks,
      projectTasksCount: projectTasks.length,
      adHocTasksCount: adHocTasks.length,
      completionRate: totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0,
      weeklyCompletions: [2, 5, 3, 8, 4], // Mock data for now
      statusDistribution: statusDistribution as any
    };
  };

  const handleAddProjectTask = (taskData: Omit<ProjectTask, 'id' | 'priority' | 'dailyLogs' | 'createdAt' | 'updatedAt'>) => {
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
    storageService.saveProjectTasks(updatedTasks);
    setShowProjectForm(false);
    
    toast({
      title: "Project Task Added",
      description: `"${taskData.taskName}" has been added successfully.`,
    });
  };

  const handleAddAdHocTask = (taskData: Omit<AdHocTask, 'id' | 'status' | 'createdAt' | 'updatedAt'>) => {
    const newTask: AdHocTask = {
      ...taskData,
      id: crypto.randomUUID(),
      status: "To Do",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const updatedTasks = [...adHocTasks, newTask];
    setAdHocTasks(updatedTasks);
    storageService.saveAdHocTasks(updatedTasks);
    setShowAdHocForm(false);
    
    toast({
      title: "Ad-Hoc Task Added",
      description: `"${taskData.taskName}" has been added successfully.`,
    });
  };

  const handleUpdateProjectTasks = (updatedTasks: ProjectTask[]) => {
    setProjectTasks(updatedTasks);
    storageService.saveProjectTasks(updatedTasks);
  };

  const handleUpdateAdHocTasks = (updatedTasks: AdHocTask[]) => {
    setAdHocTasks(updatedTasks);
    storageService.saveAdHocTasks(updatedTasks);
  };

  const handleExportData = () => {
    toast({
      title: "Export Feature",
      description: "Excel export functionality will be implemented in the next iteration.",
    });
  };

  const metrics = calculateMetrics();

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
              <Button 
                variant="outline" 
                onClick={handleExportData}
                className="border-border text-foreground hover:bg-muted"
              >
                <Download className="h-4 w-4 mr-2" />
                Export Report
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