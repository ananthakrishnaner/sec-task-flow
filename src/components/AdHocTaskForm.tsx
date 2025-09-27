import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { CalendarIcon, Zap } from "lucide-react";
import { format } from "date-fns";
import { AdHocTask } from "@/types";
import { cn } from "@/lib/utils";

interface AdHocTaskFormProps {
  onSubmit: (task: Omit<AdHocTask, 'id' | 'status' | 'createdAt' | 'updatedAt'>) => void;
  isVisible: boolean;
  onCancel: () => void;
}

export const AdHocTaskForm = ({ onSubmit, isVisible, onCancel }: AdHocTaskFormProps) => {
  const [formData, setFormData] = useState({
    taskName: "",
    description: "",
    dueDate: undefined as Date | undefined,
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.dueDate) return;
    
    onSubmit({
      ...formData,
      dueDate: formData.dueDate.toISOString(),
    });

    // Reset form
    setFormData({
      taskName: "",
      description: "",
      dueDate: undefined,
    });
  };

  if (!isVisible) return null;

  return (
    <Card className="bg-card shadow-elevated border-border mb-6">
      <CardHeader className="bg-gradient-accent/10">
        <CardTitle className="text-foreground flex items-center gap-2">
          <Zap className="h-5 w-5 text-accent" />
          Add New Ad-Hoc Task
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-6">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="adhocTaskName" className="text-foreground">Task Name *</Label>
            <Input
              id="adhocTaskName"
              value={formData.taskName}
              onChange={(e) => setFormData({ ...formData, taskName: e.target.value })}
              placeholder="Quick task description"
              required
              className="bg-input border-border text-foreground"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="adhocDescription" className="text-foreground">Description *</Label>
            <Textarea
              id="adhocDescription"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Task details and requirements..."
              required
              className="bg-input border-border text-foreground min-h-[80px]"
            />
          </div>

          <div className="space-y-2">
            <Label className="text-foreground">Due Date *</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "w-full justify-start text-left font-normal bg-input border-border",
                    !formData.dueDate && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {formData.dueDate ? format(formData.dueDate, "PPP") : "Pick due date"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0 bg-popover border-border" align="start">
                <Calendar
                  mode="single"
                  selected={formData.dueDate}
                  onSelect={(date) => setFormData({ ...formData, dueDate: date })}
                  initialFocus
                  className="pointer-events-auto"
                />
              </PopoverContent>
            </Popover>
          </div>

          <div className="flex gap-4 pt-4">
            <Button 
              type="submit" 
              className="bg-accent hover:bg-accent-muted text-accent-foreground"
            >
              Add Ad-Hoc Task
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