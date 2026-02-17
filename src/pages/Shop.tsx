import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import DesktopNav from "@/components/DesktopNav";
import BottomNav from "@/components/BottomNav";
import MobileHeader from "@/components/MobileHeader";
import { CartDrawer } from "@/components/CartDrawer";
import { getProducts, ShopifyProduct } from "@/lib/shopify";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useCartStore } from "@/stores/cartStore";
import { toast } from "sonner";
import { Loader2, ShoppingBag, Heart, Truck, Gift, Eye, Star } from "lucide-react";
import loverballLogo from "@/assets/loverball-script-logo.png";
import PageError from "@/components/PageError";
import PageSkeleton from "@/components/PageSkeleton";
import { ErrorBoundary } from "@/components/ui/error-boundary";
import { trackShopFunnel, trackContentView } from "@/lib/analytics";

const COLLECTIONS = [
{ id: "all", label: "All" },
{ id: "game-day", label: "Game Day" },
{ id: "athleisure", label: "Athleisure" },
{ id: "accessories", label: "Accessories" }];


// Simulated view counts for social proof
const getViewCount = (productId: string) => {
  const hash = productId.split('').reduce((a, b) => {a = (a << 5) - a + b.charCodeAt(0);return a & a;}, 0);
  return Math.abs(hash % 40) + 12;
};

const Shop = () => {
  const [products, setProducts] = useState<ShopifyProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [wishlist, setWishlist] = useState<Set<string>>(() => {
    const saved = localStorage.getItem('loverball-wishlist');
    return saved ? new Set(JSON.parse(saved)) : new Set();
  });
  const [activeCollection, setActiveCollection] = useState("all");
  const addItem = useCartStore((state) => state.addItem);

  const [selectedVariants, setSelectedVariants] = useState<Record<string, string>>({});

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        setFetchError(null);
        const data = await getProducts(20);
        const seenTitles = new Set<string>();
        const uniqueProducts = data.filter((product) => {
          const titleLower = product.node.title.toLowerCase();
          if (seenTitles.has(titleLower)) return false;
          seenTitles.add(titleLower);
          return true;
        });
        setProducts(uniqueProducts);

        const initialVariants: Record<string, string> = {};
        uniqueProducts.forEach((product) => {
          if (product.node.variants.edges.length > 0) {
            initialVariants[product.node.id] = product.node.variants.edges[0].node.id;
          }
        });
        setSelectedVariants(initialVariants);
      } catch (error: any) {
        console.error('Error fetching products:', error);
        setFetchError(error?.message || "Failed to load products");
        toast.error("Failed to load products");
      } finally {
        setLoading(false);
      }
    };
    fetchProducts();
  }, []);

  useEffect(() => {
    localStorage.setItem('loverball-wishlist', JSON.stringify([...wishlist]));
  }, [wishlist]);

  const toggleWishlist = (productId: string) => {
    setWishlist((prev) => {
      const next = new Set(prev);
      if (next.has(productId)) {
        next.delete(productId);
        toast("Removed from wishlist");
      } else {
        next.add(productId);
        toast.success("Saved to wishlist ♡");
      }
      return next;
    });
  };

  const getSelectedVariant = (product: ShopifyProduct) => {
    const selectedVariantId = selectedVariants[product.node.id];
    return product.node.variants.edges.find((v) => v.node.id === selectedVariantId)?.node ||
    product.node.variants.edges[0]?.node;
  };

  const handleVariantChange = (productId: string, variantId: string) => {
    setSelectedVariants((prev) => ({ ...prev, [productId]: variantId }));
  };

  const handleAddToCart = (product: ShopifyProduct) => {
    const variant = getSelectedVariant(product);
    if (!variant) return;

    addItem({
      product,
      variantId: variant.id,
      variantTitle: variant.title,
      price: variant.price,
      quantity: 1,
      selectedOptions: variant.selectedOptions
    });
    trackShopFunnel("add_to_cart", product.node.id, product.node.title, variant.price.amount);
    toast.success("Added to cart", {
      description: `${product.node.title} has been added to your cart`
    });
  };

  const hasVariants = (product: ShopifyProduct) => {
    const variants = product.node.variants.edges;
    return variants.length > 1 || variants.length === 1 && variants[0].node.title !== "Default Title";
  };

  // Simple collection filter based on product type/tags
  const filteredProducts = activeCollection === "all" ?
  products :
  products.filter((p) => {
    const title = p.node.title.toLowerCase();
    const desc = p.node.description?.toLowerCase() || '';
    if (activeCollection === "accessories") return title.includes('hat') || title.includes('chain') || title.includes('socks') || title.includes('tote');
    if (activeCollection === "game-day") return title.includes('jersey') || title.includes('crewneck') || title.includes('hoodie');
    if (activeCollection === "athleisure") return title.includes('tshirt') || title.includes('hoodie') || title.includes('crewneck') || desc.includes('casual');
    return true;
  });

  const wishlistProducts = products.filter((p) => wishlist.has(p.node.id));

  const isCommunityFavorite = (product: ShopifyProduct) => {
    return getViewCount(product.node.id) > 35;
  };

  return (
    <div className="min-h-screen bg-background pb-20 md:pb-0 md:pl-64">
      <DesktopNav />
      <MobileHeader />
      
      <main className="container mx-auto px-4 py-8">
        {/* Hero Section */}
        <div className="flex flex-col items-center text-center mb-8">
          <img src={loverballLogo} alt="Loverball" className="h-28 md:h-36 w-auto mb-6" />
          


          <h1 className="text-4xl md:text-5xl font-sans font-normal mb-3">Boutique</h1>
          <p className="text-muted-foreground text-lg max-w-md">Official Loverball merchandise and gear for women who love sports</p>
        </div>

        {/* Shipping & Gift Banner */}
        <div className="flex flex-wrap items-center justify-center gap-4 md:gap-8 mb-8 py-4 px-6 bg-card rounded-2xl border border-border/50">
          <div className="flex items-center gap-2 text-sm">
            <Truck className="h-4 w-4 text-primary" />
            <span><strong>Free shipping</strong> on orders $75+</span>
          </div>
          <div className="hidden md:block w-px h-5 bg-border" />
          <div className="flex items-center gap-2 text-sm">
            <Gift className="h-4 w-4 text-coral" />
            <span><strong>Gift wrapping</strong> available at checkout</span>
          </div>
          <div className="hidden md:block w-px h-5 bg-border" />
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            Ships in 3-5 business days
          </div>
        </div>

        {/* Desktop Cart */}
        <div className="hidden md:flex justify-end mb-4">
          <CartDrawer />
        </div>
        
        {/* Fixed cart button for mobile */}
        <div className="md:hidden fixed top-4 right-4 z-50">
          <CartDrawer />
        </div>

        {/* Collection Tabs */}
        <Tabs value={activeCollection} onValueChange={setActiveCollection} className="mb-8">
          <TabsList className="w-full justify-start overflow-x-auto bg-transparent gap-2 h-auto p-0">
            {COLLECTIONS.map((col) =>
            <TabsTrigger
              key={col.id}
              value={col.id}
              className="rounded-full px-5 py-2 text-sm data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">

                {col.label}
              </TabsTrigger>
            )}
            {wishlistProducts.length > 0 &&
            <TabsTrigger
              value="wishlist"
              className="rounded-full px-5 py-2 text-sm data-[state=active]:bg-coral data-[state=active]:text-coral-foreground">

                <Heart className="h-3.5 w-3.5 mr-1.5" />
                Saved ({wishlistProducts.length})
              </TabsTrigger>
            }
          </TabsList>
        </Tabs>

        {loading ?
        <PageSkeleton variant="cards" count={8} /> :
        fetchError ?
        <PageError
          variant={!navigator.onLine ? "network" : "generic"}
          message={fetchError}
          onRetry={() => {setLoading(true);setFetchError(null);window.location.reload();}} /> :

        products.length === 0 ?
        <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center mb-6">
              <ShoppingBag className="h-10 w-10 text-primary" />
            </div>
            <h2 className="text-2xl font-sans mb-3">Shop coming soon</h2>
            <p className="text-muted-foreground max-w-md mb-6">
              We're curating the best Loverball merchandise. Check back soon for exclusive drops!
            </p>
            <Button variant="outline" className="rounded-full" onClick={() => window.location.reload()}>
              Refresh
            </Button>
          </div> :

        <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-6">
            {(activeCollection === "wishlist" ? wishlistProducts : filteredProducts).map((product) => {
            const { node } = product;
            const image = node.images.edges[0]?.node;
            const selectedVariant = getSelectedVariant(product);
            const price = selectedVariant?.price || node.priceRange.minVariantPrice;
            const showVariantSelector = hasVariants(product);
            const viewCount = getViewCount(node.id);
            const isWishlisted = wishlist.has(node.id);
            const isFavorite = isCommunityFavorite(product);

            return (
              <Card key={node.id} className="overflow-hidden hover:shadow-xl transition-all duration-300 rounded-2xl border-border/50 group bg-card relative">
                  {/* Wishlist heart */}
                  <button
                  onClick={(e) => {e.preventDefault();toggleWishlist(node.id);}}
                  className="absolute top-3 right-3 z-10 p-2 rounded-full bg-background/80 backdrop-blur-sm hover:bg-background transition-colors">

                    <Heart className={`h-4 w-4 transition-colors ${isWishlisted ? 'fill-coral text-coral' : 'text-muted-foreground'}`} />
                  </button>

                  {/* Community Favorites Badge */}
                  {isFavorite &&
                <div className="absolute top-3 left-3 z-10">
                      <Badge className="bg-accent text-accent-foreground text-[10px] font-bold px-2 py-0.5 gap-1">
                        <Star className="h-3 w-3 fill-current" />
                        Community Favorite
                      </Badge>
                    </div>
                }

                  <Link to={`/product/${node.handle}`}>
                    <div className="aspect-square overflow-hidden bg-gradient-to-br from-secondary/30 to-muted/30">
                      {image ?
                    <img
                      src={image.url}
                      alt={image.altText || node.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" /> :


                    <div className="w-full h-full flex items-center justify-center">
                          <ShoppingBag className="h-12 w-12 md:h-16 md:w-16 text-muted-foreground/50" />
                        </div>
                    }
                    </div>
                  </Link>
                  
                  <CardContent className="pt-4 md:pt-5 px-3 md:px-6">
                    <Link to={`/product/${node.handle}`}>
                      <h3 className="font-sans font-semibold text-sm md:text-lg mb-1 md:mb-2 hover:text-primary transition-colors line-clamp-2">
                        {node.title}
                      </h3>
                    </Link>
                    <p className="text-lg md:text-2xl font-medium text-primary mb-2">
                      ${parseFloat(price.amount).toFixed(2)}
                    </p>

                    {/* Social proof */}
                    <div className="flex items-center gap-1 text-xs text-muted-foreground mb-3">
                      <Eye className="h-3 w-3" />
                      <span>{viewCount} people viewed today</span>
                    </div>
                    
                    {showVariantSelector &&
                  <Select
                    value={selectedVariants[node.id] || node.variants.edges[0]?.node.id}
                    onValueChange={(value) => handleVariantChange(node.id, value)}>

                        <SelectTrigger className="w-full h-9 text-xs md:text-sm">
                          <SelectValue placeholder="Select size" />
                        </SelectTrigger>
                        <SelectContent>
                          {node.variants.edges.map((variantEdge) =>
                      <SelectItem
                        key={variantEdge.node.id}
                        value={variantEdge.node.id}
                        disabled={!variantEdge.node.availableForSale}>

                              {variantEdge.node.title}
                              {!variantEdge.node.availableForSale && " (Sold out)"}
                            </SelectItem>
                      )}
                        </SelectContent>
                      </Select>
                  }
                  </CardContent>
                  
                  <CardFooter className="pt-0 px-3 md:px-6 pb-4 md:pb-6">
                    <Button
                    onClick={() => handleAddToCart(product)}
                    className="w-full rounded-full text-xs md:text-sm"
                    size="sm"
                    disabled={selectedVariant && !selectedVariant.availableForSale}>

                      {selectedVariant?.availableForSale === false ? 'Sold Out' : 'Add to Cart'}
                    </Button>
                  </CardFooter>
                </Card>);

          })}
          </div>
        }

        {/* Gift Card CTA */}
        <div className="mt-16 text-center py-12 px-6 bg-card rounded-2xl border border-border/50">
          <Gift className="h-10 w-10 text-coral mx-auto mb-4" />
          <h2 className="text-2xl font-sans font-semibold mb-2">Give the Gift of Loverball</h2>
          <p className="text-muted-foreground mb-6 max-w-md mx-auto">
            Digital gift cards for the sports-loving women in your life. Available in $25, $50, and $100.
          </p>
          <div className="flex gap-3 justify-center flex-wrap">
            <Button variant="outline" className="rounded-full">$25 Gift Card</Button>
            <Button variant="outline" className="rounded-full">$50 Gift Card</Button>
            <Button className="rounded-full">$100 Gift Card</Button>
          </div>
        </div>
      </main>
      
      <BottomNav />
    </div>);

};

export default Shop;