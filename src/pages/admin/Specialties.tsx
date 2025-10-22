import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "@/hooks/use-toast";
import { Search, Check, ChevronUp, ChevronDown, Save } from "lucide-react";
import { AdminBreadcrumb } from "@/components/admin/Breadcrumb";
import { logActivity } from "@/lib/activityLogger";
import { Badge } from "@/components/ui/badge";
import { useLanguage } from "@/components/ui/language-switcher";

interface MenuItem {
  id: string;
  category: string;
  name_de: string;
  name_en: string;
  description_de: string | null;
  description_en: string | null;
  image_url: string | null;
  price: any;
}

interface SelectedSpecialty {
  menu_item_id: string;
  display_order: number;
}

export default function Specialties() {
  const { language } = useLanguage();
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [selectedItems, setSelectedItems] = useState<SelectedSpecialty[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchMenuItems();
    fetchSelectedSpecialties();
  }, []);

  const fetchMenuItems = async () => {
    try {
      const { data, error } = await supabase
        .from('menu_items')
        .select('*')
        .order('category', { ascending: true });

      if (error) throw error;
      setMenuItems(data || []);
    } catch (error) {
      console.error('Error fetching menu items:', error);
      toast({
        title: "Error loading menu items",
        variant: "destructive",
      });
    }
  };

  const fetchSelectedSpecialties = async () => {
    try {
      const { data, error } = await supabase
        .from('specialties')
        .select('menu_item_id, display_order')
        .order('display_order', { ascending: true });

      if (error) throw error;
      setSelectedItems(data || []);
    } catch (error) {
      console.error('Error fetching specialties:', error);
    }
  };

  const categories = Array.from(new Set(menuItems.map(item => item.category)));

  const filteredItems = menuItems.filter(item => {
    const matchesSearch = 
      item.name_en.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.name_de.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = categoryFilter === "all" || item.category === categoryFilter;
    return matchesSearch && matchesCategory;
  });

  const isSelected = (itemId: string) => {
    return selectedItems.some(s => s.menu_item_id === itemId);
  };

  const getSelectionOrder = (itemId: string) => {
    const index = selectedItems.findIndex(s => s.menu_item_id === itemId);
    return index >= 0 ? index + 1 : null;
  };

  const toggleSelection = (itemId: string) => {
    if (isSelected(itemId)) {
      // Deselect
      setSelectedItems(prev => {
        const filtered = prev.filter(s => s.menu_item_id !== itemId);
        // Reorder remaining items
        return filtered.map((item, index) => ({
          ...item,
          display_order: index
        }));
      });
    } else {
      // Select
      if (selectedItems.length >= 5) {
        toast({
          title: "Maximum selections reached",
          description: "You can only select up to 5 specialties.",
          variant: "destructive",
        });
        return;
      }
      setSelectedItems(prev => [
        ...prev,
        { menu_item_id: itemId, display_order: prev.length }
      ]);
    }
  };

  const moveItem = (itemId: string, direction: 'up' | 'down') => {
    const index = selectedItems.findIndex(s => s.menu_item_id === itemId);
    if (index === -1) return;
    if (direction === 'up' && index === 0) return;
    if (direction === 'down' && index === selectedItems.length - 1) return;

    const newIndex = direction === 'up' ? index - 1 : index + 1;
    const newSelected = [...selectedItems];
    [newSelected[index], newSelected[newIndex]] = [newSelected[newIndex], newSelected[index]];
    
    // Update display_order
    const reordered = newSelected.map((item, idx) => ({
      ...item,
      display_order: idx
    }));
    
    setSelectedItems(reordered);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      // Delete all existing specialties
      const { error: deleteError } = await supabase
        .from('specialties')
        .delete()
        .neq('id', '00000000-0000-0000-0000-000000000000'); // Delete all

      if (deleteError) throw deleteError;

      // Insert new selections
      if (selectedItems.length > 0) {
        const user = await supabase.auth.getUser();
        const userId = user.data.user?.id;

        const { error: insertError } = await supabase
          .from('specialties')
          .insert(
            selectedItems.map(item => ({
              menu_item_id: item.menu_item_id,
              display_order: item.display_order,
              created_by: userId,
              updated_by: userId,
            }))
          );

        if (insertError) throw insertError;
      }

      await logActivity('Updated specialties', 'specialty');

      toast({
        title: "Specialties saved successfully",
        description: `${selectedItems.length} specialties are now featured on the homepage.`,
      });
    } catch (error) {
      console.error('Error saving specialties:', error);
      toast({
        title: "Error saving specialties",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const selectedMenuItems = menuItems.filter(item => 
    selectedItems.some(s => s.menu_item_id === item.id)
  ).sort((a, b) => {
    const orderA = selectedItems.find(s => s.menu_item_id === a.id)?.display_order || 0;
    const orderB = selectedItems.find(s => s.menu_item_id === b.id)?.display_order || 0;
    return orderA - orderB;
  });

  return (
    <div className="space-y-6">
      <AdminBreadcrumb />

      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Our Specialties</h1>
          <p className="text-muted-foreground">
            Select up to 5 menu items to feature as specialties ({selectedItems.length}/5 selected)
          </p>
        </div>
        <Button 
          onClick={handleSave} 
          disabled={saving || selectedItems.length === 0}
          className="gap-2"
        >
          <Save className="h-4 w-4" />
          Save Specialties
        </Button>
      </div>

      {/* Search and Filter */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search menu items..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={categoryFilter} onValueChange={setCategoryFilter}>
          <SelectTrigger className="w-full sm:w-[200px]">
            <SelectValue placeholder="Filter by category" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Categories</SelectItem>
            {categories.map(category => (
              <SelectItem key={category} value={category}>
                {category}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Menu Items Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {filteredItems.map((item) => {
          const selected = isSelected(item.id);
          const order = getSelectionOrder(item.id);
          
          return (
            <Card
              key={item.id}
              className={`relative overflow-hidden cursor-pointer transition-all duration-300 hover:shadow-lg ${
                selected 
                  ? 'ring-2 ring-primary shadow-[0_0_20px_rgba(var(--primary),0.3)]' 
                  : 'hover:ring-1 hover:ring-muted-foreground/20'
              }`}
              onClick={() => toggleSelection(item.id)}
            >
              {selected && (
                <div className="absolute top-2 right-2 z-10 flex gap-1">
                  <Badge className="bg-primary text-primary-foreground font-bold">
                    #{order}
                  </Badge>
                  <div className="bg-primary text-primary-foreground rounded-full p-1">
                    <Check className="h-4 w-4" />
                  </div>
                </div>
              )}
              
              {item.image_url && (
                <div className="relative h-40 overflow-hidden">
                  <img
                    src={item.image_url}
                    alt={item.name_en}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-background/90 via-background/20 to-transparent" />
                </div>
              )}
              
              <CardContent className="p-4 space-y-2">
                <div className="flex items-start justify-between gap-2">
                  <h3 className="font-semibold text-foreground line-clamp-1">
                    {language === "de" ? item.name_de : item.name_en}
                  </h3>
                </div>
                
                <div className="flex items-center justify-between">
                  <Badge variant="secondary" className="text-xs">
                    {item.category}
                  </Badge>
                  <span className="text-sm font-medium text-muted-foreground">
                    €{typeof item.price === 'object' && item.price ? (Object.values(item.price)[0] as number)?.toFixed(2) : '0.00'}
                  </span>
                </div>

                {item.description_en && (
                  <p className="text-xs text-muted-foreground line-clamp-2">
                    {language === "de" ? item.description_de : item.description_en}
                  </p>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>

      {filteredItems.length === 0 && (
        <div className="text-center py-12">
          <p className="text-muted-foreground">No menu items found matching your search.</p>
        </div>
      )}

      {/* Live Preview Section */}
      {selectedItems.length > 0 && (
        <div className="mt-12 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold text-foreground">Live Preview</h2>
            <p className="text-sm text-muted-foreground">This is how it will appear on the homepage</p>
          </div>

          <Card className="p-6 bg-card/50">
            {/* Preview Header */}
            <div className="text-center mb-8">
              <h3 className="text-3xl font-bold text-foreground mb-2">
                {language === "de" ? "UNSERE SPEZIALITÄTEN" : "OUR SPECIALTIES"}
              </h3>
              <p className="text-body">
                {language === "de"
                  ? "Entdecken Sie unsere handverlesenen Spezialitäten"
                  : "Discover our handpicked specialties"}
              </p>
            </div>

            {/* Preview Grid with Reordering */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {selectedMenuItems.map((item, index) => (
                <Card key={item.id} className="overflow-hidden group relative">
                  {/* Reorder Buttons */}
                  <div className="absolute top-2 left-2 z-10 flex flex-col gap-1">
                    <Button
                      size="icon"
                      variant="secondary"
                      className="h-7 w-7"
                      onClick={(e) => {
                        e.stopPropagation();
                        moveItem(item.id, 'up');
                      }}
                      disabled={index === 0}
                    >
                      <ChevronUp className="h-4 w-4" />
                    </Button>
                    <Button
                      size="icon"
                      variant="secondary"
                      className="h-7 w-7"
                      onClick={(e) => {
                        e.stopPropagation();
                        moveItem(item.id, 'down');
                      }}
                      disabled={index === selectedMenuItems.length - 1}
                    >
                      <ChevronDown className="h-4 w-4" />
                    </Button>
                  </div>

                  <Badge className="absolute top-2 right-2 z-10 bg-primary">
                    #{index + 1}
                  </Badge>

                  {item.image_url && (
                    <div className="relative h-48 overflow-hidden">
                      <img
                        src={item.image_url}
                        alt={item.name_en}
                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-background/90 via-background/40 to-transparent" />
                    </div>
                  )}
                  
                  <CardContent className="p-4">
                    <h4 className="text-xl font-bold text-foreground mb-2">
                      {language === "de" ? item.name_de : item.name_en}
                    </h4>
                    
                    {(language === "de" ? item.description_de : item.description_en) && (
                      <p className="text-sm text-body line-clamp-3">
                        {language === "de" ? item.description_de : item.description_en}
                      </p>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}
