import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { toast } from "@/hooks/use-toast";
import { Plus, Edit, Trash2, GripVertical, Upload } from "lucide-react";
import { AdminBreadcrumb } from "@/components/admin/Breadcrumb";
import { logActivity } from "@/lib/activityLogger";
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

interface Specialty {
  id: string;
  title_de: string;
  title_en: string;
  description_de: string | null;
  description_en: string | null;
  image_url: string | null;
  display_order: number;
}

export default function Specialties() {
  const [specialties, setSpecialties] = useState<Specialty[]>([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [editingSpecialty, setEditingSpecialty] = useState<Specialty | null>(null);
  const [specialtyToDelete, setSpecialtyToDelete] = useState<string | null>(null);

  // Form state
  const [formTitleDe, setFormTitleDe] = useState("");
  const [formTitleEn, setFormTitleEn] = useState("");
  const [formDescDe, setFormDescDe] = useState("");
  const [formDescEn, setFormDescEn] = useState("");
  const [formImageUrl, setFormImageUrl] = useState("");
  const [uploadingImage, setUploadingImage] = useState(false);

  useEffect(() => {
    fetchSpecialties();
  }, []);

  const fetchSpecialties = async () => {
    try {
      const { data, error } = await supabase
        .from('specialties')
        .select('*')
        .order('display_order', { ascending: true });

      if (error) throw error;
      setSpecialties(data || []);
    } catch (error) {
      console.error('Error fetching specialties:', error);
      toast({
        title: "Error loading specialties",
        variant: "destructive",
      });
    }
  };

  const resetForm = () => {
    setFormTitleDe("");
    setFormTitleEn("");
    setFormDescDe("");
    setFormDescEn("");
    setFormImageUrl("");
  };

  const handleAddNew = () => {
    resetForm();
    setEditingSpecialty(null);
    setDialogOpen(true);
  };

  const handleEdit = (specialty: Specialty) => {
    setFormTitleDe(specialty.title_de);
    setFormTitleEn(specialty.title_en);
    setFormDescDe(specialty.description_de || "");
    setFormDescEn(specialty.description_en || "");
    setFormImageUrl(specialty.image_url || "");
    setEditingSpecialty(specialty);
    setDialogOpen(true);
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setUploadingImage(true);
      const fileExt = file.name.split('.').pop();
      const fileName = `${Math.random()}.${fileExt}`;
      const filePath = `${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('menu-images')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data } = supabase.storage
        .from('menu-images')
        .getPublicUrl(filePath);

      setFormImageUrl(data.publicUrl);
      toast({
        title: "Image uploaded successfully",
      });
    } catch (error) {
      console.error('Error uploading image:', error);
      toast({
        title: "Error uploading image",
        variant: "destructive",
      });
    } finally {
      setUploadingImage(false);
    }
  };

  const handleSave = async () => {
    if (!formTitleDe || !formTitleEn) {
      toast({
        title: "Please fill in all required fields",
        variant: "destructive",
      });
      return;
    }

    try {
      const specialtyData = {
        title_de: formTitleDe,
        title_en: formTitleEn,
        description_de: formDescDe || null,
        description_en: formDescEn || null,
        image_url: formImageUrl || null,
        display_order: editingSpecialty ? editingSpecialty.display_order : specialties.length,
        updated_by: (await supabase.auth.getUser()).data.user?.id,
      };

      if (editingSpecialty) {
        const { error } = await supabase
          .from('specialties')
          .update(specialtyData)
          .eq('id', editingSpecialty.id);

        if (error) throw error;

        await logActivity('Updated specialty', 'specialty', editingSpecialty.id);

        toast({
          title: "Specialty updated successfully",
        });
      } else {
        const { error } = await supabase
          .from('specialties')
          .insert({
            ...specialtyData,
            created_by: (await supabase.auth.getUser()).data.user?.id,
          });

        if (error) throw error;

        await logActivity('Created new specialty', 'specialty');

        toast({
          title: "Specialty created successfully",
        });
      }

      fetchSpecialties();
      setDialogOpen(false);
      resetForm();
    } catch (error) {
      console.error('Error saving specialty:', error);
      toast({
        title: "Error saving specialty",
        variant: "destructive",
      });
    }
  };

  const handleDeleteClick = (id: string) => {
    setSpecialtyToDelete(id);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!specialtyToDelete) return;

    try {
      const { error } = await supabase
        .from('specialties')
        .delete()
        .eq('id', specialtyToDelete);

      if (error) throw error;

      await logActivity('Deleted specialty', 'specialty', specialtyToDelete);

      toast({
        title: "Specialty deleted successfully",
      });

      fetchSpecialties();
    } catch (error) {
      console.error('Error deleting specialty:', error);
      toast({
        title: "Error deleting specialty",
        variant: "destructive",
      });
    } finally {
      setDeleteDialogOpen(false);
      setSpecialtyToDelete(null);
    }
  };

  const moveSpecialty = async (id: string, direction: 'up' | 'down') => {
    const index = specialties.findIndex(s => s.id === id);
    if (index === -1) return;
    if (direction === 'up' && index === 0) return;
    if (direction === 'down' && index === specialties.length - 1) return;

    const newIndex = direction === 'up' ? index - 1 : index + 1;
    const newSpecialties = [...specialties];
    [newSpecialties[index], newSpecialties[newIndex]] = [newSpecialties[newIndex], newSpecialties[index]];

    try {
      await Promise.all(
        newSpecialties.map((specialty, idx) =>
          supabase
            .from('specialties')
            .update({ display_order: idx })
            .eq('id', specialty.id)
        )
      );

      setSpecialties(newSpecialties);
      toast({
        title: "Order updated successfully",
      });
    } catch (error) {
      console.error('Error updating order:', error);
      toast({
        title: "Error updating order",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="space-y-6">
      <AdminBreadcrumb />

      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Our Specialties</h1>
          <p className="text-muted-foreground">Manage your restaurant's specialty items</p>
        </div>
        <Button onClick={handleAddNew} className="gap-2">
          <Plus className="h-4 w-4" />
          Add New
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {specialties.map((specialty, index) => (
          <Card key={specialty.id}>
            <CardHeader className="relative">
              {specialty.image_url && (
                <img
                  src={specialty.image_url}
                  alt={specialty.title_en}
                  className="w-full h-48 object-cover rounded-t-lg mb-4"
                />
              )}
              <CardTitle className="text-lg">{specialty.title_en}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-4 line-clamp-2">
                {specialty.description_en}
              </p>
              
              <div className="flex gap-2 flex-wrap">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => moveSpecialty(specialty.id, 'up')}
                  disabled={index === 0}
                >
                  <GripVertical className="h-4 w-4 mr-1" />
                  Up
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => moveSpecialty(specialty.id, 'down')}
                  disabled={index === specialties.length - 1}
                >
                  <GripVertical className="h-4 w-4 mr-1" />
                  Down
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleEdit(specialty)}
                >
                  <Edit className="h-4 w-4" />
                </Button>
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => handleDeleteClick(specialty.id)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Add/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={(open) => {
        if (!open) {
          setDialogOpen(false);
          resetForm();
        }
      }}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingSpecialty ? "Edit Specialty" : "Add New Specialty"}</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="title-de">Title (German) *</Label>
                <Input
                  id="title-de"
                  value={formTitleDe}
                  onChange={(e) => setFormTitleDe(e.target.value)}
                  placeholder="Deutscher Titel"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="title-en">Title (English) *</Label>
                <Input
                  id="title-en"
                  value={formTitleEn}
                  onChange={(e) => setFormTitleEn(e.target.value)}
                  placeholder="English Title"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="desc-de">Description (German)</Label>
              <Textarea
                id="desc-de"
                value={formDescDe}
                onChange={(e) => setFormDescDe(e.target.value)}
                placeholder="Deutsche Beschreibung"
                rows={3}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="desc-en">Description (English)</Label>
              <Textarea
                id="desc-en"
                value={formDescEn}
                onChange={(e) => setFormDescEn(e.target.value)}
                placeholder="English Description"
                rows={3}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="image">Image</Label>
              <div className="flex gap-2">
                <Input
                  id="image"
                  type="file"
                  accept="image/*"
                  onChange={handleImageUpload}
                  disabled={uploadingImage}
                />
                {uploadingImage && <span className="text-sm text-muted-foreground">Uploading...</span>}
              </div>
              {formImageUrl && (
                <img src={formImageUrl} alt="Preview" className="w-full h-48 object-cover rounded mt-2" />
              )}
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => {
              setDialogOpen(false);
              resetForm();
            }}>
              Cancel
            </Button>
            <Button onClick={handleSave}>
              {editingSpecialty ? "Update" : "Create"} Specialty
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Specialty</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this specialty? This action cannot be undone.
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
