import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { CheckCircle } from "lucide-react";

const DuesManagement = () => {
  const [dues, setDues] = useState<any[]>([]);

  useEffect(() => {
    loadDues();
  }, []);

  const loadDues = async () => {
    const { data } = await supabase
      .from("dues")
      .select(`
        *,
        profiles:rider_id (full_name)
      `)
      .order("created_at", { ascending: false });

    if (data) {
      setDues(data);
    }
  };

  const handleMarkPaid = async (dueId: string) => {
    const { error } = await supabase
      .from("dues")
      .update({ status: "paid" })
      .eq("id", dueId);

    if (error) {
      toast.error("Failed to mark as paid");
      return;
    }

    toast.success("Due marked as paid!");
    loadDues();
  };

  const pendingDues = dues.filter((d) => d.status === "pending");
  const totalPending = pendingDues.reduce((sum, d) => sum + d.amount, 0);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>Pending Customer Dues</span>
          <Badge variant="destructive" className="text-lg">
            Total: Rs {totalPending}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Customer</TableHead>
                <TableHead>Rider</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead>Due Date</TableHead>
                <TableHead>Notes</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {dues.map((due) => (
                <TableRow key={due.id}>
                  <TableCell className="font-medium">{due.customer_name}</TableCell>
                  <TableCell>{due.profiles?.full_name}</TableCell>
                  <TableCell className="font-bold">Rs {due.amount}</TableCell>
                  <TableCell>{new Date(due.due_date).toLocaleDateString()}</TableCell>
                  <TableCell>{due.notes || "-"}</TableCell>
                  <TableCell>
                    <Badge variant={due.status === "pending" ? "destructive" : "default"}>
                      {due.status}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {due.status === "pending" && (
                      <Button
                        size="sm"
                        onClick={() => handleMarkPaid(due.id)}
                      >
                        <CheckCircle className="mr-1 h-4 w-4" />
                        Mark Paid
                      </Button>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
};

export default DuesManagement;
