'use client';

import React, { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { localStore } from '@/lib/store/localStore';
import { Sparkles, Send, Bot, User, HelpCircle } from 'lucide-react';

interface ChatMessage {
  id: string;
  sender: 'user' | 'ai';
  text: string;
  timestamp: string;
}

export default function MerchantAIPage() {
  const { company, user } = useAuth();
  const companyId = company?.id || user?.companyId || '';

  const [inputQuery, setInputQuery] = useState('');
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'welcome',
      sender: 'ai',
      text: `नमस्ते ${user?.name || ''}! मैं आपका व्यापारमित्र AI सहायक हूँ। आप मुझसे दुकान की बिक्री, उधारी, स्टॉक या मुनाफे के बारे में हिन्दी या English में पूछ सकते हैं।`,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    },
  ]);

  const quickPrompts = [
    'आज कितना बिक्री हुआ?',
    'सबसे ज्यादा बिकने वाला product कौन सा है?',
    'किस customer का सबसे ज्यादा due है?',
    'कौन सा product low stock में है?',
    'आज का profit कितना है?',
    'Show me total store inventory valuation',
  ];

  const handleSend = (queryText?: string) => {
    const q = (queryText || inputQuery).trim();
    if (!q) return;

    const userMsg: ChatMessage = {
      id: `u_${Date.now()}`,
      sender: 'user',
      text: q,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputQuery('');

    // Strict Tenant-isolated calculation
    const products = localStore.getProducts(companyId);
    const sales = localStore.getSales(companyId);
    const customers = localStore.getCustomers(companyId);
    const purchases = localStore.getPurchases(companyId);
    const expenses = localStore.getExpenses(companyId);

    const todayStr = new Date().toISOString().split('T')[0];
    const todaySales = sales.filter((s) => s.createdAt.startsWith(todayStr) && s.status === 'COMPLETED');
    const totalTodaySales = todaySales.reduce((acc, s) => acc + s.grandTotal, 0);

    const lowerQ = q.toLowerCase();
    let aiResponse = '';

    if (lowerQ.includes('बिक्री') || lowerQ.includes('sales today') || lowerQ.includes('today sales') || lowerQ.includes('आज कितना')) {
      if (todaySales.length === 0) {
        aiResponse = 'आज अभी तक कोई बिक्री दर्ज नहीं हुई है। आप POS (F2) से पहला बिल बना सकते हैं।';
      } else {
        aiResponse = `आज आपकी कुल बिक्री ₹${totalTodaySales.toFixed(2)} हुई है (${todaySales.length} बिल बनाए गए हैं)।`;
      }
    } else if (lowerQ.includes('product') || lowerQ.includes('सबसे ज्यादा') || lowerQ.includes('top selling') || lowerQ.includes('बिकने वाला')) {
      if (sales.length === 0) {
        aiResponse = 'पर्याप्त डेटा उपलब्ध नहीं है (Not enough data available)। अभी तक कोई बिक्री नहीं हुई है।';
      } else {
        const itemCounts: Record<string, { name: string; qty: number }> = {};
        sales.forEach((s) => {
          s.items.forEach((it) => {
            if (!itemCounts[it.productId]) {
              itemCounts[it.productId] = { name: it.productName, qty: 0 };
            }
            itemCounts[it.productId].qty += it.quantity;
          });
        });
        const sorted = Object.values(itemCounts).sort((a, b) => b.qty - a.qty);
        if (sorted.length > 0) {
          aiResponse = `आपकी दुकान का सबसे ज्यादा बिकने वाला उत्पाद "${sorted[0].name}" है (कुल ${sorted[0].qty} इकाइयाँ बिकी हैं)।`;
        } else {
          aiResponse = 'पर्याप्त बिक्री डेटा उपलब्ध नहीं है।';
        }
      }
    } else if (lowerQ.includes('customer') || lowerQ.includes('due') || lowerQ.includes('उधारी') || lowerQ.includes('बकाया')) {
      const dueCustomers = [...customers].sort((a, b) => b.totalDue - a.totalDue);
      if (dueCustomers.length === 0 || dueCustomers[0].totalDue <= 0) {
        aiResponse = 'बधाई हो! किसी भी ग्राहक का उधारी बाकी नहीं है। सारा हिसाब चुकता है।';
      } else {
        const top = dueCustomers[0];
        aiResponse = `सबसे ज्यादा उधारी ग्राहक "${top.name}" (${top.mobile}) का है, जिनकी कुल बकाया राशि ₹${top.totalDue.toFixed(2)} है।`;
      }
    } else if (lowerQ.includes('stock') || lowerQ.includes('low') || lowerQ.includes('कम')) {
      const lowProds = products.filter((p) => p.currentStock <= p.minStockAlert);
      if (lowProds.length === 0) {
        aiResponse = 'आपकी दुकान के सभी उत्पादों का स्टॉक पर्याप्त स्तर पर है। कोई भी उत्पाद Low Stock में नहीं है।';
      } else {
        const names = lowProds.slice(0, 5).map((p) => `${p.name} (${p.currentStock} ${p.unit})`).join(', ');
        aiResponse = `सावधान! निम्नलिखित उत्पाद low stock स्तर पर हैं: ${names}। कृपया सप्लायर से पुन: ऑर्डर करें।`;
      }
    } else if (lowerQ.includes('profit') || lowerQ.includes('मुनाफा') || lowerQ.includes('फायदा')) {
      const totalRev = sales.reduce((acc, s) => acc + s.grandTotal, 0);
      const totalPurch = purchases.reduce((acc, p) => acc + p.grandTotal, 0);
      const totalExp = expenses.reduce((acc, e) => acc + e.amount, 0);
      const net = totalRev - totalPurch - totalExp;
      aiResponse = `दुकान का समग्र अनुमानित शुद्ध मुनाफा (Net Profit) ₹${net.toFixed(2)} है (कुल बिक्री: ₹${totalRev.toFixed(0)}, खरीद: ₹${totalPurch.toFixed(0)}, खर्चे: ₹${totalExp.toFixed(0)})।`;
    } else if (lowerQ.includes('inventory') || lowerQ.includes('valuation') || lowerQ.includes('कीमत')) {
      const costVal = products.reduce((acc, p) => acc + p.currentStock * p.purchasePrice, 0);
      const retailVal = products.reduce((acc, p) => acc + p.currentStock * p.sellingPrice, 0);
      aiResponse = `दुकान की कुल इन्वेंटरी खरीद लागत (Cost Valuation) ₹${costVal.toFixed(2)} है, एवं खुदरा मूल्य क्षमता (Retail Potential) ₹${retailVal.toFixed(2)} है।`;
    } else {
      aiResponse = `व्यापारमित्र AI: मैंने आपके सवाल का विश्लेषण किया। आपकी दुकान में वर्तमान में ${products.length} उत्पाद, ${customers.length} ग्राहक, एवं कुल ${sales.length} बिल दर्ज हैं। आप ऊपर दिए गए त्वरित प्रश्नों पर भी क्लिक कर सकते हैं।`;
    }

    setTimeout(() => {
      const botMsg: ChatMessage = {
        id: `b_${Date.now()}`,
        sender: 'ai',
        text: aiResponse,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };
      setMessages((prev) => [...prev, botMsg]);
    }, 400);
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div className="pb-4 border-b border-slate-200">
        <h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
          <Sparkles className="w-6 h-6 text-indigo-600" />
          <span>VyapaarMitra AI Store Assistant</span>
        </h1>
        <p className="text-xs text-slate-500 mt-1">
          Strict tenant-isolated intelligent assistant. Ask queries in Hindi or English regarding your shop data.
        </p>
      </div>

      {/* Chat Container */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm flex flex-col h-[520px]">
        {/* Messages Stream */}
        <div className="flex-1 p-4 overflow-y-auto space-y-3">
          {messages.map((m) => (
            <div
              key={m.id}
              className={`flex gap-3 max-w-xl ${m.sender === 'user' ? 'ml-auto flex-row-reverse' : ''}`}
            >
              <div
                className={`w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 text-white font-bold text-xs ${
                  m.sender === 'user' ? 'bg-blue-600' : 'bg-gradient-to-tr from-indigo-600 to-purple-600'
                }`}
              >
                {m.sender === 'user' ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
              </div>

              <div
                className={`p-3.5 rounded-2xl text-xs leading-relaxed ${
                  m.sender === 'user'
                    ? 'bg-blue-600 text-white rounded-br-none shadow-md shadow-blue-500/10'
                    : 'bg-slate-50 border border-slate-200 text-slate-800 rounded-bl-none'
                }`}
              >
                <p>{m.text}</p>
                <div
                  className={`text-[9px] mt-1 text-right ${
                    m.sender === 'user' ? 'text-blue-200' : 'text-slate-400'
                  }`}
                >
                  {m.timestamp}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Quick Prompts Bar */}
        <div className="p-2 border-t border-slate-100 flex items-center gap-1.5 overflow-x-auto bg-slate-50/50 text-[11px]">
          {quickPrompts.map((qp, i) => (
            <button
              key={i}
              onClick={() => handleSend(qp)}
              className="px-2.5 py-1 rounded-full bg-white border border-slate-200 text-slate-700 hover:border-indigo-400 hover:text-indigo-600 whitespace-nowrap transition-colors"
            >
              {qp}
            </button>
          ))}
        </div>

        {/* Chat Input */}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSend();
          }}
          className="p-3 border-t border-slate-200 flex items-center gap-2"
        >
          <input
            type="text"
            value={inputQuery}
            onChange={(e) => setInputQuery(e.target.value)}
            placeholder="Ask anything about your shop (e.g. आज का profit कितना है?)..."
            className="flex-1 p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
          <button
            type="submit"
            className="p-2.5 bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-bold rounded-xl shadow-md shadow-indigo-500/20 hover:opacity-95 transition-opacity"
          >
            <Send className="w-4 h-4" />
          </button>
        </form>
      </div>
    </div>
  );
}
