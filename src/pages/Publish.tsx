import { useState, useEffect, useRef, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Camera, ArrowRight, ArrowLeft, CheckCircle2, X, Loader2, AlertCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Badge } from '@/components/ui/badge';
import { motion } from 'motion/react';
import { useAuth, db } from '@/src/lib/firebase';
import { getDoc, doc } from 'firebase/firestore';
import { createVehicle, uploadVehiclePhotos, updateVehiclePhotos } from '@/src/lib/vehicles';
import { VEHICLE_CATALOG, BODY_TYPES, FUEL_TYPES, TRANSMISSIONS, COLORS } from '@/src/data/vehicle-catalog';
import { PROVINCIAS_ARGENTINA } from '@/src/data/argentina-geo';
import type { FuelType, BodyType, Transmission, VehicleCondition } from '@/src/types';

type FormData = {
  brand: string;
  model: string;
  version: string;
  year: string;
  km: string;
  fuelType: string;
  bodyType: string;
  transmission: string;
  color: string;
  condition: 'USADO' | '0KM';
  province: string;
  city: string;
  hasVTV: boolean;
  hasPatenteAlDay: boolean;
  gncObleaVigente: boolean;
  uniqueOwner: boolean;
  officialService: boolean;
  description: string;
  currency: 'USD' | 'ARS';
  price: string;
};

const INITIAL_FORM: FormData = {
  brand: '', model: '', version: '', year: '', km: '',
  fuelType: '', bodyType: '', transmission: '', color: '',
  condition: 'USADO', province: '', city: '',
  hasVTV: false, hasPatenteAlDay: false, gncObleaVigente: false,
  uniqueOwner: false, officialService: false,
  description: '', currency: 'USD', price: '',
};

const currentYear = new Date().getFullYear();
const YEARS = Array.from({ length: currentYear - 1989 }, (_, i) => String(currentYear + 1 - i));

export function Publish() {
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState<FormData>(INITIAL_FORM);
  const [photos, setPhotos] = useState<File[]>([]);
  const [photoPreviews, setPhotoPreviews] = useState<string[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [userProfile, setUserProfile] = useState<any>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();
  const { user } = useAuth();

  useEffect(() => {
    if (!user) return;
    getDoc(doc(db, 'users', user.uid)).then(snap => {
      if (snap.exists()) {
        const data = snap.data();
        setUserProfile(data);
        
        // Pre-llenado de ubicación basada en la concesionaria
        if (data.province || data.city) {
          setFormData(prev => ({
            ...prev,
            province: data.province || prev.province,
            city: data.city || prev.city
          }));
        }
      }
    });
  }, [user]);

  const update = useCallback(<K extends keyof FormData>(field: K, value: FormData[K]) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    setError(null);
  }, []);

  const selectedBrand = VEHICLE_CATALOG.find(b => b.nombre === formData.brand);
  const selectedModel = selectedBrand?.modelos.find(m => m.nombre === formData.model);
  const selectedProvince = PROVINCIAS_ARGENTINA.find(p => p.id === formData.province);

  const handleBrandSelect = (brandName: string) => {
    setFormData(prev => ({ ...prev, brand: brandName, model: '', version: '', bodyType: '' }));
    setError(null);
  };

  const handleModelSelect = (modelName: string) => {
    const modelo = selectedBrand?.modelos.find(m => m.nombre === modelName);
    setFormData(prev => ({
      ...prev,
      model: modelName,
      version: '',
      bodyType: modelo?.segmento || prev.bodyType,
    }));
    setError(null);
  };

  const handleVersionSelect = (versionName: string) => {
    const version = selectedModel?.versiones.find(v => v.nombre === versionName);
    setFormData(prev => ({
      ...prev,
      version: versionName,
      fuelType: version?.combustible || prev.fuelType,
      transmission: version?.transmision || prev.transmission,
    }));
    setError(null);
  };

  const addPhotos = (files: FileList | null) => {
    if (!files) return;
    const remaining = 15 - photos.length;
    const newFiles = Array.from(files).slice(0, remaining);
    const newPreviews = newFiles.map(f => URL.createObjectURL(f));
    setPhotos(prev => [...prev, ...newFiles]);
    setPhotoPreviews(prev => [...prev, ...newPreviews]);
  };

  const removePhoto = (index: number) => {
    URL.revokeObjectURL(photoPreviews[index]);
    setPhotos(prev => prev.filter((_, i) => i !== index));
    setPhotoPreviews(prev => prev.filter((_, i) => i !== index));
  };

  const validateStep = (s: number): string | null => {
    if (s === 1) {
      if (!formData.brand) return 'Seleccioná una marca';
      if (!formData.model) return 'Seleccioná o ingresá el modelo';
      if (!formData.year) return 'Seleccioná el año';
      if (formData.km === '') return 'Ingresá el kilometraje';
      if (!formData.fuelType) return 'Seleccioná el combustible';
      if (!formData.province) return 'Seleccioná la provincia';
    }
    if (s === 4) {
      if (!formData.price || Number(formData.price) <= 0) return 'Ingresá un precio válido';
    }
    return null;
  };

  const nextStep = () => {
    const err = validateStep(step);
    if (err) { setError(err); return; }
    setError(null);
    setStep(s => s + 1);
  };

  const prevStep = () => { setError(null); setStep(s => s - 1); };

  const handleSubmit = async () => {
    const err = validateStep(4);
    if (err) { setError(err); return; }
    if (!user) { setError('Debés iniciar sesión para publicar'); return; }

    setSubmitting(true);
    setError(null);
    try {
      const cityName = selectedProvince?.localidades.find(l => l.id === formData.city)?.nombre || '';
      const provinceName = selectedProvince?.nombre || '';
      const location = cityName ? `${cityName}, ${provinceName}` : provinceName;

      const vehicleId = await createVehicle({
        sellerId: user.uid,
        sellerName: userProfile?.companyName || userProfile?.company || userProfile?.name || user.displayName || 'Agencia',
        brand: formData.brand,
        model: formData.model,
        version: formData.version,
        year: Number(formData.year),
        km: Number(formData.km),
        fuelType: formData.fuelType as FuelType,
        bodyType: (formData.bodyType || undefined) as BodyType | undefined,
        transmission: (formData.transmission || undefined) as Transmission | undefined,
        color: formData.color || undefined,
        condition: formData.condition as VehicleCondition,
        location,
        province: formData.province || undefined,
        city: cityName || undefined,
        price: formData.price ? Number(formData.price) : undefined,
        currency: formData.currency,
        status: 'ACTIVE',
        isFeatured: false,
        photos: [],
        description: formData.description,
        hasVTV: formData.hasVTV,
        hasPatenteAlDay: formData.hasPatenteAlDay,
        gncObleaVigente: formData.gncObleaVigente,
      });

      if (photos.length > 0) {
        try {
          const urls = await uploadVehiclePhotos(photos, vehicleId);
          await updateVehiclePhotos(vehicleId, urls);
        } catch (photoErr) {
          // Vehicle is already created — navigate anyway, photos can be added later
          console.warn('Photo upload failed, vehicle created without photos:', photoErr);
        }
      }

      navigate('/marketplace');
    } catch (e: any) {
      console.error('Publish error:', e?.code, e?.message, e);
      if (e?.code === 'permission-denied') {
        setError('Sin permisos: tu cuenta puede no estar aprobada aún. Contactá al administrador.');
      } else if (e?.code === 'unauthenticated') {
        setError('Sesión expirada. Volvé a iniciar sesión.');
      } else {
        setError(`Error al publicar: ${e?.message || 'error desconocido'}`);
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="container mx-auto max-w-4xl py-20 px-4">
      <div className="mb-12 text-center space-y-4">
        <Badge className="bg-primary/20 text-primary border-primary/20 font-bold tracking-tighter px-4 py-1.5 rounded-full text-sm">
          NUEVA PUBLICACIÓN
        </Badge>
        <h1 className="text-5xl font-bold tracking-tighter uppercase">Sumar Stock</h1>
        <p className="text-muted-foreground font-medium">Completá los pasos para publicar tu unidad en la comunidad.</p>
      </div>

      {/* Step indicators */}
      <div className="flex justify-between mb-12 relative max-w-md mx-auto">
        <div className="absolute top-1/2 left-0 w-full h-1 bg-white/5 -translate-y-1/2 z-0 rounded-full" />
        {[1, 2, 3, 4].map((s) => (
          <div
            key={s}
            className={`relative z-10 flex items-center justify-center w-12 h-12 rounded-full border-4 transition-all duration-500 ${
              step >= s ? 'bg-primary border-primary text-primary-foreground shadow-lg shadow-primary/20' : 'bg-background border-white/5 text-muted-foreground'
            }`}
          >
            {step > s ? <CheckCircle2 className="h-6 w-6 stroke-[3]" /> : <span className="font-bold">{s}</span>}
            <div className="absolute -bottom-8 left-1/2 -translate-x-1/2 w-max text-[8px] font-black uppercase tracking-widest text-muted-foreground">
              {s === 1 && 'Datos'}
              {s === 2 && 'Fotos'}
              {s === 3 && 'Legal'}
              {s === 4 && 'Precio'}
            </div>
          </div>
        ))}
      </div>

      <Card className="border-white/5 bg-white/5 backdrop-blur-xl shadow-2xl rounded-[3rem] overflow-hidden">
        <CardContent className="p-10">

          {/* Error banner */}
          {error && (
            <div className="flex items-center gap-3 mb-6 p-4 rounded-2xl bg-destructive/10 border border-destructive/20 text-destructive text-sm font-medium">
              <AlertCircle className="h-4 w-4 shrink-0" />
              {error}
            </div>
          )}

          {/* STEP 1 — Datos del vehículo */}
          {step === 1 && (
            <motion.div initial={{ x: 20, opacity: 0 }} animate={{ x: 0, opacity: 1 }} className="space-y-8">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">

                {/* Marca */}
                <div className="space-y-3">
                  <Label className="text-[10px] font-bold uppercase tracking-widest ml-1">Marca</Label>
                  <Select value={formData.brand} onValueChange={handleBrandSelect}>
                    <SelectTrigger className="h-14 rounded-2xl bg-white/5 border-white/10 font-bold">
                      <SelectValue placeholder="Seleccionar marca" />
                    </SelectTrigger>
                    <SelectContent className="rounded-2xl max-h-72">
                      {VEHICLE_CATALOG.map(b => (
                        <SelectItem key={b.nombre} value={b.nombre}>{b.nombre}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Modelo */}
                <div className="space-y-3">
                  <Label className="text-[10px] font-bold uppercase tracking-widest ml-1">Modelo</Label>
                  {selectedBrand ? (
                    <Select value={formData.model} onValueChange={handleModelSelect}>
                      <SelectTrigger className="h-14 rounded-2xl bg-white/5 border-white/10 font-bold">
                        <SelectValue placeholder="Seleccionar modelo" />
                      </SelectTrigger>
                      <SelectContent className="rounded-2xl max-h-72">
                        {selectedBrand.modelos.map(m => (
                          <SelectItem key={m.nombre} value={m.nombre}>{m.nombre}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  ) : (
                    <Input
                      value={formData.model}
                      onChange={e => update('model', e.target.value)}
                      placeholder="Ej: Hilux, Vento..."
                      className="h-14 rounded-2xl bg-white/5 border-white/10 font-bold"
                    />
                  )}
                </div>

                {/* Versión */}
                <div className="space-y-3">
                  <Label className="text-[10px] font-bold uppercase tracking-widest ml-1">Versión</Label>
                  {selectedModel ? (
                    <Select value={formData.version} onValueChange={handleVersionSelect}>
                      <SelectTrigger className="h-14 rounded-2xl bg-white/5 border-white/10 font-bold">
                        <SelectValue placeholder="Seleccionar versión" />
                      </SelectTrigger>
                      <SelectContent className="rounded-2xl max-h-72">
                        {selectedModel.versiones.map(v => (
                          <SelectItem key={v.nombre} value={v.nombre}>{v.nombre}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  ) : (
                    <Input
                      value={formData.version}
                      onChange={e => update('version', e.target.value)}
                      placeholder="Ej: 2.8 SRX 4X4 AT"
                      className="h-14 rounded-2xl bg-white/5 border-white/10 font-bold"
                    />
                  )}
                </div>

                {/* Año */}
                <div className="space-y-3">
                  <Label className="text-[10px] font-bold uppercase tracking-widest ml-1">Año</Label>
                  <Select value={formData.year} onValueChange={v => update('year', v)}>
                    <SelectTrigger className="h-14 rounded-2xl bg-white/5 border-white/10 font-bold">
                      <SelectValue placeholder="Seleccionar año" />
                    </SelectTrigger>
                    <SelectContent className="rounded-2xl max-h-72">
                      {YEARS.map(y => (
                        <SelectItem key={y} value={y}>{y}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Kilometraje */}
                <div className="space-y-3">
                  <Label className="text-[10px] font-bold uppercase tracking-widest ml-1">Kilometraje</Label>
                  <Input
                    type="number"
                    min={0}
                    value={formData.km}
                    onChange={e => update('km', e.target.value)}
                    placeholder="0"
                    className="h-14 rounded-2xl bg-white/5 border-white/10 font-bold"
                  />
                </div>

                {/* Condición */}
                <div className="space-y-3">
                  <Label className="text-[10px] font-bold uppercase tracking-widest ml-1">Condición</Label>
                  <Select value={formData.condition} onValueChange={v => update('condition', v as 'USADO' | '0KM')}>
                    <SelectTrigger className="h-14 rounded-2xl bg-white/5 border-white/10 font-bold">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="rounded-2xl">
                      <SelectItem value="USADO">Usado</SelectItem>
                      <SelectItem value="0KM">0 KM</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Combustible */}
                <div className="space-y-3">
                  <Label className="text-[10px] font-bold uppercase tracking-widest ml-1">Combustible</Label>
                  <Select value={formData.fuelType} onValueChange={v => update('fuelType', v)}>
                    <SelectTrigger className="h-14 rounded-2xl bg-white/5 border-white/10 font-bold">
                      <SelectValue placeholder="Seleccionar" />
                    </SelectTrigger>
                    <SelectContent className="rounded-2xl">
                      {FUEL_TYPES.map(f => (
                        <SelectItem key={f.value} value={f.value}>{f.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Transmisión */}
                <div className="space-y-3">
                  <Label className="text-[10px] font-bold uppercase tracking-widest ml-1">Transmisión</Label>
                  <Select value={formData.transmission} onValueChange={v => update('transmission', v)}>
                    <SelectTrigger className="h-14 rounded-2xl bg-white/5 border-white/10 font-bold">
                      <SelectValue placeholder="Seleccionar" />
                    </SelectTrigger>
                    <SelectContent className="rounded-2xl">
                      {TRANSMISSIONS.map(t => (
                        <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Carrocería */}
                <div className="space-y-3">
                  <Label className="text-[10px] font-bold uppercase tracking-widest ml-1">Carrocería</Label>
                  <Select value={formData.bodyType} onValueChange={v => update('bodyType', v)}>
                    <SelectTrigger className="h-14 rounded-2xl bg-white/5 border-white/10 font-bold">
                      <SelectValue placeholder="Seleccionar" />
                    </SelectTrigger>
                    <SelectContent className="rounded-2xl">
                      {BODY_TYPES.map(b => (
                        <SelectItem key={b.value} value={b.value}>{b.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Color */}
                <div className="space-y-3">
                  <Label className="text-[10px] font-bold uppercase tracking-widest ml-1">Color</Label>
                  <Select value={formData.color} onValueChange={v => update('color', v)}>
                    <SelectTrigger className="h-14 rounded-2xl bg-white/5 border-white/10 font-bold">
                      <SelectValue placeholder="Seleccionar" />
                    </SelectTrigger>
                    <SelectContent className="rounded-2xl">
                      {COLORS.map(c => (
                        <SelectItem key={c.value} value={c.value}>
                          <span className="flex items-center gap-2">
                            <span className="w-3 h-3 rounded-full border border-white/20" style={{ background: c.hex }} />
                            {c.label}
                          </span>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Provincia */}
                <div className="space-y-3">
                  <Label className="text-[10px] font-bold uppercase tracking-widest ml-1">Provincia</Label>
                  <Select value={formData.province} onValueChange={v => { update('province', v); update('city', ''); }}>
                    <SelectTrigger className="h-14 rounded-2xl bg-white/5 border-white/10 font-bold">
                      <SelectValue placeholder="Seleccionar provincia" />
                    </SelectTrigger>
                    <SelectContent className="rounded-2xl max-h-72">
                      {PROVINCIAS_ARGENTINA.map(p => (
                        <SelectItem key={p.id} value={p.id}>{p.nombre}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Ciudad */}
                <div className="space-y-3">
                  <Label className="text-[10px] font-bold uppercase tracking-widest ml-1">Localidad</Label>
                  <Select
                    value={formData.city}
                    onValueChange={v => update('city', v)}
                    disabled={!selectedProvince}
                  >
                    <SelectTrigger className="h-14 rounded-2xl bg-white/5 border-white/10 font-bold">
                      <SelectValue placeholder={selectedProvince ? 'Seleccionar localidad' : 'Primero elegí provincia'} />
                    </SelectTrigger>
                    <SelectContent className="rounded-2xl max-h-72">
                      {selectedProvince?.localidades.map(l => (
                        <SelectItem key={l.id} value={l.id}>{l.nombre}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="flex justify-end pt-4">
                <Button onClick={nextStep} className="h-14 px-10 rounded-full font-black uppercase italic tracking-tighter text-lg gap-2 shadow-lg shadow-primary/20">
                  Siguiente <ArrowRight className="h-5 w-5 stroke-[3]" />
                </Button>
              </div>
            </motion.div>
          )}

          {/* STEP 2 — Fotos */}
          {step === 2 && (
            <motion.div initial={{ x: 20, opacity: 0 }} animate={{ x: 0, opacity: 1 }} className="space-y-8">
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                multiple
                className="hidden"
                onChange={e => addPhotos(e.target.files)}
              />

              {/* Drop zone */}
              <div
                className={`border-4 border-dashed rounded-[2rem] p-12 text-center space-y-6 cursor-pointer transition-all group ${
                  isDragging ? 'border-primary/60 bg-primary/5' : 'border-white/5 bg-white/5 hover:border-primary/30'
                }`}
                onClick={() => fileInputRef.current?.click()}
                onDragOver={e => { e.preventDefault(); setIsDragging(true); }}
                onDragLeave={() => setIsDragging(false)}
                onDrop={e => { e.preventDefault(); setIsDragging(false); addPhotos(e.dataTransfer.files); }}
              >
                <div className="bg-primary/10 w-20 h-20 rounded-full flex items-center justify-center mx-auto group-hover:scale-110 transition-transform duration-500">
                  <Camera className="h-10 w-10 text-primary" />
                </div>
                <div className="space-y-2">
                  <p className="text-xl font-bold tracking-tighter uppercase">Subir fotografías</p>
                  <p className="text-sm text-muted-foreground font-medium">
                    {photos.length === 0
                      ? 'Arrastrá tus fotos aquí o hacé clic para buscar (Máx 15)'
                      : `${photos.length}/15 fotos seleccionadas — hacé clic para agregar más`}
                  </p>
                </div>
                {photos.length < 15 && (
                  <Button variant="outline" className="rounded-full px-8 border-white/10 font-bold uppercase tracking-widest text-xs" onClick={e => { e.stopPropagation(); fileInputRef.current?.click(); }}>
                    Seleccionar archivos
                  </Button>
                )}
              </div>

              {/* Previews */}
              {photoPreviews.length > 0 && (
                <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-3">
                  {photoPreviews.map((url, i) => (
                    <div key={i} className="relative aspect-square rounded-2xl overflow-hidden group">
                      <img src={url} alt={`foto ${i + 1}`} className="w-full h-full object-cover" />
                      {i === 0 && (
                        <div className="absolute bottom-1 left-1 bg-primary/90 text-primary-foreground text-[8px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full">
                          Principal
                        </div>
                      )}
                      <button
                        onClick={() => removePhoto(i)}
                        className="absolute top-1 right-1 bg-black/70 hover:bg-destructive text-white rounded-full w-6 h-6 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </div>
                  ))}
                </div>
              )}

              <div className="flex justify-between pt-4">
                <Button variant="ghost" onClick={prevStep} className="h-14 px-8 rounded-full font-bold uppercase tracking-tighter text-lg gap-2 hover:bg-white/5">
                  <ArrowLeft className="h-5 w-5 stroke-[3]" /> Anterior
                </Button>
                <Button onClick={nextStep} className="h-14 px-10 rounded-full font-bold uppercase tracking-tighter text-lg gap-2 shadow-lg shadow-primary/20">
                  {photos.length === 0 ? 'Omitir' : 'Siguiente'} <ArrowRight className="h-5 w-5 stroke-[3]" />
                </Button>
              </div>
            </motion.div>
          )}

          {/* STEP 3 — Legal y Estado */}
          {step === 3 && (
            <motion.div initial={{ x: 20, opacity: 0 }} animate={{ x: 0, opacity: 1 }} className="space-y-8">
              <h3 className="text-xl font-bold tracking-tighter uppercase">Documentación y Estado</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {[
                  { id: 'hasVTV', label: 'VTV Vigente' },
                  { id: 'hasPatenteAlDay', label: 'Patente al día' },
                  { id: 'uniqueOwner', label: 'Único Dueño' },
                  { id: 'officialService', label: 'Services Oficiales' },
                  { id: 'gncObleaVigente', label: 'Oblea GNC Vigente' },
                ].map(({ id, label }) => (
                  <label
                    key={id}
                    htmlFor={id}
                    className="flex items-center space-x-3 border border-white/5 bg-white/5 p-6 rounded-2xl hover:border-primary/30 transition-all cursor-pointer"
                  >
                    <Checkbox
                      id={id}
                      className="h-6 w-6 rounded-md border-white/20"
                      checked={formData[id as keyof FormData] as boolean}
                      onCheckedChange={v => update(id as keyof FormData, Boolean(v) as any)}
                    />
                    <span className="font-bold uppercase tracking-widest text-xs">{label}</span>
                  </label>
                ))}
              </div>

              <div className="space-y-3">
                <Label className="text-[10px] font-bold uppercase tracking-widest ml-1">Observaciones / Detalles estéticos</Label>
                <Textarea
                  value={formData.description}
                  onChange={e => update('description', e.target.value)}
                  placeholder="Describí el estado general, equipamiento adicional, etc."
                  className="min-h-[150px] rounded-2xl bg-white/5 border-white/10 font-bold p-6"
                />
              </div>

              <div className="flex justify-between pt-4">
                <Button variant="ghost" onClick={prevStep} className="h-14 px-8 rounded-full font-bold uppercase tracking-tighter text-lg gap-2 hover:bg-white/5">
                  <ArrowLeft className="h-5 w-5 stroke-[3]" /> Anterior
                </Button>
                <Button onClick={nextStep} className="h-14 px-10 rounded-full font-bold uppercase tracking-tighter text-lg gap-2 shadow-lg shadow-primary/20">
                  Siguiente <ArrowRight className="h-5 w-5 stroke-[3]" />
                </Button>
              </div>
            </motion.div>
          )}

          {/* STEP 4 — Precio */}
          {step === 4 && (
            <motion.div initial={{ x: 20, opacity: 0 }} animate={{ x: 0, opacity: 1 }} className="space-y-8">
              <h3 className="text-xl font-bold tracking-tighter uppercase">Precio y Condiciones de Venta</h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-3">
                  <Label className="text-[10px] font-bold uppercase tracking-widest ml-1">Moneda</Label>
                  <Select value={formData.currency} onValueChange={v => update('currency', v as 'USD' | 'ARS')}>
                    <SelectTrigger className="h-14 rounded-2xl bg-white/5 border-white/10 font-bold">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="rounded-2xl">
                      <SelectItem value="USD">Dólares (USD)</SelectItem>
                      <SelectItem value="ARS">Pesos (ARS)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-3">
                  <Label className="text-[10px] font-bold uppercase tracking-widest ml-1">Precio</Label>
                  <Input
                    type="number"
                    min={0}
                    value={formData.price}
                    onChange={e => update('price', e.target.value)}
                    placeholder="0"
                    className="h-14 rounded-2xl bg-white/5 border-white/10 font-bold text-2xl text-primary tracking-tighter"
                  />
                </div>
              </div>

              {/* Resumen */}
              <div className="p-6 rounded-3xl bg-white/5 border border-white/10 space-y-3 text-sm">
                <p className="font-black uppercase tracking-widest text-[10px] text-muted-foreground mb-4">Resumen de publicación</p>
                <p><span className="text-muted-foreground">Vehículo:</span> <span className="font-bold">{formData.brand} {formData.model} {formData.version}</span></p>
                <p><span className="text-muted-foreground">Año:</span> <span className="font-bold">{formData.year}</span> &nbsp;|&nbsp; <span className="text-muted-foreground">KM:</span> <span className="font-bold">{Number(formData.km).toLocaleString()}</span></p>
                <p><span className="text-muted-foreground">Fotos:</span> <span className="font-bold">{photos.length} imagen{photos.length !== 1 ? 'es' : ''}</span></p>
              </div>

              <div className="p-8 rounded-3xl bg-primary/5 border border-primary/20 space-y-4">
                <div className="flex items-center gap-3">
                  <CheckCircle2 className="h-5 w-5 text-primary" />
                  <p className="text-sm font-bold uppercase tracking-widest">Publicación verificada</p>
                </div>
                <p className="text-xs text-muted-foreground font-medium">Al publicar, aceptás que la información es verídica y que sos el responsable legal de la unidad o tenés poder para comercializarla.</p>
              </div>

              <div className="flex justify-between pt-4">
                <Button variant="ghost" onClick={prevStep} disabled={submitting} className="h-14 px-8 rounded-full font-bold uppercase tracking-tighter text-lg gap-2 hover:bg-white/5">
                  <ArrowLeft className="h-5 w-5 stroke-[3]" /> Anterior
                </Button>
                <Button
                  onClick={handleSubmit}
                  disabled={submitting}
                  className="h-14 px-10 rounded-full font-bold uppercase tracking-tighter text-lg gap-2 bg-primary hover:bg-primary/90 text-primary-foreground shadow-lg shadow-primary/20"
                >
                  {submitting ? (
                    <><Loader2 className="h-5 w-5 animate-spin" /> Publicando...</>
                  ) : (
                    <><CheckCircle2 className="h-5 w-5 stroke-[3]" /> Finalizar Publicación</>
                  )}
                </Button>
              </div>
            </motion.div>
          )}

        </CardContent>
      </Card>
    </div>
  );
}
