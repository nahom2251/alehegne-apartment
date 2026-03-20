import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { DollarSign, Download } from "lucide-react";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

import jsPDF from "jspdf";

type MonthData = {
  month: string;
  rent: number;
  water: number;
  electricity: number;
};

export default function Revenue() {
  const [rentRevenue, setRentRevenue] = useState({ paid: 0, pending: 0 });
  const [elecRevenue, setElecRevenue] = useState({ paid: 0, pending: 0 });
  const [waterRevenue, setWaterRevenue] = useState({ paid: 0, pending: 0 });

  const [chartData, setChartData] = useState<MonthData[]>([]);

  useEffect(() => {
    fetchRevenue();
  }, []);

  const getMonth = (date: string) =>
    new Date(date).toLocaleString("default", { month: "short" });

  const fetchRevenue = async () => {
    const { data: apts } = await supabase
      .from("apartments")
      .select("monthly_rent, rent_paid_months, is_occupied");

    const { data: elec } = await supabase
      .from("electricity_bills")
      .select("total, is_paid, created_at");

    const { data: water } = await supabase
      .from("water_bills")
      .select("amount, is_paid, created_at");

    if (apts) {
      const occupied = apts.filter(a => a.is_occupied);

      const paid = occupied.reduce(
        (sum, a) =>
          sum + ((a.monthly_rent || 0) * (a.rent_paid_months || 0)),
        0
      );

      setRentRevenue({ paid, pending: 0 });
    }

    if (elec) {
      const paid = elec
        .filter(e => e.is_paid)
        .reduce((s, e) => s + (e.total || 0), 0);

      const pending = elec
        .filter(e => !e.is_paid)
        .reduce((s, e) => s + (e.total || 0), 0);

      setElecRevenue({ paid, pending });
    }

    if (water) {
      const paid = water
        .filter(w => w.is_paid)
        .reduce((s, w) => s + (w.amount || 0), 0);

      const pending = water
        .filter(w => !w.is_paid)
        .reduce((s, w) => s + (w.amount || 0), 0);

      setWaterRevenue({ paid, pending });
    }

    // CHART DATA
    const map: Record<string, MonthData> = {};

    const add = (
      type: keyof MonthData,
      amount: number,
      date: string
    ) => {
      const m = getMonth(date);

      if (!map[m]) {
        map[m] = { month: m, rent: 0, water: 0, electricity: 0 };
      }

      map[m][type] += amount;
    };

    elec?.forEach(e => {
      if (e.is_paid) add("electricity", e.total || 0, e.created_at);
    });

    water?.forEach(w => {
      if (w.is_paid) add("water", w.amount || 0, w.created_at);
    });

    setChartData(Object.values(map));
  };

  const totalPaid =
    rentRevenue.paid +
    elecRevenue.paid +
    waterRevenue.paid;

  const downloadPDF = () => {
    const doc = new jsPDF();

    doc.setFontSize(16);
    doc.text("Revenue Report", 14, 20);

    let y = 40;

    chartData.forEach((d) => {
      doc.text(
        `${d.month} | Rent: ${d.rent} | Water: ${d.water} | Electricity: ${d.electricity}`,
        14,
        y
      );
      y += 10;
    });

    doc.text("Powered by NUN tech", 14, y + 20);

    doc.save("revenue-report.pdf");
  };

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Revenue</h1>

      <Card>
        <CardContent className="flex justify-between items-center pt-6">
          <div className="flex items-center gap-2">
            <DollarSign />
            <span className="text-2xl font-bold">
              {totalPaid.toLocaleString()} ETB
            </span>
          </div>

          <Button onClick={downloadPDF}>
            <Download className="w-4 h-4 mr-2" />
            PDF
          </Button>
        </CardContent>
      </Card>

      <div className="h-96">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={chartData}>
            <XAxis dataKey="month" />
            <YAxis />
            <Tooltip />
            <Bar dataKey="rent" />
            <Bar dataKey="water" />
            <Bar dataKey="electricity" />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}