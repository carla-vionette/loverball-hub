import React from "react";
import { Link, useSearchParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { CheckCircle, ShoppingBag, ArrowLeft } from "lucide-react";
import BottomNav from "@/components/BottomNav";
import DesktopNav from "@/components/DesktopNav";
import MobileHeader from "@/components/MobileHeader";

const CheckoutSuccess = () => {
  const [searchParams] = useSearchParams();
  const sessionId = searchParams.get("session_id");

  return (
    <div className="min-h-screen bg-background">
      <MobileHeader />
      <DesktopNav />
      <BottomNav />

      <main className="md:ml-64 pt-16 md:pt-0 pb-24 md:pb-0 flex items-center justify-center min-h-screen">
        <Card className="max-w-md w-full mx-4 border-border/30">
          <CardContent className="pt-10 pb-8 px-8 text-center space-y-6">
            <div className="w-20 h-20 rounded-full bg-success/10 flex items-center justify-center mx-auto">
              <CheckCircle className="w-10 h-10 text-success" />
            </div>

            <div className="space-y-2">
              <h1 className="font-condensed text-3xl font-bold uppercase tracking-tight">Order Confirmed!</h1>
              <p className="text-muted-foreground font-sans">
                Thank you for your purchase. You'll receive a confirmation email shortly.
              </p>
            </div>

            {sessionId && (
              <p className="text-xs text-muted-foreground/60 font-mono break-all">
                Order ref: {sessionId.slice(0, 20)}…
              </p>
            )}

            <div className="flex flex-col gap-3 pt-2">
              <Link to="/shop">
                <Button className="w-full rounded-full" size="lg">
                  <ShoppingBag className="w-4 h-4 mr-2" />
                  Continue Shopping
                </Button>
              </Link>
              <Link to="/home">
                <Button variant="outline" className="w-full rounded-full" size="lg">
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Back to Home
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
};

export default CheckoutSuccess;
