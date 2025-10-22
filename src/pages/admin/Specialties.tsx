import { useEffect, useState, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "@/hooks/use-toast";
import { Search, Check, ArrowUp, ArrowDown, Star } from "lucide-react";
import { AdminBreadcrumb } from "@/components/admin/Breadcrumb";
import { logActivity } from "@/lib/activityLogger";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";

interface MenuItem {
  id: string;
  name_de: string;
  name_en: string;
  description_de: string | null;
  description_en: string | null;
  category: string;
  price: any;
  image_url: string | null;
}

interface SelectedSpecialty {
  menuItemId: string;
  displayOrder: number;
}

const MAX_SPECIALTIES = 5;

export default function Specialties() {
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [selectedSpecialties, setSelectedSpecialties] = useState<SelectedSpecialty[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchMenuItems();
    fetchSelectedSpecialties();
  }, []);

  const fetchMenuItems = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('menu_items')
        .select('*')
        .order('category', { ascending: true })
        .order('name_en', { ascending: true });

      if (error) throw error;
      setMenuItems(data || []);
    } catch (error) {
      console.error('Error fetching menu items:', error);
      toast({
        title: "Error loading menu items",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchSelectedSpecialties = async () => {
    try {
      const { data, error } = await supabase
        .from('specialties')
        .select('menu_item_id, display_order')
        .order('display_order', { ascending: true });

      if (error) throw error;
      
      const mapped = (data || []).map(item => ({
        menuItemId: item.menu_item_id,
        displayOrder: item.display_order,
      }));
      
      setSelectedSpecialties(mapped);
    } catch (error) {
      console.error('Error fetching specialties:', error);
    }
  };

  const categories = useMemo(() => {
    const uniqueCategories = Array.from(new Set(menuItems.map(item => item.category)));
    return uniqueCategories.sort();
  }, [menuItems]);

  const filteredMenuItems = useMemo(() => {
    return menuItems.filter(item => {
      const matchesSearch = 
        item.name_en.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.name_de.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.category.toLowerCase().includes(searchQuery.toLowerCase());
      
      const matchesCategory = categoryFilter === "all" || item.category === categoryFilter;
      
      return matchesSearch && matchesCategory;
    });
  }, [menuItems, searchQuery, categoryFilter]);

  const isSelected = (menuItemId: string) => {
    return selectedSpecialties.some(s => s.menuItemId === menuItemId);
  };

  const getSelectionOrder = (menuItemId: string) => {
    const index = selectedSpecialties.findIndex(s => s.menuItemId === menuItemId);
    return index >= 0 ? index + 1 : null;
  };

  const handleToggleSelection = (menuItemId: string) => {
    if (isSelected(menuItemId)) {
      // Deselect
      setSelectedSpecialties(prev => 
        prev
          .filter(s => s.menuItemId !== menuItemId)
          .map((s, index) => ({ ...s, displayOrder: index }))
      );
    } else {
      // Select
      if (selectedSpecialties.length >= MAX_SPECIALTIES) {
        toast({
          title: `You can only select up to ${MAX_SPECIALTIES} specialties`,
          variant: "destructive",
        });
        return;
      }
      
      setSelectedSpecialties(prev => [
        ...prev,
        { menuItemId, displayOrder: prev.length }
      ]);
    }
  };

  const moveSpecialty = (menuItemId: string, direction: 'up' | 'down') => {
    const index = selectedSpecialties.findIndex(s => s.menuItemId === menuItemId);
    if (index === -1) return;
    if (direction === 'up' && index === 0) return;
    if (direction === 'down' && index === selectedSpecialties.length - 1) return;

    const newIndex = direction === 'up' ? index - 1 : index + 1;
    const newSpecialties = [...selectedSpecialties];
    [newSpecialties[index], newSpecialties[newIndex]] = [newSpecialties[newIndex], newSpecialties[index]];
    
    // Update display orders
    const updated = newSpecialties.map((s, idx) => ({ ...s, displayOrder: idx }));
    setSelectedSpecialties(updated);
  };

  const handleSave = async () => {
    try {
      setSaving(true);

      // Delete all existing specialties
      const { error: deleteError } = await supabase
        .from('specialties')
        .delete()
        .neq('id', '00000000-0000-0000-0000-000000000000'); // Delete all

      if (deleteError) throw deleteError;

      // Insert new specialties
      if (selectedSpecialties.length > 0) {
        const { error: insertError } = await supabase
          .from('specialties')
          .insert(
            selectedSpecialties.map(s => ({
              menu_item_id: s.menuItemId,
              display_order: s.displayOrder,
              created_by: (await supabase.auth.getUser()).data.user?.id,
            }))
          );

        if (insertError) throw insertError;
      }

      await logActivity('Updated specialties selection', 'specialty');

      toast({
        title: "Specialties saved successfully",
        description: `${selectedSpecialties.length} items selected`,
      });

      fetchSelectedSpecialties();
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

  const selectedMenuItems = useMemo(() => {
    return selectedSpecialties
      .map(s => menuItems.find(m => m.id === s.menuItemId))
      .filter(Boolean) as MenuItem[];
  }, [selectedSpecialties, menuItems]);

  const formatPrice = (price: any) => {
    if (!price) return '';
    if (typeof price === 'object' && price.small) {
      return `€${price.small}`;
    }
    return `€${price}`;
  };

  return (
    <div className="space-y-8">
      <AdminBreadcrumb />

      <div className="space-y-2">
        <h1 className="text-4xl font-bold text-foreground">Our Specialties</h1>
        <p className="text-muted-foreground text-lg">
          Select up to {MAX_SPECIALTIES} menu items to feature as specialties on the homepage
        </p>
      </div>

      {/* Search and Filter Controls */}
      <div className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between bg-card/50 p-4 rounded-lg border border-border/50">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search menu items by name or category..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        
        <Select value={categoryFilter} onValueChange={setCategoryFilter}>
          <SelectTrigger className="w-full md:w-[200px]">
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

        <div className="flex items-center gap-2">
          <Badge variant="secondary" className="text-sm">
            {selectedSpecialties.length} / {MAX_SPECIALTIES} selected
          </Badge>
        </div>
      </div>

      {/* Menu Items Grid */}
      <div>
        <h2 className="text-2xl font-semibold mb-4 text-foreground">Select Menu Items</h2>
        {loading ? (
          <div className="text-center py-12 text-muted-foreground">Loading menu items...</div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredMenuItems.map((item) => {
              const selected = isSelected(item.id);
              const order = getSelectionOrder(item.id);
              
              return (
                <Card
                  key={item.id}
                  className={`relative overflow-hidden cursor-pointer transition-all duration-300 ${
                    selected 
                      ? 'ring-2 ring-accent shadow-[0_0_20px_rgba(var(--accent-rgb),0.3)] scale-[1.02]' 
                      : 'hover:shadow-lg hover:scale-[1.01]'
                  }`}
                  onClick={() => handleToggleSelection(item.id)}
                >
                  {/* Selection Badge */}
                  {selected && (
                    <div className="absolute top-2 right-2 z-10">
                      <Badge className="bg-accent text-accent-foreground flex items-center gap-1 shadow-lg">
                        <Star className="h-3 w-3 fill-current" />
                        #{order}
                      </Badge>
                    </div>
                  )}

                  {/* Image */}
                  {item.image_url && (
                    <div className="relative h-48 overflow-hidden bg-muted">
                      <img
                        src={item.image_url}
                        alt={item.name_en}
                        className="w-full h-full object-cover"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-background/80 to-transparent" />
                    </div>
                  )}

                  <CardContent className="p-4 space-y-2">
                    <div className="flex items-start justify-between gap-2">
                      <h3 className="font-bold text-lg line-clamp-1">{item.name_en}</h3>
                      {selected && (
                        <Check className="h-5 w-5 text-accent flex-shrink-0" />
                      )}
                    </div>
                    
                    <div className="flex items-center justify-between text-sm">
                      <Badge variant="outline" className="text-xs">
                        {item.category}
                      </Badge>
                      <span className="font-semibold text-accent">{formatPrice(item.price)}</span>
                    </div>

                    {item.description_en && (
                      <p className="text-sm text-muted-foreground line-clamp-2">
                        {item.description_en}
                      </p>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}

        {!loading && filteredMenuItems.length === 0 && (
          <div className="text-center py-12 text-muted-foreground">
            No menu items found matching your search.
          </div>
        )}
      </div>

      {/* Selected Specialties Management */}
      {selectedSpecialties.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-semibold text-foreground">Selected Specialties</h2>
            <Button 
              onClick={handleSave} 
              disabled={saving}
              size="lg"
              className="gap-2"
            >
              {saving ? "Saving..." : "Save Specialties"}
            </Button>
          </div>

          <div className="grid grid-cols-1 gap-4">
            {selectedMenuItems.map((item, index) => (
              <Card key={item.id} className="bg-card/50 border-accent/20">
                <CardContent className="p-4">
                  <div className="flex items-center gap-4">
                    {/* Order Badge */}
                    <div className="flex-shrink-0">
                      <Badge variant="secondary" className="h-10 w-10 rounded-full flex items-center justify-center text-lg font-bold">
                        #{index + 1}
                      </Badge>
                    </div>

                    {/* Image Thumbnail */}
                    {item.image_url && (
                      <div className="w-20 h-20 rounded-lg overflow-hidden flex-shrink-0 bg-muted">
                        <img
                          src={item.image_url}
                          alt={item.name_en}
                          className="w-full h-full object-cover"
                        />
                      </div>
                    )}

                    {/* Item Info */}
                    <div className="flex-1 min-w-0">
                      <h3 className="font-bold text-lg truncate">{item.name_en}</h3>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <span>{item.category}</span>
                        <span>•</span>
                        <span className="text-accent font-semibold">{formatPrice(item.price)}</span>
                      </div>
                    </div>

                    {/* Reorder Buttons */}
                    <div className="flex gap-2 flex-shrink-0">
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() => moveSpecialty(item.id, 'up')}
                        disabled={index === 0}
                      >
                        <ArrowUp className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() => moveSpecialty(item.id, 'down')}
                        disabled={index === selectedSpecialties.length - 1}
                      >
                        <ArrowDown className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Live Preview Section */}
      {selectedSpecialties.length > 0 && (
        <div className="space-y-4 pt-8 border-t border-border/50">
          <h2 className="text-2xl font-semibold text-foreground">Homepage Preview</h2>
          <p className="text-muted-foreground">
            This is how your selected specialties will appear on the homepage
          </p>
          
          <div className="bg-background/50 p-8 rounded-lg border-2 border-dashed border-border/50">
            <div className="container mx-auto">
              <div className="text-center mb-12">
                <h2 className="text-4xl md:text-5xl font-bold text-foreground mb-4 tracking-wide">
                  OUR SPECIALTIES
                </h2>
                <p className="text-xl text-body max-w-2xl mx-auto">
                  Discover our handpicked specialties
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {selectedMenuItems.map((item) => (
                  <Card
                    key={item.id}
                    className="overflow-hidden bg-card border-border/50 hover:shadow-elegant transition-all duration-500 group rounded-2xl"
                  >
                    {item.image_url && (
                      <div className="relative h-64 overflow-hidden">
                        <img
                          src={item.image_url}
                          alt={item.name_en}
                          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-background/90 via-background/40 to-transparent" />
                      </div>
                    )}
                    
                    <CardContent className="p-6">
                      <h3 className="text-2xl font-bold text-foreground mb-3">
                        {item.name_en}
                      </h3>
                      
                      {item.description_en && (
                        <p className="text-body leading-relaxed">
                          {item.description_en}
                        </p>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}