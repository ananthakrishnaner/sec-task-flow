import { TaskStatus } from '@/types';
import { v4 as uuid } from 'uuid';
import { analyticsService, AnalyticsSnapshot } from './analyticsService';

export interface ActivityLogEntry {
  id: string;
  timestamp: string;
  action: string;
  taskId: string;
  taskName: string;
  taskType: 'project' | 'adhoc';
  details?: {
    oldValue?: any;
    newValue?: any;
    field?: string;
  };
}

export interface TaskCompletionEvent {
  taskId: string;
  taskName: string;
  taskType: 'project' | 'adhoc';
  completedAt: string;
  daysToComplete: number;
}

class ActivityLogger {
  private readonly STORAGE_KEY = 'tracker_activity_log';
  private readonly COMPLETIONS_KEY = 'tracker_task_completions';
  private readonly MAX_ENTRIES = 1000; // Keep last 1000 entries
  private readonly MAX_COMPLETIONS = 500; // Keep last 500 completions

  // Get all activity logs
  getActivityLog(): ActivityLogEntry[] {
    try {
      const stored = localStorage.getItem(this.STORAGE_KEY);
      if (!stored) return [];
      
      const logs = JSON.parse(stored);
      return Array.isArray(logs) ? logs : [];
    } catch (error) {
      console.error('Error reading activity log:', error);
      return [];
    }
  }

  // Add new activity log entry
  addLogEntry(entry: Omit<ActivityLogEntry, 'id' | 'timestamp'>): void {
    try {
      const logs = this.getActivityLog();
      
      const newEntry: ActivityLogEntry = {
        ...entry,
        id: uuid(),
        timestamp: new Date().toISOString()
      };

      logs.unshift(newEntry); // Add to beginning for chronological order
      
      // Keep only the most recent entries
      if (logs.length > this.MAX_ENTRIES) {
        logs.splice(this.MAX_ENTRIES);
      }

      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(logs));
    } catch (error) {
      console.error('Error adding activity log entry:', error);
    }
  }

  // Log status change
  logStatusChange(taskId: string, taskName: string, taskType: 'project' | 'adhoc', oldStatus: TaskStatus, newStatus: TaskStatus): void {
    this.addLogEntry({
      action: 'Status Changed',
      taskId,
      taskName,
      taskType,
      details: {
        field: 'status',
        oldValue: oldStatus,
        newValue: newStatus
      }
    });

    // Track task completions separately for analytics
    if (newStatus === 'Complete' && oldStatus !== 'Complete') {
      this.trackTaskCompletion(taskId, taskName, taskType);
    }
  }

  // Track task completion for analytics
  private trackTaskCompletion(taskId: string, taskName: string, taskType: 'project' | 'adhoc'): void {
    try {
      const completions = this.getTaskCompletions();
      
      const completion: TaskCompletionEvent = {
        taskId,
        taskName,
        taskType,
        completedAt: new Date().toISOString(),
        daysToComplete: 0 // Will be calculated from task data
      };

      completions.unshift(completion);

      // Keep only recent completions
      if (completions.length > this.MAX_COMPLETIONS) {
        completions.splice(this.MAX_COMPLETIONS);
      }

      localStorage.setItem(this.COMPLETIONS_KEY, JSON.stringify(completions));
    } catch (error) {
      console.error('Error tracking task completion:', error);
    }
  }

  // Get task completions history
  getTaskCompletions(): TaskCompletionEvent[] {
    try {
      const stored = localStorage.getItem(this.COMPLETIONS_KEY);
      if (!stored) return [];
      
      const completions = JSON.parse(stored);
      return Array.isArray(completions) ? completions : [];
    } catch (error) {
      console.error('Error reading task completions:', error);
      return [];
    }
  }

  // Log task creation
  logTaskCreated(taskId: string, taskName: string, taskType: 'project' | 'adhoc'): void {
    this.addLogEntry({
      action: 'Task Created',
      taskId,
      taskName,
      taskType
    });
  }

  // Log task deletion
  logTaskDeleted(taskId: string, taskName: string, taskType: 'project' | 'adhoc'): void {
    this.addLogEntry({
      action: 'Task Deleted',
      taskId,
      taskName,
      taskType
    });
  }

  // Log task updated
  logTaskUpdated(taskId: string, taskName: string, taskType: 'project' | 'adhoc', field?: string): void {
    this.addLogEntry({
      action: 'Task Updated',
      taskId,
      taskName,
      taskType,
      details: field ? { field } : undefined
    });
  }

  // Log daily log added
  logDailyLogAdded(taskId: string, taskName: string, status: TaskStatus): void {
    this.addLogEntry({
      action: 'Daily Log Added',
      taskId,
      taskName,
      taskType: 'project',
      details: {
        field: 'dailyLog',
        newValue: status
      }
    });
  }

  // Log security sign-off change
  logSecuritySignOffChanged(taskId: string, taskName: string, signedOff: boolean): void {
    this.addLogEntry({
      action: 'Security Sign-off Changed',
      taskId,
      taskName,
      taskType: 'project',
      details: {
        field: 'securitySignOff',
        newValue: signedOff ? 'Signed Off' : 'Not Signed Off'
      }
    });
  }

  // Clear all activity logs
  clearActivityLog(): void {
    try {
      localStorage.removeItem(this.STORAGE_KEY);
      localStorage.removeItem(this.COMPLETIONS_KEY);
    } catch (error) {
      console.error('Error clearing activity log:', error);
    }
  }

  // Export activity logs
  exportActivityLog(): string {
    const logs = this.getActivityLog();
    return JSON.stringify(logs, null, 2);
  }
}

export const activityLogger = new ActivityLogger();
