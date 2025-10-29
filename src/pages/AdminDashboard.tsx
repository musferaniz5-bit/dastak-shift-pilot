import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";
import { LogOut, Users, DollarSign, TrendingUp, AlertCircle } from "lucide-react";
import RiderEntriesTable from "@/components/admin/RiderEntriesTable";
import DuesManagement from "@/components/admin/DuesManagement";
import RiderManagement from "@/components/admin/RiderManagement";
import OrderSettings from "@/components/admin/OrderSettings";

const AdminDashboard = () => {
  const navigate = useNavigate();
  const [stats, setStats] = useState({
    totalOrders: 0,
    totalOnline: 0,
    totalCash: 0,
    totalCommission: 0,
    totalExpenses: 0,
  });

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    const { data: entries } = await supabase
      .from("rider_entries")
      .select("*");

    if (entries) {
      const totalOrders = entries.reduce((sum, e) => sum + e.orders_60 + e.orders_100 + e.orders_150, 0);
      const totalOnline = entries.reduce((sum, e) => sum + e.online_payment, 0);
      const totalCash = entries.reduce((sum, e) => sum + e.cash_orders, 0);
      const totalCommission = entries.reduce((sum, e) => sum + e.commission, 0);
      const totalExpenses = entries.reduce((sum, e) => sum + e.petrol_expense + e.other_fee, 0);

      setStats({ totalOrders, totalOnline, totalCash, totalCommission, totalExpenses });
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate("/auth");
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-accent to-background p-4">
      <div className="container mx-auto max-w-7xl">
        <div className="mb-6 flex items-center justify-between">
          <h1 className="text-3xl font-bold">Admin Dashboard</h1>
          <Button variant="outline" onClick={handleLogout}>
            <LogOut className="mr-2 h-4 w-4" />
            Logout
          </Button>
        </div>

        <div className="mb-6 grid gap-4 md:grid-cols-5">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Orders</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalOrders}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Online Payment</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">Rs {stats.totalOnline}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Cash Collected</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">Rs {stats.totalCash}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Commission</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">Rs {stats.totalCommission}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Expenses</CardTitle>
              <AlertCircle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">Rs {stats.totalExpenses}</div>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="entries" className="space-y-4">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="entries">Shift Entries</TabsTrigger>
            <TabsTrigger value="riders">Manage Riders</TabsTrigger>
            <TabsTrigger value="dues">Dues</TabsTrigger>
            <TabsTrigger value="settings">Settings</TabsTrigger>
          </TabsList>

          <TabsContent value="entries">
            <RiderEntriesTable onUpdate={loadStats} />
          </TabsContent>

          <TabsContent value="riders">
            <RiderManagement />
          </TabsContent>

          <TabsContent value="dues">
            <DuesManagement />
          </TabsContent>

          <TabsContent value="settings">
            <OrderSettings />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default AdminDashboard;
