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
  getAllUsers, approveUser, rejectUser, deleteUser, UserRecord,
  getPlatformStats, getFinancialStats, PlatformStats, FinancialStats, promoteToAdmin
} from '@/src/lib/admin';

const SUPER_ADMINS = ['lucas.ferreyra@gmail.com'];
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';

const STATUS_LABEL: Record<string, { label: string; color: string }> = {
  pending:  { label: 'Pendiente', color: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30' },
  active:   { label: 'Activo',    color: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30' },
  rejected: { label: 'Rechazado', color: 'bg-red-500/20 text-red-400 border-red-500/30' },
};

const PLAN_LABEL: Record<string, string> = {
  plata: 'Plata',
  oro: 'Oro',
  platinum: 'Platinum',
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
    const u = users.find(x => x.uid === uid);
    await approveUser(uid, u);
    await loadData();
    setActionId(null);
  };

  const handleReject = async (uid: string) => {
    setActionId(uid);
    await rejectUser(uid);
    await loadData();
    setActionId(null);
  };

  const handleDelete = async (uid: string) => {
    if (!window.confirm('¿Estás seguro de eliminar este usuario? Esta acción borrará su perfil de la base de datos.')) return;
    setActionId(uid);
    await deleteUser(uid);
    await loadData();
    setActionId(null);
  };

  const handlePromote = async (uid: string) => {
    if (!window.confirm('¿Estás seguro de otorgar permisos de ADMINISTRADOR a este usuario?')) return;
    setActionId(uid);
    await promoteToAdmin(uid);
    await loadData();
    setActionId(null);
  };

  if (authLoading) {
    return (
      <div className="h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!authorized) return null;

  const pending  = users.filter(u => u.status === 'pending').sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  const active   = users.filter(u => u.status === 'active' && u.role !== 'ADMIN');
  const rejected = users.filter(u => u.status === 'rejected');
  
  // Sort the full list by request date for the "Usuarios" tab
  const sortedUsers = [...users].filter(u => u.role !== 'ADMIN').sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  
  const displayed = tab === 'pending' ? pending : sortedUsers;

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
                <Badge variant="outline" className="rounded-full px-4">Últimos 10</Badge>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead>
                    <tr className="bg-muted/50">
                      <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-muted-foreground">ID</th>
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
                        <td className="px-6 py-4 text-[11px] font-bold tracking-tight uppercase truncate max-w-[120px]">{p.id}</td>
                        <td className="px-6 py-4">
                          <Badge className="bg-primary/10 text-primary border-primary/20 text-[9px] font-black rounded-full uppercase">{p.plan}</Badge>
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
          <div className="bg-card border border-border rounded-3xl overflow-hidden shadow-2xl">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-muted/50 border-b border-border/50">
                    <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-muted-foreground whitespace-nowrap">ID</th>
                    <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-muted-foreground whitespace-nowrap">Solicitud</th>
                    <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-muted-foreground whitespace-nowrap">Razón Social</th>
                    <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-muted-foreground whitespace-nowrap">Nombre y Apellido</th>
                    <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-muted-foreground whitespace-nowrap">Teléfono</th>
                    <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-muted-foreground whitespace-nowrap">Email</th>
                    <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-muted-foreground whitespace-nowrap">Provincia</th>
                    <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-muted-foreground whitespace-nowrap">Localidad</th>
                    <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-muted-foreground whitespace-nowrap text-center">Autos</th>
                    <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-muted-foreground whitespace-nowrap">Plan</th>
                    <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-muted-foreground whitespace-nowrap">Estado</th>
                    <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-muted-foreground whitespace-nowrap text-right">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/30">
                  {displayed.map((u, index) => {
                    const statusInfo = STATUS_LABEL[u.status] ?? { label: u.status, color: 'bg-muted text-muted-foreground' };
                    const shortId = `#${(index + 500).toString().padStart(5, '0')}`;
                    return (
                      <tr key={u.uid} className="hover:bg-muted/20 transition-colors group">
                        <td className="px-6 py-4">
                          <span className="text-[11px] font-black text-primary/70 tracking-tighter">{shortId}</span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="text-[11px] font-medium text-muted-foreground">{formatDate(u.createdAt)}</span>
                        </td>
                        <td className="px-6 py-4">
                          <span className="text-xs font-bold uppercase tracking-tight text-white">{u.company || '—'}</span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center gap-3">
                            <Avatar className="h-8 w-8 shrink-0 border border-primary/20">
                              <AvatarFallback className="bg-primary/10 text-primary font-bold text-[10px]">
                                {(u.name?.[0] ?? '') + (u.lastName?.[0] ?? '')}
                              </AvatarFallback>
                            </Avatar>
                            <span className="text-xs font-medium">{u.name} {u.lastName}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="text-xs font-medium text-muted-foreground">{u.phone || '—'}</span>
                        </td>
                        <td className="px-6 py-4">
                          <span className="text-xs font-medium text-muted-foreground truncate block max-w-[150px]">{u.email}</span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="text-xs font-medium text-muted-foreground">{u.provinceDisplay || u.province || '—'}</span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="text-xs font-medium text-muted-foreground">{u.cityDisplay || u.city || '—'}</span>
                        </td>
                        <td className="px-6 py-4 text-center">
                          <Badge variant="outline" className="text-[10px] font-black rounded-full px-2 border-primary/20 text-primary">
                            {u.vehicleCount || 0}
                          </Badge>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <Badge variant="outline" className="text-[9px] font-bold tracking-wider rounded-full px-2 border-border bg-muted/30">
                            {PLAN_LABEL[u.plan] ?? u.plan}
                          </Badge>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <Badge variant="outline" className={`text-[9px] font-bold tracking-wider rounded-full px-2 border ${statusInfo.color}`}>
                            {statusInfo.label}
                          </Badge>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <div className="flex justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            {u.status === 'pending' && (
                              <Button
                                size="icon"
                                variant="ghost"
                                disabled={actionId === u.uid}
                                onClick={() => handleApprove(u.uid)}
                                className="h-8 w-8 text-emerald-400 hover:text-emerald-500 hover:bg-emerald-500/10 rounded-lg"
                              >
                                {actionId === u.uid ? <Loader2 className="h-3 w-3 animate-spin" /> : <CheckCircle className="h-4 w-4" />}
                              </Button>
                            )}
                            {(u.status === 'pending' || u.status === 'active') && (
                              <Button
                                size="icon"
                                variant="ghost"
                                disabled={actionId === u.uid}
                                onClick={() => handleReject(u.uid)}
                                className="h-8 w-8 text-red-400 hover:text-red-500 hover:bg-red-500/10 rounded-lg"
                              >
                                <XCircle className="h-4 w-4" />
                              </Button>
                            )}
                            {u.status === 'rejected' && (
                              <Button
                                size="icon"
                                variant="ghost"
                                disabled={actionId === u.uid}
                                onClick={() => handleApprove(u.uid)}
                                className="h-8 w-8 text-emerald-400 hover:text-emerald-500 hover:bg-emerald-500/10 rounded-lg"
                              >
                                <TrendingUp className="h-4 w-4" />
                              </Button>
                            )}
                            {u.role !== 'ADMIN' && (
                              <Button
                                size="icon"
                                variant="ghost"
                                disabled={actionId === u.uid}
                                onClick={() => handlePromote(u.uid)}
                                className="h-8 w-8 text-primary hover:bg-primary/10 rounded-lg"
                              >
                                <ShieldCheck className="h-4 w-4" />
                              </Button>
                            )}
                            <Button
                              size="icon"
                              variant="ghost"
                              disabled={actionId === u.uid}
                              onClick={() => handleDelete(u.uid)}
                              className="h-8 w-8 text-muted-foreground hover:text-red-400 hover:bg-red-500/10 rounded-lg"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
          )
        )}
      </div>
    </div>
  );
}
