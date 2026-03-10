import { useState } from 'react';
import { useApp } from '@/context/AppContext';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Star, CheckCircle2 } from 'lucide-react';

function StarRating({ label, value, onChange }: { label: string; value: number; onChange: (v: number) => void }) {
  return (
    <div className="space-y-2">
      <label className="text-sm font-medium text-foreground">{label}</label>
      <div className="flex gap-2">
        {[1, 2, 3, 4, 5].map(s => (
          <button key={s} onClick={() => onChange(s)} className="p-1">
            <Star className={`w-8 h-8 transition-colors ${s <= value ? 'fill-primary text-primary' : 'text-muted'}`} />
          </button>
        ))}
      </div>
    </div>
  );
}

export default function ServiceFeedbackScreen() {
  const { navigate } = useApp();
  const [resolved, setResolved] = useState<boolean | null>(null);
  const [overall, setOverall] = useState(0);
  const [timeliness, setTimeliness] = useState(0);
  const [professionalism, setProfessionalism] = useState(0);
  const [comments, setComments] = useState('');
  const [submitted, setSubmitted] = useState(false);

  if (submitted) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center px-6 animate-fade-in relative overflow-hidden">
        {/* Confetti */}
        {Array.from({ length: 20 }).map((_, i) => (
          <div
            key={i}
            className="absolute w-2 h-2 rounded-full animate-confetti"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${60 + Math.random() * 40}%`,
              backgroundColor: ['#E8A020', '#16A34A', '#DC2626', '#3B82F6'][i % 4],
              animationDelay: `${Math.random() * 0.5}s`,
            }}
          />
        ))}
        <CheckCircle2 className="w-16 h-16 text-success mb-4" />
        <h1 className="text-2xl font-bold text-foreground mb-2">Thank you!</h1>
        <p className="text-muted-foreground text-center mb-6">Your incident is now closed.</p>
        <Button variant="amber" size="full" className="max-w-xs" onClick={() => navigate('home')}>Go Home</Button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <div className="px-4 pt-4 pb-4 flex items-center gap-3">
        <button onClick={() => navigate('incident-detail')} className="p-2 -ml-2 text-muted-foreground"><ArrowLeft className="w-5 h-5" /></button>
        <h1 className="text-lg font-semibold text-foreground">Service Feedback</h1>
      </div>

      <div className="flex-1 px-6 pb-8">
        <div className="max-w-md mx-auto space-y-6 animate-fade-in">
          <div className="space-y-3">
            <label className="text-sm font-medium text-foreground">Was your issue resolved?</label>
            <div className="flex gap-3">
              {[true, false].map((val) => (
                <button
                  key={String(val)}
                  onClick={() => setResolved(val)}
                  className={`flex-1 h-12 rounded-lg border-2 font-medium text-sm transition-colors ${
                    resolved === val ? 'border-primary bg-primary/10 text-primary' : 'border-border text-muted-foreground hover:border-primary/50'
                  }`}
                >
                  {val ? 'Yes' : 'No'}
                </button>
              ))}
            </div>
          </div>

          <StarRating label="Overall Rating" value={overall} onChange={setOverall} />
          <StarRating label="Timeliness" value={timeliness} onChange={setTimeliness} />
          <StarRating label="Professionalism" value={professionalism} onChange={setProfessionalism} />

          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">Comments <span className="text-muted-foreground">(optional)</span></label>
            <textarea
              value={comments}
              onChange={(e) => setComments(e.target.value)}
              placeholder="Share your experience..."
              className="w-full h-24 px-3 py-2 rounded-lg border bg-card text-sm resize-none focus:outline-none focus:ring-2 focus:ring-ring"
            />
          </div>

          <Button variant="amber" size="full" onClick={() => setSubmitted(true)}>Submit Feedback</Button>
        </div>
      </div>
    </div>
  );
}
