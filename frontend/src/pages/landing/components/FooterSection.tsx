import { Link } from 'react-router-dom';
import { 
  Heart, 
  Phone, 
  Mail, 
  MapPin, 
  Facebook, 
  Twitter, 
  Linkedin, 
  Instagram,
  ArrowRight,
  Send
} from 'lucide-react';

const FooterSection = () => {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-slate-900 text-white relative overflow-hidden">
      {/* Futuristic Background Pattern */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        {/* Gradient orbs */}
        <div className="absolute -top-40 -left-40 w-80 h-80 bg-blue-500/10 rounded-full blur-3xl"></div>
        <div className="absolute -bottom-40 -right-40 w-80 h-80 bg-teal-500/10 rounded-full blur-3xl"></div>
        
        {/* Dot grid pattern */}
        <div className="absolute inset-0 bg-[radial-gradient(rgba(255,255,255,0.03)_1px,transparent_1px)] bg-[size:24px_24px]"></div>
        
        {/* Subtle wave pattern at top */}
        <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-blue-500/30 to-transparent"></div>
      </div>

      {/* Main Footer Content */}
      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10 lg:gap-12">
          {/* Brand Column */}
          <div className="lg:col-span-1">
            <div className="flex items-center gap-3 mb-5 group">
              <div className="w-11 h-11 bg-gradient-to-br from-blue-600 to-teal-500 rounded-xl flex items-center justify-center shadow-lg shadow-blue-500/20 group-hover:shadow-blue-500/40 group-hover:scale-105 transition-all duration-300">
                <Heart className="w-6 h-6 text-white" />
              </div>
              <div className="flex flex-col">
                <span className="text-2xl font-bold tracking-tight">HMS</span>
                <span className="text-[10px] text-slate-400 -mt-1 tracking-wider">HEALTHCARE</span>
              </div>
            </div>
            <p className="text-slate-400 mb-6 leading-relaxed text-[15px]">
              A modern Hospital Management System designed to streamline healthcare delivery, 
              enhance patient experience, and empower medical professionals.
            </p>
            <div className="flex gap-3">
              <a
                href="#"
                className="w-10 h-10 bg-slate-800/50 rounded-lg flex items-center justify-center text-slate-400 hover:bg-blue-600 hover:text-white transition-all duration-300 hover:-translate-y-1 hover:shadow-lg hover:shadow-blue-500/20"
                aria-label="Facebook"
              >
                <Facebook className="w-5 h-5" />
              </a>
              <a
                href="#"
                className="w-10 h-10 bg-slate-800/50 rounded-lg flex items-center justify-center text-slate-400 hover:bg-blue-400 hover:text-white transition-all duration-300 hover:-translate-y-1 hover:shadow-lg hover:shadow-blue-400/20"
                aria-label="Twitter"
              >
                <Twitter className="w-5 h-5" />
              </a>
              <a
                href="#"
                className="w-10 h-10 bg-slate-800/50 rounded-lg flex items-center justify-center text-slate-400 hover:bg-blue-700 hover:text-white transition-all duration-300 hover:-translate-y-1 hover:shadow-lg hover:shadow-blue-700/20"
                aria-label="LinkedIn"
              >
                <Linkedin className="w-5 h-5" />
              </a>
              <a
                href="#"
                className="w-10 h-10 bg-slate-800/50 rounded-lg flex items-center justify-center text-slate-400 hover:bg-gradient-to-br hover:from-purple-500 hover:to-pink-500 hover:text-white transition-all duration-300 hover:-translate-y-1 hover:shadow-lg hover:shadow-pink-500/20"
                aria-label="Instagram"
              >
                <Instagram className="w-5 h-5" />
              </a>
            </div>
          </div>

          {/* Quick Links Column */}
          <div>
            <h3 className="text-lg font-semibold mb-5 text-white">Quick Links</h3>
            <ul className="space-y-3">
              <li>
                <Link
                  to="/patient-login"
                  className="text-slate-400 hover:text-teal-400 transition-all duration-300 flex items-center gap-2 group text-[15px]"
                >
                  <ArrowRight className="w-4 h-4 opacity-0 -ml-6 group-hover:opacity-100 group-hover:ml-0 transition-all duration-300" />
                  Book Appointment
                </Link>
              </li>
              <li>
                <Link
                  to="/patient-login"
                  className="text-slate-400 hover:text-teal-400 transition-all duration-300 flex items-center gap-2 group text-[15px]"
                >
                  <ArrowRight className="w-4 h-4 opacity-0 -ml-6 group-hover:opacity-100 group-hover:ml-0 transition-all duration-300" />
                  Patient Portal
                </Link>
              </li>
              <li>
                <Link
                  to="/login"
                  className="text-slate-400 hover:text-teal-400 transition-all duration-300 flex items-center gap-2 group text-[15px]"
                >
                  <ArrowRight className="w-4 h-4 opacity-0 -ml-6 group-hover:opacity-100 group-hover:ml-0 transition-all duration-300" />
                  Staff Login
                </Link>
              </li>
              <li>
                <Link
                  to="/login"
                  className="text-slate-400 hover:text-teal-400 transition-all duration-300 flex items-center gap-2 group text-[15px]"
                >
                  <ArrowRight className="w-4 h-4 opacity-0 -ml-6 group-hover:opacity-100 group-hover:ml-0 transition-all duration-300" />
                  Admin Portal
                </Link>
              </li>
              <li>
                <Link
                  to="/login"
                  className="text-slate-400 hover:text-teal-400 transition-all duration-300 flex items-center gap-2 group text-[15px]"
                >
                  <ArrowRight className="w-4 h-4 opacity-0 -ml-6 group-hover:opacity-100 group-hover:ml-0 transition-all duration-300" />
                  Doctor Portal
                </Link>
              </li>
              <li>
                <a
                  href="#specialties"
                  className="text-slate-400 hover:text-teal-400 transition-all duration-300 flex items-center gap-2 group text-[15px]"
                >
                  <ArrowRight className="w-4 h-4 opacity-0 -ml-6 group-hover:opacity-100 group-hover:ml-0 transition-all duration-300" />
                  Our Specialties
                </a>
              </li>
              <li>
                <a
                  href="#faq"
                  className="text-slate-400 hover:text-teal-400 transition-all duration-300 flex items-center gap-2 group text-[15px]"
                >
                  <ArrowRight className="w-4 h-4 opacity-0 -ml-6 group-hover:opacity-100 group-hover:ml-0 transition-all duration-300" />
                  FAQ
                </a>
              </li>
            </ul>
          </div>

          {/* Services Column */}
          <div>
            <h3 className="text-lg font-semibold mb-5 text-white">Our Services</h3>
            <ul className="space-y-3">
              <li>
                <a href="#" className="text-slate-400 hover:text-teal-400 transition-all duration-300 text-[15px] hover:pl-1">
                  Emergency Care
                </a>
              </li>
              <li>
                <a href="#" className="text-slate-400 hover:text-teal-400 transition-all duration-300 text-[15px] hover:pl-1">
                  Laboratory Services
                </a>
              </li>
              <li>
                <a href="#" className="text-slate-400 hover:text-teal-400 transition-all duration-300 text-[15px] hover:pl-1">
                  Pharmacy Services
                </a>
              </li>
              <li>
                <a href="#" className="text-slate-400 hover:text-teal-400 transition-all duration-300 text-[15px] hover:pl-1">
                  Telemedicine
                </a>
              </li>
              <li>
                <a href="#" className="text-slate-400 hover:text-teal-400 transition-all duration-300 text-[15px] hover:pl-1">
                  Health Checkups
                </a>
              </li>
              <li>
                <a href="#" className="text-slate-400 hover:text-teal-400 transition-all duration-300 text-[15px] hover:pl-1">
                  Insurance Claims
                </a>
              </li>
            </ul>
          </div>

          {/* Contact Column */}
          <div>
            <h3 className="text-lg font-semibold mb-5 text-white">Contact Us</h3>
            <ul className="space-y-4">
              <li className="flex items-start gap-3 group">
                <div className="w-10 h-10 bg-slate-800/50 rounded-lg flex items-center justify-center flex-shrink-0 group-hover:bg-teal-500/20 transition-colors duration-300">
                  <Phone className="w-5 h-5 text-teal-400" />
                </div>
                <div>
                  <p className="text-slate-400 text-sm">Emergency</p>
                  <p className="text-white font-medium group-hover:text-teal-400 transition-colors duration-300">+1 (800) 123-4567</p>
                </div>
              </li>
              <li className="flex items-start gap-3 group">
                <div className="w-10 h-10 bg-slate-800/50 rounded-lg flex items-center justify-center flex-shrink-0 group-hover:bg-teal-500/20 transition-colors duration-300">
                  <Mail className="w-5 h-5 text-teal-400" />
                </div>
                <div>
                  <p className="text-slate-400 text-sm">Email Support</p>
                  <p className="text-white font-medium group-hover:text-teal-400 transition-colors duration-300">support@hms.com</p>
                </div>
              </li>
              <li className="flex items-start gap-3 group">
                <div className="w-10 h-10 bg-slate-800/50 rounded-lg flex items-center justify-center flex-shrink-0 group-hover:bg-teal-500/20 transition-colors duration-300">
                  <MapPin className="w-5 h-5 text-teal-400" />
                </div>
                <div>
                  <p className="text-slate-400 text-sm">Address</p>
                  <p className="text-white font-medium group-hover:text-teal-400 transition-colors duration-300">
                    123 Healthcare Ave,<br />
                    Medical District, MD 12345
                  </p>
                </div>
              </li>
            </ul>
          </div>
        </div>
      </div>

      {/* Newsletter Section */}
      <div className="relative border-t border-slate-800/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div>
              <h4 className="text-lg font-semibold mb-1">Subscribe to our newsletter</h4>
              <p className="text-slate-400 text-sm">Get health tips and updates delivered to your inbox</p>
            </div>
            <div className="flex gap-3 w-full md:w-auto">
              <input
                type="email"
                placeholder="Enter your email"
                className="flex-1 md:w-64 px-4 py-3 bg-slate-800/50 border border-slate-700/50 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20 transition-all duration-300"
              />
              <button className="px-6 py-3 bg-gradient-to-r from-blue-600 to-teal-500 text-white rounded-xl font-medium hover:from-blue-700 hover:to-teal-600 transition-all duration-300 shadow-lg shadow-blue-500/20 hover:shadow-xl hover:shadow-blue-500/30 hover:-translate-y-0.5 flex items-center gap-2">
                Subscribe
                <Send className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Bar */}
      <div className="relative border-t border-slate-800/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <p className="text-slate-500 text-sm">
              © {currentYear} HMS - Hospital Management System. All rights reserved.
            </p>
            <div className="flex items-center gap-6">
              <a href="#" className="text-slate-500 hover:text-slate-300 text-sm transition-colors duration-300 hover:underline underline-offset-4">
                Privacy Policy
              </a>
              <a href="#" className="text-slate-500 hover:text-slate-300 text-sm transition-colors duration-300 hover:underline underline-offset-4">
                Terms of Service
              </a>
              <a href="#" className="text-slate-500 hover:text-slate-300 text-sm transition-colors duration-300 hover:underline underline-offset-4">
                Cookie Policy
              </a>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default FooterSection;
