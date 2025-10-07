// src/pages/Checkout.tsx
import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default function Checkout() {
  const { state } = useLocation() as { state?: { order?: any } };
  const navigate = useNavigate();
  const [order, setOrder] = useState<any>(state?.order);

  useEffect(() => {
    if (!order) {
      const raw = localStorage.getItem("order_draft");
      if (raw) setOrder(JSON.parse(raw));
    }
  }, [order]);

  if (!order)
    return <div className="container mx-auto px-4 py-24">No order found.</div>;

  return (
    <div className="container mx-auto px-4 py-24">
      <Card className="p-6 space-y-4">
        <h2 className="text-2xl font-bold">Checkout</h2>
        <div className="space-y-2">
          {order.items.map((it: any, i: number) => (
            <div key={i} className="flex justify-between">
              <span>
                {it.name_en}
                {it.variant ? ` (${it.variant})` : ""} × {it.qty}
              </span>
              <span>€{it.lineTotal.toFixed(2)}</span>
            </div>
          ))}
          <div className="flex justify-between font-bold pt-2 border-t">
            <span>Total</span>
            <span>€{order.subtotal.toFixed(2)}</span>
          </div>
        </div>
        <Button onClick={() => navigate(-1)}>Back</Button>
      </Card>
    </div>
  );
}
