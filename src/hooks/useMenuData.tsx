import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { logger } from "@/lib/logger";

export interface MenuItem {
  id: string;
  name_de: string;
  name_en: string;
  description_de?: string | null;
  description_en?: string | null;
  price: any;
  category: string;
  image_url?: string | null;
  image_scale?: number | null;
  created_at?: string;
  updated_at?: string;
  created_by?: string | null;
  updated_by?: string | null;
}

export interface CategorySetting {
  category: string;
  show_image: boolean;
}

export interface MenuData {
  menuItems: MenuItem[];
  categories: string[];
  categorySettings: Record<string, boolean>;
  loading: boolean;
  error: Error | null;
}

/**
 * Shared hook for fetching menu data and category settings.
 * Used by both Homepage Menu and Order page to ensure consistency.
 */
export function useMenuData(): MenuData {
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [categorySettings, setCategorySettings] = useState<Record<string, boolean>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    fetchMenuData();

    // Real-time subscription to menu changes
    const channel = supabase
      .channel("menu_shared_changes")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "menu_items",
        },
        () => {
          fetchMenuData();
        }
      )
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "category_settings",
        },
        () => {
          fetchMenuData();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const fetchMenuData = async () => {
    try {
      setError(null);
      
      // Fetch menu items
      const { data: items, error: itemsError } = await supabase
        .from("menu_items")
        .select("id, name_de, name_en, description_de, description_en, price, image_url, image_scale, category, created_at, updated_at, created_by, updated_by")
        .order("category", { ascending: true });

      if (itemsError) throw itemsError;

      setMenuItems(items || []);

      // Extract unique categories
      const uniqueCategories = Array.from(
        new Set(items?.map((item) => item.category) || [])
      ).sort();
      setCategories(uniqueCategories);

      // Fetch category settings
      const { data: settings, error: settingsError } = await supabase
        .from("category_settings")
        .select("category, show_image");

      if (settingsError) throw settingsError;

      const settingsMap: Record<string, boolean> = {};
      settings?.forEach((s) => {
        settingsMap[s.category] = s.show_image;
      });
      setCategorySettings(settingsMap);
    } catch (err) {
      logger.error("Error fetching menu data:", err);
      setError(err as Error);
    } finally {
      setLoading(false);
    }
  };

  return {
    menuItems,
    categories,
    categorySettings,
    loading,
    error,
  };
}

/**
 * Helper function to get the correct image source for a menu item
 */
export function getItemImageSrc(item: MenuItem): string | undefined {
  if (!item.image_url) return undefined;
  // If it's already a full URL or starts with /, use it directly
  if (item.image_url.startsWith('http') || item.image_url.startsWith('/')) {
    return item.image_url;
  }
  // Otherwise, construct the path
  return `/menu-images/${item.image_url}`;
}

/**
 * Helper function to format price consistently across the app
 */
export function formatPrice(price: any): string {
  if (price === undefined || price === null) return "0,00 €";
  
  // If it's a number
  if (typeof price === "number") {
    return `${price.toFixed(2).replace('.', ',')} €`;
  }
  
  // If it's a string
  if (typeof price === "string") {
    // If it already has € symbol, format it with comma
    if (price.includes("€")) {
      return price.replace('.', ',');
    }
    // Otherwise add € at the end with comma
    const num = parseFloat(price);
    return isNaN(num) ? price : `${num.toFixed(2).replace('.', ',')} €`;
  }
  
  // If it's an object (JSONB with variants)
  if (typeof price === "object" && price !== null) {
    const firstKey = Object.keys(price)[0];
    const firstValue = price[firstKey];
    if (typeof firstValue === "number") {
      return `${firstValue.toFixed(2).replace('.', ',')} €`;
    }
    const num = parseFloat(firstValue);
    return isNaN(num) ? firstValue : `${num.toFixed(2).replace('.', ',')} €`;
  }
  
  return "0,00 €";
}

/**
 * Helper function to get item variants from price object
 */
export function getItemVariants(price: any): string[] {
  if (typeof price === "object" && price !== null && !Array.isArray(price)) {
    return Object.keys(price);
  }
  return [];
}

/**
 * Helper function to check if a category should show images
 */
export function shouldShowImages(
  selectedCategory: string,
  menuItems: MenuItem[],
  categorySettings: Record<string, boolean>
): boolean {
  if (selectedCategory === "all") {
    // Check if any visible category has images
    return menuItems.some(item => 
      categorySettings[item.category] !== false && getItemImageSrc(item)
    );
  }
  // Check specific category setting
  return categorySettings[selectedCategory] !== false;
}
