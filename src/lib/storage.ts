import { ProjectTask, AdHocTask } from '@/types';

interface TaskData {
  projectTasks: ProjectTask[];
  adHocTasks: AdHocTask[];
  metadata: {
    lastUpdated: string;
    version: string;
  };
}

const JSON_FILE_PATH = '/data/tasks.json';

export const storageService = {
  // Load all data from JSON file
  async loadData(): Promise<TaskData> {
    try {
      // First try to load from localStorage backup (imported data takes priority)
      const backup = localStorage.getItem('cet_data_backup');
      if (backup) {
        const data = JSON.parse(backup);
        // Validate structure
        if (data.projectTasks && data.adHocTasks && data.metadata) {
          return data;
        }
      }
      
      // Fall back to static JSON file
      const response = await fetch(JSON_FILE_PATH);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Error loading data from JSON file:', error);
      // Return empty structure if file doesn't exist or has errors
      return {
        projectTasks: [],
        adHocTasks: [],
        metadata: {
          lastUpdated: new Date().toISOString(),
          version: "1.0.0"
        }
      };
    }
  },

  // Save all data to JSON file (simulation - in real app would need backend)
  async saveData(data: TaskData): Promise<void> {
    try {
      // Note: In a real browser environment, we can't write to files directly
      // This would typically require a backend API endpoint
      // For now, we'll fall back to localStorage and also prepare the data for download
      const updatedData = {
        ...data,
        metadata: {
          ...data.metadata,
          lastUpdated: new Date().toISOString()
        }
      };
      
      // Store in localStorage as backup
      localStorage.setItem('cet_data_backup', JSON.stringify(updatedData));
      
      // In a real implementation, this would be:
      // await fetch('/api/save-tasks', { method: 'POST', body: JSON.stringify(updatedData) });
      
      console.log('Data saved successfully');
    } catch (error) {
      console.error('Error saving data:', error);
      throw error;
    }
  },

  // Project Tasks
  async getProjectTasks(): Promise<ProjectTask[]> {
    try {
      const data = await this.loadData();
      return data.projectTasks;
    } catch (error) {
      console.error('Error loading project tasks:', error);
      return [];
    }
  },

  async saveProjectTasks(tasks: ProjectTask[]): Promise<void> {
    try {
      const currentData = await this.loadData();
      const updatedData = {
        ...currentData,
        projectTasks: tasks
      };
      await this.saveData(updatedData);
    } catch (error) {
      console.error('Error saving project tasks:', error);
      throw error;
    }
  },

  // Ad-Hoc Tasks
  async getAdHocTasks(): Promise<AdHocTask[]> {
    try {
      const data = await this.loadData();
      return data.adHocTasks;
    } catch (error) {
      console.error('Error loading ad-hoc tasks:', error);
      return [];
    }
  },

  async saveAdHocTasks(tasks: AdHocTask[]): Promise<void> {
    try {
      const currentData = await this.loadData();
      const updatedData = {
        ...currentData,
        adHocTasks: tasks
      };
      await this.saveData(updatedData);
    } catch (error) {
      console.error('Error saving ad-hoc tasks:', error);
      throw error;
    }
  },

  // Get all data for export
  async getAllData(): Promise<TaskData> {
    return await this.loadData();
  },

  // Clear all data
  async clearAllData(): Promise<void> {
    const emptyData: TaskData = {
      projectTasks: [],
      adHocTasks: [],
      metadata: {
        lastUpdated: new Date().toISOString(),
        version: "1.0.0"
      }
    };
    await this.saveData(emptyData);
    localStorage.removeItem('cet_data_backup');
  },

  // Download JSON backup
  downloadJsonBackup(): void {
    try {
      const backup = localStorage.getItem('cet_data_backup');
      if (!backup) {
        throw new Error('No backup data available');
      }
      
      const blob = new Blob([backup], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `cet-backup-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error downloading JSON backup:', error);
      throw error;
    }
  }
};