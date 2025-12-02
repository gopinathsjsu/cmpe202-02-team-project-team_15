import React, { useEffect } from 'react';
import LandingHeader from '../components/LandingHeader';
import Footer from '../components/Footer';

const TermsOfService: React.FC = () => {
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <LandingHeader />
      <div className="flex-1 pt-24 md:pt-32">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="mt-8">
            <div className="mb-6">
              <h1 className="text-3xl font-semibold text-gray-900">Terms of Service</h1>
              <p className="text-gray-600 mt-2">Last updated: {new Date().toLocaleDateString()}</p>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8 space-y-6">
              <section>
                <h2 className="text-2xl font-semibold text-gray-900 mb-4">1. Acceptance of Terms</h2>
                <p className="text-gray-700 leading-relaxed">
                  By accessing and using Campus Market, you accept and agree to be bound by the terms 
                  and provision of this agreement. If you do not agree to abide by the above, please 
                  do not use this service.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-semibold text-gray-900 mb-4">2. User Accounts</h2>
                <p className="text-gray-700 leading-relaxed mb-3">
                  To use certain features of Campus Market, you must register for an account. You agree to:
                </p>
                <ul className="list-disc list-inside space-y-2 text-gray-700 ml-4">
                  <li>Provide accurate, current, and complete information during registration</li>
                  <li>Maintain and update your information to keep it accurate</li>
                  <li>Maintain the security of your password and identification</li>
                  <li>Accept all responsibility for activities that occur under your account</li>
                  <li>Notify us immediately of any unauthorized use of your account</li>
                </ul>
              </section>

              <section>
                <h2 className="text-2xl font-semibold text-gray-900 mb-4">3. User Conduct</h2>
                <p className="text-gray-700 leading-relaxed mb-3">
                  You agree not to use Campus Market to:
                </p>
                <ul className="list-disc list-inside space-y-2 text-gray-700 ml-4">
                  <li>Post false, misleading, or fraudulent information</li>
                  <li>Violate any applicable local, state, national, or international law</li>
                  <li>Infringe upon the rights of others</li>
                  <li>Post content that is illegal, harmful, or offensive</li>
                  <li>Impersonate any person or entity</li>
                  <li>Interfere with or disrupt the service</li>
                </ul>
              </section>

              <section>
                <h2 className="text-2xl font-semibold text-gray-900 mb-4">4. Listings and Transactions</h2>
                <p className="text-gray-700 leading-relaxed">
                  Campus Market is a platform that connects buyers and sellers. We are not involved in 
                  the actual transaction between buyers and sellers. We do not transfer legal ownership 
                  of items from the seller to the buyer. You are responsible for ensuring that your 
                  listings are accurate and that you have the right to sell the items listed.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-semibold text-gray-900 mb-4">5. Payment and Fees</h2>
                <p className="text-gray-700 leading-relaxed">
                  All transactions are conducted directly between buyers and sellers. Campus Market does 
                  not process payments or handle transactions. Buyers and sellers are responsible for 
                  arranging payment and delivery methods. We recommend using secure payment methods and 
                  meeting in safe, public locations.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-semibold text-gray-900 mb-4">6. Intellectual Property</h2>
                <p className="text-gray-700 leading-relaxed">
                  All content on Campus Market, including text, graphics, logos, and software, is the 
                  property of Campus Market or its content suppliers and is protected by copyright and 
                  other intellectual property laws. You may not reproduce, distribute, or create 
                  derivative works from any content without our express written permission.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-semibold text-gray-900 mb-4">7. Limitation of Liability</h2>
                <p className="text-gray-700 leading-relaxed">
                  Campus Market is provided "as is" without warranties of any kind. We are not liable 
                  for any damages arising from your use of the service, including but not limited to 
                  direct, indirect, incidental, or consequential damages.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-semibold text-gray-900 mb-4">8. Termination</h2>
                <p className="text-gray-700 leading-relaxed">
                  We reserve the right to terminate or suspend your account and access to the service 
                  at our sole discretion, without prior notice, for conduct that we believe violates 
                  these Terms of Service or is harmful to other users, us, or third parties.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-semibold text-gray-900 mb-4">9. Changes to Terms</h2>
                <p className="text-gray-700 leading-relaxed">
                  We reserve the right to modify these terms at any time. We will notify users of any 
                  significant changes. Your continued use of the service after changes are posted 
                  constitutes your acceptance of the modified terms.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-semibold text-gray-900 mb-4">10. Contact Information</h2>
                <p className="text-gray-700 leading-relaxed">
                  If you have any questions about these Terms of Service, please contact us through 
                  the platform or via the contact information provided in the About Us page.
                </p>
              </section>
            </div>
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default TermsOfService;

