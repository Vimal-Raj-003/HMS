import { useState } from 'react';
import { ChevronDown, HelpCircle } from 'lucide-react';

const faqs = [
  {
    question: 'What payment methods do you accept?',
    answer: 'We accept all major credit cards (Visa, MasterCard, American Express), debit cards, UPI payments, net banking, and cash payments at the facility. For insured patients, we have direct billing arrangements with most major insurance providers. Our billing team can help you understand your coverage and estimate out-of-pocket costs before your visit.',
  },
  {
    question: 'How is my medical data protected?',
    answer: 'Your medical data is protected using industry-leading security measures including 256-bit SSL encryption, HIPAA-compliant data storage, and strict access controls. We follow all regulatory requirements for healthcare data protection and regularly undergo security audits. Your information is never shared with third parties without your explicit consent, and you have full control over who can access your records.',
  },
  {
    question: 'Can I reschedule or cancel my appointment?',
    answer: 'Yes, you can easily reschedule or cancel your appointment through our patient portal or mobile app up to 24 hours before your scheduled time without any charges. For cancellations within 24 hours, a nominal fee may apply. Our flexible scheduling system allows you to choose a new time slot that works best for you from available appointments.',
  },
  {
    question: 'How do I access my medical records and test results?',
    answer: 'You can access your complete medical records, including lab results, prescriptions, and visit summaries, through our secure patient portal. Simply log in to your account, navigate to the "Medical Records" section, and you\'ll find all your health information organized chronologically. You can also download or share these records with other healthcare providers as needed.',
  },
  {
    question: 'Do you offer telemedicine consultations?',
    answer: 'Yes, we offer telemedicine consultations for many of our services. You can schedule a video consultation with our doctors from the comfort of your home. During the appointment, you can discuss your symptoms, receive diagnoses, get prescriptions, and follow up on ongoing treatments. Telemedicine is available for both new and existing patients.',
  },
  {
    question: 'What should I bring to my first appointment?',
    answer: 'For your first appointment, please bring a valid photo ID, insurance card (if applicable), list of current medications, any relevant medical records or test results from other facilities, and emergency contact information. If you\'re seeing a specialist, a referral from your primary care physician may be required. Arriving 15 minutes early helps complete necessary paperwork.',
  },
  {
    question: 'How long is the average wait time?',
    answer: 'Our average wait time is just 7 minutes, one of the lowest in the region. We use an intelligent queue management system that optimizes appointment scheduling and keeps patients informed of their expected wait time via SMS and app notifications. You can also join a virtual queue and wait from anywhere until it\'s your turn.',
  },
  {
    question: 'Can I choose my preferred doctor?',
    answer: 'Absolutely! You can browse our complete list of doctors, view their profiles, qualifications, specialties, and patient reviews, and choose the one that best fits your needs. Our online booking system shows real-time availability, making it easy to schedule with your preferred healthcare provider. You can also request the same doctor for follow-up visits.',
  },
];

const FAQSection = () => {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  const toggleFAQ = (index: number) => {
    setOpenIndex(openIndex === index ? null : index);
  };

  return (
    <section id="faq" className="py-20 lg:py-28 relative">
      {/* Section background tint — soft indigo-to-blue fade */}
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-indigo-50/30 to-blue-50/20 pointer-events-none" />
      <div className="relative max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-blue-50/80 backdrop-blur-sm rounded-full mb-6 border border-blue-100/50">
            <HelpCircle className="w-4 h-4 text-blue-600" />
            <span className="text-sm font-semibold text-blue-700">FAQ</span>
          </div>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-slate-900 mb-4 tracking-tight">
            Frequently Asked <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-500">Questions</span>
          </h2>
          <p className="text-lg text-slate-600 max-w-2xl mx-auto leading-relaxed">
            Find answers to common questions about our services, appointments, and patient care
          </p>
        </div>

        {/* FAQ Accordion */}
        <div className="space-y-4">
          {faqs.map((faq, index) => (
            <div
              key={index}
              className={`bg-white/90 backdrop-blur-sm rounded-2xl border transition-all duration-300 overflow-hidden ${
                openIndex === index
                  ? 'border-blue-200 shadow-xl shadow-blue-500/8'
                  : 'border-slate-200/60 hover:border-slate-300/60 hover:shadow-lg'
              }`}
            >
              <button
                onClick={() => toggleFAQ(index)}
                className="w-full flex items-center justify-between p-5 md:p-6 text-left"
              >
                <div className="flex items-start gap-4">
                  <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 mt-0.5 transition-colors duration-300 ${
                    openIndex === index ? 'bg-blue-100' : 'bg-slate-50'
                  }`}>
                    <HelpCircle className={`w-5 h-5 transition-colors duration-300 ${
                      openIndex === index ? 'text-blue-600' : 'text-slate-400'
                    }`} />
                  </div>
                  <h3 className={`text-base md:text-lg font-semibold transition-colors duration-300 ${
                    openIndex === index ? 'text-blue-700' : 'text-slate-900'
                  }`}>
                    {faq.question}
                  </h3>
                </div>
                <ChevronDown
                  className={`w-5 h-5 flex-shrink-0 ml-4 transition-transform duration-300 ${
                    openIndex === index
                      ? 'rotate-180 text-blue-600'
                      : 'text-slate-400'
                  }`}
                />
              </button>
              
              <div
                className={`overflow-hidden transition-all duration-300 ${
                  openIndex === index ? 'max-h-96' : 'max-h-0'
                }`}
              >
                <div className="px-5 md:px-6 pb-5 md:pb-6 pl-[4.25rem] md:pl-[4.5rem]">
                  <p className="text-slate-600 leading-relaxed">
                    {faq.answer}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Contact CTA */}
        <div className="mt-12 lg:mt-16 text-center">
          <p className="text-slate-600 mb-6 text-lg">
            Still have questions? We're here to help.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <a
              href="tel:+1234567890"
              className="inline-flex items-center justify-center gap-2 px-6 py-3.5 bg-white/90 backdrop-blur-sm text-slate-700 rounded-xl font-semibold border-2 border-slate-200/60 hover:border-blue-300 hover:text-blue-600 transition-all duration-300 shadow-sm hover:shadow-lg"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
              </svg>
              Call Us
            </a>
            <a
              href="mailto:support@hms.com"
              className="inline-flex items-center justify-center gap-2 px-6 py-3.5 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-xl font-semibold hover:from-blue-700 hover:to-blue-800 transition-all duration-300 shadow-lg shadow-blue-500/20 hover:shadow-xl hover:shadow-blue-500/30"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
              Email Support
            </a>
          </div>
        </div>
      </div>
    </section>
  );
};

export default FAQSection;
