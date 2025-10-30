import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";
import { LogOut, Sun, Moon, Plus, Trash2 } from "lucide-react";

const RiderDashboard = () => {
  const navigate = useNavigate();
  const [userId, setUserId] = useState<string>("");
  const [shift, setShift] = useState<"day" | "night">("day");
  const [openBalance, setOpenBalance] = useState("");
  const [orders60, setOrders60] = useState("");
  const [orders100, setOrders100] = useState("");
  const [orders150, setOrders150] = useState("");
  const [commission, setCommission] = useState("");
  const [otherFee, setOtherFee] = useState("");
  const [petrolExpense, setPetrolExpense] = useState("");
  const [chaiExpense, setChaiExpense] = useState("");
  const [otherExpenseName, setOtherExpenseName] = useState("");
  const [otherExpenseAmount, setOtherExpenseAmount] = useState("");
  const [onlinePayments, setOnlinePayments] = useState<Array<{name: string, amount: string}>>([{name: "", amount: ""}]);
  const [notes, setNotes] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [orderSettings, setOrderSettings] = useState({ fee_60: 60, fee_100: 100, fee_150: 150 });

  useEffect(() => {
    loadUserData();
    loadOrderSettings();
    determineShift();
  }, []);

  const loadUserData = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      setUserId(user.id);
      await loadLastClosingBalance(user.id);
    }
  };

  const loadLastClosingBalance = async (userId: string) => {
    const { data } = await supabase
      .from("rider_entries")
      .select("closing_balance")
      .eq("rider_id", userId)
      .eq("status", "closed")
      .order("created_at", { ascending: false })
      .limit(1)
      .single();

    if (data) {
      setOpenBalance(data.closing_balance.toString());
    }
  };

  const loadOrderSettings = async () => {
    const { data } = await supabase
      .from("order_settings")
      .select("*")
      .single();

    if (data) {
      setOrderSettings(data);
    }
  };

  const determineShift = () => {
    const hour = new Date().getHours();
    if (hour >= 9 && hour < 18) {
      setShift("day");
    } else {
      setShift("night");
    }
  };

  const calculateTotals = () => {
    const baseTotal =
      (parseInt(orders60) || 0) * orderSettings.fee_60 +
      (parseInt(orders100) || 0) * orderSettings.fee_100 +
      (parseInt(orders150) || 0) * orderSettings.fee_150;

    const totalOnlinePayments = onlinePayments.reduce((sum, payment) => 
      sum + (parseInt(payment.amount) || 0), 0
    );

    const closingBalance =
      (parseInt(openBalance) || 0) +
      baseTotal +
      (parseInt(commission) || 0) +
      (parseInt(otherFee) || 0) -
      (parseInt(petrolExpense) || 0) -
      (parseInt(chaiExpense) || 0) -
      (parseInt(otherExpenseAmount) || 0) +
      totalOnlinePayments;

    return { baseTotal, closingBalance };
  };

  const addOnlinePayment = () => {
    setOnlinePayments([...onlinePayments, {name: "", amount: ""}]);
  };

  const removeOnlinePayment = (index: number) => {
    if (onlinePayments.length > 1) {
      setOnlinePayments(onlinePayments.filter((_, i) => i !== index));
    }
  };

  const updateOnlinePayment = (index: number, field: 'name' | 'amount', value: string) => {
    const updated = [...onlinePayments];
    updated[index][field] = value;
    setOnlinePayments(updated);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const { closingBalance } = calculateTotals();

      const paymentsData = onlinePayments
        .filter(p => p.name.trim() && p.amount)
        .map(p => ({name: p.name, amount: parseInt(p.amount) || 0}));

      const { error } = await supabase.from("rider_entries").insert({
        rider_id: userId,
        shift,
        open_balance: parseInt(openBalance) || 0,
        orders_60: parseInt(orders60) || 0,
        orders_100: parseInt(orders100) || 0,
        orders_150: parseInt(orders150) || 0,
        commission: parseInt(commission) || 0,
        other_fee: parseInt(otherFee) || 0,
        petrol_expense: parseInt(petrolExpense) || 0,
        chai_expense: parseInt(chaiExpense) || 0,
        other_expense_name: otherExpenseName,
        other_expense_amount: parseInt(otherExpenseAmount) || 0,
        online_payments: paymentsData,
        closing_balance: closingBalance,
        notes,
        status: "open",
      });

      if (error) throw error;

      toast.success("Shift report submitted successfully!");
      
      // Reset form
      setOrders60("");
      setOrders100("");
      setOrders150("");
      setCommission("");
      setOtherFee("");
      setPetrolExpense("");
      setChaiExpense("");
      setOtherExpenseName("");
      setOtherExpenseAmount("");
      setOnlinePayments([{name: "", amount: ""}]);
      setNotes("");
    } catch (error: any) {
      toast.error(error.message || "Failed to submit report");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate("/auth");
  };

  const { baseTotal, closingBalance } = calculateTotals();

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-accent to-background p-4">
      <div className="container mx-auto max-w-4xl">
        <div className="mb-6 flex items-center justify-between">
          <h1 className="text-3xl font-bold">Rider Dashboard</h1>
          <Button variant="outline" onClick={handleLogout}>
            <LogOut className="mr-2 h-4 w-4" />
            Logout
          </Button>
        </div>

        <Card className="shadow-2xl">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              {shift === "day" ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
              {shift === "day" ? "Day Shift" : "Night Shift"} Report
            </CardTitle>
            <CardDescription>
              {shift === "day" ? "09:00 - 18:00" : "18:00 - 02:00"}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="openBalance">Open Balance (Rs)</Label>
                <Input
                  id="openBalance"
                  type="number"
                  value={openBalance}
                  onChange={(e) => setOpenBalance(e.target.value)}
                  placeholder="3000"
                  required
                />
              </div>

              <div className="grid gap-4 md:grid-cols-3">
                <div className="space-y-2">
                  <Label htmlFor="orders60">Rs60 Orders</Label>
                  <Input
                    id="orders60"
                    type="number"
                    value={orders60}
                    onChange={(e) => setOrders60(e.target.value)}
                    placeholder="0"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="orders100">Rs100 Orders</Label>
                  <Input
                    id="orders100"
                    type="number"
                    value={orders100}
                    onChange={(e) => setOrders100(e.target.value)}
                    placeholder="0"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="orders150">Rs150 Orders</Label>
                  <Input
                    id="orders150"
                    type="number"
                    value={orders150}
                    onChange={(e) => setOrders150(e.target.value)}
                    placeholder="0"
                  />
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="commission">Commission (Rs)</Label>
                  <Input
                    id="commission"
                    type="number"
                    value={commission}
                    onChange={(e) => setCommission(e.target.value)}
                    placeholder="0"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="otherFee">Other Fee (Rs)</Label>
                  <Input
                    id="otherFee"
                    type="number"
                    value={otherFee}
                    onChange={(e) => setOtherFee(e.target.value)}
                    placeholder="0"
                  />
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="petrolExpense">Petrol Expense (Rs)</Label>
                  <Input
                    id="petrolExpense"
                    type="number"
                    value={petrolExpense}
                    onChange={(e) => setPetrolExpense(e.target.value)}
                    placeholder="0"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="chaiExpense">Chai Expense (Rs)</Label>
                  <Input
                    id="chaiExpense"
                    type="number"
                    value={chaiExpense}
                    onChange={(e) => setChaiExpense(e.target.value)}
                    placeholder="0"
                  />
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="otherExpenseName">Other Expense Name</Label>
                  <Input
                    id="otherExpenseName"
                    type="text"
                    value={otherExpenseName}
                    onChange={(e) => setOtherExpenseName(e.target.value)}
                    placeholder="e.g., Maintenance, Toll"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="otherExpenseAmount">Other Expense Amount (Rs)</Label>
                  <Input
                    id="otherExpenseAmount"
                    type="number"
                    value={otherExpenseAmount}
                    onChange={(e) => setOtherExpenseAmount(e.target.value)}
                    placeholder="0"
                  />
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <Label>Online Payments</Label>
                  <Button type="button" size="sm" onClick={addOnlinePayment} variant="outline">
                    <Plus className="mr-2 h-4 w-4" />
                    Add Payment
                  </Button>
                </div>
                {onlinePayments.map((payment, index) => (
                  <div key={index} className="grid gap-4 md:grid-cols-[1fr_1fr_auto] items-end">
                    <div className="space-y-2">
                      <Label htmlFor={`paymentName${index}`}>Name</Label>
                      <Input
                        id={`paymentName${index}`}
                        type="text"
                        value={payment.name}
                        onChange={(e) => updateOnlinePayment(index, 'name', e.target.value)}
                        placeholder="Customer name"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor={`paymentAmount${index}`}>Amount (Rs)</Label>
                      <Input
                        id={`paymentAmount${index}`}
                        type="number"
                        value={payment.amount}
                        onChange={(e) => updateOnlinePayment(index, 'amount', e.target.value)}
                        placeholder="0"
                      />
                    </div>
                    {onlinePayments.length > 1 && (
                      <Button
                        type="button"
                        size="icon"
                        variant="ghost"
                        onClick={() => removeOnlinePayment(index)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                ))}
              </div>

              <div className="space-y-2">
                <Label htmlFor="notes">Notes (Optional)</Label>
                <Textarea
                  id="notes"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Any additional notes..."
                  rows={3}
                />
              </div>

              <div className="rounded-lg bg-accent p-4">
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="font-medium">Base Total:</span>
                    <span className="font-bold">Rs {baseTotal}</span>
                  </div>
                  <div className="flex justify-between border-t pt-2">
                    <span className="font-medium">Closing Balance:</span>
                    <span className="text-lg font-bold text-primary">Rs {closingBalance}</span>
                  </div>
                </div>
              </div>

              <Button type="submit" className="w-full" disabled={isSubmitting}>
                {isSubmitting ? "Submitting..." : "Submit Shift Report"}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default RiderDashboard;
