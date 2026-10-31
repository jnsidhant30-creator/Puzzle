import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { updateAdminPuzzle } from '../../services/adminService';
import { usePuzzleStore, type PuzzleConfig } from '../../store/usePuzzleStore';
import { ArrowLeft, Save, AlertTriangle } from 'lucide-react';

export const AdminPuzzleEdit = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { puzzles, isLoading } = usePuzzleStore();
  
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [formData, setFormData] = useState<Partial<PuzzleConfig>>({
    title: '',
    description: '',
    difficulty: 'Medium',
    isPublished: true,
    tutorialStage1: '',
    tutorialStage2: '',
    tutorialHowToPlay: ''
  });

  useEffect(() => {
    if (isLoading) return;
    const found = puzzles.find(p => p.id === id);
    if (found) {
      setFormData({
        title: found.title || '',
        description: found.description || '',
        difficulty: found.difficulty || 'Medium',
        isPublished: found.isPublished !== false,
        tutorialStage1: found.tutorialStage1 || '',
        tutorialStage2: found.tutorialStage2 || '',
        tutorialHowToPlay: found.tutorialHowToPlay || ''
      });
    } else {
      setError("Puzzle not found.");
    }
  }, [id, puzzles, isLoading]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    let finalValue: any = value;
    
    if (type === 'checkbox') {
      finalValue = (e.target as HTMLInputElement).checked;
    }

    setFormData(prev => ({ ...prev, [name]: finalValue }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title) {
      setError("Please fill in all required fields.");
      return;
    }

    try {
      setSaving(true);
      setError(null);
      await updateAdminPuzzle(id!, formData);
      navigate('/admin/puzzles');
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Failed to save puzzle metadata.");
    } finally {
      setSaving(false);
    }
  };

  if (isLoading) return <div className="p-8 text-center text-textMuted">Loading puzzle...</div>;

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <button 
        onClick={() => navigate('/admin/puzzles')}
        className="flex items-center gap-2 text-sm text-textMuted hover:text-textMain transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to Puzzles
      </button>

      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-textMain">Edit Puzzle Metadata</h1>
      </div>

      {error && (
        <div className="p-4 bg-error/10 border border-error/20 rounded-xl flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-error shrink-0 mt-0.5" />
          <p className="text-sm text-error">{error}</p>
        </div>
      )}

      <form onSubmit={handleSubmit} className="bg-surface border border-border rounded-xl p-6 space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2 md:col-span-2">
            <label className="text-sm font-medium text-textMain">Title *</label>
            <input
              type="text"
              name="title"
              required
              value={formData.title}
              onChange={handleChange}
              className="w-full bg-background border border-border rounded-lg px-4 py-2 text-sm text-textMain focus:outline-none focus-visible:border-primary"
            />
          </div>

          <div className="space-y-2 md:col-span-2">
            <label className="text-sm font-medium text-textMain">Description</label>
            <textarea
              name="description"
              rows={2}
              value={formData.description}
              onChange={handleChange}
              className="w-full bg-background border border-border rounded-lg px-4 py-2 text-sm text-textMain focus:outline-none focus-visible:border-primary resize-none"
            />
          </div>

          <div className="space-y-2 md:col-span-2">
            <label className="text-sm font-medium text-textMain">Base Difficulty *</label>
            <select
              name="difficulty"
              required
              value={formData.difficulty}
              onChange={handleChange}
              className="w-full bg-background border border-border rounded-lg px-4 py-2 text-sm text-textMain focus:outline-none focus-visible:border-primary"
            >
              <option value="Easy">Easy</option>
              <option value="Medium">Medium</option>
              <option value="Hard">Hard</option>
              <option value="Expert">Expert</option>
            </select>
          </div>
          
          {/* Tutorial Fields */}
          <div className="space-y-2 md:col-span-2 mt-4 pt-4 border-t border-border">
            <h3 className="text-sm font-bold text-textMain mb-2">Tutorial Configuration</h3>
            
            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-textMuted">How to Play (General)</label>
                <textarea
                  name="tutorialHowToPlay"
                  rows={2}
                  value={formData.tutorialHowToPlay}
                  onChange={handleChange}
                  placeholder="Explain the basic rules..."
                  className="w-full bg-background border border-border rounded-lg px-4 py-2 text-sm text-textMain focus:outline-none focus-visible:border-primary resize-none"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-textMuted">Tutorial Stage 1 (Intro)</label>
                <textarea
                  name="tutorialStage1"
                  rows={2}
                  value={formData.tutorialStage1}
                  onChange={handleChange}
                  placeholder="First interactive step..."
                  className="w-full bg-background border border-border rounded-lg px-4 py-2 text-sm text-textMain focus:outline-none focus-visible:border-primary resize-none"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-textMuted">Tutorial Stage 2 (Advanced)</label>
                <textarea
                  name="tutorialStage2"
                  rows={2}
                  value={formData.tutorialStage2}
                  onChange={handleChange}
                  placeholder="Second interactive step..."
                  className="w-full bg-background border border-border rounded-lg px-4 py-2 text-sm text-textMain focus:outline-none focus-visible:border-primary resize-none"
                />
              </div>
            </div>
          </div>
        </div>

        <div className="pt-4 border-t border-border flex items-center justify-between">
          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="checkbox"
              name="isPublished"
              checked={formData.isPublished || false}
              onChange={handleChange}
              className="w-4 h-4 rounded border-border text-primary focus-visible:ring-primary focus-visible:ring-offset-background"
            />
            <span className="text-sm font-medium text-textMain">Active (Visible to Players)</span>
          </label>

          <button
            type="submit"
            disabled={saving}
            className="flex items-center gap-2 px-6 py-2 bg-primary text-white rounded-lg hover:bg-primaryLight transition-colors font-medium text-sm disabled:opacity-50"
          >
            {saving ? (
              'Saving...'
            ) : (
              <>
                <Save className="w-4 h-4" />
                Save Changes
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};
