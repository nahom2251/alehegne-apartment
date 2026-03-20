import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Users, CheckCircle, XCircle, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

interface UserProfile {
  id: string;
  user_id: string;
  full_name: string;
  email: string;
  status: 'pending' | 'approved' | 'rejected';
  created_at: string;
}

const UserManagement = () => {
  const { t } = useLanguage();
  const { isSuperAdmin } = useAuth();
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState<string | null>(null);

  const fetchUsers = async () => {
    const { data } = await supabase.from('profiles').select('*').order('created_at', { ascending: false });
    if (data) setUsers(data as UserProfile[]);
  };

  useEffect(() => { fetchUsers(); }, []);

  const updateStatus = async (userId: string, status: 'approved' | 'rejected') => {
    setLoading(userId);
    const { error } = await supabase.from('profiles').update({ status }).eq('user_id', userId);
    setLoading(null);
    if (error) { toast.error(error.message); return; }
    toast.success(`User ${status}`);
    fetchUsers();
  };

  const statusBadge = (status: string) => {
    switch (status) {
      case 'approved': return <Badge className="bg-success">{t('user.approved')}</Badge>;
      case 'rejected': return <Badge variant="destructive">{t('user.rejected')}</Badge>;
      default: return <Badge variant="secondary">{t('user.pending')}</Badge>;
    }
  };

  if (!isSuperAdmin) return <p className="text-center text-muted-foreground py-8">Access denied</p>;

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">{t('nav.users')}</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {users.map((user) => (
          <Card key={user.id}>
            <CardHeader className="pb-2">
              <div className="flex justify-between items-center">
                <CardTitle className="text-sm">{user.full_name}</CardTitle>
                {statusBadge(user.status)}
              </div>
            </CardHeader>
            <CardContent className="space-y-2">
              <p className="text-sm text-muted-foreground">{user.email}</p>
              {user.status === 'pending' && (
                <div className="flex gap-2">
                  <Button size="sm" onClick={() => updateStatus(user.user_id, 'approved')} disabled={loading === user.user_id} className="flex-1 bg-success hover:bg-success/90 text-card">
                    {loading === user.user_id ? <Loader2 className="w-3 h-3 animate-spin" /> : <CheckCircle className="w-3 h-3 mr-1" />}
                    {t('user.approve')}
                  </Button>
                  <Button size="sm" variant="destructive" onClick={() => updateStatus(user.user_id, 'rejected')} disabled={loading === user.user_id} className="flex-1">
                    <XCircle className="w-3 h-3 mr-1" /> {t('user.reject')}
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        ))}
        {users.length === 0 && <p className="col-span-full text-center text-muted-foreground py-8">No users found</p>}
      </div>
    </div>
  );
};

export default UserManagement;
