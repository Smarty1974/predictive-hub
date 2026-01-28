import { useState } from 'react';
import {
  User,
  Bell,
  Shield,
  Palette,
  Globe,
  Database,
  Key,
  Save,
  Moon,
  Sun,
  Mail,
  Smartphone,
  Trash2,
  LogOut,
  ChevronRight,
} from 'lucide-react';
import { MainLayout } from '@/components/layout/MainLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { useTheme } from '@/components/theme/ThemeProvider';
import { currentUser } from '@/data/mock-data';
import { cn } from '@/lib/utils';
import { toast } from '@/hooks/use-toast';

export default function SettingsPage() {
  const { theme, setTheme } = useTheme();
  
  // Profile state
  const [profile, setProfile] = useState({
    name: currentUser.name,
    email: currentUser.email,
    role: 'Data Scientist',
    organization: 'ML Platform Inc.',
  });

  // Notification settings
  const [notifications, setNotifications] = useState({
    emailPipeline: true,
    emailProjects: true,
    emailTeam: false,
    pushPipeline: true,
    pushProjects: false,
    pushTeam: true,
    digestFrequency: 'daily',
  });

  // Privacy settings
  const [privacy, setPrivacy] = useState({
    profileVisible: true,
    activityVisible: true,
    shareAnalytics: true,
    twoFactorEnabled: false,
  });

  // Preferences
  const [preferences, setPreferences] = useState({
    language: 'it',
    timezone: 'Europe/Rome',
    dateFormat: 'DD/MM/YYYY',
    defaultView: 'grid',
  });

  const handleSave = () => {
    toast({
      title: 'Impostazioni salvate',
      description: 'Le tue preferenze sono state aggiornate con successo.',
    });
  };

  return (
    <MainLayout>
      <div className="space-y-6 max-w-4xl">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold text-foreground">Impostazioni</h1>
          <p className="text-muted-foreground mt-1">
            Gestisci il tuo profilo, preferenze e configurazioni dell'account
          </p>
        </div>

        <Tabs defaultValue="profile" className="space-y-6">
          <TabsList className="glass-card h-auto p-1 gap-1 flex-wrap">
            <TabsTrigger value="profile" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
              <User className="w-4 h-4 mr-2" />
              Profilo
            </TabsTrigger>
            <TabsTrigger value="notifications" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
              <Bell className="w-4 h-4 mr-2" />
              Notifiche
            </TabsTrigger>
            <TabsTrigger value="appearance" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
              <Palette className="w-4 h-4 mr-2" />
              Aspetto
            </TabsTrigger>
            <TabsTrigger value="privacy" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
              <Shield className="w-4 h-4 mr-2" />
              Privacy
            </TabsTrigger>
            <TabsTrigger value="integrations" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
              <Database className="w-4 h-4 mr-2" />
              Integrazioni
            </TabsTrigger>
          </TabsList>

          {/* Profile Tab */}
          <TabsContent value="profile" className="space-y-6">
            <div className="glass-card p-6 space-y-6">
              <div className="flex items-center gap-4">
                <div className="w-20 h-20 rounded-full bg-gradient-primary flex items-center justify-center text-2xl font-bold text-primary-foreground">
                  {profile.name.split(' ').map(n => n[0]).join('')}
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-foreground">{profile.name}</h3>
                  <p className="text-sm text-muted-foreground">{profile.role}</p>
                  <Button variant="outline" size="sm" className="mt-2">
                    Cambia avatar
                  </Button>
                </div>
              </div>

              <Separator />

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="name">Nome completo</Label>
                  <Input
                    id="name"
                    value={profile.name}
                    onChange={(e) => setProfile({ ...profile, name: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={profile.email}
                    onChange={(e) => setProfile({ ...profile, email: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="role">Ruolo</Label>
                  <Input
                    id="role"
                    value={profile.role}
                    onChange={(e) => setProfile({ ...profile, role: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="organization">Organizzazione</Label>
                  <Input
                    id="organization"
                    value={profile.organization}
                    onChange={(e) => setProfile({ ...profile, organization: e.target.value })}
                  />
                </div>
              </div>

              <div className="flex justify-end">
                <Button variant="gradient" onClick={handleSave}>
                  <Save className="w-4 h-4 mr-2" />
                  Salva modifiche
                </Button>
              </div>
            </div>

            {/* Danger Zone */}
            <div className="glass-card p-6 border-destructive/50">
              <h3 className="text-lg font-semibold text-destructive mb-4">Zona pericolosa</h3>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-foreground">Disconnetti account</p>
                    <p className="text-sm text-muted-foreground">Esci da tutti i dispositivi</p>
                  </div>
                  <Button variant="outline">
                    <LogOut className="w-4 h-4 mr-2" />
                    Disconnetti
                  </Button>
                </div>
                <Separator />
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-foreground">Elimina account</p>
                    <p className="text-sm text-muted-foreground">Elimina permanentemente il tuo account e tutti i dati</p>
                  </div>
                  <Button variant="outline" className="text-destructive border-destructive hover:bg-destructive hover:text-destructive-foreground">
                    <Trash2 className="w-4 h-4 mr-2" />
                    Elimina
                  </Button>
                </div>
              </div>
            </div>
          </TabsContent>

          {/* Notifications Tab */}
          <TabsContent value="notifications" className="space-y-6">
            <div className="glass-card p-6 space-y-6">
              <div>
                <h3 className="text-lg font-semibold text-foreground mb-1">Notifiche Email</h3>
                <p className="text-sm text-muted-foreground">Scegli quali notifiche ricevere via email</p>
              </div>

              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Mail className="w-5 h-5 text-muted-foreground" />
                    <div>
                      <p className="font-medium text-foreground">Aggiornamenti Pipeline</p>
                      <p className="text-sm text-muted-foreground">Notifiche su completamento e errori pipeline</p>
                    </div>
                  </div>
                  <Switch
                    checked={notifications.emailPipeline}
                    onCheckedChange={(checked) => setNotifications({ ...notifications, emailPipeline: checked })}
                  />
                </div>
                <Separator />
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Mail className="w-5 h-5 text-muted-foreground" />
                    <div>
                      <p className="font-medium text-foreground">Attività Progetti</p>
                      <p className="text-sm text-muted-foreground">Modifiche e aggiornamenti ai tuoi progetti</p>
                    </div>
                  </div>
                  <Switch
                    checked={notifications.emailProjects}
                    onCheckedChange={(checked) => setNotifications({ ...notifications, emailProjects: checked })}
                  />
                </div>
                <Separator />
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Mail className="w-5 h-5 text-muted-foreground" />
                    <div>
                      <p className="font-medium text-foreground">Aggiornamenti Team</p>
                      <p className="text-sm text-muted-foreground">Nuovi membri e modifiche ai gruppi</p>
                    </div>
                  </div>
                  <Switch
                    checked={notifications.emailTeam}
                    onCheckedChange={(checked) => setNotifications({ ...notifications, emailTeam: checked })}
                  />
                </div>
              </div>
            </div>

            <div className="glass-card p-6 space-y-6">
              <div>
                <h3 className="text-lg font-semibold text-foreground mb-1">Notifiche Push</h3>
                <p className="text-sm text-muted-foreground">Notifiche in tempo reale nel browser</p>
              </div>

              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Smartphone className="w-5 h-5 text-muted-foreground" />
                    <div>
                      <p className="font-medium text-foreground">Aggiornamenti Pipeline</p>
                      <p className="text-sm text-muted-foreground">Notifiche immediate sulle pipeline</p>
                    </div>
                  </div>
                  <Switch
                    checked={notifications.pushPipeline}
                    onCheckedChange={(checked) => setNotifications({ ...notifications, pushPipeline: checked })}
                  />
                </div>
                <Separator />
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Smartphone className="w-5 h-5 text-muted-foreground" />
                    <div>
                      <p className="font-medium text-foreground">Menzioni e commenti</p>
                      <p className="text-sm text-muted-foreground">Quando qualcuno ti menziona</p>
                    </div>
                  </div>
                  <Switch
                    checked={notifications.pushTeam}
                    onCheckedChange={(checked) => setNotifications({ ...notifications, pushTeam: checked })}
                  />
                </div>
              </div>
            </div>

            <div className="glass-card p-6 space-y-4">
              <div>
                <h3 className="text-lg font-semibold text-foreground mb-1">Digest Email</h3>
                <p className="text-sm text-muted-foreground">Frequenza del riepilogo attività</p>
              </div>
              <Select
                value={notifications.digestFrequency}
                onValueChange={(value) => setNotifications({ ...notifications, digestFrequency: value })}
              >
                <SelectTrigger className="w-full sm:w-64">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="realtime">Tempo reale</SelectItem>
                  <SelectItem value="daily">Giornaliero</SelectItem>
                  <SelectItem value="weekly">Settimanale</SelectItem>
                  <SelectItem value="never">Mai</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex justify-end">
              <Button variant="gradient" onClick={handleSave}>
                <Save className="w-4 h-4 mr-2" />
                Salva preferenze
              </Button>
            </div>
          </TabsContent>

          {/* Appearance Tab */}
          <TabsContent value="appearance" className="space-y-6">
            <div className="glass-card p-6 space-y-6">
              <div>
                <h3 className="text-lg font-semibold text-foreground mb-1">Tema</h3>
                <p className="text-sm text-muted-foreground">Seleziona il tema dell'interfaccia</p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                {[
                  { value: 'light', label: 'Chiaro', icon: Sun },
                  { value: 'dark', label: 'Scuro', icon: Moon },
                ].map((option) => (
                  <button
                    key={option.value}
                    onClick={() => setTheme(option.value as 'light' | 'dark')}
                    className={cn(
                      'p-4 rounded-lg border-2 transition-all flex flex-col items-center gap-2',
                      theme === option.value
                        ? 'border-primary bg-primary/10'
                        : 'border-border hover:border-primary/50'
                    )}
                  >
                    <option.icon className={cn(
                      'w-6 h-6',
                      theme === option.value ? 'text-primary' : 'text-muted-foreground'
                    )} />
                    <span className={cn(
                      'text-sm font-medium',
                      theme === option.value ? 'text-primary' : 'text-foreground'
                    )}>
                      {option.label}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            <div className="glass-card p-6 space-y-6">
              <div>
                <h3 className="text-lg font-semibold text-foreground mb-1">Localizzazione</h3>
                <p className="text-sm text-muted-foreground">Imposta lingua e formato date</p>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label>Lingua</Label>
                  <Select
                    value={preferences.language}
                    onValueChange={(value) => setPreferences({ ...preferences, language: value })}
                  >
                    <SelectTrigger>
                      <Globe className="w-4 h-4 mr-2" />
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="it">Italiano</SelectItem>
                      <SelectItem value="en">English</SelectItem>
                      <SelectItem value="de">Deutsch</SelectItem>
                      <SelectItem value="fr">Français</SelectItem>
                      <SelectItem value="es">Español</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Fuso orario</Label>
                  <Select
                    value={preferences.timezone}
                    onValueChange={(value) => setPreferences({ ...preferences, timezone: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Europe/Rome">Europe/Rome (UTC+1)</SelectItem>
                      <SelectItem value="Europe/London">Europe/London (UTC)</SelectItem>
                      <SelectItem value="America/New_York">America/New_York (UTC-5)</SelectItem>
                      <SelectItem value="Asia/Tokyo">Asia/Tokyo (UTC+9)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Formato data</Label>
                  <Select
                    value={preferences.dateFormat}
                    onValueChange={(value) => setPreferences({ ...preferences, dateFormat: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="DD/MM/YYYY">DD/MM/YYYY</SelectItem>
                      <SelectItem value="MM/DD/YYYY">MM/DD/YYYY</SelectItem>
                      <SelectItem value="YYYY-MM-DD">YYYY-MM-DD</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Vista predefinita</Label>
                  <Select
                    value={preferences.defaultView}
                    onValueChange={(value) => setPreferences({ ...preferences, defaultView: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="grid">Griglia</SelectItem>
                      <SelectItem value="list">Lista</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>

            <div className="flex justify-end">
              <Button variant="gradient" onClick={handleSave}>
                <Save className="w-4 h-4 mr-2" />
                Salva preferenze
              </Button>
            </div>
          </TabsContent>

          {/* Privacy Tab */}
          <TabsContent value="privacy" className="space-y-6">
            <div className="glass-card p-6 space-y-6">
              <div>
                <h3 className="text-lg font-semibold text-foreground mb-1">Visibilità Profilo</h3>
                <p className="text-sm text-muted-foreground">Controlla chi può vedere le tue informazioni</p>
              </div>

              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-foreground">Profilo pubblico</p>
                    <p className="text-sm text-muted-foreground">Permetti ad altri utenti di vedere il tuo profilo</p>
                  </div>
                  <Switch
                    checked={privacy.profileVisible}
                    onCheckedChange={(checked) => setPrivacy({ ...privacy, profileVisible: checked })}
                  />
                </div>
                <Separator />
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-foreground">Attività visibile</p>
                    <p className="text-sm text-muted-foreground">Mostra la tua attività recente ai membri del team</p>
                  </div>
                  <Switch
                    checked={privacy.activityVisible}
                    onCheckedChange={(checked) => setPrivacy({ ...privacy, activityVisible: checked })}
                  />
                </div>
                <Separator />
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-foreground">Condividi analytics</p>
                    <p className="text-sm text-muted-foreground">Aiutaci a migliorare condividendo dati anonimi</p>
                  </div>
                  <Switch
                    checked={privacy.shareAnalytics}
                    onCheckedChange={(checked) => setPrivacy({ ...privacy, shareAnalytics: checked })}
                  />
                </div>
              </div>
            </div>

            <div className="glass-card p-6 space-y-6">
              <div>
                <h3 className="text-lg font-semibold text-foreground mb-1">Sicurezza</h3>
                <p className="text-sm text-muted-foreground">Proteggi il tuo account</p>
              </div>

              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Key className="w-5 h-5 text-muted-foreground" />
                    <div>
                      <p className="font-medium text-foreground">Autenticazione a due fattori</p>
                      <p className="text-sm text-muted-foreground">Aggiungi un livello extra di sicurezza</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {privacy.twoFactorEnabled ? (
                      <Badge variant="success">Attivo</Badge>
                    ) : (
                      <Badge variant="secondary">Disattivo</Badge>
                    )}
                    <Button variant="outline" size="sm">
                      {privacy.twoFactorEnabled ? 'Gestisci' : 'Attiva'}
                    </Button>
                  </div>
                </div>
                <Separator />
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Shield className="w-5 h-5 text-muted-foreground" />
                    <div>
                      <p className="font-medium text-foreground">Cambia password</p>
                      <p className="text-sm text-muted-foreground">Ultima modifica: 30 giorni fa</p>
                    </div>
                  </div>
                  <Button variant="outline" size="sm">
                    Modifica
                  </Button>
                </div>
              </div>
            </div>

            <div className="flex justify-end">
              <Button variant="gradient" onClick={handleSave}>
                <Save className="w-4 h-4 mr-2" />
                Salva preferenze
              </Button>
            </div>
          </TabsContent>

          {/* Integrations Tab */}
          <TabsContent value="integrations" className="space-y-6">
            <div className="glass-card p-6 space-y-6">
              <div>
                <h3 className="text-lg font-semibold text-foreground mb-1">Integrazioni ML</h3>
                <p className="text-sm text-muted-foreground">Connetti servizi esterni per potenziare i tuoi progetti</p>
              </div>

              <div className="space-y-4">
                {[
                  { name: 'AWS S3', description: 'Storage per dataset di grandi dimensioni', connected: true },
                  { name: 'Google Cloud Storage', description: 'Alternativa cloud storage', connected: false },
                  { name: 'MLflow', description: 'Tracking esperimenti e modelli', connected: true },
                  { name: 'Weights & Biases', description: 'Monitoraggio training ML', connected: false },
                  { name: 'GitHub', description: 'Versionamento codice e modelli', connected: true },
                  { name: 'Slack', description: 'Notifiche e collaborazione team', connected: false },
                ].map((integration) => (
                  <div key={integration.name} className="flex items-center justify-between p-4 rounded-lg bg-muted/30">
                    <div className="flex items-center gap-3">
                      <div className={cn(
                        'w-10 h-10 rounded-lg flex items-center justify-center',
                        integration.connected ? 'bg-success/20' : 'bg-muted'
                      )}>
                        <Database className={cn(
                          'w-5 h-5',
                          integration.connected ? 'text-success' : 'text-muted-foreground'
                        )} />
                      </div>
                      <div>
                        <p className="font-medium text-foreground">{integration.name}</p>
                        <p className="text-sm text-muted-foreground">{integration.description}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {integration.connected && <Badge variant="success">Connesso</Badge>}
                      <Button variant="outline" size="sm">
                        {integration.connected ? 'Gestisci' : 'Connetti'}
                        <ChevronRight className="w-4 h-4 ml-1" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="glass-card p-6 space-y-6">
              <div>
                <h3 className="text-lg font-semibold text-foreground mb-1">API Keys</h3>
                <p className="text-sm text-muted-foreground">Gestisci le chiavi API per l'accesso programmatico</p>
              </div>

              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 rounded-lg bg-muted/30">
                  <div>
                    <p className="font-medium text-foreground">Production API Key</p>
                    <p className="text-sm text-muted-foreground font-mono">mlp_prod_****...****7f2a</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="success">Attiva</Badge>
                    <Button variant="outline" size="sm">Rigenera</Button>
                  </div>
                </div>
                <div className="flex items-center justify-between p-4 rounded-lg bg-muted/30">
                  <div>
                    <p className="font-medium text-foreground">Development API Key</p>
                    <p className="text-sm text-muted-foreground font-mono">mlp_dev_****...****3b1c</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="success">Attiva</Badge>
                    <Button variant="outline" size="sm">Rigenera</Button>
                  </div>
                </div>
              </div>

              <Button variant="outline">
                <Key className="w-4 h-4 mr-2" />
                Genera nuova API Key
              </Button>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </MainLayout>
  );
}
