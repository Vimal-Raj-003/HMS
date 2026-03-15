import HeroSection from './components/HeroSection';
import MetricsSection from './components/MetricsSection';
import SpecialtiesSection from './components/SpecialtiesSection';
import DoctorsSection from './components/DoctorsSection';
import TestimonialsSection from './components/TestimonialsSection';
import TrustSection from './components/TrustSection';
import FAQSection from './components/FAQSection';
import FooterSection from './components/FooterSection';

const LandingPage = () => {
  return (
    <div className="min-h-screen bg-white">
      {/* Hero Section - Main landing area with CTA */}
      <HeroSection />
      
      {/* Platform Metrics - Key statistics */}
      <MetricsSection />
      
      {/* Specialties Section - Medical departments */}
      <SpecialtiesSection />
      
      {/* Doctors Section - Expert doctors grid */}
      <DoctorsSection />
      
      {/* Testimonials Section - Patient reviews carousel */}
      <TestimonialsSection />
      
      {/* Trust Section - Credibility metrics */}
      <TrustSection />
      
      {/* FAQ Section - Common questions */}
      <FAQSection />
      
      {/* Footer Section - Navigation and contact */}
      <FooterSection />
    </div>
  );
};

export default LandingPage;
