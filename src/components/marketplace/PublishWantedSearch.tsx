import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Loader2, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { VEHICLE_CATALOG, COLORS } from '@/src/data/vehicle-catalog';
import { createWantedSearch } from '@/src/lib/wantedSearches';
import { useAuth, db } from '@/src/lib/firebase';
import { getDoc, doc } from 'firebase/firestore';
import type { VehicleCondition, Currency } from '@/src/types';

interface Props {
  open: boolean;
  onClose: () => void;
}

const currentYear = new Date().getFullYear();

export function PublishWantedSearch({ open, onClose }: Props) {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [brand, setBrand] = useState('');
  const [model, setModel] = useState('');
  const [version, setVersion] = useState('');
  const [conditions, setConditions] = useState<VehicleCondition[]>([]);
  const [yearFrom, setYearFrom] = useState('');
  const [yearTo, setYearTo] = useState('');
  const [kmApprox, setKmApprox] = useState('');
  const [priceMin, setPriceMin] = useState('');
  const [priceMax, setPriceMax] = useState('');
  const [currency, setCurrency] = useState<Currency>('USD');
  const [color, setColor] = useState('');

  const selectedBrand = VEHICLE_CATALOG.find(b => b.nombre === brand);
  const selectedModel = selectedBrand?.modelos.find(m => m.nombre === model);

  const handleBrandChange = (val: string) => {
    setBrand(val);
    setModel('');
    setVersion('');
  };

  const handleModelChange = (val: string) => {
    setModel(val);
    setVersion('');
  };

  const toggleCondition = (cond: VehicleCondition) => {
    setConditions(prev =>
      prev.includes(cond) ? prev.filter(c => c !== cond) : [...prev, cond],
    );
  };

  const resetForm = () => {
    setBrand(''); setModel(''); setVersion('');
    setConditions([]); setYearFrom(''); setYearTo('');
    setKmApprox(''); setPriceMin(''); setPriceMax('');
    setCurrency('USD'); setColor(''); setError(null);
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    if (!brand) { setError('Seleccioná una marca.'); return; }
    const yFrom = parseInt(yearFrom);
    const yTo = parseInt(yearTo);
    const pMin = parseInt(priceMin);
    const pMax = parseInt(priceMax);
    if (!yearFrom || !yearTo || yFrom > yTo) { setError('Ingresá un rango de año válido.'); return; }
    if (!priceMin || !priceMax || pMin > pMax) { setError('Ingresá un rango de precio válido.'); return; }

    setLoading(true);
    setError(null);
    try {
      const userDoc = await getDoc(doc(db, 'users', user.uid));
      const ud = userDoc.data();
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + 30);

      await createWantedSearch({
        userId: user.uid,
        userName: ud?.name ? `${ud.name} ${ud.lastName ?? ''}`.trim() : (user.displayName ?? 'Usuario'),
        companyName: ud?.company ?? ud?.companyName ?? '',
        avatarUrl: user.photoURL ?? undefined,
        province: ud?.province,
        brand,
        model: model || undefined,
        version: version || undefined,
        conditions: conditions.length > 0 ? conditions : ['USADO'],
        yearRange: { min: yFrom, max: yTo },
        kmApprox: kmApprox ? parseInt(kmApprox) : undefined,
        budgetRange: { min: pMin, max: pMax },
        currency,
        color: color || undefined,
        status: 'active',
        expiresAt: expiresAt.toISOString(),
      });

      handleClose();
    } catch (err) {
      console.error(err);
      setError('Error al publicar la búsqueda. Intentá nuevamente.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50"
            onClick={handleClose}
          />
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 26, stiffness: 220 }}
            className="fixed right-0 top-0 h-dvh w-full max-w-lg bg-background border-l border-border z-50 flex flex-col"
          >
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-border shrink-0">
              <div>
                <h2 className="text-xl font-bold tracking-tighter uppercase">Publicar Búsqueda</h2>
                <p className="text-xs text-muted-foreground font-medium mt-0.5">
                  Avisale a la red lo que estás buscando
                </p>
              </div>
              <Button variant="ghost" size="icon" className="rounded-full" onClick={handleClose}>
                <X className="h-5 w-5" />
              </Button>
            </div>

            {/* Scrollable form */}
            <form onSubmit={handleSubmit} className="flex-1 flex flex-col overflow-hidden">
              <div className="flex-1 overflow-y-auto overscroll-contain p-6 space-y-5">
                {error && (
                  <div className="p-3 rounded-xl bg-destructive/10 text-destructive text-xs font-bold uppercase tracking-widest text-center">
                    {error}
                  </div>
                )}

                {/* Marca */}
                <div className="space-y-2">
                  <Label className="text-[10px] font-bold uppercase tracking-widest ml-1">
                    Marca <span className="text-primary">*</span>
                  </Label>
                  <Select value={brand} onValueChange={handleBrandChange}>
                    <SelectTrigger className="h-12 rounded-xl bg-muted border-border font-bold">
                      <SelectValue placeholder="Seleccionar marca" />
                    </SelectTrigger>
                    <SelectContent className="rounded-xl max-h-60">
                      {VEHICLE_CATALOG.map(b => (
                        <SelectItem key={b.nombre} value={b.nombre}>{b.nombre}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Modelo */}
                <div className="space-y-2">
                  <Label className="text-[10px] font-bold uppercase tracking-widest ml-1">Modelo</Label>
                  <Select value={model} onValueChange={handleModelChange} disabled={!brand}>
                    <SelectTrigger className="h-12 rounded-xl bg-muted border-border font-bold">
                      <SelectValue placeholder={brand ? 'Seleccionar modelo' : 'Primero elegí una marca'} />
                    </SelectTrigger>
                    <SelectContent className="rounded-xl max-h-60">
                      {selectedBrand?.modelos.map(m => (
                        <SelectItem key={m.nombre} value={m.nombre}>{m.nombre}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Versión */}
                <div className="space-y-2">
                  <Label className="text-[10px] font-bold uppercase tracking-widest ml-1">
                    Versión <span className="text-muted-foreground">(opcional)</span>
                  </Label>
                  <Select value={version} onValueChange={setVersion} disabled={!model}>
                    <SelectTrigger className="h-12 rounded-xl bg-muted border-border font-bold">
                      <SelectValue placeholder={model ? 'Cualquier versión' : 'Primero elegí un modelo'} />
                    </SelectTrigger>
                    <SelectContent className="rounded-xl max-h-60">
                      {selectedModel?.versiones.map(v => (
                        <SelectItem key={v.nombre} value={v.nombre}>{v.nombre}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Condición */}
                <div className="space-y-3">
                  <Label className="text-[10px] font-bold uppercase tracking-widest ml-1">Condición</Label>
                  <div className="grid grid-cols-2 gap-2">
                    {(['0KM', 'USADO'] as VehicleCondition[]).map(cond => (
                      <button
                        key={cond}
                        type="button"
                        onClick={() => setConditions([cond])}
                        className={`h-11 rounded-xl font-bold text-xs transition-all border ${conditions[0] === cond ? 'bg-primary/15 border-primary text-primary' : 'bg-muted border-border text-muted-foreground hover:border-primary/40 hover:text-foreground'}`}
                      >
                        {cond}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Rango de año */}
                <div className="space-y-2">
                  <Label className="text-[10px] font-bold uppercase tracking-widest ml-1">
                    Rango de Año <span className="text-primary">*</span>
                  </Label>
                  <div className="grid grid-cols-2 gap-3">
                    <Input
                      type="number"
                      placeholder="Desde (ej: 2018)"
                      value={yearFrom}
                      onChange={e => setYearFrom(e.target.value)}
                      min={1990}
                      max={currentYear + 1}
                      className="h-12 rounded-xl bg-muted border-border font-bold"
                    />
                    <Input
                      type="number"
                      placeholder={`Hasta (ej: ${currentYear})`}
                      value={yearTo}
                      onChange={e => setYearTo(e.target.value)}
                      min={1990}
                      max={currentYear + 1}
                      className="h-12 rounded-xl bg-muted border-border font-bold"
                    />
                  </div>
                </div>

                {/* KM aprox */}
                <div className="space-y-2">
                  <Label className="text-[10px] font-bold uppercase tracking-widest ml-1">
                    KM Aproximados <span className="text-muted-foreground">(opcional)</span>
                  </Label>
                  <Input
                    type="number"
                    placeholder="Ej: 50000"
                    value={kmApprox}
                    onChange={e => setKmApprox(e.target.value)}
                    min={0}
                    className="h-12 rounded-xl bg-muted border-border font-bold"
                  />
                </div>

                {/* Rango de precio */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between ml-1">
                    <Label className="text-[10px] font-bold uppercase tracking-widest">
                      Rango de Precio <span className="text-primary">*</span>
                    </Label>
                    <div className="flex gap-1.5">
                      {(['USD', 'ARS'] as Currency[]).map(cur => (
                        <button
                          key={cur}
                          type="button"
                          onClick={() => setCurrency(cur)}
                          className={`text-[10px] font-bold px-3 py-1 rounded-full transition-all ${
                            currency === cur
                              ? 'bg-primary text-primary-foreground'
                              : 'bg-muted border-border text-muted-foreground hover:bg-muted/80'
                          }`}
                        >
                          {cur}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <Input
                      type="number"
                      placeholder="Precio mínimo"
                      value={priceMin}
                      onChange={e => setPriceMin(e.target.value)}
                      min={0}
                      className="h-12 rounded-xl bg-muted border-border font-bold"
                    />
                    <Input
                      type="number"
                      placeholder="Precio máximo"
                      value={priceMax}
                      onChange={e => setPriceMax(e.target.value)}
                      min={0}
                      className="h-12 rounded-xl bg-muted border-border font-bold"
                    />
                  </div>
                </div>

                {/* Color */}
                <div className="space-y-2">
                  <Label className="text-[10px] font-bold uppercase tracking-widest ml-1">
                    Color <span className="text-muted-foreground">(opcional)</span>
                  </Label>
                  <Select value={color} onValueChange={setColor}>
                    <SelectTrigger className="h-12 rounded-xl bg-muted border-border font-bold">
                      <SelectValue placeholder="Cualquier color" />
                    </SelectTrigger>
                    <SelectContent className="rounded-xl max-h-60">
                      {COLORS.map(c => (
                        <SelectItem key={c.value} value={c.value}>
                          <div className="flex items-center gap-2">
                            <div
                              className="h-3 w-3 rounded-full border border-border shrink-0"
                              style={{ backgroundColor: c.hex }}
                            />
                            {c.label}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Footer fijo */}
              <div className="p-6 border-t border-border shrink-0">
                <Button
                  type="submit"
                  disabled={loading}
                  className="w-full h-14 rounded-xl font-bold uppercase tracking-tighter text-lg shadow-xl shadow-primary/20"
                >
                  {loading ? (
                    <Loader2 className="h-6 w-6 animate-spin" />
                  ) : (
                    <>
                      <Search className="mr-2 h-5 w-5" /> PUBLICAR BÚSQUEDA
                    </>
                  )}
                </Button>
              </div>
            </form>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
