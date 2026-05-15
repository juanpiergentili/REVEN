import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { auth, db } from '@/src/lib/firebase';
import {
  Users, Clock, CheckCircle, XCircle, ShieldCheck,
  Building2, Mail, Phone, CreditCard, ArrowLeft, Loader2, Trash2,
  DollarSign, TrendingUp, Activity, BarChart3, ShoppingBag, MessageSquare
} from 'lucide-react';
import {
  getAllUsers, approveUser, rejectUser, reactivateUser, deleteUser, UserRecord,
  getPlatformStats, getFinancialStats, PlatformStats, FinancialStats, promoteToAdmin, deleteAllMemberships
} from '@/src/lib/admin';

const SUPER_ADMINS = ['lucas.ferreyra@gmail.com'];
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';

const STATUS_LABEL: Record<string, { label: string; color: string }> = {
  pending:   { label: 'Pendiente',  color: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30' },
  approved:  { label: 'Aprobado',   color: 'bg-blue-500/20 text-blue-400 border-blue-500/30' },
  active:    { label: 'Activo',     color: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30' },
  rejected:  { label: 'Rechazado',  color: 'bg-red-500/20 text-red-400 border-red-500/30' },
  suspended: { label: 'Suspendido', color: 'bg-orange-500/20 text-orange-400 border-orange-500/30' },
};

const PLAN_LABEL: Record<string, string> = {
  plata: 'Business',
  business: 'Business',
  oro: 'Professional',
  professional: 'Professional',
  platinum: 'Enterprise',
  enterprise: 'Enterprise',
  admin: 'Admin',
};

function formatDate(ts: any): string {
  if (!ts) return '—';
  const d = ts.toDate ? ts.toDate() : new Date(ts);
  return d.toLocaleDateString('es-AR', { day: '2-digit', month: 'short', year: 'numeric' });
}

export function Admin() {
  const navigate = useNavigate();
  const [authorized, setAuthorized] = useState(false);
  const [authLoading, setAuthLoading] = useState(true);
  const [users, setUsers] = useState<UserRecord[]>([]);
  const [platformStats, setPlatformStats] = useState<PlatformStats | null>(null);
  const [financialStats, setFinancialStats] = useState<FinancialStats | null>(null);
  const [dataLoading, setDataLoading] = useState(true);
  const [tab, setTab] = useState<'dashboard' | 'pending' | 'all'>('dashboard');
  const [actionId, setActionId] = useState<string | null>(null);

  // Auth guard — only ADMIN can access
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (u) => {
      if (!u) { navigate('/'); return; }
      const snap = await getDoc(doc(db, 'users', u.uid));
      const data = snap.data();
      if (snap.exists() && (data?.role === 'ADMIN' || (u.email && SUPER_ADMINS.includes(u.email)))) {
        setAuthorized(true);
      } else {
        navigate('/marketplace');
      }
      setAuthLoading(false);
    });
    return unsub;
  }, []);

  const loadData = async () => {
    setDataLoading(true);
    try {
      const [all, pStats, fStats] = await Promise.all([
        getAllUsers(),
        getPlatformStats(),
        getFinancialStats()
      ]);
      setUsers(all);
      setPlatformStats(pStats);
      setFinancialStats(fStats);
    } catch (err) {
      console.error('Error loading admin data:', err);
    } finally {
      setDataLoading(false);
    }
  };

  useEffect(() => {
    if (authorized) loadData();
  }, [authorized]);

  const handleApprove = async (uid: string) => {
    setActionId(uid);
    try {
      const u = users.find(x => x.uid === uid);
      await approveUser(uid, u);
      await loadData();
    } catch (err) {
      console.error('Error approving user:', err);
    } finally {
      setActionId(null);
    }
  };

  const handleReject = async (uid: string) => {
    setActionId(uid);
    try {
      await rejectUser(uid);
      await loadData();
    } catch (err) {
      console.error('Error rejecting user:', err);
    } finally {
      setActionId(null);
    }
  };

  const handleDelete = async (uid: string) => {
    if (!window.confirm('¿Estás seguro de eliminar este usuario? Esta acción borrará su perfil de la base de datos.')) return;
    setActionId(uid);
    try {
      await deleteUser(uid);
      await loadData();
    } catch (err) {
      console.error('Error deleting user:', err);
      alert('No se pudo eliminar el usuario. Verificá los permisos.');
    } finally {
      setActionId(null);
    }
  };

  const handleReactivate = async (uid: string) => {
    if (!window.confirm('¿Reactivar este usuario? Se reactivarán sus publicaciones y búsquedas pausadas.')) return;
    setActionId(uid);
    try {
      await reactivateUser(uid);
      await loadData();
    } catch (err) {
      console.error('Error reactivating user:', err);
    } finally {
      setActionId(null);
    }
  };

  const handlePromote = async (uid: string) => {
    if (!window.confirm('¿Estás seguro de otorgar permisos de ADMINISTRADOR a este usuario?')) return;
    setActionId(uid);
    try {
      await promoteToAdmin(uid);
      await loadData();
    } catch (err) {
      console.error('Error promoting user:', err);
    } finally {
      setActionId(null);
    }
  };

  if (authLoading) {
    return (
      <div className="h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!authorized) return null;

  const pending  = users.filter(u => u.status === 'pending');
  const active   = users.filter(u => u.status === 'active' && u.role !== 'ADMIN');
  const rejected = users.filter(u => u.status === 'rejected');
  const displayed = tab === 'pending' ? pending : users.filter(u => u.role !== 'ADMIN');

  const stats = [
    { label: 'Total usuarios', value: users.filter(u => u.role !== 'ADMIN').length, icon: Users, color: 'text-primary' },
    { label: 'Pendientes',     value: pending.length,  icon: Clock,        color: 'text-yellow-400' },
    { label: 'Activos',        value: active.length,   icon: CheckCircle,  color: 'text-emerald-400' },
    { label: 'Rechazados',     value: rejected.length, icon: XCircle,      color: 'text-red-400' },
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b border-border bg-background/80 backdrop-blur-xl px-6 py-4 flex items-center gap-4">
        <Button variant="ghost" size="icon" className="rounded-full" onClick={() => navigate('/marketplace')}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <ShieldCheck className="h-5 w-5 text-primary" />
        <h1 className="text-xl font-bold tracking-tighter uppercase">Panel de Administración</h1>
        {pending.length > 0 && (
          <Badge className="bg-yellow-500/20 text-yellow-400 border-yellow-500/30 font-bold text-[10px] rounded-full px-3">
            {pending.length} pendiente{pending.length > 1 ? 's' : ''}
          </Badge>
        )}
      </div>

      <div className="max-w-6xl mx-auto px-4 py-8 space-y-8">
        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {stats.map(s => (
            <div key={s.label} className="bg-card border border-border rounded-2xl p-5 flex flex-col gap-2">
              <s.icon className={`h-5 w-5 ${s.color}`} />
              <p className="text-3xl font-black tracking-tighter">{s.value}</p>
              <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">{s.label}</p>
            </div>
          ))}
        </div>

        {/* Tabs */}
        <div className="flex gap-2">
          <button
            onClick={() => setTab('dashboard')}
            className={`px-5 py-2 rounded-xl text-[11px] font-bold uppercase tracking-widest transition-all ${tab === 'dashboard' ? 'bg-primary text-primary-foreground shadow-lg shadow-primary/20' : 'bg-muted text-muted-foreground hover:bg-muted/80'}`}
          >
            Métricas
          </button>
          <button
            onClick={() => setTab('pending')}
            className={`px-5 py-2 rounded-xl text-[11px] font-bold uppercase tracking-widest transition-all ${tab === 'pending' ? 'bg-primary text-primary-foreground shadow-lg shadow-primary/20' : 'bg-muted text-muted-foreground hover:bg-muted/80'}`}
          >
            Pendientes {pending.length > 0 && `(${pending.length})`}
          </button>
          <button
            onClick={() => setTab('all')}
            className={`px-5 py-2 rounded-xl text-[11px] font-bold uppercase tracking-widest transition-all ${tab === 'all' ? 'bg-primary text-primary-foreground shadow-lg shadow-primary/20' : 'bg-muted text-muted-foreground hover:bg-muted/80'}`}
          >
            Usuarios
          </button>
        </div>

        {dataLoading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : tab === 'dashboard' ? (
          <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {/* Financial Dashboard */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-card border border-border rounded-3xl p-6 relative overflow-hidden group">
                <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:scale-110 transition-transform">
                  <DollarSign className="h-24 w-24 text-primary" />
                </div>
                <div className="relative z-10 space-y-4">
                  <div className="h-10 w-10 rounded-2xl bg-primary/10 flex items-center justify-center">
                    <TrendingUp className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <p className="text-4xl font-black tracking-tighter text-white">
                      ${financialStats?.mrr.toLocaleString('es-AR', { maximumFractionDigits: 0 })}
                    </p>
                    <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mt-1">MRR (Ingresos Recurrentes)</p>
                  </div>
                  <p className="text-[10px] font-medium text-muted-foreground">Proyectado Anual: ${financialStats?.arr.toLocaleString('es-AR', { maximumFractionDigits: 0 })} ARR</p>
                </div>
              </div>

              <div className="bg-card border border-border rounded-3xl p-6 relative overflow-hidden group">
                <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:scale-110 transition-transform">
                  <Building2 className="h-24 w-24 text-blue-400" />
                </div>
                <div className="relative z-10 space-y-4">
                  <div className="h-10 w-10 rounded-2xl bg-blue-500/10 flex items-center justify-center">
                    <Activity className="h-5 w-5 text-blue-400" />
                  </div>
                  <div>
                    <p className="text-4xl font-black tracking-tighter text-white">
                      {platformStats?.activeUsers}
                    </p>
                    <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mt-1">Agencias Activas</p>
                  </div>
                  <p className="text-[10px] font-medium text-muted-foreground">Suscripciones: {financialStats?.activeSubscriptions}</p>
                </div>
              </div>

              <div className="bg-card border border-border rounded-3xl p-6 relative overflow-hidden group">
                <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:scale-110 transition-transform">
                  <ShoppingBag className="h-24 w-24 text-emerald-400" />
                </div>
                <div className="relative z-10 space-y-4">
                  <div className="h-10 w-10 rounded-2xl bg-emerald-500/10 flex items-center justify-center">
                    <BarChart3 className="h-5 w-5 text-emerald-400" />
                  </div>
                  <div>
                    <p className="text-4xl font-black tracking-tighter text-white">
                      {platformStats?.activeVehicles}
                    </p>
                    <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mt-1">Vehículos en Stock</p>
                  </div>
                  <p className="text-[10px] font-medium text-muted-foreground">Tasa de Activación: {platformStats?.activationRate.toFixed(1)}%</p>
                </div>
              </div>
            </div>

            {/* Engagement Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-card border border-border rounded-3xl p-8 space-y-6">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-black uppercase tracking-widest">Interacciones del Marketplace</h3>
                  <MessageSquare className="h-5 w-5 text-primary" />
                </div>
                <div className="flex items-end gap-3">
                  <span className="text-6xl font-black tracking-tighter">{platformStats?.totalConversations}</span>
                  <span className="text-[10px] font-bold text-muted-foreground mb-3 uppercase tracking-widest">Conversaciones Totales</span>
                </div>
                <div className="h-2 w-full bg-muted rounded-full overflow-hidden">
                  <div className="h-full bg-primary" style={{ width: '65%' }} />
                </div>
                <p className="text-[10px] font-medium text-muted-foreground">Promedio de {((platformStats?.totalConversations || 0) / (platformStats?.activeUsers || 1)).toFixed(1)} contactos por agencia.</p>
              </div>

              <div className="bg-card border border-border rounded-3xl p-8 space-y-6">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-black uppercase tracking-widest">Estado de Cobros</h3>
                  <CreditCard className="h-5 w-5 text-primary" />
                </div>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Ingresos Totales</span>
                    <span className="font-bold text-emerald-400">${financialStats?.totalRevenue.toLocaleString('es-AR')}</span>
                  </div>
                  <Separator className="bg-border/50" />
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Cobros Pendientes</span>
                    <span className="font-bold text-yellow-400">$0</span>
                  </div>
                  <Separator className="bg-border/50" />
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Tasa de Churn</span>
                    <span className="font-bold text-red-400">0%</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Recent Payments Table */}
            <div className="bg-card border border-border rounded-3xl overflow-hidden">
              <div className="p-6 border-b border-border flex items-center justify-between">
                <h3 className="text-sm font-black uppercase tracking-widest">Pagos Recientes</h3>
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="rounded-full px-4">Últimos 10</Badge>
                  <Button
                    variant="outline"
                    size="sm"
                    className="rounded-full text-[10px] font-bold uppercase tracking-widest text-destructive border-destructive/30 hover:bg-destructive/10 h-8 px-3"
                    onClick={async () => {
                      if (!window.confirm('¿Eliminar todos los pagos de prueba? Esta acción no se puede deshacer.')) return;
                      await deleteAllMemberships();
                      setFinancialStats(null);
                      loadData();
                    }}
                  >
                    Resetear datos de prueba
                  </Button>
                </div>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead>
                    <tr className="bg-muted/50">
                      <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-muted-foreground">Concesionaria</th>
                      <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-muted-foreground">Plan</th>
                      <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-muted-foreground">Ciclo</th>
                      <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-muted-foreground">Monto</th>
                      <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-muted-foreground">Código</th>
                      <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-muted-foreground">Fecha</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/50">
                    {financialStats?.recentPayments.map((p: any) => (
                      <tr key={p.id} className="hover:bg-muted/30 transition-colors">
                        <td className="px-6 py-4 text-[11px] font-bold tracking-tight uppercase truncate max-w-[180px]">{p.companyName || p.id}</td>
                        <td className="px-6 py-4">
                          <Badge className="bg-primary/10 text-primary border-primary/20 text-[9px] font-black rounded-full uppercase">{PLAN_LABEL[p.plan] ?? p.plan}</Badge>
                        </td>
                        <td className="px-6 py-4 text-[11px] font-medium text-muted-foreground uppercase tracking-widest">{p.billingCycle}</td>
                        <td className="px-6 py-4 text-[11px] font-black text-white">${p.pricePaid?.toLocaleString('es-AR')}</td>
                        <td className="px-6 py-4 text-[11px] font-bold text-primary">{p.discountCode || '—'}</td>
                        <td className="px-6 py-4 text-[11px] font-medium text-muted-foreground">{formatDate(p.createdAt)}</td>
                      </tr>
                    ))}
                    {financialStats?.recentPayments.length === 0 && (
                      <tr>
                        <td colSpan={6} className="px-6 py-12 text-center text-[11px] font-bold uppercase tracking-widest text-muted-foreground">No hay pagos registrados</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        ) : (
          /* User list (All or Pending) */
          displayed.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-center space-y-3">
              <CheckCircle className="h-12 w-12 text-emerald-400 opacity-50" />
              <p className="font-bold uppercase tracking-tighter text-lg">
                {tab === 'pending' ? 'Sin pendientes' : 'Sin usuarios'}
              </p>
              <p className="text-sm text-muted-foreground">
                {tab === 'pending' ? 'Todos los usuarios están procesados.' : 'No hay usuarios registrados en el sistema.'}
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {displayed.map(u => {
                const statusInfo = STATUS_LABEL[u.status] ?? { label: u.status, color: 'bg-muted text-muted-foreground' };
                return (
                  <div key={u.uid} className="bg-card border border-border rounded-2xl p-5 flex flex-col sm:flex-row sm:items-center gap-4">
                    <Avatar className="h-12 w-12 shrink-0 border-2 border-primary/20">
                      <AvatarFallback className="bg-primary/10 text-primary font-bold text-sm">
                        {(u.name?.[0] ?? '') + (u.lastName?.[0] ?? '')}
                      </AvatarFallback>
                    </Avatar>

                    <div className="flex-1 min-w-0 space-y-1.5">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-bold uppercase tracking-tight">{u.name} {u.lastName}</span>
                        <Badge variant="outline" className={`text-[9px] font-bold tracking-wider rounded-full px-2 border ${statusInfo.color}`}>
                          {statusInfo.label}
                        </Badge>
                        <Badge variant="outline" className="text-[9px] font-bold tracking-wider rounded-full px-2 border-border bg-muted">
                          {PLAN_LABEL[u.plan] ?? u.plan}
                        </Badge>
                        {u.discountCode === 'REVENFREE60' && (
                          <Badge className="text-[9px] font-bold tracking-wider rounded-full px-2 bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                            60 DÍAS GRATIS
                          </Badge>
                        )}
                      </div>
                      <div className="flex flex-wrap gap-x-4 gap-y-1 text-[11px] text-muted-foreground font-medium">
                        <span className="flex items-center gap-1"><Building2 className="h-3 w-3" />{u.company}</span>
                        <span className="flex items-center gap-1"><Mail className="h-3 w-3" />{u.email}</span>
                        {u.phone && <span className="flex items-center gap-1"><Phone className="h-3 w-3" />{u.phone}</span>}
                        {u.cuil && <span className="flex items-center gap-1"><CreditCard className="h-3 w-3" />{u.cuil}</span>}
                      </div>
                      {(u.arcaRazonSocial || u.arcaEstadoClave) && (
                        <div className="flex flex-wrap gap-x-4 gap-y-1 text-[10px] font-medium mt-0.5">
                          {u.arcaRazonSocial && (
                            <span className="text-white/60 uppercase tracking-wide">ARCA: {u.arcaRazonSocial}</span>
                          )}
                          {u.arcaEstadoClave && (
                            <span className={`font-bold uppercase tracking-widest ${u.arcaEstadoClave === 'ACTIVO' ? 'text-emerald-400' : 'text-red-400'}`}>
                              {u.arcaEstadoClave}
                            </span>
                          )}
                        </div>
                      )}
                      <p className="text-[10px] text-muted-foreground">Registrado: {formatDate(u.createdAt)}</p>
                    </div>

                    <div className="flex gap-2 shrink-0">
                      {u.status === 'pending' && (
                        <>
                          <Button
                            size="sm"
                            disabled={actionId === u.uid}
                            onClick={() => handleApprove(u.uid)}
                            className="rounded-xl h-9 px-4 text-[10px] font-bold uppercase tracking-widest bg-emerald-500 hover:bg-emerald-600 text-white shadow-lg shadow-emerald-500/20"
                          >
                            {actionId === u.uid ? <Loader2 className="h-3 w-3 animate-spin" /> : 'Aprobar'}
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            disabled={actionId === u.uid}
                            onClick={() => handleReject(u.uid)}
                            className="rounded-xl h-9 px-4 text-[10px] font-bold uppercase tracking-widest border-red-500/40 text-red-400 hover:bg-red-500/10"
                          >
                            Rechazar
                          </Button>
                        </>
                      )}

                      {u.status === 'active' && (
                        <Button
                          size="sm"
                          variant="outline"
                          disabled={actionId === u.uid}
                          onClick={() => handleReject(u.uid)}
                          className="rounded-xl h-9 px-4 text-[10px] font-bold uppercase tracking-widest border-red-500/40 text-red-400 hover:bg-red-500/10 shrink-0"
                        >
                          Suspender
                        </Button>
                      )}

                      {u.status === 'rejected' && (
                        <Button
                          size="sm"
                          disabled={actionId === u.uid}
                          onClick={() => handleApprove(u.uid)}
                          className="rounded-xl h-9 px-4 text-[10px] font-bold uppercase tracking-widest bg-emerald-500 hover:bg-emerald-600 text-white shrink-0"
                        >
                          Reactivar
                        </Button>
                      )}

                      {u.status === 'suspended' && (
                        <Button
                          size="sm"
                          disabled={actionId === u.uid}
                          onClick={() => handleReactivate(u.uid)}
                          className="rounded-xl h-9 px-4 text-[10px] font-bold uppercase tracking-widest bg-emerald-500 hover:bg-emerald-600 text-white shrink-0"
                        >
                          {actionId === u.uid ? <Loader2 className="h-3 w-3 animate-spin" /> : 'Reactivar'}
                        </Button>
                      )}

                      {u.role !== 'ADMIN' && (
                        <Button
                          size="sm"
                          variant="ghost"
                          disabled={actionId === u.uid}
                          onClick={() => handlePromote(u.uid)}
                          className="rounded-xl h-9 px-4 text-[10px] font-bold uppercase tracking-widest text-primary hover:bg-primary/10"
                        >
                          Hacer Admin
                        </Button>
                      )}

                      <Button
                        size="icon"
                        variant="ghost"
                        disabled={actionId === u.uid}
                        onClick={() => handleDelete(u.uid)}
                        className="rounded-xl h-9 w-9 text-muted-foreground hover:text-red-400 hover:bg-red-500/10"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          )
        )}
      </div>
    </div>
  );
}
