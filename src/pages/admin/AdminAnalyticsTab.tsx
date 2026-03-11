import { useState, useEffect } from 'react';
import { Loader2 } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import {
  fetchSignupTrend,
  fetchPlanDistribution,
  type SignupDataPoint,
  type PlanDistribution,
} from '@/services/analyticsService';

const COLORS = ['hsl(var(--muted))', 'hsl(var(--primary))', 'hsl(var(--accent))'];

const AdminAnalyticsTab = () => {
  const [signupData, setSignupData] = useState<SignupDataPoint[]>([]);
  const [planData, setPlanData] = useState<PlanDistribution[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([fetchSignupTrend(30), fetchPlanDistribution()])
      .then(([signups, plans]) => {
        setSignupData(signups);
        setPlanData(plans);
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
    <section className="space-y-8">
      <div>
        <h2 className="font-display text-xl font-bold uppercase mb-4">Signups (Last 30 Days)</h2>
        <div className="bg-card border border-border rounded-xl p-4 h-[300px]">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={signupData}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis
                dataKey="date"
                tick={{ fontSize: 11 }}
                tickFormatter={(val) => {
                  const d = new Date(val);
                  return `${d.getMonth() + 1}/${d.getDate()}`;
                }}
              />
              <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
              <Tooltip
                contentStyle={{
                  background: 'hsl(var(--card))',
                  border: '1px solid hsl(var(--border))',
                  borderRadius: '8px',
                  fontSize: 12,
                }}
              />
              <Area
                type="monotone"
                dataKey="count"
                stroke="hsl(var(--primary))"
                fill="hsl(var(--primary))"
                fillOpacity={0.15}
                strokeWidth={2}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div>
        <h2 className="font-display text-xl font-bold uppercase mb-4">Subscription Distribution</h2>
        <div className="bg-card border border-border rounded-xl p-4 h-[300px] flex items-center justify-center">
          {planData.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={planData}
                  dataKey="count"
                  nameKey="plan"
                  cx="50%"
                  cy="50%"
                  outerRadius={100}
                  label={({ plan, count }) => `${plan}: ${count}`}
                >
                  {planData.map((_entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <p className="text-muted-foreground text-sm">No subscription data yet.</p>
          )}
        </div>
      </div>
    </section>
  );
};

export default AdminAnalyticsTab;
