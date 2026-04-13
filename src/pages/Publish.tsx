
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Camera, ArrowRight, ArrowLeft, CheckCircle2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Badge } from '@/components/ui/badge';
import { motion } from 'motion/react';

export function Publish() {
  const [step, setStep] = useState(1);
  const [fuelType, setFuelType] = useState('');
  const navigate = useNavigate();

  const nextStep = () => setStep(step + 1);
  const prevStep = () => setStep(step - 1);

  return (
    <div className="container max-w-4xl py-20 px-4">
      <div className="mb-12 text-center space-y-4">
        <Badge className="bg-primary/20 text-primary border-primary/20 font-bold tracking-tighter px-4 py-1.5 rounded-full text-sm">
          NUEVA PUBLICACIÓN
        </Badge>
        <h1 className="text-5xl font-bold tracking-tighter uppercase">Sumar Stock</h1>
        <p className="text-muted-foreground font-medium">Completá los pasos para publicar tu unidad en la comunidad.</p>
      </div>

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
          {step === 1 && (
            <motion.div 
              initial={{ x: 20, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              className="space-y-8"
            >
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-3">
                  <Label htmlFor="brand" className="text-[10px] font-bold uppercase tracking-widest ml-1">Marca</Label>
                  <Select>
                    <SelectTrigger id="brand" className="h-14 rounded-2xl bg-white/5 border-white/10 font-bold">
                      <SelectValue placeholder="Seleccionar marca" />
                    </SelectTrigger>
                    <SelectContent className="rounded-2xl">
                      <SelectItem value="toyota">Toyota</SelectItem>
                      <SelectItem value="vw">Volkswagen</SelectItem>
                      <SelectItem value="ford">Ford</SelectItem>
                      <SelectItem value="fiat">Fiat</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-3">
                  <Label htmlFor="model" className="text-[10px] font-bold uppercase tracking-widest ml-1">Modelo</Label>
                  <Input id="model" placeholder="Ej: Hilux, Vento..." className="h-14 rounded-2xl bg-white/5 border-white/10 font-bold" />
                </div>
                <div className="space-y-3">
                  <Label htmlFor="version" className="text-[10px] font-bold uppercase tracking-widest ml-1">Versión</Label>
                  <Input id="version" placeholder="Ej: 2.8 SRX 4X4 AT" className="h-14 rounded-2xl bg-white/5 border-white/10 font-bold" />
                </div>
                <div className="space-y-3">
                  <Label htmlFor="year" className="text-[10px] font-bold uppercase tracking-widest ml-1">Año</Label>
                  <Input id="year" type="number" placeholder="2024" className="h-14 rounded-2xl bg-white/5 border-white/10 font-bold" />
                </div>
                <div className="space-y-3">
                  <Label htmlFor="km" className="text-[10px] font-bold uppercase tracking-widest ml-1">Kilometraje</Label>
                  <Input id="km" type="number" placeholder="0" className="h-14 rounded-2xl bg-white/5 border-white/10 font-bold" />
                </div>
                <div className="space-y-3">
                  <Label htmlFor="fuel" className="text-[10px] font-bold uppercase tracking-widest ml-1">Combustible</Label>
                  <Select onValueChange={setFuelType}>
                    <SelectTrigger id="fuel" className="h-14 rounded-2xl bg-white/5 border-white/10 font-bold">
                      <SelectValue placeholder="Seleccionar" />
                    </SelectTrigger>
                    <SelectContent className="rounded-2xl">
                      <SelectItem value="NAFTA">Nafta</SelectItem>
                      <SelectItem value="DIESEL">Diesel</SelectItem>
                      <SelectItem value="GNC">GNC</SelectItem>
                      <SelectItem value="HIBRIDO">Híbrido</SelectItem>
                      <SelectItem value="ELECTRICO">Eléctrico</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="flex justify-end pt-4">
                <Button onClick={nextStep} className="h-14 px-10 rounded-full font-black uppercase italic tracking-tighter text-lg gap-2 shadow-lg shadow-primary/20">
                  Siguiente
                  <ArrowRight className="h-5 w-5 stroke-[3]" />
                </Button>
              </div>
            </motion.div>
          )}

          {step === 2 && (
            <motion.div 
              initial={{ x: 20, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              className="space-y-8"
            >
              <div className="border-4 border-dashed border-white/5 rounded-[2rem] p-16 text-center space-y-6 hover:border-primary/30 transition-all cursor-pointer bg-white/5 group">
                <div className="bg-primary/10 w-20 h-20 rounded-full flex items-center justify-center mx-auto group-hover:scale-110 transition-transform duration-500">
                  <Camera className="h-10 w-10 text-primary" />
                </div>
                <div className="space-y-2">
                  <p className="text-xl font-bold tracking-tighter uppercase">Subir fotografías</p>
                  <p className="text-sm text-muted-foreground font-medium">Arrastrá tus fotos aquí o hacé clic para buscar (Máx 15)</p>
                </div>
                <Button variant="outline" className="rounded-full px-8 border-white/10 font-bold uppercase tracking-widest text-xs">Seleccionar archivos</Button>
              </div>
              
              <div className="flex justify-between pt-4">
                <Button variant="ghost" onClick={prevStep} className="h-14 px-8 rounded-full font-bold uppercase tracking-tighter text-lg gap-2 hover:bg-white/5">
                  <ArrowLeft className="h-5 w-5 stroke-[3]" />
                  Anterior
                </Button>
                <Button onClick={nextStep} className="h-14 px-10 rounded-full font-bold uppercase tracking-tighter text-lg gap-2 shadow-lg shadow-primary/20">
                  Siguiente
                  <ArrowRight className="h-5 w-5 stroke-[3]" />
                </Button>
              </div>
            </motion.div>
          )}

          {step === 3 && (
            <motion.div 
              initial={{ x: 20, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              className="space-y-8"
            >
              <div className="space-y-8">
                <h3 className="text-xl font-bold tracking-tighter uppercase">Documentación y Estado</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="flex items-center space-x-3 border border-white/5 bg-white/5 p-6 rounded-2xl hover:border-primary/30 transition-all cursor-pointer">
                    <Checkbox id="vtv" className="h-6 w-6 rounded-md border-white/20" />
                    <Label htmlFor="vtv" className="font-bold uppercase tracking-widest text-xs cursor-pointer">VTV Vigente</Label>
                  </div>
                  <div className="flex items-center space-x-3 border border-white/5 bg-white/5 p-6 rounded-2xl hover:border-primary/30 transition-all cursor-pointer">
                    <Checkbox id="patente" className="h-6 w-6 rounded-md border-white/20" />
                    <Label htmlFor="patente" className="font-bold uppercase tracking-widest text-xs cursor-pointer">Patente al día</Label>
                  </div>
                  <div className="flex items-center space-x-3 border border-white/5 bg-white/5 p-6 rounded-2xl hover:border-primary/30 transition-all cursor-pointer">
                    <Checkbox id="dueno" className="h-6 w-6 rounded-md border-white/20" />
                    <Label htmlFor="dueno" className="font-bold uppercase tracking-widest text-xs cursor-pointer">Único Dueño</Label>
                  </div>
                  <div className="flex items-center space-x-3 border border-white/5 bg-white/5 p-6 rounded-2xl hover:border-primary/30 transition-all cursor-pointer">
                    <Checkbox id="service" className="h-6 w-6 rounded-md border-white/20" />
                    <Label htmlFor="service" className="font-bold uppercase tracking-widest text-xs cursor-pointer">Services Oficiales</Label>
                  </div>
                </div>

                <div className="space-y-3">
                  <Label htmlFor="obs" className="text-[10px] font-bold uppercase tracking-widest ml-1">Observaciones / Detalles estéticos</Label>
                  <Textarea id="obs" placeholder="Describí el estado general, equipamiento adicional, etc." className="min-h-[150px] rounded-2xl bg-white/5 border-white/10 font-bold p-6" />
                </div>
              </div>

              <div className="flex justify-between pt-4">
                <Button variant="ghost" onClick={prevStep} className="h-14 px-8 rounded-full font-bold uppercase tracking-tighter text-lg gap-2 hover:bg-white/5">
                  <ArrowLeft className="h-5 w-5 stroke-[3]" />
                  Anterior
                </Button>
                <Button onClick={nextStep} className="h-14 px-10 rounded-full font-bold uppercase tracking-tighter text-lg gap-2 shadow-lg shadow-primary/20">
                  Siguiente
                  <ArrowRight className="h-5 w-5 stroke-[3]" />
                </Button>
              </div>
            </motion.div>
          )}

          {step === 4 && (
            <motion.div 
              initial={{ x: 20, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              className="space-y-8"
            >
              <div className="space-y-8">
                <h3 className="text-xl font-bold tracking-tighter uppercase">Precio y Condiciones de Venta</h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="space-y-3">
                    <Label htmlFor="currency" className="text-[10px] font-bold uppercase tracking-widest ml-1">Moneda</Label>
                    <Select defaultValue="USD">
                      <SelectTrigger id="currency" className="h-14 rounded-2xl bg-white/5 border-white/10 font-bold">
                        <SelectValue placeholder="Seleccionar" />
                      </SelectTrigger>
                      <SelectContent className="rounded-2xl">
                        <SelectItem value="USD">Dólares (USD)</SelectItem>
                        <SelectItem value="ARS">Pesos (ARS)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-3">
                    <Label htmlFor="price" className="text-[10px] font-bold uppercase tracking-widest ml-1">Precio</Label>
                    <Input id="price" type="number" placeholder="0" className="h-14 rounded-2xl bg-white/5 border-white/10 font-bold text-2xl text-primary tracking-tighter" />
                  </div>
                </div>

                <div className="p-8 rounded-3xl bg-primary/5 border border-primary/20 space-y-4">
                  <div className="flex items-center gap-3">
                    <CheckCircle2 className="h-5 w-5 text-primary" />
                    <p className="text-sm font-bold uppercase tracking-widest">Publicación verificada</p>
                  </div>
                  <p className="text-xs text-muted-foreground font-medium">Al publicar, aceptás que la información es verídica y que sos el responsable legal de la unidad o tenés poder para comercializarla.</p>
                </div>
              </div>

              <div className="flex justify-between pt-4">
                <Button variant="ghost" onClick={prevStep} className="h-14 px-8 rounded-full font-bold uppercase tracking-tighter text-lg gap-2 hover:bg-white/5">
                  <ArrowLeft className="h-5 w-5 stroke-[3]" />
                  Anterior
                </Button>
                <Button onClick={() => navigate('/')} className="h-14 px-10 rounded-full font-bold uppercase tracking-tighter text-lg gap-2 bg-primary hover:bg-primary/90 text-primary-foreground shadow-lg shadow-primary/20">
                  <CheckCircle2 className="h-5 w-5 stroke-[3]" />
                  Finalizar Publicación
                </Button>
              </div>
            </motion.div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
