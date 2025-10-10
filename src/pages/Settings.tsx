import { useState, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { storageService } from "@/lib/storage";
import { Shield, Download, Upload, RotateCcw, AlertTriangle, ArrowLeft } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { TaskData } from "@/types";
import { ActivityLogSection } from "@/components/ActivityLogSection";

interface SettingsProps {
  onDataImported: () => void;
  onGoBack?: () => void;
}

export const Settings = ({ onDataImported, onGoBack }: SettingsProps) => {
  const [isImporting, setIsImporting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const handleDownloadJsonBackup = async () => {
    try {
      await storageService.downloadJsonBackup();
      toast({
        title: "Backup Downloaded",
        description: "JSON backup file has been downloaded successfully.",
      });
    } catch (error) {
      console.error('Error downloading backup:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      toast({
        title: "Download Failed",
        description: `Failed to download backup: ${errorMessage}`,
        variant: "destructive",
      });
    }
  };

  const handleImportBackup = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Check file type
    if (file.type !== 'application/json' && !file.name.endsWith('.json')) {
      toast({
        title: "Invalid File Type",
        description: "Please select a valid JSON file (.json extension required).",
        variant: "destructive",
      });
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
      return;
    }

    // Check file size (10MB limit)
    if (file.size > 10 * 1024 * 1024) {
      toast({
        title: "File Too Large",
        description: "File size must be less than 10MB.",
        variant: "destructive",
      });
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
      return;
    }

    setIsImporting(true);
    try {
      const fileContent = await file.text();
      
      // Get current counts before import
      const beforeData = await storageService.getAllData();
      const beforeCount = beforeData.projectTasks.length + beforeData.adHocTasks.length;
      
      // Use the enhanced import method with intelligent merging
      await storageService.importData(fileContent);
      
      // Get new counts after import
      const afterData = await storageService.getAllData();
      const afterCount = afterData.projectTasks.length + afterData.adHocTasks.length;
      const addedCount = afterCount - beforeCount;
      
      toast({
        title: "Import Successful",
        description: `Data merged successfully! ${addedCount > 0 ? `${addedCount} new tasks added.` : 'All tasks up to date.'} Total: ${afterCount} tasks.`,
      });

      // Notify parent to refresh data
      onDataImported();
      
      // Clear file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    } catch (error) {
      console.error('Error importing backup:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      toast({
        title: "Import Failed",
        description: `Failed to import data: ${errorMessage}`,
        variant: "destructive",
      });
      
      // Clear file input on error
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    } finally {
      setIsImporting(false);
    }
  };

  const handleClearAllData = async () => {
    if (window.confirm('Are you sure you want to clear all data? This action cannot be undone.')) {
      try {
        await storageService.clearAllData();
        toast({
          title: "Data Cleared",
          description: "All data has been cleared successfully.",
        });
        onDataImported(); // Refresh the data
      } catch (error) {
        console.error('Error clearing data:', error);
        toast({
          title: "Clear Failed",
          description: "Failed to clear data. Please try again.",
          variant: "destructive",
        });
      }
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header - Mobile Optimized */}
      <header className="border-b border-border bg-card shadow-card sticky top-0 z-40">
        <div className="container mx-auto px-4 py-3 sm:px-6 sm:py-4">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 min-w-0 flex-1">
              <div className="p-1.5 sm:p-2 rounded-lg bg-gradient-primary flex-shrink-0">
                <Shield className="h-4 w-4 sm:h-6 sm:w-6 text-primary-foreground" />
              </div>
              <div className="min-w-0">
                <h1 className="text-lg sm:text-2xl font-bold text-foreground truncate">Settings</h1>
                <p className="text-xs sm:text-sm text-muted-foreground hidden sm:block">
                  Manage your data backup and import preferences
                </p>
              </div>
            </div>
            {onGoBack && (
              <>
                <Button 
                  variant="outline"
                  size="sm"
                  onClick={onGoBack}
                  className="border-border text-foreground hover:bg-muted hidden sm:inline-flex"
                >
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back to Dashboard
                </Button>
                <Button 
                  variant="outline"
                  size="sm"
                  onClick={onGoBack}
                  className="border-border text-foreground hover:bg-muted sm:hidden"
                >
                  <ArrowLeft className="h-4 w-4" />
                </Button>
              </>
            )}
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-4 sm:px-6 sm:py-8">
        <div className="max-w-4xl space-y-6">
          {/* Activity Log Section */}
          <ActivityLogSection />

          {/* Data Backup Section */}
          <Card className="bg-card shadow-card border-border">
            <CardHeader>
              <CardTitle className="text-foreground flex items-center gap-2">
                <Download className="h-5 w-5" />
                Data Backup
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-muted-foreground">
                Download a complete backup of all your tasks and data in JSON format. 
                This file can be used to restore your data later.
              </p>
              <Button 
                onClick={handleDownloadJsonBackup}
                className="bg-primary hover:bg-primary-glow text-primary-foreground"
              >
                <Download className="h-4 w-4 mr-2" />
                Download JSON Backup
              </Button>
            </CardContent>
          </Card>

          {/* Data Import Section */}
          <Card className="bg-card shadow-card border-border">
            <CardHeader>
              <CardTitle className="text-foreground flex items-center gap-2">
                <Upload className="h-5 w-5" />
                Data Import
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-muted-foreground">
                Import a previously saved JSON backup file to restore your data. 
                The system will intelligently merge imported data with existing data.
              </p>
              <div className="p-3 bg-accent/50 border border-accent rounded-lg">
                <p className="text-sm text-accent-foreground">
                  <strong>Supported formats:</strong> JSON files (.json) up to 10MB<br/>
                  <strong>Smart merge:</strong> New tasks are added, existing tasks keep their newest version based on update date<br/>
                  <strong>Data safety:</strong> Your completed tasks won't be lost when importing older backups
                </p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="backup-file" className="text-foreground">
                  Select Backup File
                </Label>
                <Input
                  id="backup-file"
                  ref={fileInputRef}
                  type="file"
                  accept=".json"
                  onChange={handleImportBackup}
                  disabled={isImporting}
                  className="bg-input border-border text-foreground"
                />
              </div>
              {isImporting && (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <div className="w-4 h-4 rounded-full border-2 border-primary border-t-transparent animate-spin" />
                  Importing data...
                </div>
              )}
            </CardContent>
          </Card>

          {/* Data Management Section */}
          <Card className="bg-card shadow-card border-border border-destructive/20">
            <CardHeader>
              <CardTitle className="text-foreground flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-destructive" />
                Data Management
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-muted-foreground">
                Danger zone: These actions are irreversible. Please make sure you have 
                a backup before proceeding.
              </p>
              <Button 
                onClick={handleClearAllData}
                variant="destructive"
                className="bg-destructive hover:bg-destructive/90 text-destructive-foreground"
              >
                <RotateCcw className="h-4 w-4 mr-2" />
                Clear All Data
              </Button>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
};