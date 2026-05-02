import { useState, useEffect, useRef, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Camera, ArrowRight, ArrowLeft, CheckCircle2, X, Loader2, AlertCircle, ImageOff } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Badge } from '@/components/ui/badge';
import { motion } from 'motion/react';
import { useAuth, db } from '@/src/lib/firebase';
import { getDoc, doc } from 'firebase/firestore';
import { createVehicle, updateVehiclePhotos } from '@/src/lib/vehicles';
import { VEHICLE_CATALOG, BODY_TYPES, FUEL_TYPES, TRANSMISSIONS, COLORS } from '@/src/data/vehicle-catalog';
import { PROVINCIAS_ARGENTINA } from '@/src/data/argentina-geo';
import type { FuelType, BodyType, Transmission, VehicleCondition } from '@/src/types';
import { usePhotoUpload } from '@/src/hooks/usePhotoUpload';
import { StepEstadoTecnico } from '@/src/components/publish/StepEstadoTecnico';
import { StepPreview } from '@/src/components/publish/StepPreview';
import {
  formatArgentineNumber, parseArgentineNumber,
  validateStep, getFirebaseErrorMessage, hasInspectionData,
  INITIAL_INSPECTION, INITIAL_FORM,
  type PublishFormData, type InspectionFormData,
} from '@/src/lib/publish-helpers';

const TOTAL_STEPS = 6;
const STEP_LABELS = ['Datos', 'Fotos', 'Legal', 'Estado', 'Precio', 'Preview'];
const currentYear = new Date().getFullYear();
const YEARS = Array.from({ length: currentYear - 1989 }, (_, i) => String(currentYear + 1 - i));

export function Publish() {
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState<PublishFormData>(INITIAL_FORM);
  const [inspection, setInspection] = useState<InspectionFormData>(INITIAL_INSPECTION);
  const [photos, setPhotos] = useState<File[]>([]);
  const [photoPreviews, setPhotoPreviews] = useState<string[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [userProfile, setUserProfile] = useState<any>(null);
  const [showNoPhotosDialog, setShowNoPhotosDialog] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();
  const { user } = useAuth();
  const photoUpload = usePhotoUpload();

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

  const update = useCallback(<K extends keyof PublishFormData>(field: K, value: PublishFormData[K]) => {
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

  const nextStep = () => {
    // Step 2 special: confirm if no photos
    if (step === 2 && photos.length === 0) {
      setShowNoPhotosDialog(true);
      return;
    }
    const err = validateStep(step, formData, photos);
    if (err) { setError(err); return; }
    setError(null);
    setStep(s => s + 1);
  };

  const confirmNoPhotos = () => {
    setShowNoPhotosDialog(false);
    setError(null);
    setStep(s => s + 1);
  };

  const prevStep = () => { setError(null); setStep(s => s - 1); };

  const handleSubmit = async () => {
    if (!user) { setError('Debés iniciar sesión para publicar'); return; }

    setSubmitting(true);
    setError(null);
    try {
      const cityName = selectedProvince?.localidades.find(l => l.id === formData.city)?.nombre || formData.city || '';
      const provinceName = selectedProvince?.nombre || formData.province || '';
      const location = cityName ? `${cityName}, ${provinceName}` : provinceName;
      const kmRaw = parseArgentineNumber(formData.km);
      const priceRaw = parseArgentineNumber(formData.price);

      const inspData = hasInspectionData(inspection) ? inspection : undefined;

      const vId = await createVehicle({
        sellerId: user.uid,
        sellerName: userProfile?.companyName || userProfile?.name || user.displayName || 'Agencia',
        sellerCompany: userProfile?.companyName || 'Agencia',
        brand: formData.brand,
        model: formData.model,
        version: formData.version,
        year: Number(formData.year),
        km: formData.condition === '0KM' ? 0 : Number(kmRaw),
        fuelType: formData.fuelType as FuelType,
        bodyType: (formData.bodyType || undefined) as BodyType | undefined,
        transmission: (formData.transmission || undefined) as Transmission | undefined,
        color: formData.color || undefined,
        condition: formData.condition as VehicleCondition,
        location,
        province: formData.province || undefined,
        city: cityName || undefined,
        price: priceRaw ? Number(priceRaw) : undefined,
        currency: formData.currency,
        priceNegotiable: false,
        status: 'ACTIVE',
        isFeatured: false,
        isInspected: false,
        photos: [],
        description: formData.description,
        hasVTV: formData.hasVTV,
        hasPatenteAlDay: formData.hasPatenteAlDay,
        gncObleaVigente: formData.gncObleaVigente,
        inspectionData: inspData as any,
      });

      if (photos.length > 0) {
        try {
          const urls = await photoUpload.uploadPhotos(photos, vId, user.uid);
          await updateVehiclePhotos(vId, urls);
        } catch (uploadErr: unknown) {
          setError(`Vehículo publicado, pero hubo un error al subir las fotos: ${getFirebaseErrorMessage(uploadErr)}`);
          setSubmitting(false);
          return;
        }
      }

      navigate('/marketplace');
    } catch (e: unknown) {
      console.error('Publish error:', e);
      setError(getFirebaseErrorMessage(e));
      setSubmitting(false);
    }
  };

  return (
    <div className="container mx-auto max-w-4xl py-20 px-4">
      <div className="mb-12 text-center space-y-4">
        <Badge className="bg-primary/20 text-primary border-primary/20 font-bold tracking-tighter px-4 py-1.5 rounded-full text-sm">
          NUEVA PUBLICACIÓN
        </Badge>
        <h1 className="text-3xl md:text-5xl font-bold tracking-tighter uppercase">Sumar Stock</h1>
        <p className="text-muted-foreground font-medium">Completá los pasos para publicar tu unidad en la comunidad.</p>
      </div>

      {/* Step indicators */}
      <div className="flex justify-between mb-12 relative max-w-lg mx-auto">
        <div className="absolute top-1/2 left-0 w-full h-1 bg-white/5 -translate-y-1/2 z-0 rounded-full" />
        {Array.from({ length: TOTAL_STEPS }, (_, i) => i + 1).map((s) => (
          <div
            key={s}
            className={`relative z-10 flex items-center justify-center w-10 h-10 md:w-12 md:h-12 rounded-full border-4 transition-all duration-500 ${
              step >= s ? 'bg-primary border-primary text-primary-foreground shadow-lg shadow-primary/20' : 'bg-background border-white/5 text-muted-foreground'
            }`}
          >
            {step > s ? <CheckCircle2 className="h-5 w-5 md:h-6 md:w-6 stroke-[3]" /> : <span className="font-bold text-sm">{s}</span>}
            <div className="absolute -bottom-8 left-1/2 -translate-x-1/2 w-max text-[7px] md:text-[8px] font-black uppercase tracking-widest text-muted-foreground">
              {STEP_LABELS[s - 1]}
            </div>
          </div>
        ))}
      </div>

      <Card className="border-white/5 bg-white/5 backdrop-blur-xl shadow-2xl rounded-[3.5rem] overflow-hidden">
        <CardContent className="p-10">

          {error && (
            <div className="flex items-center gap-3 mb-6 p-4 rounded-xl bg-destructive/10 border border-destructive/20 text-destructive text-sm font-medium">
              <AlertCircle className="h-4 w-4 shrink-0" />
              {error}
            </div>
          )}

          {step === 1 && (
            <motion.div initial={{ x: 20, opacity: 0 }} animate={{ x: 0, opacity: 1 }} className="space-y-8">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">

                <div className="space-y-3">
                  <Label className="text-[10px] font-bold uppercase tracking-widest ml-1">Marca</Label>
                  <Select value={formData.brand} onValueChange={handleBrandSelect}>
                    <SelectTrigger className="h-14 rounded-xl bg-white/5 border-white/10 font-bold">
                      <SelectValue placeholder="Seleccionar marca" />
                    </SelectTrigger>
                    <SelectContent className="rounded-xl max-h-72">
                      {VEHICLE_CATALOG.map(b => (
                        <SelectItem key={b.nombre} value={b.nombre}>{b.nombre}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-3">
                  <Label className="text-[10px] font-bold uppercase tracking-widest ml-1">Modelo</Label>
                  {selectedBrand ? (
                    <Select value={formData.model} onValueChange={handleModelSelect}>
                      <SelectTrigger className="h-14 rounded-xl bg-white/5 border-white/10 font-bold">
                        <SelectValue placeholder="Seleccionar modelo" />
                      </SelectTrigger>
                      <SelectContent className="rounded-xl max-h-72">
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
                      className="h-14 rounded-xl bg-white/5 border-white/10 font-bold"
                    />
                  )}
                </div>

                <div className="space-y-3">
                  <Label className="text-[10px] font-bold uppercase tracking-widest ml-1">Versión</Label>
                  {selectedModel ? (
                    <Select value={formData.version} onValueChange={handleVersionSelect}>
                      <SelectTrigger className="h-14 rounded-xl bg-white/5 border-white/10 font-bold">
                        <SelectValue placeholder="Seleccionar versión" />
                      </SelectTrigger>
                      <SelectContent className="rounded-xl max-h-72">
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
                      className="h-14 rounded-xl bg-white/5 border-white/10 font-bold"
                    />
                  )}
                </div>

                <div className="space-y-3">
                  <Label className="text-[10px] font-bold uppercase tracking-widest ml-1">Año</Label>
                  <Select value={formData.year} onValueChange={v => update('year', v)}>
                    <SelectTrigger className="h-14 rounded-xl bg-white/5 border-white/10 font-bold">
                      <SelectValue placeholder="Seleccionar año" />
                    </SelectTrigger>
                    <SelectContent className="rounded-xl max-h-72">
                      {YEARS.map(y => (
                        <SelectItem key={y} value={y}>{y}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-3">
                  <Label className="text-[10px] font-bold uppercase tracking-widest ml-1">Kilometraje</Label>
                  <Input
                    type="text"
                    inputMode="numeric"
                    value={formatArgentineNumber(formData.km)}
                    onChange={e => update('km', parseArgentineNumber(e.target.value))}
                    placeholder="0"
                    className="h-14 rounded-xl bg-white/5 border-white/10 font-bold"
                  />
                </div>

                <div className="space-y-3">
                  <Label className="text-[10px] font-bold uppercase tracking-widest ml-1">Condición</Label>
                  <div className="grid grid-cols-2 gap-2">
                    <Button
                      variant="outline"
                      type="button"
                      onClick={() => update('condition', 'USADO')}
                      className={`h-14 rounded-xl border-white/10 font-bold uppercase tracking-widest ${formData.condition === 'USADO' ? 'bg-primary text-primary-foreground border-primary' : 'bg-white/5 text-muted-foreground hover:bg-white/10'}`}
                    >
                      Usado
                    </Button>
                    <Button
                      variant="outline"
                      type="button"
                      onClick={() => update('condition', '0KM')}
                      className={`h-14 rounded-xl border-white/10 font-bold uppercase tracking-widest ${formData.condition === '0KM' ? 'bg-primary text-primary-foreground border-primary' : 'bg-white/5 text-muted-foreground hover:bg-white/10'}`}
                    >
                      0 KM
                    </Button>
                  </div>
                </div>

                <div className="space-y-3">
                  <Label className="text-[10px] font-bold uppercase tracking-widest ml-1">Combustible</Label>
                  <Select value={formData.fuelType} onValueChange={v => update('fuelType', v)}>
                    <SelectTrigger className="h-14 rounded-xl bg-white/5 border-white/10 font-bold">
                      <SelectValue placeholder="Seleccionar" />
                    </SelectTrigger>
                    <SelectContent className="rounded-xl">
                      {FUEL_TYPES.map(f => (
                        <SelectItem key={f.value} value={f.value}>{f.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-3">
                  <Label className="text-[10px] font-bold uppercase tracking-widest ml-1">Transmisión</Label>
                  <div className="grid grid-cols-2 gap-2">
                    {TRANSMISSIONS.map(t => (
                      <Button
                        key={t.value}
                        variant="outline"
                        type="button"
                        onClick={() => update('transmission', t.value)}
                        className={`h-14 rounded-xl border-white/10 font-bold uppercase tracking-widest ${formData.transmission === t.value ? 'bg-primary text-primary-foreground border-primary' : 'bg-white/5 text-muted-foreground hover:bg-white/10'}`}
                      >
                        {t.label}
                      </Button>
                    ))}
                  </div>
                </div>

                <div className="space-y-3">
                  <Label className="text-[10px] font-bold uppercase tracking-widest ml-1">Carrocería</Label>
                  <Select value={formData.bodyType} onValueChange={v => update('bodyType', v)}>
                    <SelectTrigger className="h-14 rounded-xl bg-white/5 border-white/10 font-bold">
                      <SelectValue placeholder="Seleccionar" />
                    </SelectTrigger>
                    <SelectContent className="rounded-xl">
                      {BODY_TYPES.map(b => (
                        <SelectItem key={b.value} value={b.value}>{b.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-3">
                  <Label className="text-[10px] font-bold uppercase tracking-widest ml-1">Color</Label>
                  <Select value={formData.color} onValueChange={v => update('color', v)}>
                    <SelectTrigger className="h-14 rounded-xl bg-white/5 border-white/10 font-bold">
                      <SelectValue placeholder="Seleccionar" />
                    </SelectTrigger>
                    <SelectContent className="rounded-xl">
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

                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <Label className="text-[10px] font-bold uppercase tracking-widest ml-1">Provincia</Label>
                    {userProfile?.province && (
                      <span className="text-[8px] font-bold text-primary uppercase">Vinculado a tu Agencia</span>
                    )}
                  </div>
                  <Select 
                    value={formData.province} 
                    onValueChange={v => { update('province', v); update('city', ''); }}
                    disabled={!!userProfile?.province}
                  >
                    <SelectTrigger className={`h-14 rounded-xl bg-white/5 border-white/10 font-bold ${userProfile?.province ? 'opacity-70' : ''}`}>
                      <SelectValue>
                        {PROVINCIAS_ARGENTINA.find(p => p.id === formData.province)?.nombre || 'Seleccionar provincia'}
                      </SelectValue>
                    </SelectTrigger>
                    <SelectContent className="rounded-xl max-h-72">
                      {PROVINCIAS_ARGENTINA.map(p => (
                        <SelectItem key={p.id} value={p.id}>{p.nombre}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <Label className="text-[10px] font-bold uppercase tracking-widest ml-1">Localidad</Label>
                    {userProfile?.city && (
                      <span className="text-[8px] font-bold text-primary uppercase">Vinculado a tu Agencia</span>
                    )}
                  </div>
                  <Select
                    value={formData.city}
                    onValueChange={v => update('city', v)}
                    disabled={!selectedProvince || !!userProfile?.city}
                  >
                    <SelectTrigger className={`h-14 rounded-xl bg-white/5 border-white/10 font-bold ${userProfile?.city ? 'opacity-70' : ''}`}>
                      <SelectValue>
                        {selectedProvince?.localidades.find(l => l.id === formData.city)?.nombre || (selectedProvince ? 'Seleccionar localidad' : 'Primero elegí provincia')}
                      </SelectValue>
                    </SelectTrigger>
                    <SelectContent className="rounded-xl max-h-72">
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

              {photoPreviews.length > 0 && (
                <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-3">
                  {photoPreviews.map((url, i) => (
                    <div key={i} className="relative aspect-square rounded-xl overflow-hidden group">
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

              {/* No-photos confirmation dialog */}
              {showNoPhotosDialog && (
                <div className="p-6 rounded-3xl bg-amber-500/5 border border-amber-500/20 space-y-4">
                  <div className="flex items-center gap-3">
                    <ImageOff className="h-5 w-5 text-amber-500" />
                    <p className="text-sm font-bold uppercase tracking-widest">¿Publicar sin fotos?</p>
                  </div>
                  <p className="text-xs text-muted-foreground font-medium">Las publicaciones sin fotos tienen mucha menos visibilidad. ¿Estás seguro?</p>
                  <div className="flex gap-3">
                    <Button variant="outline" onClick={() => setShowNoPhotosDialog(false)} className="rounded-full px-6 border-white/10 font-bold uppercase tracking-widest text-xs">
                      Volver
                    </Button>
                    <Button onClick={confirmNoPhotos} className="rounded-full px-6 font-bold uppercase tracking-widest text-xs bg-amber-500 hover:bg-amber-600">
                      Continuar sin fotos
                    </Button>
                  </div>
                </div>
              )}

              <div className="flex flex-col-reverse sm:flex-row justify-between pt-4 gap-4">
                <Button variant="ghost" onClick={prevStep} className="w-full sm:w-auto h-14 px-8 rounded-full font-bold uppercase tracking-tighter text-lg gap-2 hover:bg-white/5">
                  <ArrowLeft className="h-5 w-5 stroke-[3]" /> Anterior
                </Button>
                <Button onClick={nextStep} className="w-full sm:w-auto h-14 px-10 rounded-full font-bold uppercase tracking-tighter text-lg gap-2 shadow-lg shadow-primary/20">
                  Siguiente <ArrowRight className="h-5 w-5 stroke-[3]" />
                </Button>
              </div>
            </motion.div>
          )}

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
                    className="flex items-center space-x-3 border border-white/5 bg-white/5 p-6 rounded-xl hover:border-primary/30 transition-all cursor-pointer"
                  >
                    <Checkbox
                      id={id}
                      className="h-6 w-6 rounded-md border-white/20"
                      checked={formData[id as keyof PublishFormData] as boolean}
                      onCheckedChange={v => update(id as keyof PublishFormData, Boolean(v) as any)}
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
                  className="min-h-[150px] rounded-xl bg-white/5 border-white/10 font-bold p-6"
                />
              </div>

              <div className="flex flex-col-reverse sm:flex-row justify-between pt-4 gap-4">
                <Button variant="ghost" onClick={prevStep} className="w-full sm:w-auto h-14 px-8 rounded-full font-bold uppercase tracking-tighter text-lg gap-2 hover:bg-white/5">
                  <ArrowLeft className="h-5 w-5 stroke-[3]" /> Anterior
                </Button>
                <Button onClick={nextStep} className="w-full sm:w-auto h-14 px-10 rounded-full font-bold uppercase tracking-tighter text-lg gap-2 shadow-lg shadow-primary/20">
                  Siguiente <ArrowRight className="h-5 w-5 stroke-[3]" />
                </Button>
              </div>
            </motion.div>
          )}

          {step === 4 && (
            <motion.div initial={{ x: 20, opacity: 0 }} animate={{ x: 0, opacity: 1 }} className="space-y-8">
              <StepEstadoTecnico inspection={inspection} onChange={setInspection} />
              <div className="flex flex-col-reverse sm:flex-row justify-between pt-4 gap-4">
                <Button variant="ghost" onClick={prevStep} className="w-full sm:w-auto h-14 px-8 rounded-full font-bold uppercase tracking-tighter text-lg gap-2 hover:bg-white/5">
                  <ArrowLeft className="h-5 w-5 stroke-[3]" /> Anterior
                </Button>
                <Button onClick={nextStep} className="w-full sm:w-auto h-14 px-10 rounded-full font-bold uppercase tracking-tighter text-lg gap-2 shadow-lg shadow-primary/20">
                  Siguiente <ArrowRight className="h-5 w-5 stroke-[3]" />
                </Button>
              </div>
            </motion.div>
          )}

          {step === 5 && (
            <motion.div initial={{ x: 20, opacity: 0 }} animate={{ x: 0, opacity: 1 }} className="space-y-8">
              <h3 className="text-xl font-bold tracking-tighter uppercase">Precio y Condiciones de Venta</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-3">
                  <Label className="text-[10px] font-bold uppercase tracking-widest ml-1">Moneda</Label>
                  <Select value={formData.currency} onValueChange={v => update('currency', v as 'USD' | 'ARS')}>
                    <SelectTrigger className="h-14 rounded-xl bg-white/5 border-white/10 font-bold">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="rounded-xl">
                      <SelectItem value="USD">Dólares (USD)</SelectItem>
                      <SelectItem value="ARS">Pesos (ARS)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-3">
                  <Label className="text-[10px] font-bold uppercase tracking-widest ml-1">Precio</Label>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground font-bold text-lg">
                      {formData.currency === 'USD' ? 'U$D' : '$'}
                    </span>
                    <Input
                      type="text"
                      inputMode="numeric"
                      value={formatArgentineNumber(formData.price)}
                      onChange={e => update('price', parseArgentineNumber(e.target.value))}
                      placeholder="0"
                      className="h-14 rounded-xl bg-white/5 border-white/10 font-bold text-2xl text-primary tracking-tighter pl-14"
                    />
                  </div>
                </div>
              </div>
              <div className="flex flex-col-reverse sm:flex-row justify-between pt-4 gap-4">
                <Button variant="ghost" onClick={prevStep} className="w-full sm:w-auto h-14 px-8 rounded-full font-bold uppercase tracking-tighter text-lg gap-2 hover:bg-white/5">
                  <ArrowLeft className="h-5 w-5 stroke-[3]" /> Anterior
                </Button>
                <Button onClick={nextStep} className="w-full sm:w-auto h-14 px-10 rounded-full font-bold uppercase tracking-tighter text-lg gap-2 shadow-lg shadow-primary/20">
                  Siguiente <ArrowRight className="h-5 w-5 stroke-[3]" />
                </Button>
              </div>
            </motion.div>
          )}

          {step === 6 && (
            <motion.div initial={{ x: 20, opacity: 0 }} animate={{ x: 0, opacity: 1 }} className="space-y-8">
              <StepPreview formData={formData} inspection={inspection} photoPreviews={photoPreviews} photosCount={photos.length} />

              {/* Upload progress bar */}
              {photoUpload.isUploading && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between text-xs font-bold uppercase tracking-widest">
                    <span>Subiendo fotos...</span>
                    <span>{photoUpload.completedFiles}/{photoUpload.totalFiles}</span>
                  </div>
                  <div className="w-full h-3 bg-white/5 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-primary rounded-full transition-all duration-300"
                      style={{ width: `${photoUpload.overallProgress}%` }}
                    />
                  </div>
                </div>
              )}

              <div className="flex flex-col-reverse sm:flex-row justify-between pt-4 gap-4">
                <Button variant="ghost" onClick={prevStep} disabled={submitting} className="w-full sm:w-auto h-14 px-8 rounded-full font-bold uppercase tracking-tighter text-lg gap-2 hover:bg-white/5">
                  <ArrowLeft className="h-5 w-5 stroke-[3]" /> Anterior
                </Button>
                <Button
                  type="submit"
                  onClick={handleSubmit}
                  disabled={submitting || photoUpload.isUploading}
                  className="w-full sm:w-auto h-14 px-10 rounded-full font-bold uppercase tracking-[0.15em] text-base shadow-xl shadow-primary/20 active:scale-[0.98] transition-transform gap-2"
                >
                  {submitting ? (
                    <><Loader2 className="h-5 w-5 animate-spin" /> Publicando...</>
                  ) : (
                    <><CheckCircle2 className="h-5 w-5 stroke-[3]" /> Publicar</>
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
