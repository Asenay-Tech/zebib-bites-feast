import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { z } from "zod";

const phoneSchema = z.string()
  .trim()
  .min(5, "Phone number must be at least 5 digits")
  .max(20, "Phone number must be less than 20 digits")
  .regex(/^[\d\s\-\+\(\)]+$/, "Invalid phone number format");

interface PhoneInputDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (phone: string) => void;
  disabled?: boolean;
}

export function PhoneInputDialog({ open, onOpenChange, onSubmit, disabled = false }: PhoneInputDialogProps) {
  const [phone, setPhone] = useState("");
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = () => {
    const result = phoneSchema.safeParse(phone);
    if (!result.success) {
      setError(result.error.errors[0].message);
      return;
    }
    setError(null);
    onSubmit(phone);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Phone Number Required</DialogTitle>
          <DialogDescription>
            Please enter your phone number to complete your order. This helps us contact you if needed.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="phone">Phone Number</Label>
            <Input
              id="phone"
              type="tel"
              placeholder="+49 123 456 7890"
              value={phone}
              onChange={(e) => {
                setPhone(e.target.value);
                setError(null);
              }}
              onKeyPress={(e) => {
                if (e.key === 'Enter') {
                  handleSubmit();
                }
              }}
            />
            {error && (
              <p className="text-sm text-destructive">{error}</p>
            )}
          </div>
        </div>
        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={disabled}>
            Cancel
          </Button>
          <Button type="button" onClick={handleSubmit} disabled={disabled}>
            Continue to Payment
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
