import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { CheckCircle, XCircle } from "lucide-react";

interface RiderEntriesTableProps {
  onUpdate: () => void;
}

const RiderEntriesTable = ({ onUpdate }: RiderEntriesTableProps) => {
  const [entries, setEntries] = useState<any[]>([]);

  useEffect(() => {
    loadEntries();
  }, []);

  const loadEntries = async () => {
    const { data } = await supabase
      .from("rider_entries")
      .select(`
        *,
        profiles:rider_id (full_name, email)
      `)
      .order("created_at", { ascending: false });

    if (data) {
      setEntries(data);
    }
  };

  const handleCloseShift = async (entryId: string, riderId: string, closingBalance: number) => {
    const { error } = await supabase
      .from("rider_entries")
      .update({ status: "closed" })
      .eq("id", entryId);

    if (error) {
      toast.error("Failed to close shift");
      return;
    }

    toast.success("Shift closed successfully!");
    loadEntries();
    onUpdate();
  };

  const handleCollectCash = async (entryId: string) => {
    const { error } = await supabase
      .from("rider_entries")
      .update({ 
        other_expense_amount: 0,
        cash_collected: true 
      })
      .eq("id", entryId);

    if (error) {
      toast.error("Failed to collect cash");
      return;
    }

    toast.success("Cash collected successfully!");
    loadEntries();
    onUpdate();
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>All Shift Entries</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Rider</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Shift</TableHead>
                <TableHead>Orders</TableHead>
                <TableHead>Other Expense</TableHead>
                <TableHead>Online Payments</TableHead>
                <TableHead>Closing Balance</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {entries.map((entry) => {
                const onlinePayments = entry.online_payments as Array<{name: string, amount: number}> || [];
                const totalOnline = onlinePayments.reduce((sum, p) => sum + p.amount, 0);
                
                return (
                  <TableRow key={entry.id}>
                    <TableCell className="font-medium">{entry.profiles?.full_name}</TableCell>
                    <TableCell>{new Date(entry.entry_date).toLocaleDateString()}</TableCell>
                    <TableCell>
                      <Badge variant={entry.shift === "day" ? "default" : "secondary"}>
                        {entry.shift}
                      </Badge>
                    </TableCell>
                    <TableCell>{entry.orders_60 + entry.orders_100 + entry.orders_150}</TableCell>
                    <TableCell>
                      {entry.other_expense_name ? (
                        <span>{entry.other_expense_name}: Rs {entry.other_expense_amount}</span>
                      ) : (
                        <span>Rs {entry.other_expense_amount}</span>
                      )}
                    </TableCell>
                    <TableCell>
                      {onlinePayments.length > 0 ? (
                        <div className="space-y-1">
                          {onlinePayments.map((p, i) => (
                            <div key={i} className="text-sm">
                              {p.name}: Rs {p.amount}
                            </div>
                          ))}
                          <div className="font-bold text-sm border-t pt-1">Total: Rs {totalOnline}</div>
                        </div>
                      ) : (
                        <span>Rs 0</span>
                      )}
                    </TableCell>
                    <TableCell className="font-bold">Rs {entry.closing_balance}</TableCell>
                    <TableCell>
                      <Badge variant={entry.status === "open" ? "destructive" : "default"}>
                        {entry.status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        {entry.status === "open" && (
                          <Button
                            size="sm"
                            onClick={() => handleCloseShift(entry.id, entry.rider_id, entry.closing_balance)}
                          >
                            <CheckCircle className="mr-1 h-4 w-4" />
                            Close
                          </Button>
                        )}
                        {entry.other_expense_amount > 0 && !entry.cash_collected && (
                          <Button
                            size="sm"
                            variant="secondary"
                            onClick={() => handleCollectCash(entry.id)}
                          >
                            Collect Cash
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
};

export default RiderEntriesTable;
