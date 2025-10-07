import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { ProjectTask, AdHocTask, TaskMetrics } from '@/types';

export interface ExportOptions {
  includeProjectTasks: boolean;
  includeAdHocTasks: boolean;
  includeDailyLogs: boolean;
  includeMetrics: boolean;
  dateRangeInfo?: string;
  filterStartDate?: string;
  filterEndDate?: string;
  filterTimeframe?: 'all' | 'this-week' | 'last-week' | 'this-month' | 'custom';
}

// Helper function to sort tasks by status and date
const sortTasksByStatusAndDate = <T extends ProjectTask | AdHocTask>(tasks: T[]): T[] => {
  const statusPriority: Record<string, number> = {
    'To Do': 1,
    'In Progress': 2,
    'Testing': 3,
    'Blocked': 4,
    'Complete': 5
  };

  return [...tasks].sort((a, b) => {
    // First sort by status priority
    const statusDiff = (statusPriority[a.status] || 999) - (statusPriority[b.status] || 999);
    if (statusDiff !== 0) return statusDiff;

    // Then sort by date (deployment date for project tasks, due date for ad-hoc)
    const dateA = new Date('deploymentDate' in a ? a.deploymentDate : a.dueDate).getTime();
    const dateB = new Date('deploymentDate' in b ? b.deploymentDate : b.dueDate).getTime();
    return dateA - dateB;
  });
};

export const exportService = {
  // Enhanced Excel export with improved design and formatting
  exportToExcel: (
    projectTasks: ProjectTask[], 
    adHocTasks: AdHocTask[], 
    metrics: TaskMetrics, 
    options: ExportOptions
  ): void => {
    const workbook = XLSX.utils.book_new();

    // Sort tasks by status and deployment/due date
    const sortedProjectTasks = sortTasksByStatusAndDate(projectTasks);
    const sortedAdHocTasks = sortTasksByStatusAndDate(adHocTasks);

    // Executive Summary Sheet with enhanced styling
    if (options.includeMetrics) {
      const summaryData = [
        ['TRACKER - Executive Summary'],
        ['Generated on:', new Date().toLocaleString()],
        ...(options.dateRangeInfo ? [['Report Period:', options.dateRangeInfo]] : []),
        [''],
        ['Key Performance Indicators'],
        ['Total Tasks', metrics.totalTasks],
        ['Completed Tasks', metrics.completedTasks],
        ['Completion Rate', `${metrics.completionRate.toFixed(1)}%`],
        ['In Progress Tasks', metrics.inProgressTasks],
        ['Blocked Tasks', metrics.blockedTasks],
        ['Project Tasks', metrics.projectTasksCount],
        ['Ad-Hoc Tasks', metrics.adHocTasksCount],
        [''],
        ['Status Distribution'],
        ...Object.entries(metrics.statusDistribution).map(([status, count]) => [status, count]),
        [''],
        ['Weekly Completion Trend'],
        ['Week 1', metrics.weeklyCompletions[0] || 0],
        ['Week 2', metrics.weeklyCompletions[1] || 0],
        ['Week 3', metrics.weeklyCompletions[2] || 0],
        ['Week 4', metrics.weeklyCompletions[3] || 0],
        ['Week 5', metrics.weeklyCompletions[4] || 0]
      ];

      const summaryWS = XLSX.utils.aoa_to_sheet(summaryData);
      
      // Set column widths
      summaryWS['!cols'] = [
        { wch: 30 }, // Column A
        { wch: 20 }  // Column B
      ];

      // Merge cells for title
      summaryWS['!merges'] = [
        { s: { r: 0, c: 0 }, e: { r: 0, c: 1 } }
      ];

      XLSX.utils.book_append_sheet(workbook, summaryWS, 'Executive Summary');
    }

    // Project Tasks Sheet
    if (options.includeProjectTasks && sortedProjectTasks.length > 0) {
      const projectData = [
        ['Task Name', 'Description', 'Squad', 'SPOC', 'Start Date', 'Due Date', 'Status', 'Security Sign-off', 'Priority', 'Created', 'Updated'],
        ...sortedProjectTasks.map(task => [
          task.taskName,
          task.description,
          task.squadName,
          task.spoc,
          new Date(task.startDate).toLocaleDateString(),
          new Date(task.deploymentDate).toLocaleDateString(),
          task.status,
          task.securitySignOff ? 'Yes' : 'No',
          task.priority,
          new Date(task.createdAt).toLocaleDateString(),
          new Date(task.updatedAt).toLocaleDateString()
        ])
      ];

      const projectWS = XLSX.utils.aoa_to_sheet(projectData);
      
      // Set column widths
      projectWS['!cols'] = [
        { wch: 25 }, // Task Name
        { wch: 40 }, // Description
        { wch: 20 }, // Squad
        { wch: 20 }, // SPOC
        { wch: 15 }, // Start Date
        { wch: 15 }, // Due Date
        { wch: 15 }, // Status
        { wch: 15 }, // Security Sign-off
        { wch: 10 }, // Priority
        { wch: 15 }, // Created
        { wch: 15 }  // Updated
      ];

      XLSX.utils.book_append_sheet(workbook, projectWS, 'Project Tasks');
    }

    // Ad-Hoc Tasks Sheet
    if (options.includeAdHocTasks && sortedAdHocTasks.length > 0) {
      const adHocData = [
        ['Task Name', 'Description', 'Due Date', 'Status', 'Created', 'Updated'],
        ...sortedAdHocTasks.map(task => [
          task.taskName,
          task.description,
          new Date(task.dueDate).toLocaleDateString(),
          task.status,
          new Date(task.createdAt).toLocaleDateString(),
          new Date(task.updatedAt).toLocaleDateString()
        ])
      ];

      const adHocWS = XLSX.utils.aoa_to_sheet(adHocData);
      
      // Set column widths
      adHocWS['!cols'] = [
        { wch: 25 }, // Task Name
        { wch: 40 }, // Description
        { wch: 15 }, // Due Date
        { wch: 15 }, // Status
        { wch: 15 }, // Created
        { wch: 15 }  // Updated
      ];

      XLSX.utils.book_append_sheet(workbook, adHocWS, 'Ad-Hoc Tasks');
    }

    // Daily Logs Sheet
    if (options.includeDailyLogs) {
      const logsData = [['Task Name', 'Date', 'Status', 'Notes', 'Created']];
      
      // Calculate date range based on filter
      const now = new Date();
      let startDate: Date | null = null;
      let endDate: Date | null = null;

      if (options.filterTimeframe) {
        switch (options.filterTimeframe) {
          case 'this-week':
            const weekStart = new Date(now);
            weekStart.setDate(now.getDate() - now.getDay());
            weekStart.setHours(0, 0, 0, 0);
            const weekEnd = new Date(weekStart);
            weekEnd.setDate(weekStart.getDate() + 6);
            weekEnd.setHours(23, 59, 59, 999);
            startDate = weekStart;
            endDate = weekEnd;
            break;
          case 'last-week':
            const lastWeekStart = new Date(now);
            lastWeekStart.setDate(now.getDate() - now.getDay() - 7);
            lastWeekStart.setHours(0, 0, 0, 0);
            const lastWeekEnd = new Date(lastWeekStart);
            lastWeekEnd.setDate(lastWeekStart.getDate() + 6);
            lastWeekEnd.setHours(23, 59, 59, 999);
            startDate = lastWeekStart;
            endDate = lastWeekEnd;
            break;
          case 'this-month':
            startDate = new Date(now.getFullYear(), now.getMonth(), 1);
            endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0);
            endDate.setHours(23, 59, 59, 999);
            break;
          case 'custom':
            if (options.filterStartDate && options.filterEndDate) {
              startDate = new Date(options.filterStartDate);
              endDate = new Date(options.filterEndDate);
              endDate.setHours(23, 59, 59, 999);
            }
            break;
        }
      }
      
      // Collect all logs with task info
      const allLogsWithTask: Array<{
        taskName: string;
        taskStartDate: Date;
        logDate: Date;
        status: string;
        notes: string;
        createdAt: Date;
      }> = [];
      
      sortedProjectTasks.forEach(task => {
        const taskStartDate = new Date(task.startDate);
        
        // Filter tasks based on start date being within range
        const taskInRange = !startDate || !endDate || 
          (taskStartDate >= startDate && taskStartDate <= endDate);
        
        if (taskInRange) {
          task.dailyLogs.forEach(log => {
            allLogsWithTask.push({
              taskName: task.taskName,
              taskStartDate,
              logDate: new Date(log.date),
              status: log.status,
              notes: log.notes,
              createdAt: new Date(log.createdAt)
            });
          });
        }
      });
      
      // Sort logs by status priority, then by date
      const statusPriority: Record<string, number> = {
        'To Do': 1,
        'In Progress': 2,
        'Testing': 3,
        'Blocked': 4,
        'Complete': 5
      };
      
      allLogsWithTask.sort((a, b) => {
        const statusDiff = (statusPriority[a.status] || 999) - (statusPriority[b.status] || 999);
        if (statusDiff !== 0) return statusDiff;
        return a.logDate.getTime() - b.logDate.getTime();
      });
      
      // Add sorted logs to data
      allLogsWithTask.forEach(log => {
        logsData.push([
          log.taskName,
          log.logDate.toLocaleDateString(),
          log.status,
          log.notes,
          log.createdAt.toLocaleDateString()
        ]);
      });

      if (logsData.length > 1) {
        const logsWS = XLSX.utils.aoa_to_sheet(logsData);
        
        // Set column widths
        logsWS['!cols'] = [
          { wch: 25 }, // Task Name
          { wch: 15 }, // Date
          { wch: 15 }, // Status
          { wch: 50 }, // Notes
          { wch: 15 }  // Created
        ];

        XLSX.utils.book_append_sheet(workbook, logsWS, 'Daily Logs');
      }
    }

    // Save workbook
    const fileDate = new Date().toISOString().split('T')[0];
    const periodSuffix = options.dateRangeInfo ? 
      `-${options.dateRangeInfo.replace(/[^a-zA-Z0-9]/g, '-').substring(0, 30)}` : '';
    const fileName = `TRACKER-Report${periodSuffix}-${fileDate}.xlsx`;
    XLSX.writeFile(workbook, fileName);
  },

  // Enhanced PDF export with professional design
  exportToPDF: (
    projectTasks: ProjectTask[], 
    adHocTasks: AdHocTask[], 
    metrics: TaskMetrics, 
    options: ExportOptions
  ): void => {
    // Sort tasks by status and deployment/due date
    const sortedProjectTasks = sortTasksByStatusAndDate(projectTasks);
    const sortedAdHocTasks = sortTasksByStatusAndDate(adHocTasks);

    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    let yPosition = 20;

    // Header with logo area and title
    doc.setFillColor(30, 58, 138); // Primary blue
    doc.rect(0, 0, pageWidth, 35, 'F');
    
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(24);
    doc.setFont('helvetica', 'bold');
    doc.text('TRACKER', 20, 25);
    
    doc.setFontSize(12);
    doc.setFont('helvetica', 'normal');
    doc.text(`Generated on ${new Date().toLocaleDateString()}`, pageWidth - 70, 25);

    yPosition = 50;

    // Date Range Information
    if (options.dateRangeInfo) {
      doc.setTextColor(0, 0, 0);
      doc.setFontSize(14);
      doc.setFont('helvetica', 'bold');
      doc.text(options.dateRangeInfo, 20, yPosition);
      yPosition += 20;
    }

    // Executive Summary Section - Visual Charts Only
    doc.setTextColor(0, 0, 0);
    doc.setFontSize(16);
    doc.setFont('helvetica', 'bold');
    doc.text('Executive Summary', 20, yPosition);
    yPosition += 15;

    // Task Status Distribution Chart (Pie Chart representation)
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text('Task Status Distribution', 20, yPosition);
    yPosition += 10;

    // Create futuristic pie chart for status distribution
    const statusColors = {
      'Complete': [52, 211, 153],    // Modern emerald
      'In Progress': [99, 102, 241], // Modern indigo
      'Blocked': [248, 113, 113],    // Modern rose
      'Testing': [251, 146, 60],     // Modern orange
      'To Do': [156, 163, 175]       // Modern gray
    };

    const total = Object.values(metrics.statusDistribution).reduce((sum, count) => sum + count, 0);
    
    if (total > 0) {
      const centerX = 100;
      const centerY = yPosition + 40;
      const radius = 34;
      let startAngle = -Math.PI / 2; // Start from top

      // Draw futuristic pie slices without borders
      Object.entries(metrics.statusDistribution).forEach(([status, count]) => {
        if (count > 0) {
          const percentage = count / total;
          const sliceAngle = percentage * 2 * Math.PI;
          const color = statusColors[status as keyof typeof statusColors] || [156, 163, 175];
          
          // Draw slice with no border - clean futuristic look
          doc.setFillColor(color[0], color[1], color[2]);
          
          const points: number[] = [centerX, centerY];
          const numSegments = Math.max(12, Math.ceil(sliceAngle / (Math.PI / 24))); // Smoother curves
          
          for (let i = 0; i <= numSegments; i++) {
            const angle = startAngle + (sliceAngle * i) / numSegments;
            const x = centerX + radius * Math.cos(angle);
            const y = centerY + radius * Math.sin(angle);
            points.push(x, y);
          }
          
          // Draw filled triangles for smooth slice
          if (points.length >= 6) {
            for (let i = 2; i < points.length - 2; i += 2) {
              doc.triangle(
                points[0], points[1],
                points[i], points[i + 1],
                points[i + 2], points[i + 3],
                'F'
              );
            }
          }
          
          startAngle += sliceAngle;
        }
      });

      // Add subtle center circle for modern donut effect
      doc.setFillColor(248, 250, 252); // Very light gray
      doc.circle(centerX, centerY, 12, 'F');

      // Modern minimalist legend
      let legendY = yPosition + 8;
      const legendX = 150;
      
      doc.setTextColor(55, 65, 81); // Modern dark gray
      doc.setFontSize(10);
      doc.setFont('helvetica', 'bold');
      doc.text('Status Overview', legendX, legendY);
      legendY += 18;
      
      Object.entries(metrics.statusDistribution).forEach(([status, count]) => {
        if (count > 0) {
          const color = statusColors[status as keyof typeof statusColors] || [156, 163, 175];
          const percentage = ((count / total) * 100).toFixed(0);
          
          // Modern color indicator - circle instead of square
          doc.setFillColor(color[0], color[1], color[2]);
          doc.circle(legendX + 4, legendY - 1, 3, 'F');
          
          // Clean typography
          doc.setTextColor(75, 85, 99);
          doc.setFontSize(9);
          doc.setFont('helvetica', 'normal');
          doc.text(`${status}`, legendX + 12, legendY + 1);
          
          doc.setTextColor(107, 114, 128);
          doc.setFontSize(8);
          doc.text(`${count} tasks (${percentage}%)`, legendX + 12, legendY + 9);
          
          legendY += 16;
        }
      });

      yPosition = Math.max(centerY + radius + 20, legendY + 10);
    } else {
      doc.setTextColor(156, 163, 175);
      doc.setFontSize(10);
      doc.text('No task data available', 20, yPosition + 20);
      yPosition += 40;
    }

    // Project Tasks Section
    if (options.includeProjectTasks && sortedProjectTasks.length > 0) {
      // Check if we need a new page
      if (yPosition > pageHeight - 60) {
        doc.addPage();
        yPosition = 20;
      }

      doc.setFontSize(14);
      doc.setFont('helvetica', 'bold');
      doc.text('Project Tasks', 20, yPosition);
      yPosition += 10;

      const projectTasksData = sortedProjectTasks.map(task => [
        task.taskName,
        task.squadName,
        task.spoc,
        task.status,
        new Date(task.startDate).toLocaleDateString(),
        new Date(task.deploymentDate).toLocaleDateString(),
        task.securitySignOff ? 'Yes' : 'No'
      ]);

      autoTable(doc, {
        startY: yPosition,
        head: [['Task Name', 'Squad', 'SPOC', 'Status', 'Start Date', 'Due Date', 'Security Sign-off']],
        body: projectTasksData,
        theme: 'grid',
        headStyles: { 
          fillColor: [59, 130, 246],
          textColor: 255,
          fontSize: 9,
          fontStyle: 'bold'
        },
        bodyStyles: { fontSize: 8 },
        columnStyles: {
          0: { cellWidth: 40 },
          1: { cellWidth: 25 },
          2: { cellWidth: 25 },
          3: { cellWidth: 20 },
          4: { cellWidth: 22 },
          5: { cellWidth: 22 },
          6: { cellWidth: 20 }
        },
        margin: { left: 20, right: 20 },
        showHead: 'everyPage',
        pageBreak: 'auto',
        rowPageBreak: 'avoid'
      });

      yPosition = (doc as any).lastAutoTable.finalY + 15;
    }

    // Ad-Hoc Tasks Section
    if (options.includeAdHocTasks && sortedAdHocTasks.length > 0) {
      // Check if we need a new page
      if (yPosition > pageHeight - 60) {
        doc.addPage();
        yPosition = 20;
      }

      doc.setFontSize(14);
      doc.setFont('helvetica', 'bold');
      doc.text('Ad-Hoc Tasks', 20, yPosition);
      yPosition += 10;

      const adHocTasksData = sortedAdHocTasks.map(task => [
        task.taskName,
        task.description.substring(0, 50) + (task.description.length > 50 ? '...' : ''),
        task.status,
        new Date(task.dueDate).toLocaleDateString(),
        new Date(task.createdAt).toLocaleDateString()
      ]);

      autoTable(doc, {
        startY: yPosition,
        head: [['Task Name', 'Description', 'Status', 'Due Date', 'Created']],
        body: adHocTasksData,
        theme: 'grid',
        headStyles: { 
          fillColor: [16, 185, 129],
          textColor: 255,
          fontSize: 9,
          fontStyle: 'bold'
        },
        bodyStyles: { fontSize: 8 },
        columnStyles: {
          0: { cellWidth: 40 },
          1: { cellWidth: 60 },
          2: { cellWidth: 25 },
          3: { cellWidth: 25 },
          4: { cellWidth: 25 }
        },
        margin: { left: 20, right: 20 },
        showHead: 'everyPage',
        pageBreak: 'auto',
        rowPageBreak: 'avoid'
      });

      yPosition = (doc as any).lastAutoTable.finalY + 15;
    }

    // Daily Logs Section
    if (options.includeDailyLogs) {
      // Calculate date range based on filter
      const now = new Date();
      let startDate: Date | null = null;
      let endDate: Date | null = null;

      if (options.filterTimeframe) {
        switch (options.filterTimeframe) {
          case 'this-week':
            const weekStart = new Date(now);
            weekStart.setDate(now.getDate() - now.getDay());
            weekStart.setHours(0, 0, 0, 0);
            const weekEnd = new Date(weekStart);
            weekEnd.setDate(weekStart.getDate() + 6);
            weekEnd.setHours(23, 59, 59, 999);
            startDate = weekStart;
            endDate = weekEnd;
            break;
          case 'last-week':
            const lastWeekStart = new Date(now);
            lastWeekStart.setDate(now.getDate() - now.getDay() - 7);
            lastWeekStart.setHours(0, 0, 0, 0);
            const lastWeekEnd = new Date(lastWeekStart);
            lastWeekEnd.setDate(lastWeekStart.getDate() + 6);
            lastWeekEnd.setHours(23, 59, 59, 999);
            startDate = lastWeekStart;
            endDate = lastWeekEnd;
            break;
          case 'this-month':
            startDate = new Date(now.getFullYear(), now.getMonth(), 1);
            endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0);
            endDate.setHours(23, 59, 59, 999);
            break;
          case 'custom':
            if (options.filterStartDate && options.filterEndDate) {
              startDate = new Date(options.filterStartDate);
              endDate = new Date(options.filterEndDate);
              endDate.setHours(23, 59, 59, 999);
            }
            break;
        }
      }
      
      // Collect all logs with task info
      const allLogsWithTask: Array<{
        taskName: string;
        taskStartDate: Date;
        logDate: Date;
        status: string;
        notes: string;
      }> = [];
      
      sortedProjectTasks.forEach(task => {
        const taskStartDate = new Date(task.startDate);
        
        // Filter tasks based on start date being within range
        const taskInRange = !startDate || !endDate || 
          (taskStartDate >= startDate && taskStartDate <= endDate);
        
        if (taskInRange) {
          task.dailyLogs.forEach(log => {
            allLogsWithTask.push({
              taskName: task.taskName,
              taskStartDate,
              logDate: new Date(log.date),
              status: log.status,
              notes: log.notes
            });
          });
        }
      });
      
      // Sort logs by status priority, then by date
      const statusPriority: Record<string, number> = {
        'To Do': 1,
        'In Progress': 2,
        'Testing': 3,
        'Blocked': 4,
        'Complete': 5
      };
      
      allLogsWithTask.sort((a, b) => {
        const statusDiff = (statusPriority[a.status] || 999) - (statusPriority[b.status] || 999);
        if (statusDiff !== 0) return statusDiff;
        return a.logDate.getTime() - b.logDate.getTime();
      });
      
      // Convert to display format
      const allLogs = allLogsWithTask.map(log => [
        log.taskName,
        log.logDate.toLocaleDateString(),
        log.status,
        log.notes.substring(0, 80) + (log.notes.length > 80 ? '...' : '')
      ]);

      if (allLogs.length > 0) {
        // Check if we need a new page
        if (yPosition > pageHeight - 60) {
          doc.addPage();
          yPosition = 20;
        }

        doc.setFontSize(14);
        doc.setFont('helvetica', 'bold');
        doc.text('Daily Progress Logs', 20, yPosition);
        yPosition += 10;

        autoTable(doc, {
          startY: yPosition,
          head: [['Task', 'Date', 'Status', 'Notes']],
          body: allLogs,
          theme: 'grid',
          headStyles: { 
            fillColor: [245, 158, 11],
            textColor: 255,
            fontSize: 9,
            fontStyle: 'bold'
          },
          bodyStyles: { fontSize: 8 },
          columnStyles: {
            0: { cellWidth: 40 },
            1: { cellWidth: 25 },
            2: { cellWidth: 25 },
            3: { cellWidth: 85 }
          },
          margin: { left: 20, right: 20 },
          showHead: 'everyPage',
          pageBreak: 'auto',
          rowPageBreak: 'avoid'
        });
      }
    }

    // Footer
    const totalPages = doc.getNumberOfPages();
    for (let i = 1; i <= totalPages; i++) {
      doc.setPage(i);
      doc.setFontSize(8);
      doc.setTextColor(128, 128, 128);
      doc.text(
        `Page ${i} of ${totalPages} | TRACKER | ${new Date().toLocaleDateString()}`,
        20,
        pageHeight - 10
      );
    }

    // Save the PDF
    const fileDate = new Date().toISOString().split('T')[0];
    const periodSuffix = options.dateRangeInfo ? 
      `-${options.dateRangeInfo.replace(/[^a-zA-Z0-9]/g, '-').substring(0, 30)}` : '';
    const fileName = `TRACKER-Report${periodSuffix}-${fileDate}.pdf`;
    doc.save(fileName);
  },

  exportToCSV: (projectTasks: ProjectTask[], adHocTasks: AdHocTask[]): void => {
    // Sort tasks by status and deployment/due date
    const sortedProjectTasks = sortTasksByStatusAndDate(projectTasks);
    const sortedAdHocTasks = sortTasksByStatusAndDate(adHocTasks);

    const allData = [
      ['Type', 'Task Name', 'Description', 'Status', 'Due Date', 'Squad', 'SPOC', 'Security Sign-off', 'Created', 'Updated'],
      ...sortedProjectTasks.map(task => [
        'Project',
        task.taskName,
        task.description,
        task.status,
        new Date(task.deploymentDate).toLocaleDateString(),
        task.squadName,
        task.spoc,
        task.securitySignOff ? 'Yes' : 'No',
        new Date(task.createdAt).toLocaleDateString(),
        new Date(task.updatedAt).toLocaleDateString()
      ]),
      ...sortedAdHocTasks.map(task => [
        'Ad-Hoc',
        task.taskName,
        task.description,
        task.status,
        new Date(task.dueDate).toLocaleDateString(),
        '',
        '',
        '',
        new Date(task.createdAt).toLocaleDateString(),
        new Date(task.updatedAt).toLocaleDateString()
      ])
    ];

    const csvContent = allData.map(row => 
      row.map(cell => `"${cell}"`).join(',')
    ).join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `TRACKER-Tasks-${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }
};