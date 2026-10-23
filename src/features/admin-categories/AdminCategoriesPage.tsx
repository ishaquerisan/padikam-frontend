import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/services/api/client';
import { Plus, Edit, Trash2, X, Check, FolderTree } from 'lucide-react';

export const AdminCategoriesPage: React.FC = () => {
  const queryClient = useQueryClient();
  const [modalOpen, setModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<any | null>(null);

  const [name, setName] = useState('');
  const [slug, setSlug] = useState('');
  const [description, setDescription] = useState('');
  const [icon, setIcon] = useState('MessageCircle');
  const [sortOrder, setSortOrder] = useState<number>(0);
  const [status, setStatus] = useState<'ACTIVE' | 'INACTIVE'>('ACTIVE');

  const { data: categories = [], isLoading } = useQuery<any[]>({
    queryKey: ['admin-categories'],
    queryFn: () => apiClient.get('/admin/categories'),
  });

  const saveMutation = useMutation({
    mutationFn: async () => {
      const payload = {
        name,
        slug,
        description,
        icon,
        sort_order: sortOrder,
        status,
      };

      if (editingCategory) {
        return apiClient.put(`/admin/categories/${editingCategory.id}`, payload);
      } else {
        return apiClient.post('/admin/categories', payload);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-categories'] });
      queryClient.invalidateQueries({ queryKey: ['categories'] });
      closeModal();
    },
    onError: (err: any) => {
      alert(err.message || 'Operation failed');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => apiClient.delete(`/admin/categories/${id}`),
    onSuccess: (res: any) => {
      alert(res.message || 'Category updated');
      queryClient.invalidateQueries({ queryKey: ['admin-categories'] });
    },
  });

  const openCreateModal = () => {
    setEditingCategory(null);
    setName('');
    setSlug('');
    setDescription('');
    setIcon('MessageCircle');
    setSortOrder(categories.length + 1);
    setStatus('ACTIVE');
    setModalOpen(true);
  };

  const openEditModal = (cat: any) => {
    setEditingCategory(cat);
    setName(cat.name);
    setSlug(cat.slug);
    setDescription(cat.description || '');
    setIcon(cat.icon || 'MessageCircle');
    setSortOrder(cat.sort_order || 0);
    setStatus(cat.status || 'ACTIVE');
    setModalOpen(true);
  };

  const closeModal = () => {
    setModalOpen(false);
    setEditingCategory(null);
  };

  const autoGenerateSlug = (val: string) => {
    setName(val);
    if (!editingCategory) {
      setSlug(
        val
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, '-')
          .replace(/(^-|-$)+/g, ''),
      );
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h2 style={{ fontSize: '1.4rem', fontWeight: 800 }}>Category Management</h2>
          <p style={{ color: 'var(--color-text-secondary)', fontSize: '0.9rem' }}>
            Configure learning categories, taxonomies, sort orders, and content counts.
          </p>
        </div>
        <button onClick={openCreateModal} className="btn btn-primary">
          <Plus size={18} />
          <span>Add Category</span>
        </button>
      </div>

      <div className="card" style={{ padding: '0', overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.9rem' }}>
          <thead>
            <tr style={{ backgroundColor: 'var(--color-surface-muted)', borderBottom: '1px solid var(--color-border)' }}>
              <th style={{ padding: '14px 16px', fontWeight: 700, width: '60px' }}>Order</th>
              <th style={{ padding: '14px 16px', fontWeight: 700 }}>Category Name</th>
              <th style={{ padding: '14px 16px', fontWeight: 700 }}>Slug</th>
              <th style={{ padding: '14px 16px', fontWeight: 700 }}>Sentences</th>
              <th style={{ padding: '14px 16px', fontWeight: 700 }}>Status</th>
              <th style={{ padding: '14px 16px', fontWeight: 700, textAlign: 'right' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr>
                <td colSpan={6} style={{ padding: '32px', textAlign: 'center', color: 'var(--color-text-muted)' }}>
                  Loading categories...
                </td>
              </tr>
            ) : categories.length === 0 ? (
              <tr>
                <td colSpan={6} style={{ padding: '32px', textAlign: 'center', color: 'var(--color-text-muted)' }}>
                  No categories found.
                </td>
              </tr>
            ) : (
              categories.map((c) => (
                <tr key={c.id} style={{ borderBottom: '1px solid var(--color-border)' }}>
                  <td style={{ padding: '14px 16px', fontWeight: 700 }}>{c.sort_order}</td>
                  <td style={{ padding: '14px 16px' }}>
                    <div style={{ fontWeight: 600 }}>{c.name}</div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>{c.description}</div>
                  </td>
                  <td style={{ padding: '14px 16px', color: 'var(--color-text-muted)' }}>{c.slug}</td>
                  <td style={{ padding: '14px 16px' }}>
                    <span className="badge badge-success" style={{ textTransform: 'none' }}>
                      {c.activeSentences} active / {c.totalSentences} total
                    </span>
                  </td>
                  <td style={{ padding: '14px 16px' }}>
                    <span className={`badge badge-${c.status === 'ACTIVE' ? 'success' : 'danger'}`}>
                      {c.status}
                    </span>
                  </td>
                  <td style={{ padding: '14px 16px', textAlign: 'right' }}>
                    <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                      <button onClick={() => openEditModal(c)} className="btn btn-sm btn-secondary">
                        <Edit size={14} />
                      </button>
                      <button
                        onClick={() => {
                          if (confirm(`Are you sure you want to delete or deactivate category '${c.name}'?`)) {
                            deleteMutation.mutate(c.id);
                          }
                        }}
                        className="btn btn-sm btn-ghost"
                        style={{ color: 'var(--color-danger)' }}
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Modal */}
      {modalOpen && (
        <div className="modal-overlay">
          <div className="modal-card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h3 style={{ fontSize: '1.25rem', fontWeight: 800 }}>
                {editingCategory ? 'Edit Category' : 'Create New Category'}
              </h3>
              <button onClick={closeModal} className="btn-icon btn-ghost">
                <X size={20} />
              </button>
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                saveMutation.mutate();
              }}
            >
              <div className="form-group">
                <label className="form-label">Category Name</label>
                <input
                  type="text"
                  className="form-input"
                  value={name}
                  onChange={(e) => autoGenerateSlug(e.target.value)}
                  placeholder="e.g. Travel and Transportation"
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">URL Slug</label>
                <input
                  type="text"
                  className="form-input"
                  value={slug}
                  onChange={(e) => setSlug(e.target.value)}
                  placeholder="e.g. travel-and-transportation"
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">Description</label>
                <textarea
                  className="form-textarea"
                  rows={2}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Short description of phrases covered..."
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div className="form-group">
                  <label className="form-label">Sort Order</label>
                  <input
                    type="number"
                    className="form-input"
                    value={sortOrder}
                    onChange={(e) => setSortOrder(parseInt(e.target.value, 10) || 0)}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Status</label>
                  <select
                    className="form-select"
                    value={status}
                    onChange={(e) => setStatus(e.target.value as any)}
                  >
                    <option value="ACTIVE">Active</option>
                    <option value="INACTIVE">Inactive</option>
                  </select>
                </div>
              </div>

              <div style={{ display: 'flex', gap: '10px', marginTop: '20px' }}>
                <button type="button" onClick={closeModal} className="btn btn-secondary" style={{ flex: 1 }}>
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                  style={{ flex: 2 }}
                  disabled={saveMutation.isPending}
                >
                  {saveMutation.isPending ? 'Saving...' : editingCategory ? 'Update Category' : 'Create Category'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
