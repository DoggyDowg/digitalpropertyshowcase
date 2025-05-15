import React from 'react';

const HeroSection: React.FC = () => {
  return (
    <section className="flex flex-col items-center justify-center h-screen bg-blue-600 text-white">
      <h1 className="text-5xl font-bold mb-4">Welcome to Digital Property Showcase</h1>
      <p className="text-xl mb-8">Discover the easiest way to showcase your properties online.</p>
      <button className="px-6 py-3 bg-white text-blue-600 font-semibold rounded-lg shadow-md hover:bg-gray-100">
        Learn More
      </button>
    </section>
  );
};

export default HeroSection; 