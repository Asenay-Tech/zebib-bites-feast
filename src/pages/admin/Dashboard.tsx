import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, ShoppingBag, Calendar, DollarSign, Download, Activity } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AdminBreadcrumb } from "@/components/admin/Breadcrumb";
import { toast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";

interface ActivityLog {
  id: string;
  user_email: string;
  user_role: string;
  action: string;
  entity_type: string;
  created_at: string;
}

export default function Dashboard() {
  const [stats, setStats] = useState({
    totalCustomers: 0,
    totalOrders: 0,
    todayReservations: 0,
    totalRevenue: 0,
  });
  const [ordersByDay, setOrdersByDay] = useState<any[]>([]);
  const [timeRange, setTimeRange] = useState("7");
  const [recentActivity, setRecentActivity] = useState<ActivityLog[]>([]);

  useEffect(() => {
    fetchStats();
    fetchOrdersByDay();
    fetchRecentActivity();

    // Auto-refresh every 60 seconds
    const interval = setInterval(() => {
      fetchStats();
      fetchOrdersByDay();
      fetchRecentActivity();
    }, 60000);

    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    fetchOrdersByDay();
  }, [timeRange]);

  const fetchStats = async () => {
    try {
      const { count: customersCount } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true });

      const { count: ordersCount } = await supabase
        .from('orders')
        .select('*', { count: 'exact', head: true });

      const today = new Date().toISOString().split('T')[0];
      const { count: reservationsCount } = await supabase
        .from('reservations')
        .select('*', { count: 'exact', head: true })
        .eq('date', today);

      const { data: orders } = await supabase
        .from('orders')
        .select('total_amount_cents');

      const revenue = orders?.reduce((sum, order) => sum + order.total_amount_cents, 0) || 0;

      setStats({
        totalCustomers: customersCount || 0,
        totalOrders: ordersCount || 0,
        todayReservations: reservationsCount || 0,
        totalRevenue: revenue / 100,
      });
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  };

  const fetchOrdersByDay = async () => {
    try {
      const daysAgo = parseInt(timeRange);
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - daysAgo);

      const { data } = await supabase
        .from('orders')
        .select('created_at, total_amount_cents')
        .gte('created_at', startDate.toISOString());

      const orderCounts: Record<string, { count: number; revenue: number }> = {};
      
      for (let i = daysAgo - 1; i >= 0; i--) {
        const date = new Date();
        date.setDate(date.getDate() - i);
        const dateStr = date.toISOString().split('T')[0];
        orderCounts[dateStr] = { count: 0, revenue: 0 };
      }

      data?.forEach((order) => {
        const date = order.created_at.split('T')[0];
        if (orderCounts[date] !== undefined) {
          orderCounts[date].count++;
          orderCounts[date].revenue += order.total_amount_cents / 100;
        }
      });

      const chartData = Object.entries(orderCounts).map(([date, data]) => ({
        date: new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        orders: data.count,
        revenue: data.revenue,
      }));

      setOrdersByDay(chartData);
    } catch (error) {
      console.error('Error fetching orders by day:', error);
    }
  };

  const fetchRecentActivity = async () => {
    try {
      const { data } = await supabase
        .from('activity_log')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(10);

      setRecentActivity(data || []);
    } catch (error) {
      console.error('Error fetching recent activity:', error);
    }
  };

  const exportData = () => {
    const csvContent = [
      ['Metric', 'Value'],
      ['Total Customers', stats.totalCustomers],
      ['Total Orders', stats.totalOrders],
      ["Today's Reservations", stats.todayReservations],
      ['Total Revenue (€)', stats.totalRevenue.toFixed(2)],
      [''],
      ['Date', 'Orders', 'Revenue (€)'],
      ...ordersByDay.map(day => [day.date, day.orders, day.revenue?.toFixed(2) || '0.00'])
    ].map(row => row.join(',')).join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `dashboard_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();

    toast({
      title: "Data exported successfully",
    });
  };

  const statCards = [
    { title: "Total Customers", value: stats.totalCustomers, icon: Users, color: "text-blue-500" },
    { title: "Total Orders", value: stats.totalOrders, icon: ShoppingBag, color: "text-green-500" },
    { title: "Today's Reservations", value: stats.todayReservations, icon: Calendar, color: "text-purple-500" },
    { title: "Total Revenue", value: `€${stats.totalRevenue.toFixed(2)}`, icon: DollarSign, color: "text-yellow-500" },
  ];

  return (
    <div className="space-y-8">
      <AdminBreadcrumb />
      
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Dashboard</h1>
          <p className="text-muted-foreground">Overview of your restaurant</p>
        </div>
        <Button onClick={exportData} className="gap-2">
          <Download className="h-4 w-4" />
          Export Data
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {statCards.map((stat) => {
          const Icon = stat.icon;
          return (
            <Card key={stat.title}>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  {stat.title}
                </CardTitle>
                <Icon className={`h-5 w-5 ${stat.color}`} />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-foreground">{stat.value}</div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Orders & Revenue</CardTitle>
          <Select value={timeRange} onValueChange={setTimeRange}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Select time range" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7">Last 7 Days</SelectItem>
              <SelectItem value="14">Last 14 Days</SelectItem>
              <SelectItem value="30">Last 30 Days</SelectItem>
              <SelectItem value="90">Last 90 Days</SelectItem>
            </SelectContent>
          </Select>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={ordersByDay}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey="date" stroke="hsl(var(--muted-foreground))" />
              <YAxis stroke="hsl(var(--muted-foreground))" />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: 'hsl(var(--card))',
                  border: '1px solid hsl(var(--border))',
                  borderRadius: '8px',
                  color: 'hsl(var(--foreground))'
                }}
              />
              <Bar dataKey="orders" fill="hsl(var(--primary))" name="Orders" />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Activity className="h-5 w-5 text-primary" />
            <CardTitle>Recent Activity</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {recentActivity.length === 0 ? (
              <p className="text-muted-foreground text-center py-4">No recent activity</p>
            ) : (
              recentActivity.map((activity) => (
                <div key={activity.id} className="flex items-start gap-4 border-l-2 border-primary/20 pl-4 py-2">
                  <div className="flex-1">
                    <p className="text-sm font-medium">
                      <Badge variant="outline" className="mr-2">{activity.user_role}</Badge>
                      {activity.user_email}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {activity.action} • {activity.entity_type}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {new Date(activity.created_at).toLocaleString()}
                    </p>
                  </div>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
