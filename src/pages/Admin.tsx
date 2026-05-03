import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { auth, db } from '@/src/lib/firebase';
import { getAllUsers, approveUser, rejectUser, UserRecord } from '@/src/lib/admin';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import {
  Users, Clock, CheckCircle, XCircle, ShieldCheck,
  Building2, Mail, Phone, CreditCard, ArrowLeft, Loader2,
} from 'lucide-react';

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
  const [dataLoading, setDataLoading] = useState(true);
  const [tab, setTab] = useState<'pending' | 'all'>('pending');
  const [actionId, setActionId] = useState<string | null>(null);

  // Auth guard — only ADMIN can access
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (u) => {
      if (!u) { navigate('/'); return; }
      const snap = await getDoc(doc(db, 'users', u.uid));
      if (snap.exists() && snap.data().role === 'ADMIN') {
        setAuthorized(true);
      } else {
        navigate('/marketplace');
      }
      setAuthLoading(false);
    });
    return unsub;
  }, []);

  const loadUsers = async () => {
    setDataLoading(true);
    const all = await getAllUsers();
    setUsers(all);
    setDataLoading(false);
  };

  useEffect(() => {
    if (authorized) loadUsers();
  }, [authorized]);

  const handleApprove = async (uid: string) => {
    setActionId(uid);
    const u = users.find(x => x.uid === uid);
    await approveUser(uid, u);
    await loadUsers();
    setActionId(null);
  };

  const handleReject = async (uid: string) => {
    setActionId(uid);
    await rejectUser(uid);
    await loadUsers();
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
            onClick={() => setTab('pending')}
            className={`px-5 py-2 rounded-xl text-[11px] font-bold uppercase tracking-widest transition-all ${tab === 'pending' ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground hover:bg-muted/80'}`}
          >
            Pendientes {pending.length > 0 && `(${pending.length})`}
          </button>
          <button
            onClick={() => setTab('all')}
            className={`px-5 py-2 rounded-xl text-[11px] font-bold uppercase tracking-widest transition-all ${tab === 'all' ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground hover:bg-muted/80'}`}
          >
            Todos los usuarios
          </button>
        </div>

        {/* User list */}
        {dataLoading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : displayed.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center space-y-3">
            <CheckCircle className="h-12 w-12 text-emerald-400 opacity-50" />
            <p className="font-bold uppercase tracking-tighter text-lg">Sin pendientes</p>
            <p className="text-sm text-muted-foreground">Todos los usuarios están procesados.</p>
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
                    <p className="text-[10px] text-muted-foreground">Registrado: {formatDate(u.createdAt)}</p>
                  </div>

                  {u.status === 'pending' && (
                    <div className="flex gap-2 shrink-0">
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
                    </div>
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
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
