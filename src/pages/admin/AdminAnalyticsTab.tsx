import { useState, useEffect } from 'react';
import { Loader2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { fetchSignupsOverTime, fetchPlanDistribution, type SignupDataPoint, type PlanDistribution } from '@/services/analyticsService';

const PLAN_COLORS: Record<string, string> = {
  free: '#94a3b8',
  pro: '#00E5FF',
  premium: '#a855f7',
};

const AdminAnalyticsTab = () => {
  const [signups, setSignups] = useState<SignupDataPoint[]>([]);
  const [planDist, setPlanDist] = useState<PlanDistribution[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([fetchSignupsOverTime(30), fetchPlanDistribution()])
      .then(([s, p]) => {
        setSignups(s);
        setPlanDist(p);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-6 h-6 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <section className="space-y-6">
      <h2 className="font-display text-xl font-bold uppercase">Analytics</h2>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Signups over time */}
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-semibold">Signups (Last 30 Days)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={signups}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis
                    dataKey="date"
                    tick={{ fontSize: 10 }}
                    tickFormatter={(d: string) => d.slice(5)}
                  />
                  <YAxis tick={{ fontSize: 10 }} allowDecimals={false} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'hsl(var(--card))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: 8,
                      fontSize: 12,
                    }}
                  />
                  <Bar dataKey="count" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Plan distribution */}
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-semibold">Subscription Distribution</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64 flex items-center justify-center">
              {planDist.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={planDist}
                      dataKey="count"
                      nameKey="plan"
                      cx="50%"
                      cy="50%"
                      outerRadius={80}
                      label={({ plan, count }: { plan: string; count: number }) => `${plan}: ${count}`}
                    >
                      {planDist.map((entry) => (
                        <Cell key={entry.plan} fill={PLAN_COLORS[entry.plan] || '#94a3b8'} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <p className="text-muted-foreground text-sm">No subscription data yet</p>
              )}
            </div>
            <div className="flex justify-center gap-4 mt-2">
              {planDist.map((entry) => (
                <div key={entry.plan} className="flex items-center gap-1.5 text-xs">
                  <div
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: PLAN_COLORS[entry.plan] || '#94a3b8' }}
                  />
                  <span className="capitalize">{entry.plan}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </section>
  );
};

export default AdminAnalyticsTab;
