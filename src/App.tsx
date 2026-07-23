import { useState, useCallback, useEffect } from 'react';
import { SearchBar } from './components/SearchBar';
import { ProductGrid } from './components/ProductGrid';
import { CheckoutModal } from './components/CheckoutModal';
import { ProductModal } from './components/ProductModal';
import { AddToCartModal } from './components/AddToCartModal';
import type { Product, CartItem } from './types';
import { api } from './api';

const HOMEPAGE_LIMIT = 10;

function App() {
  // ── Homepage browse state ─────────────────────────────────────────────────
  const [homepageProducts, setHomepageProducts] = useState<Product[]>([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalProducts, setTotalProducts] = useState(0);
  const [isLoadingHomepage, setIsLoadingHomepage] = useState(true);

  // ── Search state ──────────────────────────────────────────────────────────
  const [searchResults, setSearchResults] = useState<Product[]>([]);
  const [isLoadingSearch, setIsLoadingSearch] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // ── Cart & modal state ────────────────────────────────────────────────────
  const [cart, setCart] = useState<Map<string, CartItem>>(new Map());
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [cartLoaded, setCartLoaded] = useState(false);
  const [pendingProduct, setPendingProduct] = useState<Product | null>(null);

  // ── Admin Mode state ──────────────────────────────────────────────────────
  const [isAdmin, setIsAdmin] = useState(false);
  const [isProductModalOpen, setIsProductModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);

  // ── Load persisted cart from Redis on first mount ─────────────────────────
  useEffect(() => {
    api.getCart().then((items) => {
      if (items.length > 0) {
        const map = new Map(items.map((item) => [item.product.id, item]));
        setCart(map);
      }
    }).catch(console.error).finally(() => {
      setCartLoaded(true);
    });
  }, []);

  // ── Fetch homepage products helper ────────────────────────────────────────
  const fetchHomepageProducts = useCallback((targetPage: number) => {
    setIsLoadingHomepage(true);
    api.getAllProducts(targetPage, HOMEPAGE_LIMIT).then((res) => {
      setHomepageProducts(res.data);
      setTotalPages(res.pagination.total_pages);
      setTotalProducts(res.pagination.total);
      setIsLoadingHomepage(false);
    }).catch(console.error);
  }, []);

  // Fetch whenever page changes
  useEffect(() => {
    fetchHomepageProducts(page);
  }, [page, fetchHomepageProducts]);

  // ── Auto-save cart to Redis (debounced 800ms) ─────────────────────────────
  useEffect(() => {
    if (!cartLoaded) return;
    const timer = setTimeout(() => {
      api.saveCart(Array.from(cart.values())).catch(console.error);
    }, 800);
    return () => clearTimeout(timer);
  }, [cart, cartLoaded]);

  // ── Search ────────────────────────────────────────────────────────────────
  const handleSearch = useCallback(async (query: string) => {
    setSearchQuery(query);
    if (!query) {
      setSearchResults([]);
      setHasSearched(false);
      return;
    }
    setIsLoadingSearch(true);
    setHasSearched(true);
    const results = await api.searchProducts(query);
    setSearchResults(results);
    setIsLoadingSearch(false);
  }, []);

  // ── Cart actions ──────────────────────────────────────────────────────────
  const openAddToCart = useCallback((product: Product) => {
    setPendingProduct(product);
  }, []);

  const addToCart = useCallback((product: Product, quantity: number) => {
    setCart((prev) => {
      const next = new Map(prev);
      const existing = next.get(product.id);
      next.set(product.id, {
        product,
        quantity: existing ? existing.quantity + quantity : quantity,
      });
      return next;
    });
  }, []);

  const clearCart = useCallback(() => {
    if (!window.confirm('Remove all items from your cart?')) return;
    setCart(new Map());
    api.deleteCart().catch(console.error);
  }, []);

  const cartItems = Array.from(cart.values());
  const cartCount = cartItems.reduce((sum, item) => sum + item.quantity, 0);

  const handleCheckout = useCallback(async () => {
    const { success, errors } = await api.createOrder(cartItems);
    if (success) {
      setCart(new Map());
      api.deleteCart().catch(console.error);
    } else {
      console.error('Some orders failed:', errors);
      if (errors.length < cartItems.length) {
        setCart(new Map());
        api.deleteCart().catch(console.error);
      }
      throw new Error(errors.join('; '));
    }
  }, [cartItems]);

  // ── Admin Actions ─────────────────────────────────────────────────────────
  const handleAddClick = () => {
    setEditingProduct(null);
    setIsProductModalOpen(true);
  };

  const handleEditClick = (product: Product) => {
    setEditingProduct(product);
    setIsProductModalOpen(true);
  };

  const handleDeleteClick = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this product?')) return;

    try {
      await api.deleteProduct(id);
      
      // Update UI state immediately to feel snappy
      setHomepageProducts((prev) => prev.filter((p) => p.id !== id));
      setSearchResults((prev) => prev.filter((p) => p.id !== id));
      setTotalProducts((prev) => Math.max(0, prev - 1));

      // Refresh list from server to get correct pagination fill
      setTimeout(() => {
        fetchHomepageProducts(page);
        if (hasSearched) {
          handleSearch(searchQuery);
        }
      }, 500);
    } catch (err: any) {
      alert(err.message || 'Failed to delete product');
    }
  };

  const handleSaveProduct = async (productData: Omit<Product, 'id'>, id?: string) => {
    if (id) {
      // Edit mode
      await api.updateProduct(id, productData);
      
      // Refresh current data
      fetchHomepageProducts(page);
      if (hasSearched) {
        handleSearch(searchQuery);
      }
    } else {
      // Create mode
      await api.createProduct(productData);
      
      // Go to first page to see the newly created product (newest first)
      setPage(1);
      fetchHomepageProducts(1);
      if (hasSearched) {
        handleSearch(searchQuery);
      }
    }
  };

  // ── Pagination helpers ────────────────────────────────────────────────────
  const goToPage = (next: number) => {
    if (next < 1 || next > totalPages) return;
    setPage(next);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Decide what to show in the main content area
  const showSearchResults = hasSearched;
  const displayProducts   = showSearchResults ? searchResults : homepageProducts;
  const isLoading         = showSearchResults ? isLoadingSearch : isLoadingHomepage;

  return (
    <div className="min-h-screen bg-background text-text font-sans pb-12">
      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <header className="sticky top-0 z-40 w-full backdrop-blur-xl bg-background/80 border-b border-slate-800">
        <div className="container mx-auto px-4 h-20 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center shadow-lg shadow-primary/20">
              <span className="font-black text-xl text-slate-900">E</span>
            </div>
            <h1 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-primary to-accent">
              ShopSync
            </h1>
          </div>

          <div className="flex-1 max-w-xl mx-8 hidden md:block">
            <SearchBar onSearch={handleSearch} />
          </div>

          <div className="flex items-center gap-4">
            {/* Admin Toggle */}
            <div className="flex items-center gap-2 bg-slate-800/40 px-3 py-1.5 rounded-full border border-slate-700/50">
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Admin</span>
              <button
                id="admin-toggle"
                onClick={() => setIsAdmin(!isAdmin)}
                className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                  isAdmin ? 'bg-primary' : 'bg-slate-700'
                }`}
                aria-label="Toggle admin mode"
              >
                <span
                  className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                    isAdmin ? 'translate-x-5' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>

            {isAdmin && (
              <button
                id="add-product-button"
                onClick={handleAddClick}
                className="bg-primary hover:bg-primary/95 text-slate-900 font-bold px-4 py-2 rounded-xl text-sm transition-all shadow-lg shadow-primary/10 flex items-center gap-1.5"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M12 4v16m8-8H4" />
                </svg>
                Add Product
              </button>
            )}

            <button
              id="cart-button"
              onClick={() => setIsCheckoutOpen(true)}
              className="relative p-3 rounded-full hover:bg-slate-800 transition-colors group"
              aria-label={`Cart (${cartCount} items)`}
            >
              <svg className="w-6 h-6 text-slate-300 group-hover:text-primary transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
              {cartCount > 0 && (
                <span className="absolute top-1 right-1 bg-accent text-white text-[10px] font-bold w-5 h-5 rounded-full flex items-center justify-center animate-pulse shadow-lg shadow-accent/50">
                  {cartCount}
                </span>
              )}
            </button>
          </div>
        </div>

        {/* Mobile search */}
        <div className="md:hidden border-t border-slate-800 pb-2">
          <SearchBar onSearch={handleSearch} />
        </div>
      </header>

      {/* ── Main ───────────────────────────────────────────────────────────── */}
      <main className="container mx-auto px-4 py-8">

        {/* Section heading */}
        <div className="flex items-center justify-between px-6 mb-2">
          {showSearchResults ? (
            <h2 className="text-xl font-medium text-slate-300">Search Results</h2>
          ) : (
            <div className="flex items-baseline gap-3">
              <h2 className="text-xl font-medium text-slate-300">All Products</h2>
              {!isLoadingHomepage && (
                <span className="text-sm text-slate-500">{totalProducts} items</span>
              )}
            </div>
          )}
        </div>

        {/* Content */}
        {isLoading ? (
          <div className="flex justify-center items-center min-h-[50vh]">
            <div className="w-12 h-12 border-4 border-slate-700 border-t-primary rounded-full animate-spin" />
          </div>
        ) : (
          <>
            {/* Product grid */}
            <ProductGrid
              products={displayProducts}
              onOpenAddToCart={openAddToCart}
              cart={cart}
              isAdmin={isAdmin}
              onEdit={handleEditClick}
              onDelete={handleDeleteClick}
            />

            {/* Pagination — only shown on homepage browse, not search results */}
            {!showSearchResults && totalPages > 1 && (
              <div className="flex items-center justify-center gap-2 mt-10 pb-4">
                {/* Prev */}
                <button
                  id="prev-page-button"
                  onClick={() => goToPage(page - 1)}
                  disabled={page === 1}
                  className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 disabled:opacity-30 disabled:cursor-not-allowed text-slate-300 text-sm font-medium transition-colors"
                >
                  ← Prev
                </button>

                {/* Page numbers — show up to 5 around current page */}
                {Array.from({ length: totalPages }, (_, i) => i + 1)
                  .filter((p) => p === 1 || p === totalPages || Math.abs(p - page) <= 2)
                  .reduce<(number | '…')[]>((acc, p, idx, arr) => {
                    if (idx > 0 && p - (arr[idx - 1] as number) > 1) acc.push('…');
                    acc.push(p);
                    return acc;
                  }, [])
                  .map((item, idx) =>
                    item === '…' ? (
                      <span key={`ellipsis-${idx}`} className="px-2 text-slate-500 text-sm select-none">…</span>
                    ) : (
                      <button
                        key={item}
                        id={`page-${item}-button`}
                        onClick={() => goToPage(item as number)}
                        className={`w-9 h-9 rounded-lg text-sm font-semibold transition-all ${
                          page === item
                            ? 'bg-primary text-slate-900 shadow-lg shadow-primary/20 scale-105'
                            : 'bg-slate-800 hover:bg-slate-700 text-slate-300'
                        }`}
                      >
                        {item}
                      </button>
                    )
                  )}

                {/* Next */}
                <button
                  id="next-page-button"
                  onClick={() => goToPage(page + 1)}
                  disabled={page === totalPages}
                  className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 disabled:opacity-30 disabled:cursor-not-allowed text-slate-300 text-sm font-medium transition-colors"
                >
                  Next →
                </button>
              </div>
            )}
          </>
        )}
      </main>

      <CheckoutModal
        isOpen={isCheckoutOpen}
        onClose={() => setIsCheckoutOpen(false)}
        cartItems={cartItems}
        onCheckout={handleCheckout}
        onClearCart={clearCart}
      />

      <ProductModal
        isOpen={isProductModalOpen}
        onClose={() => setIsProductModalOpen(false)}
        product={editingProduct}
        onSave={handleSaveProduct}
      />

      <AddToCartModal
        product={pendingProduct}
        onClose={() => setPendingProduct(null)}
        onConfirm={(product, qty) => addToCart(product, qty)}
      />
    </div>
  );
}

export default App;
