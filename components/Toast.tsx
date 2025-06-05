
import React, { useEffect } from 'react';

interface ToastProps {
  message: string;
  type: 'info' | 'success' | 'error';
  imageUrl?: string; // Optional image URL for gym leader notifications
  onClose: () => void;
}

const Toast: React.FC<ToastProps> = ({ message, type, imageUrl, onClose }) => {
  useEffect(() => {
    const timer = setTimeout(() => {
      onClose();
    }, 5000); // Auto-close after 5 seconds

    return () => clearTimeout(timer);
  }, [onClose]);

  let bgColor = 'bg-blue-500';
  if (type === 'success') bgColor = 'bg-green-500';
  if (type === 'error') bgColor = 'bg-red-500';

  return (
    <div 
      className={`fixed bottom-5 right-5 ${bgColor} text-white p-4 rounded-lg shadow-xl flex items-center space-x-3 max-w-sm z-[100] transition-opacity duration-300 animate-fadeIn`}
      role="alert"
      aria-live="assertive"
    >
      {imageUrl && (
        <img src={imageUrl} alt="Leader" className="w-12 h-12 rounded-md object-cover border-2 border-white" />
      )}
      <div className="flex-grow">
        <p className="text-sm">{message}</p>
      </div>
      <button 
        onClick={onClose} 
        className="text-xl font-semibold hover:text-slate-200"
        aria-label="Fechar notificação"
      >
        &times;
      </button>
      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fadeIn {
          animation: fadeIn 0.3s ease-out forwards;
        }
      `}</style>
    </div>
  );
};

export default Toast;
