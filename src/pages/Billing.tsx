import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";

type ElectricityBill = {
  id: string;
  month: number;
  year: number;
  total: number;
  is_paid: boolean;
};

type WaterBill = {
  id: string;
  month: number;
  year: number;
  amount: number;
  is_paid: boolean;
};

type RentPayment = {
  id: string;
  amount: number;
  months_paid: number;
  payment_date: string;
  period_start: string;
  period_end: string;
};

const CBE_ACCOUNT = "Bayush Kassa - 1000499143072";
const TELEBIRR_ACCOUNT = "Alehegne - 0911238816";

export default function Billing() {
  const [electricity, setElectricity] = useState<ElectricityBill[]>([]);
  const [water, setWater] = useState<WaterBill[]>([]);
  const [rent, setRent] = useState<RentPayment[]>([]);
  const [filter, setFilter] = useState("");

  const fetchAll = async () => {
    const [e, w, r] = await Promise.all([
      supabase.from("electricity_bills").select("*"),
      supabase.from("water_bills").select("*"),
      supabase.from("rent_payments").select("*"),
    ]);

    if (e.data) setElectricity(e.data);
    if (w.data) setWater(e.data ? w.data : w.data);
    if (r.data) setRent(r.data);
  };

  useEffect(() => {
    fetchAll();
  }, []);

  const matchFilter = (month: number, year: number) => {
    if (!filter) return true;
    return `${month}-${year}`.includes(filter);
  };

  const markPaid = async (table: string, id: string, msg: string) => {
    const { error } = await supabase
      .from(table)
      .update({ is_paid: true, paid_at: new Date().toISOString() })
      .eq("id", id);

    if (error) return toast.error(error.message);
    toast.success(msg);
    fetchAll();
  };

  const downloadInvoice = (title: string, content: string) => {
    const blob = new Blob([content], { type: "application/pdf" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${title}.pdf`;
    a.click();
  };

  const invoiceTemplate = (data: string, status: string) => `
=============================
        INVOICE
=============================
${data}

STATUS: ${status}

-----------------------------
PAYMENT DETAILS
CBE: ${CBE_ACCOUNT}
Telebirr: ${TELEBIRR_ACCOUNT}

-----------------------------
Powered by NUN tech
=============================
`;

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Billing System</h1>

      {/* FILTER */}
      <Input
        placeholder="Filter by month/year (e.g. 2025 or 12)"
        value={filter}
        onChange={(e) => setFilter(e.target.value)}
      />

      <Tabs defaultValue="electricity">
        <TabsList>
          <TabsTrigger value="electricity">Electricity</TabsTrigger>
          <TabsTrigger value="water">Water</TabsTrigger>
          <TabsTrigger value="rent">Rent</TabsTrigger>
        </TabsList>

        {/* ELECTRICITY */}
        <TabsContent value="electricity">
          {electricity
            .filter((b) => matchFilter(b.month, b.year))
            .map((b) => (
              <Card key={b.id}>
                <CardContent className="p-4 space-y-2">
                  <p>{b.month}/{b.year}</p>
                  <p>{b.total} ETB</p>
                  <p>{b.is_paid ? "PAID" : "PENDING"}</p>

                  <div className="flex gap-2">
                    {!b.is_paid && (
                      <Button
                        onClick={() =>
                          markPaid(
                            "electricity_bills",
                            b.id,
                            "Electricity marked paid"
                          )
                        }
                      >
                        Mark Paid
                      </Button>
                    )}

                    <Button
                      variant="outline"
                      onClick={() =>
                        downloadInvoice(
                          "electricity",
                          invoiceTemplate(
                            `Electricity Bill: ${b.month}/${b.year}\nAmount: ${b.total} ETB`,
                            b.is_paid ? "PAID ✔" : "PENDING"
                          )
                        )
                      }
                    >
                      Download PDF
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
        </TabsContent>

        {/* WATER */}
        <TabsContent value="water">
          {water
            .filter((b) => matchFilter(b.month, b.year))
            .map((b) => (
              <Card key={b.id}>
                <CardContent className="p-4 space-y-2">
                  <p>{b.month}/{b.year}</p>
                  <p>{b.amount} ETB</p>
                  <p>{b.is_paid ? "PAID" : "PENDING"}</p>

                  <div className="flex gap-2">
                    {!b.is_paid && (
                      <Button
                        onClick={() =>
                          markPaid(
                            "water_bills",
                            b.id,
                            "Water marked paid"
                          )
                        }
                      >
                        Mark Paid
                      </Button>
                    )}

                    <Button
                      variant="outline"
                      onClick={() =>
                        downloadInvoice(
                          "water",
                          invoiceTemplate(
                            `Water Bill: ${b.month}/${b.year}\nAmount: ${b.amount} ETB`,
                            b.is_paid ? "PAID ✔" : "PENDING"
                          )
                        )
                      }
                    >
                      Download PDF
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
        </TabsContent>

        {/* RENT */}
        <TabsContent value="rent">
          {rent.map((r) => (
            <Card key={r.id}>
              <CardContent className="p-4 space-y-2">
                <p>{r.amount} ETB</p>
                <p>{r.months_paid} months</p>

                <Button
                  variant="outline"
                  onClick={() =>
                    downloadInvoice(
                      "rent",
                      invoiceTemplate(
                        `Rent Payment\nAmount: ${r.amount} ETB\nPeriod: ${r.period_start} → ${r.period_end}`,
                        "PAID ✔"
                      )
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