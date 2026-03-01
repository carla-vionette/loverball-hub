import { useState, useEffect } from "react";
import { ShoppingBag, Plus, Minus, Trash2, ExternalLink, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { toast } from "sonner";
import BottomNav from "@/components/BottomNav";
import DesktopNav from "@/components/DesktopNav";
import MobileHeader from "@/components/MobileHeader";
import { useCartStore } from "@/stores/cartStore";
import { getProducts } from "@/lib/shopify";
import type { ShopifyProduct } from "@/lib/shopify";

const SAMPLE = [
  { id: "p1", title: "Loverball Club Crewneck", price: "$65", image: "/lovable-uploads/08d4e8e3-8246-43ed-aba5-3a1f21621cab.jpg", tag: "Best Seller" },
  { id: "p2", title: "Loverball Corduroy Hat", price: "$38", image: "/lovable-uploads/1146599d-2e17-4a36-a8ec-64fddec187a0.png", tag: "New" },
  { id: "p3", title: "Loverball Sports Socks", price: "$18", image: "/images/all-stars-event.jpg", tag: null },
  { id: "p4", title: "Loverball Logo Chain", price: "$45", image: "/images/la28-olympics-mixer.jpg", tag: "Limited" },
  { id: "p5", title: "Loverball Hoodie - Pink", price: "$78", image: "/images/women-panel-event.jpg", tag: null },
  { id: "p6", title: "Loverball Jersey", price: "$55", image: "/images/reggaeton-superbowl-party.jpg", tag: "New" },
];

const Shop = () => {
  const [products, setProducts] = useState<ShopifyProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [usingSample, setUsingSample] = useState(false);
  const { items, isLoading, addItem, updateQuantity, removeItem, checkoutUrl, createCheckout } = useCartStore();

  const totalItems = items.reduce((s, i) => s + i.quantity, 0);
  const totalPrice = items.reduce((s, i) => s + parseFloat(i.price.amount) * i.quantity, 0);

  useEffect(() => {
    (async () => {
      try {
        const edges = await getProducts(20);
        if (edges.length > 0) setProducts(edges);
        else setUsingSample(true);
      } catch (e) {
        console.error("Failed to fetch Shopify products:", e);
        setUsingSample(true);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const addToCart = async (p: ShopifyProduct) => {
    const v = p.node.variants.edges[0]?.node;
    if (!v) return;
    await addItem({ product: p, variantId: v.id, variantTitle: v.title, price: v.price, quantity: 1, selectedOptions: v.selectedOptions || [] });
    toast.success("Added to cart!");
  };

  const checkout = async () => {
    if (!checkoutUrl) await createCheckout();
    const url = useCartStore.getState().checkoutUrl;
    if (url) window.open(url, "_blank");
  };

  const SkeletonGrid = () => (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
      {[...Array(8)].map((_, i) => (
        <Card key={i} className="overflow-hidden border-border/30 animate-pulse">
          <div className="aspect-square bg-secondary/30" />
          <CardContent className="p-4 space-y-2">
            <div className="h-4 bg-secondary/30 rounded w-3/4" />
            <div className="h-4 bg-secondary/30 rounded w-1/2" />
          </CardContent>
        </Card>
      ))}
    </div>
  );

  return (
    <div className="min-h-screen bg-background">
      <MobileHeader /><DesktopNav /><BottomNav />

      <main className="md:ml-64 pt-16 md:pt-0 pb-24 md:pb-0">
        {/* DARK BANNER */}
        <div className="bg-gradient-to-r from-foreground via-foreground/90 to-primary/80 text-primary-foreground px-5 md:px-10 py-12 md:py-16">
          <div className="max-w-6xl mx-auto flex items-center justify-between">
            <div>
              <h1 className="font-condensed text-4xl md:text-5xl font-bold uppercase tracking-tight mb-2">The Shop</h1>
              <p className="text-primary-foreground/70 max-w-md font-sans">Rep the movement. Loverball merch for women who love sports.</p>
            </div>
            <Sheet>
              <SheetTrigger asChild>
                <Button variant="outline" size="icon" className="relative border-primary-foreground/30 text-primary-foreground hover:bg-primary-foreground/10 bg-transparent rounded-full w-12 h-12">
                  <ShoppingBag className="w-5 h-5" />
                  {totalItems > 0 && (
                    <Badge className="absolute -top-2 -right-2 h-5 w-5 rounded-full p-0 flex items-center justify-center text-[10px] bg-primary text-primary-foreground">
                      {totalItems}
                    </Badge>
                  )}
                </Button>
              </SheetTrigger>
              <SheetContent className="w-full sm:max-w-md flex flex-col h-full">
                <SheetHeader>
                  <SheetTitle className="font-condensed text-xl uppercase">Your Cart</SheetTitle>
                </SheetHeader>
                <div className="flex flex-col flex-1 pt-4 min-h-0">
                  {items.length === 0 ? (
                    <div className="flex-1 flex items-center justify-center">
                      <div className="text-center">
                        <ShoppingBag className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
                        <p className="text-muted-foreground font-sans">Your cart is empty</p>
                      </div>
                    </div>
                  ) : (
                    <>
                      <div className="flex-1 overflow-y-auto space-y-4">
                        {items.map(item => (
                          <div key={item.variantId} className="flex gap-3 p-3 rounded-xl bg-secondary/30">
                            {item.product.node.images?.edges?.[0]?.node && (
                              <img src={item.product.node.images.edges[0].node.url} alt="" className="w-16 h-16 rounded-lg object-cover" />
                            )}
                            <div className="flex-1 min-w-0">
                              <p className="font-semibold text-sm truncate font-sans">{item.product.node.title}</p>
                              <p className="text-xs text-muted-foreground font-sans">{item.selectedOptions.map(o => o.value).join(" · ")}</p>
                              <p className="font-bold text-sm mt-1 font-sans">${parseFloat(item.price.amount).toFixed(2)}</p>
                            </div>
                            <div className="flex flex-col items-end gap-2">
                              <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => removeItem(item.variantId)}><Trash2 className="w-3 h-3" /></Button>
                              <div className="flex items-center gap-1">
                                <Button variant="outline" size="icon" className="h-6 w-6" onClick={() => updateQuantity(item.variantId, item.quantity - 1)}><Minus className="w-3 h-3" /></Button>
                                <span className="w-6 text-center text-xs font-sans">{item.quantity}</span>
                                <Button variant="outline" size="icon" className="h-6 w-6" onClick={() => updateQuantity(item.variantId, item.quantity + 1)}><Plus className="w-3 h-3" /></Button>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                      <div className="pt-4 border-t space-y-3">
                        <div className="flex justify-between items-center">
                          <span className="font-semibold font-sans">Total</span>
                          <span className="font-bold text-lg font-sans">${totalPrice.toFixed(2)}</span>
                        </div>
                        <Button className="w-full rounded-full" size="lg" onClick={checkout} disabled={isLoading}>
                          {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <><ExternalLink className="w-4 h-4 mr-2" />Checkout with Shopify</>}
                        </Button>
                      </div>
                    </>
                  )}
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>

        {/* PRODUCT GRID */}
        <div className="max-w-6xl mx-auto px-5 md:px-10 py-8">
          {loading ? <SkeletonGrid /> : usingSample ? (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
              {SAMPLE.map(p => (
                <Card key={p.id} className="overflow-hidden group cursor-pointer hover:shadow-lg transition-all border-border/30">
                  <div className="relative aspect-square overflow-hidden">
                    <img src={p.image} alt={p.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                    {p.tag && <Badge className="absolute top-2 left-2 bg-primary text-primary-foreground text-[10px] font-bold rounded-sm">{p.tag}</Badge>}
                  </div>
                  <CardContent className="p-4">
                    <h3 className="font-bold text-sm line-clamp-2 font-sans">{p.title}</h3>
                    <p className="text-primary font-bold mt-1 font-sans">{p.price}</p>
                    <Button size="sm" className="w-full rounded-full mt-3 text-xs" disabled>Coming Soon</Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
              {products.map(p => {
                const img = p.node.images?.edges?.[0]?.node;
                const price = p.node.priceRange.minVariantPrice;
                return (
                  <Card key={p.node.id} className="overflow-hidden group cursor-pointer hover:shadow-lg transition-all border-border/30">
                    <div className="relative aspect-square overflow-hidden">
                      {img && <img src={img.url} alt={img.altText || p.node.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />}
                    </div>
                    <CardContent className="p-4">
                      <h3 className="font-bold text-sm line-clamp-2 font-sans">{p.node.title}</h3>
                      <p className="text-primary font-bold mt-1 font-sans">${parseFloat(price.amount).toFixed(2)}</p>
                      <Button size="sm" className="w-full rounded-full mt-3 text-xs" onClick={e => { e.stopPropagation(); addToCart(p); }} disabled={isLoading}>
                        {isLoading ? <Loader2 className="w-3 h-3 animate-spin" /> : "Add to Cart"}
                      </Button>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default Shop;
