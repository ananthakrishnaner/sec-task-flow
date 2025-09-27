import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { ProjectTask, AdHocTask, TaskMetrics } from '@/types';

export interface ExportOptions {
  includeProjectTasks: boolean;
  includeAdHocTasks: boolean;
  includeDailyLogs: boolean;
  includeMetrics: boolean;
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
        ['Cybersecurity Efficiency Tracker - Executive Summary'],
        ['Generated on:', new Date().toLocaleString()],
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
      
      projectTasks.forEach(task => {
        task.dailyLogs.forEach(log => {
          logsData.push([
            task.taskName,
            new Date(log.date).toLocaleDateString(),
            log.status,
            log.notes,
            new Date(log.createdAt).toLocaleDateString()
          ]);
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
    const fileName = `CET-Report-${new Date().toISOString().split('T')[0]}.xlsx`;
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
    doc.text('Cybersecurity Efficiency Tracker', 20, 25);
    
    doc.setFontSize(12);
    doc.setFont('helvetica', 'normal');
    doc.text(`Generated on ${new Date().toLocaleDateString()}`, pageWidth - 70, 25);

    yPosition = 50;

    // Executive Summary Section
    doc.setTextColor(0, 0, 0);
    doc.setFontSize(16);
    doc.setFont('helvetica', 'bold');
    doc.text('Executive Summary', 20, yPosition);
    yPosition += 15;

    // Metrics cards
    const summaryData = [
      ['Total Tasks', metrics.totalTasks.toString()],
      ['Completed Tasks', `${metrics.completedTasks} (${metrics.completionRate.toFixed(1)}%)`],
      ['In Progress', metrics.inProgressTasks.toString()],
      ['Blocked Tasks', metrics.blockedTasks.toString()],
      ['Project Tasks', metrics.projectTasksCount.toString()],
      ['Ad-Hoc Tasks', metrics.adHocTasksCount.toString()]
    ];

    autoTable(doc, {
      startY: yPosition,
      head: [['Metric', 'Value']],
      body: summaryData,
      theme: 'striped',
      headStyles: { 
        fillColor: [30, 58, 138],
        textColor: 255,
        fontSize: 12,
        fontStyle: 'bold'
      },
      bodyStyles: { fontSize: 10 },
      margin: { left: 20, right: 20 }
    });

    yPosition = (doc as any).lastAutoTable.finalY + 20;

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
      projectTasks.forEach(task => {
        task.dailyLogs.forEach(log => {
          allLogs.push([
            task.taskName,
            new Date(log.date).toLocaleDateString(),
            log.status,
            log.notes.substring(0, 80) + (log.notes.length > 80 ? '...' : '')
          ]);
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
        `Page ${i} of ${totalPages} | Cybersecurity Efficiency Tracker | ${new Date().toLocaleDateString()}`,
        20,
        pageHeight - 10
      );
    }

    // Save the PDF
    const fileName = `CET-Report-${new Date().toISOString().split('T')[0]}.pdf`;
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
    link.download = `CET-Tasks-${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }
};