import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AdminBreadcrumb } from "@/components/admin/Breadcrumb";
import { ArrowUpDown, Download, Edit, Trash2, Plus, RefreshCw } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { logActivity } from "@/lib/activityLogger";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

interface Order {
  id: string;
  name: string;
  phone: string;
  items: any;
  total_amount_cents: number;
  date: string;
  time: string;
  dining_type: string;
  payment_status: string;
  status: string;
  created_at: string;
  order_code?: string;
}

const ITEMS_PER_PAGE = 10;

export default function Orders() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [filteredOrders, setFilteredOrders] = useState<Order[]>([]);
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [sortBy, setSortBy] = useState<"date" | "amount" | "name">("date");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");
  const [currentPage, setCurrentPage] = useState(1);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [editingOrder, setEditingOrder] = useState<Order | null>(null);
  const [orderToDelete, setOrderToDelete] = useState<string | null>(null);
  
  // Form state
  const [formName, setFormName] = useState("");
  const [formPhone, setFormPhone] = useState("");
  const [formDate, setFormDate] = useState("");
  const [formTime, setFormTime] = useState("");
  const [formDiningType, setFormDiningType] = useState("dine-in");
  const [formItems, setFormItems] = useState("");
  const [formAmount, setFormAmount] = useState("");
  const [formPaymentStatus, setFormPaymentStatus] = useState("pending");
  const [formStatus, setFormStatus] = useState("pending");

  useEffect(() => {
    fetchOrders();
  }, []);

  useEffect(() => {
    filterAndSortOrders();
  }, [startDate, endDate, statusFilter, searchTerm, sortBy, sortOrder, orders]);

  const fetchOrders = async () => {
    try {
      const { data, error } = await supabase
        .from('orders')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setOrders(data || []);
    } catch (error) {
      console.error('Error fetching orders:', error);
      toast({
        title: "Error loading orders",
        variant: "destructive",
      });
    }
  };

  const filterAndSortOrders = () => {
    let filtered = [...orders];

    if (startDate) {
      filtered = filtered.filter(order => order.date >= startDate);
    }

    if (endDate) {
      filtered = filtered.filter(order => order.date <= endDate);
    }

    if (statusFilter !== "all") {
      filtered = filtered.filter(order => order.status === statusFilter);
    }

    if (searchTerm) {
      filtered = filtered.filter(order =>
        order.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        order.phone.includes(searchTerm)
      );
    }

    // Sort
    filtered.sort((a, b) => {
      let compareValue = 0;
      
      if (sortBy === "date") {
        compareValue = new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
      } else if (sortBy === "amount") {
        compareValue = a.total_amount_cents - b.total_amount_cents;
      } else if (sortBy === "name") {
        compareValue = a.name.localeCompare(b.name);
      }

      return sortOrder === "asc" ? compareValue : -compareValue;
    });

    setFilteredOrders(filtered);
    setCurrentPage(1);
  };

  const handleStatusUpdate = async (orderId: string, newStatus: string) => {
    try {
      const { error } = await supabase
        .from('orders')
        .update({ status: newStatus })
        .eq('id', orderId);

      if (error) throw error;

      await logActivity(`Updated order status to ${newStatus}`, 'order', orderId);

      toast({
        title: "Order status updated",
      });
      
      fetchOrders();
    } catch (error) {
      console.error('Error updating order:', error);
      toast({
        title: "Error updating order",
        variant: "destructive",
      });
    }
  };

  const handleDeleteClick = (orderId: string) => {
    setOrderToDelete(orderId);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!orderToDelete) return;

    try {
      const { error } = await supabase
        .from('orders')
        .delete()
        .eq('id', orderToDelete);

      if (error) throw error;

      await logActivity('Deleted order', 'order', orderToDelete);

      toast({
        title: "Order deleted successfully",
      });
      fetchOrders();
    } catch (error) {
      console.error('Error deleting order:', error);
      toast({
        title: "Error deleting order",
        variant: "destructive",
      });
    } finally {
      setDeleteDialogOpen(false);
      setOrderToDelete(null);
    }
  };

  const resetForm = () => {
    setFormName("");
    setFormPhone("");
    setFormDate("");
    setFormTime("");
    setFormDiningType("dine-in");
    setFormItems("");
    setFormAmount("");
    setFormPaymentStatus("pending");
    setFormStatus("pending");
  };

  const handleAddNew = () => {
    resetForm();
    setEditingOrder(null);
    setAddDialogOpen(true);
  };

  const handleEdit = (order: Order) => {
    setFormName(order.name);
    setFormPhone(order.phone);
    setFormDate(order.date);
    setFormTime(order.time);
    setFormDiningType(order.dining_type);
    setFormItems(JSON.stringify(order.items, null, 2));
    setFormAmount((order.total_amount_cents / 100).toString());
    setFormPaymentStatus(order.payment_status);
    setFormStatus(order.status);
    setEditingOrder(order);
    setEditDialogOpen(true);
  };

  const handleSaveOrder = async () => {
    if (!formName || !formPhone || !formDate || !formTime || !formItems || !formAmount) {
      toast({
        title: "Please fill in all required fields",
        variant: "destructive",
      });
      return;
    }

    try {
      let parsedItems;
      try {
        parsedItems = JSON.parse(formItems);
      } catch {
        toast({
          title: "Invalid items format",
          description: "Items must be valid JSON",
          variant: "destructive",
        });
        return;
      }

      const orderData = {
        name: formName,
        phone: formPhone,
        date: formDate,
        time: formTime,
        dining_type: formDiningType,
        items: parsedItems,
        total_amount_cents: Math.round(parseFloat(formAmount) * 100),
        payment_status: formPaymentStatus,
        status: formStatus,
        user_id: null, // Admin-created orders don't belong to a specific user account
      };

      if (editingOrder) {
        // Update existing
        const { error } = await supabase
          .from('orders')
          .update(orderData)
          .eq('id', editingOrder.id);

        if (error) throw error;
        
        await logActivity('Updated order', 'order', editingOrder.id);
        
        toast({
          title: "Order updated successfully",
        });
        setEditDialogOpen(false);
      } else {
        // Create new
        const { error } = await supabase
          .from('orders')
          .insert(orderData);

        if (error) throw error;
        
        await logActivity('Created new order manually', 'order');
        
        toast({
          title: "Order created successfully",
        });
        setAddDialogOpen(false);
      }

      fetchOrders();
      resetForm();
    } catch (error) {
      console.error('Error saving order:', error);
      toast({
        title: "Error saving order",
        variant: "destructive",
      });
    }
  };

  const exportToCSV = () => {
    const headers = ["Customer", "Phone", "Items", "Type", "Date", "Time", "Total", "Payment Status", "Status"];
    const csvContent = [
      headers.join(","),
      ...filteredOrders.map(o => [
        o.name,
        o.phone,
        o.items.map((item: any) => item.name).join("; "),
        o.dining_type,
        o.date,
        o.time,
        (o.total_amount_cents / 100).toFixed(2),
        o.payment_status,
        o.status
      ].join(","))
    ].join("\n");

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `orders_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();

    toast({
      title: "Orders exported successfully",
    });
  };

  const toggleSort = (field: "date" | "amount" | "name") => {
    if (sortBy === field) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      setSortBy(field);
      setSortOrder("desc");
    }
  };

  const paginatedOrders = filteredOrders.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  const totalPages = Math.ceil(filteredOrders.length / ITEMS_PER_PAGE);

  return (
    <div className="space-y-6">
      <AdminBreadcrumb />

      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Orders</h1>
          <p className="text-muted-foreground">View and manage all orders</p>
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
                  Export CSV
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Export orders to CSV</p>
              </TooltipContent>
            </Tooltip>
          </div>
        </TooltipProvider>
      </div>

      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle>Filter & Search</CardTitle>
            <Button onClick={filterAndSortOrders} variant="outline" size="sm" className="gap-2">
              <RefreshCw className="h-4 w-4" />
              Refresh
            </Button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-4">
            <div>
              <Label htmlFor="search">Search</Label>
              <Input
                id="search"
                placeholder="Name or phone..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="startDate">Start Date</Label>
              <Input
                id="startDate"
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="endDate">End Date</Label>
              <Input
                id="endDate"
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="status">Status</Label>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger id="status">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="confirmed">Confirmed</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                  <SelectItem value="canceled">Canceled</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => toggleSort("name")}
                    className="gap-1"
                  >
                    Customer
                    <ArrowUpDown className="h-4 w-4" />
                  </Button>
                </TableHead>
                <TableHead>Phone</TableHead>
                <TableHead>Items</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => toggleSort("date")}
                    className="gap-1"
                  >
                    Date & Time
                    <ArrowUpDown className="h-4 w-4" />
                  </Button>
                </TableHead>
                <TableHead>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => toggleSort("amount")}
                    className="gap-1"
                  >
                    Total
                    <ArrowUpDown className="h-4 w-4" />
                  </Button>
                </TableHead>
                <TableHead>Payment</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {paginatedOrders.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={9} className="text-center text-muted-foreground">
                    No orders found
                  </TableCell>
                </TableRow>
              ) : (
                paginatedOrders.map((order) => (
                  <TableRow key={order.id}>
                     <TableCell>
                      <div className="font-medium">{order.name}</div>
                      {order.order_code && (
                        <div className="text-xs text-muted-foreground">ID: {order.order_code}</div>
                      )}
                    </TableCell>
                    <TableCell>{order.phone}</TableCell>
                    <TableCell>
                      <div className="max-w-xs truncate">
                        {order.items.map((item: any) => item.name || item.name_en || item.name_de).join(", ")}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">{order.dining_type}</Badge>
                    </TableCell>
                    <TableCell>
                      {new Date(order.date).toLocaleDateString()} {order.time}
                    </TableCell>
                    <TableCell className="font-medium">
                      €{(order.total_amount_cents / 100).toFixed(2)}
                    </TableCell>
                    <TableCell>
                      <Badge 
                        variant={order.payment_status === 'paid' ? 'default' : 'secondary'}
                      >
                        {order.payment_status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Select
                        value={order.status || 'pending'}
                        onValueChange={(value) => handleStatusUpdate(order.id, value)}
                      >
                        <SelectTrigger className="w-[140px]">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="pending">Pending</SelectItem>
                          <SelectItem value="confirmed">Confirmed</SelectItem>
                          <SelectItem value="completed">Completed</SelectItem>
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
                                onClick={() => handleEdit(order)}
                              >
                                <Edit className="h-4 w-4 text-accent" />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>
                              <p>Edit order</p>
                            </TooltipContent>
                          </Tooltip>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleDeleteClick(order.id)}
                              >
                                <Trash2 className="h-4 w-4 text-destructive" />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>
                              <p>Delete order</p>
                            </TooltipContent>
                          </Tooltip>
                        </div>
                      </TooltipProvider>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>

          {totalPages > 1 && (
            <div className="flex items-center justify-between mt-4">
              <p className="text-sm text-muted-foreground">
                Showing {((currentPage - 1) * ITEMS_PER_PAGE) + 1} to {Math.min(currentPage * ITEMS_PER_PAGE, filteredOrders.length)} of {filteredOrders.length} orders
              </p>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                >
                  Previous
                </Button>
                <div className="flex items-center gap-1">
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                    <Button
                      key={page}
                      variant={currentPage === page ? "default" : "outline"}
                      size="sm"
                      onClick={() => setCurrentPage(page)}
                      className="w-10"
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
            </div>
          )}
        </CardContent>
      </Card>

      {/* Delete Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Order</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this order? This action cannot be undone.
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
            <DialogTitle>{editingOrder ? "Edit Order" : "Add New Order"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">Customer Name *</Label>
                <Input
                  id="name"
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  placeholder="John Doe"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone">Phone *</Label>
                <Input
                  id="phone"
                  value={formPhone}
                  onChange={(e) => setFormPhone(e.target.value)}
                  placeholder="+49 123 456789"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="date">Date *</Label>
                <Input
                  id="date"
                  type="date"
                  value={formDate}
                  onChange={(e) => setFormDate(e.target.value)}
                />
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
                <Label htmlFor="diningType">Dining Type *</Label>
                <Select value={formDiningType} onValueChange={setFormDiningType}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="dine-in">Dine-in</SelectItem>
                    <SelectItem value="pickup">Pickup</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="amount">Total Amount (€) *</Label>
                <Input
                  id="amount"
                  type="number"
                  step="0.01"
                  value={formAmount}
                  onChange={(e) => setFormAmount(e.target.value)}
                  placeholder="25.50"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="items">Items (JSON format) *</Label>
              <Textarea
                id="items"
                value={formItems}
                onChange={(e) => setFormItems(e.target.value)}
                placeholder='[{"name": "Dish Name", "quantity": 1, "price": 1000}]'
                rows={4}
              />
              <p className="text-xs text-muted-foreground">
                Enter items in JSON format. Price should be in cents (e.g., 1000 = €10.00)
              </p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="paymentStatus">Payment Status</Label>
                <Select value={formPaymentStatus} onValueChange={setFormPaymentStatus}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="paid">Paid</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="orderStatus">Order Status</Label>
                <Select value={formStatus} onValueChange={setFormStatus}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="confirmed">Confirmed</SelectItem>
                    <SelectItem value="completed">Completed</SelectItem>
                    <SelectItem value="canceled">Canceled</SelectItem>
                  </SelectContent>
                </Select>
              </div>
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
            <Button onClick={handleSaveOrder}>
              {editingOrder ? "Update" : "Create"} Order
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}