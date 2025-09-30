import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TaskMetrics } from "@/types";
import { PieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from 'recharts';

interface TaskChartsSectionProps {
  metrics: TaskMetrics;
}

const COLORS = {
  'To Do': 'hsl(var(--muted-foreground))',
  'In Progress': 'hsl(var(--primary))',
  'Blocked': 'hsl(var(--destructive))',
  'Testing': 'hsl(var(--warning))',
  'Complete': 'hsl(var(--success))'
};

const ENHANCED_COLORS = {
  'To Do': '#64748b',
  'In Progress': '#3b82f6', 
  'Blocked': '#ef4444',
  'Testing': '#f59e0b',
  'Complete': '#10b981'
};

export const TaskChartsSection = ({ metrics }: TaskChartsSectionProps) => {
  const statusData = Object.entries(metrics.statusDistribution).map(([status, count]) => ({
    name: status,
    value: count,
    color: COLORS[status as keyof typeof COLORS]
  }));

  const weeklyData = metrics.weeklyCompletions.map((completions, index) => ({
    week: `Week ${5 - index}`, // Show as Week 1 (oldest) to Week 5 (newest)
    completions
  })).reverse(); // Reverse to show chronologically

  const taskTypeData = [
    { name: 'Project Tasks', value: metrics.projectTasksCount, color: 'hsl(var(--primary))' },
    { name: 'Ad-Hoc Tasks', value: metrics.adHocTasksCount, color: 'hsl(var(--accent))' }
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 mb-6">
      <Card className="bg-gradient-to-br from-card to-card-elevated shadow-elevated border-border hover:shadow-glow transition-all duration-300">
        <CardHeader className="pb-3">
          <CardTitle className="text-foreground flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-gradient-primary"></div>
            Task Status Distribution
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={220}>
            <PieChart>
              <Pie
                data={statusData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                outerRadius={75}
                innerRadius={30}
                fill="#8884d8"
                dataKey="value"
                stroke="hsl(var(--background))"
                strokeWidth={2}
              >
                {statusData.map((entry, index) => (
                  <Cell 
                    key={`cell-${index}`} 
                    fill={ENHANCED_COLORS[entry.name as keyof typeof ENHANCED_COLORS] || entry.color} 
                  />
                ))}
              </Pie>
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: 'hsl(var(--popover))', 
                  border: '1px solid hsl(var(--border))',
                  borderRadius: '8px',
                  boxShadow: 'var(--shadow-card)',
                  color: 'hsl(var(--popover-foreground))'
                }}
                itemStyle={{
                  color: 'hsl(var(--popover-foreground))'
                }}
                labelStyle={{
                  color: 'hsl(var(--popover-foreground))',
                  fontWeight: 600
                }}
              />
            </PieChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <Card className="bg-gradient-to-br from-card to-card-elevated shadow-elevated border-border hover:shadow-glow transition-all duration-300">
        <CardHeader className="pb-3">
          <CardTitle className="text-foreground flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-gradient-accent"></div>
            Weekly Completions Trend
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={weeklyData} margin={{ top: 10, right: 10, left: 10, bottom: 10 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.3} />
              <XAxis 
                dataKey="week" 
                stroke="hsl(var(--muted-foreground))" 
                fontSize={12}
                tick={{ fill: 'hsl(var(--muted-foreground))' }}
              />
              <YAxis 
                stroke="hsl(var(--muted-foreground))" 
                fontSize={12}
                tick={{ fill: 'hsl(var(--muted-foreground))' }}
              />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: 'hsl(var(--popover))', 
                  border: '1px solid hsl(var(--border))',
                  borderRadius: '8px',
                  boxShadow: 'var(--shadow-card)',
                  color: 'hsl(var(--popover-foreground))'
                }}
                itemStyle={{
                  color: 'hsl(var(--popover-foreground))'
                }}
                labelStyle={{
                  color: 'hsl(var(--popover-foreground))',
                  fontWeight: 600
                }}
              />
              <Bar 
                dataKey="completions" 
                fill="url(#barGradient)" 
                radius={[4, 4, 0, 0]}
                stroke="hsl(var(--primary))"
                strokeWidth={1}
              />
              <defs>
                <linearGradient id="barGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity={1} />
                  <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity={0.6} />
                </linearGradient>
              </defs>
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <Card className="bg-gradient-to-br from-card to-card-elevated shadow-elevated border-border hover:shadow-glow transition-all duration-300">
        <CardHeader className="pb-3">
          <CardTitle className="text-foreground flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-gradient-to-r from-primary to-accent"></div>
            Task Type Analysis
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={220}>
            <PieChart>
              <Pie
                data={taskTypeData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                outerRadius={75}
                innerRadius={35}
                fill="#8884d8"
                dataKey="value"
                stroke="hsl(var(--background))"
                strokeWidth={3}
              >
                {taskTypeData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: 'hsl(var(--popover))', 
                  border: '1px solid hsl(var(--border))',
                  borderRadius: '8px',
                  boxShadow: 'var(--shadow-card)',
                  color: 'hsl(var(--popover-foreground))'
                }}
                itemStyle={{
                  color: 'hsl(var(--popover-foreground))'
                }}
                labelStyle={{
                  color: 'hsl(var(--popover-foreground))',
                  fontWeight: 600
                }}
              />
            </PieChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  );
};