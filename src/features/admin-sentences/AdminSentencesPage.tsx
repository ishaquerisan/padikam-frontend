import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/services/api/client';
import {
  FileText,
  Plus,
  Upload,
  Search,
  Edit,
  Trash2,
  X,
  CheckCircle,
  AlertTriangle,
  Volume2,
} from 'lucide-react';
import { audioManager } from '@/utils/audio.utils';

export const AdminSentencesPage: React.FC = () => {
  const queryClient = useQueryClient();

  const [search, setSearch] = useState('');
  const [categoryId, setCategoryId] = useState<string>('');
  const [difficulty, setDifficulty] = useState<string>('');
  const [status, setStatus] = useState<string>('');
  const [page, setPage] = useState(1);

  // Modals state
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editingSentence, setEditingSentence] = useState<any | null>(null);
  const [csvModalOpen, setCsvModalOpen] = useState(false);

  // Edit sentence form
  const [catId, setCatId] = useState<number>(1);
  const [word, setWord] = useState('');
  const [wordMeaning, setWordMeaning] = useState('');
  const [englishText, setEnglishText] = useState('');
  const [malayalamMeaning, setMalayalamMeaning] = useState('');
  const [usageExample, setUsageExample] = useState('');
  const [diffLevel, setDiffLevel] = useState<'BEGINNER' | 'INTERMEDIATE' | 'ADVANCED'>('BEGINNER');
  const [sentStatus, setSentStatus] = useState<'ACTIVE' | 'INACTIVE'>('ACTIVE');

  // CSV Import State
  const [csvText, setCsvText] = useState(
    `word,word_meaning,english_text,malayalam_meaning,category_name_or_slug,difficulty,usage_example
commute,ദൈനംദിന യാത്ര,Many professionals commute by metro to avoid morning traffic.,രാവിലത്തെ ഗതാഗതക്കുരുക്ക് ഒഴിവാക്കാൻ പല ഉദ്യോഗസ്ഥരും മെട്രോയിൽ യാത്ര ചെയ്യുന്നു.,travel-and-transportation,BEGINNER,Regular travel between residence and work.
greet,അഭിവാദ്യം ചെയ്യുക,Always greet your neighbours with a warm smile.,എപ്പോഴും അയൽവാസികളെ പുഞ്ചിരിയോടെ അഭിവാദ്യം ചെയ്യുക.,friendly-conversations,BEGINNER,Daily introductions and manners.
beverage,പാനീയം,Would you care for a hot beverage like coffee or tea?,കാപ്പിയോ ചായയോ പോലുള്ള എന്തെങ്കിലും ചൂടുള്ള പാനീയം കഴിക്കാൻ ആഗ്രഹിക്കുന്നുണ്ടോ?,food-and-restaurants,BEGINNER,Offering drinks at table.`,
  );
  const [csvPreview, setCsvPreview] = useState<any | null>(null);
  const [csvError, setCsvError] = useState<string | null>(null);

  // Queries
  const { data: categories = [] } = useQuery<any[]>({
    queryKey: ['admin-categories'],
    queryFn: () => apiClient.get('/admin/categories'),
  });

  const { data, isLoading } = useQuery<{
    total: number;
    page: number;
    totalPages: number;
    sentences: any[];
  }>({
    queryKey: ['admin-sentences', search, categoryId, difficulty, status, page],
    queryFn: () => {
      const q = new URLSearchParams({
        page: String(page),
        limit: '15',
        ...(search && { search }),
        ...(categoryId && { categoryId }),
        ...(difficulty && { difficulty }),
        ...(status && { status }),
      });
      return apiClient.get(`/admin/sentences?${q.toString()}`);
    },
  });

  // Mutations
  const saveSentenceMutation = useMutation({
    mutationFn: async () => {
      const payload = {
        category_id: Number(catId),
        word: word.trim(),
        word_meaning: wordMeaning.trim(),
        english_text: englishText.trim(),
        malayalam_meaning: malayalamMeaning.trim(),
        usage_example: usageExample || undefined,
        difficulty: diffLevel,
        status: sentStatus,
      };

      if (editingSentence) {
        return apiClient.put(`/admin/sentences/${editingSentence.id}`, payload);
      } else {
        return apiClient.post('/admin/sentences', payload);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-sentences'] });
      queryClient.invalidateQueries({ queryKey: ['admin-categories'] });
      closeEditModal();
    },
    onError: (err: any) => alert(err.message || 'Error saving sentence'),
  });

  const deleteSentenceMutation = useMutation({
    mutationFn: (id: number) => apiClient.delete(`/admin/sentences/${id}`),
    onSuccess: (res: any) => {
      alert(res.message || 'Sentence deleted');
      queryClient.invalidateQueries({ queryKey: ['admin-sentences'] });
    },
  });

  // CSV Importer logic
  const parseCsvRows = (raw: string) => {
    const lines = raw.split('\n').map((l) => l.trim()).filter(Boolean);
    if (lines.length < 2) throw new Error('CSV must contain a header line and at least one data row');

    const headers = lines[0].split(',').map((h) => h.trim().toLowerCase());
    const rows = [];

    for (let i = 1; i < lines.length; i++) {
      // Basic CSV split respecting quotes
      const parts = lines[i].split(',').map((p) => p.replace(/^"|"$/g, '').trim());
      if (parts.length >= 5 && headers.includes('word')) {
        rows.push({
          word: parts[0] || '',
          word_meaning: parts[1] || '',
          english_text: parts[2] || '',
          malayalam_meaning: parts[3] || '',
          category_name_or_slug: parts[4] || '',
          difficulty: (parts[5] as any) || 'BEGINNER',
          usage_example: parts[6] || '',
        });
      } else if (parts.length >= 3) {
        // Fallback for legacy 5-column CSV
        rows.push({
          word: parts[0]?.split(' ')[0] || 'Word',
          word_meaning: parts[1] || '',
          english_text: parts[0] || '',
          malayalam_meaning: parts[1] || '',
          category_name_or_slug: parts[2] || '',
          difficulty: (parts[3] as any) || 'BEGINNER',
          usage_example: parts[4] || '',
        });
      }
    }
    return rows;
  };

  const handlePreviewCsv = async () => {
    setCsvError(null);
    try {
      const rows = parseCsvRows(csvText);
      const res = await apiClient.post('/admin/sentences/bulk-import', {
        rows,
        previewOnly: true,
      });
      setCsvPreview(res);
    } catch (err: any) {
      setCsvError(err.message || 'Failed to parse CSV');
    }
  };

  const handleCommitCsv = async () => {
    setCsvError(null);
    try {
      const rows = parseCsvRows(csvText);
      const res = (await apiClient.post('/admin/sentences/bulk-import', {
        rows,
        previewOnly: false,
      })) as any;
      alert(`Import Successful! ${res.importedCount} sentences imported, ${res.duplicateCount} duplicates skipped.`);
      queryClient.invalidateQueries({ queryKey: ['admin-sentences'] });
      queryClient.invalidateQueries({ queryKey: ['admin-categories'] });
      setCsvModalOpen(false);
      setCsvPreview(null);
    } catch (err: any) {
      setCsvError(err.message || 'Failed to commit CSV import');
    }
  };

  const openCreateModal = () => {
    setEditingSentence(null);
    setCatId(categories[0]?.id || 1);
    setWord('');
    setWordMeaning('');
    setEnglishText('');
    setMalayalamMeaning('');
    setUsageExample('');
    setDiffLevel('BEGINNER');
    setSentStatus('ACTIVE');
    setEditModalOpen(true);
  };

  const openEditModal = (s: any) => {
    setEditingSentence(s);
    setCatId(s.category_id);
    setWord(s.word || '');
    setWordMeaning(s.word_meaning || '');
    setEnglishText(s.english_text);
    setMalayalamMeaning(s.malayalam_meaning);
    setUsageExample(s.usage_example || '');
    setDiffLevel(s.difficulty);
    setSentStatus(s.status);
    setEditModalOpen(true);
  };

  const closeEditModal = () => {
    setEditModalOpen(false);
    setEditingSentence(null);
  };

  const sentences = data?.sentences || [];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <h2 style={{ fontSize: '1.4rem', fontWeight: 800 }}>Sentence Repository</h2>
          <p style={{ color: 'var(--color-text-secondary)', fontSize: '0.9rem' }}>
            Manage English sentences, Malayalam translations, pronunciations, and CSV imports.
          </p>
        </div>
        <div style={{ display: 'flex', gap: '8px' }}>
          <button onClick={() => setCsvModalOpen(true)} className="btn btn-secondary">
            <Upload size={16} />
            <span>CSV Bulk Import</span>
          </button>
          <button onClick={openCreateModal} className="btn btn-primary">
            <Plus size={16} />
            <span>Add Sentence</span>
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="card" style={{ padding: '16px', display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
        <div style={{ flex: 1, minWidth: '220px', position: 'relative' }}>
          <Search size={18} color="var(--color-text-muted)" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }} />
          <input
            type="text"
            className="form-input"
            placeholder="Search English or Malayalam..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            style={{ paddingLeft: '38px' }}
          />
        </div>

        <select
          className="form-select"
          value={categoryId}
          onChange={(e) => {
            setCategoryId(e.target.value);
            setPage(1);
          }}
          style={{ width: '180px' }}
        >
          <option value="">All Categories</option>
          {categories.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>

        <select
          className="form-select"
          value={difficulty}
          onChange={(e) => {
            setDifficulty(e.target.value);
            setPage(1);
          }}
          style={{ width: '140px' }}
        >
          <option value="">All Levels</option>
          <option value="BEGINNER">Beginner</option>
          <option value="INTERMEDIATE">Intermediate</option>
          <option value="ADVANCED">Advanced</option>
        </select>
      </div>

      {/* Table */}
      <div className="card" style={{ padding: '0', overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.9rem' }}>
          <thead>
            <tr style={{ backgroundColor: 'var(--color-surface-muted)', borderBottom: '1px solid var(--color-border)' }}>
              <th style={{ padding: '14px 16px', fontWeight: 700 }}>Target Word</th>
              <th style={{ padding: '14px 16px', fontWeight: 700 }}>Sentence & Meaning</th>
              <th style={{ padding: '14px 16px', fontWeight: 700 }}>Category</th>
              <th style={{ padding: '14px 16px', fontWeight: 700 }}>Level</th>
              <th style={{ padding: '14px 16px', fontWeight: 700 }}>Audio</th>
              <th style={{ padding: '14px 16px', fontWeight: 700, textAlign: 'right' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr>
                <td colSpan={6} style={{ padding: '32px', textAlign: 'center', color: 'var(--color-text-muted)' }}>
                  Loading sentences...
                </td>
              </tr>
            ) : sentences.length === 0 ? (
              <tr>
                <td colSpan={6} style={{ padding: '32px', textAlign: 'center', color: 'var(--color-text-muted)' }}>
                  No sentences found matching query.
                </td>
              </tr>
            ) : (
              sentences.map((s) => (
                <tr key={s.id} style={{ borderBottom: '1px solid var(--color-border)' }}>
                  <td style={{ padding: '14px 16px', maxWidth: '200px' }}>
                    <div style={{ fontWeight: 800, fontSize: '1rem', color: 'var(--color-primary)' }}>
                      {s.word || 'N/A'}
                    </div>
                    <div className="font-ml" style={{ fontSize: '0.85rem', color: 'var(--color-text-secondary)', fontWeight: 600 }}>
                      {s.word_meaning}
                    </div>
                  </td>
                  <td style={{ padding: '14px 16px', maxWidth: '340px' }}>
                    <div style={{ fontWeight: 600 }}>{s.english_text}</div>
                    <div className="font-ml" style={{ color: 'var(--color-primary-dark)', fontSize: '0.88rem', marginTop: '2px' }}>
                      {s.malayalam_meaning}
                    </div>
                    {s.usage_example && (
                      <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', fontStyle: 'italic', marginTop: '2px' }}>
                        "{s.usage_example}"
                      </div>
                    )}
                  </td>
                  <td style={{ padding: '14px 16px' }}>
                    <span className="badge" style={{ backgroundColor: 'var(--color-surface-muted)' }}>
                      {s.category?.name || 'Unassigned'}
                    </span>
                  </td>
                  <td style={{ padding: '14px 16px' }}>
                    <span className={`badge badge-${s.difficulty.toLowerCase()}`}>
                      {s.difficulty}
                    </span>
                  </td>
                  <td style={{ padding: '14px 16px' }}>
                    <div style={{ display: 'flex', gap: '4px' }}>
                      {s.word && (
                        <button
                          onClick={() => audioManager.speak(s.word)}
                          className="btn-icon btn-ghost"
                          title={`Pronounce Word: "${s.word}"`}
                        >
                          <Volume2 size={16} color="var(--color-primary)" />
                        </button>
                      )}
                      <button
                        onClick={() => audioManager.speak(s.english_text)}
                        className="btn-icon btn-ghost"
                        title="Pronounce Full Sentence"
                      >
                        <Volume2 size={16} color="var(--color-text-secondary)" />
                      </button>
                    </div>
                  </td>
                  <td style={{ padding: '14px 16px', textAlign: 'right' }}>
                    <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                      <button onClick={() => openEditModal(s)} className="btn btn-sm btn-secondary">
                        <Edit size={14} />
                      </button>
                      <button
                        onClick={() => {
                          if (confirm(`Delete or deactivate "${s.english_text}"?`)) {
                            deleteSentenceMutation.mutate(s.id);
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

      {/* Pagination */}
      {data && data.totalPages > 1 && (
        <div style={{ display: 'flex', justifyContent: 'center', gap: '8px' }}>
          <button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1}
            className="btn btn-sm btn-secondary"
          >
            Previous
          </button>
          <span style={{ display: 'flex', alignItems: 'center', fontSize: '0.85rem', color: 'var(--color-text-muted)' }}>
            Page {page} of {data.totalPages}
          </span>
          <button
            onClick={() => setPage((p) => Math.min(data.totalPages, p + 1))}
            disabled={page === data.totalPages}
            className="btn btn-sm btn-secondary"
          >
            Next
          </button>
        </div>
      )}

      {/* Edit Sentence Modal */}
      {editModalOpen && (
        <div className="modal-overlay">
          <div className="modal-card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h3 style={{ fontSize: '1.25rem', fontWeight: 800 }}>
                {editingSentence ? 'Edit Sentence' : 'Add New Sentence'}
              </h3>
              <button onClick={closeEditModal} className="btn-icon btn-ghost">
                <X size={20} />
              </button>
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                saveSentenceMutation.mutate();
              }}
            >
              <div className="form-group">
                <label className="form-label">Category</label>
                <select
                  className="form-select"
                  value={catId}
                  onChange={(e) => setCatId(parseInt(e.target.value, 10))}
                  required
                >
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div className="form-group">
                  <label className="form-label">Target Word</label>
                  <input
                    type="text"
                    className="form-input"
                    value={word}
                    onChange={(e) => setWord(e.target.value)}
                    placeholder="e.g. gratitude"
                    required
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Word Meaning (Malayalam)</label>
                  <input
                    type="text"
                    className="form-input font-ml"
                    value={wordMeaning}
                    onChange={(e) => setWordMeaning(e.target.value)}
                    placeholder="e.g. നന്ദി / കൃതജ്ഞത"
                    required
                  />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">English Sentence (Using the word)</label>
                <input
                  type="text"
                  className="form-input"
                  value={englishText}
                  onChange={(e) => setEnglishText(e.target.value)}
                  placeholder="e.g. I want to express my gratitude for your kindness."
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">Malayalam Sentence Meaning</label>
                <input
                  type="text"
                  className="form-input font-ml"
                  value={malayalamMeaning}
                  onChange={(e) => setMalayalamMeaning(e.target.value)}
                  placeholder="e.g. നിങ്ങളുടെ ദയയ്ക്ക് എന്റെ നന്ദി അറിയിക്കാൻ ഞാൻ ആഗ്രഹിക്കുന്നു."
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">Usage Example (Optional)</label>
                <textarea
                  className="form-textarea"
                  rows={2}
                  value={usageExample}
                  onChange={(e) => setUsageExample(e.target.value)}
                  placeholder="e.g. Excuse me sir, can you please help me with directions?"
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div className="form-group">
                  <label className="form-label">Difficulty</label>
                  <select
                    className="form-select"
                    value={diffLevel}
                    onChange={(e) => setDiffLevel(e.target.value as any)}
                  >
                    <option value="BEGINNER">Beginner</option>
                    <option value="INTERMEDIATE">Intermediate</option>
                    <option value="ADVANCED">Advanced</option>
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label">Status</label>
                  <select
                    className="form-select"
                    value={sentStatus}
                    onChange={(e) => setSentStatus(e.target.value as any)}
                  >
                    <option value="ACTIVE">Active</option>
                    <option value="INACTIVE">Inactive</option>
                  </select>
                </div>
              </div>

              <div style={{ display: 'flex', gap: '10px', marginTop: '20px' }}>
                <button type="button" onClick={closeEditModal} className="btn btn-secondary" style={{ flex: 1 }}>
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                  style={{ flex: 2 }}
                  disabled={saveSentenceMutation.isPending}
                >
                  {saveSentenceMutation.isPending ? 'Saving...' : editingSentence ? 'Update Sentence' : 'Create Sentence'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* CSV Bulk Importer Modal (Section 12 of Requirements) */}
      {csvModalOpen && (
        <div className="modal-overlay">
          <div className="modal-card" style={{ maxWidth: '640px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Upload size={20} color="var(--color-primary)" />
                <h3 style={{ fontSize: '1.25rem', fontWeight: 800 }}>CSV Bulk Importer</h3>
              </div>
              <button onClick={() => setCsvModalOpen(false)} className="btn-icon btn-ghost">
                <X size={20} />
              </button>
            </div>

            <p style={{ fontSize: '0.85rem', color: 'var(--color-text-secondary)', marginBottom: '16px' }}>
              Import sentences in bulk with automatic duplicate detection and row validation.
              Format: <code>english_text,malayalam_meaning,category_slug,difficulty,usage_example</code>
            </p>

            {csvError && (
              <div
                style={{
                  padding: '12px',
                  backgroundColor: 'var(--color-danger-subtle)',
                  color: 'var(--color-danger)',
                  borderRadius: 'var(--radius-md)',
                  marginBottom: '16px',
                  fontSize: '0.85rem',
                }}
              >
                {csvError}
              </div>
            )}

            <div className="form-group">
              <label className="form-label">CSV Content</label>
              <textarea
                className="form-textarea"
                rows={7}
                value={csvText}
                onChange={(e) => {
                  setCsvText(e.target.value);
                  setCsvPreview(null);
                }}
                style={{ fontFamily: 'monospace', fontSize: '0.85rem' }}
              />
            </div>

            {/* Validation & Duplicate Detection Preview */}
            {csvPreview && (
              <div
                style={{
                  padding: '14px',
                  borderRadius: 'var(--radius-md)',
                  backgroundColor: 'var(--color-surface-muted)',
                  marginBottom: '16px',
                  fontSize: '0.85rem',
                }}
              >
                <div style={{ fontWeight: 700, marginBottom: '6px' }}>Validation Report:</div>
                <div style={{ display: 'flex', gap: '16px' }}>
                  <span style={{ color: 'var(--color-primary)', fontWeight: 600 }}>
                    ✓ {csvPreview.validCount} Valid Rows
                  </span>
                  <span style={{ color: '#D97706', fontWeight: 600 }}>
                    ⚠ {csvPreview.duplicateCount} Duplicates Detected
                  </span>
                  <span style={{ color: 'var(--color-danger)', fontWeight: 600 }}>
                    ✗ {csvPreview.errorCount} Invalid Rows
                  </span>
                </div>
              </div>
            )}

            <div style={{ display: 'flex', gap: '10px', marginTop: '16px' }}>
              <button
                type="button"
                onClick={handlePreviewCsv}
                className="btn btn-secondary"
                style={{ flex: 1 }}
              >
                Validate & Preview
              </button>
              <button
                type="button"
                onClick={handleCommitCsv}
                className="btn btn-primary"
                style={{ flex: 1 }}
                disabled={!csvPreview || csvPreview.validCount === 0}
              >
                Commit Import ({csvPreview ? csvPreview.validCount : 0})
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
