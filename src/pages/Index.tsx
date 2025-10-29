import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, BarChart3, DollarSign } from "lucide-react";

const Index = () => {
  const navigate = useNavigate();

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-primary via-background to-secondary p-4">
      <div className="container mx-auto max-w-6xl">
        <div className="text-center mb-12">
          <h1 className="mb-4 text-5xl font-bold tracking-tight text-foreground">
            Dastak Rider Finance System
          </h1>
          <p className="text-xl text-muted-foreground">
            Complete shift management and financial tracking for delivery riders
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-3 mb-12">
          <Card className="border-2 hover:border-primary transition-colors">
            <CardHeader>
              <Users className="h-10 w-10 text-primary mb-2" />
              <CardTitle>Rider Dashboard</CardTitle>
              <CardDescription>Track your daily shifts and finances</CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>• Select day/night shifts</li>
                <li>• Record order details</li>
                <li>• Auto-calculate balances</li>
                <li>• Submit shift reports</li>
              </ul>
            </CardContent>
          </Card>

          <Card className="border-2 hover:border-secondary transition-colors">
            <CardHeader>
              <BarChart3 className="h-10 w-10 text-secondary mb-2" />
              <CardTitle>Admin Control</CardTitle>
              <CardDescription>Manage all riders and operations</CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>• View all shift entries</li>
                <li>• Approve and close shifts</li>
                <li>• Cash collection tracking</li>
                <li>• Comprehensive reports</li>
              </ul>
            </CardContent>
          </Card>

          <Card className="border-2 hover:border-success transition-colors">
            <CardHeader>
              <DollarSign className="h-10 w-10 text-success mb-2" />
              <CardTitle>Financial Tracking</CardTitle>
              <CardDescription>Complete money management</CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>• Track cash & online payments</li>
                <li>• Manage customer dues</li>
                <li>• Monitor expenses</li>
                <li>• Export detailed reports</li>
              </ul>
            </CardContent>
          </Card>
        </div>

        <div className="flex justify-center">
          <Button 
            size="lg" 
            onClick={() => navigate("/auth")}
            className="text-lg px-8 py-6 shadow-xl hover:shadow-2xl transition-all"
          >
            Get Started
          </Button>
        </div>
      </div>
    </div>
  );
};

export default Index;
