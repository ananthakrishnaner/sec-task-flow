import { ProjectTask, AdHocTask } from "@/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CheckCircle, Calendar, User, Clock, FileText } from "lucide-react";
import { format } from "date-fns";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface CompletedTasksSectionProps {
  projectTasks: ProjectTask[];
  adHocTasks: AdHocTask[];
}

export const CompletedTasksSection = ({ projectTasks, adHocTasks }: CompletedTasksSectionProps) => {
  const completedProjectTasks = projectTasks.filter(task => task.status === "Complete");
  const completedAdHocTasks = adHocTasks.filter(task => task.status === "Complete");
  const allCompletedTasks = [...completedProjectTasks, ...completedAdHocTasks];

  // Sort by completion date (most recent first)
  const sortedProjectTasks = [...completedProjectTasks].sort((a, b) => 
    new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
  );
  
  const sortedAdHocTasks = [...completedAdHocTasks].sort((a, b) => 
    new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
  );

  const sortedAllTasks = [...allCompletedTasks].sort((a, b) => 
    new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
  );

  const calculateDuration = (task: ProjectTask | AdHocTask): number => {
    const startDate = new Date('startDate' in task ? task.startDate : task.createdAt);
    const endDate = new Date(task.updatedAt);
    return Math.max(0, Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)));
  };

  const renderProjectTask = (task: ProjectTask) => (
    <Card key={task.id} className="bg-card border-border hover:shadow-card transition-shadow">
      <CardContent className="p-4 sm:p-6">
        <div className="space-y-3">
          <div className="flex items-start justify-between gap-3">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-2">
                <CheckCircle className="h-5 w-5 text-success flex-shrink-0" />
                <h3 className="font-semibold text-foreground text-base sm:text-lg truncate">
                  {task.taskName}
                </h3>
              </div>
              <p className="text-sm text-muted-foreground line-clamp-2">
                {task.description}
              </p>
            </div>
            <Badge variant="default" className="bg-success text-success-foreground flex-shrink-0">
              Completed
            </Badge>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
            <div className="flex items-center gap-2 text-muted-foreground">
              <User className="h-4 w-4 flex-shrink-0" />
              <span className="truncate"><span className="font-medium">Squad:</span> {task.squadName}</span>
            </div>
            <div className="flex items-center gap-2 text-muted-foreground">
              <User className="h-4 w-4 flex-shrink-0" />
              <span className="truncate"><span className="font-medium">SPOC:</span> {task.spoc}</span>
            </div>
            <div className="flex items-center gap-2 text-muted-foreground">
              <Calendar className="h-4 w-4 flex-shrink-0" />
              <span className="truncate">
                <span className="font-medium">Completed:</span> {format(new Date(task.updatedAt), 'MMM dd, yyyy')}
              </span>
            </div>
            <div className="flex items-center gap-2 text-muted-foreground">
              <Clock className="h-4 w-4 flex-shrink-0" />
              <span className="truncate">
                <span className="font-medium">Duration:</span> {calculateDuration(task)} days
              </span>
            </div>
          </div>

          {task.securitySignOff && (
            <div className="flex items-center gap-2 text-sm">
              <Badge variant="outline" className="border-success text-success">
                Security Signed Off
              </Badge>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );

  const renderAdHocTask = (task: AdHocTask) => (
    <Card key={task.id} className="bg-card border-border hover:shadow-card transition-shadow">
      <CardContent className="p-4 sm:p-6">
        <div className="space-y-3">
          <div className="flex items-start justify-between gap-3">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-2">
                <CheckCircle className="h-5 w-5 text-success flex-shrink-0" />
                <h3 className="font-semibold text-foreground text-base sm:text-lg truncate">
                  {task.taskName}
                </h3>
              </div>
              <p className="text-sm text-muted-foreground line-clamp-2">
                {task.description}
              </p>
            </div>
            <Badge variant="default" className="bg-success text-success-foreground flex-shrink-0">
              Completed
            </Badge>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
            <div className="flex items-center gap-2 text-muted-foreground">
              <Calendar className="h-4 w-4 flex-shrink-0" />
              <span className="truncate">
                <span className="font-medium">Completed:</span> {format(new Date(task.updatedAt), 'MMM dd, yyyy')}
              </span>
            </div>
            <div className="flex items-center gap-2 text-muted-foreground">
              <Clock className="h-4 w-4 flex-shrink-0" />
              <span className="truncate">
                <span className="font-medium">Duration:</span> {calculateDuration(task)} days
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2 text-sm">
            <Badge variant="outline" className="border-primary text-primary">
              Ad-Hoc Task
            </Badge>
          </div>
        </div>
      </CardContent>
    </Card>
  );

  return (
    <div className="space-y-6">
      <Card className="bg-card shadow-card border-border">
        <CardHeader className="p-4 sm:p-6">
          <div className="flex items-center justify-between">
            <CardTitle className="text-foreground flex items-center gap-2 text-lg sm:text-xl">
              <CheckCircle className="h-5 w-5 sm:h-6 sm:w-6 text-success" />
              <span>Completed Tasks</span>
            </CardTitle>
            <Badge variant="outline" className="text-base">
              {allCompletedTasks.length} Total
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="p-4 sm:p-6 pt-0">
          {allCompletedTasks.length === 0 ? (
            <div className="text-center py-12">
              <FileText className="h-12 w-12 mx-auto text-muted-foreground mb-3" />
              <p className="text-muted-foreground font-medium">No completed tasks yet</p>
              <p className="text-sm text-muted-foreground mt-1">
                Completed tasks will appear here
              </p>
            </div>
          ) : (
            <Tabs defaultValue="all" className="w-full">
              <TabsList className="grid w-full grid-cols-3 mb-6">
                <TabsTrigger value="all">
                  All ({allCompletedTasks.length})
                </TabsTrigger>
                <TabsTrigger value="project">
                  Project ({completedProjectTasks.length})
                </TabsTrigger>
                <TabsTrigger value="adhoc">
                  Ad-Hoc ({completedAdHocTasks.length})
                </TabsTrigger>
              </TabsList>

              <TabsContent value="all" className="space-y-4">
                {sortedAllTasks.map(task => 
                  'squadName' in task ? renderProjectTask(task) : renderAdHocTask(task)
                )}
              </TabsContent>

              <TabsContent value="project" className="space-y-4">
                {sortedProjectTasks.length > 0 ? (
                  sortedProjectTasks.map(renderProjectTask)
                ) : (
                  <div className="text-center py-8">
                    <p className="text-muted-foreground">No completed project tasks</p>
                  </div>
                )}
              </TabsContent>

              <TabsContent value="adhoc" className="space-y-4">
                {sortedAdHocTasks.length > 0 ? (
                  sortedAdHocTasks.map(renderAdHocTask)
                ) : (
                  <div className="text-center py-8">
                    <p className="text-muted-foreground">No completed ad-hoc tasks</p>
                  </div>
                )}
              </TabsContent>
            </Tabs>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
