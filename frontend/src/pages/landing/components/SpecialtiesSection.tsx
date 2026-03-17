import { 
  Heart, 
  Bone, 
  Brain, 
  Sparkles, 
  Baby, 
  Stethoscope,
  ArrowRight 
} from 'lucide-react';

const specialties = [
  {
    icon: Heart,
    name: 'Cardiology',
    description: 'Advanced cardiac care with state-of-the-art diagnostic and treatment facilities for heart conditions.',
    color: 'from-red-500 to-rose-600',
    bgColor: 'bg-red-50',
    glowColor: 'group-hover:shadow-red-500/20',
    doctors: 15,
  },
  {
    icon: Bone,
    name: 'Orthopedics',
    description: 'Comprehensive bone and joint care including sports medicine, joint replacement, and spine surgery.',
    color: 'from-blue-500 to-indigo-600',
    bgColor: 'bg-blue-50',
    glowColor: 'group-hover:shadow-blue-500/20',
    doctors: 12,
  },
  {
    icon: Brain,
    name: 'Neurology',
    description: 'Expert neurological care for brain, spine, and nervous system disorders with cutting-edge treatments.',
    color: 'from-purple-500 to-violet-600',
    bgColor: 'bg-purple-50',
    glowColor: 'group-hover:shadow-purple-500/20',
    doctors: 10,
  },
  {
    icon: Sparkles,
    name: 'Dermatology',
    description: 'Complete skin care solutions from cosmetic dermatology to treatment of complex skin conditions.',
    color: 'from-amber-500 to-orange-600',
    bgColor: 'bg-amber-50',
    glowColor: 'group-hover:shadow-amber-500/20',
    doctors: 8,
  },
  {
    icon: Baby,
    name: 'Pediatrics',
    description: 'Specialized healthcare for infants, children, and adolescents with a child-friendly approach.',
    color: 'from-pink-500 to-rose-600',
    bgColor: 'bg-pink-50',
    glowColor: 'group-hover:shadow-pink-500/20',
    doctors: 18,
  },
  {
    icon: Stethoscope,
    name: 'General Medicine',
    description: 'Primary care services for overall health management, preventive care, and chronic disease management.',
    color: 'from-teal-500 to-teal-600',
    bgColor: 'bg-teal-50',
    glowColor: 'group-hover:shadow-teal-500/20',
    doctors: 25,
  },
];

const SpecialtiesSection = () => {
  return (
    <section id="specialties" className="py-20 lg:py-28 bg-transparent relative">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-teal-50/80 backdrop-blur-sm rounded-full mb-6 border border-teal-100/50">
            <Stethoscope className="w-4 h-4 text-teal-600" />
            <span className="text-sm font-semibold text-teal-700">Medical Excellence</span>
          </div>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-slate-900 mb-4 tracking-tight">
            Our Specialties
          </h2>
          <p className="text-lg text-slate-600 max-w-2xl mx-auto leading-relaxed">
            Comprehensive healthcare services across multiple medical disciplines, 
            all under one roof with expert specialists.
          </p>
        </div>

        {/* Specialties Grid - Enhanced with smooth animations */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8">
          {specialties.map((specialty, index) => {
            const Icon = specialty.icon;
            return (
              <div
                key={index}
                className={`group relative bg-white/80 backdrop-blur-sm rounded-2xl p-6 lg:p-8 border border-slate-100/50 hover:border-transparent hover:shadow-2xl ${specialty.glowColor} transition-all duration-500 overflow-hidden min-h-[280px] flex flex-col transform hover:-translate-y-2 hover:scale-[1.02]`}
              >
                {/* Background decoration with enhanced animation */}
                <div className={`absolute top-0 right-0 w-32 h-32 ${specialty.bgColor} rounded-bl-[80px] opacity-40 group-hover:opacity-70 group-hover:scale-125 transition-all duration-500`}></div>
                
                {/* Animated glow border */}
                <div className={`absolute -inset-0.5 bg-gradient-to-r ${specialty.color} rounded-2xl opacity-0 group-hover:opacity-20 blur-sm transition-opacity duration-500`}></div>
                
                {/* Content - Flexible layout */}
                <div className="relative z-10 flex flex-col h-full">
                  {/* Icon - Fixed size with glow effect */}
                  <div className={`w-14 h-14 bg-gradient-to-br ${specialty.color} rounded-2xl flex items-center justify-center shadow-lg mb-5 group-hover:scale-110 group-hover:rotate-6 transition-all duration-500 flex-shrink-0 relative`}>
                    {/* Icon glow effect */}
                    <div className={`absolute inset-0 bg-gradient-to-br ${specialty.color} rounded-2xl blur-lg opacity-0 group-hover:opacity-50 transition-opacity duration-500`}></div>
                    <Icon className="w-7 h-7 text-white relative z-10" />
                  </div>
                  
                  {/* Title with color transition */}
                  <h3 className="text-xl font-bold text-slate-900 mb-2 group-hover:text-blue-700 transition-colors duration-300">
                    {specialty.name}
                  </h3>
                  
                  {/* Description - Flexible */}
                  <p className="text-slate-600 text-sm leading-relaxed mb-4 flex-grow group-hover:text-slate-700 transition-colors duration-300">
                    {specialty.description}
                  </p>
                  
                  {/* Footer - Fixed at bottom */}
                  <div className="flex items-center justify-between pt-4 border-t border-slate-100/80 mt-auto group-hover:border-slate-200/80 transition-colors duration-300">
                    <span className="text-sm text-slate-500 group-hover:text-slate-600 transition-colors duration-300">
                      <span className={`font-bold bg-gradient-to-r ${specialty.color} bg-clip-text text-transparent`}>{specialty.doctors}</span> Specialists
                    </span>
                    <button className="flex items-center gap-1 text-sm font-medium text-blue-600 hover:text-blue-700 group/btn transition-all duration-300">
                      Learn More
                      <ArrowRight className="w-4 h-4 group-hover/btn:translate-x-1 transition-transform duration-300" />
                    </button>
                  </div>
                </div>
                
                {/* Bottom accent line */}
                <div className={`absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r ${specialty.color} rounded-b-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500`}></div>
              </div>
            );
          })}
        </div>

        {/* CTA */}
        <div className="text-center mt-12 lg:mt-16">
          <p className="text-slate-600 mb-4 text-lg">
            Can't find what you're looking for?
          </p>
          <button className="inline-flex items-center gap-2 px-6 py-3 bg-slate-100/80 backdrop-blur-sm text-slate-700 rounded-xl font-semibold hover:bg-slate-200/80 transition-all duration-300 group border border-slate-200/50 hover:border-slate-300/50 hover:shadow-lg hover:-translate-y-1">
            View All Departments
            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform duration-300" />
          </button>
        </div>
      </div>
    </section>
  );
};

export default SpecialtiesSection;
