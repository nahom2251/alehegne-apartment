import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useLanguage } from '@/contexts/LanguageContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { DollarSign, Zap, Droplets, Building2 } from 'lucide-react';

const Revenue = () => {
  const { t } = useLanguage();
  const [rentRevenue, setRentRevenue] = useState({ paid: 0, pending: 0 });
  const [elecRevenue, setElecRevenue] = useState({ paid: 0, pending: 0 });
  const [waterRevenue, setWaterRevenue] = useState({ paid: 0, pending: 0 });

  useEffect(() => {
    const fetchRevenue = async () => {
      // Rent: sum monthly_rent * rent_paid_months for occupied apartments
      const { data: apts } = await supabase.from('apartments').select('monthly_rent, rent_paid_months, is_occupied');
      if (apts) {
        const occupied = apts.filter(a => a.is_occupied);
        const paid = occupied.reduce((sum, a) => sum + ((a.monthly_rent || 0) * (a.rent_paid_months || 0)), 0);
        setRentRevenue({ paid, pending: 0 });
      }

      // Electricity
      const { data: elec } = await supabase.from('electricity_bills').select('total, is_paid');
      if (elec) {
        const paid = elec.filter(b => b.is_paid).reduce((s, b) => s + (b.total || 0), 0);
        const pending = elec.filter(b => !b.is_paid).reduce((s, b) => s + (b.total || 0), 0);
        setElecRevenue({ paid, pending });
      }

      // Water
      const { data: water } = await supabase.from('water_bills').select('amount, is_paid');
      if (water) {
        const paid = water.filter(b => b.is_paid).reduce((s, b) => s + (b.amount || 0), 0);
        const pending = water.filter(b => !b.is_paid).reduce((s, b) => s + (b.amount || 0), 0);
        setWaterRevenue({ paid, pending });
      }
    };
    fetchRevenue();
  }, []);

  const totalPaid = rentRevenue.paid + elecRevenue.paid + waterRevenue.paid;
  const totalPending = rentRevenue.pending + elecRevenue.pending + waterRevenue.pending;

  const cards = [
    { icon: Building2, label: 'Rent', paid: rentRevenue.paid, pending: rentRevenue.pending, color: 'text-primary' },
    { icon: Zap, label: t('nav.electricity'), paid: elecRevenue.paid, pending: elecRevenue.pending, color: 'text-warning' },
    { icon: Droplets, label: t('nav.water'), paid: waterRevenue.paid, pending: waterRevenue.pending, color: 'text-info' },
  ];

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">{t('nav.revenue')}</h1>

      {/* Total */}
      <Card className="gold-gradient">
        <CardContent className="pt-6 pb-6 text-card">
          <div className="flex items-center gap-3 mb-2">
            <DollarSign className="w-8 h-8" />
            <div>
              <p className="text-sm opacity-80">Total Revenue</p>
              <p className="text-3xl font-bold">{totalPaid.toLocaleString()} {t('common.birr')}</p>
            </div>
          </div>
          {totalPending > 0 && (
            <p className="text-sm opacity-80 mt-1">
              Pending: {totalPending.toLocaleString()} {t('common.birr')}
            </p>
          )}
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {cards.map((c) => (
          <Card key={c.label}>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center gap-2">
                <c.icon className={`w-4 h-4 ${c.color}`} />
                {c.label}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">{c.paid.toLocaleString()} {t('common.birr')}</p>
              {c.pending > 0 && (
                <p className="text-sm text-muted-foreground mt-1">
                  Pending: {c.pending.toLocaleString()} {t('common.birr')}
                </p>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default Revenue;
