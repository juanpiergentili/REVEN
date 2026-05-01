import { useState } from 'react';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { motion, AnimatePresence } from 'motion/react';
import { AlertCircle, Wrench, Eye, PaintBucket, Settings, CheckCircle2, ChevronDown, ChevronUp } from 'lucide-react';
import type { InspectionFormData } from '@/src/lib/publish-helpers';
import {
  OBSERVACIONES_INTERNAS_OPTIONS,
  PANELES_CHAPA,
  TIPO_DANO_CHAPA,
  TIPO_DANO_CACHAS,
  OPTICAS_OPTIONS,
  FALLAS_MECANICAS_OPTIONS,
  INITIAL_INSPECTION,
} from '@/src/lib/publish-helpers';
import type { ChapaPinturaItem } from '@/src/types';

interface Props {
  inspection: InspectionFormData;
  onChange: (data: InspectionFormData) => void;
}

export function StepEstadoTecnico({ inspection, onChange }: Props) {
  const [openSections, setOpenSections] = useState<Record<string, boolean>>({
    observaciones: false,
    cubiertas: false,
    chapa: false,
    opticas: false,
    mecanica: false,
  });

  const toggleSection = (sec: string) => {
    setOpenSections(prev => ({ ...prev, [sec]: !prev[sec] }));
  };
  const handleSinGastos = (checked: boolean) => {
    if (checked) {
      // Clear all defects and mark as SIN GASTOS
      onChange({ ...INITIAL_INSPECTION, sinGastos: true });
    } else {
      onChange({ ...inspection, sinGastos: false });
    }
  };

  const toggleObservacion = (obs: string) => {
    const list = inspection.observacionesInternas.includes(obs)
      ? inspection.observacionesInternas.filter(o => o !== obs)
      : [...inspection.observacionesInternas, obs];
    onChange({ ...inspection, sinGastos: false, observacionesInternas: list });
  };

  const toggleOptica = (opt: string) => {
    const list = inspection.opticasDanadas.includes(opt)
      ? inspection.opticasDanadas.filter(o => o !== opt)
      : [...inspection.opticasDanadas, opt];
    onChange({ ...inspection, sinGastos: false, opticasDanadas: list });
  };

  const toggleFallaMecanica = (falla: string) => {
    const list = inspection.fallasMecanicas.includes(falla)
      ? inspection.fallasMecanicas.filter(f => f !== falla)
      : [...inspection.fallasMecanicas, falla];
    onChange({ ...inspection, sinGastos: false, fallasMecanicas: list });
  };

  const toggleChapaPintura = (panel: string, tipo: ChapaPinturaItem['tipo']) => {
    const exists = inspection.chapaPintura.find(c => c.panel === panel && c.tipo === tipo);
    if (exists) {
      onChange({
        ...inspection,
        sinGastos: false,
        chapaPintura: inspection.chapaPintura.filter(c => !(c.panel === panel && c.tipo === tipo)),
      });
    } else {
      const filtered = inspection.chapaPintura.filter(c => c.panel !== panel);
      onChange({
        ...inspection,
        sinGastos: false,
        chapaPintura: [...filtered, { panel, tipo }],
      });
    }
  };

  const getChapaTipo = (panel: string): string | undefined => {
    return inspection.chapaPintura.find(c => c.panel === panel)?.tipo;
  };

  return (
    <motion.div initial={{ x: 20, opacity: 0 }} animate={{ x: 0, opacity: 1 }} className="space-y-10">
      {/* SIN GASTOS toggle */}
      <div className="space-y-2">
        <label
          className={`flex items-center gap-4 border-2 p-6 rounded-xl cursor-pointer transition-all ${
            inspection.sinGastos
              ? 'border-green-500/50 bg-green-500/10 shadow-lg shadow-green-500/5'
              : 'border-white/10 bg-white/5 hover:border-green-500/20'
          }`}
        >
          <Checkbox
            className="h-7 w-7 rounded-lg border-white/20"
            checked={inspection.sinGastos}
            onCheckedChange={v => handleSinGastos(Boolean(v))}
          />
          <div className="flex items-center gap-3 flex-1">
            <CheckCircle2 className={`h-6 w-6 ${inspection.sinGastos ? 'text-green-500' : 'text-muted-foreground'}`} />
            <div>
              <p className="font-black text-sm uppercase tracking-widest">Sin gastos</p>
              <p className="text-xs text-muted-foreground font-medium">El vehículo no tiene ningún detalle ni gasto pendiente</p>
            </div>
          </div>
        </label>
        {inspection.sinGastos && (
          <p className="text-xs text-amber-500 font-bold ml-4">
            ⚠️ Atención: Seleccionar "Sin Gastos" cuando el vehículo presenta detalles puede resultar en penalizaciones para la agencia.
          </p>
        )}
      </div>

      {/* Only show defect sections if NOT sinGastos */}
      {!inspection.sinGastos && (
        <div className="space-y-4">
      {/* Observaciones Internas */}
      <div className="border border-white/10 rounded-xl overflow-hidden bg-white/5">
        <button 
          onClick={() => toggleSection('observaciones')}
          className="w-full flex items-center justify-between p-4 hover:bg-white/5 transition-colors"
        >
          <div className="flex items-center gap-3">
            <div className="bg-amber-500/10 p-2 rounded-xl">
              <AlertCircle className="h-5 w-5 text-amber-500" />
            </div>
            <h3 className="text-lg font-bold tracking-tighter uppercase">Observaciones Internas</h3>
          </div>
          {openSections['observaciones'] ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
        </button>
        <AnimatePresence>
          {openSections['observaciones'] && (
            <motion.div 
              initial={{ height: 0, opacity: 0 }} 
              animate={{ height: 'auto', opacity: 1 }} 
              exit={{ height: 0, opacity: 0 }}
              className="px-4 pb-4 space-y-4"
            >
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {OBSERVACIONES_INTERNAS_OPTIONS.map(obs => (
                  <label
                    key={obs}
                    className={`flex items-center space-x-3 border p-4 rounded-xl cursor-pointer transition-all ${
                      inspection.observacionesInternas.includes(obs)
                        ? 'border-amber-500/40 bg-amber-500/5'
                        : 'border-white/5 bg-white/5 hover:border-white/10'
                    }`}
                  >
                    <Checkbox
                      className="h-5 w-5 rounded-md border-white/20"
                      checked={inspection.observacionesInternas.includes(obs)}
                      onCheckedChange={() => toggleObservacion(obs)}
                    />
                    <span className="font-bold text-xs uppercase tracking-widest">{obs}</span>
                  </label>
                ))}
              </div>
              <div className="space-y-2">
                <Label className="text-[10px] font-bold uppercase tracking-widest ml-1">Notas adicionales</Label>
                <Textarea
                  value={inspection.observacionesNotas}
                  onChange={e => onChange({ ...inspection, observacionesNotas: e.target.value })}
                  placeholder="Ej: Vidrio trasero fisurado, falta alfombra baúl..."
                  className="min-h-[80px] rounded-xl bg-white/5 border-white/10 font-bold p-4"
                />
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Cubiertas */}
      <div className="border border-white/10 rounded-xl overflow-hidden bg-white/5">
        <button 
          onClick={() => toggleSection('cubiertas')}
          className="w-full flex items-center justify-between p-4 hover:bg-white/5 transition-colors"
        >
          <div className="flex items-center gap-3">
            <div className="bg-blue-500/10 p-2 rounded-xl">
              <Settings className="h-5 w-5 text-blue-500" />
            </div>
            <h3 className="text-lg font-bold tracking-tighter uppercase">Estado de Cubiertas</h3>
          </div>
          {openSections['cubiertas'] ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
        </button>
        <AnimatePresence>
          {openSections['cubiertas'] && (
            <motion.div 
              initial={{ height: 0, opacity: 0 }} 
              animate={{ height: 'auto', opacity: 1 }} 
              exit={{ height: 0, opacity: 0 }}
              className="px-4 pb-4 space-y-4"
            >
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-[10px] font-bold uppercase tracking-widest ml-1">Cubiertas a cambiar</Label>
                  <div className="flex bg-white/5 p-1 rounded-xl border border-white/10 h-14">
                    {[0, 1, 2, 3, 4].map(num => (
                      <button
                        key={num}
                        type="button"
                        onClick={() => onChange({
                          ...inspection,
                          cubiertas: { ...inspection.cubiertas, cambiar: num },
                        })}
                        className={`flex-1 rounded-lg font-black text-sm transition-all ${
                          inspection.cubiertas.cambiar === num
                            ? 'bg-blue-500 text-white shadow-md'
                            : 'text-muted-foreground hover:bg-white/5'
                        }`}
                      >
                        {num}
                      </button>
                    ))}
                  </div>
                  <p className="text-[10px] text-muted-foreground text-center font-bold uppercase tracking-widest mt-1">
                    {inspection.cubiertas.cambiar === 0 ? 'Ninguna — buen estado' : `Cambiar ${inspection.cubiertas.cambiar} cubierta${inspection.cubiertas.cambiar > 1 ? 's' : ''}`}
                  </p>
                </div>
                <label
                  className={`flex items-center space-x-3 border p-6 rounded-xl cursor-pointer transition-all ${
                    inspection.cubiertas.sinAuxilio
                      ? 'border-amber-500/40 bg-amber-500/5'
                      : 'border-white/5 bg-white/5 hover:border-white/10'
                  }`}
                >
                  <Checkbox
                    className="h-6 w-6 rounded-md border-white/20"
                    checked={inspection.cubiertas.sinAuxilio}
                    onCheckedChange={v => onChange({
                      ...inspection,
                      cubiertas: { ...inspection.cubiertas, sinAuxilio: Boolean(v) },
                    })}
                  />
                  <span className="font-bold text-xs uppercase tracking-widest">Sin rueda de auxilio</span>
                </label>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Chapa y Pintura */}
      <div className="border border-white/10 rounded-xl overflow-hidden bg-white/5">
        <button 
          onClick={() => toggleSection('chapa')}
          className="w-full flex items-center justify-between p-4 hover:bg-white/5 transition-colors"
        >
          <div className="flex items-center gap-3">
            <div className="bg-purple-500/10 p-2 rounded-xl">
              <PaintBucket className="h-5 w-5 text-purple-500" />
            </div>
            <h3 className="text-lg font-bold tracking-tighter uppercase">Chapa y Pintura</h3>
          </div>
          {openSections['chapa'] ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
        </button>
        <AnimatePresence>
          {openSections['chapa'] && (
            <motion.div 
              initial={{ height: 0, opacity: 0 }} 
              animate={{ height: 'auto', opacity: 1 }} 
              exit={{ height: 0, opacity: 0 }}
              className="px-4 pb-4 space-y-4"
            >
              <p className="text-xs text-muted-foreground font-medium ml-1">
                Seleccioná el tipo de trabajo necesario para cada paño afectado. Dejá sin seleccionar los que estén bien.
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {PANELES_CHAPA.map(panel => {
                  const currentTipo = getChapaTipo(panel);
                  const isCachas = panel === 'Cachas espejos';
                  const options = isCachas ? TIPO_DANO_CACHAS : TIPO_DANO_CHAPA;

                  return (
                    <div
                      key={panel}
                      className={`border rounded-xl p-4 transition-all ${
                        currentTipo ? 'border-purple-500/30 bg-purple-500/5' : 'border-white/5 bg-white/5'
                      }`}
                    >
                      <p className="font-bold text-xs uppercase tracking-widest mb-3">{panel}</p>
                      <div className="flex gap-2 flex-wrap">
                        {options.map(t => (
                          <button
                            key={t.value}
                            type="button"
                            onClick={() => {
                              if (currentTipo === t.value) {
                                // Deselect
                                onChange({
                                  ...inspection,
                                  chapaPintura: inspection.chapaPintura.filter(c => c.panel !== panel),
                                });
                              } else {
                                toggleChapaPintura(panel, t.value);
                              }
                            }}
                            className={`px-3 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest transition-all ${
                              currentTipo === t.value
                                ? 'bg-purple-500 text-white'
                                : 'bg-white/5 text-muted-foreground hover:bg-white/10'
                            }`}
                          >
                            {t.label}
                          </button>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Ópticas */}
      <div className="border border-white/10 rounded-xl overflow-hidden bg-white/5">
        <button 
          onClick={() => toggleSection('opticas')}
          className="w-full flex items-center justify-between p-4 hover:bg-white/5 transition-colors"
        >
          <div className="flex items-center gap-3">
            <div className="bg-cyan-500/10 p-2 rounded-xl">
              <Eye className="h-5 w-5 text-cyan-500" />
            </div>
            <h3 className="text-lg font-bold tracking-tighter uppercase">Ópticas</h3>
          </div>
          {openSections['opticas'] ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
        </button>
        <AnimatePresence>
          {openSections['opticas'] && (
            <motion.div 
              initial={{ height: 0, opacity: 0 }} 
              animate={{ height: 'auto', opacity: 1 }} 
              exit={{ height: 0, opacity: 0 }}
              className="px-4 pb-4 space-y-4"
            >
              <p className="text-xs text-muted-foreground font-medium ml-1">
                Marcá las ópticas que presenten daños, roturas o estén empañadas.
              </p>
              <div className="grid grid-cols-2 gap-3">
                {OPTICAS_OPTIONS.map(opt => (
                  <label
                    key={opt}
                    className={`flex items-center space-x-3 border p-4 rounded-xl cursor-pointer transition-all ${
                      inspection.opticasDanadas.includes(opt)
                        ? 'border-cyan-500/40 bg-cyan-500/5'
                        : 'border-white/5 bg-white/5 hover:border-white/10'
                    }`}
                  >
                    <Checkbox
                      className="h-5 w-5 rounded-md border-white/20"
                      checked={inspection.opticasDanadas.includes(opt)}
                      onCheckedChange={() => toggleOptica(opt)}
                    />
                    <span className="font-bold text-xs uppercase tracking-widest">{opt}</span>
                  </label>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Estado Mecánico */}
      <div className="border border-white/10 rounded-xl overflow-hidden bg-white/5">
        <button 
          onClick={() => toggleSection('mecanica')}
          className="w-full flex items-center justify-between p-4 hover:bg-white/5 transition-colors"
        >
          <div className="flex items-center gap-3">
            <div className="bg-red-500/10 p-2 rounded-xl">
              <Wrench className="h-5 w-5 text-red-500" />
            </div>
            <h3 className="text-lg font-bold tracking-tighter uppercase">Estado Mecánico</h3>
          </div>
          {openSections['mecanica'] ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
        </button>
        <AnimatePresence>
          {openSections['mecanica'] && (
            <motion.div 
              initial={{ height: 0, opacity: 0 }} 
              animate={{ height: 'auto', opacity: 1 }} 
              exit={{ height: 0, opacity: 0 }}
              className="px-4 pb-4 space-y-4"
            >
              <p className="text-xs text-muted-foreground font-medium ml-1">
                Marcá las fallas mecánicas graves que presente la unidad.
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {FALLAS_MECANICAS_OPTIONS.map(falla => (
                  <label
                    key={falla}
                    className={`flex items-center space-x-3 border p-5 rounded-2xl cursor-pointer transition-all ${
                      inspection.fallasMecanicas.includes(falla)
                        ? 'border-red-500/40 bg-red-500/5'
                        : 'border-white/5 bg-white/5 hover:border-white/10'
                    }`}
                  >
                    <Checkbox
                      className="h-5 w-5 rounded-md border-white/20"
                      checked={inspection.fallasMecanicas.includes(falla)}
                      onCheckedChange={() => toggleFallaMecanica(falla)}
                    />
                    <span className="font-bold text-xs uppercase tracking-widest">{falla}</span>
                  </label>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
        </div>
      )}
    </motion.div>
  );
}
