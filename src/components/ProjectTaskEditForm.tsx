import { useState, useEffect } from "react";
import { ProjectTask, TaskStatus } from "@/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { format } from "date-fns";
import { Edit, Save, X, AlertCircle } from "lucide-react";
import { findSimilarSquad, getExistingSquadNames } from "@/lib/squadSuggestions";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface ProjectTaskEditFormProps {
  task: ProjectTask;
  onSave: (updatedTask: ProjectTask) => void;
  onCancel: () => void;
  isVisible: boolean;
  existingTasks: ProjectTask[];
}

const statusOptions: TaskStatus[] = ["To Do", "In Progress", "Blocked", "Testing", "Complete"];

export const ProjectTaskEditForm = ({ task, onSave, onCancel, isVisible, existingTasks }: ProjectTaskEditFormProps) => {
  const [formData, setFormData] = useState({
    taskName: task.taskName,
    description: task.description,
    squadName: task.squadName,
    spoc: task.spoc,
    startDate: format(new Date(task.startDate), "yyyy-MM-dd"),
    deploymentDate: format(new Date(task.deploymentDate), "yyyy-MM-dd"),
    status: task.status,
    securitySignOff: task.securitySignOff,
  });
  const [suggestedSquad, setSuggestedSquad] = useState<string | null>(null);

  // Reset form data when task changes
  useEffect(() => {
    setFormData({
      taskName: task.taskName,
      description: task.description,
      squadName: task.squadName,
      spoc: task.spoc,
      startDate: format(new Date(task.startDate), "yyyy-MM-dd"),
      deploymentDate: format(new Date(task.deploymentDate), "yyyy-MM-dd"),
      status: task.status,
      securitySignOff: task.securitySignOff,
    });
    setSuggestedSquad(null);
  }, [task]);

  // Check for similar squad names when typing
  useEffect(() => {
    if (formData.squadName && formData.squadName.length >= 2) {
      const existingSquads = getExistingSquadNames(existingTasks).filter(
        squad => squad !== task.squadName // Exclude the original squad name
      );
      const similar = findSimilarSquad(formData.squadName, existingSquads);
      setSuggestedSquad(similar);
    } else {
      setSuggestedSquad(null);
    }
  }, [formData.squadName, existingTasks, task.squadName]);

  if (!isVisible) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const updatedTask: ProjectTask = {
      ...task,
      ...formData,
      updatedAt: new Date().toISOString(),
    };

    onSave(updatedTask);
  };

  const handleInputChange = (field: string, value: string | boolean) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const acceptSuggestion = () => {
    if (suggestedSquad) {
      setSuggestedSquad(null); // Hide suggestion first
      setFormData(prev => ({ ...prev, squadName: suggestedSquad }));
    }
  };

  return (
    <Card className="bg-card shadow-card border-border border-primary/30">
      <CardHeader className="bg-gradient-surface border-b border-border">
        <CardTitle className="text-foreground flex items-center gap-2">
          <Edit className="h-5 w-5 text-primary" />
          Edit Project Task
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-6">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
              <Label htmlFor="squadName" className="text-foreground">Squad Name *</Label>
              <Input
                id="squadName"
                type="text"
                value={formData.squadName}
                onChange={(e) => handleInputChange('squadName', e.target.value)}
                className="bg-input border-border text-foreground"
                required
              />
              {suggestedSquad && (
                <Alert className="bg-muted border-primary/50">
                  <AlertCircle className="h-4 w-4 text-primary" />
                  <AlertDescription className="flex items-center justify-between gap-2">
                    <span className="text-sm text-foreground">
                      Did you mean <strong>"{suggestedSquad}"</strong>?
                    </span>
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      onClick={acceptSuggestion}
                      className="h-7 text-xs"
                    >
                      Use this
                    </Button>
                  </AlertDescription>
                </Alert>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="spoc" className="text-foreground">SPOC *</Label>
              <Input
                id="spoc"
                type="text"
                value={formData.spoc}
                onChange={(e) => handleInputChange('spoc', e.target.value)}
                className="bg-input border-border text-foreground"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="startDate" className="text-foreground">Start Date *</Label>
              <Input
                id="startDate"
                type="date"
                value={formData.startDate}
                onChange={(e) => handleInputChange('startDate', e.target.value)}
                className="bg-input border-border text-foreground"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="deploymentDate" className="text-foreground">Deployment Date *</Label>
              <Input
                id="deploymentDate"
                type="date"
                value={formData.deploymentDate}
                onChange={(e) => handleInputChange('deploymentDate', e.target.value)}
                className="bg-input border-border text-foreground"
                required
              />
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <Checkbox
              id="securitySignOff"
              checked={formData.securitySignOff}
              onCheckedChange={(checked) => handleInputChange('securitySignOff', !!checked)}
            />
            <Label htmlFor="securitySignOff" className="text-foreground">
              Security Sign-off Required
            </Label>
          </div>

          <div className="flex gap-3 pt-4">
            <Button 
              type="submit"
              className="bg-primary hover:bg-primary-glow text-primary-foreground"
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