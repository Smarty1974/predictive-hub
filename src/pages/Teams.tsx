import { Users, Shield, FolderKanban, ChevronRight, Plus } from 'lucide-react';
import { MainLayout } from '@/components/layout/MainLayout';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { mockGroups, mockUsers, mockProjects } from '@/data/mock-data';

const roleLabels = {
  owner: 'Owner',
  admin: 'Admin',
  member: 'Membro',
  viewer: 'Visualizzatore',
};

const roleColors = {
  owner: 'bg-primary/20 text-primary',
  admin: 'bg-accent/20 text-accent',
  member: 'bg-muted text-muted-foreground',
  viewer: 'bg-muted text-muted-foreground',
};

export default function Teams() {
  return (
    <MainLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Team e Gruppi</h1>
            <p className="text-muted-foreground">Gestisci i team e i permessi di accesso ai progetti</p>
          </div>
          <Button variant="gradient">
            <Plus className="w-4 h-4 mr-2" />
            Nuovo Team
          </Button>
        </div>

        {/* Teams Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {mockGroups.map((group) => {
            const groupProjects = mockProjects.filter((p) => p.groupId === group.id);
            const parentGroup = group.parentId ? mockGroups.find((g) => g.id === group.parentId) : null;

            return (
              <div key={group.id} className="glass-card p-6">
                {/* Header */}
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-xl bg-gradient-primary flex items-center justify-center">
                      <Users className="w-6 h-6 text-primary-foreground" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-foreground">{group.name}</h3>
                      <p className="text-sm text-muted-foreground">{group.description}</p>
                    </div>
                  </div>
                  <Button variant="ghost" size="icon">
                    <ChevronRight className="w-5 h-5" />
                  </Button>
                </div>

                {/* Parent Group */}
                {parentGroup && (
                  <div className="mb-4 p-2 rounded-lg bg-muted/30 text-sm">
                    <span className="text-muted-foreground">Gruppo padre: </span>
                    <span className="text-foreground">{parentGroup.name}</span>
                  </div>
                )}

                {/* Stats */}
                <div className="grid grid-cols-3 gap-4 mb-4 p-3 rounded-lg bg-muted/30">
                  <div className="text-center">
                    <p className="text-2xl font-bold text-foreground">{group.members.length}</p>
                    <p className="text-xs text-muted-foreground">Membri</p>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-bold text-foreground">{groupProjects.length}</p>
                    <p className="text-xs text-muted-foreground">Progetti</p>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-bold text-foreground">{group.permissions.length}</p>
                    <p className="text-xs text-muted-foreground">Permessi</p>
                  </div>
                </div>

                {/* Members */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <h4 className="text-sm font-medium text-foreground">Membri</h4>
                    <Button variant="ghost" size="sm" className="text-primary">
                      Gestisci
                    </Button>
                  </div>
                  <div className="space-y-2">
                    {group.members.map((member) => {
                      const user = mockUsers.find((u) => u.id === member.userId);
                      if (!user) return null;
                      return (
                        <div key={member.userId} className="flex items-center justify-between p-2 rounded-lg hover:bg-muted/30 transition-colors">
                          <div className="flex items-center gap-3">
                            <Avatar className="w-8 h-8">
                              <AvatarImage src={user.avatar} alt={user.name} />
                              <AvatarFallback>{user.name.charAt(0)}</AvatarFallback>
                            </Avatar>
                            <div>
                              <p className="text-sm font-medium text-foreground">{user.name}</p>
                              <p className="text-xs text-muted-foreground">{user.email}</p>
                            </div>
                          </div>
                          <Badge className={roleColors[member.role]}>{roleLabels[member.role]}</Badge>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Permissions Summary */}
                <div className="mt-4 pt-4 border-t border-border">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Shield className="w-4 h-4" />
                    <span>Permessi:</span>
                    {group.permissions.map((p) => (
                      <Badge key={p.resource} variant="glass" className="text-xs">
                        {p.resource}
                      </Badge>
                    ))}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Hierarchy Visualization */}
        <div className="glass-card p-6">
          <h3 className="font-semibold text-foreground mb-4">Gerarchia Team</h3>
          <div className="flex items-center gap-4">
            {mockGroups
              .filter((g) => !g.parentId)
              .map((group) => (
                <div key={group.id} className="flex flex-col items-center">
                  <div className="p-4 rounded-xl bg-primary/20 border border-primary/30">
                    <Users className="w-6 h-6 text-primary" />
                  </div>
                  <p className="text-sm font-medium mt-2">{group.name}</p>
                  {mockGroups
                    .filter((g) => g.parentId === group.id)
                    .map((child) => (
                      <div key={child.id} className="mt-4 flex flex-col items-center">
                        <div className="w-px h-4 bg-border" />
                        <div className="p-3 rounded-lg bg-accent/20 border border-accent/30">
                          <Users className="w-5 h-5 text-accent" />
                        </div>
                        <p className="text-xs font-medium mt-1">{child.name}</p>
                      </div>
                    ))}
                </div>
              ))}
          </div>
        </div>
      </div>
    </MainLayout>
  );
}
