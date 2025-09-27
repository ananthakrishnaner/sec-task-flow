import { Badge } from "@/components/ui/badge";
import { TaskStatus } from "@/types";

interface TaskStatusBadgeProps {
  status: TaskStatus;
  className?: string;
}

export const TaskStatusBadge = ({ status, className }: TaskStatusBadgeProps) => {
  const getStatusConfig = (status: TaskStatus) => {
    switch (status) {
      case "To Do":
        return { variant: "secondary" as const, className: "bg-muted text-muted-foreground" };
      case "In Progress":
        return { variant: "default" as const, className: "bg-primary text-primary-foreground" };
      case "Blocked":
        return { variant: "destructive" as const, className: "bg-destructive text-destructive-foreground" };
      case "Testing":
        return { variant: "default" as const, className: "bg-warning text-warning-foreground" };
      case "Complete":
        return { variant: "default" as const, className: "bg-success text-success-foreground" };
      default:
        return { variant: "secondary" as const, className: "bg-muted text-muted-foreground" };
    }
  };

  const config = getStatusConfig(status);

  return (
    <Badge 
      variant={config.variant} 
      className={`${config.className} ${className}`}
    >
      {status}
    </Badge>
  );
};