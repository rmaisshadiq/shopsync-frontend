import { useEffect, useRef } from 'react';
import gsap from 'gsap';
import type { Product, CartItem } from '../types';

interface ProductGridProps {
  products: Product[];
  onAddToCart?: (product: Product) => void;
  cart?: Map<string, CartItem>;
  isAdmin?: boolean;
  onEdit?: (product: Product) => void;
  onDelete?: (id: string) => void;
}

export function ProductGrid({ products, onAddToCart, cart, isAdmin, onEdit, onDelete }: ProductGridProps) {
  const gridRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (gridRef.current && products.length > 0) {
      const cards = gridRef.current.children;
      gsap.fromTo(
        cards,
        { opacity: 0, y: 20 },
        {
          opacity: 1,
          y: 0,
          duration: 0.6,
          stagger: 0.1,
          ease: 'power2.out',
        }
      );
    }
  }, [products]);

  if (products.length === 0) {
    return <div className="text-center text-slate-400 p-8">No products found.</div>;
  }

  return (
    <div
      ref={gridRef}
      className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 p-6"
    >
      {products.map((product) => {
        const inCartQty = cart?.get(product.id)?.quantity ?? 0;

        return (
          <div
            key={product.id}
            className="bg-surface rounded-2xl p-4 shadow-lg hover:shadow-xl hover:-translate-y-1 transition-all duration-300 border border-slate-700/50 relative flex flex-col justify-between"
          >
            <div>
              {/* In-cart badge */}
              {inCartQty > 0 && (
                <span className="absolute top-3 right-3 z-10 bg-accent text-white text-[11px] font-bold px-2 py-0.5 rounded-full shadow-lg shadow-accent/30">
                  {inCartQty} in cart
                </span>
              )}

              <div className="aspect-square bg-slate-800 rounded-xl mb-4 overflow-hidden flex items-center justify-center">
                {product.image_url ? (
                  <img
                    src={product.image_url}
                    alt={product.name}
                    className="object-cover w-full h-full"
                  />
                ) : (
                  <span className="text-slate-500 font-medium">No Image</span>
                )}
              </div>
              <div className="flex justify-between items-start mb-2">
                <h3 className="text-lg font-bold text-text truncate pr-2">{product.name}</h3>
                <span className="bg-primary/20 text-primary text-xs px-2 py-1 rounded-full font-semibold whitespace-nowrap">
                  ${product.price.toFixed(2)}
                </span>
              </div>
              <p className="text-sm text-slate-400 line-clamp-2 mb-4">{product.description}</p>
              <div className="flex justify-between items-center text-xs text-slate-500 mb-4">
                <span>{product.category}</span>
                <span>Stock: {product.stock}</span>
              </div>
            </div>

            <div className="space-y-2 mt-auto">
              {isAdmin ? (
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => onEdit?.(product)}
                    className="bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white font-medium py-2 px-3 rounded-lg transition-colors flex items-center justify-center gap-1 text-sm"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                    </svg>
                    Edit
                  </button>
                  <button
                    onClick={() => onDelete?.(product.id)}
                    className="bg-red-500/10 hover:bg-red-500 text-red-400 hover:text-white font-medium py-2 px-3 rounded-lg transition-colors flex items-center justify-center gap-1 text-sm border border-red-500/20"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                    Delete
                  </button>
                </div>
              ) : (
                onAddToCart && (
                  <button
                    id={`add-to-cart-${product.id}`}
                    onClick={() => onAddToCart(product)}
                    disabled={product.stock === 0}
                    className="w-full bg-slate-800 hover:bg-primary hover:text-slate-900 disabled:opacity-40 disabled:cursor-not-allowed text-white font-medium py-2 rounded-lg transition-colors flex items-center justify-center gap-2"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                    </svg>
                    {product.stock === 0 ? 'Out of Stock' : 'Add to Cart'}
                  </button>
                )
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
