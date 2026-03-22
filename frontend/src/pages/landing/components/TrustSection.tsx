import { useState, useEffect, useRef } from 'react';
import { Building2, Users, Shield, Headphones } from 'lucide-react';

// Animated counter hook
const useCountUp = (end: number, duration: number = 2000, isDecimal: boolean = false) => {
  const [count, setCount] = useState(0);
  const [hasStarted, setHasStarted] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const element = ref.current;
    if (!element) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !hasStarted) {
          setHasStarted(true);
        }
      },
      { threshold: 0.3 }
    );

    observer.observe(element);

    return () => {
      observer.unobserve(element);
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
      const animatedValue = easeOutQuart * end;
      // Preserve decimal values when needed (e.g., 99.9%)
      setCount(isDecimal ? Math.round(animatedValue * 10) / 10 : Math.floor(animatedValue));

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
  }, [hasStarted, end, duration, isDecimal]);

  return { count, ref, hasStarted };
};

const trustMetrics = [
  {
    icon: Building2,
    value: 500,
    suffix: '+',
    label: 'Hospitals Served',
    description: 'Healthcare facilities trust our platform',
    gradient: 'from-blue-600 to-blue-700',
    iconBg: 'bg-blue-100',
    iconColor: 'text-blue-600',
    hoverBorder: 'hover:border-blue-300',
  },
  {
    icon: Users,
    value: 1000000,
    suffix: '+',
    label: 'Patients Managed',
    description: 'Patient records securely stored',
    gradient: 'from-teal-500 to-teal-600',
    iconBg: 'bg-teal-100',
    iconColor: 'text-teal-600',
    hoverBorder: 'hover:border-teal-300',
  },
  {
    icon: Shield,
    value: 99.9,
    suffix: '%',
    label: 'System Uptime',
    description: 'Reliable 24/7 availability',
    gradient: 'from-emerald-500 to-emerald-600',
    iconBg: 'bg-emerald-100',
    iconColor: 'text-emerald-600',
    hoverBorder: 'hover:border-emerald-300',
    isDecimal: true,
  },
  {
    icon: Headphones,
    value: 24,
    suffix: '/7',
    label: 'Support Available',
    description: 'Round-the-clock assistance',
    gradient: 'from-amber-500 to-amber-600',
    iconBg: 'bg-amber-100',
    iconColor: 'text-amber-600',
    hoverBorder: 'hover:border-amber-300',
  },
];

const TrustMetricCard = ({ metric }: { metric: typeof trustMetrics[0] }) => {
  const Icon = metric.icon;
  const { count, ref } = useCountUp(metric.value, 2500, metric.isDecimal);

  const formatNumber = (num: number): string => {
    if (num >= 1000000) {
      return (num / 1000000).toFixed(0) + 'M';
    }
    if (num >= 1000) {
      return (num / 1000).toFixed(0) + 'K';
    }
    if (metric.isDecimal) {
      return num.toFixed(1);
    }
    return num.toString();
  };

  return (
    <div
      ref={ref}
      className={`group relative bg-white/80 backdrop-blur-sm rounded-2xl p-6 lg:p-8 text-center border border-slate-100/50 ${metric.hoverBorder} hover:border-transparent hover:shadow-2xl hover:shadow-slate-200/50 transition-all duration-500 min-h-[220px] flex flex-col justify-center transform hover:-translate-y-2 hover:scale-[1.02]`}
    >
      {/* Animated glow effect on hover */}
      <div className={`absolute -inset-0.5 bg-gradient-to-r ${metric.gradient} rounded-2xl opacity-0 group-hover:opacity-20 blur-sm transition-opacity duration-500`}></div>
      
      {/* Icon - Fixed size container with enhanced animation */}
      <div className={`w-16 h-16 mx-auto bg-gradient-to-br ${metric.gradient} rounded-2xl flex items-center justify-center shadow-lg mb-5 group-hover:scale-110 group-hover:rotate-6 transition-all duration-500 flex-shrink-0 relative`}>
        {/* Icon glow effect */}
        <div className={`absolute inset-0 bg-gradient-to-br ${metric.gradient} rounded-2xl blur-xl opacity-0 group-hover:opacity-50 transition-opacity duration-500`}></div>
        <Icon className="w-8 h-8 text-white relative z-10" />
      </div>

      {/* Value - Animated counter */}
      <div className="min-h-[44px] flex items-center justify-center">
        <h3 className="text-3xl lg:text-4xl font-bold text-slate-900 group-hover:text-slate-800 transition-colors duration-300">
          {formatNumber(count)}{metric.suffix}
        </h3>
      </div>

      {/* Label */}
      <p className="text-lg font-semibold text-slate-700 mt-1 group-hover:text-slate-800 transition-colors duration-300">
        {metric.label}
      </p>

      {/* Description */}
      <p className="text-sm text-slate-500 mt-1 leading-relaxed group-hover:text-slate-600 transition-colors duration-300">
        {metric.description}
      </p>
      
      {/* Bottom accent line */}
      <div className={`absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r ${metric.gradient} rounded-b-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500`}></div>
    </div>
  );
};

const TrustSection = () => {
  return (
    <section id="trust" className="py-20 lg:py-28 relative overflow-hidden">
      {/* Section background tint — blue-indigo wash with accent orbs */}
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-blue-50/35 to-transparent pointer-events-none" />
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-blue-100/40 rounded-full blur-3xl opacity-60"></div>
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-teal-100/40 rounded-full blur-3xl opacity-60"></div>
      </div>

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-blue-50/80 backdrop-blur-sm rounded-full mb-6 border border-blue-100/50">
            <Shield className="w-4 h-4 text-blue-600" />
            <span className="text-sm font-semibold text-blue-700">Trusted Platform</span>
          </div>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-slate-900 mb-4 tracking-tight">
            Trusted by <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-teal-500">Healthcare Leaders</span>
          </h2>
          <p className="text-lg text-slate-600 max-w-2xl mx-auto leading-relaxed">
            Our platform powers healthcare delivery across hundreds of facilities, 
            serving millions of patients with reliable, secure technology.
          </p>
        </div>

        {/* Trust Metrics Grid - With animated counters */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 lg:gap-8">
          {trustMetrics.map((metric, index) => (
            <TrustMetricCard key={index} metric={metric} />
          ))}
        </div>

        {/* Trust Badges */}
        <div className="mt-16 lg:mt-20 pt-12 lg:pt-16 border-t border-slate-100/50">
          <p className="text-center text-sm text-slate-500 mb-8 font-medium">
            Certified and compliant with industry standards
          </p>
          <div className="flex flex-wrap justify-center items-center gap-6 lg:gap-8">
            {/* HIPAA Badge */}
            <div className="flex items-center gap-3 px-6 py-3 bg-white/80 backdrop-blur-sm rounded-xl border border-slate-100/50 hover:border-emerald-200 hover:shadow-lg hover:shadow-emerald-500/10 transition-all duration-300 group hover:-translate-y-1">
              <div className="w-10 h-10 bg-emerald-100 rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                <Shield className="w-5 h-5 text-emerald-600" />
              </div>
              <div className="text-left">
                <p className="font-semibold text-slate-900">HIPAA</p>
                <p className="text-xs text-slate-500">Compliant</p>
              </div>
            </div>

            {/* ISO Badge */}
            <div className="flex items-center gap-3 px-6 py-3 bg-white/80 backdrop-blur-sm rounded-xl border border-slate-100/50 hover:border-blue-200 hover:shadow-lg hover:shadow-blue-500/10 transition-all duration-300 group hover:-translate-y-1">
              <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                <svg className="w-5 h-5 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
              </div>
              <div className="text-left">
                <p className="font-semibold text-slate-900">ISO 27001</p>
                <p className="text-xs text-slate-500">Certified</p>
              </div>
            </div>

            {/* SSL Badge */}
            <div className="flex items-center gap-3 px-6 py-3 bg-white/80 backdrop-blur-sm rounded-xl border border-slate-100/50 hover:border-blue-200 hover:shadow-lg hover:shadow-blue-500/10 transition-all duration-300 group hover:-translate-y-1">
              <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                <svg className="w-5 h-5 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
              </div>
              <div className="text-left">
                <p className="font-semibold text-slate-900">256-bit SSL</p>
                <p className="text-xs text-slate-500">Encrypted</p>
              </div>
            </div>

            {/* GDPR Badge */}
            <div className="flex items-center gap-3 px-6 py-3 bg-white/80 backdrop-blur-sm rounded-xl border border-slate-100/50 hover:border-purple-200 hover:shadow-lg hover:shadow-purple-500/10 transition-all duration-300 group hover:-translate-y-1">
              <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                <svg className="w-5 h-5 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div className="text-left">
                <p className="font-semibold text-slate-900">GDPR</p>
                <p className="text-xs text-slate-500">Ready</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default TrustSection;
