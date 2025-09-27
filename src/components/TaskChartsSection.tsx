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

export const TaskChartsSection = ({ metrics }: TaskChartsSectionProps) => {
  const statusData = Object.entries(metrics.statusDistribution).map(([status, count]) => ({
    name: status,
    value: count,
    color: COLORS[status as keyof typeof COLORS]
  }));

  const weeklyData = metrics.weeklyCompletions.map((completions, index) => ({
    week: `Week ${index + 1}`,
    completions
  }));

  const taskTypeData = [
    { name: 'Project Tasks', value: metrics.projectTasksCount, color: 'hsl(var(--primary))' },
    { name: 'Ad-Hoc Tasks', value: metrics.adHocTasksCount, color: 'hsl(var(--accent))' }
  ];

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
      <Card className="bg-card shadow-card border-border">
        <CardHeader>
          <CardTitle className="text-foreground">Task Status Distribution</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={200}>
            <PieChart>
              <Pie
                data={statusData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                outerRadius={60}
                fill="#8884d8"
                dataKey="value"
              >
                {statusData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <Card className="bg-card shadow-card border-border">
        <CardHeader>
          <CardTitle className="text-foreground">Weekly Completions</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={weeklyData}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey="week" stroke="hsl(var(--muted-foreground))" />
              <YAxis stroke="hsl(var(--muted-foreground))" />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: 'hsl(var(--card))', 
                  border: '1px solid hsl(var(--border))',
                  borderRadius: '8px'
                }} 
              />
              <Bar dataKey="completions" fill="hsl(var(--primary))" />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <Card className="bg-card shadow-card border-border">
        <CardHeader>
          <CardTitle className="text-foreground">Task Type Breakdown</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={200}>
            <PieChart>
              <Pie
                data={taskTypeData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                outerRadius={60}
                fill="#8884d8"
                dataKey="value"
              >
                {taskTypeData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  );
};