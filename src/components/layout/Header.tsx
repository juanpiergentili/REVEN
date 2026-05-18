import React, { useState, useEffect, useRef, MouseEvent } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { 
  Car, 
  MessageSquare, 
  LayoutDashboard, 
  Menu, 
  X, 
  Plus, 
  HelpCircle,
  User,
  Mail,
  Lock,
  ArrowRight,
  Loader2,
  ShieldCheck,
  LogOut,
  Building2,
  ChevronDown,
  ShoppingBag,
  Shield,
  Sparkles,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { motion, AnimatePresence } from 'motion/react';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { signInWithEmailAndPassword, onAuthStateChanged, signOut, sendPasswordResetEmail, User as FirebaseUser } from 'firebase/auth';
import { auth, db, handleFirestoreError, OperationType } from '@/src/lib/firebase';
import { subscribeToUnreadCount } from '@/src/lib/chat';
import { doc, getDoc } from 'firebase/firestore';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuGroup,
} from "@/components/ui/dropdown-menu";
import { Logo } from './Logo';

const SUPER_ADMINS = ['lucas.ferreyra@gmail.com'];

export function Header() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isLoginOpen, setIsLoginOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isForgotPassword, setIsForgotPassword] = useState(false);
  const [resetSent, setResetSent] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [user, setUser] = useState<FirebaseUser | null>(null);
  const [userProfile, setUserProfile] = useState<any>(null);
  const [unreadCount, setUnreadCount] = useState(0);
  const [showMsgToast, setShowMsgToast] = useState(false);
  const prevUnread = useRef(0);
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      if (currentUser) {
        const userPath = `users/${currentUser.uid}`;
        try {
          const docRef = doc(db, 'users', currentUser.uid);
          const docSnap = await getDoc(docRef);
          if (docSnap.exists()) {
            setUserProfile(docSnap.data());
          }
        } catch (error) {
          handleFirestoreError(error, OperationType.GET, userPath);
        }
      } else {
        setUserProfile(null);
      }
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (!user) {
      setUnreadCount(0);
      return;
    }
    const unsub = subscribeToUnreadCount(user.uid, (count) => {
      if (count > prevUnread.current && prevUnread.current >= 0) {
        setShowMsgToast(true);
        if (toastTimer.current) clearTimeout(toastTimer.current);
        toastTimer.current = setTimeout(() => setShowMsgToast(false), 4000);
      }
      prevUnread.current = count;
      setUnreadCount(count);
    });
    return unsub;
  }, [user]);

  const handleLogout = async () => {
    await signOut(auth);
    navigate('/');
  };

  const location = useLocation();
  const navigate = useNavigate();

  const isLanding = location.pathname === '/';

  useEffect(() => {
    document.documentElement.classList.add('dark');
    localStorage.setItem('theme', 'dark');
  }, []);

  const navItems = [
    { name: 'Inicio', path: '/', icon: LayoutDashboard },
    { name: 'Marketplace', path: '/marketplace', icon: Car },
    { name: 'Agencias', path: '/agencies', icon: Building2 },
    { name: 'Ayuda', path: '/como-funciona', icon: HelpCircle },
  ];

  const handleNavClick = (path: string, e: MouseEvent) => {
    if (isLanding && path !== '/' && !user) {
      e.preventDefault();
      setIsLoginOpen(true);
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const emailLower = email.toLowerCase();

    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
        
        // Verificar status antes de permitir el acceso
        const userDoc = await getDoc(doc(db, 'users', userCredential.user.uid));
        const userData = userDoc.data();
        
        const isSuperAdmin = userCredential.user.email && SUPER_ADMINS.includes(userCredential.user.email);
        
        if (userData && userData.role !== 'ADMIN' && !isSuperAdmin) {
          if (userData.status === 'pending') {
            await signOut(auth);
            setError('Tu cuenta aún está en proceso de revisión.');
            setLoading(false);
            return;
          }
          if (userData.status === 'rejected') {
            await signOut(auth);
            setError('Tu solicitud de admisión ha sido rechazada.');
            setLoading(false);
            return;
          }
        }
        setIsLoginOpen(false);
        navigate('/marketplace');
      } catch (err: any) {
      if (err.code === 'auth/user-not-found') {
        setError('El usuario no existe.');
      } else if (err.code === 'auth/wrong-password' || err.code === 'auth/invalid-credential') {
        setError('Contraseña incorrecta.');
      } else if (err.code === 'auth/email-already-in-use') {
        setError(`El usuario '${email}' ya existe con otra contraseña.`);
      } else if (err.code === 'auth/operation-not-allowed') {
        setError('El método Email/Password no está habilitado en Firebase.');
      } else {
        setError('Credenciales inválidas o error de conexión.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) {
      setError('Ingresa tu correo electrónico.');
      return;
    }
    setLoading(true);
    setError(null);
    try {
      await sendPasswordResetEmail(auth, email);
      setResetSent(true);
    } catch (err: any) {
      if (err.code === 'auth/user-not-found') {
        setError('No hay un usuario registrado con este correo.');
      } else if (err.code === 'auth/invalid-email') {
        setError('El correo no es válido.');
      } else {
        setError('Error al enviar el correo. Intenta nuevamente.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {/* Top Banner */}
      <div className="fixed top-0 left-0 right-0 z-[60] bg-primary text-primary-foreground py-2 px-4 text-center text-[10px] md:text-xs font-black uppercase tracking-widest flex items-center justify-center gap-2 shadow-xl border-b border-primary-foreground/10">
        <Sparkles className="h-4 w-4 shrink-0" />
        <span>
          Accede al plan profesional y obtén los dos primeros meses gratis. Utiliza el código:{' '}
          <span className="bg-primary-foreground text-primary px-2 py-0.5 rounded-md mx-1 shadow-sm">REVEN60</span>
        </span>
        <Sparkles className="h-4 w-4 shrink-0 hidden md:block" />
      </div>

      <header className="fixed top-12 left-0 right-0 z-50 px-4 md:px-6">
      <div className="max-w-screen-xl mx-auto flex h-16 items-center justify-between px-5 md:px-8 rounded-2xl border border-white/10 bg-background/30 backdrop-blur-2xl shadow-xl transition-colors duration-300">
        <div className="flex items-center gap-8">
          <Link to="/" className="flex items-center space-x-2 group">
            <Logo className="text-4xl" variant="auto" />
            <Badge variant="outline" className="hidden lg:flex border-primary/20 bg-primary/5 text-primary font-black text-[8px] px-2 py-0 rounded-full tracking-tighter opacity-60 ml-2">
              v1.2.5
            </Badge>
          </Link>

          <nav className="hidden md:flex items-center gap-8">
            {navItems.map((item) => (
              <Link
                key={item.name}
                to={item.path}
                onClick={(e) => handleNavClick(item.path, e)}
                className={`flex items-center gap-2 text-sm font-light uppercase tracking-widest transition-colors hover:text-primary ${
                  location.pathname === item.path ? 'text-primary' : 'text-muted-foreground'
                }`}
              >
                <item.icon className="h-4 w-4" />
                {item.name}
              </Link>
            ))}
          </nav>
        </div>

        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            className="relative rounded-full w-10 h-10 border border-border"
            onClick={() => {
              if (isLanding) {
                setIsLoginOpen(true);
              } else {
                navigate('/messages');
              }
            }}
          >
            <MessageSquare className="h-5 w-5" />
            {unreadCount > 0 && !isLanding && (
              <span className="absolute -top-0.5 -right-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-primary text-[9px] text-primary-foreground font-black">
                {unreadCount}
              </span>
            )}
          </Button>


          <div className="hidden md:flex items-center gap-4">
            {user ? (
              <>
                <DropdownMenu>
                  <DropdownMenuTrigger className="relative h-11 flex items-center gap-3 px-2 rounded-2xl hover:bg-primary/5 border border-transparent hover:border-primary/20 transition-all bg-transparent outline-none cursor-pointer">
                      <Avatar className="h-8 w-8 border-2 border-primary/20">
                        <AvatarImage src={userProfile?.logoUrl || userProfile?.avatarUrl} />
                        <AvatarFallback className="bg-primary/10 text-primary font-bold text-xs flex items-center justify-center">
                          <Building2 className="h-4 w-4" />
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex flex-col items-start text-left">
                        <span className="text-[10px] font-black uppercase tracking-tighter leading-none">{userProfile?.company || 'Mi Concesionaria'}</span>
                        <span className="text-[8px] text-muted-foreground font-bold uppercase tracking-widest mt-0.5">{userProfile?.name} {userProfile?.lastName}</span>
                      </div>
                      <ChevronDown className="h-3 w-3 text-muted-foreground" />
                  </DropdownMenuTrigger>
                  <DropdownMenuContent className="w-56 rounded-2xl p-2" align="end">
                    <DropdownMenuGroup>
                      <DropdownMenuLabel className="font-bold uppercase tracking-widest text-[10px] px-3 py-2">Mi Cuenta</DropdownMenuLabel>
                    </DropdownMenuGroup>
                    <DropdownMenuSeparator />
                    {(userProfile?.role === 'ADMIN' || (user?.email && SUPER_ADMINS.includes(user.email))) && (
                      <>
                        <DropdownMenuItem
                          className="rounded-xl font-light uppercase tracking-widest text-[10px] px-3 py-2 cursor-pointer text-primary focus:text-primary"
                          onClick={() => navigate('/admin')}
                        >
                          <Shield className="mr-2 h-4 w-4" />
                          Panel Admin
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                      </>
                    )}
                    <DropdownMenuItem
                      className="rounded-xl font-light uppercase tracking-widest text-[10px] px-3 py-2 cursor-pointer"
                      onClick={() => navigate('/profile')}
                    >
                      <Building2 className="mr-2 h-4 w-4" />
                      Mi Concesionaria
                    </DropdownMenuItem>
                    <DropdownMenuItem className="rounded-xl font-light uppercase tracking-widest text-[10px] px-3 py-2 cursor-pointer">
                      <ShoppingBag className="mr-2 h-4 w-4" />
                      Últimas Compras
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem 
                      onClick={handleLogout}
                      className="rounded-xl font-light uppercase tracking-widest text-[10px] px-3 py-2 cursor-pointer text-destructive focus:text-destructive"
                    >
                      <LogOut className="mr-2 h-4 w-4" />
                      Cerrar Sesión
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>

                <Button 
                  className="rounded-full px-6 font-light uppercase tracking-widest text-xs h-11 shadow-lg shadow-primary/20 group"
                  onClick={() => navigate('/publish')}
                >
                  PUBLICAR UNIDAD
                  <Plus className="ml-2 h-4 w-4 group-hover:rotate-90 transition-transform" />
                </Button>
              </>
            ) : (
              <>
                <Button 
                  variant="outline" 
                  className="rounded-2xl px-6 font-semibold uppercase tracking-widest text-xs h-11 border-border hover:bg-primary/10 hover:text-primary transition-all"
                  onClick={() => setIsLoginOpen(true)}
                >
                  <User className="mr-2 h-4 w-4" />
                  INGRESAR
                </Button>
                <Button
                  className="rounded-full px-6 font-semibold uppercase tracking-widest text-xs h-11 shadow-lg shadow-primary/20 group"
                  onClick={() => navigate('/?register=true')}
                >
                  REGISTRARSE
                </Button>
              </>
            )}
          </div>

          <Button
            variant="ghost"
            size="icon"
            className="md:hidden"
            onClick={() => setIsMenuOpen(!isMenuOpen)}
          >
            {isMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </Button>
        </div>
      </div>

      {/* Mobile Menu */}
      <AnimatePresence>
        {isMenuOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="md:hidden border-t border-white/10 bg-background/70 backdrop-blur-2xl overflow-hidden"
          >
            <div className="container mx-auto py-4 px-4 space-y-1">
              {/* Nav links */}
              {navItems.map((item) => (
                <Link
                  key={item.name}
                  to={item.path}
                  onClick={(e) => { handleNavClick(item.path, e); setIsMenuOpen(false); }}
                  className={`flex items-center gap-3 font-light uppercase tracking-widest text-xs px-4 py-3 rounded-xl transition-colors ${
                    location.pathname === item.path
                      ? 'text-primary bg-primary/5'
                      : 'text-muted-foreground hover:text-foreground hover:bg-muted'
                  }`}
                >
                  <item.icon className="h-4 w-4" />
                  {item.name}
                </Link>
              ))}

              <div className="border-t border-border pt-3 mt-3 space-y-1">
                {user ? (
                  <>
                    {/* User identity */}
                    <div className="flex items-center gap-3 px-4 py-3 mb-1">
                      <Avatar className="h-10 w-10 border-2 border-primary/20 shrink-0">
                        <AvatarImage src={userProfile?.logoUrl || userProfile?.avatarUrl} />
                        <AvatarFallback className="bg-primary/10 text-primary font-bold text-xs flex items-center justify-center">
                          <Building2 className="h-4 w-4" />
                        </AvatarFallback>
                      </Avatar>
                      <div className="min-w-0">
                        <p className="font-black uppercase tracking-tight text-sm leading-none truncate">
                          {userProfile?.company || 'Mi Concesionaria'}
                        </p>
                        <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-widest mt-0.5 truncate">
                          {userProfile?.name} {userProfile?.lastName}
                        </p>
                      </div>
                    </div>

                    {/* Admin */}
                    {userProfile?.role === 'ADMIN' && (
                      <button
                        onClick={() => { navigate('/admin'); setIsMenuOpen(false); }}
                        className="flex items-center gap-3 w-full text-left font-bold uppercase tracking-widest text-xs px-4 py-3 rounded-xl text-primary hover:bg-primary/5 transition-colors"
                      >
                        <Shield className="h-4 w-4" /> Panel Admin
                      </button>
                    )}

                    <button
                      onClick={() => { navigate('/profile'); setIsMenuOpen(false); }}
                      className="flex items-center gap-3 w-full text-left font-bold uppercase tracking-widest text-xs px-4 py-3 rounded-xl text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                    >
                      <Building2 className="h-4 w-4" /> Mi Concesionaria
                    </button>

                    <button
                      onClick={() => { navigate('/publish'); setIsMenuOpen(false); }}
                      className="flex items-center gap-3 w-full text-left font-bold uppercase tracking-widest text-xs px-4 py-3 rounded-xl text-primary bg-primary/10 hover:bg-primary/20 transition-colors"
                    >
                      <Plus className="h-4 w-4" /> Publicar unidad
                    </button>

                    <div className="border-t border-border pt-2 mt-2">
                      <button
                        onClick={() => { handleLogout(); setIsMenuOpen(false); }}
                        className="flex items-center gap-3 w-full text-left font-bold uppercase tracking-widest text-xs px-4 py-3 rounded-xl text-destructive hover:bg-destructive/5 transition-colors"
                      >
                        <LogOut className="h-4 w-4" /> Cerrar Sesión
                      </button>
                    </div>
                  </>
                ) : (
                  <div className="flex flex-col gap-2 pt-1">
                    <Button
                      variant="outline"
                      className="w-full rounded-2xl h-12 font-bold uppercase tracking-widest text-xs border-border"
                      onClick={() => { setIsLoginOpen(true); setIsMenuOpen(false); }}
                    >
                      <User className="mr-2 h-4 w-4" /> Ingresar
                    </Button>
                    <Button
                      className="w-full rounded-2xl h-12 font-bold uppercase tracking-widest text-xs shadow-lg shadow-primary/20"
                      onClick={() => { navigate('/?register=true'); setIsMenuOpen(false); }}
                    >
                      Registrarse
                    </Button>
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* New message toast */}
      <AnimatePresence>
        {showMsgToast && (
          <motion.div
            initial={{ opacity: 0, y: -12, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -12, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className="absolute top-20 right-4 md:right-8 z-50 flex items-center gap-3 bg-card border border-primary/30 shadow-2xl shadow-primary/10 rounded-2xl px-5 py-3 cursor-pointer"
            onClick={() => { setShowMsgToast(false); navigate('/messages'); }}
          >
            <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center shrink-0">
              <MessageSquare className="h-4 w-4 text-primary" />
            </div>
            <div>
              <p className="text-xs font-black uppercase tracking-widest leading-none">Nuevo mensaje</p>
              <p className="text-[10px] text-muted-foreground font-medium mt-0.5">{unreadCount} sin leer · Clic para abrir</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Login Dialog */}
      <Dialog open={isLoginOpen} onOpenChange={(open) => {
        setIsLoginOpen(open);
        if (!open) {
          setTimeout(() => {
            setIsForgotPassword(false);
            setResetSent(false);
            setError(null);
            setEmail('');
            setPassword('');
          }, 300);
        }
      }}>
        <DialogContent className="max-w-lg p-0 overflow-hidden rounded-[2.5rem] border-border bg-card/95 backdrop-blur-2xl shadow-2xl">
          <div className="p-10 md:p-12">
            {isForgotPassword ? (
              <>
                <div className="text-center mb-10">
                  <div className="flex justify-center mb-6">
                    <Logo className="text-4xl" variant="auto" />
                  </div>
                  <h3 className="text-3xl font-semibold tracking-tighter uppercase leading-none">Recuperar Acceso</h3>
                  <p className="text-base text-muted-foreground font-light mt-2">Te enviaremos un enlace para restablecer tu contraseña.</p>
                </div>

                {error && (
                  <div className="mb-6 p-4 rounded-xl bg-destructive/10 text-destructive text-xs font-bold uppercase tracking-widest text-center">
                    {error}
                  </div>
                )}

                {resetSent ? (
                  <div className="text-center space-y-6">
                    <div className="mx-auto w-16 h-16 bg-primary/10 text-primary rounded-full flex items-center justify-center mb-4">
                      <Mail className="h-8 w-8" />
                    </div>
                    <div className="space-y-2">
                      <h4 className="text-xl font-bold uppercase tracking-tighter">Correo Enviado</h4>
                      <p className="text-sm text-muted-foreground font-light">Revisa tu bandeja de entrada (y spam) de {email}.</p>
                    </div>
                    <Button 
                      onClick={() => {
                        setIsForgotPassword(false);
                        setResetSent(false);
                        setError(null);
                      }}
                      variant="outline"
                      className="w-full h-14 rounded-2xl font-bold text-xs shadow-sm group uppercase tracking-widest mt-4"
                    >
                      Volver a iniciar sesión
                    </Button>
                  </div>
                ) : (
                  <form onSubmit={handleResetPassword} className="space-y-6">
                    <div className="space-y-2">
                      <Label htmlFor="reset-email" className="text-xs font-bold uppercase tracking-widest ml-1">Email Profesional</Label>
                      <div className="relative">
                        <Mail className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                        <Input 
                          id="reset-email" 
                          type="email" 
                          required
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          placeholder="nombre@concesionaria.com" 
                          className="h-14 pl-12 rounded-2xl bg-background/50 border-border focus:border-primary/50 transition-all font-bold"
                        />
                      </div>
                    </div>
                    <div className="space-y-4 pt-2">
                      <Button 
                        type="submit"
                        disabled={loading}
                        className="w-full h-14 rounded-2xl font-light text-lg shadow-lg shadow-primary/20 group uppercase tracking-tighter"
                      >
                        {loading ? <Loader2 className="h-6 w-6 animate-spin" /> : (
                          <>
                            ENVIAR CORREO
                            <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
                          </>
                        )}
                      </Button>
                      <Button 
                        type="button"
                        variant="ghost"
                        onClick={() => {
                          setIsForgotPassword(false);
                          setError(null);
                        }}
                        className="w-full h-12 rounded-2xl font-bold text-[10px] text-muted-foreground hover:text-foreground uppercase tracking-widest"
                      >
                        Cancelar y volver
                      </Button>
                    </div>
                  </form>
                )}
              </>
            ) : (
              <>
                <div className="text-center mb-10">
                  <div className="flex justify-center mb-6">
                    <Logo className="text-4xl" variant="auto" />
                  </div>
                  <h3 className="text-3xl font-semibold tracking-tighter uppercase leading-none">Bienvenido</h3>
                  <p className="text-base text-muted-foreground font-light mt-2">Accede a la red B2B más exclusiva.</p>
                </div>

            {error && (
              <div className="mb-6 p-4 rounded-xl bg-destructive/10 text-destructive text-xs font-bold uppercase tracking-widest text-center">
                {error}
              </div>
            )}

            <form onSubmit={handleLogin} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="header-email" className="text-xs font-bold uppercase tracking-widest ml-1">Email Profesional</Label>
                <div className="relative">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                  <Input 
                    id="header-email" 
                    type="email" 
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="nombre@concesionaria.com" 
                    className="h-14 pl-12 rounded-2xl bg-background/50 border-border focus:border-primary/50 transition-all font-bold"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <div className="flex items-center justify-between ml-1">
                  <Label htmlFor="header-password" className="text-xs font-bold uppercase tracking-widest">Contraseña</Label>
                  <button 
                    type="button"
                    onClick={() => {
                      setIsForgotPassword(true);
                      setError(null);
                    }}
                    className="text-[10px] text-muted-foreground hover:text-primary font-bold uppercase tracking-widest transition-colors"
                  >
                    ¿Olvidaste tu contraseña?
                  </button>
                </div>
                <div className="relative">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                  <Input 
                    id="header-password" 
                    type="password" 
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••" 
                    className="h-14 pl-12 rounded-2xl bg-background/50 border-border focus:border-primary/50 transition-all font-bold"
                  />
                </div>
              </div>
              <Button 
                type="submit"
                disabled={loading}
                className="w-full h-14 rounded-2xl font-light text-lg shadow-lg shadow-primary/20 group uppercase tracking-tighter"
              >
                {loading ? <Loader2 className="h-6 w-6 animate-spin" /> : (
                  <>
                    INGRESAR
                    <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
                  </>
                )}
              </Button>
            </form>

            <div className="mt-8 text-center">
              <div className="flex items-center justify-center gap-2 text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground/50">
                <ShieldCheck className="h-3 w-3" />
                PLATAFORMA EXCLUSIVA B2B
              </div>
            </div>
              </>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </header>
    </>
  );
}
