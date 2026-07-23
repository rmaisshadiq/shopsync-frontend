import { useEffect, useRef, useState } from 'react';
import gsap from 'gsap';
import type { Product } from '../types';
import { formatRp } from '../utils/format';

interface AddToCartModalProps {
  product: Product | null;
  onClose: () => void;
  onConfirm: (product: Product, quantity: number) => void;
}

export function AddToCartModal({ product, onClose, onConfirm }: AddToCartModalProps) {
  const backdropRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const [quantity, setQuantity] = useState(1);

  const isOpen = product !== null;

  // Reset quantity & animate in whenever a product is set
  useEffect(() => {
    if (isOpen) {
      setQuantity(1);
      gsap.fromTo(backdropRef.current, { opacity: 0 }, { opacity: 1, duration: 0.25 });
      gsap.fromTo(
        contentRef.current,
        { scale: 0.88, opacity: 0, y: 24 },
        { scale: 1, opacity: 1, y: 0, duration: 0.38, ease: 'back.out(1.7)' }
      );
    }
  }, [isOpen]);

  const handleClose = () => {
    gsap.to(contentRef.current, { scale: 0.92, opacity: 0, y: 12, duration: 0.2, ease: 'power2.in' });
    gsap.to(backdropRef.current, {
      opacity: 0,
      duration: 0.25,
      onComplete: onClose,
    });
  };

  const handleConfirm = () => {
    if (!product) return;
    onConfirm(product, quantity);
    handleClose();
  };

  const decrement = () => setQuantity((q) => Math.max(1, q - 1));
  const increment = () => setQuantity((q) => Math.min(product?.stock ?? 1, q + 1));

  if (!isOpen) return null;

  const maxStock = product.stock;
  const subtotal = product.price * quantity;

  return (
    <div
      ref={backdropRef}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
      onClick={(e) => { if (e.target === e.currentTarget) handleClose(); }}
    >
      <div
        ref={contentRef}
        className="bg-surface border border-slate-700 rounded-3xl p-8 max-w-sm w-full shadow-2xl"
      >
        {/* Header */}
        <div className="flex justify-between items-start mb-6">
          <div className="flex-1 min-w-0 pr-4">
            <p className="text-xs font-semibold text-primary uppercase tracking-wider mb-1">
              {product.category}
            </p>
            <h2 className="text-xl font-bold text-text leading-tight truncate">{product.name}</h2>
            <p className="text-sm text-slate-400 mt-1">{formatRp(product.price)} / item</p>
          </div>
          <button
            id="close-add-to-cart-modal"
            onClick={handleClose}
            className="text-slate-500 hover:text-text transition-colors p-1 flex-shrink-0"
            aria-label="Close"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Product image */}
        {product.image_url && (
          <div className="aspect-video bg-slate-800 rounded-2xl overflow-hidden mb-6">
            <img
              src={product.image_url}
              alt={product.name}
              className="w-full h-full object-cover"
            />
          </div>
        )}

        {/* Stock indicator */}
        <div className="flex items-center gap-2 mb-6">
          <div className={`w-2 h-2 rounded-full ${maxStock > 10 ? 'bg-emerald-400' : maxStock > 3 ? 'bg-amber-400' : 'bg-red-400'}`} />
          <span className="text-sm text-slate-400">
            {maxStock > 0 ? `${maxStock} in stock` : 'Out of stock'}
          </span>
        </div>

        {/* Quantity selector */}
        <div className="mb-6">
          <label className="block text-sm font-semibold text-slate-300 mb-3">Quantity</label>
          <div className="flex items-center gap-4">
            <button
              id="qty-decrement"
              onClick={decrement}
              disabled={quantity <= 1}
              className="w-10 h-10 rounded-xl bg-slate-800 hover:bg-slate-700 disabled:opacity-30 disabled:cursor-not-allowed text-slate-200 font-bold text-xl flex items-center justify-center transition-all active:scale-90"
              aria-label="Decrease quantity"
            >
              −
            </button>

            <input
              id="qty-input"
              type="number"
              min={1}
              max={maxStock}
              value={quantity}
              onChange={(e) => {
                const val = parseInt(e.target.value, 10);
                if (!isNaN(val)) setQuantity(Math.min(maxStock, Math.max(1, val)));
              }}
              className="w-20 text-center bg-slate-800 border border-slate-700 focus:border-primary focus:ring-1 focus:ring-primary/40 text-text font-bold text-lg rounded-xl py-2 outline-none transition-all"
            />

            <button
              id="qty-increment"
              onClick={increment}
              disabled={quantity >= maxStock}
              className="w-10 h-10 rounded-xl bg-slate-800 hover:bg-slate-700 disabled:opacity-30 disabled:cursor-not-allowed text-slate-200 font-bold text-xl flex items-center justify-center transition-all active:scale-90"
              aria-label="Increase quantity"
            >
              +
            </button>

            <span className="text-slate-500 text-sm ml-auto">max {maxStock}</span>
          </div>
        </div>

        {/* Subtotal */}
        <div className="flex justify-between items-center bg-slate-800/60 rounded-2xl px-5 py-4 mb-6 border border-slate-700/40">
          <span className="text-slate-400 text-sm font-medium">Subtotal</span>
          <span className="text-primary text-xl font-bold">{formatRp(subtotal)}</span>
        </div>

        {/* Actions */}
        <div className="flex gap-3">
          <button
            id="cancel-add-to-cart"
            onClick={handleClose}
            className="flex-1 py-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold transition-colors"
          >
            Cancel
          </button>
          <button
            id="confirm-add-to-cart"
            onClick={handleConfirm}
            className="flex-[2] py-3 rounded-xl bg-primary hover:bg-primary/90 text-slate-900 font-bold transition-all shadow-lg shadow-primary/20 active:scale-95 flex items-center justify-center gap-2"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
            Add to Cart
          </button>
        </div>
      </div>
    </div>
  );
}
