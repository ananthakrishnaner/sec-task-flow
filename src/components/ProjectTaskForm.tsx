import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { CalendarIcon, Plus, AlertCircle } from "lucide-react";
import { format } from "date-fns";
import { ProjectTask, TaskStatus } from "@/types";
import { cn } from "@/lib/utils";
import { findSimilarSquad, getExistingSquadNames } from "@/lib/squadSuggestions";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface ProjectTaskFormProps {
  onSubmit: (task: Omit<ProjectTask, 'id' | 'priority' | 'dailyLogs' | 'createdAt' | 'updatedAt'>) => void;
  isVisible: boolean;
  onCancel: () => void;
  existingTasks: ProjectTask[];
}

const statusOptions: TaskStatus[] = ["To Do", "In Progress", "Blocked", "Testing", "Complete"];

export const ProjectTaskForm = ({ onSubmit, isVisible, onCancel, existingTasks }: ProjectTaskFormProps) => {
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
  const [suggestedSquad, setSuggestedSquad] = useState<string | null>(null);

  // Check for similar squad names when typing
  useEffect(() => {
    if (formData.squadName && formData.squadName.length >= 2) {
      const existingSquads = getExistingSquadNames(existingTasks);
      const similar = findSimilarSquad(formData.squadName, existingSquads);
      setSuggestedSquad(similar);
    } else {
      setSuggestedSquad(null);
    }
  }, [formData.squadName, existingTasks]);

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
    setSuggestedSquad(null);
  };

  const acceptSuggestion = () => {
    if (suggestedSquad) {
      setFormData({ ...formData, squadName: suggestedSquad });
      setSuggestedSquad(null);
    }
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
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
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

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
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

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
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

          <div className="flex flex-col sm:flex-row gap-4 pt-4">
            <Button 
              type="submit" 
              className="bg-primary hover:bg-primary-glow text-primary-foreground flex-1 sm:flex-none"
            >
              Add Project Task
            </Button>
            <Button 
              type="button" 
              variant="outline" 
              onClick={onCancel}
              className="border-border text-foreground hover:bg-muted flex-1 sm:flex-none"
            >
              Cancel
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
};