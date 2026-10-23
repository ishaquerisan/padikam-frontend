import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/services/api/client';
import { FavoriteItem } from '@/types';
import { audioManager } from '@/utils/audio.utils';
import { Bookmark, Volume2, Trash2, Search, Sparkles } from 'lucide-react';

export const FavoritesPage: React.FC = () => {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [playingId, setPlayingId] = useState<number | null>(null);

  const { data: favorites = [], isLoading } = useQuery<FavoriteItem[]>({
    queryKey: ['favorites'],
    queryFn: () => apiClient.get('/favorites'),
  });

  const removeFavMutation = useMutation({
    mutationFn: (sentenceId: number) =>
      apiClient.post(`/favorites/toggle/${sentenceId}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['favorites'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-summary'] });
    },
  });

  const handlePlayAudio = (sentence: any) => {
    setPlayingId(sentence.id);
    audioManager.speak(sentence.englishText, 0.85, () => {
      setPlayingId(null);
    });
  };

  const filtered = favorites.filter((f) => {
    const q = search.toLowerCase().trim();
    if (!q) return true;
    const s = f.sentence;
    return (
      (s.word && s.word.toLowerCase().includes(q)) ||
      (s.wordMeaning && s.wordMeaning.toLowerCase().includes(q)) ||
      s.englishText.toLowerCase().includes(q) ||
      s.malayalamMeaning.toLowerCase().includes(q)
    );
  });

  return (
    <div>
      <div style={{ marginBottom: '20px' }}>
        <h1 style={{ fontSize: '1.5rem', fontWeight: 800 }}>Saved Sentences</h1>
        <p className="font-ml" style={{ color: 'var(--color-text-secondary)', fontSize: '0.9rem', marginTop: '4px' }}>
          നിങ്ങൾ സൂക്ഷിച്ചുവെച്ച പ്രധാനപ്പെട്ട വാക്യങ്ങൾ
        </p>
      </div>

      {/* Search Bar */}
      <div style={{ position: 'relative', marginBottom: '20px' }}>
        <Search
          size={18}
          color="var(--color-text-muted)"
          style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)' }}
        />
        <input
          type="text"
          className="form-input"
          placeholder="Search saved sentences..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={{ paddingLeft: '40px' }}
        />
      </div>

      {isLoading ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {[1, 2, 3].map((i) => (
            <div key={i} className="skeleton" style={{ height: '110px', borderRadius: '16px' }} />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="card" style={{ textAlign: 'center', padding: '48px 20px' }}>
          <Bookmark size={40} color="var(--color-text-muted)" style={{ margin: '0 auto 12px' }} />
          <h3>No saved sentences</h3>
          <p style={{ color: 'var(--color-text-secondary)', fontSize: '0.9rem', marginTop: '6px' }}>
            Tap the bookmark icon on any sentence during daily lessons to save it for revision.
          </p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {filtered.map((item) => {
            const s = item.sentence;
            const isPlaying = playingId === s.id;
            return (
              <div
                key={item.favoriteId}
                className="card"
                style={{
                  padding: '18px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '8px',
                  position: 'relative',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                    {s.category && (
                      <span className="badge" style={{ backgroundColor: 'var(--color-surface-muted)', color: 'var(--color-text-secondary)' }}>
                        {s.category.name}
                      </span>
                    )}
                    <span className={`badge badge-${s.difficulty.toLowerCase()}`}>
                      {s.difficulty}
                    </span>
                  </div>

                  <div style={{ display: 'flex', gap: '4px' }}>
                    <button
                      onClick={() => handlePlayAudio(s)}
                      className="btn-icon btn-ghost"
                      title="Pronounce"
                    >
                      <Volume2 size={20} color={isPlaying ? 'var(--color-primary)' : 'var(--color-text-secondary)'} />
                    </button>
                    <button
                      onClick={() => removeFavMutation.mutate(s.id)}
                      className="btn-icon btn-ghost"
                      title="Remove from saved"
                    >
                      <Trash2 size={18} color="var(--color-danger)" />
                    </button>
                  </div>
                </div>

                {s.word && (
                  <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px', marginTop: '2px' }}>
                    <span style={{ fontSize: '1.2rem', fontWeight: 850, color: 'var(--color-primary)' }}>
                      {s.word}
                    </span>
                    <span className="font-ml" style={{ fontSize: '0.95rem', fontWeight: 600, color: 'var(--color-text-secondary)' }}>
                      ({s.wordMeaning})
                    </span>
                  </div>
                )}

                <div style={{ fontSize: '1.1rem', fontWeight: 600, color: 'var(--color-text-main)' }}>
                  {s.englishText}
                </div>

                <div className="font-ml" style={{ fontSize: '1rem', color: 'var(--color-primary-dark)', fontWeight: 600 }}>
                  {s.malayalamMeaning}
                </div>

                {s.usageExample && (
                  <div style={{ fontSize: '0.8rem', color: 'var(--color-text-secondary)', fontStyle: 'italic', marginTop: '2px' }}>
                    Usage: "{s.usageExample}"
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
