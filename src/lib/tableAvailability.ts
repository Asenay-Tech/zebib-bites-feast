import { supabase } from "@/integrations/supabase/client";

/**
 * Each reservation has a 2-hour duration window
 */
export const RESERVATION_DURATION_HOURS = 2;

/**
 * Check if a table is available for booking at a specific date/time
 * @param tableNumber - The table number to check
 * @param dateString - Date in format "yyyy-MM-dd"
 * @param timeString - Time in format "HH:mm"
 * @returns Object with availability status and optional booking end time
 */
export async function checkTableAvailability(
  tableNumber: number,
  dateString: string,
  timeString: string
): Promise<{ available: boolean; bookedUntil?: string; error?: string }> {
  try {
    // Parse the requested time
    const [reqHour, reqMin] = timeString.split(":").map(Number);
    const requestedStart = new Date(`${dateString}T${timeString}:00`);
    const requestedEnd = new Date(requestedStart);
    requestedEnd.setHours(requestedStart.getHours() + RESERVATION_DURATION_HOURS);

    // Fetch all reservations for this table on this date
    const { data: reservations, error } = await supabase
      .from("reservations")
      .select("time")
      .eq("table_number", tableNumber)
      .eq("date", dateString);

    if (error) {
      console.error("Error checking table availability:", error);
      return { available: false, error: error.message };
    }

    if (!reservations || reservations.length === 0) {
      return { available: true };
    }

    // Check for overlaps with existing reservations
    for (const reservation of reservations) {
      const [existingHour, existingMin] = reservation.time.split(":").map(Number);
      const existingStart = new Date(`${dateString}T${reservation.time}:00`);
      const existingEnd = new Date(existingStart);
      existingEnd.setHours(existingStart.getHours() + RESERVATION_DURATION_HOURS);

      // Check if time slots overlap: existing_start < new_end AND existing_end > new_start
      if (existingStart < requestedEnd && existingEnd > requestedStart) {
        const bookedUntil = `${existingEnd.getHours().toString().padStart(2, "0")}:${existingEnd.getMinutes().toString().padStart(2, "0")}`;
        return { available: false, bookedUntil };
      }
    }

    return { available: true };
  } catch (err: any) {
    console.error("Error in checkTableAvailability:", err);
    return { available: false, error: err.message };
  }
}

/**
 * Get all tables that are booked for a specific date/time
 * @param dateString - Date in format "yyyy-MM-dd"
 * @param timeString - Time in format "HH:mm"
 * @returns Array of table numbers with their booking end times
 */
export async function getBookedTables(
  dateString: string,
  timeString: string
): Promise<Array<{ tableNumber: number; bookedUntil: string }>> {
  try {
    const requestedStart = new Date(`${dateString}T${timeString}:00`);
    const requestedEnd = new Date(requestedStart);
    requestedEnd.setHours(requestedStart.getHours() + RESERVATION_DURATION_HOURS);

    const { data: reservations, error } = await supabase
      .from("reservations")
      .select("table_number, time")
      .eq("date", dateString);

    if (error || !reservations) {
      console.error("Error fetching booked tables:", error);
      return [];
    }

    const bookedTables: Array<{ tableNumber: number; bookedUntil: string }> = [];

    for (const reservation of reservations) {
      if (!reservation.table_number) continue;

      const existingStart = new Date(`${dateString}T${reservation.time}:00`);
      const existingEnd = new Date(existingStart);
      existingEnd.setHours(existingStart.getHours() + RESERVATION_DURATION_HOURS);

      // Check overlap
      if (existingStart < requestedEnd && existingEnd > requestedStart) {
        const bookedUntil = `${existingEnd.getHours().toString().padStart(2, "0")}:${existingEnd.getMinutes().toString().padStart(2, "0")}`;
        bookedTables.push({
          tableNumber: reservation.table_number,
          bookedUntil,
        });
      }
    }

    return bookedTables;
  } catch (err) {
    console.error("Error in getBookedTables:", err);
    return [];
  }
}
