import { useEffect, useRef, useState } from 'react';
import gsap from 'gsap';
import type { CartItem } from '../types';
import { formatRp } from '../utils/format';

interface CheckoutModalProps {
  isOpen: boolean;
  onClose: () => void;
  cartItems: CartItem[];
  onCheckout: () => Promise<void>;
  onClearCart: () => void;
}

export function CheckoutModal({ isOpen, onClose, cartItems, onCheckout, onClearCart }: CheckoutModalProps) {
  const modalRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const total = cartItems.reduce((acc, item) => acc + item.product.price * item.quantity, 0);
  const totalItems = cartItems.reduce((acc, item) => acc + item.quantity, 0);

  useEffect(() => {
    if (isOpen) {
      setIsSuccess(false);
      setErrorMsg(null);
      gsap.fromTo(
        modalRef.current,
        { opacity: 0 },
        { opacity: 1, duration: 0.3 }
      );
      gsap.fromTo(
        contentRef.current,
        { scale: 0.9, opacity: 0, y: 20 },
        { scale: 1, opacity: 1, y: 0, duration: 0.4, ease: 'back.out(1.5)' }
      );
    }
  }, [isOpen]);

  const handleCheckout = async () => {
    setIsProcessing(true);
    setErrorMsg(null);
    try {
      await onCheckout();

      // Success animation, then reload to reflect updated stock
      gsap.to(contentRef.current, {
        scale: 1.05,
        duration: 0.2,
        yoyo: true,
        repeat: 1,
        onComplete: () => {
          setIsSuccess(true);
          setTimeout(() => {
            window.location.reload();
          }, 1500);
        },
      });
    } catch (error) {
      setErrorMsg(error instanceof Error ? error.message : 'Checkout failed. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div
      ref={modalRef}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div
        ref={contentRef}
        className="bg-surface border border-slate-700 rounded-3xl p-8 max-w-md w-full shadow-2xl"
      >
        {isSuccess ? (
          <div className="text-center py-8">
            <div className="w-20 h-20 bg-emerald-500/20 text-emerald-500 rounded-full flex items-center justify-center mx-auto mb-6">
              <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h2 className="text-3xl font-bold text-text mb-2">Order Confirmed!</h2>
            <p className="text-slate-400 mb-8">Your items will be on their way soon.</p>
            <button
              id="continue-shopping-button"
              onClick={onClose}
              className="w-full bg-primary hover:bg-primary/90 text-slate-900 font-bold py-3 rounded-xl transition-colors"
            >
              Continue Shopping
            </button>
          </div>
        ) : (
          <>
            <div className="flex justify-between items-center mb-6">
              <div>
                <h2 className="text-2xl font-bold text-text">Checkout</h2>
                <p className="text-sm text-slate-500 mt-0.5">{totalItems} item{totalItems !== 1 ? 's' : ''}</p>
              </div>
              <div className="flex items-center gap-2">
                {cartItems.length > 0 && (
                  <button
                    id="clear-cart-button"
                    onClick={onClearCart}
                    className="flex items-center gap-1.5 text-xs font-semibold text-red-400 hover:text-red-300 bg-red-900/20 hover:bg-red-900/40 border border-red-800/40 px-3 py-1.5 rounded-lg transition-all"
                    aria-label="Clear cart"
                  >
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                    Clear
                  </button>
                )}
                <button
                  id="close-checkout-button"
                  onClick={onClose}
                  className="text-slate-400 hover:text-text transition-colors p-2"
                  aria-label="Close checkout"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>

            <div className="space-y-4 mb-6 max-h-60 overflow-y-auto pr-2 custom-scrollbar">
              {cartItems.map((item) => (
                <div key={item.product.id} className="flex justify-between items-center border-b border-slate-700/50 pb-4">
                  <div className="flex-1 min-w-0">
                    <h4 className="text-text font-medium truncate">{item.product.name}</h4>
                    <p className="text-xs text-slate-500">{item.product.category}</p>
                  </div>
                  <div className="text-right ml-4 flex-shrink-0">
                    <p className="text-primary font-semibold">{formatRp(item.product.price * item.quantity)}</p>
                    <p className="text-xs text-slate-500">
                      {item.quantity} × {formatRp(item.product.price)}
                    </p>
                  </div>
                </div>
              ))}
              {cartItems.length === 0 && (
                <p className="text-slate-500 text-center py-4">Your cart is empty.</p>
              )}
            </div>

            {errorMsg && (
              <div className="mb-4 p-3 bg-red-900/30 border border-red-700/50 rounded-xl text-red-400 text-sm">
                {errorMsg}
              </div>
            )}

            <div className="flex justify-between items-center text-lg font-bold text-text mb-8">
              <span>Total:</span>
              <span className="text-2xl text-primary">{formatRp(total)}</span>
            </div>

            <button
              id="place-order-button"
              onClick={handleCheckout}
              disabled={isProcessing || cartItems.length === 0}
              className="w-full bg-accent hover:bg-accent/90 disabled:bg-slate-700 disabled:text-slate-500 text-white font-bold py-4 rounded-xl transition-all shadow-lg hover:shadow-accent/20 active:scale-95"
            >
              {isProcessing ? 'Processing...' : 'Place Order'}
            </button>
          </>
        )}
      </div>
    </div>
  );
}
