import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { toast } from "@/hooks/use-toast";
import { Trash2, Download } from "lucide-react";
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

interface Reservation {
  id: string;
  name: string;
  email: string;
  phone: string;
  date: string;
  time: string;
  people: number;
  table_number: number | null;
  event_type: string | null;
  notes: string | null;
  created_at: string;
}

export default function Reservations() {
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [reservationToDelete, setReservationToDelete] = useState<string | null>(null);

  useEffect(() => {
    fetchReservations();
  }, []);

  const fetchReservations = async () => {
    try {
      const { data, error } = await supabase
        .from('reservations')
        .select('*')
        .order('date', { ascending: false })
        .order('time', { ascending: false });

      if (error) throw error;
      setReservations(data || []);
    } catch (error) {
      console.error('Error fetching reservations:', error);
    }
  };

  const handleDeleteClick = (reservationId: string) => {
    setReservationToDelete(reservationId);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!reservationToDelete) return;

    try {
      const { error } = await supabase
        .from('reservations')
        .delete()
        .eq('id', reservationToDelete);

      if (error) throw error;

      toast({
        title: "Reservation cancelled successfully",
      });
      fetchReservations();
    } catch (error) {
      console.error('Error deleting reservation:', error);
      toast({
        title: "Error cancelling reservation",
        variant: "destructive",
      });
    } finally {
      setDeleteDialogOpen(false);
      setReservationToDelete(null);
    }
  };

  const exportToCSV = () => {
    const headers = ["Name", "Email", "Phone", "Date", "Time", "People", "Table", "Event Type"];
    const csvContent = [
      headers.join(","),
      ...reservations.map(r => [
        r.name,
        r.email,
        r.phone,
        r.date,
        r.time,
        r.people,
        r.table_number || "-",
        r.event_type || "-"
      ].join(","))
    ].join("\n");

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `reservations_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
  };

  const checkDoubleBooking = (reservation: Reservation) => {
    if (!reservation.table_number) return false;
    
    return reservations.some(r => 
      r.id !== reservation.id &&
      r.date === reservation.date &&
      r.time === reservation.time &&
      r.table_number === reservation.table_number
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Reservations</h1>
          <p className="text-muted-foreground">Manage table reservations</p>
        </div>
        <Button onClick={exportToCSV} className="gap-2">
          <Download className="h-4 w-4" />
          Export CSV
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>All Reservations</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Customer</TableHead>
                <TableHead>Contact</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Time</TableHead>
                <TableHead>People</TableHead>
                <TableHead>Table</TableHead>
                <TableHead>Event Type</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {reservations.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center text-muted-foreground">
                    No reservations found
                  </TableCell>
                </TableRow>
              ) : (
                reservations.map((reservation) => {
                  const isDoubleBooked = checkDoubleBooking(reservation);
                  return (
                    <TableRow 
                      key={reservation.id}
                      className={isDoubleBooked ? "bg-destructive/10" : ""}
                    >
                      <TableCell className="font-medium">{reservation.name}</TableCell>
                      <TableCell>
                        <div className="text-sm">
                          <div>{reservation.email}</div>
                          <div className="text-muted-foreground">{reservation.phone}</div>
                        </div>
                      </TableCell>
                      <TableCell>{new Date(reservation.date).toLocaleDateString()}</TableCell>
                      <TableCell>{reservation.time}</TableCell>
                      <TableCell>{reservation.people}</TableCell>
                      <TableCell>
                        {isDoubleBooked && (
                          <Badge variant="destructive" className="mr-2">Double Booked</Badge>
                        )}
                        {reservation.table_number || "-"}
                      </TableCell>
                      <TableCell>
                        {reservation.event_type ? (
                          <Badge variant="outline">{reservation.event_type}</Badge>
                        ) : "-"}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDeleteClick(reservation.id)}
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Cancel Reservation</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to cancel this reservation? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteConfirm} className="bg-destructive">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
