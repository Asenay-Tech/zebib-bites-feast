import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, ShoppingBag, Calendar, DollarSign } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

export default function Dashboard() {
  const [stats, setStats] = useState({
    totalCustomers: 0,
    totalOrders: 0,
    todayReservations: 0,
    totalRevenue: 0,
  });
  const [ordersByDay, setOrdersByDay] = useState<any[]>([]);

  useEffect(() => {
    fetchStats();
    fetchOrdersByDay();
  }, []);

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
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

      const { data } = await supabase
        .from('orders')
        .select('created_at')
        .gte('created_at', sevenDaysAgo.toISOString());

      const orderCounts: Record<string, number> = {};
      
      for (let i = 6; i >= 0; i--) {
        const date = new Date();
        date.setDate(date.getDate() - i);
        const dateStr = date.toISOString().split('T')[0];
        orderCounts[dateStr] = 0;
      }

      data?.forEach((order) => {
        const date = order.created_at.split('T')[0];
        if (orderCounts[date] !== undefined) {
          orderCounts[date]++;
        }
      });

      const chartData = Object.entries(orderCounts).map(([date, count]) => ({
        date: new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        orders: count,
      }));

      setOrdersByDay(chartData);
    } catch (error) {
      console.error('Error fetching orders by day:', error);
    }
  };

  const statCards = [
    { title: "Total Customers", value: stats.totalCustomers, icon: Users, color: "text-blue-500" },
    { title: "Total Orders", value: stats.totalOrders, icon: ShoppingBag, color: "text-green-500" },
    { title: "Today's Reservations", value: stats.todayReservations, icon: Calendar, color: "text-purple-500" },
    { title: "Total Revenue", value: `€${stats.totalRevenue.toFixed(2)}`, icon: DollarSign, color: "text-yellow-500" },
  ];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Dashboard</h1>
        <p className="text-muted-foreground">Overview of your restaurant</p>
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
        <CardHeader>
          <CardTitle>Orders (Last 7 Days)</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={ordersByDay}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey="date" stroke="hsl(var(--muted-foreground))" />
              <YAxis stroke="hsl(var(--muted-foreground))" />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: 'hsl(var(--surface))',
                  border: '1px solid hsl(var(--border))',
                  borderRadius: '8px'
                }}
              />
              <Bar dataKey="orders" fill="hsl(var(--primary))" />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  );
}
