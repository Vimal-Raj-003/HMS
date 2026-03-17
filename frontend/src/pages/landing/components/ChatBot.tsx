import { useState, useRef, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import {
  MessageCircle,
  X,
  Send,
  Bot,
  User,
  Phone,
  Mail,
  Calendar
} from 'lucide-react';

interface Message {
  id: number;
  text: string;
  sender: 'bot' | 'user';
  timestamp: Date;
}

const quickQuestions = [
  "How do I book an appointment?",
  "What are your working hours?",
  "Which specialties are available?",
  "How can I contact support?"
];

const ChatBot = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [showChat, setShowChat] = useState(false);
  // Use a ref for generating unique message IDs to avoid potential duplicates
  const messageIdRef = useRef(1);
  // Track component mount status for safe async operations
  const isMountedRef = useRef(true);
  // Store timeout ID for cleanup
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [messages, setMessages] = useState<Message[]>([
    {
      id: messageIdRef.current,
      text: "Hello! 👋 Welcome to HMS Healthcare. I'm your virtual assistant. How can I help you today?",
      sender: 'bot',
      timestamp: new Date()
    }
  ]);
  const [inputValue, setInputValue] = useState('');

  // Cleanup on unmount - prevent state updates after unmount and clear timeouts
  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
      // Clear any pending timeout to prevent memory leak
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }
    };
  }, []);

  const handleOpenChat = () => {
    setIsOpen(true);
    setShowChat(true);
  };

  const handleCloseChat = () => {
    setIsOpen(false);
    setShowChat(false);
  };

  const handleSendMessage = useCallback((text?: string) => {
    const messageText = text || inputValue.trim();
    if (!messageText) return;

    // Add user message with unique ID from ref
    const userMessage: Message = {
      id: ++messageIdRef.current,
      text: messageText,
      sender: 'user',
      timestamp: new Date()
    };
    setMessages(prev => [...prev, userMessage]);
    setInputValue('');

    // Clear any existing timeout before creating a new one to prevent race conditions
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    
    // Simulate bot response with mount-safe async update
    // Store timeout ID for cleanup
    timeoutRef.current = setTimeout(() => {
      // Only update state if component is still mounted
      if (!isMountedRef.current) return;
      
      const botResponse = getBotResponse(messageText);
      const botMessage: Message = {
        id: ++messageIdRef.current,
        text: botResponse,
        sender: 'bot',
        timestamp: new Date()
      };
      setMessages(prev => [...prev, botMessage]);
      timeoutRef.current = null;
    }, 800);
  }, [inputValue]);

  const getBotResponse = (question: string): string => {
    const lowerQuestion = question.toLowerCase();
    
    if (lowerQuestion.includes('book') || lowerQuestion.includes('appointment')) {
      return "To book an appointment, you can:\n\n1. Click the 'Book Appointment' button on our homepage\n2. Call us at +1 (800) 123-4567\n3. Use our patient portal after logging in\n\nWould you like me to direct you to the booking page?";
    }
    if (lowerQuestion.includes('hour') || lowerQuestion.includes('time') || lowerQuestion.includes('open')) {
      return "Our working hours are:\n\n🏥 Monday - Friday: 8:00 AM - 8:00 PM\n🏥 Saturday: 9:00 AM - 6:00 PM\n🏥 Sunday: 10:00 AM - 4:00 PM\n\nEmergency services are available 24/7.";
    }
    if (lowerQuestion.includes('special') || lowerQuestion.includes('department')) {
      return "We offer 15+ medical specialties including:\n\n❤️ Cardiology\n🦴 Orthopedics\n🧠 Neurology\n👶 Pediatrics\n✨ Dermatology\n💊 General Medicine\n\nAnd many more! Would you like details about any specific specialty?";
    }
    if (lowerQuestion.includes('contact') || lowerQuestion.includes('support') || lowerQuestion.includes('help')) {
      return "You can reach us through:\n\n📞 Emergency: +1 (800) 123-4567\n📧 Email: support@hms.com\n📍 Address: 123 Healthcare Ave, Medical District\n\nOur support team is available 24/7 for assistance.";
    }
    
    return "Thank you for your message! For personalized assistance, please:\n\n• Book an appointment with our specialists\n• Call our helpline at +1 (800) 123-4567\n• Email us at support@hms.com\n\nIs there anything specific I can help you with?";
  };

  const handleQuickQuestion = (question: string) => {
    handleSendMessage(question);
  };

  return (
    <>
      {/* Floating Chat Button */}
      <button
        onClick={handleOpenChat}
        className={`fixed bottom-6 right-6 z-50 w-16 h-16 bg-gradient-to-r from-blue-600 to-teal-500 rounded-full shadow-2xl shadow-blue-500/30 flex items-center justify-center text-white transition-all duration-500 hover:scale-110 hover:shadow-blue-500/50 group ${
          isOpen ? 'scale-0 opacity-0' : 'scale-100 opacity-100'
        }`}
      >
        <MessageCircle className="w-7 h-7 group-hover:scale-110 transition-transform" />
        {/* Pulse animation - respects prefers-reduced-motion for accessibility */}
        <span className="absolute inset-0 rounded-full bg-blue-400 opacity-25 motion-safe:animate-ping"></span>
      </button>

      {/* Chat Panel */}
      <div
        className={`fixed bottom-6 right-6 z-50 w-[380px] max-w-[calc(100vw-48px)] transition-all duration-500 ${
          showChat
            ? 'opacity-100 translate-y-0'
            : 'opacity-0 translate-y-8 pointer-events-none'
        }`}
      >
        <div className="bg-white rounded-3xl shadow-2xl shadow-slate-300/50 overflow-hidden border border-slate-200/50">
          {/* Header */}
          <div className="bg-gradient-to-r from-blue-600 via-blue-500 to-teal-500 p-4 text-white">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center">
                  <Bot className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="font-semibold text-lg">HMS Assistant</h3>
                  <div className="flex items-center gap-1.5 text-sm text-blue-100">
                    <span className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse"></span>
                    Online • Ready to help
                  </div>
                </div>
              </div>
              <button
                onClick={handleCloseChat}
                className="w-9 h-9 bg-white/10 hover:bg-white/20 rounded-full flex items-center justify-center transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Messages Container */}
          <div
            className="h-[320px] overflow-y-auto p-4 space-y-4 bg-gradient-to-b from-slate-50/50 to-white"
            aria-live="polite"
            aria-label="Chat messages"
            role="log"
          >
            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex gap-2.5 ${
                  message.sender === 'user' ? 'flex-row-reverse' : ''
                }`}
              >
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                    message.sender === 'bot'
                      ? 'bg-gradient-to-br from-blue-500 to-teal-500 text-white'
                      : 'bg-slate-200 text-slate-600'
                  }`}
                >
                  {message.sender === 'bot' ? (
                    <Bot className="w-4 h-4" />
                  ) : (
                    <User className="w-4 h-4" />
                  )}
                </div>
                <div
                  className={`max-w-[75%] p-3 rounded-2xl text-sm leading-relaxed ${
                    message.sender === 'bot'
                      ? 'bg-white border border-slate-200 text-slate-700 rounded-tl-md shadow-sm'
                      : 'bg-gradient-to-r from-blue-600 to-blue-500 text-white rounded-tr-md'
                  }`}
                >
                  <p className="whitespace-pre-line">{message.text}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Quick Questions */}
          {messages.length <= 2 && (
            <div className="px-4 pb-3">
              <p className="text-xs text-slate-500 mb-2 font-medium">Quick questions:</p>
              <div className="flex flex-wrap gap-2">
                {quickQuestions.map((question, index) => (
                  <button
                    key={index}
                    onClick={() => handleQuickQuestion(question)}
                    className="text-xs px-3 py-1.5 bg-blue-50 text-blue-600 rounded-full hover:bg-blue-100 transition-colors border border-blue-100"
                  >
                    {question}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Input Area */}
          <div className="p-4 border-t border-slate-100 bg-white">
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                placeholder="Type your message..."
                className="flex-1 px-4 py-3 bg-slate-100 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:bg-white transition-all border border-transparent focus:border-blue-200"
              />
              <button
                onClick={() => handleSendMessage()}
                disabled={!inputValue.trim()}
                className="w-11 h-11 bg-gradient-to-r from-blue-600 to-teal-500 rounded-xl flex items-center justify-center text-white hover:shadow-lg hover:shadow-blue-500/25 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Send className="w-5 h-5" />
              </button>
            </div>

            {/* Contact Options */}
            <div className="flex items-center justify-center gap-4 mt-3 pt-3 border-t border-slate-100">
              <a
                href="tel:+18001234567"
                className="flex items-center gap-1.5 text-xs text-slate-500 hover:text-blue-600 transition-colors"
              >
                <Phone className="w-3.5 h-3.5" />
                Call Us
              </a>
              <a
                href="mailto:support@hms.com"
                className="flex items-center gap-1.5 text-xs text-slate-500 hover:text-blue-600 transition-colors"
              >
                <Mail className="w-3.5 h-3.5" />
                Email
              </a>
              <Link to="/login" className="flex items-center gap-1.5 text-xs text-slate-500 hover:text-blue-600 transition-colors">
                <Calendar className="w-3.5 h-3.5" />
                Book Now
              </Link>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default ChatBot;
