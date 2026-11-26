import React, { useState, useEffect } from 'react';
import { PlayerWallPost } from '../types';
import {
  fetchPlayerWallPosts,
  addPlayerWallPost,
  deletePlayerWallPost,
  toggleLikeWallPost,
  createReport,
} from '../services/firebase';
import { useStore } from '../store/useStore';
import { toast } from '../services/toast';
import { sanitizeText, containsProfanity } from '../services/wordFilter';
import { MessageSquare, Heart, Trash2, Flag, Send } from 'lucide-react';
import { Card } from './ui/Card';
import { Button } from './ui/Button';

interface Props {
  profileUserId: string;
  profileUserName: string;
}

export const PlayerWallSection: React.FC<Props> = ({ profileUserId, profileUserName }) => {
  const { user } = useStore();
  const [posts, setPosts] = useState<PlayerWallPost[]>([]);
  const [newComment, setNewComment] = useState('');
  const [loading, setLoading] = useState(false);
  const [posting, setPosting] = useState(false);

  useEffect(() => {
    loadWallPosts();
  }, [profileUserId]);

  const loadWallPosts = async () => {
    setLoading(true);
    try {
      const data = await fetchPlayerWallPosts(profileUserId);
      setPosts(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim() || !user) return;
    if (containsProfanity(newComment)) {
      toast.warning('Comment blocked', 'Please keep comments polite and constructive.');
      return;
    }
    setPosting(true);
    try {
      const sanitized = sanitizeText(newComment);
      const post: Omit<PlayerWallPost, 'id'> = {
        profileUserId,
        authorId: user.uid,
        authorName: user.displayName,
        authorAvatar: user.avatarUrl,
        authorTitle: user.selectedTitle,
        content: sanitized,
        likesCount: 0,
        likedBy: [],
        createdAt: new Date().toISOString(),
      };
      const created = await addPlayerWallPost(post);
      setPosts([created, ...posts]);
      setNewComment('');
      toast.success('Note posted', 'Your message has been left on the player wall.');
    } catch (err) {
      toast.error('Failed to post comment');
    } finally {
      setPosting(false);
    }
  };

  const handleLike = async (postId: string) => {
    if (!user) return;
    try {
      const updated = await toggleLikeWallPost(postId, user.uid);
      setPosts(posts.map((p) => (p.id === postId ? updated : p)));
    } catch (e) {
      toast.error('Could not like comment');
    }
  };

  const handleDelete = async (postId: string) => {
    try {
      await deletePlayerWallPost(postId);
      setPosts(posts.filter((p) => p.id !== postId));
      toast.info('Comment removed');
    } catch (e) {
      toast.error('Failed to delete comment');
    }
  };

  const handleReport = async (postId: string, authorId: string) => {
    if (!user) return;
    try {
      await createReport({
        reporterId: user.uid,
        reporterName: user.displayName,
        targetType: 'wall',
        targetId: postId,
        targetAuthorId: authorId,
        reason: 'inappropriate',
        status: 'pending',
        createdAt: new Date().toISOString(),
      });
      toast.success('Report submitted', 'Our moderation team will review this comment.');
    } catch (e) {
      toast.error('Could not submit report');
    }
  };

  return (
    <Card className="p-6">
      <div className="flex items-center justify-between mb-4 border-b border-pv-border pb-3">
        <div className="flex items-center gap-2.5">
          <MessageSquare className="w-4 h-4 text-pv-dragon-fruit" />
          <h3 className="text-base font-semibold text-pv-text-primary">
            {profileUserName}'s Player Wall
          </h3>
        </div>
        <span className="text-xs font-medium px-2.5 py-0.5 bg-pv-surface-soft text-pv-text-secondary border border-pv-border rounded font-tabular">
          {posts.length} Notes
        </span>
      </div>

      {/* Post Input Form */}
      {user && (
        <form onSubmit={handleSubmit} className="mb-6">
          <div className="flex items-start gap-3 bg-pv-surface-soft p-3 rounded-lg border border-pv-border focus-within:border-pv-dragon-fruit transition-colors">
            <img
              src={user.avatarUrl}
              alt={user.displayName}
              className="w-8 h-8 rounded-md border border-pv-border shrink-0 bg-pv-surface-elevated"
            />
            <div className="flex-1 min-w-0">
              <textarea
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                placeholder={`Leave a note for ${profileUserName}...`}
                rows={2}
                className="w-full bg-transparent text-xs text-pv-text-primary placeholder:text-pv-text-muted focus:outline-none resize-none"
              />
              <div className="flex items-center justify-between pt-2 border-t border-pv-border mt-2">
                <span className="text-[11px] text-pv-text-muted">Keep messages respectful</span>
                <Button
                  type="submit"
                  variant="primary"
                  size="sm"
                  disabled={posting || !newComment.trim()}
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>Post Note</span>
                </Button>
              </div>
            </div>
          </div>
        </form>
      )}

      {/* Wall Posts List */}
      {loading ? (
        <div className="py-8 text-center text-pv-text-muted text-xs">Loading player wall...</div>
      ) : posts.length === 0 ? (
        <div className="py-10 text-center text-pv-text-muted border border-dashed border-pv-border rounded-lg">
          <MessageSquare className="w-6 h-6 text-pv-text-muted mx-auto mb-2" />
          <p className="text-xs">No notes on this wall yet.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {posts.map((post) => {
            const isLiked = user ? post.likedBy?.includes(user.uid) : false;
            const canDelete =
              user &&
              (user.uid === post.authorId ||
                user.uid === profileUserId ||
                user.role === 'ADMIN');
            return (
              <div
                key={post.id}
                className="p-4 rounded-lg bg-pv-surface-soft border border-pv-border transition-colors"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-2.5">
                    <img
                      src={post.authorAvatar}
                      alt={post.authorName}
                      className="w-7 h-7 rounded-md border border-pv-border bg-pv-surface-elevated"
                    />
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-semibold text-pv-text-primary">
                          {post.authorName}
                        </span>
                        {post.authorTitle && (
                          <span className="text-[10px] font-medium px-1.5 py-0.5 bg-pv-surface-elevated text-pv-dragon-fruit-light border border-pv-border rounded">
                            {post.authorTitle}
                          </span>
                        )}
                      </div>
                      <span className="text-[11px] text-pv-text-muted font-tabular">
                        {new Date(post.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    {canDelete && (
                      <button
                        onClick={() => handleDelete(post.id)}
                        className="text-pv-text-muted hover:text-rose-400 p-1 rounded transition-colors"
                        title="Delete note"
                        aria-label="Delete note"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                    {user && user.uid !== post.authorId && (
                      <button
                        onClick={() => handleReport(post.id, post.authorId)}
                        className="text-pv-text-muted hover:text-pv-dragon-fruit-light p-1 rounded transition-colors"
                        title="Report comment"
                        aria-label="Report comment"
                      >
                        <Flag className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>
                <p className="text-xs text-pv-text-secondary mt-2.5 leading-relaxed">
                  {post.content}
                </p>
                <div className="flex items-center justify-between mt-3 pt-2 border-t border-pv-border/60">
                  <button
                    onClick={() => handleLike(post.id)}
                    className={`flex items-center gap-1.5 text-xs font-medium transition-colors ${
                      isLiked
                        ? 'text-pv-dragon-fruit-light'
                        : 'text-pv-text-muted hover:text-pv-text-primary'
                    }`}
                  >
                    <Heart className={`w-3.5 h-3.5 ${isLiked ? 'fill-current' : ''}`} />
                    <span className="font-tabular">{post.likesCount || 0} Likes</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </Card>
  );
};
