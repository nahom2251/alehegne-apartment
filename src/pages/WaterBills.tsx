import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Droplets } from "lucide-react";
import { toast } from "sonner";

import { generateBillPdf } from "@/utils/generateBillPdf";
import { getPaymentMethod } from "@/utils/payment";

const MONTHS = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];

export default function WaterBills() {
  const [bills, setBills] = useState<any[]>([]);
  const [selectedMonth, setSelectedMonth] = useState("");

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    const { data } = await supabase.from("water_bills").select("*, apartments(label, tenant_name)");
    if (data) setBills(data);
  };

  const filtered = bills.filter((b) =>
    selectedMonth
      ? `${b.year}-${String(b.month).padStart(2, "0")}` === selectedMonth
      : true
  );

  const markPaid = async (id: string) => {
    await supabase.from("water_bills").update({ is_paid: true }).eq("id", id);
    toast.success("Paid");
    fetchData();
  };

  return (
    <div className="space-y-4">
      <h1>Water Bills</h1>

      <Input
        type="month"
        value={selectedMonth}
        onChange={(e) => setSelectedMonth(e.target.value)}
      />

      <div className="grid md:grid-cols-3 gap-4">
        {filtered.map((bill) => {
          const payment = getPaymentMethod("Water");

          return (
            <Card key={bill.id}>
              <CardHeader>
                <CardTitle className="flex justify-between">
                  <Droplets />
                  <Badge>{bill.is_paid ? "PAID" : "PENDING"}</Badge>
                </CardTitle>
              </CardHeader>

              <CardContent>
                <p>{bill.apartments?.tenant_name}</p>
                <p>{bill.amount} ETB</p>

                <Button
                  className="w-full mt-2"
                  onClick={() =>
                    generateBillPdf({
                      tenantName: bill.apartments?.tenant_name,
                      unit: bill.apartments?.label,
                      type: "Water",
                      amount: bill.amount,
                      month: `${MONTHS[bill.month - 1]} ${bill.year}`,
                      paymentMethod: payment.method,
                      accountInfo: `${payment.accountName} - ${payment.account}`,
                      status: bill.is_paid ? "PAID" : "PENDING",
                    })
                  }
                >
                  Download {bill.is_paid ? "Receipt" : "Invoice"}
                </Button>

                {!bill.is_paid && (
                  <Button onClick={() => markPaid(bill.id)} variant="outline">
                    Mark Paid
                  </Button>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}