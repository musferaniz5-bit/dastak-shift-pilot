import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { toast } from "sonner";
import { UserPlus } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";

const RiderManagement = () => {
  const [riders, setRiders] = useState<any[]>([]);
  const [open, setOpen] = useState(false);
  const [newRider, setNewRider] = useState({ email: "", password: "", fullName: "" });

  useEffect(() => {
    loadRiders();
  }, []);

  const loadRiders = async () => {
    const { data } = await supabase
      .from("user_roles")
      .select(`
        user_id,
        role,
        profiles:user_id (full_name, email)
      `)
      .eq("role", "rider");

    if (data) {
      setRiders(data);
    }
  };

  const handleAddRider = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const redirectUrl = `${window.location.origin}/`;
      
      const { data, error } = await supabase.auth.signUp({
        email: newRider.email,
        password: newRider.password,
        options: {
          emailRedirectTo: redirectUrl,
          data: {
            full_name: newRider.fullName,
          },
        },
      });

      if (error) throw error;

      if (data.user) {
        // Add rider role
        const { error: roleError } = await supabase
          .from("user_roles")
          .insert({
            user_id: data.user.id,
            role: "rider",
          });

        if (roleError) throw roleError;
      }

      toast.success("Rider added successfully!");
      setNewRider({ email: "", password: "", fullName: "" });
      setOpen(false);
      loadRiders();
    } catch (error: any) {
      toast.error(error.message || "Failed to add rider");
    }
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Manage Riders</CardTitle>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button>
              <UserPlus className="mr-2 h-4 w-4" />
              Add Rider
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add New Rider</DialogTitle>
              <DialogDescription>Create a new rider account</DialogDescription>
            </DialogHeader>
            <form onSubmit={handleAddRider} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="fullName">Full Name</Label>
                <Input
                  id="fullName"
                  value={newRider.fullName}
                  onChange={(e) => setNewRider({ ...newRider, fullName: e.target.value })}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={newRider.email}
                  onChange={(e) => setNewRider({ ...newRider, email: e.target.value })}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  value={newRider.password}
                  onChange={(e) => setNewRider({ ...newRider, password: e.target.value })}
                  required
                />
              </div>
              <Button type="submit" className="w-full">Create Rider</Button>
            </form>
          </DialogContent>
        </Dialog>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Role</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {riders.map((rider) => (
              <TableRow key={rider.user_id}>
                <TableCell className="font-medium">{rider.profiles?.full_name}</TableCell>
                <TableCell>{rider.profiles?.email}</TableCell>
                <TableCell>
                  <span className="capitalize">{rider.role}</span>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
};

export default RiderManagement;
