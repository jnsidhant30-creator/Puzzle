import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  getCommunityPuzzle, 
  reportCommunityPuzzle, 
  getCommunityReviews, 
  submitReview, 
  voteReviewHelpful, 
  reportReview 
} from '../../services/communityService';
import type { CommunityPuzzleData, CommunityReviewData } from '../../services/communityService';
import { useAuthStore } from '../../store/useAuthStore';
import { Star, Play, Flag, ChevronLeft, ThumbsUp, MessageSquare, Send } from 'lucide-react';

const LoadingSpinner = () => (
  <div className="flex justify-center py-20">
    <div className="w-8 h-8 border-4 border-accent border-t-transparent rounded-full animate-spin"></div>
  </div>
);

export const CommunityPuzzleDetails: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuthStore();
  
  const [puzzle, setPuzzle] = useState<CommunityPuzzleData | null>(null);
  const [reviews, setReviews] = useState<CommunityReviewData[]>([]);
  const [loading, setLoading] = useState(true);
  const [reporting, setReporting] = useState(false);
  
  // Review submission state
  const [showReviewForm, setShowReviewForm] = useState(false);
  const [rating, setRating] = useState(5);
  const [reviewText, setReviewText] = useState('');
  const [submittingReview, setSubmittingReview] = useState(false);

  useEffect(() => {
    if (!id) return;
    const fetchPuzzleData = async () => {
      try {
        const [puzzleData, reviewsData] = await Promise.all([
          getCommunityPuzzle(id),
          getCommunityReviews(id, 20)
        ]);
        if (!puzzleData) {
          navigate('/community');
          return;
        }
        setPuzzle(puzzleData);
        setReviews(reviewsData);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchPuzzleData();
  }, [id, navigate]);

  const handlePlay = () => {
    if (!puzzle) return;
    navigate(`/game-fullscreen/${puzzle.id}`, {
      state: {
        puzzleType: puzzle.gameType,
        difficulty: puzzle.difficulty,
        isCommunityPuzzle: true,
        communityPuzzleId: puzzle.id,
        puzzleSeed: puzzle.config.puzzleSeed
      }
    });
  };

  const handleReportPuzzle = async () => {
    if (!id || !user) {
      alert("You must be logged in to report.");
      return;
    }
    const reason = prompt("Please provide a reason for reporting this puzzle:");
    if (!reason) return;
    
    setReporting(true);
    try {
      await reportCommunityPuzzle(id, reason);
      alert("Report submitted successfully.");
    } catch (err: any) {
      alert("Failed to submit report: " + err.message);
    } finally {
      setReporting(false);
    }
  };

  const handleReportReview = async (reviewerId: string) => {
    if (!id || !user) return;
    const reason = prompt("Reason for reporting this review:");
    if (!reason) return;
    try {
      await reportReview(id, reviewerId, reason);
      alert("Review reported successfully.");
    } catch (err: any) {
      alert("Failed to report review: " + err.message);
    }
  };

  const handleVoteHelpful = async (reviewerId: string) => {
    if (!id || !user) {
      alert("Please log in to vote.");
      return;
    }
    try {
      await voteReviewHelpful(id, reviewerId);
      // Optimistic update
      setReviews(prev => prev.map(r => r.userId === reviewerId ? { ...r, helpfulCount: r.helpfulCount + 1 } : r));
    } catch (err: any) {
      console.error(err);
    }
  };

  const handleSubmitReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id || !user) return;
    
    setSubmittingReview(true);
    try {
      await submitReview(id, rating, reviewText);
      alert("Review submitted! It may take a moment to appear.");
      setShowReviewForm(false);
      // Re-fetch reviews to show new review
      const updatedReviews = await getCommunityReviews(id, 20);
      setReviews(updatedReviews);
    } catch (err: any) {
      alert("Failed to submit review: " + err.message);
    } finally {
      setSubmittingReview(false);
    }
  };

  if (loading || !puzzle) return <LoadingSpinner />;

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <button 
        onClick={() => navigate('/community')}
        className="text-textMuted hover:text-textMain mb-6 flex items-center transition-colors text-sm font-medium"
      >
        <ChevronLeft className="w-4 h-4 mr-1" /> Back to Hub
      </button>

      <div className="bg-surface rounded-2xl shadow-xl border border-border overflow-hidden">
        {/* Header Section */}
        <div className="p-6 sm:p-8 bg-gradient-to-b from-white/5 to-transparent border-b border-border/50">
          <div className="flex flex-col md:flex-row justify-between items-start gap-4 mb-6">
            <div>
              <h1 className="text-3xl sm:text-4xl font-bold text-textMain mb-2">{puzzle.title}</h1>
              <p className="text-textMuted text-sm sm:text-base">Created by <span className="font-bold text-textMain">{puzzle.creatorName}</span></p>
            </div>
            
            <div className="flex flex-col items-end gap-2 shrink-0">
              <div className="flex gap-2 text-xs font-bold uppercase tracking-wider">
                <span className="px-3 py-1.5 bg-primary/10 text-primary rounded-lg border border-primary/20">
                  {puzzle.gameType}
                </span>
                <span className="px-3 py-1.5 bg-white/5 text-textMain rounded-lg border border-border">
                  {puzzle.difficulty}
                </span>
              </div>
            </div>
          </div>

          {/* Stats Bar */}
          <div className="flex flex-wrap gap-6 items-center py-4 px-5 bg-background/50 rounded-xl border border-border">
            <div className="flex items-center gap-2">
              <div className="flex text-amber-400">
                 {[1,2,3,4,5].map(star => (
                   <Star key={star} className={`w-5 h-5 ${star <= (puzzle.averageRating || 0) ? 'fill-current' : 'text-textMuted/30'}`} />
                 ))}
              </div>
              <span className="font-bold text-textMain text-lg">{puzzle.averageRating ? puzzle.averageRating.toFixed(1) : 'New'}</span>
              <span className="text-textMuted text-sm">({puzzle.reviewCount || 0} reviews)</span>
            </div>
            <div className="w-px h-8 bg-border/50 hidden sm:block"></div>
            <div className="flex items-center gap-2 text-textMain">
              <Play className="w-5 h-5 text-accent" />
              <span className="font-bold text-lg">{puzzle.playCount}</span>
              <span className="text-textMuted text-sm">plays</span>
            </div>
          </div>
        </div>

        {/* Content Section */}
        <div className="p-6 sm:p-8 border-b border-border/50">
          <div className="prose prose-invert max-w-none">
            <h3 className="text-lg font-bold text-textMain mb-3 flex items-center gap-2">
              <MessageSquare className="w-5 h-5 text-primary" /> Description
            </h3>
            <p className="text-textMain/90 text-lg leading-relaxed mb-6">{puzzle.description}</p>
            
            {puzzle.instructions && (
              <div className="p-5 bg-[#151B23] border border-border/50 rounded-xl">
                <h4 className="text-sm font-bold text-textMain uppercase tracking-wider mb-2 text-primary">Creator Instructions</h4>
                <p className="text-textMuted text-sm whitespace-pre-wrap">{puzzle.instructions}</p>
              </div>
            )}
          </div>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4 mt-8">
            <button 
              onClick={handlePlay}
              className="flex-1 bg-accent text-background px-8 py-4 rounded-xl font-bold shadow-lg shadow-accent/20 hover:bg-accent/90 transition-all text-lg flex items-center justify-center gap-2"
            >
              <Play className="w-6 h-6 fill-current" /> Play Now
            </button>
            <button 
              onClick={handleReportPuzzle}
              disabled={reporting}
              className="px-6 py-4 rounded-xl font-bold text-red-400 bg-red-400/10 hover:bg-red-400/20 border border-red-400/20 transition-colors flex items-center justify-center gap-2"
            >
              <Flag className="w-5 h-5" /> {reporting ? 'Reporting...' : 'Report'}
            </button>
          </div>
        </div>

        {/* Reviews Section */}
        <div className="p-6 sm:p-8 bg-[#151B23]">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-xl font-bold text-textMain flex items-center gap-2">
              <Star className="w-5 h-5 text-amber-400" /> Community Reviews
            </h3>
            
            {user && user.uid !== puzzle.creatorId && (
              <button 
                onClick={() => setShowReviewForm(!showReviewForm)}
                className="text-sm font-bold text-accent bg-accent/10 px-4 py-2 rounded-lg hover:bg-accent/20 transition-colors"
              >
                {showReviewForm ? 'Cancel Review' : 'Write a Review'}
              </button>
            )}
          </div>

          {showReviewForm && (
            <form onSubmit={handleSubmitReview} className="mb-8 p-5 bg-background border border-border rounded-xl animate-in fade-in slide-in-from-top-2">
              <div className="mb-4">
                <label className="block text-sm font-bold text-textMain mb-2">Rating</label>
                <div className="flex gap-2">
                  {[1,2,3,4,5].map(star => (
                    <button 
                      key={star}
                      type="button"
                      onClick={() => setRating(star)}
                      className="p-1 hover:scale-110 transition-transform"
                    >
                      <Star className={`w-8 h-8 ${star <= rating ? 'text-amber-400 fill-current' : 'text-textMuted/30'}`} />
                    </button>
                  ))}
                </div>
              </div>
              <div className="mb-4">
                <label className="block text-sm font-bold text-textMain mb-2">Review (Optional)</label>
                <textarea 
                  value={reviewText}
                  onChange={e => setReviewText(e.target.value)}
                  className="w-full bg-surface border border-border rounded-lg p-3 text-textMain placeholder:text-textMuted focus:border-accent outline-none min-h-[100px]"
                  placeholder="What did you think of this puzzle?"
                />
              </div>
              <button 
                type="submit" 
                disabled={submittingReview}
                className="w-full sm:w-auto bg-primary text-background px-6 py-2.5 rounded-lg font-bold flex items-center justify-center gap-2 disabled:opacity-50"
              >
                <Send className="w-4 h-4" />
                {submittingReview ? 'Submitting...' : 'Submit Review'}
              </button>
            </form>
          )}

          <div className="space-y-4">
            {reviews.length === 0 ? (
              <div className="text-center py-8 border border-border/50 border-dashed rounded-xl">
                <p className="text-textMuted text-sm">No reviews yet. Be the first to review!</p>
              </div>
            ) : (
              reviews.map(review => (
                <div key={review.id} className="p-5 bg-surface border border-border rounded-xl">
                  <div className="flex justify-between items-start mb-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold border border-primary/20">
                        {review.userName.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <div className="font-bold text-textMain text-sm">{review.userName}</div>
                        <div className="flex items-center gap-1 mt-0.5">
                          <div className="flex text-amber-400">
                             {[1,2,3,4,5].map(star => (
                               <Star key={star} className={`w-3 h-3 ${star <= review.rating ? 'fill-current' : 'text-textMuted/30'}`} />
                             ))}
                          </div>
                          <span className="text-[10px] text-textMuted ml-1">
                            {review.createdAt?.toDate ? new Date(review.createdAt.toDate()).toLocaleDateString() : ''}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  {review.reviewText && (
                    <p className="text-textMain/90 text-sm mb-4 leading-relaxed bg-[#151B23] p-3 rounded-lg border border-border/30">
                      {review.reviewText}
                    </p>
                  )}
                  
                  <div className="flex items-center gap-4 text-xs font-medium text-textMuted mt-3">
                    <button 
                      onClick={() => handleVoteHelpful(review.userId)}
                      className="flex items-center gap-1.5 hover:text-accent transition-colors"
                    >
                      <ThumbsUp className="w-3.5 h-3.5" /> 
                      Helpful ({review.helpfulCount || 0})
                    </button>
                    {user && user.uid !== review.userId && (
                      <button 
                        onClick={() => handleReportReview(review.userId)}
                        className="flex items-center gap-1.5 hover:text-red-400 transition-colors ml-auto"
                      >
                        <Flag className="w-3 h-3" /> Report
                      </button>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
