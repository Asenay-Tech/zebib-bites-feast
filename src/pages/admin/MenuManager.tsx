import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Plus, Edit, Trash2, Save, X } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import menuData from "@/data/menu.json";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface MenuItem {
  name_de: string;
  name_en: string;
  description_de?: string;
  description_en?: string;
  price: number | string | { [key: string]: number };
}

export default function MenuManager() {
  const [selectedCategory, setSelectedCategory] = useState<string>("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<MenuItem | null>(null);
  const [formData, setFormData] = useState({
    name_de: "",
    name_en: "",
    description_de: "",
    description_en: "",
    price: "",
    category: "",
  });

  const categories = Object.keys(menuData);

  const handleAddNew = () => {
    setEditingItem(null);
    setFormData({
      name_de: "",
      name_en: "",
      description_de: "",
      description_en: "",
      price: "",
      category: categories[0] || "",
    });
    setDialogOpen(true);
  };

  const handleEdit = (item: MenuItem, category: string) => {
    setEditingItem(item);
    setFormData({
      name_de: item.name_de,
      name_en: item.name_en,
      description_de: item.description_de || "",
      description_en: item.description_en || "",
      price: typeof item.price === 'object' ? JSON.stringify(item.price) : String(item.price),
      category,
    });
    setDialogOpen(true);
  };

  const handleSave = () => {
    toast({
      title: "Menu Update",
      description: "Note: Menu changes require updating menu.json file manually. This is a demonstration of the UI.",
    });
    setDialogOpen(false);
  };

  const handleDelete = (item: MenuItem) => {
    toast({
      title: "Delete Item",
      description: "Note: Menu changes require updating menu.json file manually. This is a demonstration of the UI.",
    });
  };

  const renderPrice = (price: any) => {
    if (typeof price === 'object') {
      return Object.entries(price)
        .map(([size, p]) => `${size}: €${p}`)
        .join(', ');
    }
    return `€${price}`;
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Menu Manager</h1>
          <p className="text-muted-foreground">Add, edit, or remove menu items</p>
        </div>
        <Button onClick={handleAddNew} className="gap-2">
          <Plus className="h-4 w-4" />
          Add New Item
        </Button>
      </div>

      <div className="space-y-6">
        {categories.map((category) => {
          const items = menuData[category as keyof typeof menuData] as MenuItem[];
          
          return (
            <Card key={category}>
              <CardHeader>
                <CardTitle className="capitalize">{category}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {items.map((item, index) => (
                    <div
                      key={index}
                      className="flex items-start justify-between p-4 border border-border rounded-lg hover:bg-muted/50 transition-colors"
                    >
                      <div className="flex-1">
                        <h3 className="font-semibold text-foreground">
                          {item.name_en} / {item.name_de}
                        </h3>
                        {item.description_en && (
                          <p className="text-sm text-muted-foreground mt-1">
                            {item.description_en}
                          </p>
                        )}
                        <p className="text-sm font-medium text-primary mt-2">
                          {renderPrice(item.price)}
                        </p>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleEdit(item, category)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDelete(item)}
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              {editingItem ? "Edit Menu Item" : "Add New Menu Item"}
            </DialogTitle>
            <DialogDescription>
              Note: This is a demonstration UI. Actual menu changes require updating the menu.json file.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div>
              <Label htmlFor="category">Category</Label>
              <Select value={formData.category} onValueChange={(value) => setFormData({...formData, category: value})}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((cat) => (
                    <SelectItem key={cat} value={cat}>
                      {cat}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="name_de">Name (German)</Label>
                <Input
                  id="name_de"
                  value={formData.name_de}
                  onChange={(e) => setFormData({...formData, name_de: e.target.value})}
                />
              </div>
              <div>
                <Label htmlFor="name_en">Name (English)</Label>
                <Input
                  id="name_en"
                  value={formData.name_en}
                  onChange={(e) => setFormData({...formData, name_en: e.target.value})}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="description_de">Description (German)</Label>
                <Textarea
                  id="description_de"
                  value={formData.description_de}
                  onChange={(e) => setFormData({...formData, description_de: e.target.value})}
                />
              </div>
              <div>
                <Label htmlFor="description_en">Description (English)</Label>
                <Textarea
                  id="description_en"
                  value={formData.description_en}
                  onChange={(e) => setFormData({...formData, description_en: e.target.value})}
                />
              </div>
            </div>

            <div>
              <Label htmlFor="price">Price (number or JSON object for variants)</Label>
              <Input
                id="price"
                value={formData.price}
                onChange={(e) => setFormData({...formData, price: e.target.value})}
                placeholder='e.g., 12.50 or {"small": 8, "large": 10}'
              />
            </div>

            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setDialogOpen(false)}>
                <X className="h-4 w-4 mr-2" />
                Cancel
              </Button>
              <Button onClick={handleSave}>
                <Save className="h-4 w-4 mr-2" />
                Save
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
