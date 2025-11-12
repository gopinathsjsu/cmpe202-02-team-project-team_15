import React, { useState, useEffect } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';
import LandingHeader from '../components/LandingHeader';
import Footer from '../components/Footer';

interface FAQItem {
  question: string;
  answer: string;
}

const FAQ: React.FC = () => {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  const faqs: FAQItem[] = [
    {
      question: 'How do I create an account?',
      answer: 'To create an account, click on "Sign Up" in the header or footer. You\'ll need to provide your school email address (.edu domain required), create a password, and provide your first and last name. Once registered, you can start buying and selling on the marketplace.'
    },
    {
      question: 'How do I list an item for sale?',
      answer: 'After logging in, click on "Create New Listing" or navigate to "My Listings" and click the "Create New Listing" button. Fill in the item details including title, description, price, category, and upload photos. Once submitted, your listing will be visible to other students on the marketplace.'
    },
    {
      question: 'How do I contact a seller?',
      answer: 'When viewing a listing, click the "Contact Seller" button. This will open a messaging interface where you can communicate with the seller directly. All messages are private and secure.'
    },
    {
      question: 'How do I save a listing?',
      answer: 'While browsing listings, click the heart icon on any listing card to save it. You can view all your saved listings by clicking "Saved" in the navigation menu.'
    },
    {
      question: 'What payment methods are accepted?',
      answer: 'Campus Market facilitates connections between buyers and sellers, but payment arrangements are made directly between parties. We recommend using secure payment methods and meeting in safe, public locations for transactions.'
    },
    {
      question: 'How do I report a problem?',
      answer: 'If you encounter any issues with a listing or user, you can use the "Report" feature on any listing page. Our admin team reviews all reports and takes appropriate action to maintain a safe marketplace environment.'
    },
    {
      question: 'Can I edit or delete my listing?',
      answer: 'Yes! Go to "My Listings" to view all your active listings. You can edit or delete any of your listings from there. Note that once a listing is marked as "Sold", it cannot be edited.'
    },
    {
      question: 'Is my information secure?',
      answer: 'Yes, we take your privacy seriously. Your personal information is protected and only shared as necessary for marketplace functionality. We use secure authentication and data encryption to protect your account.'
    }
  ];

  const toggleFAQ = (index: number) => {
    setOpenIndex(openIndex === index ? null : index);
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <LandingHeader />
      <div className="flex-1 pt-24 md:pt-32">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="mt-8">
            <div className="mb-6">
              <h1 className="text-3xl font-semibold text-gray-900">Frequently Asked Questions</h1>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-200 divide-y divide-gray-200">
              {faqs.map((faq, index) => (
                <div key={index} className="p-6">
                  <button
                    onClick={() => toggleFAQ(index)}
                    className="w-full flex items-center justify-between text-left"
                  >
                    <h2 className="text-lg font-semibold text-gray-900 pr-4">
                      {faq.question}
                    </h2>
                    {openIndex === index ? (
                      <ChevronUp className="w-5 h-5 text-gray-500 flex-shrink-0" />
                    ) : (
                      <ChevronDown className="w-5 h-5 text-gray-500 flex-shrink-0" />
                    )}
                  </button>
                  {openIndex === index && (
                    <p className="mt-4 text-gray-700 leading-relaxed">
                      {faq.answer}
                    </p>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default FAQ;

