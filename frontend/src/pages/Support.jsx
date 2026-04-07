import { useState, useRef, useEffect } from 'react';
import { Send, User, Mail, Shield, Bot, ExternalLink } from 'lucide-react';
import { sendSupport } from '../utils/api';

export default function Support() {
  const [sessionStarted, setSessionStarted] = useState(false);
  const [userInfo, setUserInfo] = useState({ name: '', email: '' });
  const [messages, setMessages] = useState([
    { id: 1, sender: 'bot', text: 'Welcome to Nomics Support. How can we help you today?', time: new Date() }
  ]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isTyping]);

  const startSession = (e) => {
    e.preventDefault();
    if (userInfo.name && userInfo.email) {
      setSessionStarted(true);
    }
  };

  const sendMessage = async (e) => {
    e.preventDefault();
    if (!input.trim()) return;

    const userMsg = { id: Date.now(), sender: 'user', text: input, time: new Date() };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setIsTyping(true);

    try {
      await sendSupport({
        name: userInfo.name,
        email: userInfo.email,
        session_id: 'local_session',
        message: userMsg.text
      });
      
      // Simulate bot typing delay
      setTimeout(() => {
        setIsTyping(false);
        setMessages(prev => [...prev, {
          id: Date.now() + 1,
          sender: 'bot',
          text: 'We have received your message. A support agent will review it and get back to you shortly.',
          time: new Date()
        }]);
      }, 1000);
    } catch (err) {
      setIsTyping(false);
      setMessages(prev => [...prev, {
        id: Date.now() + 1,
        sender: 'system',
        text: 'Failed to send message. Please try again.',
        time: new Date()
      }]);
    }
  };

  const formatTime = (date) => {
    return new Date(date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className="max-w-4xl mx-auto flex flex-col md:flex-row gap-8 py-4 h-[calc(100vh-140px)]">
      {/* Sidebar Info */}
      <div className="md:w-1/3 flex flex-col gap-6">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">Live Support</h1>
          <p className="text-gray-400 text-sm">Get help with promotions, API access, or account issues.</p>
        </div>

        <div className="bg-[#1a1d2e] border border-[#2d3748] rounded-xl p-5 flex flex-col gap-4">
          <div className="flex items-start gap-3 text-sm">
            <Shield className="w-5 h-5 text-[#7c3aed] shrink-0" />
            <div className="text-gray-300">Support is available 24/7. We typically reply within 10 minutes.</div>
          </div>
          <div className="h-px bg-[#2d3748] w-full my-1"></div>
          <a href="https://t.me/Cariz_bot" target="_blank" rel="noopener noreferrer" className="flex items-center justify-between group hover:bg-[#2d3748] p-3 rounded-lg transition-colors -mx-3 text-sm">
            <div className="flex items-center gap-3 text-gray-300 group-hover:text-white">
              <ExternalLink className="w-5 h-5 text-[#10b981]" />
              <span>Chat on Telegram</span>
            </div>
            <span className="text-xs text-gray-500">Fastest</span>
          </a>
        </div>
      </div>

      {/* Chat Window */}
      <div className="md:w-2/3 flex flex-col bg-[#1a1d2e] border border-[#2d3748] rounded-2xl overflow-hidden h-full shadow-2xl">
        <div className="p-4 bg-[#111827] border-b border-[#2d3748] flex items-center gap-3">
          <div className="w-10 h-10 bg-[#7c3aed]/20 rounded-full flex items-center justify-center border border-[#7c3aed]/50">
            <Bot className="w-5 h-5 text-[#7c3aed]" />
          </div>
          <div>
            <div className="font-semibold text-white">Nomics Assistant</div>
            <div className="text-xs text-[#10b981] flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-[#10b981]"></span> Online
            </div>
          </div>
        </div>

        {!sessionStarted ? (
          <div className="flex-1 flex flex-col items-center justify-center p-8 bg-[#0d0e14]">
            <div className="w-full max-w-sm">
              <h2 className="text-xl font-semibold text-white mb-4 text-center">Start a conversation</h2>
              <form onSubmit={startSession} className="flex flex-col gap-4">
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 w-4 h-4" />
                  <input type="text" value={userInfo.name} onChange={e => setUserInfo({...userInfo, name: e.target.value})} placeholder="Your Name" required className="w-full bg-[#1a1d2e] border border-[#2d3748] rounded-lg py-2.5 pl-10 pr-4 text-white focus:outline-none focus:border-[#7c3aed] text-sm" />
                </div>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 w-4 h-4" />
                  <input type="email" value={userInfo.email} onChange={e => setUserInfo({...userInfo, email: e.target.value})} placeholder="Email Address" required className="w-full bg-[#1a1d2e] border border-[#2d3748] rounded-lg py-2.5 pl-10 pr-4 text-white focus:outline-none focus:border-[#7c3aed] text-sm" />
                </div>
                <button type="submit" className="w-full bg-[#7c3aed] hover:bg-[#8b5cf6] text-white font-medium py-2.5 rounded-lg transition-colors text-sm mt-2">
                  Start Chat
                </button>
              </form>
            </div>
          </div>
        ) : (
          <>
            <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-4 bg-[#0d0e14]">
              {messages.map((msg) => (
                <div key={msg.id} className={`flex flex-col max-w-[80%] ${msg.sender === 'user' ? 'self-end items-end' : 'self-start items-start'}`}>
                  <div className={`px-4 py-2.5 rounded-2xl text-sm ${
                    msg.sender === 'user' ? 'bg-[#7c3aed] text-white rounded-br-none' : 
                    msg.sender === 'system' ? 'bg-red-500/20 text-red-200 border border-red-500/50 rounded-bl-none' :
                    'bg-[#1a1d2e] text-gray-200 border border-[#2d3748] rounded-bl-none'
                  }`}>
                    {msg.text}
                  </div>
                  <span className="text-[10px] text-gray-500 mt-1 px-1">{formatTime(msg.time)}</span>
                </div>
              ))}
              {isTyping && (
                <div className="self-start bg-[#1a1d2e] border border-[#2d3748] px-4 py-3 rounded-2xl rounded-bl-none flex gap-1.5 items-center w-16">
                  <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></span>
                  <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></span>
                  <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></span>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>
            
            <form onSubmit={sendMessage} className="p-3 bg-[#111827] border-t border-[#2d3748] flex gap-2">
              <input 
                type="text" 
                value={input} 
                onChange={e => setInput(e.target.value)} 
                placeholder="Type your message..." 
                className="flex-1 bg-[#1a1d2e] border border-[#2d3748] rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-[#7c3aed] text-sm"
              />
              <button type="submit" disabled={!input.trim()} className="bg-[#7c3aed] hover:bg-[#8b5cf6] disabled:opacity-50 text-white p-2.5 rounded-lg transition-colors flex items-center justify-center shrink-0">
                <Send className="w-5 h-5" />
              </button>
            </form>
          </>
        )}
      </div>
    </div>
  );
}
