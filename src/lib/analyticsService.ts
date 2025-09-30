import { ProjectTask, AdHocTask, TaskStatus } from '@/types';
import { differenceInDays, startOfDay, format, subDays, isWithinInterval } from 'date-fns';

export interface AnalyticsSnapshot {
  timestamp: string;
  totalTasks: number;
  completedTasks: number;
  inProgressTasks: number;
  blockedTasks: number;
  completionRate: number;
  avgCompletionTime: number;
  velocity: number;
}

export interface TrendData {
  date: string;
  completions: number;
  newTasks: number;
  inProgress: number;
  blocked: number;
}

export interface SquadPerformance {
  squadName: string;
  totalTasks: number;
  completedTasks: number;
  avgCompletionTime: number;
  completionRate: number;
  blockedTasks: number;
}

export interface TaskVelocityMetrics {
  currentWeekVelocity: number;
  lastWeekVelocity: number;
  averageVelocity: number;
  trend: 'increasing' | 'decreasing' | 'stable';
  projectedCompletionsNextWeek: number;
}

export interface TimeInStatusMetrics {
  status: TaskStatus;
  averageTime: number;
  totalTasks: number;
}

export interface PredictiveInsights {
  estimatedCompletionDate: string | null;
  riskScore: number; // 0-100, higher is more risk
  recommendations: string[];
  bottlenecks: string[];
}

class AnalyticsService {
  private readonly STORAGE_KEY = 'tracker_analytics_snapshots';
  private readonly MAX_SNAPSHOTS = 90; // Keep 90 days of snapshots

  // Save analytics snapshot
  saveSnapshot(snapshot: AnalyticsSnapshot): void {
    try {
      const snapshots = this.getSnapshots();
      snapshots.push(snapshot);

      // Keep only recent snapshots
      if (snapshots.length > this.MAX_SNAPSHOTS) {
        snapshots.splice(0, snapshots.length - this.MAX_SNAPSHOTS);
      }

      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(snapshots));
    } catch (error) {
      console.error('Error saving analytics snapshot:', error);
    }
  }

  // Get all snapshots
  getSnapshots(): AnalyticsSnapshot[] {
    try {
      const stored = localStorage.getItem(this.STORAGE_KEY);
      if (!stored) return [];
      return JSON.parse(stored);
    } catch (error) {
      console.error('Error reading analytics snapshots:', error);
      return [];
    }
  }

  // Calculate trend data for the last N days
  calculateTrendData(projectTasks: ProjectTask[], adHocTasks: AdHocTask[], days: number = 30): TrendData[] {
    const allTasks = [...projectTasks, ...adHocTasks];
    const today = startOfDay(new Date());
    const trendData: TrendData[] = [];

    for (let i = days - 1; i >= 0; i--) {
      const date = subDays(today, i);
      const dateStr = format(date, 'MMM dd');
      const nextDay = subDays(today, i - 1);

      // Tasks completed on this day
      const completions = allTasks.filter(task => {
        if (task.status !== 'Complete') return false;
        const completedDate = startOfDay(new Date(task.updatedAt));
        return completedDate.getTime() === date.getTime();
      }).length;

      // Tasks created on this day
      const newTasks = allTasks.filter(task => {
        const createdDate = startOfDay(new Date(task.createdAt));
        return createdDate.getTime() === date.getTime();
      }).length;

      // Tasks in progress at end of day
      const inProgress = allTasks.filter(task => {
        const createdDate = new Date(task.createdAt);
        const updatedDate = new Date(task.updatedAt);
        return createdDate <= nextDay && 
               (task.status === 'In Progress' || 
                (task.status !== 'Complete' && updatedDate < nextDay));
      }).length;

      // Tasks blocked at end of day
      const blocked = allTasks.filter(task => {
        const createdDate = new Date(task.createdAt);
        return createdDate <= nextDay && task.status === 'Blocked';
      }).length;

      trendData.push({
        date: dateStr,
        completions,
        newTasks,
        inProgress,
        blocked
      });
    }

    return trendData;
  }

  // Calculate squad performance metrics
  calculateSquadPerformance(projectTasks: ProjectTask[]): SquadPerformance[] {
    const squadMap = new Map<string, ProjectTask[]>();

    projectTasks.forEach(task => {
      if (!squadMap.has(task.squadName)) {
        squadMap.set(task.squadName, []);
      }
      squadMap.get(task.squadName)!.push(task);
    });

    return Array.from(squadMap.entries()).map(([squadName, tasks]) => {
      const completedTasks = tasks.filter(t => t.status === 'Complete');
      const totalTasks = tasks.length;
      const blockedTasks = tasks.filter(t => t.status === 'Blocked').length;

      let avgCompletionTime = 0;
      if (completedTasks.length > 0) {
        const totalTime = completedTasks.reduce((sum, task) => {
          const start = new Date(task.startDate);
          const end = new Date(task.updatedAt);
          return sum + Math.max(0, differenceInDays(end, start));
        }, 0);
        avgCompletionTime = totalTime / completedTasks.length;
      }

      return {
        squadName,
        totalTasks,
        completedTasks: completedTasks.length,
        avgCompletionTime,
        completionRate: totalTasks > 0 ? (completedTasks.length / totalTasks) * 100 : 0,
        blockedTasks
      };
    }).sort((a, b) => b.completionRate - a.completionRate);
  }

  // Calculate task velocity metrics
  calculateVelocity(projectTasks: ProjectTask[], adHocTasks: AdHocTask[]): TaskVelocityMetrics {
    const allTasks = [...projectTasks, ...adHocTasks];
    const today = new Date();
    
    // Current week (last 7 days)
    const currentWeekStart = subDays(today, 7);
    const currentWeekVelocity = allTasks.filter(task => {
      if (task.status !== 'Complete') return false;
      const completedDate = new Date(task.updatedAt);
      return completedDate >= currentWeekStart;
    }).length;

    // Last week (8-14 days ago)
    const lastWeekStart = subDays(today, 14);
    const lastWeekEnd = subDays(today, 7);
    const lastWeekVelocity = allTasks.filter(task => {
      if (task.status !== 'Complete') return false;
      const completedDate = new Date(task.updatedAt);
      return completedDate >= lastWeekStart && completedDate < lastWeekEnd;
    }).length;

    // Average velocity over last 4 weeks
    const fourWeeksAgo = subDays(today, 28);
    const recentCompletions = allTasks.filter(task => {
      if (task.status !== 'Complete') return false;
      const completedDate = new Date(task.updatedAt);
      return completedDate >= fourWeeksAgo;
    }).length;
    const averageVelocity = recentCompletions / 4;

    // Determine trend
    let trend: 'increasing' | 'decreasing' | 'stable' = 'stable';
    const velocityChange = currentWeekVelocity - lastWeekVelocity;
    if (velocityChange > 1) trend = 'increasing';
    else if (velocityChange < -1) trend = 'decreasing';

    // Project next week
    const projectedCompletionsNextWeek = Math.round(
      (currentWeekVelocity * 0.6) + (averageVelocity * 0.4)
    );

    return {
      currentWeekVelocity,
      lastWeekVelocity,
      averageVelocity: Number(averageVelocity.toFixed(1)),
      trend,
      projectedCompletionsNextWeek
    };
  }

  // Calculate time in status metrics
  calculateTimeInStatus(projectTasks: ProjectTask[], adHocTasks: AdHocTask[]): TimeInStatusMetrics[] {
    const allTasks = [...projectTasks, ...adHocTasks];
    const statusMap = new Map<TaskStatus, { totalTime: number; count: number }>();

    allTasks.forEach(task => {
      const createdDate = new Date(task.createdAt);
      const updatedDate = new Date(task.updatedAt);
      const timeInStatus = differenceInDays(updatedDate, createdDate);

      if (!statusMap.has(task.status)) {
        statusMap.set(task.status, { totalTime: 0, count: 0 });
      }

      const current = statusMap.get(task.status)!;
      current.totalTime += Math.max(0, timeInStatus);
      current.count += 1;
    });

    return Array.from(statusMap.entries()).map(([status, data]) => ({
      status,
      averageTime: data.count > 0 ? Number((data.totalTime / data.count).toFixed(1)) : 0,
      totalTasks: data.count
    }));
  }

  // Generate predictive insights
  generatePredictiveInsights(
    projectTasks: ProjectTask[], 
    adHocTasks: AdHocTask[],
    velocity: TaskVelocityMetrics
  ): PredictiveInsights {
    const allTasks = [...projectTasks, ...adHocTasks];
    const incompleteTasks = allTasks.filter(t => t.status !== 'Complete');
    const recommendations: string[] = [];
    const bottlenecks: string[] = [];
    let riskScore = 0;

    // Calculate estimated completion date
    let estimatedCompletionDate: string | null = null;
    if (velocity.averageVelocity > 0 && incompleteTasks.length > 0) {
      const weeksToComplete = Math.ceil(incompleteTasks.length / velocity.averageVelocity);
      const completionDate = new Date();
      completionDate.setDate(completionDate.getDate() + (weeksToComplete * 7));
      estimatedCompletionDate = format(completionDate, 'MMM dd, yyyy');
    }

    // Check for blocked tasks
    const blockedTasks = incompleteTasks.filter(t => t.status === 'Blocked');
    if (blockedTasks.length > 0) {
      riskScore += blockedTasks.length * 10;
      bottlenecks.push(`${blockedTasks.length} blocked task${blockedTasks.length > 1 ? 's' : ''} need immediate attention`);
      recommendations.push('Review and resolve blocked tasks to improve velocity');
    }

    // Check for overdue tasks
    const now = new Date();
    const overdueTasks = incompleteTasks.filter(task => {
      const dueDate = new Date('deploymentDate' in task ? task.deploymentDate : task.dueDate);
      return dueDate < now;
    });
    if (overdueTasks.length > 0) {
      riskScore += overdueTasks.length * 8;
      bottlenecks.push(`${overdueTasks.length} overdue task${overdueTasks.length > 1 ? 's' : ''}`);
      recommendations.push('Prioritize overdue tasks to reduce schedule risk');
    }

    // Check velocity trend
    if (velocity.trend === 'decreasing') {
      riskScore += 15;
      bottlenecks.push('Task completion velocity is declining');
      recommendations.push('Investigate factors affecting team velocity');
    }

    // Check for tasks stuck in progress
    const longInProgress = incompleteTasks.filter(task => {
      if (task.status !== 'In Progress') return false;
      const daysSinceUpdate = differenceInDays(now, new Date(task.updatedAt));
      return daysSinceUpdate > 7;
    });
    if (longInProgress.length > 0) {
      riskScore += longInProgress.length * 5;
      bottlenecks.push(`${longInProgress.length} task${longInProgress.length > 1 ? 's' : ''} stuck in progress > 7 days`);
      recommendations.push('Review long-running in-progress tasks for blockers');
    }

    // Check for pending security sign-offs
    const pendingSignOffs = projectTasks.filter(t => 
      !t.securitySignOff && t.status !== 'Complete'
    );
    if (pendingSignOffs.length > 3) {
      riskScore += 10;
      recommendations.push('Schedule security reviews to avoid deployment delays');
    }

    // Positive recommendations
    if (velocity.trend === 'increasing') {
      recommendations.push('Great job! Team velocity is improving');
    }

    if (blockedTasks.length === 0 && overdueTasks.length === 0) {
      recommendations.push('All tasks are on track - maintain current pace');
    }

    // Cap risk score at 100
    riskScore = Math.min(100, riskScore);

    return {
      estimatedCompletionDate,
      riskScore,
      recommendations,
      bottlenecks
    };
  }

  // Clear all analytics data
  clearAnalyticsData(): void {
    try {
      localStorage.removeItem(this.STORAGE_KEY);
    } catch (error) {
      console.error('Error clearing analytics data:', error);
    }
  }
}

export const analyticsService = new AnalyticsService();
