import React, { useState, useEffect, MouseEvent } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { 
  Car, 
  MessageSquare, 
  LayoutDashboard, 
  Menu, 
  X, 
  Plus, 
  Moon, 
  Sun,
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
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogDescription 
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { signInWithEmailAndPassword, onAuthStateChanged, signOut, User as FirebaseUser } from 'firebase/auth';
import { auth, db, handleFirestoreError, OperationType } from '@/src/lib/firebase';
import { loginDemoUser } from '@/src/lib/auth';
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

export function Header() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isLoginOpen, setIsLoginOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [user, setUser] = useState<FirebaseUser | null>(null);
  const [userProfile, setUserProfile] = useState<any>(null);

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

  const handleLogout = async () => {
    await signOut(auth);
    navigate('/');
  };

  const [isDark, setIsDark] = useState(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('theme');
      if (saved) return saved === 'dark';
      return true; // Default to dark mode
    }
    return true;
  });
  const location = useLocation();
  const navigate = useNavigate();

  const isLanding = location.pathname === '/';

  useEffect(() => {
    if (isDark) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  }, [isDark]);

  const navItems = [
    { name: 'Inicio', path: '/', icon: LayoutDashboard },
    { name: 'Marketplace', path: '/marketplace', icon: Car },
    { name: 'Mensajes', path: '/messages', icon: MessageSquare, badge: 3 },
  ];

  const handleNavClick = (path: string, e: MouseEvent) => {
    if (isLanding && path !== '/') {
      e.preventDefault();
      setIsLoginOpen(true);
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const emailLower = email.toLowerCase();
    const isDemoAccount =
      (emailLower === 'demo@reven.com.ar' && password === 'DEMO1234') ||
      (emailLower === 'vendedor.test@reven.com.ar' && password === 'REVEN2026') ||
      (emailLower === 'comprador.test@reven.com.ar' && password === 'REVEN2026');

    try {
      if (isDemoAccount) {
        const type = emailLower.includes('vendedor') ? 'vendedor' : emailLower.includes('comprador') ? 'comprador' : 'demo';
        await loginDemoUser(type);
      } else {
        await signInWithEmailAndPassword(auth, email, password);
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

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 transition-colors duration-300">
      <div className="container mx-auto flex h-20 items-center justify-between px-4 md:px-8">
        <div className="flex items-center gap-12">
          <Link to="/" className="flex items-center space-x-2 group">
            <Logo className="text-4xl" variant="auto" />
          </Link>

          <nav className="hidden md:flex items-center gap-8">
            {navItems.map((item) => (
              <Link
                key={item.name}
                to={item.path}
                onClick={(e) => handleNavClick(item.path, e)}
                className={`flex items-center gap-2 text-sm font-bold uppercase tracking-widest transition-colors hover:text-primary ${
                  location.pathname === item.path ? 'text-primary' : 'text-muted-foreground'
                }`}
              >
                <item.icon className="h-4 w-4" />
                {item.name}
                {item.badge && !isLanding && (
                  <span className="flex h-4 w-4 items-center justify-center rounded-full bg-primary text-[10px] text-primary-foreground font-bold">
                    {item.badge}
                  </span>
                )}
              </Link>
            ))}
          </nav>
        </div>

        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setIsDark(!isDark)}
            className="rounded-full w-10 h-10 border border-border"
          >
            {isDark ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
          </Button>

          <div className="hidden md:flex items-center gap-4">
            {user ? (
              <>
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="rounded-full h-11 w-11 hover:bg-primary/10 text-muted-foreground hover:text-primary transition-colors"
                  onClick={() => navigate('/messages')}
                >
                  <MessageSquare className="h-5 w-5" />
                </Button>
                
                <DropdownMenu>
                  <DropdownMenuTrigger className="relative h-11 flex items-center gap-3 px-2 rounded-2xl hover:bg-primary/5 border border-transparent hover:border-primary/20 transition-all bg-transparent outline-none cursor-pointer">
                      <Avatar className="h-8 w-8 border-2 border-primary/20">
                        <AvatarImage src={userProfile?.avatarUrl} />
                        <AvatarFallback className="bg-primary/10 text-primary font-bold text-xs">
                          {userProfile?.name?.[0] || user?.email?.[0]?.toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex flex-col items-start text-left">
                        <span className="text-[10px] font-black uppercase tracking-tighter leading-none">{userProfile?.name} {userProfile?.lastName}</span>
                        <span className="text-[8px] text-muted-foreground font-bold uppercase tracking-widest mt-0.5">{userProfile?.company || 'Concesionaria'}</span>
                      </div>
                      <ChevronDown className="h-3 w-3 text-muted-foreground" />
                  </DropdownMenuTrigger>
                  <DropdownMenuContent className="w-56 rounded-2xl p-2" align="end">
                    <DropdownMenuGroup>
                      <DropdownMenuLabel className="font-bold uppercase tracking-widest text-[10px] px-3 py-2">Mi Cuenta</DropdownMenuLabel>
                    </DropdownMenuGroup>
                    <DropdownMenuSeparator />
                    {userProfile?.role === 'ADMIN' && (
                      <>
                        <DropdownMenuItem
                          className="rounded-xl font-bold uppercase tracking-widest text-[10px] px-3 py-2 cursor-pointer text-primary focus:text-primary"
                          onClick={() => navigate('/admin')}
                        >
                          <Shield className="mr-2 h-4 w-4" />
                          Panel Admin
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                      </>
                    )}
                    <DropdownMenuItem 
                      className="rounded-xl font-bold uppercase tracking-widest text-[10px] px-3 py-2 cursor-pointer"
                      onClick={() => navigate('/profile')}
                    >
                      <User className="mr-2 h-4 w-4" />
                      Perfil
                    </DropdownMenuItem>
                    <DropdownMenuItem 
                      className="rounded-xl font-bold uppercase tracking-widest text-[10px] px-3 py-2 cursor-pointer"
                      onClick={() => navigate('/profile')}
                    >
                      <Building2 className="mr-2 h-4 w-4" />
                      Mi Concesionaria
                    </DropdownMenuItem>
                    <DropdownMenuItem className="rounded-xl font-bold uppercase tracking-widest text-[10px] px-3 py-2 cursor-pointer">
                      <ShoppingBag className="mr-2 h-4 w-4" />
                      Últimas Compras
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem 
                      onClick={handleLogout}
                      className="rounded-xl font-bold uppercase tracking-widest text-[10px] px-3 py-2 cursor-pointer text-destructive focus:text-destructive"
                    >
                      <LogOut className="mr-2 h-4 w-4" />
                      Cerrar Sesión
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>

                <Button 
                  className="rounded-full px-6 font-bold uppercase tracking-widest text-xs h-11 shadow-lg shadow-primary/20 group"
                  onClick={() => navigate('/publish')}
                >
                  PUBLICAR
                  <Plus className="ml-2 h-4 w-4 group-hover:rotate-90 transition-transform" />
                </Button>
              </>
            ) : (
              <>
                <Button 
                  variant="outline" 
                  className="rounded-2xl px-6 font-bold uppercase tracking-widest text-xs h-11 border-border hover:bg-primary/10 hover:text-primary transition-all"
                  onClick={() => setIsLoginOpen(true)}
                >
                  <User className="mr-2 h-4 w-4" />
                  INGRESAR
                </Button>
                <Button
                  className="rounded-full px-6 font-bold uppercase tracking-widest text-xs h-11 shadow-lg shadow-primary/20 group"
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
            className="md:hidden border-t border-border bg-background overflow-hidden"
          >
            <div className="container mx-auto py-4 px-4 space-y-1">
              {/* Nav links */}
              {navItems.map((item) => (
                <Link
                  key={item.name}
                  to={item.path}
                  onClick={(e) => { handleNavClick(item.path, e); setIsMenuOpen(false); }}
                  className={`flex items-center gap-3 font-bold uppercase tracking-widest text-xs px-4 py-3 rounded-xl transition-colors ${
                    location.pathname === item.path
                      ? 'text-primary bg-primary/5'
                      : 'text-muted-foreground hover:text-foreground hover:bg-white/5'
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
                        <AvatarImage src={userProfile?.avatarUrl} />
                        <AvatarFallback className="bg-primary/10 text-primary font-bold text-xs">
                          {userProfile?.name?.[0] || user.email?.[0]?.toUpperCase()}
                          {userProfile?.lastName?.[0]}
                        </AvatarFallback>
                      </Avatar>
                      <div className="min-w-0">
                        <p className="font-black uppercase tracking-tight text-sm leading-none truncate">
                          {userProfile?.name} {userProfile?.lastName}
                        </p>
                        <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-widest mt-0.5 truncate">
                          {userProfile?.company || user.email}
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
                      className="flex items-center gap-3 w-full text-left font-bold uppercase tracking-widest text-xs px-4 py-3 rounded-xl text-muted-foreground hover:text-foreground hover:bg-white/5 transition-colors"
                    >
                      <User className="h-4 w-4" /> Perfil
                    </button>

                    <button
                      onClick={() => { navigate('/profile'); setIsMenuOpen(false); }}
                      className="flex items-center gap-3 w-full text-left font-bold uppercase tracking-widest text-xs px-4 py-3 rounded-xl text-muted-foreground hover:text-foreground hover:bg-white/5 transition-colors"
                    >
                      <Building2 className="h-4 w-4" /> Mi Concesionaria
                    </button>

                    <button
                      onClick={() => { navigate('/publish'); setIsMenuOpen(false); }}
                      className="flex items-center gap-3 w-full text-left font-bold uppercase tracking-widest text-xs px-4 py-3 rounded-xl text-muted-foreground hover:text-foreground hover:bg-white/5 transition-colors"
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

      {/* Login Dialog */}
      <Dialog open={isLoginOpen} onOpenChange={setIsLoginOpen}>
        <DialogContent className="max-w-lg p-0 overflow-hidden rounded-[2.5rem] border-border bg-card/95 backdrop-blur-2xl shadow-2xl">
          <div className="p-10 md:p-12">
            <div className="text-center mb-10">
              <div className="flex justify-center mb-6">
                <Logo className="text-4xl" variant="auto" />
              </div>
              <h3 className="text-3xl font-bold tracking-tighter uppercase leading-none">Bienvenido</h3>
              <p className="text-base text-muted-foreground font-medium mt-2">Accede a la red B2B más exclusiva.</p>
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
                className="w-full h-14 rounded-2xl font-bold text-lg shadow-lg shadow-primary/20 group uppercase tracking-tighter"
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
          </div>
        </DialogContent>
      </Dialog>
    </header>
  );
}
