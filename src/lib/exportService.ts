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
}

export const exportService = {
  // Enhanced Excel export with improved design and formatting
  exportToExcel: (
    projectTasks: ProjectTask[], 
    adHocTasks: AdHocTask[], 
    metrics: TaskMetrics, 
    options: ExportOptions
  ): void => {
    const workbook = XLSX.utils.book_new();

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
    if (options.includeProjectTasks && projectTasks.length > 0) {
      const projectData = [
        ['Task Name', 'Description', 'Squad', 'SPOC', 'Start Date', 'Due Date', 'Status', 'Security Sign-off', 'Priority', 'Created', 'Updated'],
        ...projectTasks.map(task => [
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
    if (options.includeAdHocTasks && adHocTasks.length > 0) {
      const adHocData = [
        ['Task Name', 'Description', 'Due Date', 'Status', 'Created', 'Updated'],
        ...adHocTasks.map(task => [
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
      
      // Parse date range from options.dateRangeInfo
      let startDate: Date | null = null;
      let endDate: Date | null = null;
      
      if (options.dateRangeInfo) {
        const rangeInfo = options.dateRangeInfo.toLowerCase();
        const now = new Date();
        
        if (rangeInfo.includes('week')) {
          // Current week or specific week
          const startOfWeek = new Date(now);
          startOfWeek.setDate(now.getDate() - now.getDay());
          startOfWeek.setHours(0, 0, 0, 0);
          const endOfWeek = new Date(startOfWeek);
          endOfWeek.setDate(startOfWeek.getDate() + 6);
          endOfWeek.setHours(23, 59, 59, 999);
          startDate = startOfWeek;
          endDate = endOfWeek;
        } else if (rangeInfo.includes('month')) {
          // Current month or specific month
          const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
          const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);
          endOfMonth.setHours(23, 59, 59, 999);
          startDate = startOfMonth;
          endDate = endOfMonth;
        } else if (rangeInfo.includes(' - ')) {
          // Custom date range parsing
          const datePattern = /(\w{3,4} \d{1,2}, \d{4})/g;
          const dates = rangeInfo.match(datePattern);
          if (dates && dates.length >= 2) {
            startDate = new Date(dates[0]);
            endDate = new Date(dates[1]);
            endDate.setHours(23, 59, 59, 999);
          }
        }
      }
      
      projectTasks.forEach(task => {
        task.dailyLogs.forEach(log => {
          const logDate = new Date(log.date);
          
          // Filter logs based on date range
          const isInRange = !startDate || !endDate || 
            (logDate >= startDate && logDate <= endDate);
          
          if (isInRange) {
            logsData.push([
              task.taskName,
              new Date(log.date).toLocaleDateString(),
              log.status,
              log.notes,
              new Date(log.createdAt).toLocaleDateString()
            ]);
          }
        });
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

    // Create classic pie chart for status distribution
    const statusColors = {
      'Complete': [76, 175, 80],     // Classic green
      'In Progress': [33, 150, 243], // Classic blue
      'Blocked': [244, 67, 54],      // Classic red
      'Testing': [255, 193, 7],      // Classic amber
      'To Do': [158, 158, 158]       // Classic gray
    };

    const total = Object.values(metrics.statusDistribution).reduce((sum, count) => sum + count, 0);
    
    if (total > 0) {
      const centerX = 100;
      const centerY = yPosition + 40;
      const radius = 32;
      let startAngle = -Math.PI / 2; // Start from top (12 o'clock)

      // Draw classic pie slices
      Object.entries(metrics.statusDistribution).forEach(([status, count]) => {
        if (count > 0) {
          const percentage = count / total;
          const sliceAngle = percentage * 2 * Math.PI;
          const color = statusColors[status as keyof typeof statusColors] || [128, 128, 128];
          
          // Draw slice with classic styling
          doc.setFillColor(color[0], color[1], color[2]);
          doc.setDrawColor(0, 0, 0);
          doc.setLineWidth(0.8);
          
          const points: number[] = [centerX, centerY];
          const numSegments = Math.max(8, Math.ceil(sliceAngle / (Math.PI / 20)));
          
          for (let i = 0; i <= numSegments; i++) {
            const angle = startAngle + (sliceAngle * i) / numSegments;
            const x = centerX + radius * Math.cos(angle);
            const y = centerY + radius * Math.sin(angle);
            points.push(x, y);
          }
          
          // Draw filled triangles for the slice
          if (points.length >= 6) {
            for (let i = 2; i < points.length - 2; i += 2) {
              doc.triangle(
                points[0], points[1],
                points[i], points[i + 1],
                points[i + 2], points[i + 3],
                'FD'
              );
            }
          }
          
          startAngle += sliceAngle;
        }
      });

      // Add classic legend with clean layout
      let legendY = yPosition + 5;
      const legendX = 145;
      
      doc.setTextColor(0, 0, 0);
      doc.setFontSize(11);
      doc.setFont('helvetica', 'bold');
      doc.text('Task Status', legendX, legendY);
      legendY += 15;
      
      Object.entries(metrics.statusDistribution).forEach(([status, count]) => {
        if (count > 0) {
          const color = statusColors[status as keyof typeof statusColors] || [128, 128, 128];
          const percentage = ((count / total) * 100).toFixed(1);
          
          // Draw classic color box
          doc.setFillColor(color[0], color[1], color[2]);
          doc.setDrawColor(0, 0, 0);
          doc.setLineWidth(0.5);
          doc.rect(legendX, legendY - 3, 8, 6, 'FD');
          
          // Draw text with classic formatting
          doc.setTextColor(0, 0, 0);
          doc.setFontSize(9);
          doc.setFont('helvetica', 'normal');
          doc.text(`${status}: ${count} (${percentage}%)`, legendX + 12, legendY + 1);
          
          legendY += 12;
        }
      });

      yPosition = Math.max(centerY + radius + 15, legendY + 10);
    } else {
      doc.setTextColor(128, 128, 128);
      doc.setFontSize(10);
      doc.text('No tasks available for chart', 20, yPosition + 20);
      yPosition += 40;
    }

    // Project Tasks Section
    if (options.includeProjectTasks && projectTasks.length > 0) {
      // Check if we need a new page
      if (yPosition > pageHeight - 60) {
        doc.addPage();
        yPosition = 20;
      }

      doc.setFontSize(14);
      doc.setFont('helvetica', 'bold');
      doc.text('Project Tasks', 20, yPosition);
      yPosition += 10;

      const projectTasksData = projectTasks.map(task => [
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
        margin: { left: 20, right: 20 }
      });

      yPosition = (doc as any).lastAutoTable.finalY + 15;
    }

    // Ad-Hoc Tasks Section
    if (options.includeAdHocTasks && adHocTasks.length > 0) {
      // Check if we need a new page
      if (yPosition > pageHeight - 60) {
        doc.addPage();
        yPosition = 20;
      }

      doc.setFontSize(14);
      doc.setFont('helvetica', 'bold');
      doc.text('Ad-Hoc Tasks', 20, yPosition);
      yPosition += 10;

      const adHocTasksData = adHocTasks.map(task => [
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
        margin: { left: 20, right: 20 }
      });

      yPosition = (doc as any).lastAutoTable.finalY + 15;
    }

    // Daily Logs Section
    if (options.includeDailyLogs) {
      const allLogs: any[] = [];
      
      // Parse date range from options.dateRangeInfo
      let startDate: Date | null = null;
      let endDate: Date | null = null;
      
      if (options.dateRangeInfo) {
        const rangeInfo = options.dateRangeInfo.toLowerCase();
        const now = new Date();
        
        if (rangeInfo.includes('week')) {
          // Current week or specific week
          const startOfWeek = new Date(now);
          startOfWeek.setDate(now.getDate() - now.getDay());
          startOfWeek.setHours(0, 0, 0, 0);
          const endOfWeek = new Date(startOfWeek);
          endOfWeek.setDate(startOfWeek.getDate() + 6);
          endOfWeek.setHours(23, 59, 59, 999);
          startDate = startOfWeek;
          endDate = endOfWeek;
        } else if (rangeInfo.includes('month')) {
          // Current month or specific month
          const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
          const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);
          endOfMonth.setHours(23, 59, 59, 999);
          startDate = startOfMonth;
          endDate = endOfMonth;
        } else if (rangeInfo.includes(' - ')) {
          // Custom date range parsing
          const datePattern = /(\w{3,4} \d{1,2}, \d{4})/g;
          const dates = rangeInfo.match(datePattern);
          if (dates && dates.length >= 2) {
            startDate = new Date(dates[0]);
            endDate = new Date(dates[1]);
            endDate.setHours(23, 59, 59, 999);
          }
        }
      }
      
      projectTasks.forEach(task => {
        task.dailyLogs.forEach(log => {
          const logDate = new Date(log.date);
          
          // Filter logs based on date range
          const isInRange = !startDate || !endDate || 
            (logDate >= startDate && logDate <= endDate);
          
          if (isInRange) {
            allLogs.push([
              task.taskName,
              new Date(log.date).toLocaleDateString(),
              log.status,
              log.notes.substring(0, 80) + (log.notes.length > 80 ? '...' : '')
            ]);
          }
        });
      });

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
          margin: { left: 20, right: 20 }
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
    const allData = [
      ['Type', 'Task Name', 'Description', 'Status', 'Due Date', 'Squad', 'SPOC', 'Security Sign-off', 'Created', 'Updated'],
      ...projectTasks.map(task => [
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
      ...adHocTasks.map(task => [
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