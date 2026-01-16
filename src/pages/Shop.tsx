import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import DesktopNav from "@/components/DesktopNav";
import BottomNav from "@/components/BottomNav";
import MobileHeader from "@/components/MobileHeader";
import { CartDrawer } from "@/components/CartDrawer";
import { getProducts, ShopifyProduct } from "@/lib/shopify";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { useCartStore } from "@/stores/cartStore";
import { toast } from "sonner";
import { Loader2, ShoppingBag } from "lucide-react";

const Shop = () => {
  const [products, setProducts] = useState<ShopifyProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const addItem = useCartStore(state => state.addItem);

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const data = await getProducts(20);
        setProducts(data);
      } catch (error) {
        console.error('Error fetching products:', error);
        toast.error("Failed to load products");
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
  }, []);

  const handleAddToCart = (product: ShopifyProduct) => {
    const variant = product.node.variants.edges[0].node;
    
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

  return (
    <div className="min-h-screen bg-background pb-20 md:pb-0 md:pl-64">
      <DesktopNav />
      <MobileHeader />
      
      <main className="container mx-auto px-4 py-8">
        <div className="flex justify-between items-start mb-10">
          <div>
            <span className="inline-block bg-primary/10 text-primary px-4 py-2 rounded-full text-sm font-medium tracking-wide mb-4">
              Shop
            </span>
            <h1 className="text-4xl font-serif font-normal mb-2">Boutique</h1>
            <p className="text-muted-foreground text-lg">Official merchandise and gear</p>
          </div>
          <div className="hidden md:block">
            <CartDrawer />
          </div>
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
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {products.map((product) => {
              const { node } = product;
              const image = node.images.edges[0]?.node;
              const price = node.priceRange.minVariantPrice;
              
              return (
                <Card key={node.id} className="overflow-hidden hover:shadow-xl transition-all duration-300 rounded-2xl border-border/50 group">
                  <Link to={`/product/${node.handle}`}>
                    <div className="aspect-square overflow-hidden bg-secondary/30">
                      {image ? (
                        <img
                          src={image.url}
                          alt={image.altText || node.title}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <ShoppingBag className="h-16 w-16 text-muted-foreground/50" />
                        </div>
                      )}
                    </div>
                  </Link>
                  
                  <CardContent className="pt-5">
                    <Link to={`/product/${node.handle}`}>
                      <h3 className="font-serif font-semibold text-lg mb-2 hover:text-primary transition-colors">
                        {node.title}
                      </h3>
                    </Link>
                    <p className="text-2xl font-medium text-primary">
                      ${parseFloat(price.amount).toFixed(2)}
                    </p>
                  </CardContent>
                  
                  <CardFooter className="pt-0">
                    <Button 
                      onClick={() => handleAddToCart(product)}
                      className="w-full rounded-full"
                    >
                      Add to Cart
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
