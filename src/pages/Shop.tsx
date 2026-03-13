import React, { useState, useEffect } from "react";
import { ShoppingBag, Plus, Minus, Trash2, Loader2, X, ExternalLink } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { useAuth } from "@/hooks/useAuth";
import BottomNav from "@/components/BottomNav";
import DesktopNav from "@/components/DesktopNav";
import MobileHeader from "@/components/MobileHeader";
import { ErrorBoundary } from "@/components/ui/error-boundary";

import imgCrewneck from "@/assets/products/loverball-crewneck-back.png";
import imgHat from "@/assets/products/loverball-corduroy-hat-colors.png";
import imgSocks from "@/assets/products/loverball-socks-new.png";
import imgHoodiePink from "@/assets/products/loverball-hoodie-pink.png";
import imgHatNew from "@/assets/products/loverball-hat-new.png";

const PRODUCT_IMAGE_MAP: Record<string, string> = {
  "Loverball Club Crewneck": imgCrewneck,
  "Loverball Corduroy Hat": imgHat,
  "Loverball Sports Socks": imgSocks,
  "Loverball Hoodie - Pink": imgHoodiePink,
  "Loverball Joggers": imgHatNew
};

const getProductImage = (product: Product): string | null => {
  return PRODUCT_IMAGE_MAP[product.name] || product.image_url;
};

interface Product {
  id: string;
  name: string;
  description: string | null;
  image_url: string | null;
  price: number;
  category: string | null;
  in_stock: boolean | null;
}

interface CartItem {
  id: string;
  product_id: string;
  quantity: number;
  product: Product;
}

const CATEGORIES = ["All", "Apparel", "Accessories", "Headwear"];

const ShopContent = () => {
  const { user } = useAuth();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [cartOpen, setCartOpen] = useState(false);
  const [category, setCategory] = useState("All");
  const [addingToCart, setAddingToCart] = useState<string | null>(null);
  const [checkingOut, setCheckingOut] = useState(false);

  const handleCheckout = async () => {
    if (cartItems.length === 0) return;
    setCheckingOut(true);
    try {
      const items = cartItems.map((ci) => ({
        name: ci.product.name,
        price: ci.product.price,
        quantity: ci.quantity,
        image_url: ci.product.image_url || undefined
      }));

      const { data, error } = await supabase.functions.invoke("create-checkout", {
        body: { items }
      });

      if (error) throw error;
      if (data?.url) {
        window.location.href = data.url;
      } else {
        throw new Error("No checkout URL returned");
      }
    } catch (err: any) {
      toast.error(err.message || "Failed to start checkout");
    } finally {
      setCheckingOut(false);
    }
  };

  useEffect(() => { fetchProducts(); }, []);
  useEffect(() => { if (user) fetchCart(); }, [user]);

  const fetchProducts = async () => {
    try {
      const { data, error } = await supabase.from("products").select("*").order("created_at");
      if (error) throw error;
      setProducts(data || []);
    } catch (err) { /* product fetch error */ }
    finally { setLoading(false); }
  };

  const fetchCart = async () => {
    if (!user) return;
    try {
      const { data, error } = await supabase.from("cart_items").select("id, product_id, quantity").eq("user_id", user.id);
      if (error) throw error;
      const items: CartItem[] = (data || []).map((ci) => ({ ...ci, product: products.find((p) => p.id === ci.product_id)! })).filter((ci) => ci.product);
      setCartItems(items);
    } catch (err) { console.error("Error fetching cart:", err); }
  };

  useEffect(() => { if (user && products.length > 0) fetchCart(); }, [products, user]);

  const addToCart = async (product: Product) => {
    if (!user) { toast.error("Sign in to add items to cart"); return; }
    setAddingToCart(product.id);
    try {
      const existing = cartItems.find((ci) => ci.product_id === product.id);
      if (existing) {
        const { error } = await supabase.from("cart_items").update({ quantity: existing.quantity + 1 }).eq("id", existing.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("cart_items").insert({ user_id: user.id, product_id: product.id, quantity: 1 });
        if (error) throw error;
      }
      await fetchCart();
      toast.success("Added to cart!");
    } catch (err: any) { toast.error(err.message || "Failed to add to cart"); }
    finally { setAddingToCart(null); }
  };

  const updateQuantity = async (itemId: string, newQty: number) => {
    if (newQty < 1) { await removeFromCart(itemId); return; }
    try {
      const { error } = await supabase.from("cart_items").update({ quantity: newQty }).eq("id", itemId);
      if (error) throw error;
      setCartItems((prev) => prev.map((ci) => ci.id === itemId ? { ...ci, quantity: newQty } : ci));
    } catch (err) { console.error("Error updating quantity:", err); }
  };

  const removeFromCart = async (itemId: string) => {
    try {
      const { error } = await supabase.from("cart_items").delete().eq("id", itemId);
      if (error) throw error;
      setCartItems((prev) => prev.filter((ci) => ci.id !== itemId));
      toast.success("Removed from cart");
    } catch (err) { console.error("Error removing from cart:", err); }
  };

  const totalItems = cartItems.reduce((s, i) => s + i.quantity, 0);
  const totalPrice = cartItems.reduce((s, i) => s + i.product.price * i.quantity, 0);
  const filteredProducts = category === "All" ? products : products.filter((p) => p.category === category);

  return (
    <div className="min-h-screen bg-background">
      <MobileHeader /><DesktopNav /><BottomNav />

      <main className="md:ml-64 pt-16 md:pt-0 pb-24 md:pb-0">
        {/* HERO BANNER */}
        <div className="bg-primary text-primary-foreground px-5 md:px-10 py-12 md:py-16">
          <div className="max-w-6xl mx-auto flex items-center justify-between">
            <div>
              <h1 className="font-display text-4xl md:text-5xl font-bold uppercase tracking-tight mb-2">Shop</h1>
              <p className="text-primary-foreground/70 max-w-md text-sm">New Season Collection — Rep the movement.</p>
            </div>
            <Button
              variant="outline"
              size="icon"
              className="relative border-primary-foreground/30 text-primary-foreground hover:bg-primary-foreground/10 bg-transparent rounded-full w-12 h-12"
              onClick={() => setCartOpen(true)}>
              <ShoppingBag className="w-5 h-5" />
              {totalItems > 0 &&
                <Badge className="absolute -top-2 -right-2 h-5 w-5 rounded-full p-0 flex items-center justify-center text-[10px] bg-accent text-accent-foreground">
                  {totalItems}
                </Badge>
              }
            </Button>
          </div>
        </div>

        {/* CART SLIDE-OVER */}
        {cartOpen &&
          <div className="fixed inset-0 z-50 flex justify-end" onClick={() => setCartOpen(false)}>
            <div className="absolute inset-0 bg-black/50" />
            <div className="relative w-full sm:max-w-md bg-background h-full flex flex-col shadow-xl animate-in slide-in-from-right duration-300" onClick={(e) => e.stopPropagation()}>
              <div className="flex items-center justify-between p-4 border-b border-border/20">
                <h2 className="font-display text-xl uppercase">Your Cart ({totalItems})</h2>
                <Button variant="ghost" size="icon" onClick={() => setCartOpen(false)}><X className="w-5 h-5" /></Button>
              </div>
              <div className="flex flex-col flex-1 p-4 min-h-0">
                {cartItems.length === 0 ?
                  <div className="flex-1 flex items-center justify-center">
                    <div className="text-center">
                      <ShoppingBag className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
                      <p className="text-muted-foreground">Your cart is empty</p>
                    </div>
                  </div> :
                  <>
                    <div className="flex-1 overflow-y-auto space-y-4">
                      {cartItems.map((item) =>
                        <div key={item.id} className="flex gap-3 p-3 rounded-xl bg-secondary">
                          {getProductImage(item.product) &&
                            <img src={getProductImage(item.product)!} alt={item.product.name} className="w-16 h-16 rounded-lg object-contain bg-white p-1" />
                          }
                          <div className="flex-1 min-w-0">
                            <p className="font-semibold text-sm truncate">{item.product.name}</p>
                            <p className="font-bold text-sm mt-1 text-primary">${item.product.price.toFixed(2)}</p>
                          </div>
                          <div className="flex flex-col items-end gap-2">
                            <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => removeFromCart(item.id)}><Trash2 className="w-3 h-3" /></Button>
                            <div className="flex items-center gap-1">
                              <Button variant="outline" size="icon" className="h-6 w-6" onClick={() => updateQuantity(item.id, item.quantity - 1)}><Minus className="w-3 h-3" /></Button>
                              <span className="w-6 text-center text-xs">{item.quantity}</span>
                              <Button variant="outline" size="icon" className="h-6 w-6" onClick={() => updateQuantity(item.id, item.quantity + 1)}><Plus className="w-3 h-3" /></Button>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                    <div className="pt-4 border-t border-border/20 space-y-3">
                      <div className="flex justify-between items-center">
                        <span className="font-semibold">Total</span>
                        <span className="font-bold text-lg">${totalPrice.toFixed(2)}</span>
                      </div>
                      <Button className="w-full rounded-full bg-accent text-accent-foreground" size="lg" disabled={checkingOut} onClick={handleCheckout}>
                        {checkingOut ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Creating Checkout…</> : <><ExternalLink className="w-4 h-4 mr-2" />Checkout — ${totalPrice.toFixed(2)}</>}
                      </Button>
                    </div>
                  </>
                }
              </div>
            </div>
          </div>
        }

        {/* CATEGORY FILTER */}
        <div className="max-w-6xl mx-auto px-5 md:px-10 pt-6 pb-2">
          <div className="flex gap-2">
            {CATEGORIES.map((c) =>
              <button
                key={c}
                onClick={() => setCategory(c)}
                className={`px-5 py-2 rounded-full text-sm font-semibold whitespace-nowrap transition-all ${
                  category === c 
                    ? "bg-foreground text-background" 
                    : "border border-foreground/20 text-foreground hover:bg-secondary"
                }`}
              >
                {c}
              </button>
            )}
          </div>
        </div>

        {/* PRODUCT GRID */}
        <div className="max-w-6xl mx-auto px-5 md:px-10 py-6">
          {loading ?
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
              {[...Array(8)].map((_, i) =>
                <Card key={i} className="overflow-hidden animate-pulse">
                  <div className="aspect-square bg-secondary" />
                  <CardContent className="p-4 space-y-2">
                    <div className="h-4 bg-secondary rounded w-3/4" />
                    <div className="h-4 bg-secondary rounded w-1/2" />
                  </CardContent>
                </Card>
              )}
            </div> :
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
              {filteredProducts.map((product) =>
                <Card key={product.id} className="overflow-hidden group cursor-pointer hover:shadow-lg transition-all">
                  <div className="relative aspect-square overflow-hidden">
                    {getProductImage(product) ?
                      <img src={getProductImage(product)!} alt={product.name} className="w-full h-full object-contain bg-secondary p-4 group-hover:scale-105 transition-transform duration-500" loading="lazy" /> :
                      <div className="w-full h-full bg-secondary flex items-center justify-center">
                        <ShoppingBag className="w-10 h-10 text-muted-foreground/30" />
                      </div>
                    }
                    {!product.in_stock &&
                      <Badge className="absolute top-2 left-2 bg-muted-foreground text-white text-[10px] font-semibold rounded-full">Sold Out</Badge>
                    }
                    {product.category &&
                      <Badge className="absolute top-2 right-2 bg-foreground/70 text-background text-[10px] rounded-full">{product.category}</Badge>
                    }
                  </div>
                  <CardContent className="p-4">
                    <h3 className="font-semibold text-sm line-clamp-2">{product.name}</h3>
                    {product.description &&
                      <p className="text-xs text-muted-foreground line-clamp-1 mt-1">{product.description}</p>
                    }
                    <p className="text-primary font-bold mt-2">${product.price.toFixed(2)}</p>
                    <Button
                      size="sm"
                      className="w-full rounded-full mt-3 text-xs bg-accent text-accent-foreground"
                      disabled={!product.in_stock || addingToCart === product.id}
                      onClick={(e) => { e.stopPropagation(); addToCart(product); }}>
                      {addingToCart === product.id ? <Loader2 className="w-3 h-3 animate-spin" /> : !product.in_stock ? "Sold Out" : "Add to Cart"}
                    </Button>
                  </CardContent>
                </Card>
              )}
            </div>
          }
        </div>
      </main>
    </div>
  );
};

const Shop = () => <ErrorBoundary><ShopContent /></ErrorBoundary>;

export default Shop;
