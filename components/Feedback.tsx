import React, { createContext, useContext, useState, ReactNode } from 'react';
import { X, Check, AlertTriangle, Info, AlertOctagon } from 'lucide-react';

interface Toast {
  id: number;
  message: string;
  type: 'success' | 'error' | 'warning' | 'info';
}

interface ConfirmOptions {
  title: string;
  message: string;
  onConfirm: () => void;
  onCancel?: () => void;
  confirmText?: string;
  cancelText?: string;
  isDestructive?: boolean;
}

interface FeedbackContextType {
  showToast: (message: string, type?: Toast['type']) => void;
  confirm: (options: ConfirmOptions) => void;
  setLoading: (isLoading: boolean) => void;
}

const FeedbackContext = createContext<FeedbackContextType | undefined>(undefined);

export const useFeedback = () => {
  const context = useContext(FeedbackContext);
  if (!context) {
    throw new Error('useFeedback must be used within a FeedbackProvider');
  }
  return context;
};

export const FeedbackProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [confirmModal, setConfirmModal] = useState<ConfirmOptions | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const showToast = (message: string, type: Toast['type'] = 'info') => {
    const id = Date.now();
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4000);
  };

  const confirm = (options: ConfirmOptions) => {
    setConfirmModal(options);
  };

  const handleConfirm = () => {
    if (confirmModal?.onConfirm) confirmModal.onConfirm();
    setConfirmModal(null);
  };

  const handleCancel = () => {
    if (confirmModal?.onCancel) confirmModal.onCancel();
    setConfirmModal(null);
  };

  const getToastIcon = (type: Toast['type']) => {
    switch (type) {
      case 'success': return <Check size={18} className="text-green-500" />;
      case 'error': return <AlertOctagon size={18} className="text-red-500" />;
      case 'warning': return <AlertTriangle size={18} className="text-orange-500" />;
      default: return <Info size={18} className="text-blue-500" />;
    }
  };

  const getToastStyles = (type: Toast['type']) => {
    switch (type) {
      case 'success': return 'border-green-500 bg-green-50 text-green-800';
      case 'error': return 'border-red-500 bg-red-50 text-red-800';
      case 'warning': return 'border-orange-500 bg-orange-50 text-orange-800';
      default: return 'border-blue-500 bg-blue-50 text-blue-800';
    }
  };

  return (
    <FeedbackContext.Provider value={{ showToast, confirm, setLoading: setIsLoading }}>
      {children}

      {/* 3D Loading Overlay */}
      {isLoading && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-900/40 backdrop-blur-sm transition-all duration-300">
          <div className="relative flex flex-col items-center">
            {/* Abstract 3D Cube/Spinner Effect */}
            <div className="w-20 h-20 relative" style={{ perspective: '100px' }}>
               <div className="absolute inset-0 bg-indigo-600 rounded-xl opacity-20 animate-ping"></div>
               <div className="absolute inset-0 border-4 border-white/90 rounded-xl shadow-[0_0_15px_rgba(255,255,255,0.5)] animate-[spin_3s_linear_infinite]"></div>
               <div className="absolute inset-2 border-4 border-indigo-400/90 rounded-xl shadow-lg animate-[spin_2s_linear_infinite_reverse]"></div>
               <div className="absolute inset-[35%] bg-white rounded-full animate-pulse shadow-glow"></div>
            </div>
            <div className="mt-6 bg-white/10 backdrop-blur-md px-6 py-2 rounded-full border border-white/20">
                <span className="text-white font-bold text-lg tracking-wide drop-shadow-md">لطفا صبر کنید...</span>
            </div>
          </div>
        </div>
      )}

      {/* Toast Container */}
      <div className="fixed top-6 left-6 z-[70] flex flex-col gap-3 pointer-events-none w-full max-w-sm">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className={`pointer-events-auto flex items-start gap-3 p-4 rounded-xl border-l-4 shadow-lg transform transition-all animate-in slide-in-from-left-5 fade-in duration-300 ${getToastStyles(toast.type)}`}
          >
            <div className="mt-0.5 shrink-0 bg-white/50 p-1 rounded-full">{getToastIcon(toast.type)}</div>
            <p className="text-sm font-medium leading-5">{toast.message}</p>
            <button 
              onClick={() => setToasts(prev => prev.filter(t => t.id !== toast.id))}
              className="mr-auto opacity-50 hover:opacity-100 transition-opacity"
            >
              <X size={16} />
            </button>
          </div>
        ))}
      </div>

      {/* Confirm Modal */}
      {confirmModal && (
        <div className="fixed inset-0 z-[80] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200" onClick={handleCancel}></div>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md relative z-10 overflow-hidden animate-in zoom-in-95 duration-200 scale-100">
            <div className="p-6 text-center">
              <div className={`w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 ${confirmModal.isDestructive ? 'bg-red-100 text-red-600' : 'bg-indigo-100 text-indigo-600'}`}>
                {confirmModal.isDestructive ? <AlertOctagon size={32} /> : <AlertTriangle size={32} />}
              </div>
              <h3 className="text-xl font-bold text-slate-800 mb-2">{confirmModal.title}</h3>
              <p className="text-gray-500 leading-relaxed">{confirmModal.message}</p>
            </div>
            <div className="flex border-t border-gray-100">
              <button 
                onClick={handleCancel}
                className="flex-1 py-4 text-gray-600 font-medium hover:bg-gray-50 transition-colors"
              >
                {confirmModal.cancelText || 'انصراف'}
              </button>
              <div className="w-px bg-gray-100"></div>
              <button 
                onClick={handleConfirm}
                className={`flex-1 py-4 font-bold transition-colors ${
                  confirmModal.isDestructive 
                  ? 'text-red-600 hover:bg-red-50' 
                  : 'text-indigo-600 hover:bg-indigo-50'
                }`}
              >
                {confirmModal.confirmText || 'بله، انجام شود'}
              </button>
            </div>
          </div>
        </div>
      )}
    </FeedbackContext.Provider>
  );
};