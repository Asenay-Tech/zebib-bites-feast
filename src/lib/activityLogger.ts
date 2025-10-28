import { supabase } from "@/integrations/supabase/client";
import { logger } from "@/lib/logger";

export async function logActivity(
  action: string,
  entityType: string,
  entityId?: string,
  details?: Record<string, any>
) {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) return;

    // Get user role
    const { data: roleData } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id)
      .single();

    await supabase.from('activity_log').insert({
      user_id: user.id,
      user_email: user.email || '',
      user_role: roleData?.role || 'user',
      action,
      entity_type: entityType,
      entity_id: entityId || null,
      details: details || null,
    });
  } catch (error) {
    logger.error('Error logging activity:', error);
  }
}