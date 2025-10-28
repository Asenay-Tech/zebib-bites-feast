import { useState } from "react";
import { ShoppingCart, X, Plus, Minus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useLanguage } from "@/components/ui/language-switcher";
import { cn } from "@/lib/utils";

interface CartItem {
  id: string;
  name_de: string;
  name_en: string;
  variant?: string;
  price: number;
  quantity: number;
}

interface FloatingMobileCartProps {
  cart: CartItem[];
  subtotal: number;
  formatEUR: (n: number) => string;
  onCheckout: () => void;
  onUpdateQuantity: (id: string, delta: number) => void;
  onRemoveItem: (id: string) => void;
  disabled?: boolean;
}

export function FloatingMobileCart({
  cart,
  subtotal,
  formatEUR,
  onCheckout,
  onUpdateQuantity,
  onRemoveItem,
  disabled = false,
}: FloatingMobileCartProps) {
  const { t, language } = useLanguage();
  const [isExpanded, setIsExpanded] = useState(false);
  const itemCount = cart.reduce((sum, item) => sum + item.quantity, 0);

  if (cart.length === 0) {
    return null;
  }

  return (
    <>
      {/* Overlay */}
      {isExpanded && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setIsExpanded(false)}
        />
      )}

      {/* Floating Bar (Collapsed) */}
      {!isExpanded && (
        <div className="fixed bottom-0 left-0 right-0 z-50 lg:hidden bg-surface border-t border-border shadow-lg">
          <button
            onClick={() => setIsExpanded(true)}
            className="w-full p-4 flex items-center justify-between hover:bg-accent/10 transition-colors"
          >
            <div className="flex items-center gap-3">
              <div className="relative">
                <ShoppingCart className="h-5 w-5 text-accent" />
                <span className="absolute -top-2 -right-2 bg-accent text-accent-foreground text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center">
                  {itemCount}
                </span>
              </div>
              <span className="font-semibold text-foreground">
                {t("order.cart")}
              </span>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-lg font-bold text-accent">
                {formatEUR(subtotal)}
              </span>
              <span className="text-xs text-body">{t("order.viewCart")}</span>
            </div>
          </button>
        </div>
      )}

      {/* Expanded Cart (Slide Up) */}
      <div
        className={cn(
          "fixed bottom-0 left-0 right-0 z-50 lg:hidden bg-surface border-t border-border shadow-2xl transition-transform duration-300 ease-in-out max-h-[80vh] flex flex-col",
          isExpanded ? "translate-y-0" : "translate-y-full"
        )}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-border">
          <h3 className="text-xl font-bold flex items-center gap-2">
            <ShoppingCart className="h-5 w-5 text-accent" />
            {t("order.cart")} ({itemCount})
          </h3>
          <Button
            size="sm"
            variant="ghost"
            onClick={() => setIsExpanded(false)}
          >
            <X className="h-5 w-5" />
          </Button>
        </div>

        {/* Cart Items - Scrollable */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {cart.map((item) => (
            <div
              key={item.id}
              className="flex justify-between items-start bg-background/50 p-3 rounded-lg"
            >
              <div className="flex-1">
                <p className="font-medium text-sm">
                  {language === "de" ? item.name_de : item.name_en}
                  {item.variant && (
                    <span className="text-muted-foreground">
                      {" "}
                      ({item.variant})
                    </span>
                  )}
                </p>
                <div className="flex items-center gap-2 mt-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => onUpdateQuantity(item.id, -1)}
                  >
                    <Minus className="h-3 w-3" />
                  </Button>
                  <span className="text-sm font-semibold w-8 text-center">
                    {item.quantity}
                  </span>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => onUpdateQuantity(item.id, 1)}
                  >
                    <Plus className="h-3 w-3" />
                  </Button>
                </div>
              </div>
              <div className="text-right ml-4">
                <p className="font-semibold text-accent">
                  {formatEUR(item.price * item.quantity)}
                </p>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => onRemoveItem(item.id)}
                  className="mt-1"
                >
                  <Trash2 className="h-4 w-4 text-destructive" />
                </Button>
              </div>
            </div>
          ))}
        </div>

        {/* Footer with Total and Checkout */}
        <div className="border-t border-border p-4 space-y-3 bg-background/50">
          <div className="flex justify-between items-center">
            <span className="text-lg font-bold">{t("common.total")}</span>
            <span className="text-2xl font-bold text-accent">
              {formatEUR(subtotal)}
            </span>
          </div>
          <Button
            className="w-full"
            onClick={() => {
              setIsExpanded(false);
              onCheckout();
            }}
            disabled={disabled}
          >
            {t("order.checkout")}
          </Button>
        </div>
      </div>
    </>
  );
}
