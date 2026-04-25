
import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Mail, Lock, ArrowRight, ShieldCheck, Building2, User, Phone, Fingerprint, CreditCard, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useNavigate } from 'react-router-dom';
import { Logo } from '../components/layout/Logo';
import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword,
  updateProfile
} from 'firebase/auth';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { auth, db, handleFirestoreError, OperationType } from '@/src/lib/firebase';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { AlertCircle, CheckCircle2 } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

export function Login() {
  const [isLogin, setIsLogin] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  // Login States
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');

  // Register States
  const [regName, setRegName] = useState('');
  const [regLastName, setRegLastName] = useState('');
  const [regCuil, setRegCuil] = useState('');
  const [regPhone, setRegPhone] = useState('');
  const [regCompany, setRegCompany] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regPlan, setRegPlan] = useState('plata');

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      await signInWithEmailAndPassword(auth, loginEmail, loginPassword);
      navigate('/marketplace');
    } catch (err: any) {
      console.error(err);
      if (err.code === 'auth/user-not-found') {
        setError('El usuario no existe. ¿Querés solicitar admisión?');
      } else if (err.code === 'auth/wrong-password') {
        setError('Contraseña incorrecta.');
      } else {
        setError('Error al iniciar sesión. Verificá tus credenciales.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleDemoMode = async (type: 'demo' | 'vendedor' | 'comprador') => {
    setLoading(true);
    setError(null);
    
    let demoEmail = 'DEMO@reven.com.ar';
    let demoPass = 'DEMO1234';
    
    if (type === 'vendedor') {
      demoEmail = 'vendedor@reven.com.ar';
      demoPass = 'REVEN2026';
    } else if (type === 'comprador') {
      demoEmail = 'comprador@reven.com.ar';
      demoPass = 'REVEN2026';
    }
    
    try {
      await signInWithEmailAndPassword(auth, demoEmail, demoPass);
      navigate('/marketplace');
    } catch (err: any) {
      if (err.code === 'auth/user-not-found' || err.code === 'auth/invalid-credential' || err.code === 'auth/invalid-login-credentials') {
        try {
          const userCredential = await createUserWithEmailAndPassword(auth, demoEmail, demoPass);
          const user = userCredential.user;
          
          const displayName = type === 'vendedor' ? 'Vendedor REVEN' : (type === 'comprador' ? 'Comprador REVEN' : 'Usuario Demo');
          const companyName = type === 'vendedor' ? 'REVEN Motors (Vendedor)' : (type === 'comprador' ? 'AutoSelect B2B (Comprador)' : 'Reven Demo Dealer');

          await updateProfile(user, { displayName });

          await setDoc(doc(db, 'users', user.uid), {
            uid: user.uid,
            email: demoEmail,
            name: displayName.split(' ')[0],
            lastName: displayName.split(' ')[1] || 'Demo',
            cuil: type === 'vendedor' ? '20-99999999-9' : '20-88888888-8',
            phone: type === 'vendedor' ? '+54 9 11 5555-0001' : '+54 9 11 5555-0002',
            company: companyName,
            province: type === 'vendedor' ? 'buenosaires' : (type === 'comprador' ? 'caba' : ''),
            city: type === 'vendedor' ? 'ba-sanisidro' : (type === 'comprador' ? 'caba-palermo' : ''),
            plan: 'platinum',
            role: 'user',
            status: 'approved',
            createdAt: serverTimestamp()
          });
          
          navigate('/marketplace');
        } catch (regErr: any) {
          if (regErr.code === 'auth/email-already-in-use') {
            setError(`El usuario '${demoEmail}' ya existe con otra contraseña. Por favor usa la correcta.`);
          } else {
            setError(`Error al inicializar acceso: ${regErr.message}`);
          }
        }
      } else {
        setError(`Error en el acceso demo: ${err.message}`);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, regEmail, regPassword);
      const user = userCredential.user;

      await updateProfile(user, {
        displayName: `${regName} ${regLastName}`
      });

      const userPath = `users/${user.uid}`;
      try {
        await setDoc(doc(db, 'users', user.uid), {
          uid: user.uid,
          email: regEmail,
          name: regName,
          lastName: regLastName,
          cuil: regCuil,
          phone: regPhone,
          company: regCompany,
          plan: regPlan,
          role: 'user',
          status: 'pending',
          createdAt: serverTimestamp()
        });
      } catch (fsErr) {
        handleFirestoreError(fsErr, OperationType.WRITE, userPath);
      }

      setIsLogin(true);
      setError('Solicitud enviada con éxito. Te contactaremos pronto.');
    } catch (err: any) {
      console.error(err);
      setError('Error al procesar la solicitud. Intenta nuevamente.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4 relative overflow-hidden">
      {/* Background Glows */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-primary/10 blur-[120px] rounded-full" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-primary/5 blur-[120px] rounded-full" />

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md z-10"
      >
        <div className="text-center mb-10">
          <motion.div 
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.5 }}
            className="flex justify-center mb-6"
          >
            <Logo className="text-5xl" variant="auto" />
          </motion.div>
          <h2 className="text-3xl font-bold tracking-tighter uppercase">
            {isLogin ? 'Bienvenido a la Comunidad' : 'Solicitud de Admisión'}
          </h2>
          <p className="text-muted-foreground mt-2 font-medium">
            {isLogin 
              ? 'Accede a tu cuenta exclusiva de Reven.' 
              : 'Verificamos cada solicitud para garantizar un entorno 100% profesional y B2B.'}
          </p>
        </div>

        <div className="bg-card/50 backdrop-blur-xl border border-border p-8 rounded-[2.5rem] shadow-2xl">
          {error && (
            <div className={`mb-6 p-4 rounded-xl text-xs font-bold uppercase tracking-widest text-center ${error.includes('éxito') ? 'bg-primary/10 text-primary' : 'bg-destructive/10 text-destructive'}`}>
              {error}
            </div>
          )}
          <AnimatePresence mode="wait">
            {isLogin ? (
              <motion.form 
                key="login"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                className="space-y-6"
                onSubmit={handleLogin}
              >
                <div className="space-y-2">
                  <Label htmlFor="email" className="text-xs font-bold uppercase tracking-widest ml-1">Email Profesional</Label>
                  <div className="relative">
                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                    <Input 
                      id="email" 
                      type="email" 
                      required
                      value={loginEmail}
                      onChange={(e) => setLoginEmail(e.target.value)}
                      placeholder="nombre@concesionaria.com" 
                      className="h-14 pl-12 rounded-2xl bg-background/50 border-border focus:border-primary/50 transition-all font-bold"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="flex items-center justify-between ml-1">
                    <Label htmlFor="password" className="text-xs font-bold uppercase tracking-widest">Contraseña</Label>
                    <button type="button" className="text-[10px] font-bold uppercase tracking-widest text-primary hover:underline">¿Olvidaste tu contraseña?</button>
                  </div>
                  <div className="relative">
                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                    <Input 
                      id="password" 
                      type="password" 
                      required
                      value={loginPassword}
                      onChange={(e) => setLoginPassword(e.target.value)}
                      placeholder="••••••••" 
                      className="h-14 pl-12 rounded-2xl bg-background/50 border-border focus:border-primary/50 transition-all font-bold"
                    />
                  </div>
                </div>
                <Button 
                  type="submit"
                  disabled={loading}
                  className="w-full h-14 rounded-2xl font-bold text-lg shadow-lg shadow-primary/20 group uppercase tracking-tighter"
                >
                  {loading ? <Loader2 className="h-6 w-6 animate-spin" /> : (
                    <>
                      INGRESAR
                      <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
                    </>
                  )}
                </Button>

                  <div className="space-y-4 pt-4 border-t border-white/5">
                    <p className="text-[10px] text-center font-bold uppercase tracking-[0.2em] text-muted-foreground mb-4">Accesos Rápidos de Prueba</p>
                    <div className="grid grid-cols-2 gap-3">
                      <Button 
                        type="button"
                        variant="outline" 
                        className="rounded-2xl h-11 text-[10px] font-bold uppercase tracking-widest border-primary/20 hover:bg-primary/5 hover:text-primary transition-all"
                        onClick={() => handleDemoMode('vendedor')}
                        disabled={loading}
                      >
                        Rol Vendedor
                      </Button>
                      <Button 
                        type="button"
                        variant="outline" 
                        className="rounded-2xl h-11 text-[10px] font-bold uppercase tracking-widest border-primary/20 hover:bg-primary/5 hover:text-primary transition-all"
                        onClick={() => handleDemoMode('comprador')}
                        disabled={loading}
                      >
                        Rol Comprador
                      </Button>
                    </div>
                  </div>
              </motion.form>
            ) : (
              <motion.form 
                key="register"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-4"
                onSubmit={handleRegister}
              >
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="name" className="text-[10px] font-bold uppercase tracking-widest ml-1">Nombre</Label>
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input 
                        id="name" 
                        required
                        value={regName}
                        onChange={(e) => setRegName(e.target.value)}
                        placeholder="Juan" 
                        className="h-12 pl-10 rounded-xl bg-background/50 border-border font-bold" 
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="lastname" className="text-[10px] font-bold uppercase tracking-widest ml-1">Apellido</Label>
                    <Input 
                      id="lastname" 
                      required
                      value={regLastName}
                      onChange={(e) => setRegLastName(e.target.value)}
                      placeholder="Pérez" 
                      className="h-12 px-4 rounded-xl bg-background/50 border-border font-bold" 
                    />
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="cuil" className="text-[10px] font-bold uppercase tracking-widest ml-1">CUIL / CUIT</Label>
                    <div className="relative">
                      <Fingerprint className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input 
                        id="cuil" 
                        required
                        value={regCuil}
                        onChange={(e) => setRegCuil(e.target.value)}
                        placeholder="20-XXXXXXXX-X" 
                        className="h-12 pl-10 rounded-xl bg-background/50 border-border font-bold" 
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="phone" className="text-[10px] font-bold uppercase tracking-widest ml-1">Teléfono</Label>
                    <div className="relative">
                      <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input 
                        id="phone" 
                        required
                        value={regPhone}
                        onChange={(e) => setRegPhone(e.target.value)}
                        placeholder="+54 9 11 ..." 
                        className="h-12 pl-10 rounded-xl bg-background/50 border-border font-bold" 
                      />
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="company" className="text-[10px] font-bold uppercase tracking-widest ml-1">Nombre de la Concesionaria</Label>
                  <div className="relative">
                    <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input 
                      id="company" 
                      required
                      value={regCompany}
                      onChange={(e) => setRegCompany(e.target.value)}
                      placeholder="Automotores Reven S.A." 
                      className="h-12 pl-10 rounded-xl bg-background/50 border-border font-bold" 
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="reg-email" className="text-[10px] font-bold uppercase tracking-widest ml-1">Email Corporativo</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input 
                      id="reg-email" 
                      type="email" 
                      required
                      value={regEmail}
                      onChange={(e) => setRegEmail(e.target.value)}
                      placeholder="juan@concesionaria.com" 
                      className="h-12 pl-10 rounded-xl bg-background/50 border-border font-bold" 
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="reg-pass" className="text-[10px] font-bold uppercase tracking-widest ml-1">Contraseña</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input 
                      id="reg-pass" 
                      type="password" 
                      required
                      value={regPassword}
                      onChange={(e) => setRegPassword(e.target.value)}
                      placeholder="••••••••" 
                      className="h-12 pl-10 rounded-xl bg-background/50 border-border font-bold" 
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label className="text-[10px] font-bold uppercase tracking-widest ml-1">Plan de Membresía</Label>
                  <Select value={regPlan} onValueChange={setRegPlan}>
                    <SelectTrigger className="h-12 rounded-xl bg-background/50 border-border font-bold">
                      <div className="flex items-center gap-2">
                        <CreditCard className="h-4 w-4 text-primary" />
                        <SelectValue placeholder="Seleccionar plan" />
                      </div>
                    </SelectTrigger>
                    <SelectContent className="rounded-xl">
                      <SelectItem value="plata">PLAN PLATA (Hasta 5 autos)</SelectItem>
                      <SelectItem value="oro">PLAN ORO (Hasta 25 autos)</SelectItem>
                      <SelectItem value="platinum">PLAN PLATINUM (Hasta 150 autos)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <Button 
                  type="submit"
                  disabled={loading}
                  className="w-full h-14 rounded-2xl font-bold text-lg shadow-lg shadow-primary/20 mt-4 uppercase tracking-tighter"
                >
                  {loading ? <Loader2 className="h-6 w-6 animate-spin" /> : 'ENVIAR SOLICITUD'}
                </Button>
              </motion.form>
            )}
          </AnimatePresence>
        </div>

        <div className="mt-8 text-center space-y-4">
          <button 
            onClick={() => setIsLogin(!isLogin)}
            className="text-sm font-bold text-muted-foreground hover:text-primary transition-colors uppercase tracking-widest"
          >
            {isLogin ? '¿No tenés cuenta? Solicitá tu admisión' : '¿Ya tienes cuenta? Iniciá sesión'}
          </button>
          <div className="flex items-center justify-center gap-2 text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground/50">
            <ShieldCheck className="h-3 w-3" />
            PLATAFORMA EXCLUSIVA B2B
          </div>
        </div>
      </motion.div>
    </div>
  );
}
