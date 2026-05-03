import { motion } from 'motion/react';
import { Badge } from '@/components/ui/badge';
import { CheckCircle2, AlertTriangle, Camera, MapPin, Fuel, Calendar } from 'lucide-react';
import { formatArgentineNumber, hasInspectionData } from '@/src/lib/publish-helpers';
import type { PublishFormData, InspectionFormData } from '@/src/lib/publish-helpers';
import { FUEL_TYPES, TRANSMISSIONS, BODY_TYPES, COLORS } from '@/src/data/vehicle-catalog';
import { PROVINCIAS_ARGENTINA } from '@/src/data/argentina-geo';

interface Props {
  formData: PublishFormData;
  inspection: InspectionFormData;
  photoPreviews: string[];
  photosCount: number;
}

export function StepPreview({ formData, inspection, photoPreviews, photosCount }: Props) {
  const fuelLabel = FUEL_TYPES.find(f => f.value === formData.fuelType)?.label || formData.fuelType;
  const transLabel = TRANSMISSIONS.find(t => t.value === formData.transmission)?.label || formData.transmission;
  const bodyLabel = BODY_TYPES.find(b => b.value === formData.bodyType)?.label || formData.bodyType;
  const colorObj = COLORS.find(c => c.value === formData.color);
  const provinceName = PROVINCIAS_ARGENTINA.find(p => p.id === formData.province)?.nombre || formData.province;
  const prov = PROVINCIAS_ARGENTINA.find(p => p.id === formData.province);
  const cityName = prov?.localidades.find(l => l.id === formData.city)?.nombre || formData.city;
  const locationStr = cityName ? `${cityName}, ${provinceName}` : provinceName;
  const hasInspection = hasInspectionData(inspection);

  return (
    <motion.div initial={{ x: 20, opacity: 0 }} animate={{ x: 0, opacity: 1 }} className="space-y-8">
      <h3 className="text-xl font-bold tracking-tighter uppercase">Preview de Publicación</h3>
      <p className="text-sm text-muted-foreground font-medium -mt-4">
        Revisá toda la información antes de publicar.
      </p>

      {/* Photo carousel */}
      {photoPreviews.length > 0 ? (
        <div className="space-y-3">
          <div className="relative aspect-[16/9] rounded-3xl overflow-hidden bg-white/5">
            <img
              src={photoPreviews[0]}
              alt="Foto principal"
              className="w-full h-full object-cover"
            />
            <div className="absolute bottom-3 right-3 bg-black/60 backdrop-blur-sm text-white text-[10px] font-black uppercase tracking-widest px-3 py-1.5 rounded-full flex items-center gap-1.5">
              <Camera className="h-3 w-3" /> {photosCount} foto{photosCount !== 1 ? 's' : ''}
            </div>
          </div>
          {photoPreviews.length > 1 && (
            <div className="flex gap-2 overflow-x-auto pb-2">
              {photoPreviews.slice(1, 6).map((url, i) => (
                <div key={i} className="shrink-0 w-20 h-20 rounded-xl overflow-hidden">
                  <img src={url} alt={`Foto ${i + 2}`} className="w-full h-full object-cover" />
                </div>
              ))}
              {photoPreviews.length > 6 && (
                <div className="shrink-0 w-20 h-20 rounded-xl bg-white/5 flex items-center justify-center">
                  <span className="text-xs font-bold text-muted-foreground">+{photoPreviews.length - 6}</span>
                </div>
              )}
            </div>
          )}
        </div>
      ) : (
        <div className="p-8 rounded-3xl bg-amber-500/5 border border-amber-500/20 flex items-center gap-3">
          <AlertTriangle className="h-5 w-5 text-amber-500 shrink-0" />
          <p className="text-sm font-medium">Sin fotos — la publicación tendrá menor visibilidad.</p>
        </div>
      )}

      {/* Vehicle data */}
      <div className="p-6 rounded-3xl bg-white/5 border border-white/10 space-y-4">
        <p className="font-black uppercase tracking-widest text-[10px] text-muted-foreground">Datos del vehículo</p>
        <div className="space-y-3 text-sm">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Vehículo</span>
            <span className="font-bold text-right">{formData.brand} {formData.model} {formData.version}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground flex items-center gap-1"><Calendar className="h-3 w-3" /> Año</span>
            <span className="font-bold">{formData.year}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Kilometraje</span>
            <span className="font-bold">{formData.condition === '0KM' ? '0 km' : `${formatArgentineNumber(formData.km)} km`}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Condición</span>
            <span className="font-bold">{formData.condition === '0KM' ? '0 KM' : 'Usado'}</span>
          </div>
          {fuelLabel && (
            <div className="flex justify-between">
              <span className="text-muted-foreground flex items-center gap-1"><Fuel className="h-3 w-3" /> Combustible</span>
              <span className="font-bold">{fuelLabel}</span>
            </div>
          )}
          {transLabel && (
            <div className="flex justify-between">
              <span className="text-muted-foreground">Transmisión</span>
              <span className="font-bold">{transLabel}</span>
            </div>
          )}
          {bodyLabel && (
            <div className="flex justify-between">
              <span className="text-muted-foreground">Carrocería</span>
              <span className="font-bold">{bodyLabel}</span>
            </div>
          )}
          {colorObj && (
            <div className="flex justify-between items-center">
              <span className="text-muted-foreground">Color</span>
              <span className="font-bold flex items-center gap-2">
                <span className="w-3 h-3 rounded-full border border-white/20" style={{ background: colorObj.hex }} />
                {colorObj.label}
              </span>
            </div>
          )}
          <div className="flex justify-between">
            <span className="text-muted-foreground flex items-center gap-1"><MapPin className="h-3 w-3" /> Ubicación</span>
            <span className="font-bold">{locationStr || '—'}</span>
          </div>
        </div>
      </div>

      {/* Documentación */}
      <div className="p-6 rounded-3xl bg-white/5 border border-white/10 space-y-3">
        <p className="font-black uppercase tracking-widest text-[10px] text-muted-foreground">Documentación</p>
        <div className="flex flex-wrap gap-2">
          {formData.hasVTV && <Badge className="bg-green-500/10 text-green-500 border-green-500/20 rounded-full">VTV Vigente</Badge>}
          {formData.hasPatenteAlDay && <Badge className="bg-green-500/10 text-green-500 border-green-500/20 rounded-full">Patente al día</Badge>}
          {formData.uniqueOwner && <Badge className="bg-green-500/10 text-green-500 border-green-500/20 rounded-full">Único dueño</Badge>}
          {formData.officialService && <Badge className="bg-green-500/10 text-green-500 border-green-500/20 rounded-full">Services oficiales</Badge>}
          {formData.gncObleaVigente && <Badge className="bg-green-500/10 text-green-500 border-green-500/20 rounded-full">Oblea GNC</Badge>}
          {!formData.hasVTV && !formData.hasPatenteAlDay && !formData.uniqueOwner && !formData.officialService && !formData.gncObleaVigente && (
            <span className="text-xs text-muted-foreground">Sin documentación marcada</span>
          )}
        </div>
      </div>

      {/* Inspección */}
      {hasInspection && (
        <div className="p-6 rounded-3xl bg-white/5 border border-white/10 space-y-3">
          <p className="font-black uppercase tracking-widest text-[10px] text-muted-foreground">Estado Técnico</p>
          <div className="flex flex-wrap gap-2">
            {inspection.sinGastos && (
              <Badge className="bg-green-500/10 text-green-500 border-green-500/20 rounded-full text-[10px]">✓ Sin gastos</Badge>
            )}
            {inspection.observacionesInternas.map(o => (
              <Badge key={o} className="bg-amber-500/10 text-amber-500 border-amber-500/20 rounded-full text-[10px]">{o}</Badge>
            ))}
            {inspection.cubiertas.cambiar > 0 && (
              <Badge className="bg-blue-500/10 text-blue-500 border-blue-500/20 rounded-full text-[10px]">
                Cambiar {inspection.cubiertas.cambiar} cubierta{inspection.cubiertas.cambiar > 1 ? 's' : ''}
              </Badge>
            )}
            {inspection.cubiertas.sinAuxilio && (
              <Badge className="bg-amber-500/10 text-amber-500 border-amber-500/20 rounded-full text-[10px]">Sin auxilio</Badge>
            )}
            {inspection.chapaPintura.map(c => (
              <Badge key={`${c.panel}-${c.tipo}`} className="bg-purple-500/10 text-purple-500 border-purple-500/20 rounded-full text-[10px]">
                {c.panel}: {c.tipo}
              </Badge>
            ))}
            {inspection.opticasDanadas.map(o => (
              <Badge key={o} className="bg-cyan-500/10 text-cyan-500 border-cyan-500/20 rounded-full text-[10px]">Óptica {o}</Badge>
            ))}
            {inspection.fallasMecanicas.map(f => (
              <Badge key={f} className="bg-red-500/10 text-red-500 border-red-500/20 rounded-full text-[10px]">{f}</Badge>
            ))}
          </div>
          {inspection.observacionesNotas && (
            <p className="text-xs text-muted-foreground mt-2">Notas: {inspection.observacionesNotas}</p>
          )}
        </div>
      )}

      {/* Precio */}
      <div className="p-6 rounded-3xl bg-primary/5 border border-primary/20 space-y-2">
        <p className="font-black uppercase tracking-widest text-[10px] text-muted-foreground">Precio</p>
        <p className="text-3xl font-black tracking-tighter text-primary">
          {formData.currency === 'USD' ? 'USD' : 'ARS'} {formatArgentineNumber(formData.price)}
        </p>
      </div>

      {formData.description && (
        <div className="p-6 rounded-3xl bg-white/5 border border-white/10 space-y-2">
          <p className="font-black uppercase tracking-widest text-[10px] text-muted-foreground">Descripción</p>
          <p className="text-sm whitespace-pre-wrap">{formData.description}</p>
        </div>
      )}

      {/* Legal */}
      <div className="p-8 rounded-3xl bg-primary/5 border border-primary/20 space-y-4">
        <div className="flex items-center gap-3">
          <CheckCircle2 className="h-5 w-5 text-primary" />
          <p className="text-sm font-bold uppercase tracking-widest">Publicación verificada</p>
        </div>
        <p className="text-xs text-muted-foreground font-medium">
          Al publicar, aceptás que la información es verídica y que sos el responsable legal de la unidad o tenés poder para comercializarla.
        </p>
      </div>
    </motion.div>
  );
}
