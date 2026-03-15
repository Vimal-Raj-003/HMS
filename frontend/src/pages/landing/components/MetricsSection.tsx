import { Bed, Users, Clock, Activity } from 'lucide-react';

const metrics = [
  {
    icon: Bed,
    value: '350',
    label: 'Hospital Beds',
    description: 'State-of-the-art facilities',
    color: 'primary',
    gradient: 'from-blue-600 to-blue-700',
    bgGradient: 'from-blue-50 to-blue-100',
    iconBg: 'bg-gradient-to-br from-blue-50 to-blue-100',
    iconColor: 'text-blue-600',
  },
  {
    icon: Users,
    value: '120+',
    label: 'Expert Doctors',
    description: 'Board-certified specialists',
    color: 'healthcare',
    gradient: 'from-teal-500 to-teal-600',
    bgGradient: 'from-teal-50 to-teal-100',
    iconBg: 'bg-gradient-to-br from-teal-50 to-teal-100',
    iconColor: 'text-teal-600',
  },
  {
    icon: Activity,
    value: '125,000+',
    label: 'Patients Served',
    description: 'Trusted healthcare partner',
    color: 'green',
    gradient: 'from-emerald-500 to-emerald-600',
    bgGradient: 'from-emerald-50 to-emerald-100',
    iconBg: 'bg-gradient-to-br from-emerald-50 to-emerald-100',
    iconColor: 'text-emerald-600',
  },
  {
    icon: Clock,
    value: '7 min',
    label: 'Avg. Wait Time',
    description: 'Quick & efficient service',
    color: 'amber',
    gradient: 'from-amber-500 to-amber-600',
    bgGradient: 'from-amber-50 to-amber-100',
    iconBg: 'bg-gradient-to-br from-amber-50 to-amber-100',
    iconColor: 'text-amber-600',
  },
];

const MetricsSection = () => {
  return (
    <section className="py-20 lg:py-28 bg-white" id="metrics">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-blue-50 rounded-full mb-6">
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
          {metrics.map((metric, index) => {
            const Icon = metric.icon;
            return (
              <div
                key={index}
                className="group relative bg-white rounded-2xl p-6 lg:p-8 border border-slate-100 hover:border-transparent hover:shadow-2xl hover:shadow-slate-200/50 transition-all duration-300 cursor-default h-full min-h-[200px] flex flex-col"
              >
                {/* Hover gradient background */}
                <div className={`absolute inset-0 bg-gradient-to-br ${metric.bgGradient} rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300`}></div>
                
                {/* Content - Relative positioning for stability */}
                <div className="relative z-10 flex flex-col h-full">
                  {/* Icon Container - Fixed size */}
                  <div className={`w-14 h-14 ${metric.iconBg} rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300 flex-shrink-0`}>
                    <Icon className={`w-7 h-7 ${metric.iconColor}`} />
                  </div>
                  
                  {/* Text Content - Flexible with stable layout */}
                  <div className="space-y-2 flex-grow">
                    {/* Value - Fixed min-height for alignment */}
                    <h3 className="text-3xl lg:text-4xl font-bold text-slate-900 group-hover:text-slate-800 tracking-tight">
                      {metric.value}
                    </h3>
                    {/* Label */}
                    <p className="text-lg font-semibold text-slate-700">
                      {metric.label}
                    </p>
                    {/* Description */}
                    <p className="text-sm text-slate-500 leading-relaxed">
                      {metric.description}
                    </p>
                  </div>
                </div>

                {/* Decorative corner accent */}
                <div className={`absolute top-0 right-0 w-20 h-20 bg-gradient-to-br ${metric.bgGradient} rounded-bl-[40px] rounded-tr-2xl opacity-20 group-hover:opacity-40 transition-opacity duration-300`}></div>
              </div>
            );
          })}
        </div>

        {/* Bottom Stats Bar - Stable container for dynamic values */}
        <div className="mt-16 lg:mt-20 bg-gradient-to-r from-blue-600 via-blue-700 to-teal-600 rounded-3xl p-8 md:p-12 shadow-2xl shadow-blue-500/20">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-8 lg:gap-12">
            <div className="text-center">
              <div className="min-h-[48px] flex items-center justify-center">
                <p className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white">99.9%</p>
              </div>
              <p className="text-blue-100 text-sm lg:text-base mt-2 font-medium">System Uptime</p>
            </div>
            <div className="text-center">
              <div className="min-h-[48px] flex items-center justify-center">
                <p className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white">24/7</p>
              </div>
              <p className="text-blue-100 text-sm lg:text-base mt-2 font-medium">Support Available</p>
            </div>
            <div className="text-center">
              <div className="min-h-[48px] flex items-center justify-center">
                <p className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white">15+</p>
              </div>
              <p className="text-blue-100 text-sm lg:text-base mt-2 font-medium">Medical Specialties</p>
            </div>
            <div className="text-center">
              <div className="min-h-[48px] flex items-center justify-center">
                <p className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white">5★</p>
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
