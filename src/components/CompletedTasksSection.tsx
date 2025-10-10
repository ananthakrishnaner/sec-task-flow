import { useState } from "react";
import { ProjectTask, AdHocTask } from "@/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CheckCircle, Calendar, User, Clock, FileText } from "lucide-react";
import { format } from "date-fns";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
  PaginationEllipsis,
} from "@/components/ui/pagination";

interface CompletedTasksSectionProps {
  projectTasks: ProjectTask[];
  adHocTasks: AdHocTask[];
}

const ITEMS_PER_PAGE = 10;

export const CompletedTasksSection = ({ projectTasks, adHocTasks }: CompletedTasksSectionProps) => {
  const [currentPage, setCurrentPage] = useState(1);
  const [activeTab, setActiveTab] = useState("all");
  
  const completedProjectTasks = projectTasks.filter(task => task.status === "Complete");
  const completedAdHocTasks = adHocTasks.filter(task => task.status === "Complete");
  const allCompletedTasks = [...completedProjectTasks, ...completedAdHocTasks];

  // Sort by completion date (most recent first)
  const sortedProjectTasks = [...completedProjectTasks].sort((a, b) => 
    new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
  );
  
  const sortedAdHocTasks = [...completedAdHocTasks].sort((a, b) => 
    new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
  );

  const sortedAllTasks = [...allCompletedTasks].sort((a, b) => 
    new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
  );

  // Pagination logic
  const getCurrentPageTasks = (tasks: (ProjectTask | AdHocTask)[]) => {
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    const endIndex = startIndex + ITEMS_PER_PAGE;
    return tasks.slice(startIndex, endIndex);
  };

  const getTotalPages = (tasks: (ProjectTask | AdHocTask)[]) => {
    return Math.ceil(tasks.length / ITEMS_PER_PAGE);
  };

  const renderPagination = (tasks: (ProjectTask | AdHocTask)[]) => {
    const totalPages = getTotalPages(tasks);
    if (totalPages <= 1) return null;

    const pages = [];
    for (let i = 1; i <= totalPages; i++) {
      if (
        i === 1 ||
        i === totalPages ||
        (i >= currentPage - 1 && i <= currentPage + 1)
      ) {
        pages.push(i);
      } else if (i === currentPage - 2 || i === currentPage + 2) {
        pages.push(-1); // Ellipsis marker
      }
    }

    return (
      <Pagination className="mt-6">
        <PaginationContent>
          <PaginationItem>
            <PaginationPrevious
              onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
              className={currentPage === 1 ? "pointer-events-none opacity-50" : "cursor-pointer"}
            />
          </PaginationItem>
          {pages.map((page, index) => 
            page === -1 ? (
              <PaginationItem key={`ellipsis-${index}`}>
                <PaginationEllipsis />
              </PaginationItem>
            ) : (
              <PaginationItem key={page}>
                <PaginationLink
                  onClick={() => setCurrentPage(page)}
                  isActive={currentPage === page}
                  className="cursor-pointer"
                >
                  {page}
                </PaginationLink>
              </PaginationItem>
            )
          )}
          <PaginationItem>
            <PaginationNext
              onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
              className={currentPage === totalPages ? "pointer-events-none opacity-50" : "cursor-pointer"}
            />
          </PaginationItem>
        </PaginationContent>
      </Pagination>
    );
  };

  // Reset to page 1 when switching tabs
  const handleTabChange = (value: string) => {
    setActiveTab(value);
    setCurrentPage(1);
  };

  const calculateDuration = (task: ProjectTask | AdHocTask): number => {
    const startDate = new Date('startDate' in task ? task.startDate : task.createdAt);
    const endDate = new Date(task.updatedAt);
    return Math.max(0, Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)));
  };

  const renderProjectTask = (task: ProjectTask) => (
    <Card key={task.id} className="bg-card border-border hover:shadow-elevated hover:scale-[1.01] transition-all duration-200">
      <CardContent className="p-4 sm:p-6">
        <div className="space-y-3">
          <div className="flex items-start justify-between gap-3">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-2">
                <CheckCircle className="h-5 w-5 text-success flex-shrink-0" />
                <h3 className="font-semibold text-foreground text-base sm:text-lg truncate">
                  {task.taskName}
                </h3>
              </div>
              <p className="text-sm text-muted-foreground line-clamp-2">
                {task.description}
              </p>
            </div>
            <Badge variant="default" className="bg-success text-success-foreground flex-shrink-0">
              Completed
            </Badge>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
            <div className="flex items-center gap-2 text-muted-foreground">
              <User className="h-4 w-4 flex-shrink-0" />
              <span className="truncate"><span className="font-medium">Squad:</span> {task.squadName}</span>
            </div>
            <div className="flex items-center gap-2 text-muted-foreground">
              <User className="h-4 w-4 flex-shrink-0" />
              <span className="truncate"><span className="font-medium">SPOC:</span> {task.spoc}</span>
            </div>
            <div className="flex items-center gap-2 text-muted-foreground">
              <Calendar className="h-4 w-4 flex-shrink-0" />
              <span className="truncate">
                <span className="font-medium">Completed:</span> {format(new Date(task.updatedAt), 'MMM dd, yyyy')}
              </span>
            </div>
            <div className="flex items-center gap-2 text-muted-foreground">
              <Clock className="h-4 w-4 flex-shrink-0" />
              <span className="truncate">
                <span className="font-medium">Duration:</span> {calculateDuration(task)} days
              </span>
            </div>
          </div>

          {task.securitySignOff && (
            <div className="flex items-center gap-2 text-sm">
              <Badge variant="outline" className="border-success text-success">
                Security Signed Off
              </Badge>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );

  const renderAdHocTask = (task: AdHocTask) => (
    <Card key={task.id} className="bg-card border-border hover:shadow-elevated hover:scale-[1.01] transition-all duration-200">
      <CardContent className="p-4 sm:p-6">
        <div className="space-y-3">
          <div className="flex items-start justify-between gap-3">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-2">
                <CheckCircle className="h-5 w-5 text-success flex-shrink-0" />
                <h3 className="font-semibold text-foreground text-base sm:text-lg truncate">
                  {task.taskName}
                </h3>
              </div>
              <p className="text-sm text-muted-foreground line-clamp-2">
                {task.description}
              </p>
            </div>
            <Badge variant="default" className="bg-success text-success-foreground flex-shrink-0">
              Completed
            </Badge>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
            <div className="flex items-center gap-2 text-muted-foreground">
              <Calendar className="h-4 w-4 flex-shrink-0" />
              <span className="truncate">
                <span className="font-medium">Completed:</span> {format(new Date(task.updatedAt), 'MMM dd, yyyy')}
              </span>
            </div>
            <div className="flex items-center gap-2 text-muted-foreground">
              <Clock className="h-4 w-4 flex-shrink-0" />
              <span className="truncate">
                <span className="font-medium">Duration:</span> {calculateDuration(task)} days
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2 text-sm">
            <Badge variant="outline" className="border-primary text-primary">
              Ad-Hoc Task
            </Badge>
          </div>
        </div>
      </CardContent>
    </Card>
  );

  return (
    <div className="space-y-6">
      <Card className="bg-card shadow-card border-border">
        <CardHeader className="p-4 sm:p-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
            <CardTitle className="text-foreground flex items-center gap-2 text-lg sm:text-xl">
              <CheckCircle className="h-5 w-5 sm:h-6 sm:w-6 text-success" />
              <span>All-Time Completed Tasks</span>
            </CardTitle>
            <Badge variant="outline" className="text-base">
              {allCompletedTasks.length} Total
            </Badge>
          </div>
          <p className="text-sm text-muted-foreground mt-2">
            Complete history of all finished tasks
          </p>
        </CardHeader>
        <CardContent className="p-4 sm:p-6 pt-0">
          {allCompletedTasks.length === 0 ? (
            <div className="text-center py-12">
              <FileText className="h-12 w-12 mx-auto text-muted-foreground mb-3" />
              <p className="text-muted-foreground font-medium">No completed tasks yet</p>
              <p className="text-sm text-muted-foreground mt-1">
                Completed tasks will appear here
              </p>
            </div>
          ) : (
            <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full">
              <TabsList className="grid w-full grid-cols-3 mb-6">
                <TabsTrigger value="all">
                  All ({allCompletedTasks.length})
                </TabsTrigger>
                <TabsTrigger value="project">
                  Project ({completedProjectTasks.length})
                </TabsTrigger>
                <TabsTrigger value="adhoc">
                  Ad-Hoc ({completedAdHocTasks.length})
                </TabsTrigger>
              </TabsList>

              <TabsContent value="all" className="space-y-4">
                {getCurrentPageTasks(sortedAllTasks).map(task => 
                  'squadName' in task ? renderProjectTask(task) : renderAdHocTask(task)
                )}
                {renderPagination(sortedAllTasks)}
              </TabsContent>

              <TabsContent value="project" className="space-y-4">
                {sortedProjectTasks.length > 0 ? (
                  <>
                    {getCurrentPageTasks(sortedProjectTasks).map(renderProjectTask)}
                    {renderPagination(sortedProjectTasks)}
                  </>
                ) : (
                  <div className="text-center py-8">
                    <p className="text-muted-foreground">No completed project tasks</p>
                  </div>
                )}
              </TabsContent>

              <TabsContent value="adhoc" className="space-y-4">
                {sortedAdHocTasks.length > 0 ? (
                  <>
                    {getCurrentPageTasks(sortedAdHocTasks).map(renderAdHocTask)}
                    {renderPagination(sortedAdHocTasks)}
                  </>
                ) : (
                  <div className="text-center py-8">
                    <p className="text-muted-foreground">No completed ad-hoc tasks</p>
                  </div>
                )}
              </TabsContent>
            </Tabs>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
