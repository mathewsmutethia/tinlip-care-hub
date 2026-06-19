import { useEffect, useState } from 'react';
import { useApp } from '@/context/AppContext';
import { Shield, CheckCircle, ArrowRight, Star, MapPin } from 'lucide-react';
import { Button } from '@/components/ui/button';
import useEmblaCarousel from 'embla-carousel-react';

const TESTIMONIALS = [
  {
    quote: "Broke down on Thika Road at 10pm. Help arrived in 40 minutes. Absolutely lifesaving.",
    name: "James M.",
    location: "Nairobi",
  },
  {
    quote: "My Fielder wouldn't start on a Monday morning. One tap and sorted before 8am.",
    name: "Aisha K.",
    location: "Westlands",
  },
  {
    quote: "Best decision I made for my car. Peace of mind every single day on the road.",
    name: "David O.",
    location: "Embakasi",
  },
];

const HOW_IT_WORKS = [
  { step: '1', label: 'Sign Up', desc: 'Free in 60 sec' },
  { step: '2', label: 'Add Car',  desc: 'Register your vehicle' },
  { step: '3', label: 'Get Help', desc: 'One-tap dispatch' },
];

function useCountUp(target: number, duration = 1400) {
  const [count, setCount] = useState(0);
  useEffect(() => {
    const start = Date.now();
    let rafId: number;
    const tick = () => {
      const elapsed = Date.now() - start;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setCount(Math.floor(eased * target));
      if (progress < 1) rafId = requestAnimationFrame(tick);
    };
    rafId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafId);
  }, [target, duration]);
  return count;
}

export default function WelcomeScreen() {
  const { navigate } = useApp();
  const [emblaRef, emblaApi] = useEmblaCarousel({ loop: true });
  const [activeIndex, setActiveIndex] = useState(0);
  const vehiclesCount = useCountUp(2000);

  useEffect(() => {
    if (!emblaApi) return;
    const onSelect = () => setActiveIndex(emblaApi.selectedScrollSnap());
    emblaApi.on('select', onSelect);
    const interval = setInterval(() => emblaApi.scrollNext(), 4000);
    return () => {
      emblaApi.off('select', onSelect);
      clearInterval(interval);
    };
  }, [emblaApi]);

  return (
    <div className="min-h-screen bg-nav-dark flex flex-col relative overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="welcome-gradient-bg absolute inset-0" />
        <div className="absolute top-1/4 -left-24 w-72 h-72 rounded-full bg-primary/10 blur-3xl animate-pulse-amber" />
        <div
          className="absolute bottom-1/4 -right-24 w-56 h-56 rounded-full bg-primary/10 blur-3xl animate-pulse-amber"
          style={{ animationDelay: '1s' }}
        />
      </div>

      <div className="relative z-10 flex flex-col flex-1 px-6 pt-12 pb-8 max-w-sm mx-auto w-full">
        {/* Logo */}
        <div className="flex flex-col items-center mb-6 animate-scale-in">
          <div className="w-16 h-16 rounded-2xl bg-primary flex items-center justify-center shadow-lg mb-2">
            <Shield className="w-8 h-8 text-white" />
          </div>
          <p className="text-[11px] font-semibold tracking-[0.18em] uppercase text-primary/80">
            Tinlip Autocare
          </p>
        </div>

        {/* Hero */}
        <div className="text-center mb-5 animate-fade-in">
          <h1 className="text-[1.875rem] font-bold text-nav-dark-foreground tracking-tight leading-[1.15] mb-3">
            Nairobi's car care,<br />always one tap away.
          </h1>
          <p className="text-sm text-nav-dark-foreground/65 font-body leading-relaxed">
            Roadside help, servicing &amp; towing — dispatched in minutes. Pay via M‑Pesa.
          </p>
        </div>

        {/* Social proof counters */}
        <div
          className="flex gap-3 justify-center mb-5 animate-fade-in"
          style={{ animationDelay: '0.1s' }}
        >
          <div className="flex-1 flex flex-col items-center bg-white/[0.07] rounded-xl px-3 py-3">
            <span className="text-xl font-bold text-primary">{vehiclesCount.toLocaleString()}+</span>
            <span className="text-[11px] text-nav-dark-foreground/55 mt-0.5">Vehicles protected</span>
          </div>
          <div className="flex-1 flex flex-col items-center bg-white/[0.07] rounded-xl px-3 py-3">
            <span className="text-xl font-bold text-primary flex items-center gap-0.5">
              4.9 <Star className="w-3.5 h-3.5 fill-primary ml-0.5" />
            </span>
            <span className="text-[11px] text-nav-dark-foreground/55 mt-0.5">Average rating</span>
          </div>
        </div>

        {/* Testimonials carousel */}
        <div className="mb-5 animate-fade-in" style={{ animationDelay: '0.2s' }}>
          <div className="overflow-hidden rounded-xl" ref={emblaRef}>
            <div className="flex">
              {TESTIMONIALS.map((t, i) => (
                <div key={i} className="flex-[0_0_100%] min-w-0 px-0.5">
                  <div className="bg-white/[0.07] rounded-xl p-4">
                    <div className="flex gap-0.5 mb-2">
                      {[...Array(5)].map((_, s) => (
                        <Star key={s} className="w-3 h-3 fill-primary text-primary" />
                      ))}
                    </div>
                    <p className="text-sm text-nav-dark-foreground/85 italic leading-relaxed mb-2">
                      "{t.quote}"
                    </p>
                    <div className="flex items-center gap-1">
                      <MapPin className="w-3 h-3 text-primary/60 flex-shrink-0" />
                      <span className="text-xs text-nav-dark-foreground/50">
                        — {t.name}, {t.location}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
          {/* Carousel dots */}
          <div className="flex gap-1.5 justify-center mt-2.5">
            {TESTIMONIALS.map((_, i) => (
              <div
                key={i}
                className={`h-1.5 rounded-full transition-all duration-300 ${
                  i === activeIndex ? 'w-5 bg-primary' : 'w-1.5 bg-white/25'
                }`}
              />
            ))}
          </div>
        </div>

        {/* How it works */}
        <div
          className="flex gap-2 mb-7 animate-fade-in"
          style={{ animationDelay: '0.3s' }}
        >
          {HOW_IT_WORKS.map((s, i) => (
            <div key={i} className="flex-1 flex flex-col items-center gap-1 text-center">
              <div className="w-7 h-7 rounded-full bg-primary/20 border border-primary/30 flex items-center justify-center">
                <span className="text-xs font-bold text-primary">{s.step}</span>
              </div>
              <span className="text-[11px] font-semibold text-nav-dark-foreground/85">{s.label}</span>
              <span className="text-[10px] text-nav-dark-foreground/45 leading-tight">{s.desc}</span>
            </div>
          ))}
        </div>

        {/* CTAs */}
        <div className="space-y-2.5 animate-fade-in" style={{ animationDelay: '0.4s' }}>
          <Button
            variant="amber"
            size="full"
            className="h-14 text-base font-bold gap-2 shadow-lg btn-pulse"
            onClick={() => navigate('register')}
          >
            Get Started Free <ArrowRight className="w-4 h-4" />
          </Button>
          <button
            onClick={() => navigate('sign-in')}
            className="w-full text-center text-sm text-nav-dark-foreground/50 hover:text-nav-dark-foreground/80 transition-colors py-2"
          >
            I already have an account
          </button>
        </div>

        {/* Trust strip */}
        <div
          className="flex flex-wrap justify-center gap-x-4 gap-y-1.5 mt-5 animate-fade-in"
          style={{ animationDelay: '0.5s' }}
        >
          {['Verified mechanics', 'M-Pesa accepted', 'Live tracking'].map((pill) => (
            <div key={pill} className="flex items-center gap-1.5">
              <CheckCircle className="w-3.5 h-3.5 text-primary/70 flex-shrink-0" />
              <span className="text-[11px] text-nav-dark-foreground/50">{pill}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
