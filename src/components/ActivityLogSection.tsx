import { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { activityLogger, ActivityLogEntry } from "@/lib/activityLogger";
import { Activity, Download, Trash2, Search, Filter, Clock } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";

export const ActivityLogSection = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [filterAction, setFilterAction] = useState<string>("all");
  const { toast } = useToast();

  const activityLogs = activityLogger.getActivityLog();

  const filteredLogs = useMemo(() => {
    return activityLogs.filter(log => {
      const matchesSearch = searchTerm === "" || 
        log.taskName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        log.action.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesFilter = filterAction === "all" || log.action === filterAction;
      
      return matchesSearch && matchesFilter;
    });
  }, [activityLogs, searchTerm, filterAction]);

  const uniqueActions = useMemo(() => {
    const actions = new Set(activityLogs.map(log => log.action));
    return Array.from(actions);
  }, [activityLogs]);

  const handleExportLogs = () => {
    try {
      const logsData = activityLogger.exportActivityLog();
      const blob = new Blob([logsData], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `activity-logs-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      
      toast({
        title: "Export Successful",
        description: "Activity logs have been exported successfully.",
      });
    } catch (error) {
      toast({
        title: "Export Failed",
        description: "Failed to export activity logs.",
        variant: "destructive",
      });
    }
  };

  const handleClearLogs = () => {
    if (window.confirm('Are you sure you want to clear all activity logs? This action cannot be undone.')) {
      activityLogger.clearActivityLog();
      toast({
        title: "Logs Cleared",
        description: "All activity logs have been cleared.",
      });
      // Force re-render by updating a dummy state
      setSearchTerm("");
    }
  };

  const getActionBadgeVariant = (action: string) => {
    switch (action) {
      case 'Status Changed':
        return 'default';
      case 'Task Created':
        return 'secondary';
      case 'Task Deleted':
        return 'destructive';
      case 'Task Updated':
        return 'outline';
      case 'Daily Log Added':
        return 'secondary';
      case 'Security Sign-off Changed':
        return 'default';
      default:
        return 'outline';
    }
  };

  const formatActivityDetails = (log: ActivityLogEntry) => {
    if (!log.details) return '';
    
    if (log.action === 'Status Changed') {
      return `${log.details.oldValue} → ${log.details.newValue}`;
    }
    
    if (log.action === 'Daily Log Added') {
      return `Status: ${log.details.newValue}`;
    }
    
    if (log.action === 'Security Sign-off Changed') {
      return log.details.newValue;
    }
    
    if (log.details.field) {
      return `Field: ${log.details.field}`;
    }
    
    return '';
  };

  return (
    <Card className="bg-card shadow-card border-border">
      <CardHeader>
        <CardTitle className="text-foreground flex items-center gap-2">
          <Activity className="h-5 w-5" />
          Activity Log
        </CardTitle>
        <div className="flex flex-col sm:flex-row gap-3 mt-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search activities or task names..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 bg-input border-border text-foreground"
            />
          </div>
          <select
            value={filterAction}
            onChange={(e) => setFilterAction(e.target.value)}
            className="px-3 py-2 border rounded-md bg-input border-border text-foreground"
          >
            <option value="all">All Actions</option>
            {uniqueActions.map(action => (
              <option key={action} value={action}>{action}</option>
            ))}
          </select>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleExportLogs}
              className="border-border text-foreground hover:bg-muted"
            >
              <Download className="h-4 w-4 mr-2" />
              Export
            </Button>
            <Button
              variant="destructive"
              size="sm"
              onClick={handleClearLogs}
              className="bg-destructive hover:bg-destructive/90 text-destructive-foreground"
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Clear
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {filteredLogs.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <Activity className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>{searchTerm || filterAction !== "all" ? "No activities match your filters" : "No activity logs yet"}</p>
          </div>
        ) : (
          <ScrollArea className="h-96">
            <div className="space-y-3">
              {filteredLogs.map((log) => (
                <div
                  key={log.id}
                  className="p-4 rounded-lg border border-border bg-muted/30 hover:bg-muted/50 transition-colors"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-2">
                        <Badge variant={getActionBadgeVariant(log.action)}>
                          {log.action}
                        </Badge>
                        <Badge variant="outline" className="text-xs">
                          {log.taskType === 'project' ? 'Project' : 'Ad-hoc'}
                        </Badge>
                      </div>
                      <h4 className="font-medium text-foreground truncate">
                        {log.taskName}
                      </h4>
                      {formatActivityDetails(log) && (
                        <p className="text-sm text-muted-foreground mt-1">
                          {formatActivityDetails(log)}
                        </p>
                      )}
                    </div>
                    <div className="flex items-center gap-1 text-xs text-muted-foreground shrink-0">
                      <Clock className="h-3 w-3" />
                      <span>
                        {format(new Date(log.timestamp), 'MMM dd, HH:mm')}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>
        )}
        {filteredLogs.length > 0 && (
          <div className="mt-4 pt-3 border-t border-border">
            <p className="text-xs text-muted-foreground text-center">
              Showing {filteredLogs.length} of {activityLogs.length} activities
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};