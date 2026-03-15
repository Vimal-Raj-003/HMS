import { Building2, Users, Shield, Headphones } from 'lucide-react';

const trustMetrics = [
  {
    icon: Building2,
    value: '500+',
    label: 'Hospitals Served',
    description: 'Healthcare facilities trust our platform',
    gradient: 'from-blue-600 to-blue-700',
    iconBg: 'bg-blue-100',
    iconColor: 'text-blue-600',
  },
  {
    icon: Users,
    value: '1M+',
    label: 'Patients Managed',
    description: 'Patient records securely stored',
    gradient: 'from-teal-500 to-teal-600',
    iconBg: 'bg-teal-100',
    iconColor: 'text-teal-600',
  },
  {
    icon: Shield,
    value: '99.9%',
    label: 'System Uptime',
    description: 'Reliable 24/7 availability',
    gradient: 'from-emerald-500 to-emerald-600',
    iconBg: 'bg-emerald-100',
    iconColor: 'text-emerald-600',
  },
  {
    icon: Headphones,
    value: '24/7',
    label: 'Support Available',
    description: 'Round-the-clock assistance',
    gradient: 'from-amber-500 to-amber-600',
    iconBg: 'bg-amber-100',
    iconColor: 'text-amber-600',
  },
];

const TrustSection = () => {
  return (
    <section id="trust" className="py-20 lg:py-28 bg-white relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-blue-50 rounded-full blur-3xl opacity-40"></div>
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-teal-50 rounded-full blur-3xl opacity-40"></div>
      </div>

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-blue-50 rounded-full mb-6">
            <Shield className="w-4 h-4 text-blue-600" />
            <span className="text-sm font-semibold text-blue-700">Trusted Platform</span>
          </div>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-slate-900 mb-4 tracking-tight">
            Trusted by Healthcare Leaders
          </h2>
          <p className="text-lg text-slate-600 max-w-2xl mx-auto leading-relaxed">
            Our platform powers healthcare delivery across hundreds of facilities, 
            serving millions of patients with reliable, secure technology.
          </p>
        </div>

        {/* Trust Metrics Grid - Stable layout with fixed heights */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 lg:gap-8">
          {trustMetrics.map((metric, index) => {
            const Icon = metric.icon;
            return (
              <div
                key={index}
                className="group relative bg-white rounded-2xl p-6 lg:p-8 text-center border border-slate-100 hover:border-blue-200 hover:shadow-2xl hover:shadow-slate-200/50 transition-all duration-300 min-h-[220px] flex flex-col justify-center"
              >
                {/* Icon - Fixed size container */}
                <div className={`w-16 h-16 mx-auto bg-gradient-to-br ${metric.gradient} rounded-2xl flex items-center justify-center shadow-lg mb-5 group-hover:scale-110 transition-transform duration-300 flex-shrink-0`}>
                  <Icon className="w-8 h-8 text-white" />
                </div>

                {/* Value - Stable container */}
                <div className="min-h-[44px] flex items-center justify-center">
                  <h3 className="text-3xl lg:text-4xl font-bold text-slate-900">
                    {metric.value}
                  </h3>
                </div>

                {/* Label */}
                <p className="text-lg font-semibold text-slate-700 mt-1">
                  {metric.label}
                </p>

                {/* Description */}
                <p className="text-sm text-slate-500 mt-1 leading-relaxed">
                  {metric.description}
                </p>
              </div>
            );
          })}
        </div>

        {/* Trust Badges */}
        <div className="mt-16 lg:mt-20 pt-12 lg:pt-16 border-t border-slate-100">
          <p className="text-center text-sm text-slate-500 mb-8 font-medium">
            Certified and compliant with industry standards
          </p>
          <div className="flex flex-wrap justify-center items-center gap-6 lg:gap-8">
            {/* HIPAA Badge */}
            <div className="flex items-center gap-3 px-6 py-3 bg-slate-50 rounded-xl border border-slate-100 hover:border-emerald-200 hover:shadow-md transition-all duration-300">
              <div className="w-10 h-10 bg-emerald-100 rounded-lg flex items-center justify-center">
                <Shield className="w-5 h-5 text-emerald-600" />
              </div>
              <div className="text-left">
                <p className="font-semibold text-slate-900">HIPAA</p>
                <p className="text-xs text-slate-500">Compliant</p>
              </div>
            </div>

            {/* ISO Badge */}
            <div className="flex items-center gap-3 px-6 py-3 bg-slate-50 rounded-xl border border-slate-100 hover:border-blue-200 hover:shadow-md transition-all duration-300">
              <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
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
            <div className="flex items-center gap-3 px-6 py-3 bg-slate-50 rounded-xl border border-slate-100 hover:border-blue-200 hover:shadow-md transition-all duration-300">
              <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
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
            <div className="flex items-center gap-3 px-6 py-3 bg-slate-50 rounded-xl border border-slate-100 hover:border-purple-200 hover:shadow-md transition-all duration-300">
              <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
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
