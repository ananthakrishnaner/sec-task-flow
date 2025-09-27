import * as XLSX from 'xlsx';
import { ProjectTask, AdHocTask, TaskMetrics } from '@/types';
import { format } from 'date-fns';

export interface ExportOptions {
  includeProjectTasks: boolean;
  includeAdHocTasks: boolean;
  includeDailyLogs: boolean;
  includeMetrics: boolean;
  dateRange?: {
    start: string;
    end: string;
  };
}

export const exportService = {
  // Export to Excel
  exportToExcel(
    projectTasks: ProjectTask[], 
    adHocTasks: AdHocTask[], 
    metrics: TaskMetrics, 
    options: ExportOptions = {
      includeProjectTasks: true,
      includeAdHocTasks: true,
      includeDailyLogs: true,
      includeMetrics: true
    }
  ): void {
    try {
      const workbook = XLSX.utils.book_new();

      // Project Tasks Sheet
      if (options.includeProjectTasks && projectTasks.length > 0) {
        const projectTasksData = projectTasks.map((task, index) => ({
          'Priority': task.priority,
          'Task Name': task.taskName,
          'Description': task.description,
          'Squad Name': task.squadName,
          'SPOC': task.spoc,
          'Start Date': format(new Date(task.startDate), 'yyyy-MM-dd'),
          'Deployment Date': format(new Date(task.deploymentDate), 'yyyy-MM-dd'),
          'Status': task.status,
          'Security Sign-off': task.securitySignOff ? 'Yes' : 'No',
          'Daily Logs Count': task.dailyLogs.length,
          'Created': format(new Date(task.createdAt), 'yyyy-MM-dd HH:mm'),
          'Last Updated': format(new Date(task.updatedAt), 'yyyy-MM-dd HH:mm')
        }));

        const projectTasksSheet = XLSX.utils.json_to_sheet(projectTasksData);
        
        // Auto-size columns
        const projectTasksColWidths = Object.keys(projectTasksData[0] || {}).map(key => ({
          wch: Math.max(key.length, 15)
        }));
        projectTasksSheet['!cols'] = projectTasksColWidths;
        
        XLSX.utils.book_append_sheet(workbook, projectTasksSheet, 'Project Tasks');
      }

      // Ad-Hoc Tasks Sheet
      if (options.includeAdHocTasks && adHocTasks.length > 0) {
        const adHocTasksData = adHocTasks.map(task => ({
          'Task Name': task.taskName,
          'Description': task.description,
          'Due Date': format(new Date(task.dueDate), 'yyyy-MM-dd'),
          'Status': task.status,
          'Created': format(new Date(task.createdAt), 'yyyy-MM-dd HH:mm'),
          'Last Updated': format(new Date(task.updatedAt), 'yyyy-MM-dd HH:mm')
        }));

        const adHocTasksSheet = XLSX.utils.json_to_sheet(adHocTasksData);
        
        // Auto-size columns
        const adHocColWidths = Object.keys(adHocTasksData[0] || {}).map(key => ({
          wch: Math.max(key.length, 15)
        }));
        adHocTasksSheet['!cols'] = adHocColWidths;
        
        XLSX.utils.book_append_sheet(workbook, adHocTasksSheet, 'Ad-Hoc Tasks');
      }

      // Daily Logs Sheet
      if (options.includeDailyLogs && projectTasks.length > 0) {
        const dailyLogsData: any[] = [];
        
        projectTasks.forEach(task => {
          task.dailyLogs.forEach(log => {
            dailyLogsData.push({
              'Task Name': task.taskName,
              'Squad': task.squadName,
              'Date': format(new Date(log.date), 'yyyy-MM-dd'),
              'Time': format(new Date(log.date), 'HH:mm'),
              'Status': log.status,
              'Notes': log.notes,
              'SPOC': task.spoc
            });
          });
        });

        if (dailyLogsData.length > 0) {
          const dailyLogsSheet = XLSX.utils.json_to_sheet(dailyLogsData);
          
          // Auto-size columns
          const logsColWidths = Object.keys(dailyLogsData[0] || {}).map(key => ({
            wch: key === 'Notes' ? 50 : Math.max(key.length, 15)
          }));
          dailyLogsSheet['!cols'] = logsColWidths;
          
          XLSX.utils.book_append_sheet(workbook, dailyLogsSheet, 'Daily Logs');
        }
      }

      // Metrics Summary Sheet
      if (options.includeMetrics) {
        const metricsData = [
          { 'Metric': 'Total Tasks', 'Value': metrics.totalTasks },
          { 'Metric': 'Completed Tasks', 'Value': metrics.completedTasks },
          { 'Metric': 'In Progress Tasks', 'Value': metrics.inProgressTasks },
          { 'Metric': 'Blocked Tasks', 'Value': metrics.blockedTasks },
          { 'Metric': 'Project Tasks', 'Value': metrics.projectTasksCount },
          { 'Metric': 'Ad-Hoc Tasks', 'Value': metrics.adHocTasksCount },
          { 'Metric': 'Completion Rate', 'Value': `${metrics.completionRate.toFixed(1)}%` },
          { 'Metric': '', 'Value': '' }, // Empty row for separation
          { 'Metric': 'Status Breakdown', 'Value': '' },
          ...Object.entries(metrics.statusDistribution).map(([status, count]) => ({
            'Metric': `${status} Tasks`,
            'Value': count
          }))
        ];

        const metricsSheet = XLSX.utils.json_to_sheet(metricsData);
        
        // Auto-size columns
        metricsSheet['!cols'] = [
          { wch: 25 }, // Metric column
          { wch: 15 }  // Value column
        ];
        
        XLSX.utils.book_append_sheet(workbook, metricsSheet, 'Summary Metrics');
      }

      // Generate filename with timestamp
      const timestamp = format(new Date(), 'yyyy-MM-dd_HH-mm');
      const filename = `CET_Report_${timestamp}.xlsx`;

      // Write and download the file
      XLSX.writeFile(workbook, filename);
      
    } catch (error) {
      console.error('Error exporting to Excel:', error);
      throw new Error('Failed to export data to Excel. Please try again.');
    }
  },

  // Export to CSV (alternative format)
  exportToCSV(projectTasks: ProjectTask[], adHocTasks: AdHocTask[]): void {
    try {
      const allTasks = [
        ...projectTasks.map(task => ({
          Type: 'Project',
          Name: task.taskName,
          Description: task.description,
          Squad: task.squadName,
          SPOC: task.spoc,
          'Start Date': format(new Date(task.startDate), 'yyyy-MM-dd'),
          'Due Date': format(new Date(task.deploymentDate), 'yyyy-MM-dd'),
          Status: task.status,
          'Security Sign-off': task.securitySignOff ? 'Yes' : 'No',
          Priority: task.priority,
          'Daily Logs': task.dailyLogs.length
        })),
        ...adHocTasks.map(task => ({
          Type: 'Ad-Hoc',
          Name: task.taskName,
          Description: task.description,
          Squad: '',
          SPOC: '',
          'Start Date': '',
          'Due Date': format(new Date(task.dueDate), 'yyyy-MM-dd'),
          Status: task.status,
          'Security Sign-off': '',
          Priority: '',
          'Daily Logs': ''
        }))
      ];

      const csvContent = this.convertToCSV(allTasks);
      const timestamp = format(new Date(), 'yyyy-MM-dd_HH-mm');
      this.downloadCSV(csvContent, `CET_Tasks_${timestamp}.csv`);
      
    } catch (error) {
      console.error('Error exporting to CSV:', error);
      throw new Error('Failed to export data to CSV. Please try again.');
    }
  },

  // Helper function to convert array to CSV
  convertToCSV(data: any[]): string {
    if (data.length === 0) return '';
    
    const headers = Object.keys(data[0]);
    const csvRows = [
      headers.join(','),
      ...data.map(row => 
        headers.map(header => {
          const value = row[header];
          // Escape commas and quotes in CSV
          if (typeof value === 'string' && (value.includes(',') || value.includes('"'))) {
            return `"${value.replace(/"/g, '""')}"`;
          }
          return value;
        }).join(',')
      )
    ];
    
    return csvRows.join('\n');
  },

  // Helper function to download CSV
  downloadCSV(csvContent: string, filename: string): void {
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    
    link.setAttribute('href', url);
    link.setAttribute('download', filename);
    link.style.visibility = 'hidden';
    
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }
};