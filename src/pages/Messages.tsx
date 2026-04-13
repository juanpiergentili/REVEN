
import React, { useState } from 'react';
import { Search, MessageSquare, Car as CarIcon, Send, Paperclip, ChevronLeft } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { motion, AnimatePresence } from 'motion/react';
import { useNavigate } from 'react-router-dom';

const MOCK_CONVERSATIONS = [
  {
    id: '1',
    user: {
      name: 'Juan Pérez',
      avatar: 'https://picsum.photos/seed/u1/100/100',
      dealer: 'Concesionaria Norte'
    },
    lastMessage: '¿Sigue disponible la Hilux?',
    time: '10:30',
    unread: true,
    vehicle: {
      name: 'Toyota Hilux 2023',
      price: 48500,
      photo: 'https://images.unsplash.com/photo-1559416523-140ddc3d238c?auto=format&fit=crop&q=80&w=200'
    }
  },
  {
    id: '2',
    user: {
      name: 'Matias',
      avatar: 'https://picsum.photos/seed/u2/100/100',
      dealer: 'Sport Cars'
    },
    lastMessage: 'Te mando la documentación por mail.',
    time: 'Ayer',
    unread: false,
    vehicle: {
      name: 'VW Amarok 2024',
      price: 58500,
      photo: 'https://images.unsplash.com/photo-1606577924006-27d39b132ee6?auto=format&fit=crop&q=80&w=200'
    }
  },
  {
    id: '3',
    user: {
      name: 'Laura',
      avatar: 'https://picsum.photos/seed/u3/100/100',
      dealer: 'Auto Premium'
    },
    lastMessage: '¿Aceptás permuta por menor valor?',
    time: 'Lunes',
    unread: false,
    vehicle: {
      name: 'Ford Ranger 2023',
      price: 52000,
      photo: 'https://images.unsplash.com/photo-1533473359331-0135ef1b58bf?auto=format&fit=crop&q=80&w=200'
    }
  }
];

const MOCK_MESSAGES = [
  { id: '1', senderId: 'other', text: 'Hola! ¿Sigue disponible la Hilux? Me interesa para un cliente.', timestamp: '10:25' },
  { id: '2', senderId: 'me', text: 'Hola Juan! Sí, todavía la tengo. Está impecable, si querés podés venir a verla mañana.', timestamp: '10:28' },
  { id: '3', senderId: 'other', text: 'Dale, tipo 10hs te parece bien?', timestamp: '10:30' },
];

export function Messages() {
  const [selectedId, setSelectedId] = useState('1');
  const [chatMessages, setChatMessages] = useState<{ [key: string]: typeof MOCK_MESSAGES }>({
    '1': MOCK_MESSAGES,
    '2': [
      { id: '2-1', senderId: 'other', text: 'Hola, me interesa la Amarok.', timestamp: '09:00' }
    ],
    '3': [
      { id: '3-1', senderId: 'other', text: '¿Aceptás permuta?', timestamp: 'Lunes' }
    ]
  });
  const [newMessage, setNewMessage] = useState('');
  const navigate = useNavigate();

  const currentChat = MOCK_CONVERSATIONS.find(c => c.id === selectedId);
  const messages = chatMessages[selectedId] || [];

  const handleSendMessage = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!newMessage.trim()) return;

    const msg = {
      id: Date.now().toString(),
      senderId: 'me',
      text: newMessage,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setChatMessages(prev => ({
      ...prev,
      [selectedId]: [...(prev[selectedId] || []), msg]
    }));
    setNewMessage('');
  };

  return (
    <div className="container max-w-7xl h-[calc(100vh-8rem)] py-8 px-4 md:px-8">
      <div className="mb-6">
        <Button 
          variant="ghost" 
          size="sm" 
          onClick={() => navigate('/marketplace')}
          className="rounded-full font-bold uppercase tracking-widest text-[10px] gap-2 hover:bg-white/10"
        >
          <ChevronLeft className="h-4 w-4" />
          Volver al Marketplace
        </Button>
      </div>
      <div className="flex h-full gap-8">
        {/* Sidebar */}
        <div className="hidden lg:flex flex-col w-96 shrink-0 bg-white/5 backdrop-blur-xl border border-white/5 rounded-[2.5rem] overflow-hidden shadow-2xl">
          <div className="p-8 border-b border-white/5 space-y-6">
            <h2 className="text-2xl font-bold tracking-tighter uppercase">Mensajes</h2>
            <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
              <Input 
                placeholder="Buscar chats..." 
                className="h-12 pl-12 rounded-2xl bg-white/5 border-white/10 focus:border-primary/50 transition-all font-bold" 
              />
            </div>
          </div>
          <ScrollArea className="flex-1">
            <div className="p-4 space-y-2">
              {MOCK_CONVERSATIONS.map((chat) => (
                <button
                  key={chat.id}
                  onClick={() => setSelectedId(chat.id)}
                  className={`w-full flex items-center gap-4 p-4 rounded-[1.5rem] transition-all duration-300 group ${
                    selectedId === chat.id 
                      ? 'bg-primary text-primary-foreground shadow-lg shadow-primary/20' 
                      : 'hover:bg-white/5 text-muted-foreground hover:text-foreground'
                  }`}
                >
                  <div className="relative">
                    <Avatar className="h-14 w-14 border-2 border-white/10">
                      <AvatarImage src={chat.user.avatar} />
                      <AvatarFallback className="font-bold">{chat.user.name.substring(0, 2).toUpperCase()}</AvatarFallback>
                    </Avatar>
                    {chat.unread && (
                      <span className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-white text-primary text-[10px] font-bold shadow-lg">
                        1
                      </span>
                    )}
                  </div>
                  <div className="flex-1 text-left overflow-hidden">
                    <div className="flex justify-between items-baseline mb-1">
                      <span className="font-bold tracking-tighter uppercase truncate">{chat.user.name}</span>
                      <span className={`text-[10px] font-bold uppercase tracking-widest ${selectedId === chat.id ? 'text-primary-foreground/70' : 'text-muted-foreground'}`}>
                        {chat.time}
                      </span>
                    </div>
                    <p className={`text-xs truncate font-medium ${selectedId === chat.id ? 'text-primary-foreground/80' : 'text-muted-foreground'}`}>
                      {chat.lastMessage}
                    </p>
                    <div className="flex items-center gap-1 mt-1">
                      <CarIcon className={`h-3 w-3 ${selectedId === chat.id ? 'text-primary-foreground/60' : 'text-primary'}`} />
                      <span className={`text-[10px] font-bold uppercase tracking-tighter truncate ${selectedId === chat.id ? 'text-primary-foreground/60' : 'text-muted-foreground'}`}>
                        {chat.vehicle.name}
                      </span>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </ScrollArea>
        </div>

        {/* Chat Area */}
        <div className="flex-1 flex flex-col bg-white/5 backdrop-blur-xl border border-white/5 rounded-[2.5rem] overflow-hidden shadow-2xl relative">
          <AnimatePresence mode="wait">
            {currentChat ? (
              <motion.div 
                key={currentChat.id}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="flex flex-col h-full"
              >
                {/* Chat Header */}
                <div className="p-6 md:p-8 border-b border-white/5 flex items-center justify-between bg-white/5">
                  <div className="flex items-center gap-4">
                    <Button variant="ghost" size="icon" className="lg:hidden h-10 w-10 rounded-full">
                      <ChevronLeft className="h-6 w-6" />
                    </Button>
                    <Avatar className="h-12 w-12 border-2 border-white/10">
                      <AvatarImage src={currentChat.user.avatar} />
                      <AvatarFallback className="font-bold">{currentChat.user.name.substring(0, 2).toUpperCase()}</AvatarFallback>
                    </Avatar>
                    <div>
                      <h3 className="font-bold tracking-tighter uppercase text-lg leading-none">{currentChat.user.name}</h3>
                      <p className="text-[10px] font-bold uppercase tracking-widest text-primary mt-1">{currentChat.user.dealer}</p>
                    </div>
                  </div>
                  <div className="hidden sm:flex items-center gap-4 p-3 pr-6 rounded-2xl bg-white/5 border border-white/5">
                    <img 
                      src={currentChat.vehicle.photo} 
                      alt="Vehicle" 
                      className="h-10 w-14 object-cover rounded-lg border border-white/10"
                      referrerPolicy="no-referrer"
                    />
                    <div>
                      <p className="text-[10px] font-bold uppercase tracking-tighter leading-none">
                        {currentChat.vehicle.name}
                      </p>
                      <p className="text-xs font-bold tracking-tighter text-primary mt-0.5">
                        USD {currentChat.vehicle.price.toLocaleString('es-AR')}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Messages */}
                <ScrollArea className="flex-1 p-6 md:p-8">
                  <div className="space-y-6">
                    {messages.map((msg) => (
                      <div
                        key={msg.id}
                        className={`flex ${msg.senderId === 'me' ? 'justify-end' : 'justify-start'}`}
                      >
                        <div
                          className={`max-w-[80%] p-5 rounded-[1.5rem] shadow-lg ${
                            msg.senderId === 'me'
                              ? 'bg-primary text-primary-foreground rounded-tr-none shadow-primary/10'
                              : 'bg-white/5 text-foreground rounded-tl-none border border-white/5'
                          }`}
                        >
                          <p className="text-sm font-medium leading-relaxed">{msg.text}</p>
                          <p className={`text-[10px] font-bold uppercase tracking-widest mt-2 text-right ${
                            msg.senderId === 'me' ? 'text-primary-foreground/60' : 'text-muted-foreground'
                          }`}>
                            {msg.timestamp}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </ScrollArea>

                {/* Input Area */}
                <form 
                  className="p-6 md:p-8 bg-white/5 border-t border-white/5"
                  onSubmit={handleSendMessage}
                >
                  <div className="flex gap-4 items-center">
                    <Button type="button" variant="ghost" size="icon" className="h-12 w-12 rounded-full hover:bg-white/10 shrink-0">
                      <Paperclip className="h-5 w-5 text-muted-foreground" />
                    </Button>
                    <div className="relative flex-1">
                      <Input
                        placeholder="Escribí tu mensaje..."
                        className="h-14 rounded-full bg-white/5 border-white/10 focus:border-primary/50 transition-all px-6 font-medium"
                        value={newMessage}
                        onChange={(e) => setNewMessage(e.target.value)}
                      />
                    </div>
                    <Button type="submit" className="h-14 w-14 rounded-full shadow-lg shadow-primary/20 shrink-0">
                      <Send className="h-5 w-5 stroke-[3]" />
                    </Button>
                  </div>
                </form>
              </motion.div>
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center text-muted-foreground space-y-4">
                <div className="bg-white/5 p-8 rounded-full">
                  <MessageSquare className="h-16 w-16 opacity-20" />
                </div>
                <p className="font-bold tracking-tighter uppercase text-xl">Seleccioná una conversación</p>
              </div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
