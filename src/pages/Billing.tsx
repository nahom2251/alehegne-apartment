import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { format } from "date-fns";
import { toast } from "sonner";

interface Bill {
  id: string;
  apartment_id: string;
  tenant_name: string | null;
  type: "rent" | "water" | "electricity";
  amount: number;
  month: string;
  status: "pending" | "paid";
  created_at: string;
}

export default function Billing() {
  const [bills, setBills] = useState<Bill[]>([]);
  const [monthFilter, setMonthFilter] = useState("");

  const fetchBills = async () => {
    const { data, error } = await supabase.from("billing_view").select("*");
    if (error) {
      toast.error(error.message);
      return;
    }
    setBills(data || []);
  };

  useEffect(() => {
    fetchBills();
  }, []);

  const filteredBills = bills.filter((b) =>
    monthFilter ? b.month.includes(monthFilter) : true
  );

  const markAsPaid = async (id: string) => {
    const { error } = await supabase
      .from("rent_payments")
      .update({ status: "paid" })
      .eq("id", id);

    if (error) return toast.error(error.message);

    toast.success("Marked as paid");
    fetchBills();
  };

  const downloadInvoice = (bill: Bill, status: "pending" | "paid") => {
    const content = `
INVOICE - ${status.toUpperCase()}

Apartment Bill System

Type: ${bill.type}
Tenant: ${bill.tenant_name || "-"}
Amount: ${bill.amount} Birr
Month: ${bill.month}

${
  status === "pending"
    ? `
PAYMENT DETAILS:
CBE Account: Bayush Kassa - 1000499143072
Telebirr: Alehegne - 0911238816
`
    : `
STATUS: PAID ✔
Thank you for your payment
`
}

---------------------------------
Powered by NUN tech
    `;

    const blob = new Blob([content], { type: "text/plain" });
    const url = URL.createObjectURL(blob);

    const a = document.createElement("a");
    a.href = url;
    a.download = `invoice-${bill.id}-${status}.txt`;
    a.click();
  };

  const renderBills = (status: "pending" | "paid") => {
    return filteredBills
      .filter((b) => b.status === status)
      .map((bill) => (
        <Card key={bill.id} className="mb-3">
          <CardHeader>
            <CardTitle className="flex justify-between">
              <span>{bill.type.toUpperCase()}</span>
              <span>{bill.amount} Birr</span>
            </CardTitle>
          </CardHeader>

          <CardContent className="space-y-2">
            <p>Tenant: {bill.tenant_name || "-"}</p>
            <p>Month: {bill.month}</p>
            <p>Status: {bill.status}</p>

            <div className="flex gap-2">
              {status === "pending" && (
                <Button onClick={() => markAsPaid(bill.id)}>
                  Mark Paid
                </Button>
              )}

              <Button
                variant="outline"
                onClick={() => downloadInvoice(bill, status)}
              >
                Download Invoice
              </Button>
            </div>
          </CardContent>
        </Card>
      ));
  };

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Billing System</h1>

      {/* FILTER */}
      <div className="flex gap-2">
        <Input
          placeholder="Filter by month (YYYY-MM)"
          value={monthFilter}
          onChange={(e) => setMonthFilter(e.target.value)}
        />
      </div>

      {/* PAYMENT INFO CARD */}
      <Card>
        <CardHeader>
          <CardTitle>Payment Accounts</CardTitle>
        </CardHeader>
        <CardContent>
          <p>CBE: Bayush Kassa - 1000499143072</p>
          <p>Telebirr: Alehegne - 0911238816</p>
        </CardContent>
      </Card>

      {/* TABS */}
      <Tabs defaultValue="pending">
        <TabsList>
          <TabsTrigger value="pending">Pending</TabsTrigger>
          <TabsTrigger value="paid">Paid</TabsTrigger>
        </TabsList>

        <TabsContent value="pending">
          {renderBills("pending")}
        </TabsContent>

        <TabsContent value="paid">
          {renderBills("paid")}
        </TabsContent>
      </Tabs>
    </div>
  );
}