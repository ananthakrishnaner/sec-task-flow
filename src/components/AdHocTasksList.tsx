import { AdHocTask, TaskStatus } from "@/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { TaskStatusBadge } from "@/components/TaskStatusBadge";
import { Calendar, Zap, Trash2 } from "lucide-react";
import { format } from "date-fns";

interface AdHocTasksListProps {
  tasks: AdHocTask[];
  onUpdateTasks: (tasks: AdHocTask[]) => void;
}

const statusOptions: TaskStatus[] = ["To Do", "In Progress", "Blocked", "Testing", "Complete"];

export const AdHocTasksList = ({ tasks, onUpdateTasks }: AdHocTasksListProps) => {
  const handleStatusChange = (taskId: string, newStatus: TaskStatus) => {
    const updatedTasks = tasks.map(task =>
      task.id === taskId
        ? { ...task, status: newStatus, updatedAt: new Date().toISOString() }
        : task
    );
    onUpdateTasks(updatedTasks);
  };

  const handleDeleteTask = (taskId: string) => {
    const updatedTasks = tasks.filter(task => task.id !== taskId);
    onUpdateTasks(updatedTasks);
  };

  if (tasks.length === 0) {
    return (
      <Card className="bg-card shadow-card border-border">
        <CardContent className="p-8 text-center">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-accent/10 flex items-center justify-center">
            <Zap className="h-8 w-8 text-accent" />
          </div>
          <h3 className="text-lg font-medium text-foreground mb-2">No Ad-Hoc Tasks</h3>
          <p className="text-muted-foreground">Add quick tasks that don't fit into project workflows.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-semibold text-foreground flex items-center gap-2">
          <Zap className="h-5 w-5 text-accent" />
          Ad-Hoc Tasks ({tasks.length})
        </h2>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {tasks.map((task) => (
          <Card key={task.id} className="bg-card shadow-card border-border hover:shadow-elevated transition-all duration-300">
            <CardHeader className="bg-gradient-accent/5 border-b border-border">
              <div className="flex items-center justify-between">
                <CardTitle className="text-foreground">{task.taskName}</CardTitle>
                <div className="flex items-center gap-2">
                  <TaskStatusBadge status={task.status} />
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => handleDeleteTask(task.id)}
                    className="text-destructive hover:text-destructive hover:bg-destructive/10"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardHeader>

            <CardContent className="pt-4 space-y-4">
              <p className="text-muted-foreground text-sm">{task.description}</p>
              
              <div className="flex items-center gap-2 text-sm">
                <Calendar className="h-4 w-4 text-accent" />
                <div>
                  <span className="text-muted-foreground">Due: </span>
                  <span className="text-foreground font-medium">
                    {format(new Date(task.dueDate), "MMM dd, yyyy")}
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <label className="text-sm text-muted-foreground">Status:</label>
                <Select 
                  value={task.status} 
                  onValueChange={(value: TaskStatus) => handleStatusChange(task.id, value)}
                >
                  <SelectTrigger className="w-32 bg-input border-border text-foreground">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-popover border-border">
                    {statusOptions.map((status) => (
                      <SelectItem key={status} value={status} className="text-popover-foreground">
                        {status}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="text-xs text-muted-foreground pt-2 border-t border-border">
                Created: {format(new Date(task.createdAt), "MMM dd, yyyy 'at' HH:mm")}
                {task.updatedAt !== task.createdAt && (
                  <span className="ml-2">
                    • Updated: {format(new Date(task.updatedAt), "MMM dd, yyyy 'at' HH:mm")}
                  </span>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};