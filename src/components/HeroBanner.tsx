import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Sparkles, ArrowRight, ChevronLeft, ChevronRight, Search } from 'lucide-react';
import { Link } from 'react-router-dom';

const BANNERS = [
  {
    id: 1,
    title: "Give a Home to a Pawfect Companion",
    subtitle: "Find Your New Best Friend",
    description: "Hundreds of pets are waiting for their forever homes. Start your adoption journey today.",
    image: "https://images.unsplash.com/photo-1450778869180-41d0601e046e?auto=format&fit=crop&q=80&w=2000",
    cta: "Adopt Now",
    link: "/",
    color: "emerald"
  },
  {
    id: 2,
    title: "Premium Supplies for Your Best Friend",
    subtitle: "Shop Pet Essentials",
    description: "From organic treats to orthopedic beds, we have everything your pet needs to thrive.",
    image: "https://images.unsplash.com/photo-1516734212186-a967f81ad0d7?auto=format&fit=crop&q=80&w=2000",
    cta: "Shop Supplies",
    link: "/products",
    color: "amber"
  },
  {
    id: 3,
    title: "New Arrivals: Meet Our Latest Friends",
    subtitle: "Fresh Faces",
    description: "Discover the newest members of our shelter family looking for love and care.",
    image: "https://images.unsplash.com/photo-1548199973-03cce0bbc87b?auto=format&fit=crop&q=80&w=2000",
    cta: "Meet Them",
    link: "/",
    color: "rose"
  }
];

interface HeroBannerProps {
  searchQuery: string;
  setSearchQuery: (query: string) => void;
}

export default function HeroBanner({ searchQuery, setSearchQuery }: HeroBannerProps) {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [direction, setDirection] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      nextSlide();
    }, 8000);
    return () => clearInterval(timer);
  }, [currentSlide]);

  const nextSlide = () => {
    setDirection(1);
    setCurrentSlide((prev) => (prev + 1) % BANNERS.length);
  };

  const prevSlide = () => {
    setDirection(-1);
    setCurrentSlide((prev) => (prev - 1 + BANNERS.length) % BANNERS.length);
  };

  const variants = {
    enter: (direction: number) => ({
      x: direction > 0 ? 1000 : -1000,
      opacity: 0
    }),
    center: {
      zIndex: 1,
      x: 0,
      opacity: 1
    },
    exit: (direction: number) => ({
      zIndex: 0,
      x: direction < 0 ? 1000 : -1000,
      opacity: 0
    })
  };

  const banner = BANNERS[currentSlide];

  return (
    <section className="relative h-[75vh] md:h-[85vh] w-full overflow-hidden bg-stone-900">
      <AnimatePresence initial={false} custom={direction}>
        <motion.div
          key={currentSlide}
          custom={direction}
          variants={variants}
          initial="enter"
          animate="center"
          exit="exit"
          transition={{
            x: { type: "spring", stiffness: 300, damping: 30 },
            opacity: { duration: 0.5 }
          }}
          className="absolute inset-0"
        >
          {/* Background Image */}
          <div className="absolute inset-0">
            <img
              src={banner.image}
              alt={banner.title}
              className="w-full h-full object-cover scale-105"
              referrerPolicy="no-referrer"
            />
            <div className="absolute inset-0 bg-gradient-to-r from-stone-950/90 via-stone-950/60 to-transparent" />
          </div>

          {/* Content */}
          <div className="relative h-full max-w-7xl mx-auto px-4 flex flex-col justify-center">
            <div className="max-w-2xl">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className={`inline-flex items-center gap-2 px-4 py-2 bg-white/10 backdrop-blur-md border border-white/20 rounded-full text-white text-sm font-bold mb-6`}
              >
                <Sparkles className="w-4 h-4 text-emerald-400" />
                {banner.subtitle}
              </motion.div>

              <motion.h1
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="text-5xl md:text-7xl font-black text-white tracking-tight mb-6 leading-tight"
              >
                {banner.title.split(':').map((part, i) => (
                  <span key={i} className={i === 1 ? "text-emerald-400 italic font-serif" : ""}>
                    {part}
                    {i === 0 && banner.title.includes(':') && ":"}
                  </span>
                ))}
                {banner.id === 1 && (
                  <>
                    Give a Home to a <br />
                    <span className="text-emerald-400 italic font-serif">Pawfect</span> Companion
                  </>
                )}
                {banner.id === 2 && (
                  <>
                    Premium Supplies for <br />
                    Your <span className="text-amber-400 italic font-serif">Best Friend</span>
                  </>
                )}
                {banner.id === 3 && (
                  <>
                    New Arrivals: Meet Our <br />
                    <span className="text-rose-400 italic font-serif">Latest Friends</span>
                  </>
                )}
              </motion.h1>

              <motion.p
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
                className="text-xl text-stone-300 font-medium mb-10 max-w-lg"
              >
                {banner.description}
              </motion.p>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
                className="flex flex-col sm:flex-row gap-4 items-start sm:items-center"
              >
                <Link
                  to={banner.link}
                  className={`px-8 py-4 bg-white text-stone-900 rounded-2xl font-black text-lg flex items-center gap-2 hover:scale-105 transition-all shadow-xl`}
                >
                  {banner.cta}
                  <ArrowRight className="w-5 h-5" />
                </Link>

                <div className="relative w-full max-w-sm">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-stone-400" />
                  <input
                    type="text"
                    placeholder="Search pets..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-12 pr-4 py-4 bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl text-white placeholder:text-stone-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all"
                  />
                </div>
              </motion.div>
            </div>
          </div>
        </motion.div>
      </AnimatePresence>

      {/* Navigation Controls */}
      <div className="absolute bottom-10 left-1/2 -translate-x-1/2 z-20 flex items-center gap-6">
        <button
          onClick={prevSlide}
          className="p-3 bg-white/10 backdrop-blur-md border border-white/20 rounded-full text-white hover:bg-white/20 transition-all"
        >
          <ChevronLeft className="w-6 h-6" />
        </button>

        <div className="flex gap-3">
          {BANNERS.map((_, i) => (
            <button
              key={i}
              onClick={() => {
                setDirection(i > currentSlide ? 1 : -1);
                setCurrentSlide(i);
              }}
              className={`h-2 rounded-full transition-all ${
                i === currentSlide ? "w-8 bg-emerald-500" : "w-2 bg-white/30 hover:bg-white/50"
              }`}
            />
          ))}
        </div>

        <button
          onClick={nextSlide}
          className="p-3 bg-white/10 backdrop-blur-md border border-white/20 rounded-full text-white hover:bg-white/20 transition-all"
        >
          <ChevronRight className="w-6 h-6" />
        </button>
      </div>
    </section>
  );
}
