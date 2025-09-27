import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { CalendarIcon, Plus } from "lucide-react";
import { format } from "date-fns";
import { ProjectTask, TaskStatus } from "@/types";
import { cn } from "@/lib/utils";

interface ProjectTaskFormProps {
  onSubmit: (task: Omit<ProjectTask, 'id' | 'priority' | 'dailyLogs' | 'createdAt' | 'updatedAt'>) => void;
  isVisible: boolean;
  onCancel: () => void;
}

const statusOptions: TaskStatus[] = ["To Do", "In Progress", "Blocked", "Testing", "Complete"];

export const ProjectTaskForm = ({ onSubmit, isVisible, onCancel }: ProjectTaskFormProps) => {
  const [formData, setFormData] = useState({
    taskName: "",
    description: "",
    squadName: "",
    spoc: "",
    startDate: undefined as Date | undefined,
    deploymentDate: undefined as Date | undefined,
    status: "To Do" as TaskStatus,
    securitySignOff: false,
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.startDate || !formData.deploymentDate) return;
    
    onSubmit({
      ...formData,
      startDate: formData.startDate.toISOString(),
      deploymentDate: formData.deploymentDate.toISOString(),
    });

    // Reset form
    setFormData({
      taskName: "",
      description: "",
      squadName: "",
      spoc: "",
      startDate: undefined,
      deploymentDate: undefined,
      status: "To Do",
      securitySignOff: false,
    });
  };

  if (!isVisible) return null;

  return (
    <Card className="bg-card shadow-elevated border-border mb-6">
      <CardHeader className="bg-gradient-surface">
        <CardTitle className="text-foreground flex items-center gap-2">
          <Plus className="h-5 w-5 text-primary" />
          Add New Project Task
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-6">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="taskName" className="text-foreground">Task Name *</Label>
              <Input
                id="taskName"
                value={formData.taskName}
                onChange={(e) => setFormData({ ...formData, taskName: e.target.value })}
                placeholder="Enter task name"
                required
                className="bg-input border-border text-foreground"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="squadName" className="text-foreground">Squad Name *</Label>
              <Input
                id="squadName"
                value={formData.squadName}
                onChange={(e) => setFormData({ ...formData, squadName: e.target.value })}
                placeholder="e.g., Security Team Alpha"
                required
                className="bg-input border-border text-foreground"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description" className="text-foreground">Description *</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Detailed scope and requirements..."
              required
              className="bg-input border-border text-foreground min-h-[100px]"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="spoc" className="text-foreground">SPOC (Single Point of Contact) *</Label>
              <Input
                id="spoc"
                value={formData.spoc}
                onChange={(e) => setFormData({ ...formData, spoc: e.target.value })}
                placeholder="Contact person name"
                required
                className="bg-input border-border text-foreground"
              />
            </div>

            <div className="space-y-2">
              <Label className="text-foreground">Status</Label>
              <Select value={formData.status} onValueChange={(value: TaskStatus) => setFormData({ ...formData, status: value })}>
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

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="text-foreground">Start Date *</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal bg-input border-border",
                      !formData.startDate && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {formData.startDate ? format(formData.startDate, "PPP") : "Pick start date"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0 bg-popover border-border" align="start">
                  <Calendar
                    mode="single"
                    selected={formData.startDate}
                    onSelect={(date) => setFormData({ ...formData, startDate: date })}
                    initialFocus
                    className="pointer-events-auto"
                  />
                </PopoverContent>
              </Popover>
            </div>

            <div className="space-y-2">
              <Label className="text-foreground">Deployment Date (Due) *</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal bg-input border-border",
                      !formData.deploymentDate && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {formData.deploymentDate ? format(formData.deploymentDate, "PPP") : "Pick due date"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0 bg-popover border-border" align="start">
                  <Calendar
                    mode="single"
                    selected={formData.deploymentDate}
                    onSelect={(date) => setFormData({ ...formData, deploymentDate: date })}
                    initialFocus
                    className="pointer-events-auto"
                  />
                </PopoverContent>
              </Popover>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <Checkbox
              id="securitySignOff"
              checked={formData.securitySignOff}
              onCheckedChange={(checked) => setFormData({ ...formData, securitySignOff: !!checked })}
            />
            <Label htmlFor="securitySignOff" className="text-foreground">
              Security Sign-off Required
            </Label>
          </div>

          <div className="flex gap-4 pt-4">
            <Button 
              type="submit" 
              className="bg-primary hover:bg-primary-glow text-primary-foreground"
            >
              Add Project Task
            </Button>
            <Button 
              type="button" 
              variant="outline" 
              onClick={onCancel}
              className="border-border text-foreground hover:bg-muted"
            >
              Cancel
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
};