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
  ArrowRight 
} from 'lucide-react';

const FooterSection = () => {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-slate-900 text-white">
      {/* Main Footer Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10 lg:gap-12">
          {/* Brand Column */}
          <div className="lg:col-span-1">
            <div className="flex items-center gap-3 mb-5">
              <div className="w-11 h-11 bg-gradient-to-br from-blue-600 to-teal-500 rounded-xl flex items-center justify-center shadow-lg shadow-blue-500/20">
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
                className="w-10 h-10 bg-slate-800 rounded-lg flex items-center justify-center text-slate-400 hover:bg-blue-600 hover:text-white transition-all duration-300"
              >
                <Facebook className="w-5 h-5" />
              </a>
              <a
                href="#"
                className="w-10 h-10 bg-slate-800 rounded-lg flex items-center justify-center text-slate-400 hover:bg-blue-600 hover:text-white transition-all duration-300"
              >
                <Twitter className="w-5 h-5" />
              </a>
              <a
                href="#"
                className="w-10 h-10 bg-slate-800 rounded-lg flex items-center justify-center text-slate-400 hover:bg-blue-600 hover:text-white transition-all duration-300"
              >
                <Linkedin className="w-5 h-5" />
              </a>
              <a
                href="#"
                className="w-10 h-10 bg-slate-800 rounded-lg flex items-center justify-center text-slate-400 hover:bg-blue-600 hover:text-white transition-all duration-300"
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
                  className="text-slate-400 hover:text-teal-400 transition-colors flex items-center gap-2 group text-[15px]"
                >
                  <ArrowRight className="w-4 h-4 opacity-0 -ml-6 group-hover:opacity-100 group-hover:ml-0 transition-all duration-300" />
                  Book Appointment
                </Link>
              </li>
              <li>
                <Link
                  to="/patient-login"
                  className="text-slate-400 hover:text-teal-400 transition-colors flex items-center gap-2 group text-[15px]"
                >
                  <ArrowRight className="w-4 h-4 opacity-0 -ml-6 group-hover:opacity-100 group-hover:ml-0 transition-all duration-300" />
                  Patient Portal
                </Link>
              </li>
              <li>
                <Link
                  to="/login"
                  className="text-slate-400 hover:text-teal-400 transition-colors flex items-center gap-2 group text-[15px]"
                >
                  <ArrowRight className="w-4 h-4 opacity-0 -ml-6 group-hover:opacity-100 group-hover:ml-0 transition-all duration-300" />
                  Staff Login
                </Link>
              </li>
              <li>
                <Link
                  to="/login"
                  className="text-slate-400 hover:text-teal-400 transition-colors flex items-center gap-2 group text-[15px]"
                >
                  <ArrowRight className="w-4 h-4 opacity-0 -ml-6 group-hover:opacity-100 group-hover:ml-0 transition-all duration-300" />
                  Admin Portal
                </Link>
              </li>
              <li>
                <Link
                  to="/login"
                  className="text-slate-400 hover:text-teal-400 transition-colors flex items-center gap-2 group text-[15px]"
                >
                  <ArrowRight className="w-4 h-4 opacity-0 -ml-6 group-hover:opacity-100 group-hover:ml-0 transition-all duration-300" />
                  Doctor Portal
                </Link>
              </li>
              <li>
                <a
                  href="#specialties"
                  className="text-slate-400 hover:text-teal-400 transition-colors flex items-center gap-2 group text-[15px]"
                >
                  <ArrowRight className="w-4 h-4 opacity-0 -ml-6 group-hover:opacity-100 group-hover:ml-0 transition-all duration-300" />
                  Our Specialties
                </a>
              </li>
              <li>
                <a
                  href="#faq"
                  className="text-slate-400 hover:text-teal-400 transition-colors flex items-center gap-2 group text-[15px]"
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
                <a href="#" className="text-slate-400 hover:text-teal-400 transition-colors duration-300 text-[15px]">
                  Emergency Care
                </a>
              </li>
              <li>
                <a href="#" className="text-slate-400 hover:text-teal-400 transition-colors duration-300 text-[15px]">
                  Laboratory Services
                </a>
              </li>
              <li>
                <a href="#" className="text-slate-400 hover:text-teal-400 transition-colors duration-300 text-[15px]">
                  Pharmacy Services
                </a>
              </li>
              <li>
                <a href="#" className="text-slate-400 hover:text-teal-400 transition-colors duration-300 text-[15px]">
                  Telemedicine
                </a>
              </li>
              <li>
                <a href="#" className="text-slate-400 hover:text-teal-400 transition-colors duration-300 text-[15px]">
                  Health Checkups
                </a>
              </li>
              <li>
                <a href="#" className="text-slate-400 hover:text-teal-400 transition-colors duration-300 text-[15px]">
                  Insurance Claims
                </a>
              </li>
            </ul>
          </div>

          {/* Contact Column */}
          <div>
            <h3 className="text-lg font-semibold mb-5 text-white">Contact Us</h3>
            <ul className="space-y-4">
              <li className="flex items-start gap-3">
                <div className="w-10 h-10 bg-slate-800 rounded-lg flex items-center justify-center flex-shrink-0">
                  <Phone className="w-5 h-5 text-teal-400" />
                </div>
                <div>
                  <p className="text-slate-400 text-sm">Emergency</p>
                  <p className="text-white font-medium">+1 (800) 123-4567</p>
                </div>
              </li>
              <li className="flex items-start gap-3">
                <div className="w-10 h-10 bg-slate-800 rounded-lg flex items-center justify-center flex-shrink-0">
                  <Mail className="w-5 h-5 text-teal-400" />
                </div>
                <div>
                  <p className="text-slate-400 text-sm">Email Support</p>
                  <p className="text-white font-medium">support@hms.com</p>
                </div>
              </li>
              <li className="flex items-start gap-3">
                <div className="w-10 h-10 bg-slate-800 rounded-lg flex items-center justify-center flex-shrink-0">
                  <MapPin className="w-5 h-5 text-teal-400" />
                </div>
                <div>
                  <p className="text-slate-400 text-sm">Address</p>
                  <p className="text-white font-medium">
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
      <div className="border-t border-slate-800">
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
                className="flex-1 md:w-64 px-4 py-3 bg-slate-800 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 transition-colors duration-300"
              />
              <button className="px-6 py-3 bg-gradient-to-r from-blue-600 to-teal-500 text-white rounded-xl font-medium hover:from-blue-700 hover:to-teal-600 transition-all duration-300 shadow-lg shadow-blue-500/20">
                Subscribe
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Bar */}
      <div className="border-t border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <p className="text-slate-500 text-sm">
              © {currentYear} HMS - Hospital Management System. All rights reserved.
            </p>
            <div className="flex items-center gap-6">
              <a href="#" className="text-slate-500 hover:text-slate-300 text-sm transition-colors duration-300">
                Privacy Policy
              </a>
              <a href="#" className="text-slate-500 hover:text-slate-300 text-sm transition-colors duration-300">
                Terms of Service
              </a>
              <a href="#" className="text-slate-500 hover:text-slate-300 text-sm transition-colors duration-300">
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
