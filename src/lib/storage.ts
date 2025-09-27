import { ProjectTask, AdHocTask } from '@/types';

const PROJECT_TASKS_KEY = 'cet_project_tasks';
const ADHOC_TASKS_KEY = 'cet_adhoc_tasks';

export const storageService = {
  // Project Tasks
  getProjectTasks(): ProjectTask[] {
    try {
      const tasks = localStorage.getItem(PROJECT_TASKS_KEY);
      return tasks ? JSON.parse(tasks) : [];
    } catch (error) {
      console.error('Error loading project tasks:', error);
      return [];
    }
  },

  saveProjectTasks(tasks: ProjectTask[]): void {
    try {
      localStorage.setItem(PROJECT_TASKS_KEY, JSON.stringify(tasks));
    } catch (error) {
      console.error('Error saving project tasks:', error);
    }
  },

  // Ad-Hoc Tasks
  getAdHocTasks(): AdHocTask[] {
    try {
      const tasks = localStorage.getItem(ADHOC_TASKS_KEY);
      return tasks ? JSON.parse(tasks) : [];
    } catch (error) {
      console.error('Error loading ad-hoc tasks:', error);
      return [];
    }
  },

  saveAdHocTasks(tasks: AdHocTask[]): void {
    try {
      localStorage.setItem(ADHOC_TASKS_KEY, JSON.stringify(tasks));
    } catch (error) {
      console.error('Error saving ad-hoc tasks:', error);
    }
  },

  // Clear all data
  clearAllData(): void {
    localStorage.removeItem(PROJECT_TASKS_KEY);
    localStorage.removeItem(ADHOC_TASKS_KEY);
  }
};