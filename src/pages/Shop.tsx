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
import { useCartStore } from "@/stores/cartStore";
import { toast } from "sonner";
import { Loader2, ShoppingBag } from "lucide-react";
import loverballLogo from "@/assets/loverball-logo-new.png";

const Shop = () => {
  const [products, setProducts] = useState<ShopifyProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedVariants, setSelectedVariants] = useState<Record<string, string>>({});
  const addItem = useCartStore(state => state.addItem);

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const data = await getProducts(20);
        // Filter out duplicate products by title (case-insensitive)
        const seenTitles = new Set<string>();
        const uniqueProducts = data.filter(product => {
          const titleLower = product.node.title.toLowerCase();
          if (seenTitles.has(titleLower)) {
            return false;
          }
          seenTitles.add(titleLower);
          return true;
        });
        setProducts(uniqueProducts);
        
        // Initialize selected variants to first variant for each product
        const initialVariants: Record<string, string> = {};
        uniqueProducts.forEach(product => {
          if (product.node.variants.edges.length > 0) {
            initialVariants[product.node.id] = product.node.variants.edges[0].node.id;
          }
        });
        setSelectedVariants(initialVariants);
      } catch (error) {
        console.error('Error fetching products:', error);
        toast.error("Failed to load products");
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
  }, []);

  const getSelectedVariant = (product: ShopifyProduct) => {
    const selectedVariantId = selectedVariants[product.node.id];
    return product.node.variants.edges.find(v => v.node.id === selectedVariantId)?.node 
      || product.node.variants.edges[0]?.node;
  };

  const handleVariantChange = (productId: string, variantId: string) => {
    setSelectedVariants(prev => ({ ...prev, [productId]: variantId }));
  };

  const handleAddToCart = (product: ShopifyProduct) => {
    const variant = getSelectedVariant(product);
    if (!variant) return;
    
    const cartItem = {
      product,
      variantId: variant.id,
      variantTitle: variant.title,
      price: variant.price,
      quantity: 1,
      selectedOptions: variant.selectedOptions
    };
    
    addItem(cartItem);
    toast.success("Added to cart", {
      description: `${product.node.title} has been added to your cart`,
    });
  };

  // Check if product has meaningful variants (more than just "Default Title")
  const hasVariants = (product: ShopifyProduct) => {
    const variants = product.node.variants.edges;
    return variants.length > 1 || (variants.length === 1 && variants[0].node.title !== "Default Title");
  };

  return (
    <div className="min-h-screen bg-background pb-20 md:pb-0 md:pl-64">
      <DesktopNav />
      <MobileHeader />
      
      <main className="container mx-auto px-4 py-8">
        {/* Hero Section with Large Logo */}
        <div className="flex flex-col items-center text-center mb-12">
          <img 
            src={loverballLogo} 
            alt="Loverball" 
            className="h-24 md:h-32 w-auto mb-6"
          />
          <span className="inline-block bg-primary/10 text-primary px-4 py-2 rounded-full text-sm font-medium tracking-wide mb-4">
            Shop
          </span>
          <h1 className="text-4xl md:text-5xl font-serif font-normal mb-3">Boutique</h1>
          <p className="text-muted-foreground text-lg max-w-md">Official Loverball merchandise and gear for women who love sports</p>
        </div>
        
        {/* Desktop Cart */}
        <div className="hidden md:flex justify-end mb-8">
          <CartDrawer />
        </div>
        
        {/* Fixed cart button for mobile */}
        <div className="md:hidden fixed top-4 right-4 z-50">
          <CartDrawer />
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : products.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center mb-6">
              <ShoppingBag className="h-10 w-10 text-primary" />
            </div>
            <h2 className="text-2xl font-serif mb-3">No products found</h2>
            <p className="text-muted-foreground max-w-md">
              Start adding products to your store by describing what you'd like to sell in the chat!
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-6">
            {products.map((product) => {
              const { node } = product;
              const image = node.images.edges[0]?.node;
              const selectedVariant = getSelectedVariant(product);
              const price = selectedVariant?.price || node.priceRange.minVariantPrice;
              const showVariantSelector = hasVariants(product);
              
              return (
                <Card key={node.id} className="overflow-hidden hover:shadow-xl transition-all duration-300 rounded-2xl border-border/50 group bg-card">
                  <Link to={`/product/${node.handle}`}>
                    <div className="aspect-square overflow-hidden bg-gradient-to-br from-secondary/30 to-muted/30">
                      {image ? (
                        <img
                          src={image.url}
                          alt={image.altText || node.title}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <ShoppingBag className="h-12 w-12 md:h-16 md:w-16 text-muted-foreground/50" />
                        </div>
                      )}
                    </div>
                  </Link>
                  
                  <CardContent className="pt-4 md:pt-5 px-3 md:px-6">
                    <Link to={`/product/${node.handle}`}>
                      <h3 className="font-serif font-semibold text-sm md:text-lg mb-1 md:mb-2 hover:text-primary transition-colors line-clamp-2">
                        {node.title}
                      </h3>
                    </Link>
                    <p className="text-lg md:text-2xl font-medium text-primary mb-3">
                      ${parseFloat(price.amount).toFixed(2)}
                    </p>
                    
                    {/* Variant selector (size/color) */}
                    {showVariantSelector && (
                      <Select
                        value={selectedVariants[node.id] || node.variants.edges[0]?.node.id}
                        onValueChange={(value) => handleVariantChange(node.id, value)}
                      >
                        <SelectTrigger className="w-full h-9 text-xs md:text-sm">
                          <SelectValue placeholder="Select size" />
                        </SelectTrigger>
                        <SelectContent>
                          {node.variants.edges.map((variantEdge) => (
                            <SelectItem 
                              key={variantEdge.node.id} 
                              value={variantEdge.node.id}
                              disabled={!variantEdge.node.availableForSale}
                            >
                              {variantEdge.node.title}
                              {!variantEdge.node.availableForSale && " (Sold out)"}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    )}
                  </CardContent>
                  
                  <CardFooter className="pt-0 px-3 md:px-6 pb-4 md:pb-6">
                    <Button 
                      onClick={() => handleAddToCart(product)}
                      className="w-full rounded-full text-xs md:text-sm"
                      size="sm"
                      disabled={selectedVariant && !selectedVariant.availableForSale}
                    >
                      {selectedVariant?.availableForSale === false ? 'Sold Out' : 'Add to Cart'}
                    </Button>
                  </CardFooter>
                </Card>
              );
            })}
          </div>
        )}
      </main>
      
      <BottomNav />
    </div>
  );
};

export default Shop;
