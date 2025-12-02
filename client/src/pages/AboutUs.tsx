import React, { useEffect } from 'react';
import LandingHeader from '../components/LandingHeader';
import Footer from '../components/Footer';

const AboutUs: React.FC = () => {
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
              <h1 className="text-3xl font-semibold text-gray-900">About Us</h1>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8 space-y-6">
              <section>
                <h2 className="text-2xl font-semibold text-gray-900 mb-4">Our Mission</h2>
                <p className="text-gray-700 leading-relaxed">
                  Campus Market is dedicated to creating a safe, convenient, and sustainable marketplace 
                  for students to buy and sell items within their campus community. We believe in fostering 
                  connections, reducing waste, and making student life more affordable.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-semibold text-gray-900 mb-4">Who We Are</h2>
                <p className="text-gray-700 leading-relaxed">
                  We are a team of students and developers committed to building a platform that serves 
                  the unique needs of campus communities. Our platform is designed with students in mind, 
                  offering features that make buying and selling simple, secure, and efficient.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-semibold text-gray-900 mb-4">What We Offer</h2>
                <ul className="list-disc list-inside space-y-2 text-gray-700">
                  <li>Verified student accounts for a trusted marketplace</li>
                  <li>Easy-to-use listing creation with photo uploads</li>
                  <li>Secure messaging system for buyer-seller communication</li>
                  <li>Category-based organization for easy browsing</li>
                  <li>Saved listings feature to keep track of items you're interested in</li>
                </ul>
              </section>

              <section>
                <h2 className="text-2xl font-semibold text-gray-900 mb-4">Contact Us</h2>
                <p className="text-gray-700 leading-relaxed">
                  If you have any questions, suggestions, or concerns, please don't hesitate to reach out. 
                  We're here to help make your campus marketplace experience the best it can be.
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

export default AboutUs;

