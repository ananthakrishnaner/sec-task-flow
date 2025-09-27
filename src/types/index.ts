export interface ProjectTask {
  id: string;
  taskName: string;
  description: string;
  squadName: string;
  spoc: string;
  startDate: string;
  deploymentDate: string;
  status: TaskStatus;
  securitySignOff: boolean;
  priority: number;
  dailyLogs: DailyLog[];
  createdAt: string;
  updatedAt: string;
}

export interface AdHocTask {
  id: string;
  taskName: string;
  description: string;
  dueDate: string;
  status: TaskStatus;
  createdAt: string;
  updatedAt: string;
}

export interface DailyLog {
  id: string;
  date: string;
  status: TaskStatus;
  notes: string;
  createdAt: string;
}

export type TaskStatus = "To Do" | "In Progress" | "Blocked" | "Testing" | "Complete";

export interface TaskMetrics {
  totalTasks: number;
  completedTasks: number;
  inProgressTasks: number;
  blockedTasks: number;
  projectTasksCount: number;
  adHocTasksCount: number;
  completionRate: number;
  weeklyCompletions: number[];
  statusDistribution: Record<TaskStatus, number>;
}