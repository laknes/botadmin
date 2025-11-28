import React, { useState } from 'react';
import { Send, Image as ImageIcon, CheckCircle, AlertCircle } from 'lucide-react';
import { BotMessageType } from '../types';

const Broadcast: React.FC = () => {
  const [messageType, setMessageType] = useState<BotMessageType>(BotMessageType.TEXT);
  const [text, setText] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleSend = () => {
    if (!text) return;
    
    setIsSending(true);
    // Simulate API call delay
    setTimeout(() => {
      setIsSending(false);
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
      setText('');
    }, 2000);
  };

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-800">ارسال پیام همگانی</h1>
        <p className="text-gray-500 mt-1">ارسال پیام، تخفیف‌ها و اعلانات به تمامی کاربران ربات</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Form */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">نوع پیام</label>
              <div className="flex gap-4">
                <button 
                  onClick={() => setMessageType(BotMessageType.TEXT)}
                  className={`flex-1 py-2 px-4 rounded-lg border text-sm font-medium transition-colors ${
                    messageType === BotMessageType.TEXT 
                    ? 'bg-indigo-50 border-indigo-200 text-indigo-700' 
                    : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50'
                  }`}
                >
                  متن ساده
                </button>
                <button 
                  onClick={() => setMessageType(BotMessageType.PHOTO)}
                  className={`flex-1 py-2 px-4 rounded-lg border text-sm font-medium transition-colors ${
                    messageType === BotMessageType.PHOTO
                    ? 'bg-indigo-50 border-indigo-200 text-indigo-700' 
                    : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50'
                  }`}
                >
                  تصویر + کپشن
                </button>
                <button 
                  onClick={() => setMessageType(BotMessageType.PROMOTION)}
                  className={`flex-1 py-2 px-4 rounded-lg border text-sm font-medium transition-colors ${
                    messageType === BotMessageType.PROMOTION
                    ? 'bg-indigo-50 border-indigo-200 text-indigo-700' 
                    : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50'
                  }`}
                >
                  محصول ویژه
                </button>
              </div>
            </div>

            {messageType !== BotMessageType.TEXT && (
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">آپلود تصویر</label>
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 flex flex-col items-center justify-center text-gray-500 hover:bg-gray-50 transition-colors cursor-pointer relative bg-gray-50/50">
                  <input type="file" className="absolute inset-0 opacity-0 cursor-pointer" />
                  <ImageIcon size={32} className="mb-2" />
                  <span className="text-sm">تصویر را انتخاب کنید</span>
                </div>
              </div>
            )}

            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">متن پیام</label>
              <textarea 
                value={text}
                onChange={(e) => setText(e.target.value)}
                rows={6}
                placeholder="متن پیام خود را اینجا بنویسید..."
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none resize-none"
              />
              <div className="flex justify-between mt-2 text-xs text-gray-400">
                <span>پشتیبانی از Markdown تلگرام</span>
                <span>{text.length} کاراکتر</span>
              </div>
            </div>

            <button 
              onClick={handleSend}
              disabled={isSending || !text}
              className={`w-full flex items-center justify-center gap-2 py-3 rounded-lg font-bold text-white transition-all shadow-lg shadow-indigo-500/30 ${
                isSending || !text ? 'bg-indigo-400 cursor-not-allowed' : 'bg-indigo-600 hover:bg-indigo-700'
              }`}
            >
              {isSending ? (
                <span>در حال ارسال...</span>
              ) : success ? (
                <>
                  <CheckCircle size={20} />
                  ارسال شد
                </>
              ) : (
                <>
                  <Send size={20} className="ml-1 rtl:rotate-180" />
                  ارسال به همه کاربران
                </>
              )}
            </button>
          </div>
        </div>

        {/* Preview */}
        <div className="lg:col-span-1">
          <h3 className="text-sm font-medium text-gray-700 mb-4">پیش‌نمایش در تلگرام</h3>
          <div className="bg-[#8E9EAF] p-4 rounded-xl min-h-[400px] flex flex-col items-start gap-2 relative overflow-hidden bg-[url('https://upload.wikimedia.org/wikipedia/commons/8/82/Telegram_Wallpaper.jpg')] bg-cover">
            <div className="absolute inset-0 bg-[#8E9EAF]/20 backdrop-blur-[1px]"></div>
            
            {/* Bot Message Bubble */}
            <div className="relative z-10 bg-white p-2 rounded-lg rounded-tl-none max-w-[85%] shadow-sm text-sm text-black">
               {messageType !== BotMessageType.TEXT && (
                   <div className="w-full h-32 bg-gray-200 rounded mb-2 flex items-center justify-center text-gray-400">
                       <ImageIcon size={24} />
                   </div>
               )}
               <p className="whitespace-pre-wrap">{text || 'متن پیام شما اینجا نمایش داده می‌شود...'}</p>
               <span className="text-[10px] text-gray-400 block text-right mt-1">12:30</span>
            </div>

            {messageType === BotMessageType.PROMOTION && (
                <div className="relative z-10 w-[85%] bg-white/40 backdrop-blur-md p-2 rounded-lg mt-1 space-y-1">
                    <button className="w-full bg-[#3390ec] text-white text-xs py-2 rounded shadow-sm font-medium">مشاهده محصول</button>
                    <button className="w-full bg-[#3390ec] text-white text-xs py-2 rounded shadow-sm font-medium">خرید سریع</button>
                </div>
            )}
          </div>
          
          <div className="mt-4 p-4 bg-yellow-50 rounded-lg border border-yellow-100 flex gap-3 text-yellow-800 text-sm">
            <AlertCircle className="shrink-0" size={20} />
            <p>توجه: پیام‌ها با کمی تاخیر برای جلوگیری از مسدودی توسط تلگرام ارسال می‌شوند.</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Broadcast;