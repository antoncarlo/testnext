import { useEffect, useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { usePageView } from '@/hooks/useActivityLogger';
import DashboardLayout from '@/components/DashboardLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2, User, Wallet, Trophy, Calendar, Mail, Gift, Copy, Check } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Link } from 'react-router-dom';

const Profile = () => {
  usePageView('Profile');
  const { user } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<any>(null);
  const [copied, setCopied] = useState(false);

  const copyReferralCode = () => {
    if (profile?.referral_code) {
      navigator.clipboard.writeText(profile.referral_code);
      setCopied(true);
      toast({
        title: 'Copied!',
        description: 'Referral code copied to clipboard',
      });
      setTimeout(() => setCopied(false), 2000);
    }
  };

  useEffect(() => {
    const fetchProfile = async () => {
      if (!user) return;

      try {
        const { data, error } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .maybeSingle();

        if (error) throw error;
        setProfile(data);
      } catch (error) {
        console.error('Error fetching profile:', error);
        toast({
          title: 'Error',
          description: 'Failed to load profile data',
          variant: 'destructive',
        });
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, [user]);

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </DashboardLayout>
    );
  }

  if (!profile) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <p className="text-muted-foreground">No profile found</p>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Page Header - Venetian Style */}
        <div className="relative overflow-hidden rounded-xl bg-gradient-to-r from-primary/10 via-secondary/10 to-accent/10 p-8 border border-primary/20">
          <div className="absolute inset-0 venetian-pattern opacity-20"></div>
          <div className="relative z-10">
            <div className="flex items-center gap-3 mb-3">
              <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
                <User className="h-6 w-6 text-primary" />
              </div>
              <h1 className="text-4xl font-bold" style={{ fontFamily: "'Playfair Display', serif" }}>
                Il Mio Profilo
              </h1>
            </div>
            <p className="text-muted-foreground text-lg">
              Gestisci le informazioni del tuo account
            </p>
          </div>
        </div>

        <div className="grid gap-6">
          <Card>
            <CardHeader>
              <CardTitle style={{ fontFamily: "'Playfair Display', serif" }}>
                Informazioni Account
              </CardTitle>
              <CardDescription>I tuoi dettagli e statistiche del profilo</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label className="flex items-center gap-2 text-muted-foreground">
                    <Wallet className="h-4 w-4" />
                    Indirizzo Wallet
                  </Label>
                  <Input value={profile.wallet_address} readOnly className="font-mono text-sm" />
                </div>

                <div className="space-y-2">
                  <Label className="flex items-center gap-2 text-muted-foreground">
                    <Mail className="h-4 w-4" />
                    Email
                  </Label>
                  <Input value={profile.email || 'Non impostata'} readOnly />
                </div>

                <div className="space-y-2">
                  <Label className="flex items-center gap-2 text-muted-foreground">
                    <Trophy className="h-4 w-4" />
                    Livello Attuale
                  </Label>
                  <Input value={profile.current_tier || 'Bronzo'} readOnly />
                </div>

                <div className="space-y-2">
                  <Label className="flex items-center gap-2 text-muted-foreground">
                    <Trophy className="h-4 w-4" />
                    Punti Totali
                  </Label>
                  <Input value={profile.total_points?.toLocaleString() || '0'} readOnly />
                </div>

                <div className="space-y-2">
                  <Label className="flex items-center gap-2 text-muted-foreground">
                    <Calendar className="h-4 w-4" />
                    Membro Dal
                  </Label>
                  <Input value={new Date(profile.created_at).toLocaleDateString('it-IT')} readOnly />
                </div>

                <div className="space-y-2">
                  <Label className="flex items-center gap-2 text-muted-foreground">
                    <Calendar className="h-4 w-4" />
                    Ultimo Aggiornamento
                  </Label>
                  <Input value={new Date(profile.updated_at).toLocaleDateString('it-IT')} readOnly />
                </div>

                <div className="space-y-2">
                  <Label className="flex items-center gap-2 text-muted-foreground">
                    <Gift className="h-4 w-4" />
                    Il Tuo Codice Referral
                  </Label>
                  <div className="flex gap-2">
                    <Input value={profile.referral_code || 'Generazione...'} readOnly className="font-mono" />
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={copyReferralCode}
                      disabled={!profile.referral_code}
                    >
                      {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                    </Button>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Condividi questo codice per guadagnare il 10% di bonus sui primi depositi dei referral
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle style={{ fontFamily: "'Playfair Display', serif" }}>
                Link Referral
              </CardTitle>
              <CardDescription>Condividi questo link con gli amici</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex gap-2">
                <Input
                  value={`${window.location.origin}/auth?ref=${profile.referral_code}`}
                  readOnly
                  className="text-sm"
                />
                <Button
                  variant="outline"
                  onClick={() => {
                    navigator.clipboard.writeText(`${window.location.origin}/auth?ref=${profile.referral_code}`);
                    toast({
                      title: 'Copiato!',
                      description: 'Link referral copiato negli appunti',
                    });
                  }}
                >
                  <Copy className="h-4 w-4" />
                </Button>
              </div>
              <Link to="/referral" className="block mt-4">
                <Button variant="outline" className="w-full">
                  <Gift className="h-4 w-4 mr-2" />
                  Visualizza Tutti i Referral
                </Button>
              </Link>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle style={{ fontFamily: "'Playfair Display', serif" }}>
                Statistiche Rapide
              </CardTitle>
              <CardDescription>Panoramica della tua attività sulla piattaforma</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-3">
                <div className="p-4 rounded-lg bg-primary/5 border border-primary/10">
                  <p className="text-sm text-muted-foreground mb-1">Punti Totali</p>
                  <p className="text-2xl font-bold text-primary">
                    {profile.total_points?.toLocaleString() || '0'}
                  </p>
                </div>
                <div className="p-4 rounded-lg bg-secondary/5 border border-secondary/10">
                  <p className="text-sm text-muted-foreground mb-1">Livello Attuale</p>
                  <p className="text-2xl font-bold text-secondary">
                    {profile.current_tier || 'Bronzo'}
                  </p>
                </div>
                <div className="p-4 rounded-lg bg-accent/5 border border-accent/10">
                  <p className="text-sm text-muted-foreground mb-1">Stato Account</p>
                  <p className="text-2xl font-bold text-accent">Attivo</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default Profile;
