import { useMemo } from 'react';
import { ProjectTask, AdHocTask } from '@/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  TrendingUp, 
  TrendingDown, 
  Activity, 
  AlertTriangle, 
  Target,
  Clock,
  Award,
  Zap,
  Shield,
  BarChart3
} from 'lucide-react';
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar
} from 'recharts';
import { analyticsService } from '@/lib/analyticsService';

interface AdvancedAnalyticsProps {
  projectTasks: ProjectTask[];
  adHocTasks: AdHocTask[];
}

export const AdvancedAnalytics = ({ projectTasks, adHocTasks }: AdvancedAnalyticsProps) => {
  const trendData = useMemo(() => 
    analyticsService.calculateTrendData(projectTasks, adHocTasks, 14), 
    [projectTasks, adHocTasks]
  );

  const squadPerformance = useMemo(() => 
    analyticsService.calculateSquadPerformance(projectTasks), 
    [projectTasks]
  );

  const velocity = useMemo(() => 
    analyticsService.calculateVelocity(projectTasks, adHocTasks), 
    [projectTasks, adHocTasks]
  );

  const timeInStatus = useMemo(() => 
    analyticsService.calculateTimeInStatus(projectTasks, adHocTasks), 
    [projectTasks, adHocTasks]
  );

  const insights = useMemo(() => 
    analyticsService.generatePredictiveInsights(projectTasks, adHocTasks, velocity), 
    [projectTasks, adHocTasks, velocity]
  );

  const radarData = useMemo(() => 
    squadPerformance.slice(0, 5).map(squad => ({
      squad: squad.squadName.substring(0, 10),
      completionRate: squad.completionRate,
      taskCount: (squad.totalTasks / Math.max(...squadPerformance.map(s => s.totalTasks))) * 100,
      speed: Math.max(0, 100 - (squad.avgCompletionTime * 2))
    })),
    [squadPerformance]
  );

  const getRiskColor = (score: number) => {
    if (score < 30) return 'text-success';
    if (score < 60) return 'text-warning';
    return 'text-destructive';
  };

  const getRiskLabel = (score: number) => {
    if (score < 30) return 'Low Risk';
    if (score < 60) return 'Medium Risk';
    return 'High Risk';
  };

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Predictive Insights Banner */}
      {insights.bottlenecks.length > 0 && (
        <Alert className="border-warning/50 bg-warning/10">
          <AlertTriangle className="h-4 w-4 text-warning" />
          <AlertDescription className="text-sm">
            <div className="flex flex-col gap-2">
              <span className="font-semibold text-warning">Bottlenecks Detected:</span>
              <ul className="list-disc list-inside space-y-1 text-muted-foreground">
                {insights.bottlenecks.map((bottleneck, idx) => (
                  <li key={idx}>{bottleneck}</li>
                ))}
              </ul>
            </div>
          </AlertDescription>
        </Alert>
      )}

      {/* Velocity & Risk Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <Card className="bg-card shadow-card border-border">
          <CardHeader className="p-4 pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <Zap className="h-4 w-4 text-primary" />
              Current Velocity
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 pt-0">
            <div className="flex items-end gap-2">
              <div className="text-2xl font-bold text-foreground">{velocity.currentWeekVelocity}</div>
              <div className="text-xs text-muted-foreground mb-1">tasks/week</div>
            </div>
            <div className="flex items-center gap-1 mt-2">
              {velocity.trend === 'increasing' ? (
                <TrendingUp className="h-3 w-3 text-success" />
              ) : velocity.trend === 'decreasing' ? (
                <TrendingDown className="h-3 w-3 text-destructive" />
              ) : (
                <Activity className="h-3 w-3 text-muted-foreground" />
              )}
              <span className={`text-xs ${
                velocity.trend === 'increasing' ? 'text-success' : 
                velocity.trend === 'decreasing' ? 'text-destructive' : 
                'text-muted-foreground'
              }`}>
                {velocity.trend}
              </span>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-card shadow-card border-border">
          <CardHeader className="p-4 pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <Target className="h-4 w-4 text-accent" />
              Projected Next Week
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 pt-0">
            <div className="flex items-end gap-2">
              <div className="text-2xl font-bold text-foreground">{velocity.projectedCompletionsNextWeek}</div>
              <div className="text-xs text-muted-foreground mb-1">estimated</div>
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              Based on {velocity.averageVelocity} avg velocity
            </p>
          </CardContent>
        </Card>

        <Card className="bg-card shadow-card border-border">
          <CardHeader className="p-4 pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <Shield className="h-4 w-4" />
              Risk Score
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 pt-0">
            <div className="flex items-end gap-2">
              <div className={`text-2xl font-bold ${getRiskColor(insights.riskScore)}`}>
                {insights.riskScore}
              </div>
              <div className="text-xs text-muted-foreground mb-1">/100</div>
            </div>
            <Badge className={`mt-2 ${getRiskColor(insights.riskScore)}`} variant="outline">
              {getRiskLabel(insights.riskScore)}
            </Badge>
          </CardContent>
        </Card>

        <Card className="bg-card shadow-card border-border">
          <CardHeader className="p-4 pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <Clock className="h-4 w-4 text-warning" />
              Est. Completion
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 pt-0">
            <div className="text-sm font-bold text-foreground">
              {insights.estimatedCompletionDate || 'N/A'}
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              All remaining tasks
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Trend Analysis */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
        <Card className="bg-card shadow-card border-border">
          <CardHeader className="p-4 sm:p-6 pb-3">
            <CardTitle className="text-base sm:text-lg text-foreground flex items-center gap-2">
              <BarChart3 className="h-4 w-4 sm:h-5 sm:w-5 text-primary" />
              14-Day Activity Trend
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 sm:p-6 pt-0">
            <ResponsiveContainer width="100%" height={250}>
              <AreaChart data={trendData}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.3} />
                <XAxis 
                  dataKey="date" 
                  stroke="hsl(var(--muted-foreground))" 
                  fontSize={11}
                  tick={{ fill: 'hsl(var(--muted-foreground))' }}
                />
                <YAxis 
                  stroke="hsl(var(--muted-foreground))" 
                  fontSize={11}
                  tick={{ fill: 'hsl(var(--muted-foreground))' }}
                />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: 'hsl(var(--card))', 
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '8px'
                  }} 
                />
                <Legend />
                <Area 
                  type="monotone" 
                  dataKey="completions" 
                  stackId="1"
                  stroke="hsl(var(--success))" 
                  fill="hsl(var(--success))" 
                  fillOpacity={0.6}
                  name="Completed"
                />
                <Area 
                  type="monotone" 
                  dataKey="newTasks" 
                  stackId="2"
                  stroke="hsl(var(--primary))" 
                  fill="hsl(var(--primary))" 
                  fillOpacity={0.4}
                  name="New Tasks"
                />
                <Area 
                  type="monotone" 
                  dataKey="blocked" 
                  stackId="3"
                  stroke="hsl(var(--destructive))" 
                  fill="hsl(var(--destructive))" 
                  fillOpacity={0.3}
                  name="Blocked"
                />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="bg-card shadow-card border-border">
          <CardHeader className="p-4 sm:p-6 pb-3">
            <CardTitle className="text-base sm:text-lg text-foreground flex items-center gap-2">
              <Award className="h-4 w-4 sm:h-5 sm:w-5 text-accent" />
              Squad Performance Radar
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 sm:p-6 pt-0">
            {radarData.length > 0 ? (
              <ResponsiveContainer width="100%" height={250}>
                <RadarChart data={radarData}>
                  <PolarGrid stroke="hsl(var(--border))" />
                  <PolarAngleAxis 
                    dataKey="squad" 
                    tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 11 }}
                  />
                  <PolarRadiusAxis angle={90} domain={[0, 100]} tick={{ fill: 'hsl(var(--muted-foreground))' }} />
                  <Radar 
                    name="Completion Rate" 
                    dataKey="completionRate" 
                    stroke="hsl(var(--primary))" 
                    fill="hsl(var(--primary))" 
                    fillOpacity={0.5}
                  />
                  <Radar 
                    name="Task Volume" 
                    dataKey="taskCount" 
                    stroke="hsl(var(--accent))" 
                    fill="hsl(var(--accent))" 
                    fillOpacity={0.3}
                  />
                  <Tooltip contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))' }} />
                  <Legend />
                </RadarChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-[250px] text-muted-foreground">
                No squad data available
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Squad Performance Table & Time in Status */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
        <Card className="bg-card shadow-card border-border">
          <CardHeader className="p-4 sm:p-6 pb-3">
            <CardTitle className="text-base sm:text-lg text-foreground">Squad Performance</CardTitle>
          </CardHeader>
          <CardContent className="p-4 sm:p-6 pt-0">
            <div className="space-y-3">
              {squadPerformance.slice(0, 5).map((squad, idx) => (
                <div key={idx} className="space-y-2">
                  <div className="flex justify-between items-center text-sm">
                    <span className="font-medium text-foreground truncate flex-1">{squad.squadName}</span>
                    <span className="text-muted-foreground ml-2">{squad.completionRate.toFixed(0)}%</span>
                  </div>
                  <Progress value={squad.completionRate} className="h-2" />
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>{squad.completedTasks}/{squad.totalTasks} tasks</span>
                    <span>{squad.avgCompletionTime.toFixed(1)} days avg</span>
                  </div>
                </div>
              ))}
              {squadPerformance.length === 0 && (
                <p className="text-sm text-muted-foreground text-center py-4">No squad data available</p>
              )}
            </div>
          </CardContent>
        </Card>

        <Card className="bg-card shadow-card border-border">
          <CardHeader className="p-4 sm:p-6 pb-3">
            <CardTitle className="text-base sm:text-lg text-foreground">Average Time in Status</CardTitle>
          </CardHeader>
          <CardContent className="p-4 sm:p-6 pt-0">
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={timeInStatus} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.3} />
                <XAxis type="number" stroke="hsl(var(--muted-foreground))" fontSize={11} />
                <YAxis 
                  dataKey="status" 
                  type="category" 
                  stroke="hsl(var(--muted-foreground))" 
                  fontSize={11}
                  width={80}
                />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: 'hsl(var(--card))', 
                    border: '1px solid hsl(var(--border))'
                  }}
                  formatter={(value) => [`${value} days`, 'Avg Time']}
                />
                <Bar dataKey="averageTime" fill="hsl(var(--primary))" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Recommendations */}
      {insights.recommendations.length > 0 && (
        <Card className="bg-card shadow-card border-border">
          <CardHeader className="p-4 sm:p-6 pb-3">
            <CardTitle className="text-base sm:text-lg text-foreground flex items-center gap-2">
              <Target className="h-4 w-4 sm:h-5 sm:w-5 text-accent" />
              AI-Powered Recommendations
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 sm:p-6 pt-0">
            <div className="space-y-2">
              {insights.recommendations.map((rec, idx) => (
                <div key={idx} className="flex items-start gap-2 text-sm">
                  <div className="w-1.5 h-1.5 rounded-full bg-accent mt-1.5 flex-shrink-0" />
                  <span className="text-muted-foreground">{rec}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};
