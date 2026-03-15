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
    doctors: 15,
  },
  {
    icon: Bone,
    name: 'Orthopedics',
    description: 'Comprehensive bone and joint care including sports medicine, joint replacement, and spine surgery.',
    color: 'from-blue-500 to-indigo-600',
    bgColor: 'bg-blue-50',
    doctors: 12,
  },
  {
    icon: Brain,
    name: 'Neurology',
    description: 'Expert neurological care for brain, spine, and nervous system disorders with cutting-edge treatments.',
    color: 'from-purple-500 to-violet-600',
    bgColor: 'bg-purple-50',
    doctors: 10,
  },
  {
    icon: Sparkles,
    name: 'Dermatology',
    description: 'Complete skin care solutions from cosmetic dermatology to treatment of complex skin conditions.',
    color: 'from-amber-500 to-orange-600',
    bgColor: 'bg-amber-50',
    doctors: 8,
  },
  {
    icon: Baby,
    name: 'Pediatrics',
    description: 'Specialized healthcare for infants, children, and adolescents with a child-friendly approach.',
    color: 'from-pink-500 to-rose-600',
    bgColor: 'bg-pink-50',
    doctors: 18,
  },
  {
    icon: Stethoscope,
    name: 'General Medicine',
    description: 'Primary care services for overall health management, preventive care, and chronic disease management.',
    color: 'from-teal-500 to-teal-600',
    bgColor: 'bg-teal-50',
    doctors: 25,
  },
];

const SpecialtiesSection = () => {
  return (
    <section id="specialties" className="py-20 lg:py-28 bg-gradient-to-b from-white to-slate-50/50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-teal-50 rounded-full mb-6">
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

        {/* Specialties Grid - Stable layout */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8">
          {specialties.map((specialty, index) => {
            const Icon = specialty.icon;
            return (
              <div
                key={index}
                className="group relative bg-white rounded-2xl p-6 lg:p-8 border border-slate-100 hover:border-transparent hover:shadow-2xl hover:shadow-slate-200/50 transition-all duration-300 overflow-hidden min-h-[280px] flex flex-col"
              >
                {/* Background decoration */}
                <div className={`absolute top-0 right-0 w-32 h-32 ${specialty.bgColor} rounded-bl-[80px] opacity-50 group-hover:opacity-70 transition-opacity duration-300`}></div>
                
                {/* Content - Flexible layout */}
                <div className="relative z-10 flex flex-col h-full">
                  {/* Icon - Fixed size */}
                  <div className={`w-14 h-14 bg-gradient-to-br ${specialty.color} rounded-2xl flex items-center justify-center shadow-lg mb-5 group-hover:scale-110 transition-transform duration-300 flex-shrink-0`}>
                    <Icon className="w-7 h-7 text-white" />
                  </div>
                  
                  {/* Title */}
                  <h3 className="text-xl font-bold text-slate-900 mb-2 group-hover:text-blue-700 transition-colors">
                    {specialty.name}
                  </h3>
                  
                  {/* Description - Flexible */}
                  <p className="text-slate-600 text-sm leading-relaxed mb-4 flex-grow">
                    {specialty.description}
                  </p>
                  
                  {/* Footer - Fixed at bottom */}
                  <div className="flex items-center justify-between pt-4 border-t border-slate-100 mt-auto">
                    <span className="text-sm text-slate-500">
                      <span className="font-semibold text-slate-700">{specialty.doctors}</span> Specialists
                    </span>
                    <button className="flex items-center gap-1 text-sm font-medium text-blue-600 hover:text-blue-700 group/btn transition-colors">
                      Learn More
                      <ArrowRight className="w-4 h-4 group-hover/btn:translate-x-1 transition-transform" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* CTA */}
        <div className="text-center mt-12 lg:mt-16">
          <p className="text-slate-600 mb-4 text-lg">
            Can't find what you're looking for?
          </p>
          <button className="inline-flex items-center gap-2 px-6 py-3 bg-slate-100 text-slate-700 rounded-xl font-semibold hover:bg-slate-200 transition-colors duration-300 group">
            View All Departments
            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </button>
        </div>
      </div>
    </section>
  );
};

export default SpecialtiesSection;
