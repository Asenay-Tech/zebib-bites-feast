import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Plus, Edit, Trash2, Save, X, Search, Upload, Download, Copy, Eye, GripVertical, ZoomIn, ZoomOut, RotateCcw } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { AdminBreadcrumb } from "@/components/admin/Breadcrumb";
import { logActivity } from "@/lib/activityLogger";
import { logger } from "@/lib/logger";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
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
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface MenuItem {
  id: string;
  category: string;
  name_de: string;
  name_en: string;
  description_de?: string;
  description_en?: string;
  price: any;
  image_url?: string;
  image_scale?: number;
  original_image_url?: string;
  edited_image_url?: string;
  image_offset_x?: number;
  image_offset_y?: number;
  created_by?: string;
  updated_by?: string;
}

const ITEMS_PER_PAGE = 10;
const DEFAULT_CATEGORIES = [
  "Aperitif",
  "Main Dishes",
  "Vegetarian",
  "Desserts",
  "Drinks",
  "Coffee & Tea",
  "Wine",
  "Beer"
];

interface CategorySetting {
  category: string;
  show_image: boolean;
}

export default function MenuManager() {
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [filteredItems, setFilteredItems] = useState<MenuItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("");
  const [currentPage, setCurrentPage] = useState(1);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [categoryDialogOpen, setCategoryDialogOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<MenuItem | null>(null);
  const [itemToDelete, setItemToDelete] = useState<MenuItem | null>(null);
  const [uploading, setUploading] = useState(false);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string>("");
  const [categories, setCategories] = useState<string[]>(DEFAULT_CATEGORIES);
  const [categorySettings, setCategorySettings] = useState<Record<string, boolean>>({});
  const [newCategory, setNewCategory] = useState("");
  const [previewMode, setPreviewMode] = useState(false);
  const [draggedItem, setDraggedItem] = useState<MenuItem | null>(null);
  const [dialogImageScale, setDialogImageScale] = useState(1.0);
  const [imageOffsetX, setImageOffsetX] = useState(0);
  const [imageOffsetY, setImageOffsetY] = useState(0);
  const [isDraggingImage, setIsDraggingImage] = useState(false);
  const [dragStartPos, setDragStartPos] = useState({ x: 0, y: 0 });
  const [specialtyItems, setSpecialtyItems] = useState<Set<string>>(new Set());
  const [formData, setFormData] = useState({
    name_de: "",
    name_en: "",
    description_de: "",
    description_en: "",
    price: "",
    category: DEFAULT_CATEGORIES[0],
  });

  useEffect(() => {
    fetchMenuItems();

    // Real-time subscription for menu items
    const channel = supabase
      .channel("menu_items_changes")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "menu_items",
        },
        (payload) => {
          logger.log("Menu item changed:", payload);
          fetchMenuItems();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  useEffect(() => {
    filterItems();
  }, [menuItems, searchQuery, selectedCategory, currentPage]);

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
      
      // Extract unique categories from database
      const uniqueCategories = Array.from(
        new Set(data?.map((item) => item.category) || [])
      ).sort();
      
      if (uniqueCategories.length > 0) {
        setCategories(uniqueCategories);
        // Update selected category if it's not in the list or if it's empty
        if (!selectedCategory || !uniqueCategories.includes(selectedCategory)) {
          setSelectedCategory(uniqueCategories[0] || "");
        }
      }

      // Fetch category settings
      const { data: settings } = await supabase
        .from("category_settings")
        .select("category, show_image");

      const settingsMap: Record<string, boolean> = {};
      settings?.forEach((s) => {
        settingsMap[s.category] = s.show_image;
      });
      setCategorySettings(settingsMap);

      // Fetch specialties
      const { data: specialtiesData } = await supabase
        .from("specialties")
        .select("menu_item_id");
      
      const specialtySet = new Set(specialtiesData?.map(s => s.menu_item_id) || []);
      setSpecialtyItems(specialtySet);
    } catch (error) {
      logger.error('Error fetching menu items:', error);
      toast({
        title: "Error",
        description: "Failed to load menu items",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const filterItems = () => {
    let filtered = [...menuItems];

    // Apply search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(item => 
        item.name_en.toLowerCase().includes(query) ||
        item.name_de.toLowerCase().includes(query) ||
        item.category.toLowerCase().includes(query) ||
        item.description_en?.toLowerCase().includes(query) ||
        item.description_de?.toLowerCase().includes(query)
      );
    }

    // Apply category filter
    if (selectedCategory) {
      filtered = filtered.filter(item => item.category === selectedCategory);
    }

    setFilteredItems(filtered);
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImageFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
        // Reset zoom and offset for new image
        setDialogImageScale(1.0);
        setImageOffsetX(0);
        setImageOffsetY(0);
      };
      reader.readAsDataURL(file);
    }
  };

  const uploadImage = async (): Promise<string | null> => {
    if (!imageFile) return null;

    try {
      setUploading(true);
      const fileExt = imageFile.name.split('.').pop();
      const fileName = `${Math.random().toString(36).substring(2)}.${fileExt}`;
      const filePath = `${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('menu-images')
        .upload(filePath, imageFile);

      if (uploadError) throw uploadError;

      const { data } = supabase.storage
        .from('menu-images')
        .getPublicUrl(filePath);

      return data.publicUrl;
    } catch (error) {
      logger.error('Error uploading image:', error);
      toast({
        title: "Error",
        description: "Failed to upload image",
        variant: "destructive",
      });
      return null;
    } finally {
      setUploading(false);
    }
  };

  const generateEditedImage = async (originalUrl: string): Promise<string | null> => {
    try {
      // Create a canvas to apply transformations
      const img = new Image();
      img.crossOrigin = "anonymous";
      
      return new Promise((resolve, reject) => {
        img.onload = async () => {
          const canvas = document.createElement('canvas');
          const ctx = canvas.getContext('2d');
          if (!ctx) {
            reject(new Error('Could not get canvas context'));
            return;
          }

          // Set canvas size to the final display size
          const displaySize = 400;
          canvas.width = displaySize;
          canvas.height = displaySize;

          // Fill with transparent background
          ctx.clearRect(0, 0, displaySize, displaySize);

          // Calculate scaled dimensions
          const scale = dialogImageScale;
          const scaledWidth = img.width * scale;
          const scaledHeight = img.height * scale;

          // Ensure minimum dimensions for very small scales
          const minDimension = 10; // Minimum 10px to ensure valid image
          if (scaledWidth < minDimension || scaledHeight < minDimension) {
            console.warn('Scaled image too small, using minimum dimensions');
          }

          // Apply offset
          const offsetX = imageOffsetX;
          const offsetY = imageOffsetY;

          // Center the image and apply transformations
          const x = (displaySize - scaledWidth) / 2 + offsetX;
          const y = (displaySize - scaledHeight) / 2 + offsetY;

          // Use high quality image smoothing for small scales
          ctx.imageSmoothingEnabled = true;
          ctx.imageSmoothingQuality = 'high';

          // Draw the transformed image
          ctx.drawImage(img, x, y, scaledWidth, scaledHeight);

          // Convert to blob with quality settings
          canvas.toBlob(async (blob) => {
            if (!blob) {
              reject(new Error('Failed to create blob'));
              return;
            }

            // Proceed without enforcing a minimum blob size


            // Upload edited image
            const fileExt = 'png';
            const fileName = `edited_${Math.random().toString(36).substring(2)}.${fileExt}`;
            const filePath = `${fileName}`;

            const { error: uploadError } = await supabase.storage
              .from('menu-images')
              .upload(filePath, blob);

            if (uploadError) {
              logger.error('Upload error:', uploadError);
              reject(uploadError);
              return;
            }

            const { data } = supabase.storage
              .from('menu-images')
              .getPublicUrl(filePath);

            resolve(data.publicUrl);
          }, 'image/png', 0.95); // High quality PNG
        };

        img.onerror = () => reject(new Error('Failed to load image'));
        img.src = originalUrl;
      });
    } catch (error) {
      console.error('Error generating edited image:', error);
      return null;
    }
  };

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
    setImageFile(null);
    setImagePreview("");
    setDialogImageScale(1.0);
    setImageOffsetX(0);
    setImageOffsetY(0);
    setDialogOpen(true);
  };

  const handleEdit = (item: MenuItem) => {
    setEditingItem(item);
    setFormData({
      name_de: item.name_de,
      name_en: item.name_en,
      description_de: item.description_de || "",
      description_en: item.description_en || "",
      price: typeof item.price === 'object' 
        ? JSON.stringify(item.price) 
        : String(item.price).replace('.', ','), // Convert to European format
      category: item.category,
    });
    // Load original image for editing, not the edited version
    setImagePreview(item.original_image_url || item.image_url || "");
    setImageFile(null);
    setDialogImageScale(item.image_scale || 1.0);
    setImageOffsetX(item.image_offset_x || 0);
    setImageOffsetY(item.image_offset_y || 0);
    setDialogOpen(true);
  };

  const handleSave = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast({
          title: "Error",
          description: "You must be logged in",
          variant: "destructive",
        });
        return;
      }

      let originalImageUrl = editingItem?.original_image_url || editingItem?.image_url || "";
      let editedImageUrl = editingItem?.edited_image_url || "";

      // If new image uploaded
      if (imageFile) {
        const uploadedUrl = await uploadImage();
        if (uploadedUrl) {
          originalImageUrl = uploadedUrl;
          // Generate edited version
          const edited = await generateEditedImage(uploadedUrl);
          if (edited) editedImageUrl = edited;
        }
      } else if (imagePreview && (dialogImageScale !== 1.0 || imageOffsetX !== 0 || imageOffsetY !== 0)) {
        // If existing image with transformations, regenerate edited version
        const edited = await generateEditedImage(originalImageUrl);
        if (edited) editedImageUrl = edited;
      }

      // Parse price - handle both European format and JSON for multiple sizes
      let priceData: any;
      try {
        // Try to parse as JSON first (for drinks with multiple sizes)
        if (formData.price.trim().startsWith('{')) {
          priceData = JSON.parse(formData.price);
        } else {
          // Handle European format: replace comma with dot and parse
          const normalizedPrice = formData.price.replace(',', '.');
          priceData = parseFloat(normalizedPrice) || 0;
        }
      } catch (error) {
        // If JSON parse fails, treat as regular number
        const normalizedPrice = formData.price.replace(',', '.');
        priceData = parseFloat(normalizedPrice) || 0;
      }

      const itemData = {
        category: formData.category,
        name_de: formData.name_de,
        name_en: formData.name_en,
        description_de: formData.description_de || null,
        description_en: formData.description_en || null,
        price: priceData,
        image_url: editedImageUrl || originalImageUrl || null, // Use edited if available
        original_image_url: originalImageUrl || null,
        edited_image_url: editedImageUrl || null,
        image_scale: dialogImageScale,
        image_offset_x: imageOffsetX,
        image_offset_y: imageOffsetY,
        updated_by: user.id,
      };

      if (editingItem) {
        const { error } = await supabase
          .from('menu_items')
          .update(itemData)
          .eq('id', editingItem.id);

        if (error) throw error;

        await logActivity(`Updated menu item: ${formData.name_en}`, 'menu_item', editingItem.id);

        toast({
          title: "Success",
          description: "Menu item updated successfully",
        });
      } else {
        const { data, error } = await supabase
          .from('menu_items')
          .insert({ ...itemData, created_by: user.id })
          .select()
          .single();

        if (error) throw error;

        await logActivity(`Created menu item: ${formData.name_en}`, 'menu_item', data.id);

        toast({
          title: "Success",
          description: "Menu item created successfully",
        });
      }

      setDialogOpen(false);
      // Reset all transformations after save
      setDialogImageScale(1.0);
      setImageOffsetX(0);
      setImageOffsetY(0);
      fetchMenuItems();
    } catch (error) {
      logger.error('Error saving menu item:', error);
      toast({
        title: "Error",
        description: "Failed to save menu item",
        variant: "destructive",
      });
    }
  };

  const handleDeleteClick = (item: MenuItem) => {
    setItemToDelete(item);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!itemToDelete) return;

    try {
      const { error } = await supabase
        .from('menu_items')
        .delete()
        .eq('id', itemToDelete.id);

      if (error) throw error;

      await logActivity(`Deleted menu item: ${itemToDelete.name_en}`, 'menu_item', itemToDelete.id);

      toast({
        title: "Success",
        description: "Menu item deleted successfully",
      });

      setDeleteDialogOpen(false);
      setItemToDelete(null);
      fetchMenuItems();
    } catch (error) {
      logger.error('Error deleting menu item:', error);
      toast({
        title: "Error",
        description: "Failed to delete menu item",
        variant: "destructive",
      });
    }
  };

  const handleDuplicate = async (item: MenuItem) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const duplicatedItem = {
        category: item.category,
        name_de: `${item.name_de} (Copy)`,
        name_en: `${item.name_en} (Copy)`,
        description_de: item.description_de,
        description_en: item.description_en,
        price: item.price,
        image_url: item.image_url,
        created_by: user.id,
        updated_by: user.id,
      };

      const { data, error } = await supabase
        .from('menu_items')
        .insert(duplicatedItem)
        .select()
        .single();

      if (error) throw error;

      await logActivity(`Duplicated menu item: ${item.name_en}`, 'menu_item', data.id);

      toast({
        title: "Success",
        description: "Menu item duplicated successfully",
      });

      fetchMenuItems();
    } catch (error) {
      logger.error('Error duplicating item:', error);
      toast({
        title: "Error",
        description: "Failed to duplicate menu item",
        variant: "destructive",
      });
    }
  };

  const exportMenuData = () => {
    const headers = ["Category", "Name (EN)", "Name (DE)", "Description (EN)", "Description (DE)", "Price", "Image URL"];
    const csvContent = [
      headers.join(","),
      ...menuItems.map(item => [
        item.category,
        item.name_en,
        item.name_de,
        item.description_en || "",
        item.description_de || "",
        typeof item.price === 'number' ? item.price.toFixed(2) : JSON.stringify(item.price),
        item.image_url || ""
      ].join(","))
    ].join("\n");

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `menu_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();

    toast({
      title: "Menu exported successfully",
    });
  };

  const backupMenuData = async () => {
    try {
      const jsonData = JSON.stringify(menuItems, null, 2);
      const fileName = `menu_backup_${new Date().toISOString()}.json`;
      
      const blob = new Blob([jsonData], { type: 'application/json' });
      const file = new File([blob], fileName);

      const { error } = await supabase.storage
        .from('menu-images')
        .upload(`backups/${fileName}`, file);

      if (error) throw error;

      await logActivity('Created menu backup', 'backup');

      toast({
        title: "Backup created successfully",
        description: `Backup saved to /backups/${fileName}`,
      });
    } catch (error) {
      logger.error('Error creating backup:', error);
      toast({
        title: "Error creating backup",
        variant: "destructive",
      });
    }
  };

  const handleImportCSV = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const text = await file.text();
      const lines = text.split('\n');
      const headers = lines[0].split(',');
      
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const items = lines.slice(1).filter(line => line.trim()).map(line => {
        const values = line.split(',');
        return {
          category: values[0]?.trim(),
          name_en: values[1]?.trim(),
          name_de: values[2]?.trim(),
          description_en: values[3]?.trim() || null,
          description_de: values[4]?.trim() || null,
          price: parseFloat(values[5]) || 0,
          image_url: values[6]?.trim() || null,
          created_by: user.id,
          updated_by: user.id,
        };
      });

      const { error } = await supabase
        .from('menu_items')
        .insert(items);

      if (error) throw error;

      await logActivity(`Imported ${items.length} menu items from CSV`, 'menu_item');

      toast({
        title: "Import successful",
        description: `Imported ${items.length} menu items`,
      });

      fetchMenuItems();
    } catch (error) {
      logger.error('Error importing CSV:', error);
      toast({
        title: "Error importing CSV",
        variant: "destructive",
      });
    }
  };

  const handleDragStart = (item: MenuItem) => {
    setDraggedItem(item);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = async (targetItem: MenuItem) => {
    if (!draggedItem || draggedItem.id === targetItem.id) return;

    // Reorder items visually
    const items = [...menuItems];
    const dragIndex = items.findIndex(i => i.id === draggedItem.id);
    const dropIndex = items.findIndex(i => i.id === targetItem.id);
    
    items.splice(dragIndex, 1);
    items.splice(dropIndex, 0, draggedItem);
    
    setMenuItems(items);
    setDraggedItem(null);

    toast({
      title: "Items reordered",
      description: "Menu order updated",
    });
  };

  const handleAddCategory = () => {
    if (newCategory.trim() && !categories.includes(newCategory.trim())) {
      setCategories([...categories, newCategory.trim()].sort());
      setNewCategory("");
      setCategoryDialogOpen(false);
      toast({
        title: "Success",
        description: "Category added. Add menu items to this category to save it to the database.",
      });
    }
  };

  const handleDeleteCategory = (category: string) => {
    if (categories.length > 1) {
      setCategories(categories.filter(c => c !== category));
      toast({
        title: "Success",
        description: "Category deleted successfully",
      });
    } else {
      toast({
        title: "Error",
        description: "Cannot delete the last category",
        variant: "destructive",
      });
    }
  };

  const handleToggleSpecialty = async (itemId: string) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const isCurrentlySpecialty = specialtyItems.has(itemId);

      if (isCurrentlySpecialty) {
        // Remove from specialties
        const { error } = await supabase
          .from("specialties")
          .delete()
          .eq("menu_item_id", itemId);

        if (error) throw error;

        setSpecialtyItems(prev => {
          const newSet = new Set(prev);
          newSet.delete(itemId);
          return newSet;
        });

        toast({
          title: "Success",
          description: "Removed from specialties",
        });
      } else {
        // Check if we already have 6 specialties
        if (specialtyItems.size >= 6) {
          toast({
            title: "Limit Reached",
            description: "You can only select up to 6 specialties.",
            variant: "destructive",
          });
          return;
        }

        // Get the current max display_order
        const { data: existingSpecialties } = await supabase
          .from("specialties")
          .select("display_order")
          .order("display_order", { ascending: false })
          .limit(1);

        const nextOrder = existingSpecialties && existingSpecialties.length > 0 
          ? existingSpecialties[0].display_order + 1 
          : 0;

        // Add to specialties
        const { error } = await supabase
          .from("specialties")
          .insert({
            menu_item_id: itemId,
            display_order: nextOrder,
            created_by: user.id,
            updated_by: user.id,
          });

        if (error) throw error;

        setSpecialtyItems(prev => new Set([...prev, itemId]));

        toast({
          title: "Success",
          description: "Added to specialties",
        });
      }

      await logActivity(`Toggled specialty for menu item`, 'menu_item', itemId);
    } catch (error) {
      logger.error('Error toggling specialty:', error);
      toast({
        title: "Error",
        description: "Failed to update specialty status",
        variant: "destructive",
      });
    }
  };

  const renderPrice = (price: any) => {
    if (typeof price === 'object') {
      return Object.entries(price)
        .map(([size, p]) => `${size}: ${parseFloat(String(p)).toFixed(2).replace('.', ',')} €`)
        .join(', ');
    }
    const num = parseFloat(String(price));
    return isNaN(num) ? price : `${num.toFixed(2).replace('.', ',')} €`;
  };


  const totalPages = Math.ceil(filteredItems.length / ITEMS_PER_PAGE);
  const paginatedItems = filteredItems.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  return (
    <div className="space-y-6">
      <AdminBreadcrumb />
      
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Menu Manager</h1>
          <p className="text-muted-foreground">Manage your restaurant menu</p>
        </div>
        <TooltipProvider>
          <div className="flex flex-wrap gap-2">
            <Tooltip>
              <TooltipTrigger asChild>
                <Button onClick={() => setPreviewMode(!previewMode)} variant="outline" className="gap-2">
                  <Eye className="h-4 w-4" />
                  {previewMode ? "Edit Mode" : "Preview"}
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Toggle preview mode</p>
              </TooltipContent>
            </Tooltip>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button onClick={exportMenuData} variant="outline" className="gap-2">
                  <Download className="h-4 w-4" />
                  Export
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Export menu to CSV</p>
              </TooltipContent>
            </Tooltip>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button onClick={backupMenuData} variant="outline" className="gap-2">
                  <Download className="h-4 w-4" />
                  Backup
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Backup menu to storage</p>
              </TooltipContent>
            </Tooltip>
            <Tooltip>
              <TooltipTrigger asChild>
                <Label htmlFor="csv-import" className="cursor-pointer">
                  <Button variant="outline" className="gap-2" asChild>
                    <span>
                      <Upload className="h-4 w-4" />
                      Import
                    </span>
                  </Button>
                  <Input
                    id="csv-import"
                    type="file"
                    accept=".csv"
                    onChange={handleImportCSV}
                    className="hidden"
                  />
                </Label>
              </TooltipTrigger>
              <TooltipContent>
                <p>Import menu from CSV</p>
              </TooltipContent>
            </Tooltip>
            <Button onClick={() => setCategoryDialogOpen(true)} variant="outline">
              Manage Categories
            </Button>
            {!previewMode && (
              <Button onClick={handleAddNew} className="gap-2">
                <Plus className="h-4 w-4" />
                Add New Item
              </Button>
            )}
          </div>
        </TooltipProvider>
      </div>

      {/* Search and Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by name, category, or description..."
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setCurrentPage(1);
                }}
                className="pl-10"
              />
            </div>
            <Select
              value={selectedCategory}
              onValueChange={(value) => {
                setSelectedCategory(value);
                setCurrentPage(1);
              }}
            >
              <SelectTrigger className="w-full md:w-[200px]">
                <SelectValue placeholder="Filter by category" />
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
        </CardContent>
      </Card>

      {/* Menu Items List */}
      {loading ? (
        <Card>
          <CardContent className="p-12 text-center text-muted-foreground">
            Loading menu items...
          </CardContent>
        </Card>
      ) : paginatedItems.length === 0 ? (
        <Card>
          <CardContent className="p-12 text-center text-muted-foreground">
            No menu items found
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="pt-6">
            <div className="space-y-4">
              {paginatedItems.map((item) => (
                <div
                  key={item.id}
                  draggable={!previewMode}
                  onDragStart={() => handleDragStart(item)}
                  onDragOver={handleDragOver}
                  onDrop={() => handleDrop(item)}
                  className={`flex items-start gap-4 p-4 border border-border rounded-lg transition-colors ${
                    previewMode ? '' : 'hover:bg-muted/50 cursor-move'
                  }`}
                >
                  {!previewMode && (
                    <div className="flex items-center">
                      <GripVertical className="h-5 w-5 text-muted-foreground" />
                    </div>
                  )}
                  {item.image_url && (
                    <img
                      src={item.image_url}
                      alt={item.name_en}
                      className="w-20 h-20 object-cover rounded-md"
                    />
                  )}
                  <div className="flex-1">
                    <div className="flex items-start justify-between">
                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <h3 className="font-semibold text-foreground">
                            {item.name_en} / {item.name_de}
                          </h3>
                          <span className="text-xs px-2 py-1 bg-primary/10 text-primary rounded">
                            {item.category}
                          </span>
                          {specialtyItems.has(item.id) && (
                            <span className="text-xs px-2 py-1 bg-accent/20 text-accent rounded">
                              ⭐ Specialty
                            </span>
                          )}
                        </div>
                        {item.description_en && (
                          <p className="text-sm text-muted-foreground mt-1">
                            {item.description_en}
                          </p>
                        )}
                        <p className="text-sm font-medium text-primary mt-2">
                          {renderPrice(item.price)}
                        </p>
                      </div>
                      {!previewMode && (
                        <TooltipProvider>
                          <div className="flex gap-2">
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button
                                  variant={specialtyItems.has(item.id) ? "default" : "ghost"}
                                  size="sm"
                                  onClick={() => handleToggleSpecialty(item.id)}
                                >
                                  ⭐
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent>
                                <p>{specialtyItems.has(item.id) ? "Remove from specialties" : "Add to specialties"}</p>
                              </TooltipContent>
                            </Tooltip>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleDuplicate(item)}
                                >
                                  <Copy className="h-4 w-4" />
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent>
                                <p>Duplicate item</p>
                              </TooltipContent>
                            </Tooltip>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleEdit(item)}
                                >
                                  <Edit className="h-4 w-4" />
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent>
                                <p>Edit item</p>
                              </TooltipContent>
                            </Tooltip>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleDeleteClick(item)}
                                >
                                  <Trash2 className="h-4 w-4 text-destructive" />
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent>
                                <p>Delete item</p>
                              </TooltipContent>
                            </Tooltip>
                          </div>
                        </TooltipProvider>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex justify-center gap-2 mt-6">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                >
                  Previous
                </Button>
                <div className="flex items-center gap-2">
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                    <Button
                      key={page}
                      variant={currentPage === page ? "default" : "outline"}
                      size="sm"
                      onClick={() => setCurrentPage(page)}
                    >
                      {page}
                    </Button>
                  ))}
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                >
                  Next
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Add/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingItem ? "Edit Menu Item" : "Add New Menu Item"}
            </DialogTitle>
            <DialogDescription>
              Fill in the details below to {editingItem ? "update" : "create"} a menu item
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div>
              <Label htmlFor="category">Category</Label>
              <Select 
                value={formData.category} 
                onValueChange={(value) => setFormData({...formData, category: value})}
              >
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
                  required
                />
              </div>
              <div>
                <Label htmlFor="name_en">Name (English)</Label>
                <Input
                  id="name_en"
                  value={formData.name_en}
                  onChange={(e) => setFormData({...formData, name_en: e.target.value})}
                  required
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
                  rows={3}
                />
              </div>
              <div>
                <Label htmlFor="description_en">Description (English)</Label>
                <Textarea
                  id="description_en"
                  value={formData.description_en}
                  onChange={(e) => setFormData({...formData, description_en: e.target.value})}
                  rows={3}
                />
              </div>
            </div>

            <div>
              <Label htmlFor="price">Price (European format, e.g., 7,50 or JSON for multiple sizes)</Label>
              <Input
                id="price"
                type="text"
                value={formData.price}
                onChange={(e) => setFormData({...formData, price: e.target.value})}
                placeholder='e.g., 7,50 or {"0.1L": 7.00, "0.75L": 32.00}'
                required
              />
              <p className="text-xs text-muted-foreground mt-1">
                For drinks with multiple sizes, use JSON format: {`{"0.1L": 7.00, "0.75L": 32.00}`}
              </p>
            </div>

            <div>
              <Label htmlFor="image">Menu Item Image</Label>
              <div className="mt-2 space-y-4">
                {imagePreview && (
                  <div className="space-y-2">
                    <div 
                      className="relative w-64 h-64 overflow-hidden rounded-md border border-border cursor-move"
                      onMouseDown={(e) => {
                        if (dialogImageScale > 1.0) {
                          setIsDraggingImage(true);
                          setDragStartPos({ x: e.clientX - imageOffsetX, y: e.clientY - imageOffsetY });
                        }
                      }}
                      onMouseMove={(e) => {
                        if (isDraggingImage) {
                          setImageOffsetX(e.clientX - dragStartPos.x);
                          setImageOffsetY(e.clientY - dragStartPos.y);
                        }
                      }}
                      onMouseUp={() => setIsDraggingImage(false)}
                      onMouseLeave={() => setIsDraggingImage(false)}
                      onTouchStart={(e) => {
                        if (dialogImageScale > 1.0) {
                          const touch = e.touches[0];
                          setIsDraggingImage(true);
                          setDragStartPos({ x: touch.clientX - imageOffsetX, y: touch.clientY - imageOffsetY });
                        }
                      }}
                      onTouchMove={(e) => {
                        if (isDraggingImage) {
                          const touch = e.touches[0];
                          setImageOffsetX(touch.clientX - dragStartPos.x);
                          setImageOffsetY(touch.clientY - dragStartPos.y);
                        }
                      }}
                      onTouchEnd={() => setIsDraggingImage(false)}
                    >
                      <img
                        src={imagePreview}
                        alt="Preview"
                        className="absolute top-1/2 left-1/2 w-full h-full object-cover transition-transform duration-100"
                        style={{ 
                          transform: `translate(-50%, -50%) translate(${imageOffsetX}px, ${imageOffsetY}px) scale(${dialogImageScale})`,
                          transformOrigin: 'center',
                          pointerEvents: 'none'
                        }}
                        draggable={false}
                      />
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {dialogImageScale > 1.0 ? "Click and drag to reposition the zoomed image" : "Zoom in to enable dragging"}
                    </p>
                    <TooltipProvider>
                      <div className="flex gap-2">
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={() => setDialogImageScale(prev => Math.max(prev - 0.1, 0.1))}
                            >
                              <ZoomOut className="h-4 w-4 mr-1" />
                              Zoom Out
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>Decrease image scale</p>
                          </TooltipContent>
                        </Tooltip>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                setDialogImageScale(1.0);
                                setImageOffsetX(0);
                                setImageOffsetY(0);
                              }}
                            >
                              <RotateCcw className="h-4 w-4 mr-1" />
                              Reset View
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>Reset to default scale and position</p>
                          </TooltipContent>
                        </Tooltip>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={() => setDialogImageScale(prev => Math.min(prev + 0.2, 3.0))}
                            >
                              <ZoomIn className="h-4 w-4 mr-1" />
                              Zoom In
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>Increase image scale</p>
                          </TooltipContent>
                        </Tooltip>
                        <span className="text-sm text-muted-foreground flex items-center ml-2">
                          Scale: {dialogImageScale.toFixed(1)}x
                        </span>
                      </div>
                    </TooltipProvider>
                  </div>
                )}
                <div className="flex items-center gap-2">
                  <Input
                    id="image"
                    type="file"
                    accept="image/*"
                    onChange={handleImageChange}
                    className="hidden"
                  />
                  <Label
                    htmlFor="image"
                    className="cursor-pointer inline-flex items-center gap-2 px-4 py-2 border border-border rounded-md hover:bg-muted transition-colors"
                  >
                    <Upload className="h-4 w-4" />
                    {imageFile ? "Change Image" : "Upload Image"}
                  </Label>
                  {imageFile && (
                    <span className="text-sm text-muted-foreground">{imageFile.name}</span>
                  )}
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-4">
              <Button variant="outline" onClick={() => setDialogOpen(false)}>
                <X className="h-4 w-4 mr-2" />
                Cancel
              </Button>
              <Button onClick={handleSave} disabled={uploading}>
                <Save className="h-4 w-4 mr-2" />
                {uploading ? "Uploading..." : "Save"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete "{itemToDelete?.name_en}" from the menu.
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteConfirm} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Category Management Dialog */}
      <Dialog open={categoryDialogOpen} onOpenChange={setCategoryDialogOpen}>
        <DialogContent className="max-h-[90vh] flex flex-col">
          <DialogHeader>
            <DialogTitle>Manage Categories</DialogTitle>
            <DialogDescription>
              Add or remove menu categories
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 overflow-y-auto flex-1 pr-2">
            <div className="flex gap-2">
              <Input
                placeholder="New category name"
                value={newCategory}
                onChange={(e) => setNewCategory(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleAddCategory()}
              />
              <Button onClick={handleAddCategory}>
                <Plus className="h-4 w-4" />
              </Button>
            </div>

            <div className="space-y-2">
              {categories.map((category) => (
                <div key={category} className="flex items-center justify-between gap-4 p-2 border border-border rounded-md">
                  <div className="flex items-center gap-3 flex-1">
                    <Label htmlFor={`show-image-${category}`} className="flex items-center gap-2 cursor-pointer flex-1">
                      <input
                        type="checkbox"
                        id={`show-image-${category}`}
                        checked={categorySettings[category] !== false}
                        onChange={async (e) => {
                          const showImage = e.target.checked;
                          setCategorySettings(prev => ({ ...prev, [category]: showImage }));
                          
                          // Update or insert in database
                          const { error } = await supabase
                            .from("category_settings")
                            .upsert({ category, show_image: showImage }, { onConflict: "category" });
                          
                          if (error) {
                            toast({
                              title: "Error",
                              description: "Failed to update category setting",
                              variant: "destructive",
                            });
                          }
                        }}
                        className="h-4 w-4"
                      />
                      <span className="text-sm">Show Menu Image</span>
                    </Label>
                    <span className="font-medium">{category}</span>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDeleteCategory(category)}
                  >
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </div>
              ))}
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
