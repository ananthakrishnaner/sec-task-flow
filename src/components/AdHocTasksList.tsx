import { useState } from "react";
import { AdHocTask, TaskStatus } from "@/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { TaskStatusBadge } from "@/components/TaskStatusBadge";
import { AdHocTaskEditForm } from "@/components/AdHocTaskEditForm";
import { Calendar, Zap, Trash2, Edit, GripVertical } from "lucide-react";
import { format } from "date-fns";
import { activityLogger } from "@/lib/activityLogger";
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

interface AdHocTasksListProps {
  tasks: AdHocTask[];
  onUpdateTasks: (tasks: AdHocTask[]) => void;
}

const statusOptions: TaskStatus[] = ["To Do", "In Progress", "Blocked", "Testing", "Complete"];

interface SortableAdHocTaskItemProps {
  task: AdHocTask;
  editingTaskId: string | null;
  onEditTask: (task: AdHocTask) => void;
  onSetEditingTaskId: (id: string | null) => void;
  onStatusChange: (taskId: string, status: TaskStatus) => void;
  onDeleteTask: (taskId: string) => void;
}

const SortableAdHocTaskItem = ({ 
  task, 
  editingTaskId, 
  onEditTask, 
  onSetEditingTaskId,
  onStatusChange,
  onDeleteTask
}: SortableAdHocTaskItemProps) => {
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

  return (
    <div ref={setNodeRef} style={style}>
      <AdHocTaskEditForm
        task={task}
        onSave={onEditTask}
        onCancel={() => onSetEditingTaskId(null)}
        isVisible={editingTaskId === task.id}
      />
      {editingTaskId !== task.id && (
        <Card className="bg-card shadow-card border-border hover:shadow-elevated transition-all duration-300">
          <CardHeader className="bg-gradient-accent/5 border-b border-border">
            <div className="flex items-center justify-between gap-2">
              <div 
                {...attributes} 
                {...listeners}
                className="cursor-grab active:cursor-grabbing flex-shrink-0 p-1 hover:bg-accent/10 rounded"
              >
                <GripVertical className="h-5 w-5 text-muted-foreground" />
              </div>
              <CardTitle className="text-foreground flex-1 truncate">{task.taskName}</CardTitle>
              <div className="flex items-center gap-2 flex-shrink-0">
                <TaskStatusBadge status={task.status} />
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => onSetEditingTaskId(task.id)}
                  className="text-foreground hover:bg-muted h-8 w-8 p-0"
                >
                  <Edit className="h-4 w-4" />
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => onDeleteTask(task.id)}
                  className="text-destructive hover:text-destructive hover:bg-destructive/10 h-8 w-8 p-0"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </CardHeader>

          <CardContent className="pt-4 space-y-4">
            <p className="text-muted-foreground text-sm">{task.description}</p>
            
            <div className="flex items-center gap-2 text-sm">
              <Calendar className="h-4 w-4 text-accent flex-shrink-0" />
              <div>
                <span className="text-muted-foreground">Due: </span>
                <span className="text-foreground font-medium">
                  {format(new Date(task.dueDate), "MMM dd, yyyy")}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <label className="text-sm text-muted-foreground flex-shrink-0">Status:</label>
              <Select 
                value={task.status} 
                onValueChange={(value: TaskStatus) => onStatusChange(task.id, value)}
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
      )}
    </div>
  );
};

export const AdHocTasksList = ({ tasks, onUpdateTasks }: AdHocTasksListProps) => {
  const [editingTaskId, setEditingTaskId] = useState<string | null>(null);
  
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
        order: index + 1,
        updatedAt: new Date().toISOString(),
      }));
      
      onUpdateTasks(reorderedTasks);
    }
  };

  const handleStatusChange = (taskId: string, newStatus: TaskStatus) => {
    const task = tasks.find(t => t.id === taskId);
    if (!task) return;
    
    const oldStatus = task.status;
    const updatedTasks = tasks.map(t =>
      t.id === taskId
        ? { ...t, status: newStatus, updatedAt: new Date().toISOString() }
        : t
    );
    
    activityLogger.logStatusChange(taskId, task.taskName, 'adhoc', oldStatus, newStatus);
    onUpdateTasks(updatedTasks);
  };

  const handleDeleteTask = (taskId: string) => {
    const task = tasks.find(t => t.id === taskId);
    if (task) {
      activityLogger.logTaskDeleted(taskId, task.taskName, 'adhoc');
    }
    
    const updatedTasks = tasks.filter(t => t.id !== taskId);
    onUpdateTasks(updatedTasks);
  };

  const handleEditTask = (updatedTask: AdHocTask) => {
    const updatedTasks = tasks.map(task =>
      task.id === updatedTask.id ? updatedTask : task
    );
    
    activityLogger.logTaskUpdated(updatedTask.id, updatedTask.taskName, 'adhoc');
    onUpdateTasks(updatedTasks);
    setEditingTaskId(null);
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
        <p className="text-sm text-muted-foreground hidden sm:block">
          Drag and drop to reorder
        </p>
      </div>
      
      <DndContext 
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={handleDragEnd}
      >
        <SortableContext items={tasks.map(t => t.id)} strategy={verticalListSortingStrategy}>
          <div className="space-y-4">
            {tasks.map((task) => (
              <SortableAdHocTaskItem
                key={task.id}
                task={task}
                editingTaskId={editingTaskId}
                onEditTask={handleEditTask}
                onSetEditingTaskId={setEditingTaskId}
                onStatusChange={handleStatusChange}
                onDeleteTask={handleDeleteTask}
              />
            ))}
          </div>
        </SortableContext>
      </DndContext>
    </div>
  );
};