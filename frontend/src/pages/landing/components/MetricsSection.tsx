import { useState, useEffect, useRef } from 'react';
import { Bed, Users, Clock, Activity } from 'lucide-react';

const metrics = [
  {
    icon: Bed,
    value: 350,
    suffix: '',
    label: 'Hospital Beds',
    description: 'State-of-the-art facilities',
    color: 'primary',
    gradient: 'from-blue-600 to-blue-700',
    bgGradient: 'from-blue-50 to-blue-100',
    iconBg: 'bg-gradient-to-br from-blue-50 to-blue-100',
    iconColor: 'text-blue-600',
    hoverBorder: 'hover:border-blue-300',
  },
  {
    icon: Users,
    value: 120,
    suffix: '+',
    label: 'Expert Doctors',
    description: 'Board-certified specialists',
    color: 'healthcare',
    gradient: 'from-teal-500 to-teal-600',
    bgGradient: 'from-teal-50 to-teal-100',
    iconBg: 'bg-gradient-to-br from-teal-50 to-teal-100',
    iconColor: 'text-teal-600',
    hoverBorder: 'hover:border-teal-300',
  },
  {
    icon: Activity,
    value: 125000,
    suffix: '+',
    label: 'Patients Served',
    description: 'Trusted healthcare partner',
    color: 'green',
    gradient: 'from-emerald-500 to-emerald-600',
    bgGradient: 'from-emerald-50 to-emerald-100',
    iconBg: 'bg-gradient-to-br from-emerald-50 to-emerald-100',
    iconColor: 'text-emerald-600',
    hoverBorder: 'hover:border-emerald-300',
  },
  {
    icon: Clock,
    value: 7,
    suffix: ' min',
    label: 'Avg. Wait Time',
    description: 'Quick & efficient service',
    color: 'amber',
    gradient: 'from-amber-500 to-amber-600',
    bgGradient: 'from-amber-50 to-amber-100',
    iconBg: 'bg-gradient-to-br from-amber-50 to-amber-100',
    iconColor: 'text-amber-600',
    hoverBorder: 'hover:border-amber-300',
  },
];

// Animated counter hook
const useCountUp = (end: number, duration: number = 2000, startOnView: boolean = true) => {
  const [count, setCount] = useState(0);
  const [hasStarted, setHasStarted] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!startOnView) {
      setHasStarted(true);
    }
  }, [startOnView]);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !hasStarted) {
          setHasStarted(true);
        }
      },
      { threshold: 0.3 }
    );

    if (ref.current) {
      observer.observe(ref.current);
    }

    return () => {
      if (ref.current) {
        observer.unobserve(ref.current);
      }
    };
  }, [hasStarted]);

  useEffect(() => {
    if (!hasStarted) return;

    let startTime: number | null = null;
    let animationFrame: number;

    const animate = (timestamp: number) => {
      if (!startTime) startTime = timestamp;
      const progress = Math.min((timestamp - startTime) / duration, 1);
      
      // Easing function for smooth animation
      const easeOutQuart = 1 - Math.pow(1 - progress, 4);
      setCount(Math.floor(easeOutQuart * end));

      if (progress < 1) {
        animationFrame = requestAnimationFrame(animate);
      }
    };

    animationFrame = requestAnimationFrame(animate);

    return () => {
      if (animationFrame) {
        cancelAnimationFrame(animationFrame);
      }
    };
  }, [hasStarted, end, duration]);

  return { count, ref };
};

const MetricCard = ({ metric }: { metric: typeof metrics[0] }) => {
  const Icon = metric.icon;
  const { count, ref } = useCountUp(metric.value, 2000);

  const formatNumber = (num: number): string => {
    if (num >= 1000) {
      return (num / 1000).toFixed(0) + 'K';
    }
    return num.toString();
  };

  return (
    <div
      ref={ref}
      className={`group relative bg-white rounded-2xl p-6 lg:p-8 border border-slate-100 ${metric.hoverBorder} hover:border-transparent hover:shadow-2xl hover:shadow-slate-200/50 transition-all duration-500 cursor-default h-full min-h-[200px] flex flex-col transform hover:-translate-y-2 hover:scale-[1.02]`}
    >
      {/* Hover gradient background */}
      <div className={`absolute inset-0 bg-gradient-to-br ${metric.bgGradient} rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500`}></div>
      
      {/* Animated glow effect on hover */}
      <div className={`absolute -inset-0.5 bg-gradient-to-r ${metric.gradient} rounded-2xl opacity-0 group-hover:opacity-20 blur-sm transition-opacity duration-500`}></div>
      
      {/* Content - Relative positioning for stability */}
      <div className="relative z-10 flex flex-col h-full">
        {/* Icon Container - Fixed size with enhanced animation */}
        <div className={`w-14 h-14 ${metric.iconBg} rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 group-hover:rotate-3 transition-all duration-500 flex-shrink-0 shadow-sm group-hover:shadow-md`}>
          <Icon className={`w-7 h-7 ${metric.iconColor} group-hover:scale-110 transition-transform duration-500`} />
        </div>
        
        {/* Text Content - Flexible with stable layout */}
        <div className="space-y-2 flex-grow">
          {/* Value - Fixed min-height for alignment */}
          <h3 className="text-3xl lg:text-4xl font-bold text-slate-900 group-hover:text-slate-800 tracking-tight transition-colors duration-300">
            {formatNumber(count)}{metric.suffix}
          </h3>
          {/* Label */}
          <p className="text-lg font-semibold text-slate-700 group-hover:text-slate-800 transition-colors duration-300">
            {metric.label}
          </p>
          {/* Description */}
          <p className="text-sm text-slate-500 leading-relaxed group-hover:text-slate-600 transition-colors duration-300">
            {metric.description}
          </p>
        </div>
      </div>

      {/* Decorative corner accent with enhanced animation */}
      <div className={`absolute top-0 right-0 w-20 h-20 bg-gradient-to-br ${metric.bgGradient} rounded-bl-[40px] rounded-tr-2xl opacity-20 group-hover:opacity-50 group-hover:scale-110 transition-all duration-500`}></div>
      
      {/* Bottom accent line */}
      <div className={`absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r ${metric.gradient} rounded-b-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500`}></div>
    </div>
  );
};

const MetricsSection = () => {
  return (
    <section className="py-20 lg:py-28 bg-transparent relative" id="metrics">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-blue-50/80 backdrop-blur-sm rounded-full mb-6 border border-blue-100/50">
            <Activity className="w-4 h-4 text-blue-600" />
            <span className="text-sm font-semibold text-blue-700">Platform Overview</span>
          </div>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-slate-900 mb-4 tracking-tight">
            Healthcare at Scale
          </h2>
          <p className="text-lg text-slate-600 max-w-2xl mx-auto leading-relaxed">
            Our platform serves thousands of patients daily with cutting-edge medical care and technology
          </p>
        </div>

        {/* Metrics Grid - Stable Layout with Fixed Heights */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 lg:gap-8">
          {metrics.map((metric, index) => (
            <MetricCard key={index} metric={metric} />
          ))}
        </div>

        {/* Bottom Stats Bar - Stable container for dynamic values */}
        <div className="mt-16 lg:mt-20 bg-gradient-to-r from-blue-600 via-blue-700 to-teal-600 rounded-3xl p-8 md:p-12 shadow-2xl shadow-blue-500/20 relative overflow-hidden group">
          {/* Animated background pattern */}
          <div className="absolute inset-0 opacity-10">
            <div className="absolute inset-0 bg-[radial-gradient(rgba(255,255,255,0.3)_1px,transparent_1px)] bg-[size:20px_20px]"></div>
          </div>
          
          {/* Glow effect */}
          <div className="absolute -inset-1 bg-gradient-to-r from-blue-400 via-teal-400 to-blue-400 opacity-0 group-hover:opacity-30 blur-xl transition-opacity duration-700"></div>
          
          <div className="relative grid grid-cols-2 lg:grid-cols-4 gap-8 lg:gap-12">
            <div className="text-center group/stat">
              <div className="min-h-[48px] flex items-center justify-center">
                <p className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white group-hover/stat:scale-110 transition-transform duration-300">99.9%</p>
              </div>
              <p className="text-blue-100 text-sm lg:text-base mt-2 font-medium">System Uptime</p>
            </div>
            <div className="text-center group/stat">
              <div className="min-h-[48px] flex items-center justify-center">
                <p className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white group-hover/stat:scale-110 transition-transform duration-300">24/7</p>
              </div>
              <p className="text-blue-100 text-sm lg:text-base mt-2 font-medium">Support Available</p>
            </div>
            <div className="text-center group/stat">
              <div className="min-h-[48px] flex items-center justify-center">
                <p className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white group-hover/stat:scale-110 transition-transform duration-300">15+</p>
              </div>
              <p className="text-blue-100 text-sm lg:text-base mt-2 font-medium">Medical Specialties</p>
            </div>
            <div className="text-center group/stat">
              <div className="min-h-[48px] flex items-center justify-center">
                <p className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white group-hover/stat:scale-110 transition-transform duration-300">5★</p>
              </div>
              <p className="text-blue-100 text-sm lg:text-base mt-2 font-medium">Patient Rating</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default MetricsSection;
