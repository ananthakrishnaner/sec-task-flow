import { useState } from "react";
import { AdHocTask, TaskStatus } from "@/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { format } from "date-fns";
import { Edit, Save, X } from "lucide-react";

interface AdHocTaskEditFormProps {
  task: AdHocTask;
  onSave: (updatedTask: AdHocTask) => void;
  onCancel: () => void;
  isVisible: boolean;
}

const statusOptions: TaskStatus[] = ["To Do", "In Progress", "Blocked", "Testing", "Complete"];

export const AdHocTaskEditForm = ({ task, onSave, onCancel, isVisible }: AdHocTaskEditFormProps) => {
  const [formData, setFormData] = useState({
    taskName: task.taskName,
    description: task.description,
    dueDate: format(new Date(task.dueDate), "yyyy-MM-dd"),
    status: task.status,
  });

  if (!isVisible) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const updatedTask: AdHocTask = {
      ...task,
      ...formData,
      updatedAt: new Date().toISOString(),
    };

    onSave(updatedTask);
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  return (
    <Card className="bg-card shadow-card border-border border-accent/30 mb-4">
      <CardHeader className="bg-gradient-accent/5 border-b border-border">
        <CardTitle className="text-foreground flex items-center gap-2">
          <Edit className="h-5 w-5 text-accent" />
          Edit Ad-Hoc Task
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-6">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="taskName" className="text-foreground">Task Name *</Label>
            <Input
              id="taskName"
              type="text"
              value={formData.taskName}
              onChange={(e) => handleInputChange('taskName', e.target.value)}
              className="bg-input border-border text-foreground"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description" className="text-foreground">Description *</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => handleInputChange('description', e.target.value)}
              className="bg-input border-border text-foreground min-h-[100px]"
              required
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="dueDate" className="text-foreground">Due Date *</Label>
              <Input
                id="dueDate"
                type="date"
                value={formData.dueDate}
                onChange={(e) => handleInputChange('dueDate', e.target.value)}
                className="bg-input border-border text-foreground"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="status" className="text-foreground">Status *</Label>
              <Select 
                value={formData.status} 
                onValueChange={(value: TaskStatus) => handleInputChange('status', value)}
              >
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
            </div>
          </div>

          <div className="flex gap-3 pt-4">
            <Button 
              type="submit"
              className="bg-accent hover:bg-accent-muted text-accent-foreground"
            >
              <Save className="h-4 w-4 mr-2" />
              Save Changes
            </Button>
            <Button 
              type="button"
              variant="outline" 
              onClick={onCancel}
              className="border-border text-foreground hover:bg-muted"
            >
              <X className="h-4 w-4 mr-2" />
              Cancel
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
};