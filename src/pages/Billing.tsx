import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { format } from "date-fns";

type ElectricityBill = {
  id: string;
  apartment_id: string;
  month: number;
  year: number;
  total: number;
  is_paid: boolean;
  paid_at: string | null;
};

type WaterBill = {
  id: string;
  apartment_id: string;
  month: number;
  year: number;
  amount: number;
  is_paid: boolean;
  paid_at: string | null;
};

type RentPayment = {
  id: string;
  apartment_id: string;
  months_paid: number;
  amount: number;
  payment_date: string;
  period_start: string;
  period_end: string;
};

export default function Billing() {
  const [electricity, setElectricity] = useState<ElectricityBill[]>([]);
  const [water, setWater] = useState<WaterBill[]>([]);
  const [rent, setRent] = useState<RentPayment[]>([]);
  const [filter, setFilter] = useState("");

  // ---------------- FETCH DATA ----------------
  const fetchAll = async () => {
    const [e, w, r] = await Promise.all([
      supabase.from("electricity_bills").select("*"),
      supabase.from("water_bills").select("*"),
      supabase.from("rent_payments").select("*"),
    ]);

    if (e.data) setElectricity(e.data);
    if (w.data) setWater(w.data);
    if (r.data) setRent(r.data);
  };

  useEffect(() => {
    fetchAll();
  }, []);

  // ---------------- FILTER ----------------
  const matchFilter = (value: string) =>
    filter ? value.includes(filter) : true;

  // ---------------- MARK PAID ----------------
  const markElectricityPaid = async (id: string) => {
    const { error } = await supabase
      .from("electricity_bills")
      .update({ is_paid: true, paid_at: new Date().toISOString() })
      .eq("id", id);

    if (error) return toast.error(error.message);
    toast.success("Electricity bill marked as paid");
    fetchAll();
  };

  const markWaterPaid = async (id: string) => {
    const { error } = await supabase
      .from("water_bills")
      .update({ is_paid: true, paid_at: new Date().toISOString() })
      .eq("id", id);

    if (error) return toast.error(error.message);
    toast.success("Water bill marked as paid");
    fetchAll();
  };

  // ---------------- PDF (simple download) ----------------
  const downloadFile = (title: string, content: string) => {
    const blob = new Blob([content], { type: "text/plain" });
    const url = URL.createObjectURL(blob);

    const a = document.createElement("a");
    a.href = url;
    a.download = `${title}.txt`;
    a.click();
  };

  // ---------------- UI RENDER ----------------
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Billing System</h1>

      {/* FILTER */}
      <Input
        placeholder="Filter by month or year (e.g. 2025 or 12)"
        value={filter}
        onChange={(e) => setFilter(e.target.value)}
      />

      {/* PAYMENT INFO */}
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
      <Tabs defaultValue="electricity">
        <TabsList>
          <TabsTrigger value="electricity">Electricity</TabsTrigger>
          <TabsTrigger value="water">Water</TabsTrigger>
          <TabsTrigger value="rent">Rent</TabsTrigger>
        </TabsList>

        {/* ---------------- ELECTRICITY ---------------- */}
        <TabsContent value="electricity">
          {electricity
            .filter((b) => matchFilter(`${b.month}-${b.year}`))
            .map((b) => (
              <Card key={b.id} className="mb-3">
                <CardContent className="p-4 space-y-2">
                  <p>Month: {b.month}/{b.year}</p>
                  <p>Total: {b.total} Birr</p>
                  <p>Status: {b.is_paid ? "PAID" : "PENDING"}</p>

                  <div className="flex gap-2">
                    {!b.is_paid && (
                      <Button onClick={() => markElectricityPaid(b.id)}>
                        Mark Paid
                      </Button>
                    )}

                    <Button
                      variant="outline"
                      onClick={() =>
                        downloadFile(
                          "electricity-invoice",
                          `
ELECTRICITY BILL
Month: ${b.month}/${b.year}
Amount: ${b.total}

${b.is_paid ? "PAID ✔" : "PENDING"}

Powered by NUN tech
                          `
                        )
                      }
                    >
                      Download
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
        </TabsContent>

        {/* ---------------- WATER ---------------- */}
        <TabsContent value="water">
          {water
            .filter((b) => matchFilter(`${b.month}-${b.year}`))
            .map((b) => (
              <Card key={b.id} className="mb-3">
                <CardContent className="p-4 space-y-2">
                  <p>Month: {b.month}/{b.year}</p>
                  <p>Amount: {b.amount} Birr</p>
                  <p>Status: {b.is_paid ? "PAID" : "PENDING"}</p>

                  <div className="flex gap-2">
                    {!b.is_paid && (
                      <Button onClick={() => markWaterPaid(b.id)}>
                        Mark Paid
                      </Button>
                    )}

                    <Button
                      variant="outline"
                      onClick={() =>
                        downloadFile(
                          "water-invoice",
                          `
WATER BILL
Month: ${b.month}/${b.year}
Amount: ${b.amount}

${b.is_paid ? "PAID ✔" : "PENDING"}

Powered by NUN tech
                          `
                        )
                      }
                    >
                      Download
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
        </TabsContent>

        {/* ---------------- RENT ---------------- */}
        <TabsContent value="rent">
          {rent.map((r) => (
            <Card key={r.id} className="mb-3">
              <CardContent className="p-4 space-y-2">
                <p>Amount: {r.amount} Birr</p>
                <p>Months Paid: {r.months_paid}</p>
                <p>
                  Period: {r.period_start} → {r.period_end}
                </p>

                <Button
                  variant="outline"
                  onClick={() =>
                    downloadFile(
                      "rent-receipt",
                      `
RENT PAYMENT RECEIPT
Amount: ${r.amount}
Months: ${r.months_paid}
From: ${r.period_start}
To: ${r.period_end}

STATUS: PAID ✔

Powered by NUN tech
                      `
                    )
                  }
                >
                  Download Receipt
                </Button>
              </CardContent>
            </Card>
          ))}
        </TabsContent>
      </Tabs>
    </div>
  );
}