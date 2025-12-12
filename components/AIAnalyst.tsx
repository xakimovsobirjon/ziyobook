import React, { useState } from 'react';
import { StoreData } from '../types';
import { askStoreAssistant } from '../services/gemini';
import { Bot, Send, Loader2 } from 'lucide-react';

interface AIAnalystProps {
  data: StoreData;
}

const AIAnalyst: React.FC<AIAnalystProps> = ({ data }) => {
  const [question, setQuestion] = useState('');
  const [answer, setAnswer] = useState('');
  const [loading, setLoading] = useState(false);

  const handleAsk = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!question.trim()) return;

    setLoading(true);
    setAnswer('');
    try {
      const response = await askStoreAssistant(question, data);
      setAnswer(response);
    } catch (err) {
      setAnswer("Xatolik yuz berdi. Qayta urinib ko'ring.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="bg-gradient-to-r from-indigo-600 to-purple-600 p-8 rounded-2xl text-white shadow-lg">
        <div className="flex items-center mb-4">
          <Bot className="w-8 h-8 mr-3" />
          <h2 className="text-2xl font-bold">AI Tahlilchi</h2>
        </div>
        <p className="text-indigo-100 mb-6">
          Do'koningiz faoliyati bo'yicha istalgan savol bering. Men sotuvlar, qoldiqlar va qarzdorliklarni tahlil qilib beraman.
        </p>

        <form onSubmit={handleAsk} className="relative">
          <input
            type="text"
            className="w-full pl-6 pr-14 py-4 rounded-xl text-slate-800 focus:outline-none shadow-lg"
            placeholder="Masalan: Qaysi kitob eng ko'p sotildi? Yoki kimlarning qarzi bor?"
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
          />
          <button 
            type="submit" 
            disabled={loading}
            className="absolute right-2 top-2 p-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 transition-colors"
          >
            {loading ? <Loader2 className="w-6 h-6 animate-spin" /> : <Send className="w-6 h-6" />}
          </button>
        </form>
      </div>

      {answer && (
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 animate-fade-in">
          <h3 className="font-bold text-slate-800 mb-2 flex items-center">
            <Bot className="w-5 h-5 mr-2 text-indigo-600" />
            Javob:
          </h3>
          <p className="text-slate-700 leading-relaxed whitespace-pre-wrap">{answer}</p>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-white p-4 rounded-xl border border-slate-100 shadow-sm cursor-pointer hover:border-indigo-200 transition-colors"
             onClick={() => setQuestion("Bugungi kunda qancha foyda ko'rdik?")}>
          <p className="font-medium text-slate-700">💰 Bugungi foyda qancha?</p>
        </div>
        <div className="bg-white p-4 rounded-xl border border-slate-100 shadow-sm cursor-pointer hover:border-indigo-200 transition-colors"
             onClick={() => setQuestion("Qaysi kitoblar 5 tadan kam qoldi?")}>
          <p className="font-medium text-slate-700">📉 Qaysi tovarlar tugayapti?</p>
        </div>
        <div className="bg-white p-4 rounded-xl border border-slate-100 shadow-sm cursor-pointer hover:border-indigo-200 transition-colors"
             onClick={() => setQuestion("Mijozlarning umumiy qarzi qancha?")}>
          <p className="font-medium text-slate-700">👥 Kimlarda qarz bor?</p>
        </div>
         <div className="bg-white p-4 rounded-xl border border-slate-100 shadow-sm cursor-pointer hover:border-indigo-200 transition-colors"
             onClick={() => setQuestion("Eng ko'p sotilayotgan kitob qaysi?")}>
          <p className="font-medium text-slate-700">🏆 Eng xaridorgir kitob?</p>
        </div>
      </div>
    </div>
  );
};

export default AIAnalyst;