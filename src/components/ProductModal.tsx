import React, { useState, useEffect } from 'react';
import type { Product } from '../types';
import { api } from '../api';

interface ProductModalProps {
  isOpen: boolean;
  onClose: () => void;
  product?: Product | null; // If provided, we are editing; if null/undefined, we are creating
  onSave: (productData: Omit<Product, 'id'>, id?: string) => Promise<void>;
}

export function ProductModal({ isOpen, onClose, product, onSave }: ProductModalProps) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState('');
  const [stock, setStock] = useState('');
  const [category, setCategory] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (product) {
      setName(product.name);
      setDescription(product.description || '');
      setPrice(product.price.toString());
      setStock(product.stock.toString());
      setCategory(product.category || '');
      setImageUrl(product.image_url || '');
    } else {
      setName('');
      setDescription('');
      setPrice('');
      setStock('');
      setCategory('');
      setImageUrl('');
    }
    setError('');
  }, [product, isOpen]);

  if (!isOpen) return null;

  // ── ImageKit Client-side Upload ──────────────────────────────────────────
  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setError('');
    setIsUploading(true);

    try {
      // 1. Fetch secure authentication parameters from the Go backend
      const auth = await api.getImageKitAuth();

      // 2. Prepare FormData payload
      const formData = new FormData();
      formData.append('file', file);
      formData.append('fileName', file.name);
      formData.append('publicKey', auth.publicKey);
      formData.append('signature', auth.signature);
      formData.append('expire', auth.expire.toString());
      formData.append('token', auth.token);

      // 3. POST the file directly to ImageKit's upload endpoint
      const response = await fetch('https://upload.imagekit.io/api/v1/files/upload', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        throw new Error(errData.message || 'Upload failed');
      }

      // 4. Update the imageUrl state with the resulting CDN URL
      const data = await response.json();
      setImageUrl(data.url);
    } catch (err: any) {
      setError(err.message || 'Failed to upload image. Please verify ImageKit credentials.');
    } finally {
      setIsUploading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    // Client-side validations
    if (!name.trim()) {
      setError('Product name is required');
      return;
    }
    const parsedPrice = parseFloat(price);
    if (isNaN(parsedPrice) || parsedPrice <= 0) {
      setError('Price must be a valid number greater than zero');
      return;
    }
    const parsedStock = parseInt(stock, 10);
    if (isNaN(parsedStock) || parsedStock < 0) {
      setError('Stock must be a non-negative integer');
      return;
    }

    setIsSubmitting(true);
    try {
      const payload: Omit<Product, 'id'> = {
        name: name.trim(),
        description: description.trim(),
        price: parsedPrice,
        stock: parsedStock,
        category: category.trim() || 'General',
        image_url: imageUrl.trim(),
      };

      await onSave(payload, product?.id);
      onClose();
    } catch (err: any) {
      setError(err.message || 'An error occurred while saving the product');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-md">
      <div className="w-full max-w-lg bg-surface border border-slate-700/80 rounded-2xl p-6 shadow-2xl animate-in fade-in zoom-in-95 duration-200">
        <div className="flex items-center justify-between border-b border-slate-800 pb-4 mb-4">
          <h3 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-primary to-accent">
            {product ? 'Edit Product' : 'Add New Product'}
          </h3>
          <button
            onClick={onClose}
            className="p-1 rounded-lg hover:bg-slate-850 text-slate-400 hover:text-white transition-colors"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-500/10 border border-red-500/20 text-red-400 rounded-lg text-sm">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-400 mb-1">PRODUCT NAME</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Wireless Headset"
              className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-2.5 text-text focus:outline-none focus:border-primary transition-colors text-sm"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-400 mb-1">DESCRIPTION</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe the product features..."
              className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-2.5 text-text focus:outline-none focus:border-primary transition-colors text-sm h-20 resize-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-400 mb-1">PRICE (Rp)</label>
              <input
                type="number"
                step="0.01"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                placeholder="50000"
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-2.5 text-text focus:outline-none focus:border-primary transition-colors text-sm"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-400 mb-1">STOCK</label>
              <input
                type="number"
                value={stock}
                onChange={(e) => setStock(e.target.value)}
                placeholder="50"
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-2.5 text-text focus:outline-none focus:border-primary transition-colors text-sm"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-400 mb-1">CATEGORY</label>
            <input
              type="text"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              placeholder="e.g. Electronics, Books"
              className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-2.5 text-text focus:outline-none focus:border-primary transition-colors text-sm"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-400 mb-1">PRODUCT IMAGE</label>
            <div className="flex gap-3">
              <div className="flex-1">
                <input
                  type="text"
                  value={imageUrl}
                  onChange={(e) => setImageUrl(e.target.value)}
                  placeholder="https://example.com/image.jpg"
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-2.5 text-text focus:outline-none focus:border-primary transition-colors text-sm"
                />
              </div>
              <div className="relative">
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageUpload}
                  disabled={isUploading}
                  id="image-file-input"
                  className="hidden"
                />
                <label
                  htmlFor="image-file-input"
                  className={`px-4 py-2.5 rounded-xl border border-slate-700 bg-slate-800 hover:bg-slate-750 text-slate-300 font-semibold text-sm transition-colors cursor-pointer flex items-center gap-1.5 h-10 select-none ${
                    isUploading ? 'opacity-50 cursor-not-allowed' : ''
                  }`}
                >
                  {isUploading ? (
                    <>
                      <div className="w-4 h-4 border-2 border-slate-300 border-t-transparent rounded-full animate-spin" />
                      Uploading...
                    </>
                  ) : (
                    <>
                      <svg className="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                      </svg>
                      Upload
                    </>
                  )}
                </label>
              </div>
            </div>
          </div>

          <div className="flex gap-3 justify-end pt-4 border-t border-slate-800 mt-6">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-750 text-slate-300 font-semibold text-sm transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting || isUploading}
              className="px-4 py-2 rounded-lg bg-primary hover:bg-primary/90 text-slate-900 font-semibold text-sm transition-colors flex items-center gap-1.5 disabled:opacity-50"
            >
              {isSubmitting && (
                <div className="w-4 h-4 border-2 border-slate-900 border-t-transparent rounded-full animate-spin" />
              )}
              {product ? 'Save Changes' : 'Create Product'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
