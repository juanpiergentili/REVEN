import React, { useState, useEffect, useRef } from 'react';
import { Send, Search, ChevronLeft, Clock, Check, CheckCheck, ArrowLeft, MessageCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth, db } from '@/src/lib/firebase';
import {
  subscribeToConversations, subscribeToMessages,
  sendMessage, findOrCreateConversation, markMessagesAsRead,
  ConversationData, MessageData,
} from '@/src/lib/chat';
import { Timestamp, collection, getDocs } from 'firebase/firestore';
import { motion, AnimatePresence } from 'motion/react';

function formatTime(ts: Timestamp | undefined): string {
  if (!ts) return '';
  const date = ts.toDate();
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  if (diff < 60000) return 'Ahora';
  if (diff < 3600000) return `hace ${Math.floor(diff / 60000)}m`;
  if (diff < 86400000) return `hace ${Math.floor(diff / 3600000)}h`;
  return date.toLocaleDateString('es-AR', { day: '2-digit', month: 'short' });
}

export function Messages() {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [conversations, setConversations] = useState<(ConversationData & { id: string })[]>([]);
  const [selectedConvoId, setSelectedConvoId] = useState<string | null>(null);
  const [messages, setMessages] = useState<(MessageData & { id: string })[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [initError, setInitError] = useState<string | null>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);

  const currentUserId = user?.uid;
  const currentUserName = user?.displayName || 'Usuario';

  const convoId = searchParams.get('conversation');
  const targetUserId = searchParams.get('userId');
  const targetUserName = searchParams.get('userName');
  const targetCompany = searchParams.get('company');
  const vehicleId = searchParams.get('vehicleId');

  // Handle deep link from vehicle detail or colleague contact
  useEffect(() => {
    if (authLoading) return; // Wait for auth to initialize

    if (convoId) {
      setSelectedConvoId(convoId);
      return;
    }

    if (targetUserId && targetUserName && currentUserId) {
      const initConvo = async () => {
        try {
          const id = await findOrCreateConversation({
            buyerId: currentUserId,
            sellerId: targetUserId,
            buyerName: currentUserName,
            sellerName: targetUserName,
            buyerCompany: currentUserName,
            sellerCompany: targetCompany || targetUserName,
            vehicleId: vehicleId || undefined,
          });
          setSelectedConvoId(id);

          // Pre-fill first message when coming from "Contactar Vendedor"
          if (vehicleId) {
            const snapshot = await getDocs(collection(db, 'conversations', id, 'messages'));
            if (snapshot.docs.length === 0) {
              setNewMessage('Me interesa este vehículo');
            }
          }
        } catch (error: any) {
          console.error("Error creating conversation:", error);
          setInitError(error.message || "Error desconocido");
        }
      };
      initConvo();
    }
  }, [convoId, targetUserId, targetUserName, targetCompany, vehicleId, currentUserId, currentUserName, authLoading]);

  // Subscribe to conversations
  useEffect(() => {
    if (!currentUserId) return;
    const unsub = subscribeToConversations(currentUserId, (convos) => {
      setConversations(convos);
      setLoading(false);
      setInitError(null); // Clear errors on success
    }, (err: any) => {
      setInitError("Error cargando chats: " + (err.message || err.toString()));
      setLoading(false);
    });
    return unsub;
  }, [currentUserId]);

  // Subscribe to messages when a conversation is selected
  useEffect(() => {
    if (!selectedConvoId) return;
    const unsub = subscribeToMessages(selectedConvoId, (msgs) => {
      setMessages(msgs);
      setTimeout(() => {
        const el = messagesContainerRef.current;
        if (el) el.scrollTop = el.scrollHeight;
      }, 100);
    });
    markMessagesAsRead(selectedConvoId, currentUserId);
    return unsub;
  }, [selectedConvoId, currentUserId]);

  const handleSend = async () => {
    if (!newMessage.trim() || !selectedConvoId) return;
    const msg = newMessage.trim();
    setNewMessage('');
    await sendMessage(selectedConvoId, currentUserId, msg);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const selectedConvo = conversations.find(c => c.id === selectedConvoId);

  const getDisplayName = (convo: ConversationData) => {
    return convo.buyerId === currentUserId ? convo.sellerName : convo.buyerName;
  };

  const getDisplayCompany = (convo: ConversationData) => {
    return convo.buyerId === currentUserId ? convo.sellerCompany : convo.buyerCompany;
  };

  const filteredConversations = conversations.filter(c => {
    if (!searchQuery) return true;
    const name = getDisplayName(c).toLowerCase();
    const company = getDisplayCompany(c).toLowerCase();
    return name.includes(searchQuery.toLowerCase()) || company.includes(searchQuery.toLowerCase());
  });

  return (
    <div className="h-dvh flex flex-col bg-background">
      {/* Header */}
      <div className="border-b border-white/5 bg-background/80 backdrop-blur-xl px-6 py-4 flex items-center gap-4">
        <Button variant="ghost" size="icon" className="rounded-full" onClick={() => navigate(-1)}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <h1 className="text-2xl font-bold tracking-tighter uppercase">Mensajes</h1>
        <Badge className="bg-primary/20 text-primary border-none font-bold text-[10px] rounded-full px-3">
          {conversations.length}
        </Badge>
      </div>

      <div className="flex flex-1 min-h-0 overflow-hidden">
        {/* Conversation List */}
        <aside className={`w-full md:w-96 border-r border-white/5 flex flex-col min-h-0 ${selectedConvoId ? 'hidden md:flex' : 'flex'}`}>
          <div className="p-4 shrink-0">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar conversación..."
                className="pl-10 h-11 rounded-2xl bg-white/5 border-white/10"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
              />
            </div>
          </div>
          <div className="flex-1 overflow-y-auto">
            {loading ? (
              <div className="flex items-center justify-center py-20 text-muted-foreground">
                <Clock className="h-5 w-5 animate-spin mr-2" /> Cargando...
              </div>
            ) : filteredConversations.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20 px-6 text-center space-y-4">
                <div className="bg-white/5 p-6 rounded-full">
                  <MessageCircle className="h-10 w-10 text-muted-foreground opacity-30" />
                </div>
                <div className="space-y-1">
                  <h3 className="font-bold tracking-tighter uppercase">Sin conversaciones</h3>
                  <p className="text-xs text-muted-foreground">Contactá a un colega desde el marketplace para iniciar un chat.</p>
                </div>
                <Button variant="outline" className="rounded-2xl text-[10px] font-bold uppercase tracking-widest" onClick={() => navigate('/marketplace')}>
                  Ir al Marketplace
                </Button>
              </div>
            ) : (
              filteredConversations.map(convo => (
                <button
                  key={convo.id}
                  onClick={() => setSelectedConvoId(convo.id)}
                  className={`w-full flex items-center gap-4 p-4 text-left border-b border-white/5 transition-all hover:bg-white/5 ${selectedConvoId === convo.id ? 'bg-primary/5 border-l-2 border-l-primary' : ''}`}
                >
                  <Avatar className="h-12 w-12 shrink-0 border-2 border-primary/20">
                    <AvatarFallback className="bg-primary/10 text-primary font-bold text-xs">
                      {getDisplayName(convo).split(' ').map(n => n[0]).join('').slice(0, 2)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <h4 className="text-sm font-bold tracking-tighter uppercase truncate">{getDisplayName(convo)}</h4>
                      <span className="text-[10px] text-muted-foreground font-bold shrink-0 ml-2">{formatTime(convo.lastMessageAt)}</span>
                    </div>
                    <p className="text-[10px] text-muted-foreground uppercase tracking-widest font-bold mb-1">{getDisplayCompany(convo)}</p>
                    <p className="text-xs text-muted-foreground truncate">{convo.lastMessage || 'Conversación nueva'}</p>
                    {convo.vehicleInfo && (
                      <Badge variant="outline" className="mt-1 text-[8px] font-bold tracking-wider border-white/10 rounded-full px-2 py-0">
                        {convo.vehicleInfo.brand} {convo.vehicleInfo.model} {convo.vehicleInfo.year}
                      </Badge>
                    )}
                  </div>
                </button>
              ))
            )}
          </div>
        </aside>

        {/* Chat Area */}
        <div className={`flex-1 flex flex-col min-h-0 ${selectedConvoId || initError ? 'flex' : 'hidden md:flex'}`}>
          {initError ? (
            <div className="flex-1 flex items-center justify-center p-8">
              <div className="text-center space-y-4 max-w-md">
                <div className="bg-red-500/10 p-8 rounded-full inline-block">
                  <MessageCircle className="h-12 w-12 text-red-500 opacity-80" />
                </div>
                <h3 className="text-lg font-bold tracking-tighter uppercase text-red-500">Error en el Chat</h3>
                <p className="text-sm text-red-400 font-medium break-words">{initError}</p>
                <Button onClick={() => window.location.reload()} variant="outline" className="mt-4 border-red-500/50 text-red-500 hover:bg-red-500/10">
                  REINTENTAR
                </Button>
              </div>
            </div>
          ) : selectedConvo ? (
            <>
              {/* Chat Header */}
              <div className="p-4 border-b border-white/5 bg-background/50 backdrop-blur-xl flex items-center gap-4">
                <Button variant="ghost" size="icon" className="rounded-full md:hidden" onClick={() => setSelectedConvoId(null)}>
                  <ChevronLeft className="h-5 w-5" />
                </Button>
                <Avatar className="h-10 w-10 border-2 border-primary/20">
                  <AvatarFallback className="bg-primary/10 text-primary font-bold text-xs">
                    {getDisplayName(selectedConvo).split(' ').map(n => n[0]).join('').slice(0, 2)}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <h3 className="font-bold uppercase tracking-tighter text-sm truncate">{getDisplayName(selectedConvo)}</h3>
                  <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-widest">{getDisplayCompany(selectedConvo)}</p>
                </div>
                {selectedConvo.vehicleInfo && (
                  <Badge className="bg-white/5 border-white/10 text-xs font-bold rounded-full px-3 py-1 hidden sm:flex">
                    {selectedConvo.vehicleInfo.brand} {selectedConvo.vehicleInfo.model}
                  </Badge>
                )}
              </div>

              {/* Messages */}
              <div ref={messagesContainerRef} className="flex-1 overflow-y-auto p-6 min-h-0">
                <div className="max-w-3xl mx-auto space-y-4">
                  <AnimatePresence>
                    {messages.map((msg) => {
                      const isMine = msg.senderId === currentUserId;
                      return (
                        <motion.div
                          key={msg.id}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          className={`flex ${isMine ? 'justify-end' : 'justify-start'}`}
                        >
                          <div className={`max-w-[75%] px-5 py-3 rounded-3xl ${isMine ? 'bg-primary text-primary-foreground rounded-br-lg' : 'bg-white/5 rounded-bl-lg'}`}>
                            <p className="text-sm font-medium leading-relaxed break-words">{msg.text}</p>
                            <div className={`flex items-center gap-1 mt-1 ${isMine ? 'justify-end' : ''}`}>
                              <span className="text-[10px] opacity-60">{formatTime(msg.createdAt)}</span>
                              {isMine && (msg.read ? <CheckCheck className="h-3 w-3 opacity-60 text-blue-400" /> : <Check className="h-3 w-3 opacity-60" />)}
                            </div>
                          </div>
                        </motion.div>
                      );
                    })}
                  </AnimatePresence>
                </div>
              </div>

              {/* Input */}
              <div className="p-4 border-t border-white/5 bg-background/50 backdrop-blur-xl">
                <div className="max-w-3xl mx-auto flex items-center gap-3">
                  <Input
                    value={newMessage}
                    onChange={e => setNewMessage(e.target.value)}
                    onKeyDown={handleKeyPress}
                    placeholder="Escribí tu mensaje..."
                    className="flex-1 h-12 rounded-2xl bg-white/5 border-white/10 text-base"
                  />
                  <Button
                    onClick={handleSend}
                    disabled={!newMessage.trim()}
                    size="lg"
                    className="h-12 w-12 rounded-2xl shadow-lg shadow-primary/20"
                  >
                    <Send className="h-5 w-5" />
                  </Button>
                </div>
              </div>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center p-8">
              <div className="text-center space-y-4">
                <div className="bg-white/5 p-8 rounded-full inline-block">
                  <MessageCircle className="h-12 w-12 text-muted-foreground opacity-20" />
                </div>
                <h3 className="text-lg font-bold tracking-tighter uppercase">Seleccioná una conversación</h3>
                <p className="text-sm text-muted-foreground font-medium">Elegí un chat del panel izquierdo para comenzar.</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
