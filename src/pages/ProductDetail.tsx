import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import DesktopNav from "@/components/DesktopNav";
import MobileHeader from "@/components/MobileHeader";
import BottomNav from "@/components/BottomNav";
import { CartDrawer } from "@/components/CartDrawer";
import { getProducts, getProductByHandle, ShopifyProduct } from "@/lib/shopify";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useCartStore } from "@/stores/cartStore";
import { toast } from "sonner";
import { Loader2, ArrowLeft, ShoppingBag, Star, Heart, Bell, Truck, Ruler, Sparkles, Eye, ChevronDown, ChevronUp } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

// Size guide data
const SIZE_GUIDE = {
  tops: [
    { size: "XS", chest: '30-32"', waist: '24-26"', hips: '33-35"' },
    { size: "S", chest: '32-34"', waist: '26-28"', hips: '35-37"' },
    { size: "M", chest: '34-36"', waist: '28-30"', hips: '37-39"' },
    { size: "L", chest: '36-38"', waist: '30-32"', hips: '39-41"' },
    { size: "XL", chest: '38-40"', waist: '32-34"', hips: '41-43"' },
    { size: "2XL", chest: '40-42"', waist: '34-36"', hips: '43-45"' },
  ],
  hats: [
    { size: "One Size", circumference: '21.5-23"', notes: "Adjustable strap" },
  ],
};

// Simulated view count
const getViewCount = (id: string) => {
  const hash = id.split('').reduce((a, b) => { a = ((a << 5) - a) + b.charCodeAt(0); return a & a; }, 0);
  return Math.abs(hash % 40) + 12;
};

const ProductDetail = () => {
  const { handle } = useParams<{ handle: string }>();
  const [product, setProduct] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [selectedVariant, setSelectedVariant] = useState<any>(null);
  const [selectedOptions, setSelectedOptions] = useState<Record<string, string>>({});
  const [selectedImageIdx, setSelectedImageIdx] = useState(0);
  const [relatedProducts, setRelatedProducts] = useState<ShopifyProduct[]>([]);
  const [isWishlisted, setIsWishlisted] = useState(false);
  const [notifyEmail, setNotifyEmail] = useState("");
  const [showNotifyForm, setShowNotifyForm] = useState(false);
  const addItem = useCartStore(state => state.addItem);

  useEffect(() => {
    const fetchProduct = async () => {
      if (!handle) return;
      
      try {
        const data = await getProductByHandle(handle);
        setProduct(data);
        
        if (data?.variants?.edges?.length > 0) {
          const firstVariant = data.variants.edges[0].node;
          setSelectedVariant(firstVariant);
          
          const initialOptions: Record<string, string> = {};
          firstVariant.selectedOptions.forEach((option: any) => {
            initialOptions[option.name] = option.value;
          });
          setSelectedOptions(initialOptions);
        }

        // Check wishlist
        const saved = localStorage.getItem('loverball-wishlist');
        if (saved && data?.id) {
          const wl = new Set(JSON.parse(saved));
          setIsWishlisted(wl.has(data.id));
        }

        // Fetch related products
        const allProducts = await getProducts(10);
        const seenTitles = new Set<string>();
        const related = allProducts.filter(p => {
          const titleLower = p.node.title.toLowerCase();
          if (seenTitles.has(titleLower) || p.node.handle === handle) return false;
          seenTitles.add(titleLower);
          return true;
        }).slice(0, 4);
        setRelatedProducts(related);
      } catch (error) {
        toast.error("Failed to load product");
      } finally {
        setLoading(false);
      }
    };

    fetchProduct();
    window.scrollTo(0, 0);
  }, [handle]);

  const handleOptionChange = (optionName: string, value: string) => {
    const newOptions = { ...selectedOptions, [optionName]: value };
    setSelectedOptions(newOptions);

    const matchingVariant = product.variants.edges.find((edge: any) => {
      return edge.node.selectedOptions.every((option: any) => 
        newOptions[option.name] === option.value
      );
    });

    if (matchingVariant) {
      setSelectedVariant(matchingVariant.node);
    }
  };

  const handleAddToCart = () => {
    if (!selectedVariant || !product) return;

    addItem({
      product: { node: product } as ShopifyProduct,
      variantId: selectedVariant.id,
      variantTitle: selectedVariant.title,
      price: selectedVariant.price,
      quantity: 1,
      selectedOptions: selectedVariant.selectedOptions
    });
    toast.success("Added to cart", {
      description: `${product.title} has been added to your cart`,
    });
  };

  const toggleWishlist = () => {
    const saved = localStorage.getItem('loverball-wishlist');
    const wl: Set<string> = saved ? new Set(JSON.parse(saved)) : new Set();
    if (isWishlisted) {
      wl.delete(product.id);
      toast("Removed from wishlist");
    } else {
      wl.add(product.id);
      toast.success("Saved to wishlist ♡");
    }
    localStorage.setItem('loverball-wishlist', JSON.stringify([...wl]));
    setIsWishlisted(!isWishlisted);
  };

  const handleNotify = () => {
    if (notifyEmail) {
      toast.success("You'll be notified when this item is back in stock!");
      setShowNotifyForm(false);
      setNotifyEmail("");
    }
  };

  const isHat = product?.title?.toLowerCase().includes('hat') || product?.title?.toLowerCase().includes('cap');
  const sizeData = isHat ? SIZE_GUIDE.hats : SIZE_GUIDE.tops;

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <><MobileHeader /><DesktopNav /><BottomNav /></>
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="min-h-screen bg-background">
        <><MobileHeader /><DesktopNav /><BottomNav /></>
        <div className="container mx-auto px-4 pt-24 text-center">
          <h1 className="text-2xl font-bold mb-4">Product not found</h1>
          <Link to="/shop">
            <Button><ArrowLeft className="mr-2 h-4 w-4" />Back to Shop</Button>
          </Link>
        </div>
      </div>
    );
  }

  const images = product.images?.edges || [];
  const currentImage = images[selectedImageIdx]?.node;
  const viewCount = getViewCount(product.id || '');
  const isOutOfStock = selectedVariant && !selectedVariant.availableForSale;

  return (
    <div className="min-h-screen bg-background pb-20 md:pb-0">
      <><MobileHeader /><DesktopNav /><BottomNav /></>
      
      <main className="container mx-auto px-4 pt-24 md:pt-28">
        <div className="flex justify-between items-center mb-8">
          <Link to="/shop">
            <Button variant="ghost"><ArrowLeft className="mr-2 h-4 w-4" />Back to Shop</Button>
          </Link>
          <CartDrawer />
        </div>

        <div className="grid md:grid-cols-2 gap-8 max-w-6xl mx-auto">
          {/* Image Gallery */}
          <div className="space-y-3">
            <div className="aspect-square rounded-2xl overflow-hidden bg-secondary/20 relative">
              {currentImage ? (
                <img src={currentImage.url} alt={currentImage.altText || product.title} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <ShoppingBag className="h-24 w-24 text-muted-foreground" />
                </div>
              )}
              {viewCount > 35 && (
                <Badge className="absolute top-4 left-4 bg-accent text-accent-foreground gap-1">
                  <Star className="h-3 w-3 fill-current" />Community Favorite
                </Badge>
              )}
            </div>
            {/* Thumbnail strip */}
            {images.length > 1 && (
              <div className="flex gap-2 overflow-x-auto">
                {images.map((img: any, idx: number) => (
                  <button
                    key={idx}
                    onClick={() => setSelectedImageIdx(idx)}
                    className={`w-16 h-16 md:w-20 md:h-20 rounded-lg overflow-hidden border-2 flex-shrink-0 transition-colors ${
                      idx === selectedImageIdx ? 'border-primary' : 'border-transparent'
                    }`}
                  >
                    <img src={img.node.url} alt="" className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Product Info */}
          <div className="space-y-6">
            <div>
              <div className="flex items-start justify-between gap-4">
                <h1 className="text-3xl md:text-4xl font-bold">{product.title}</h1>
                <button onClick={toggleWishlist} className="p-2 rounded-full hover:bg-muted transition-colors flex-shrink-0 mt-1">
                  <Heart className={`h-6 w-6 ${isWishlisted ? 'fill-coral text-coral' : 'text-muted-foreground'}`} />
                </button>
              </div>
              <p className="text-3xl font-bold text-primary mt-2">
                ${parseFloat(selectedVariant?.price.amount || '0').toFixed(2)}
              </p>
              
              {/* Social proof */}
              <div className="flex items-center gap-3 mt-3">
                <div className="flex items-center gap-1 text-sm text-muted-foreground">
                  <Eye className="h-4 w-4" />
                  <span>{viewCount} people viewed today</span>
                </div>
              </div>

              {/* Reviews placeholder */}
              <div className="flex items-center gap-2 mt-3">
                <div className="flex">
                  {[1, 2, 3, 4, 5].map(i => (
                    <Star key={i} className="h-4 w-4 text-border" />
                  ))}
                </div>
                <span className="text-sm text-muted-foreground">No reviews yet</span>
              </div>
            </div>

            {/* Shipping info */}
            <div className="flex items-center gap-2 text-sm bg-card rounded-xl px-4 py-3 border border-border/50">
              <Truck className="h-4 w-4 text-primary flex-shrink-0" />
              <span>Free shipping on orders over $75 · Ships in 3-5 business days</span>
            </div>

            {product.description && (
              <p className="text-muted-foreground whitespace-pre-wrap">{product.description}</p>
            )}

            {/* Variant options */}
            {product.options?.map((option: any) => (
              <div key={option.name} className="space-y-2">
                <label className="text-sm font-medium">{option.name}</label>
                <div className="flex flex-wrap gap-2">
                  {option.values.map((value: string) => (
                    <Button
                      key={value}
                      variant={selectedOptions[option.name] === value ? "default" : "outline"}
                      onClick={() => handleOptionChange(option.name, value)}
                      className="rounded-full"
                    >
                      {value}
                    </Button>
                  ))}
                </div>
              </div>
            ))}

            {/* Add to Cart or Notify */}
            {isOutOfStock ? (
              <div className="space-y-3">
                <Button disabled size="lg" className="w-full rounded-full" variant="outline">
                  Sold Out
                </Button>
                {!showNotifyForm ? (
                  <Button variant="secondary" size="lg" className="w-full rounded-full" onClick={() => setShowNotifyForm(true)}>
                    <Bell className="mr-2 h-4 w-4" />Notify Me When Available
                  </Button>
                ) : (
                  <div className="flex gap-2">
                    <input
                      type="email"
                      value={notifyEmail}
                      onChange={(e) => setNotifyEmail(e.target.value)}
                      placeholder="Your email"
                      className="flex-1 px-4 py-2 rounded-full border border-input bg-background text-sm"
                    />
                    <Button className="rounded-full" onClick={handleNotify}>Notify Me</Button>
                  </div>
                )}
              </div>
            ) : (
              <Button onClick={handleAddToCart} size="lg" className="w-full rounded-full">
                Add to Cart
              </Button>
            )}

            <Separator />

            {/* Expandable details */}
            <Accordion type="multiple" className="w-full">
              {/* Size Guide */}
              <AccordionItem value="size-guide">
                <AccordionTrigger className="text-sm font-medium">
                  <span className="flex items-center gap-2"><Ruler className="h-4 w-4" />Size Guide</span>
                </AccordionTrigger>
                <AccordionContent>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-border">
                          {Object.keys(sizeData[0]).map(key => (
                            <th key={key} className="py-2 px-3 text-left font-medium capitalize">{key}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {sizeData.map((row: any, idx: number) => (
                          <tr key={idx} className="border-b border-border/50">
                            {Object.values(row).map((val: any, i: number) => (
                              <td key={i} className="py-2 px-3 text-muted-foreground">{val}</td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </AccordionContent>
              </AccordionItem>

              {/* Care Instructions */}
              <AccordionItem value="care">
                <AccordionTrigger className="text-sm font-medium">
                  <span className="flex items-center gap-2"><Sparkles className="h-4 w-4" />Care Instructions & Materials</span>
                </AccordionTrigger>
                <AccordionContent>
                  <div className="space-y-3 text-sm text-muted-foreground">
                    <p><strong className="text-foreground">Materials:</strong> Premium cotton blend, pre-shrunk fabric with reinforced stitching.</p>
                    <p><strong className="text-foreground">Care:</strong></p>
                    <ul className="list-disc list-inside space-y-1 ml-2">
                      <li>Machine wash cold with like colors</li>
                      <li>Tumble dry low</li>
                      <li>Do not bleach</li>
                      <li>Iron on low heat if needed</li>
                      <li>Do not dry clean</li>
                    </ul>
                  </div>
                </AccordionContent>
              </AccordionItem>

              {/* Shipping */}
              <AccordionItem value="shipping">
                <AccordionTrigger className="text-sm font-medium">
                  <span className="flex items-center gap-2"><Truck className="h-4 w-4" />Shipping & Returns</span>
                </AccordionTrigger>
                <AccordionContent>
                  <div className="space-y-2 text-sm text-muted-foreground">
                    <p>• Standard shipping: 3-5 business days</p>
                    <p>• Express shipping: 1-2 business days (+$12)</p>
                    <p>• Free shipping on orders over $75</p>
                    <p>• 30-day hassle-free returns</p>
                    <p>• Loverball branded gift wrapping available at checkout (+$5)</p>
                  </div>
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          </div>
        </div>

        {/* Reviews Section (UI placeholder) */}
        <div className="max-w-6xl mx-auto mt-16">
          <h2 className="text-2xl font-bold mb-6">Reviews</h2>
          <Card className="rounded-2xl">
            <CardContent className="py-12 text-center">
              <div className="flex justify-center mb-4">
                {[1, 2, 3, 4, 5].map(i => (
                  <Star key={i} className="h-6 w-6 text-border" />
                ))}
              </div>
              <p className="text-muted-foreground mb-4">No reviews yet</p>
              <Button variant="outline" className="rounded-full">Be the first to review</Button>
            </CardContent>
          </Card>
        </div>

        {/* As Seen On / UGC Section */}
        <div className="max-w-6xl mx-auto mt-16">
          <h2 className="text-2xl font-bold mb-2">As Seen On Our Community</h2>
          <p className="text-muted-foreground mb-6">Tag @loverball to be featured</p>
          <div className="grid grid-cols-3 md:grid-cols-4 gap-2 md:gap-3">
            {/* Placeholder UGC grid */}
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="aspect-square rounded-xl bg-muted/50 flex items-center justify-center">
                <div className="text-center text-muted-foreground">
                  <ShoppingBag className="h-6 w-6 mx-auto mb-1 opacity-30" />
                  <span className="text-xs opacity-50">Coming soon</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Related Products */}
        {relatedProducts.length > 0 && (
          <div className="max-w-6xl mx-auto mt-16 mb-12">
            <h2 className="text-2xl font-bold mb-6">You Might Also Like</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {relatedProducts.map(rp => {
                const img = rp.node.images.edges[0]?.node;
                const rpPrice = rp.node.priceRange.minVariantPrice;
                return (
                  <Link key={rp.node.id} to={`/product/${rp.node.handle}`} className="group">
                    <Card className="overflow-hidden rounded-2xl border-border/50 hover:shadow-lg transition-shadow">
                      <div className="aspect-square overflow-hidden bg-secondary/20">
                        {img ? (
                          <img src={img.url} alt={img.altText || rp.node.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <ShoppingBag className="h-8 w-8 text-muted-foreground/50" />
                          </div>
                        )}
                      </div>
                      <CardContent className="p-3 md:p-4">
                        <h3 className="font-semibold text-sm line-clamp-1">{rp.node.title}</h3>
                        <p className="text-primary font-medium text-sm mt-1">${parseFloat(rpPrice.amount).toFixed(2)}</p>
                      </CardContent>
                    </Card>
                  </Link>
                );
              })}
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default ProductDetail;