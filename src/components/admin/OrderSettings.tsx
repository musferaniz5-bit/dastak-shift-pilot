import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

const OrderSettings = () => {
  const [settings, setSettings] = useState({ fee_60: 60, fee_100: 100, fee_150: 150, id: "" });
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    const { data } = await supabase
      .from("order_settings")
      .select("*")
      .single();

    if (data) {
      setSettings(data);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const { error } = await supabase
        .from("order_settings")
        .update({
          fee_60: settings.fee_60,
          fee_100: settings.fee_100,
          fee_150: settings.fee_150,
        })
        .eq("id", settings.id);

      if (error) throw error;

      toast.success("Order fees updated successfully!");
    } catch (error: any) {
      toast.error(error.message || "Failed to update settings");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Order Fee Settings</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSave} className="space-y-4">
          <div className="grid gap-4 md:grid-cols-3">
            <div className="space-y-2">
              <Label htmlFor="fee60">Rs60 Order Fee</Label>
              <Input
                id="fee60"
                type="number"
                value={settings.fee_60}
                onChange={(e) => setSettings({ ...settings, fee_60: parseInt(e.target.value) })}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="fee100">Rs100 Order Fee</Label>
              <Input
                id="fee100"
                type="number"
                value={settings.fee_100}
                onChange={(e) => setSettings({ ...settings, fee_100: parseInt(e.target.value) })}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="fee150">Rs150 Order Fee</Label>
              <Input
                id="fee150"
                type="number"
                value={settings.fee_150}
                onChange={(e) => setSettings({ ...settings, fee_150: parseInt(e.target.value) })}
                required
              />
            </div>
          </div>
          <Button type="submit" disabled={isLoading}>
            {isLoading ? "Saving..." : "Save Settings"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
};

export default OrderSettings;
