import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useLanguage } from '@/contexts/LanguageContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { DollarSign, Zap, Droplets, Building2, Download } from 'lucide-react';

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';

import jsPDF from 'jspdf';

type MonthData = {
  month: string;
  rent: number;
  water: number;
  electricity: number;
};

const Revenue = () => {
  const { t } = useLanguage();

  const [rentRevenue, setRentRevenue] = useState({ paid: 0, pending: 0 });
  const [elecRevenue, setElecRevenue] = useState({ paid: 0, pending: 0 });
  const [waterRevenue, setWaterRevenue] = useState({ paid: 0, pending: 0 });

  const [chartData, setChartData] = useState<MonthData[]>([]);

  useEffect(() => {
    fetchRevenue();
  }, []);

  const getMonth = (date: string) =>
    new Date(date).toLocaleString('default', { month: 'short' });

  const fetchRevenue = async () => {
    // RENT
    const { data: apts } = await supabase
      .from('apartments')
      .select('monthly_rent, rent_paid_months, is_occupied');

    if (apts) {
      const occupied = apts.filter(a => a.is_occupied);
      const paid = occupied.reduce(
        (sum, a) => sum + ((a.monthly_rent || 0) * (a.rent_paid_months || 0)),
        0
      );
      setRentRevenue({ paid, pending: 0 });
    }

    // ELECTRICITY
    const { data: elec } = await supabase
      .from('electricity_bills')
      .select('total, is_paid, created_at');

    // WATER
    const { data: water } = await supabase
      .from('water_bills')
      .select('amount, is_paid, created_at');

    if (elec) {
      const paid = elec
        .filter(b => b.is_paid)
        .reduce((s, b) => s + (b.total || 0), 0);

      const pending = elec
        .filter(b => !b.is_paid)
        .reduce((s, b) => s + (b.total || 0), 0);

      setElecRevenue({ paid, pending });
    }

    if (water) {
      const paid = water
        .filter(b => b.is_paid)
        .reduce((s, b) => s + (b.amount || 0), 0);

      const pending = water
        .filter(b => !b.is_paid)
        .reduce((s, b) => s + (b.amount || 0), 0);

      setWaterRevenue({ paid, pending });
    }

    // 📊 BUILD CHART DATA
    const map: Record<string, MonthData> = {};

    const add = (type: keyof MonthData, amount: number, date: string) => {
      const m = getMonth(date);

      if (!map[m]) {
        map[m] = { month: m, rent: 0, water: 0, electricity: 0 };
      }

      map[m][type] += amount;
    };

    elec?.forEach(e => {
      if (e.is_paid) add('electricity', e.total || 0, e.created_at);
    });

    water?.forEach(w => {
      if (w.is_paid) add('water', w.amount || 0, w.created_at);
    });

    setChartData(Object.values(map));
  };

  const totalPaid =
    rentRevenue.paid + elecRevenue.paid + waterRevenue.paid;

  const totalPending =
    rentRevenue.pending + elecRevenue.pending + waterRevenue.pending;

  // 📥 PDF DOWNLOAD
  const downloadPDF = () => {
    const doc = new jsPDF();

    doc.setFontSize(16);
    doc.text('Revenue Report', 14, 20);

    let y = 40;

    chartData.forEach(d => {
      doc.text(
        `${d.month} | Rent: ${d.rent} | Water: ${d.water} | Electricity: ${d.electricity}`,
        14,
        y
      );
      y += 10;
    });

    doc.text('Powered by NUN tech', 14, y + 20);

    doc.save('revenue-report.pdf');
  };

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">{t('nav.revenue')}</h1>

      {/* TOTAL */}
      <Card className="gold-gradient">
        <CardContent className="pt-6 pb-6 text-card">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <DollarSign className="w-8 h-8" />
              <div>
                <p className="text-sm opacity-80">Total Revenue</p>
                <p className="text-3xl font-bold">
                  {totalPaid.toLocaleString()} {t('common.birr')}
                </p>
              </div>
            </div>

            <button
              onClick={downloadPDF}
              className="flex items-center gap-2 bg-white/20 px-3 py-2 rounded"
            >
              <Download size={16} />
              PDF
            </button>
          </div>

          {totalPending > 0 && (
            <p className="text-sm opacity-80 mt-2">
              Pending: {totalPending.toLocaleString()} {t('common.birr')}
            </p>
          )}
        </CardContent>
      </Card>

      {/* CARDS */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2">
              <Building2 className="w-4 h-4" />
              Rent
            </CardTitle>
          </CardHeader>
          <CardContent>
            {rentRevenue.paid.toLocaleString()} {t('common.birr')}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2">
              <Zap className="w-4 h-4" />
              Electricity
            </CardTitle>
          </CardHeader>
          <CardContent>
            {elecRevenue.paid.toLocaleString()} {t('common.birr')}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2">
              <Droplets className="w-4 h-4" />
              Water
            </CardTitle>
          </CardHeader>
          <CardContent>
            {waterRevenue.paid.toLocaleString()} {t('common.birr')}
          </CardContent>
        </Card>
      </div>

      {/* 📊 CHART */}
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
};

export default Revenue;