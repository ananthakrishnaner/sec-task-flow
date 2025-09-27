import { useState } from "react";
import { ProjectTask, TaskStatus, DailyLog } from "@/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { TaskStatusBadge } from "@/components/TaskStatusBadge";
import { ProjectTaskEditForm } from "@/components/ProjectTaskEditForm";
import { Calendar, CheckCircle, Clock, User, Target, FileText, Plus, Edit } from "lucide-react";
import { format } from "date-fns";
import { 
  DndContext, 
  closestCenter, 
  KeyboardSensor, 
  PointerSensor, 
  useSensor, 
  useSensors,
  DragEndEvent
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import {
  useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

interface ProjectTasksListProps {
  tasks: ProjectTask[];
  onUpdateTasks: (tasks: ProjectTask[]) => void;
}

interface SortableTaskItemProps {
  task: ProjectTask;
  onUpdateTask: (task: ProjectTask) => void;
}

const statusOptions: TaskStatus[] = ["To Do", "In Progress", "Blocked", "Testing", "Complete"];

const SortableTaskItem = ({ task, onUpdateTask }: SortableTaskItemProps) => {
  const [showDailyLog, setShowDailyLog] = useState(false);
  const [dailyLogNote, setDailyLogNote] = useState("");
  const [selectedLogStatus, setSelectedLogStatus] = useState<TaskStatus>(task.status);
  const [isEditing, setIsEditing] = useState(false);

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: task.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  const handleStatusChange = (newStatus: TaskStatus) => {
    const updatedTask = {
      ...task,
      status: newStatus,
      updatedAt: new Date().toISOString(),
    };
    onUpdateTask(updatedTask);
  };

  const handleSecuritySignOffToggle = () => {
    const updatedTask = {
      ...task,
      securitySignOff: !task.securitySignOff,
      updatedAt: new Date().toISOString(),
    };
    onUpdateTask(updatedTask);
  };

  const handleAddDailyLog = () => {
    if (!dailyLogNote.trim()) return;

    const newLog: DailyLog = {
      id: crypto.randomUUID(),
      date: new Date().toISOString(),
      status: selectedLogStatus,
      notes: dailyLogNote,
      createdAt: new Date().toISOString(),
    };

    const updatedTask = {
      ...task,
      status: selectedLogStatus,
      dailyLogs: [...task.dailyLogs, newLog],
      updatedAt: new Date().toISOString(),
    };

    onUpdateTask(updatedTask);
    setDailyLogNote("");
    setShowDailyLog(false);
  };

  const handleEditTask = (updatedTask: ProjectTask) => {
    onUpdateTask(updatedTask);
    setIsEditing(false);
  };

  return (
    <Card 
      ref={setNodeRef} 
      style={style}
      className="bg-card shadow-card border-border mb-4 hover:shadow-elevated transition-all duration-300"
    >
      <CardHeader 
        {...attributes} 
        {...listeners}
        className="cursor-grab active:cursor-grabbing bg-gradient-surface border-b border-border"
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded bg-primary/20 text-primary text-xs flex items-center justify-center font-bold">
                {task.priority}
              </div>
              <CardTitle className="text-foreground">{task.taskName}</CardTitle>
            </div>
            <TaskStatusBadge status={task.status} />
          </div>
          <div className="flex items-center gap-2">
            {task.securitySignOff && (
              <Badge className="bg-success text-success-foreground">
                <CheckCircle className="h-3 w-3 mr-1" />
                Security Approved
              </Badge>
            )}
            <Button
              size="sm"
              variant="outline"
              onClick={() => setIsEditing(true)}
              className="border-border text-foreground hover:bg-muted"
            >
              <Edit className="h-4 w-4 mr-1" />
              Edit Task
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => setShowDailyLog(!showDailyLog)}
              className="border-border text-foreground hover:bg-muted"
            >
              <Plus className="h-4 w-4 mr-1" />
              Log Update
            </Button>
          </div>
        </div>
      </CardHeader>

      {/* Edit Form */}
      <ProjectTaskEditForm
        task={task}
        onSave={handleEditTask}
        onCancel={() => setIsEditing(false)}
        isVisible={isEditing}
      />

      {!isEditing && (
        <>
      <CardContent className="pt-4 space-y-4">
        <p className="text-muted-foreground">{task.description}</p>
        
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
          <div className="flex items-center gap-2">
            <User className="h-4 w-4 text-primary" />
            <div>
              <p className="text-muted-foreground">Squad</p>
              <p className="text-foreground font-medium">{task.squadName}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Target className="h-4 w-4 text-primary" />
            <div>
              <p className="text-muted-foreground">SPOC</p>
              <p className="text-foreground font-medium">{task.spoc}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4 text-primary" />
            <div>
              <p className="text-muted-foreground">Start Date</p>
              <p className="text-foreground font-medium">{format(new Date(task.startDate), "MMM dd, yyyy")}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Clock className="h-4 w-4 text-destructive" />
            <div>
              <p className="text-muted-foreground">Due Date</p>
              <p className="text-foreground font-medium">{format(new Date(task.deploymentDate), "MMM dd, yyyy")}</p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <label className="text-sm text-muted-foreground">Status:</label>
            <Select value={task.status} onValueChange={handleStatusChange}>
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
          
          <Button
            size="sm"
            variant={task.securitySignOff ? "default" : "outline"}
            onClick={handleSecuritySignOffToggle}
            className={task.securitySignOff 
              ? "bg-success text-success-foreground" 
              : "border-border text-foreground hover:bg-muted"
            }
          >
            <CheckCircle className="h-4 w-4 mr-1" />
            Security Sign-off
          </Button>
        </div>

        {/* Daily Log Form */}
        {showDailyLog && (
          <div className="border-t border-border pt-4 space-y-3">
            <h4 className="text-sm font-medium text-foreground flex items-center gap-2">
              <Edit className="h-4 w-4 text-primary" />
              Add Daily Status Update
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <Select value={selectedLogStatus} onValueChange={(value: TaskStatus) => setSelectedLogStatus(value)}>
                <SelectTrigger className="bg-input border-border text-foreground">
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
              <div className="md:col-span-2">
                <Textarea
                  value={dailyLogNote}
                  onChange={(e) => setDailyLogNote(e.target.value)}
                  placeholder="Daily progress notes..."
                  className="bg-input border-border text-foreground"
                />
              </div>
            </div>
            <div className="flex gap-2">
              <Button 
                size="sm" 
                onClick={handleAddDailyLog}
                className="bg-primary hover:bg-primary-glow text-primary-foreground"
              >
                Add Log Entry
              </Button>
              <Button 
                size="sm" 
                variant="outline" 
                onClick={() => setShowDailyLog(false)}
                className="border-border text-foreground hover:bg-muted"
              >
                Cancel
              </Button>
            </div>
          </div>
        )}

        {/* Daily Logs History */}
        {task.dailyLogs.length > 0 && (
          <div className="border-t border-border pt-4">
            <h4 className="text-sm font-medium text-foreground mb-3 flex items-center gap-2">
              <FileText className="h-4 w-4 text-primary" />
              Daily Progress Log ({task.dailyLogs.length} entries)
            </h4>
            <div className="space-y-2 max-h-40 overflow-y-auto">
              {task.dailyLogs.slice(-5).reverse().map((log) => (
                <div key={log.id} className="text-xs p-2 bg-muted/50 rounded border border-border">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-muted-foreground">{format(new Date(log.date), "MMM dd, HH:mm")}</span>
                    <TaskStatusBadge status={log.status} className="text-xs px-1 py-0" />
                  </div>
                  <p className="text-foreground">{log.notes}</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
        </>
      )}
    </Card>
  );
};

export const ProjectTasksList = ({ tasks, onUpdateTasks }: ProjectTasksListProps) => {
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      const oldIndex = tasks.findIndex(task => task.id === active.id);
      const newIndex = tasks.findIndex(task => task.id === over.id);
      
      const reorderedTasks = arrayMove(tasks, oldIndex, newIndex).map((task, index) => ({
        ...task,
        priority: index + 1,
        updatedAt: new Date().toISOString(),
      }));
      
      onUpdateTasks(reorderedTasks);
    }
  };

  const handleUpdateTask = (updatedTask: ProjectTask) => {
    const updatedTasks = tasks.map(task => 
      task.id === updatedTask.id ? updatedTask : task
    );
    onUpdateTasks(updatedTasks);
  };

  if (tasks.length === 0) {
    return (
      <Card className="bg-card shadow-card border-border">
        <CardContent className="p-8 text-center">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-muted flex items-center justify-center">
            <FileText className="h-8 w-8 text-muted-foreground" />
          </div>
          <h3 className="text-lg font-medium text-foreground mb-2">No Project Tasks</h3>
          <p className="text-muted-foreground">Start by adding your first project task to track progress.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-semibold text-foreground">
          Project Tasks ({tasks.length})
        </h2>
        <p className="text-sm text-muted-foreground">
          Drag and drop to reorder by priority
        </p>
      </div>
      
      <DndContext 
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={handleDragEnd}
      >
        <SortableContext items={tasks.map(t => t.id)} strategy={verticalListSortingStrategy}>
          {tasks.map((task) => (
            <SortableTaskItem
              key={task.id}
              task={task}
              onUpdateTask={handleUpdateTask}
            />
          ))}
        </SortableContext>
      </DndContext>
    </div>
  );
};