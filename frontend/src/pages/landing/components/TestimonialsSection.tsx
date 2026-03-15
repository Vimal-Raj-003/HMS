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
    <section className="py-20 lg:py-28 bg-gradient-to-b from-slate-50/50 to-white overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-teal-50 rounded-full mb-6">
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
          <div className="max-w-4xl mx-auto">
            <div className="relative bg-white rounded-3xl shadow-2xl shadow-slate-200/50 p-8 md:p-12 border border-slate-100">
              {/* Quote Icon */}
              <div className="absolute -top-6 left-8 w-14 h-14 bg-gradient-to-br from-blue-600 to-teal-500 rounded-2xl flex items-center justify-center shadow-lg shadow-blue-500/25 rotate-3">
                <Quote className="w-7 h-7 text-white" />
              </div>

              {/* Testimonial Content */}
              <div className="pt-4">
                {/* Stars */}
                <div className="flex gap-1 mb-6">
                  {[...Array(5)].map((_, i) => (
                    <Star
                      key={i}
                      className={`w-5 h-5 ${
                        i < testimonials[currentIndex].rating
                          ? 'text-amber-400 fill-current'
                          : 'text-slate-200'
                      }`}
                    />
                  ))}
                </div>

                {/* Quote Text */}
                <blockquote className="text-xl md:text-2xl text-slate-700 leading-relaxed mb-8 font-medium">
                  "{testimonials[currentIndex].text}"
                </blockquote>

                {/* Author Info */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <img
                      src={testimonials[currentIndex].avatar}
                      alt={testimonials[currentIndex].name}
                      className="w-14 h-14 rounded-full object-cover ring-4 ring-slate-100"
                    />
                    <div>
                      <h4 className="font-bold text-slate-900">
                        {testimonials[currentIndex].name}
                      </h4>
                      <p className="text-sm text-slate-500">
                        {testimonials[currentIndex].role}
                      </p>
                    </div>
                  </div>
                  <span className="text-sm text-slate-400 hidden sm:block">
                    {testimonials[currentIndex].date}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Navigation Arrows */}
          <button
            onClick={goToPrevious}
            className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-4 w-12 h-12 bg-white rounded-full shadow-xl flex items-center justify-center text-slate-600 hover:text-blue-600 hover:shadow-2xl transition-all z-10 hidden md:flex border border-slate-100"
          >
            <ChevronLeft className="w-6 h-6" />
          </button>
          <button
            onClick={goToNext}
            className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-4 w-12 h-12 bg-white rounded-full shadow-xl flex items-center justify-center text-slate-600 hover:text-blue-600 hover:shadow-2xl transition-all z-10 hidden md:flex border border-slate-100"
          >
            <ChevronRight className="w-6 h-6" />
          </button>

          {/* Dots Indicator */}
          <div className="flex justify-center gap-2 mt-8">
            {testimonials.map((_, index) => (
              <button
                key={index}
                onClick={() => goToSlide(index)}
                className={`h-2.5 rounded-full transition-all duration-300 ${
                  index === currentIndex
                    ? 'bg-blue-600 w-8'
                    : 'bg-slate-300 hover:bg-slate-400 w-2.5'
                }`}
              />
            ))}
          </div>
        </div>

        {/* Mobile Navigation */}
        <div className="flex justify-center gap-4 mt-6 md:hidden">
          <button
            onClick={goToPrevious}
            className="w-10 h-10 bg-white rounded-full shadow-lg flex items-center justify-center text-slate-600 border border-slate-100"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <button
            onClick={goToNext}
            className="w-10 h-10 bg-white rounded-full shadow-lg flex items-center justify-center text-slate-600 border border-slate-100"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>
      </div>
    </section>
  );
};

export default TestimonialsSection;
