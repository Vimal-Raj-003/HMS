import { useState, useEffect } from 'react';
import { Star, ChevronLeft, ChevronRight, Quote } from 'lucide-react';

const testimonials = [
  {
    id: 1,
    name: 'Jennifer Martinez',
    role: 'Patient',
    avatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=100&h=100&fit=crop&crop=face',
    rating: 5,
    text: 'The care I received at HMS was exceptional. The doctors were thorough, the staff was compassionate, and the online appointment system made everything so convenient. I\'ve never felt more cared for at a healthcare facility.',
    date: '2 weeks ago',
  },
  {
    id: 2,
    name: 'Dr. Robert Kim',
    role: 'Cardiologist',
    avatar: 'https://images.unsplash.com/photo-1559839734-2b71ea197ec2?w=100&h=100&fit=crop&crop=face',
    rating: 5,
    text: 'As a physician, I appreciate how HMS streamlines my workflow. The integrated patient records, real-time analytics, and seamless communication tools allow me to focus on what matters most - patient care.',
    date: '1 month ago',
  },
  {
    id: 3,
    name: 'Amanda Foster',
    role: 'Patient',
    avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&h=100&fit=crop&crop=face',
    rating: 5,
    text: 'I was impressed by the minimal wait times and the efficiency of the entire process. From booking my appointment online to receiving my prescription, everything was smooth and professional.',
    date: '3 weeks ago',
  },
  {
    id: 4,
    name: 'Michael Thompson',
    role: 'Patient',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop&crop=face',
    rating: 5,
    text: 'The telemedicine feature saved me so much time. I could consult with my doctor from home, get my prescription renewed, and even view my lab results - all through the patient portal. Truly modern healthcare!',
    date: '1 week ago',
  },
  {
    id: 5,
    name: 'Sarah Williams',
    role: 'Nurse',
    avatar: 'https://images.unsplash.com/photo-1551836022-d5d88e9218df?w=100&h=100&fit=crop&crop=face',
    rating: 5,
    text: 'Working with HMS has transformed how I manage patient care. The intuitive interface and comprehensive patient history at my fingertips make my job easier and more effective.',
    date: '2 months ago',
  },
];

const TestimonialsSection = () => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isAutoPlaying, setIsAutoPlaying] = useState(true);

  useEffect(() => {
    if (!isAutoPlaying) return;

    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % testimonials.length);
    }, 5000);

    return () => clearInterval(interval);
  }, [isAutoPlaying]);

  const goToPrevious = () => {
    setIsAutoPlaying(false);
    setCurrentIndex((prev) => (prev - 1 + testimonials.length) % testimonials.length);
  };

  const goToNext = () => {
    setIsAutoPlaying(false);
    setCurrentIndex((prev) => (prev + 1) % testimonials.length);
  };

  const goToSlide = (index: number) => {
    setIsAutoPlaying(false);
    setCurrentIndex(index);
  };

  return (
    <section className="py-20 lg:py-28 bg-transparent relative overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-teal-50/80 backdrop-blur-sm rounded-full mb-6 border border-teal-100/50">
            <Quote className="w-4 h-4 text-teal-600" />
            <span className="text-sm font-semibold text-teal-700">Testimonials</span>
          </div>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-slate-900 mb-4 tracking-tight">
            What Our Patients Say
          </h2>
          <p className="text-lg text-slate-600 max-w-2xl mx-auto leading-relaxed">
            Real experiences from patients and healthcare providers who trust our platform
          </p>
        </div>

        {/* Testimonials Carousel */}
        <div className="relative">
          {/* Main Testimonial Card */}
          <div className="bg-white/80 backdrop-blur-xl rounded-3xl shadow-xl p-8 md:p-12 max-w-3xl mx-auto transition-all duration-500 border border-white/50">
            {/* Quote Icon */}
            <div className="absolute top-6 left-6 w-12 h-12 bg-teal-100 rounded-full flex items-center justify-center">
              <Quote className="w-6 h-6 text-teal-600" />
            </div>
            
            <div className="flex flex-col md:flex-row items-center gap-6">
              <img
                src={testimonials[currentIndex].avatar}
                alt={testimonials[currentIndex].name}
                className="w-20 h-20 rounded-full object-cover border-2 border-white shadow-lg"
              />
              <div className="flex-1 text-center md:text-left">
                <div className="flex items-center justify-center md:justify-start gap-2 mb-2">
                  <h3 className="font-bold text-slate-900">{testimonials[currentIndex].name}</h3>
                  <p className="text-sm text-slate-500">{testimonials[currentIndex].role}</p>
                </div>
                <div className="flex items-center justify-center md:justify-start gap-1 mb-4">
                  {[...Array(testimonials[currentIndex].rating)].map((_, i) => (
                    <Star key={i} className="w-4 h-4 text-amber-400 fill-current" />
                  ))}
                </div>
                <p className="text-slate-600 text-sm mt-2">{testimonials[currentIndex].date}</p>
              </div>
            </div>
            
            <p className="text-slate-700 text-lg leading-relaxed text-center md:text-left">
              "{testimonials[currentIndex].text}"
            </p>
          </div>

          {/* Navigation Buttons */}
          <div className="flex justify-center items-center gap-4 mt-8">
            <button
              onClick={goToPrevious}
              className="p-3 rounded-full bg-white/80 hover:bg-white shadow-lg hover:shadow-slate-200/50 transition-all duration-300 border border-slate-100/50"
            >
              <ChevronLeft className="w-5 h-5 text-slate-600" />
            </button>
            <div className="flex gap-2">
              {testimonials.map((_, index) => (
                <button
                  key={index}
                  onClick={() => goToSlide(index)}
                  className={`w-2.5 h-2.5 rounded-full transition-all duration-300 ${
                    index === currentIndex
                      ? 'bg-teal-500 scale-100'
                      : 'bg-slate-200 hover:bg-slate-300'
                  }`}
                />
              ))}
            </div>
            <button
              onClick={goToNext}
              className="p-3 rounded-full bg-white/80 hover:bg-white shadow-lg hover:shadow-slate-200/50 transition-all duration-300 border border-slate-100/50"
            >
              <ChevronRight className="w-5 h-5 text-slate-600" />
            </button>
          </div>
        </div>
      </div>
    </section>
  );
};

export default TestimonialsSection;
