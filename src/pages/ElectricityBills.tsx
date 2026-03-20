import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useLanguage } from "@/contexts/LanguageContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Zap, Plus, Loader2, CheckCircle } from "lucide-react";
import { toast } from "sonner";

// ✅ FIXED IMPORTS (IMPORTANT FOR RENDER BUILD)
import { generateBillPdf } from "@/utils/generateBillPdf";
import { getPaymentMethod } from "@/utils/payment";

const MONTHS = [
  "Jan","Feb","Mar","Apr","May","Jun",
  "Jul","Aug","Sep","Oct","Nov","Dec"
];

export default function ElectricityBills() {
  const { t } = useLanguage();

  const [apartments, setApartments] = useState<any[]>([]);
  const [bills, setBills] = useState<any[]>([]);
  const [showAdd, setShowAdd] = useState(false);
  const [selectedMonth, setSelectedMonth] = useState("");

  const [form, setForm] = useState({
    apartment_id: "",
    month: String(new Date().getMonth() + 1),
    year: String(new Date().getFullYear()),
    kwh: "",
    rate: "",
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    const { data: a } = await supabase
      .from("apartments")
      .select("*")
      .eq("is_occupied", true);

    const { data: b } = await supabase
      .from("electricity_bills")
      .select("*, apartments(label, tenant_name)");

    if (a) setApartments(a);
    if (b) setBills(b);
  };

  const filtered = bills.filter((b) =>
    selectedMonth
      ? `${b.year}-${String(b.month).padStart(2, "0")}` === selectedMonth
      : true
  );

  const markPaid = async (id: string) => {
    const { error } = await supabase
      .from("electricity_bills")
      .update({ is_paid: true, paid_at: new Date().toISOString() })
      .eq("id", id);

    if (error) {
      toast.error(error.message);
      return;
    }

    toast.success("Marked as paid");
    fetchData();
  };

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Electricity Bills</h1>

      {/* FILTER */}
      <div className="flex gap-2">
        <Input
          type="month"
          value={selectedMonth}
          onChange={(e) => setSelectedMonth(e.target.value)}
        />
        <Button onClick={() => setSelectedMonth("")}>Clear</Button>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        {filtered.map((bill) => {
          const payment = getPaymentMethod("Electricity");

          return (
            <Card key={bill.id}>
              <CardHeader>
                <CardTitle className="flex justify-between">
                  {bill.apartments?.label}
                  <Badge>{bill.is_paid ? "PAID" : "PENDING"}</Badge>
                </CardTitle>
              </CardHeader>

              <CardContent className="space-y-2">
                <p>{bill.apartments?.tenant_name}</p>

                <p>
                  {MONTHS[bill.month - 1]} {bill.year}
                </p>

                <p className="font-bold">{bill.total} ETB</p>

                {/* DOWNLOAD PDF */}
                <Button
                  className="w-full"
                  onClick={() =>
                    generateBillPdf({
                      tenantName: bill.apartments?.tenant_name,
                      unit: bill.apartments?.label,
                      type: "Electricity",
                      amount: bill.total,
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
                  <Button
                    variant="outline"
                    className="w-full"
                    onClick={() => markPaid(bill.id)}
                  >
                    <CheckCircle className="w-4 h-4 mr-1" />
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