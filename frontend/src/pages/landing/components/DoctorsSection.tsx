import { Star, MapPin, Calendar } from 'lucide-react';
import { Link } from 'react-router-dom';

const doctors = [
  {
    name: 'Dr. Sarah Mitchell',
    specialization: 'Cardiologist',
    experience: '15+ years',
    rating: 4.9,
    reviews: 234,
    location: 'Heart Institute, Building A',
    image: 'https://images.unsplash.com/photo-1559839734-2b71ea197ec2?w=300&h=300&fit=crop&crop=face',
    available: true,
  },
  {
    name: 'Dr. James Anderson',
    specialization: 'Orthopedic Surgeon',
    experience: '20+ years',
    rating: 4.8,
    reviews: 189,
    location: 'Orthopedic Center, Building B',
    image: 'https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?w=300&h=300&fit=crop&crop=face',
    available: true,
  },
  {
    name: 'Dr. Emily Chen',
    specialization: 'Neurologist',
    experience: '12+ years',
    rating: 4.9,
    reviews: 156,
    location: 'Neurosciences, Building C',
    image: 'https://images.unsplash.com/photo-1594824476967-48c8b964273f?w=300&h=300&fit=crop&crop=face',
    available: false,
  },
  {
    name: 'Dr. Michael Roberts',
    specialization: 'Pediatrician',
    experience: '18+ years',
    rating: 5.0,
    reviews: 312,
    location: 'Children\'s Wing, Building D',
    image: 'https://images.unsplash.com/photo-1537368910025-700350fe46c7?w=300&h=300&fit=crop&crop=face',
    available: true,
  },
  {
    name: 'Dr. Lisa Thompson',
    specialization: 'Dermatologist',
    experience: '10+ years',
    rating: 4.7,
    reviews: 98,
    location: 'Skin Care Center, Building A',
    image: 'https://images.unsplash.com/photo-1551836022-d5d88e9218df?w=300&h=300&fit=crop&crop=face',
    available: true,
  },
  {
    name: 'Dr. David Wilson',
    specialization: 'General Physician',
    experience: '25+ years',
    rating: 4.8,
    reviews: 445,
    location: 'Primary Care, Building E',
    image: 'https://images.unsplash.com/photo-1582750433449-648ed127bb54?w=300&h=300&fit=crop&crop=face',
    available: true,
  },
];

const DoctorsSection = () => {
  return (
    <section id="doctors" className="py-20 lg:py-28 bg-slate-50/30">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-blue-50 rounded-full mb-6">
            <Star className="w-4 h-4 text-blue-600" />
            <span className="text-sm font-semibold text-blue-700">Expert Care Team</span>
          </div>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-slate-900 mb-4 tracking-tight">
            Meet Our Expert Doctors
          </h2>
          <p className="text-lg text-slate-600 max-w-2xl mx-auto leading-relaxed">
            Our team of highly qualified medical professionals is dedicated to providing 
            exceptional patient care with compassion and expertise.
          </p>
        </div>

        {/* Doctors Grid - Stable layout */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8">
          {doctors.map((doctor, index) => (
            <div
              key={index}
              className="group bg-white rounded-2xl border border-slate-100 overflow-hidden hover:shadow-2xl hover:shadow-slate-200/50 hover:border-transparent transition-all duration-300 flex flex-col"
            >
              {/* Image Section - Fixed height */}
              <div className="relative h-52 overflow-hidden bg-slate-100 flex-shrink-0">
                <img
                  src={doctor.image}
                  alt={doctor.name}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />
                {/* Availability Badge */}
                <div className={`absolute top-4 right-4 px-3 py-1.5 rounded-full text-xs font-semibold ${
                  doctor.available 
                    ? 'bg-emerald-100 text-emerald-700' 
                    : 'bg-slate-100 text-slate-600'
                }`}>
                  {doctor.available ? 'Available Today' : 'Fully Booked'}
                </div>
                {/* Gradient Overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-slate-900/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              </div>

              {/* Content Section - Flexible */}
              <div className="p-5 flex flex-col flex-grow">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <h3 className="text-lg font-bold text-slate-900 group-hover:text-blue-700 transition-colors">
                      {doctor.name}
                    </h3>
                    <p className="text-blue-600 font-medium text-sm">
                      {doctor.specialization}
                    </p>
                  </div>
                  <div className="flex items-center gap-1 bg-amber-50 px-2.5 py-1 rounded-lg">
                    <Star className="w-4 h-4 text-amber-400 fill-current" />
                    <span className="text-sm font-bold text-amber-700">{doctor.rating}</span>
                  </div>
                </div>

                <div className="space-y-2 mb-4 flex-grow">
                  <div className="flex items-center gap-2 text-sm text-slate-600">
                    <span className="font-semibold text-slate-700">{doctor.experience}</span>
                    <span className="text-slate-300">•</span>
                    <span>{doctor.reviews} reviews</span>
                  </div>
                  <div className="flex items-start gap-2 text-sm text-slate-500">
                    <MapPin className="w-4 h-4 mt-0.5 flex-shrink-0 text-slate-400" />
                    <span>{doctor.location}</span>
                  </div>
                </div>

                {/* Book Appointment Button - Links to Patient Login */}
                <Link
                  to="/patient-login"
                  className={`w-full flex items-center justify-center gap-2 py-3 rounded-xl font-semibold transition-all duration-300 mt-auto ${
                    doctor.available
                      ? 'bg-blue-600 text-white hover:bg-blue-700 shadow-lg shadow-blue-500/20 hover:shadow-xl'
                      : 'bg-slate-100 text-slate-500 hover:bg-slate-200'
                  }`}
                >
                  <Calendar className="w-4 h-4" />
                  {doctor.available ? 'Book Appointment' : 'Join Waitlist'}
                </Link>
              </div>
            </div>
          ))}
        </div>

        {/* View All CTA */}
        <div className="text-center mt-12 lg:mt-16">
          <Link
            to="/patient-login"
            className="inline-flex items-center gap-2 px-8 py-4 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-2xl font-semibold hover:from-blue-700 hover:to-blue-800 transition-all duration-300 shadow-xl shadow-blue-500/20 hover:shadow-2xl hover:shadow-blue-500/30 group"
          >
            View All Doctors
            <svg className="w-5 h-5 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
            </svg>
          </Link>
        </div>
      </div>
    </section>
  );
};

export default DoctorsSection;
