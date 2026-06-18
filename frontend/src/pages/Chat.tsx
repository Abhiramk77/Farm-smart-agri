import React, { useState, useEffect } from 'react';
import {
  Search,
  Send,
  Phone,
  Video,
  MoreVertical,
  ArrowLeft,
  Loader2,
  MessageSquare,
  Info,
  User,
  Store
} from 'lucide-react';
import { chatService, ChatThread } from '../api/services';

export function Chat() {
  const [activeChat, setActiveChat] = useState<string | null>(null);
  const [message, setMessage] = useState('');
  const [chats, setChats] = useState<ChatThread[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sentMessages, setSentMessages] = useState<string[]>([]);

  const handleSend = () => {
    if (!message.trim()) return;
    setSentMessages([...sentMessages, message]);
    setMessage('');
  };

  useEffect(() => {
    chatService.getChats()
      .then(data => setChats(data))
      .catch(err => {
        console.error('Failed to fetch chats', err);
        setError('Could not load messages.');
        setChats([]);
      })
      .finally(() => setIsLoading(false));
  }, []);

  const chat = chats.find((c) => c.id === activeChat);

  return (
    <div className="h-[calc(100vh-4rem)] md:h-[calc(100vh-4rem)] flex bg-white overflow-hidden">
      {/* Chat List (Sidebar) */}
      <div
        className={`${activeChat ? 'hidden md:flex' : 'flex'} w-full md:w-80 lg:w-96 flex-col border-r border-gray-200`}>
        
        <div className="p-4 border-b border-gray-100">
          <h1 className="text-xl font-bold text-gray-900 mb-3">Messages</h1>

          {/* Direct forwarding info banner */}
          <div className="flex items-start gap-2 bg-green-50 border border-green-200 rounded-xl p-3 mb-3">
            <svg className="shrink-0 mt-0.5 text-green-600" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14M13 6l6 6-6 6"/></svg>
            <p className="text-xs text-green-700 font-medium leading-relaxed">
              Messages are <span className="font-bold">forwarded directly</span> — Farmer ↔ Buyer, no middleman.
            </p>
          </div>

          <div className="relative">
            <Search
              className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
              size={18} />
            <input
              type="text"
              placeholder="Search messages..."
              className="w-full pl-10 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:border-primary text-sm" />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto">
          {isLoading ? (
            <div className="flex justify-center p-8">
              <Loader2 className="w-6 h-6 text-primary animate-spin" />
            </div>
          ) : error ? (
            <div className="p-4 text-center text-red-500 text-sm">
              {error}
            </div>
          ) : chats.length === 0 ? (
            <div className="p-8 text-center text-gray-500 text-sm">
              No conversations yet.
            </div>
          ) : (
            chats.map((c) =>
            <div
              key={c.id}
              onClick={() => setActiveChat(c.id)}
              className={`p-4 border-b border-gray-50 flex items-center gap-3 cursor-pointer transition-colors ${activeChat === c.id ? 'bg-primary/5' : 'hover:bg-gray-50'}`}>
              
                <div className="relative">
                  <img
                  src={c.avatar}
                  alt={c.name}
                  className="w-12 h-12 rounded-full object-cover" />
                
                  {c.unread > 0 &&
                <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs font-bold flex items-center justify-center rounded-full border-2 border-white">
                      {c.unread}
                    </span>
                }
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex justify-between items-center mb-1">
                    <div className="flex items-center gap-1.5">
                      <h3 className="font-semibold text-gray-900 truncate text-sm">{c.name}</h3>
                      <span className="shrink-0 text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-amber-100 text-amber-700 uppercase tracking-wide">Farmer</span>
                    </div>
                    <span className="text-xs text-gray-500 shrink-0">{c.time}</span>
                  </div>
                  <p className={`text-sm truncate ${c.unread > 0 ? 'text-gray-900 font-medium' : 'text-gray-500'}`}>
                    {c.lastMessage}
                  </p>
                </div>
              </div>
            )
          )}
        </div>
      </div>

      {/* Chat Detail */}
      {activeChat ?
      <div className="flex-1 flex flex-col bg-gray-50 h-full">
          {/* Chat Header */}
          <div className="h-16 px-4 bg-white border-b border-gray-200 flex items-center justify-between shrink-0">
            <div className="flex items-center gap-3">
              <button
              onClick={() => setActiveChat(null)}
              className="md:hidden text-gray-500 hover:text-gray-900">
              
                <ArrowLeft size={20} />
              </button>
              <img
              src={chat?.avatar}
              alt={chat?.name}
              className="w-10 h-10 rounded-full object-cover" />
            
              <div>
                <h2 className="font-bold text-gray-900">{chat?.name}</h2>
                <p className="text-xs text-green-500 font-medium">Online</p>
              </div>
            </div>
            <div className="flex items-center gap-4 text-gray-500">
              <Phone size={20} className="cursor-pointer hover:text-primary" />
              <Video size={20} className="cursor-pointer hover:text-primary" />
              <MoreVertical
              size={20}
              className="cursor-pointer hover:text-primary" />
            
            </div>
          </div>

          {/* Info Banner */}
          <div className="bg-blue-50 border-b border-blue-100 p-3 flex items-start gap-2 text-blue-800 text-xs">
            <Info size={16} className="shrink-0 mt-0.5" />
            <p>This is a direct channel between Farmer and Buyer. All messages are forwarded directly to verify transaction terms.</p>
          </div>

          {/* Messages Area */}
          <div className="flex-1 overflow-y-auto p-4 space-y-6">
            <div className="text-center text-xs text-gray-400 my-4">Today</div>

            <div className="flex flex-col items-start gap-1">
              <div className="flex items-center gap-1.5 text-xs text-gray-500 ml-1">
                <Store size={12} />
                <span className="font-semibold uppercase tracking-wider">Farmer</span>
              </div>
              <div className="bg-white border border-gray-100 text-gray-800 py-3 px-4 rounded-2xl rounded-tl-sm max-w-[80%] shadow-sm">
                Hello! I saw your tomato contract. Is the price negotiable?
                <div className="text-[10px] text-gray-400 mt-1 text-right">10:25 AM</div>
              </div>
            </div>

            <div className="flex flex-col items-end gap-1">
              <div className="flex items-center gap-1.5 text-xs text-gray-500 mr-1">
                <span className="font-semibold uppercase tracking-wider">Buyer</span>
                <User size={12} />
              </div>
              <div className="bg-primary text-white py-3 px-4 rounded-2xl rounded-tr-sm max-w-[80%] shadow-sm">
                Hi there. We can discuss it. What quantity are you looking to provide?
                <div className="text-[10px] text-white/70 mt-1 text-right">10:28 AM</div>
              </div>
            </div>

            {sentMessages.map((msg, i) => (
              <div key={i} className="flex flex-col items-end gap-1">
                <div className="flex items-center gap-1.5 text-xs text-gray-500 mr-1">
                  <span className="font-semibold uppercase tracking-wider">You → forwarded to Farmer</span>
                  <User size={12} />
                </div>
                <div className="bg-primary text-white py-3 px-4 rounded-2xl rounded-tr-sm max-w-[80%] shadow-sm">
                  {msg}
                  <div className="text-[10px] text-white/70 mt-1 text-right">
                    {new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Input Area */}
          <div className="p-4 bg-white border-t border-gray-200 shrink-0 mb-safe">
            <p className="text-[11px] text-center text-gray-400 mb-2 font-medium">
              ✉️ Your message will be <span className="text-green-600 font-semibold">forwarded directly</span> to the Farmer
            </p>
            <div className="flex items-center gap-2 bg-gray-50 border border-gray-200 rounded-full p-1 pl-4">
              <input
              type="text"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSend()}
              placeholder="Type a message to Farmer..."
              className="flex-1 bg-transparent outline-none text-sm" />
              <button onClick={handleSend} className="w-10 h-10 bg-primary text-white rounded-full flex items-center justify-center shrink-0 hover:bg-primary-dark transition-colors">
                <Send size={18} className="ml-1" />
              </button>
            </div>
          </div>
        </div> :

      <div className="hidden md:flex flex-1 flex-col items-center justify-center bg-gray-50 text-gray-400">
          <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mb-4">
            <MessageSquare size={32} />
          </div>
          <p className="text-lg font-medium">Select a chat to start messaging</p>
          <p className="text-sm mt-2 text-gray-400">Messages are forwarded directly between Farmer and Buyer</p>
        </div>
      }
    </div>
  );
}