'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Plus, Edit, Trash2, DollarSign, Clock, Star } from 'lucide-react';
import { toast } from 'sonner';
import { Package } from '@/lib/types';
import { PackageDialog } from './PackageDialog';
import { DeleteConfirmDialog } from './DeleteConfirmDialog';

interface PackagesTabProps {
  initialPackages?: Package[];
}

export function PackagesTab({ initialPackages = [] }: PackagesTabProps) {
  const [packages, setPackages] = useState<Package[]>(initialPackages);
  const [loading, setLoading] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingPackage, setEditingPackage] = useState<Package | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [packageToDelete, setPackageToDelete] = useState<Package | null>(null);

  // Fetch packages
  const fetchPackages = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/packages');
      if (!response.ok) throw new Error('Failed to fetch packages');
      const data = await response.json();
      setPackages(data.packages || []);
    } catch (error) {
      console.error('Error fetching packages:', error);
      toast.error('Failed to fetch packages');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (initialPackages.length === 0) {
      fetchPackages();
    }
  }, [initialPackages.length]);

  // Handle package creation/update
  const handlePackageSave = async (packageData: Partial<Package>) => {
    try {
      const url = editingPackage 
        ? `/api/packages/${editingPackage.id}`
        : '/api/packages';
      
      const method = editingPackage ? 'PUT' : 'POST';
      
      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(packageData)
      });

      // Attempt to parse JSON body (if any) for both success and error cases.
      let data: any = null;
      try {
        // Some responses may be empty; guard against that.
        data = await response.json().catch(() => null);
      } catch (e) {
        // If parsing fails, capture text for debugging and log minimally.
        const text = await response.text().catch(() => null);
        console.warn(`Failed to parse JSON response from packages API (status ${response.status})`, text ? `response text: ${String(text).slice(0, 200)}` : 'no text');
        throw new Error(`Invalid JSON response from server (status ${response.status})`);
      }

      if (!response.ok) {
        const serverMsg = data && (data.error || data.message) ? `${data.error || data.message}${data.details ? `: ${data.details}` : ''}` : `Failed to save package (status ${response.status})`;
        // Log a concise warning (avoid printing raw objects which Next.js may surface)
        console.warn(`Packages API returned error (status ${response.status}): ${serverMsg}`);
        // Handle out-of-band deletion: if a package was deleted elsewhere while
        // the user was editing it, the server will respond 404 with a
        // 'Package not found' message. In that case, close the dialog and
        // refresh the list so the UI doesn't try to update a missing item.
        if (response.status === 404 && typeof serverMsg === 'string' && serverMsg.toLowerCase().includes('package not found')) {
          toast.error('Package not found — it may have been deleted elsewhere. Refreshing list.');
          setDialogOpen(false);
          setEditingPackage(null);
          fetchPackages();
          return;
        }
        throw new Error(serverMsg);
      }

      if (!data || !data.package) {
        console.warn(`Packages API returned unexpected body for save (status ${response.status})`);
        throw new Error('Unexpected server response: missing `package` object');
      }

      if (editingPackage) {
        setPackages(prev => prev.map(pkg => 
          pkg.id === editingPackage.id ? data.package : pkg
        ));
        toast.success('Package updated successfully');
      } else {
        setPackages(prev => [data.package, ...prev]);
        toast.success('Package created successfully');
      }
      
      setDialogOpen(false);
      setEditingPackage(null);
    } catch (error) {
      // Surface a user-friendly toast and log a short warning for debugging.
      const msg = error instanceof Error ? error.message : 'Failed to save package';
      console.warn('Error saving package:', msg);
      toast.error(msg);
    }
  };

  // Handle package deletion
  const handlePackageDelete = async () => {
    if (!packageToDelete) return;

    try {
      const response = await fetch(`/api/packages/${packageToDelete.id}`, {
        method: 'DELETE'
      });

      let respBody: any = null;
      try {
        respBody = await response.json().catch(() => null);
      } catch (e) {
        respBody = null;
      }

      if (!response.ok) {
        const serverMsg = respBody && (respBody.error || respBody.message) ? `${respBody.error || respBody.message}${respBody.details ? `: ${respBody.details}` : ''}` : `Failed to delete package (status ${response.status})`;
        console.warn(`Packages API delete error (status ${response.status}): ${serverMsg}`);
        throw new Error(serverMsg);
      }

      // Validate body contains deleted package info (optional)
      if (respBody && respBody.package) {
        setPackages(prev => prev.filter(pkg => pkg.id !== respBody.package.id));
      } else {
        // Fall back to removing by id we attempted to delete
        setPackages(prev => prev.filter(pkg => pkg.id !== packageToDelete.id));
      }

      toast.success('Package deleted successfully');
      setDeleteDialogOpen(false);
      setPackageToDelete(null);
    } catch (error) {
      const msg = error instanceof Error ? error.message : 'Failed to delete package';
      console.warn('Error deleting package:', msg);
      toast.error(msg);
    }
  };

  const openEditDialog = (pkg: Package) => {
    setEditingPackage(pkg);
    setDialogOpen(true);
  };

  const openCreateDialog = () => {
    setEditingPackage(null);
    setDialogOpen(true);
  };

  const openDeleteDialog = (pkg: Package) => {
    setPackageToDelete(pkg);
    setDeleteDialogOpen(true);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Package Management</h2>
          <p className="text-gray-600">Manage driving lesson packages, pricing, and features</p>
        </div>
        <Button onClick={openCreateDialog} className="flex items-center gap-2">
          <Plus className="h-4 w-4" />
          Add Package
        </Button>
      </div>

      {loading ? (
        <div className="flex justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {packages.map((pkg) => (
            <Card key={pkg.id} className="relative">
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <CardTitle className="flex items-center gap-2">
                      {pkg.name}
                      {pkg.popular && (
                        <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">
                          <Star className="h-3 w-3 mr-1" />
                          Popular
                        </Badge>
                      )}
                    </CardTitle>
                    <CardDescription className="mt-2">
                      {pkg.description}
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-2xl font-bold text-green-600">
                      <DollarSign className="h-5 w-5" />
                      {pkg.price.toFixed(2)}
                    </div>
                    <div className="flex items-center gap-1 text-sm text-gray-600">
                      <Clock className="h-4 w-4" />
                      {pkg.hours} hours
                    </div>
                  </div>
                  
                  <div>
                    <h4 className="font-medium text-sm text-gray-700 mb-2">Features:</h4>
                    <ul className="text-sm text-gray-600 space-y-1">
                      {pkg.features.slice(0, 3).map((feature, index) => (
                        <li key={index} className="flex items-start gap-1">
                          <span className="text-green-500 mt-0.5">•</span>
                          {feature}
                        </li>
                      ))}
                      {pkg.features.length > 3 && (
                        <li className="text-gray-400 text-xs">
                          +{pkg.features.length - 3} more features
                        </li>
                      )}
                    </ul>
                  </div>
                  
                  <div className="flex gap-2 pt-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => openEditDialog(pkg)}
                      className="flex-1"
                    >
                      <Edit className="h-4 w-4 mr-1" />
                      Edit
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => openDeleteDialog(pkg)}
                      className="text-red-600 hover:text-red-700 hover:bg-red-50"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {packages.length === 0 && !loading && (
        <div className="text-center py-12">
          <div className="text-gray-400 mb-4">
            <DollarSign className="h-12 w-12 mx-auto" />
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">No packages found</h3>
          <p className="text-gray-600 mb-4">Get started by creating your first package</p>
          <Button onClick={openCreateDialog}>
            <Plus className="h-4 w-4 mr-2" />
            Create Package
          </Button>
        </div>
      )}

      <PackageDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        package={editingPackage}
        onSave={handlePackageSave}
      />

      <DeleteConfirmDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        title="Delete Package"
        description={`Are you sure you want to delete "${packageToDelete?.name}"? This action cannot be undone.`}
        onConfirm={handlePackageDelete}
      />
    </div>
  );
}