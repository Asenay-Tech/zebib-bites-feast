import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { toast } from "@/hooks/use-toast";
import { Trash2, Download, FileText, Plus, Edit, CalendarIcon } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AdminBreadcrumb } from "@/components/admin/Breadcrumb";
import { logActivity } from "@/lib/activityLogger";
import { logger } from "@/lib/logger";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
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
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

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
  status: string;
  created_at: string;
}

export default function Reservations() {
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [reservationToDelete, setReservationToDelete] = useState<string | null>(null);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [editingReservation, setEditingReservation] = useState<Reservation | null>(null);
  
  // Form state
  const [formName, setFormName] = useState("");
  const [formEmail, setFormEmail] = useState("");
  const [formPhone, setFormPhone] = useState("");
  const [formDate, setFormDate] = useState<Date | undefined>();
  const [formTime, setFormTime] = useState("");
  const [formPeople, setFormPeople] = useState(2);
  const [formTable, setFormTable] = useState<number | null>(null);
  const [formEventType, setFormEventType] = useState("");
  const [formNotes, setFormNotes] = useState("");
  const [formStatus, setFormStatus] = useState("pending");

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
      logger.error('Error fetching reservations:', error);
      toast({
        title: "Error loading reservations",
        variant: "destructive",
      });
    }
  };

  const handleStatusUpdate = async (reservationId: string, newStatus: string) => {
    try {
      const { error } = await supabase
        .from('reservations')
        .update({ status: newStatus })
        .eq('id', reservationId);

      if (error) throw error;

      await logActivity(`Updated reservation status to ${newStatus}`, 'reservation', reservationId);

      toast({
        title: "Reservation status updated",
      });
      
      fetchReservations();
    } catch (error) {
      logger.error('Error updating reservation:', error);
      toast({
        title: "Error updating reservation",
        variant: "destructive",
      });
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

      await logActivity('Deleted reservation', 'reservation', reservationToDelete);

      toast({
        title: "Reservation cancelled successfully",
      });
      fetchReservations();
    } catch (error) {
      logger.error('Error deleting reservation:', error);
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
    const headers = ["Name", "Email", "Phone", "Date", "Time", "People", "Table", "Event Type", "Status"];
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
        r.event_type || "-",
        r.status
      ].join(","))
    ].join("\n");

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `reservations_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();

    toast({
      title: "Reservations exported successfully",
    });
  };

  const exportToPDF = async () => {
    toast({
      title: "PDF export coming soon",
      description: "This feature will be available in a future update",
    });
  };

  const checkDoubleBooking = (reservation: Reservation) => {
    if (!reservation.table_number) return false;
    
    return reservations.some(r => 
      r.id !== reservation.id &&
      r.date === reservation.date &&
      r.time === reservation.time &&
      r.table_number === reservation.table_number &&
      r.status !== 'canceled'
    );
  };

  const resetForm = () => {
    setFormName("");
    setFormEmail("");
    setFormPhone("");
    setFormDate(undefined);
    setFormTime("");
    setFormPeople(2);
    setFormTable(null);
    setFormEventType("");
    setFormNotes("");
    setFormStatus("pending");
  };

  const handleAddNew = () => {
    resetForm();
    setEditingReservation(null);
    setAddDialogOpen(true);
  };

  const handleEdit = (reservation: Reservation) => {
    setFormName(reservation.name);
    setFormEmail(reservation.email);
    setFormPhone(reservation.phone);
    setFormDate(new Date(reservation.date));
    setFormTime(reservation.time);
    setFormPeople(reservation.people);
    setFormTable(reservation.table_number);
    setFormEventType(reservation.event_type || "");
    setFormNotes(reservation.notes || "");
    setFormStatus(reservation.status);
    setEditingReservation(reservation);
    setEditDialogOpen(true);
  };

  const handleSaveReservation = async () => {
    if (!formName || !formEmail || !formPhone || !formDate || !formTime) {
      toast({
        title: "Please fill in all required fields",
        variant: "destructive",
      });
      return;
    }

    try {
      const reservationData = {
        name: formName,
        email: formEmail,
        phone: formPhone,
        date: format(formDate, "yyyy-MM-dd"),
        time: formTime,
        people: formPeople,
        table_number: formTable,
        event_type: formEventType || null,
        notes: formNotes || null,
        status: formStatus,
        user_id: null, // Admin-created reservations don't belong to a specific user account
      };

      if (editingReservation) {
        // Update existing
        const { error } = await supabase
          .from('reservations')
          .update(reservationData)
          .eq('id', editingReservation.id);

        if (error) throw error;
        
        await logActivity('Updated reservation', 'reservation', editingReservation.id);
        
        toast({
          title: "Reservation updated successfully",
        });
        setEditDialogOpen(false);
      } else {
        // Create new
        const { error } = await supabase
          .from('reservations')
          .insert(reservationData);

        if (error) throw error;
        
        await logActivity('Created new reservation', 'reservation');
        
        toast({
          title: "Reservation created successfully",
        });
        setAddDialogOpen(false);
      }

      fetchReservations();
      resetForm();
    } catch (error) {
      logger.error('Error saving reservation:', error);
      toast({
        title: "Error saving reservation",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="space-y-6">
      <AdminBreadcrumb />

      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Reservations</h1>
          <p className="text-muted-foreground">Manage table reservations</p>
        </div>
        <TooltipProvider>
          <div className="flex gap-2">
            <Button onClick={handleAddNew} className="gap-2">
              <Plus className="h-4 w-4" />
              Add New
            </Button>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button onClick={exportToCSV} variant="outline" className="gap-2">
                  <Download className="h-4 w-4" />
                  CSV
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Export to CSV</p>
              </TooltipContent>
            </Tooltip>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button onClick={exportToPDF} variant="outline" className="gap-2">
                  <FileText className="h-4 w-4" />
                  PDF
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Export to PDF</p>
              </TooltipContent>
            </Tooltip>
          </div>
        </TooltipProvider>
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
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {reservations.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={9} className="text-center text-muted-foreground">
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
                          <Badge variant="destructive" className="mr-2">Conflict!</Badge>
                        )}
                        {reservation.table_number || "-"}
                      </TableCell>
                      <TableCell>
                        {reservation.event_type ? (
                          <Badge variant="outline">{reservation.event_type}</Badge>
                        ) : "-"}
                      </TableCell>
                      <TableCell>
                        <Select
                          value={reservation.status || 'pending'}
                          onValueChange={(value) => handleStatusUpdate(reservation.id, value)}
                        >
                          <SelectTrigger className="w-[130px]">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="pending">Pending</SelectItem>
                            <SelectItem value="confirmed">Confirmed</SelectItem>
                            <SelectItem value="canceled">Canceled</SelectItem>
                          </SelectContent>
                        </Select>
                      </TableCell>
                      <TableCell className="text-right">
                        <TooltipProvider>
                          <div className="flex gap-2 justify-end">
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleEdit(reservation)}
                                >
                                  <Edit className="h-4 w-4 text-accent" />
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent>
                                <p>Edit reservation</p>
                              </TooltipContent>
                            </Tooltip>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleDeleteClick(reservation.id)}
                                >
                                  <Trash2 className="h-4 w-4 text-destructive" />
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent>
                                <p>Delete reservation</p>
                              </TooltipContent>
                            </Tooltip>
                          </div>
                        </TooltipProvider>
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

      {/* Add/Edit Dialog */}
      <Dialog open={addDialogOpen || editDialogOpen} onOpenChange={(open) => {
        if (!open) {
          setAddDialogOpen(false);
          setEditDialogOpen(false);
          resetForm();
        }
      }}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingReservation ? "Edit Reservation" : "Add New Reservation"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">Name *</Label>
                <Input
                  id="name"
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  placeholder="Customer name"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email *</Label>
                <Input
                  id="email"
                  type="email"
                  value={formEmail}
                  onChange={(e) => setFormEmail(e.target.value)}
                  placeholder="customer@example.com"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="phone">Phone *</Label>
              <Input
                id="phone"
                type="tel"
                value={formPhone}
                onChange={(e) => setFormPhone(e.target.value)}
                placeholder="+49 123 456789"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Date *</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-full justify-start text-left font-normal",
                        !formDate && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {formDate ? format(formDate, "PPP") : "Pick a date"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={formDate}
                      onSelect={setFormDate}
                      initialFocus
                      className="pointer-events-auto"
                    />
                  </PopoverContent>
                </Popover>
              </div>

              <div className="space-y-2">
                <Label htmlFor="time">Time *</Label>
                <Input
                  id="time"
                  type="time"
                  value={formTime}
                  onChange={(e) => setFormTime(e.target.value)}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="people">People *</Label>
                <Input
                  id="people"
                  type="number"
                  min="1"
                  value={formPeople}
                  onChange={(e) => setFormPeople(parseInt(e.target.value) || 1)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="table">Table Number</Label>
                <Select value={formTable?.toString() || ""} onValueChange={(v) => setFormTable(v ? parseInt(v) : null)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select table" />
                  </SelectTrigger>
                  <SelectContent>
                    {Array.from({ length: 15 }, (_, i) => i + 1).map(t => (
                      <SelectItem key={t} value={t.toString()}>
                        Table {t}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="eventType">Event Type</Label>
              <Input
                id="eventType"
                value={formEventType}
                onChange={(e) => setFormEventType(e.target.value)}
                placeholder="Birthday, Wedding, etc."
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="status">Status</Label>
              <Select value={formStatus} onValueChange={setFormStatus}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="confirmed">Confirmed</SelectItem>
                  <SelectItem value="canceled">Canceled</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="notes">Notes</Label>
              <Textarea
                id="notes"
                value={formNotes}
                onChange={(e) => setFormNotes(e.target.value)}
                placeholder="Any special requests or notes..."
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => {
              setAddDialogOpen(false);
              setEditDialogOpen(false);
              resetForm();
            }}>
              Cancel
            </Button>
            <Button onClick={handleSaveReservation}>
              {editingReservation ? "Update" : "Create"} Reservation
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}