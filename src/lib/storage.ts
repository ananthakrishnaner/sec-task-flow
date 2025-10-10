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
        try {
          const data = JSON.parse(backup);
          // Validate structure thoroughly
          if (data && 
              Array.isArray(data.projectTasks) && 
              Array.isArray(data.adHocTasks) && 
              data.metadata && 
              typeof data.metadata === 'object') {
            console.log('Loading data from localStorage backup');
            return data;
          } else {
            console.warn('Invalid backup structure, falling back to JSON file');
            localStorage.removeItem('cet_data_backup'); // Clear invalid backup
          }
        } catch (parseError) {
          console.warn('Failed to parse localStorage backup:', parseError);
          localStorage.removeItem('cet_data_backup'); // Clear corrupted backup
        }
      }
      
      // Fall back to static JSON file
      console.log('Loading data from static JSON file');
      const response = await fetch(JSON_FILE_PATH);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      
      // Validate JSON file structure
      if (!data || !Array.isArray(data.projectTasks) || !Array.isArray(data.adHocTasks)) {
        throw new Error('Invalid JSON file structure');
      }
      
      return data;
    } catch (error) {
      console.error('Error loading data:', error);
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

  // Save all data to localStorage
  async saveData(data: TaskData): Promise<void> {
    try {
      // Validate data structure before saving
      if (!data || !Array.isArray(data.projectTasks) || !Array.isArray(data.adHocTasks)) {
        throw new Error('Invalid data structure for saving');
      }
      
      const updatedData = {
        ...data,
        metadata: {
          ...data.metadata,
          lastUpdated: new Date().toISOString(),
          version: data.metadata?.version || "1.0.0"
        }
      };
      
      // Store in localStorage as backup
      localStorage.setItem('cet_data_backup', JSON.stringify(updatedData));
      
      console.log('Data saved successfully to localStorage');
    } catch (error) {
      console.error('Error saving data:', error);
      throw new Error(`Failed to save data: ${error instanceof Error ? error.message : 'Unknown error'}`);
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
    try {
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
      console.log('All data cleared successfully');
    } catch (error) {
      console.error('Error clearing data:', error);
      // Force clear localStorage if save fails
      localStorage.removeItem('cet_data_backup');
      throw error;
    }
  },

  // Check if backup data exists and is valid
  hasValidBackup(): boolean {
    try {
      const backup = localStorage.getItem('cet_data_backup');
      if (!backup) return false;
      
      const data = JSON.parse(backup);
      return data && 
             Array.isArray(data.projectTasks) && 
             Array.isArray(data.adHocTasks) && 
             data.metadata && 
             typeof data.metadata === 'object';
    } catch {
      return false;
    }
  },

  // Repair corrupted backup data
  async repairBackup(): Promise<boolean> {
    try {
      const backup = localStorage.getItem('cet_data_backup');
      if (!backup) return false;
      
      const data = JSON.parse(backup);
      let repaired = false;
      
      // Fix missing arrays
      if (!Array.isArray(data.projectTasks)) {
        data.projectTasks = [];
        repaired = true;
      }
      
      if (!Array.isArray(data.adHocTasks)) {
        data.adHocTasks = [];
        repaired = true;
      }
      
      // Fix missing metadata
      if (!data.metadata || typeof data.metadata !== 'object') {
        data.metadata = {
          lastUpdated: new Date().toISOString(),
          version: "1.0.0"
        };
        repaired = true;
      }
      
      if (repaired) {
        await this.saveData(data);
        console.log('Backup data repaired successfully');
      }
      
      return repaired;
    } catch (error) {
      console.error('Error repairing backup:', error);
      localStorage.removeItem('cet_data_backup');
      return false;
    }
  },

  // Download JSON backup
  async downloadJsonBackup(): Promise<void> {
    try {
      const backup = localStorage.getItem('cet_data_backup');
      let dataToExport: TaskData;
      
      if (!backup) {
        // If no backup in localStorage, try to get current data
        console.log('No backup found, loading current data');
        dataToExport = await this.loadData();
        
        if (!dataToExport || (!dataToExport.projectTasks.length && !dataToExport.adHocTasks.length)) {
          throw new Error('No data available to export');
        }
      } else {
        // Validate backup before download
        try {
          dataToExport = JSON.parse(backup);
          if (!dataToExport || !Array.isArray(dataToExport.projectTasks) || !Array.isArray(dataToExport.adHocTasks)) {
            throw new Error('Invalid backup data structure');
          }
        } catch (parseError) {
          console.error('Corrupted backup data, loading fresh data', parseError);
          dataToExport = await this.loadData();
        }
      }
      
      // Ensure metadata exists
      if (!dataToExport.metadata) {
        dataToExport.metadata = {
          lastUpdated: new Date().toISOString(),
          version: "1.0.0"
        };
      }
      
      // Format JSON for better readability
      const formattedJson = JSON.stringify(dataToExport, null, 2);
      this.downloadJsonData(formattedJson);
      console.log('JSON backup downloaded successfully');
    } catch (error) {
      console.error('Error downloading JSON backup:', error);
      throw error;
    }
  },

  // Helper method to download JSON data
  downloadJsonData(jsonString: string): void {
    const blob = new Blob([jsonString], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `cet-backup-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  },

  // Import data from JSON file with intelligent merging
  async importData(jsonData: string): Promise<void> {
    try {
      const importedData = JSON.parse(jsonData);
      
      // Validate imported data structure
      if (!importedData || typeof importedData !== 'object') {
        throw new Error('Invalid JSON format');
      }
      
      if (!Array.isArray(importedData.projectTasks)) {
        throw new Error('Missing or invalid projectTasks array');
      }
      
      if (!Array.isArray(importedData.adHocTasks)) {
        throw new Error('Missing or invalid adHocTasks array');
      }
      
      if (!importedData.metadata || typeof importedData.metadata !== 'object') {
        importedData.metadata = {
          lastUpdated: new Date().toISOString(),
          version: "1.0.0"
        };
      }
      
      // Validate task structures
      this.validateTaskStructures(importedData);
      
      // Load existing data to merge with imported data
      const existingData = await this.loadData();
      
      // Merge project tasks - keep newest version of each task by ID
      const mergedProjectTasks = this.mergeTasks(existingData.projectTasks, importedData.projectTasks);
      
      // Merge ad-hoc tasks - keep newest version of each task by ID
      const mergedAdHocTasks = this.mergeTasks(existingData.adHocTasks, importedData.adHocTasks);
      
      const mergedData: TaskData = {
        projectTasks: mergedProjectTasks,
        adHocTasks: mergedAdHocTasks,
        metadata: {
          lastUpdated: new Date().toISOString(),
          version: importedData.metadata.version || "1.0.0"
        }
      };
      
      // Save the merged data
      await this.saveData(mergedData);
      
      console.log(`Data imported and merged successfully. Project tasks: ${mergedProjectTasks.length}, Ad-hoc tasks: ${mergedAdHocTasks.length}`);
    } catch (error) {
      console.error('Error importing data:', error);
      throw new Error(`Import failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  },

  // Merge tasks intelligently - keep the newest version of each task
  mergeTasks<T extends ProjectTask | AdHocTask>(existingTasks: T[], importedTasks: T[]): T[] {
    const taskMap = new Map<string, T>();
    
    // Add all existing tasks to map
    existingTasks.forEach(task => {
      taskMap.set(task.id, task);
    });
    
    // Merge or add imported tasks, keeping the newest version
    importedTasks.forEach(importedTask => {
      const existingTask = taskMap.get(importedTask.id);
      
      if (!existingTask) {
        // New task, add it
        taskMap.set(importedTask.id, importedTask);
      } else {
        // Task exists, keep the one with the latest updatedAt timestamp
        const existingDate = new Date(existingTask.updatedAt).getTime();
        const importedDate = new Date(importedTask.updatedAt).getTime();
        
        if (importedDate > existingDate) {
          // Imported task is newer, use it
          taskMap.set(importedTask.id, importedTask);
          console.log(`Updated task ${importedTask.id} with newer imported version`);
        } else {
          console.log(`Kept existing task ${importedTask.id} as it's newer`);
        }
      }
    });
    
    return Array.from(taskMap.values());
  },

  // Validate task structures
  validateTaskStructures(data: TaskData): void {
    // Validate project tasks
    data.projectTasks.forEach((task, index) => {
      if (!task.id || !task.taskName || !task.status) {
        throw new Error(`Project task at index ${index} is missing required fields`);
      }
    });
    
    // Validate ad-hoc tasks
    data.adHocTasks.forEach((task, index) => {
      if (!task.id || !task.taskName || !task.status) {
        throw new Error(`Ad-hoc task at index ${index} is missing required fields`);
      }
    });
  }
};