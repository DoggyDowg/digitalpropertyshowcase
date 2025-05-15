'use client';

import { useEffect } from 'react';

// Define the window interface to avoid TypeScript errors
declare global {
  interface Window {
    toggleMode: () => void;
    toggleHeader: () => void;
  }
}

export default function LandingPage() {
  // Use effect to load and initialize JavaScript after component mounts
  useEffect(() => {
    // Define any JS functions needed by the landing page
    window.toggleMode = function() {
      document.documentElement.classList.toggle('tw-dark');
      const icon = document.getElementById('toggle-mode-icon');
      if (icon) {
        if (document.documentElement.classList.contains('tw-dark')) {
          icon.className = 'bi bi-sun';
        } else {
          icon.className = 'bi bi-moon';
        }
      }
    };

    window.toggleHeader = function() {
      const headerItems = document.getElementById('collapsed-header-items');
      const btn = document.getElementById('collapse-btn');
      
      if (headerItems) {
        if (headerItems.classList.contains('show')) {
          headerItems.classList.remove('show');
          if (btn) btn.className = 'bi bi-list tw-absolute tw-right-3 tw-top-3 tw-z-50 tw-text-3xl tw-text-gray-500 lg:tw-hidden';
        } else {
          headerItems.classList.add('show');
          if (btn) btn.className = 'bi bi-x tw-absolute tw-right-3 tw-top-3 tw-z-50 tw-text-3xl tw-text-gray-500 lg:tw-hidden';
        }
      }
    };

    // Load any additional scripts from index.js if needed
    const script = document.createElement('script');
    script.src = '/js/index.js';
    script.async = true;
    document.body.appendChild(script);

    return () => {
      // Clean up script when component unmounts
      if (document.body.contains(script)) {
        document.body.removeChild(script);
      }
    };
  }, []);

  return (
    <div
      className="tw-flex tw-min-h-[100vh] tw-flex-col tw-bg-[#fcfcfc] 
          tw-text-black dark:tw-bg-black dark:tw-text-white"
    >
      <header
        className="lg:tw-px-4 tw-max-w-[100vw] tw-max-w-lg:tw-mr-auto max-lg:tw-top-0 tw-fixed tw-top-4 lg:tw-left-1/2 lg:tw--translate-x-1/2 tw-z-20 tw-flex tw-h-[60px] tw-w-full 
                  tw-text-gray-700 tw-bg-white dark:tw-text-gray-200 dark:tw-bg-[#17181b] tw-px-[3%] tw-rounded-md lg:tw-max-w-5xl tw-shadow-md dark:tw-shadow-gray-700
                  lg:tw-justify-around lg:!tw-backdrop-blur-lg lg:tw-opacity-[0.99]"
      >
        <a className="tw-flex tw-p-[4px] tw-gap-2 tw-place-items-center" href="#">
          <div className="tw-h-[30px] tw-max-w-[100px]">
            <img
              src="/assets/logo/logo.png"
              alt="Digital Property Showcase logo"
              className="tw-object-contain tw-h-full tw-w-full dark:tw-invert"
            />
          </div>
          <span className="tw-uppercase tw-text-base tw-font-medium">Digital Property Showcase</span>
        </a>
        <div
          className="collapsible-header animated-collapse max-lg:tw-shadow-md"
          id="collapsed-header-items"
        >
          <nav
            className="tw-relative tw-flex tw-h-full max-lg:tw-h-max tw-w-max tw-gap-5 tw-text-base max-lg:tw-mt-[30px] max-lg:tw-flex-col 
                              max-lg:tw-gap-5 lg:tw-mx-auto tw-place-items-center"
          >
            <a className="header-links" href="#features"> Features </a>
            <a className="header-links" href="#how-it-works"> How It Works </a>
            <a className="header-links" href="#pricing"> Pricing </a>
            <a className="header-links" href="#contact"> Contact </a>
          </nav>
          <div
            className="lg:tw-mx-4 tw-flex tw-place-items-center tw-gap-[20px] tw-text-base max-md:tw-w-full 
                          max-md:tw-flex-col max-md:tw-place-content-center"
          >
            <button 
              type="button" 
              onClick={() => window.toggleMode && window.toggleMode()} 
              className="header-links tw-text-gray-600 dark:tw-text-gray-300" 
              title="toggle-theme" 
              id="theme-toggle"
            > 
              <i className="bi bi-sun" id="toggle-mode-icon"></i>
            </button>
            <a
              href="/admin"
              aria-label="Log in to your account"
              className="btn tw-flex tw-gap-3 tw-px-3 tw-py-2 tw-transition-transform 
                                  tw-duration-[0.3s] hover:tw-translate-x-2"
            >
              <span>Log In</span>
              <i className="bi bi-arrow-right"></i>
            </a>
          </div>
        </div>
        <button
          className="bi bi-list tw-absolute tw-right-3 tw-top-3 tw-z-50 tw-text-3xl tw-text-gray-500 lg:tw-hidden"
          onClick={() => window.toggleHeader && window.toggleHeader()}
          aria-label="menu"
          id="collapse-btn"
        ></button>
      </header>

      <section
        className="hero-section tw-relative tw-mt-20 tw-flex tw-min-h-[100vh] tw-w-full tw-max-w-[100vw] tw-flex-col tw-overflow-hidden max-lg:tw-mt-[100px]"
        id="hero-section"
      >
        <div className="tw-mx-auto tw-flex tw-w-full tw-max-w-[1200px] tw-flex-col tw-px-[5%] tw-py-16">
          <div className="tw-flex tw-w-full tw-flex-col tw-justify-between lg:tw-flex-row">
            <div className="tw-w-full lg:tw-w-1/2">
              <h1 className="tw-text-5xl tw-font-bold tw-leading-tight lg:tw-text-6xl">
                Beautiful Online 
                <span className="tw-text-blue-600">Property Showcases</span>
                Made Easy
              </h1>
              <p className="tw-mt-5 tw-max-w-[600px] tw-text-lg tw-text-gray-600 dark:tw-text-gray-400">
                Digital Property Showcase helps real estate professionals create stunning online property showcases with custom domains in minutes.
              </p>
              <div className="tw-mt-10 tw-flex tw-flex-wrap tw-gap-4">
                <a
                  href="/admin"
                  className="btn tw-bg-blue-600 tw-text-white tw-px-8 tw-py-3 tw-rounded-md tw-font-medium tw-transition-transform hover:tw-translate-y-[-4px]"
                >
                  Start Creating
                </a>
                <a
                  href="#features"
                  className="btn-outline tw-border-2 tw-border-gray-300 dark:tw-border-gray-700 tw-px-8 tw-py-3 tw-rounded-md tw-font-medium tw-transition-transform hover:tw-translate-y-[-4px]"
                >
                  Learn More
                </a>
              </div>
            </div>
            <div className="tw-mt-10 tw-flex tw-w-full tw-justify-center lg:tw-mt-0 lg:tw-w-1/2">
              <div className="tw-relative tw-h-[400px] tw-w-full tw-max-w-[600px]">
                <img
                  src="/assets/images/hero-image.jpg"
                  alt="Digital Property Showcase demo"
                  className="tw-h-full tw-w-full tw-rounded-lg tw-object-cover tw-shadow-xl"
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* More sections would go here */}

      <footer className="tw-bg-gray-900 tw-text-white tw-py-12">
        <div className="tw-mx-auto tw-max-w-[1200px] tw-px-[5%]">
          <div className="tw-flex tw-flex-col md:tw-flex-row tw-justify-between tw-gap-8">
            <div className="tw-mb-6 md:tw-mb-0">
              <h2 className="tw-text-2xl tw-font-bold tw-mb-4">Digital Property Showcase</h2>
              <p className="tw-text-gray-400 tw-max-w-[400px]">Creating beautiful online property showcases with custom domains for real estate professionals.</p>
            </div>
            <div className="tw-grid tw-grid-cols-2 md:tw-grid-cols-3 tw-gap-8">
              <div>
                <h3 className="tw-text-lg tw-font-semibold tw-mb-3">Product</h3>
                <ul className="tw-space-y-2">
                  <li><a href="#features" className="tw-text-gray-400 hover:tw-text-white tw-transition-colors">Features</a></li>
                  <li><a href="#how-it-works" className="tw-text-gray-400 hover:tw-text-white tw-transition-colors">How It Works</a></li>
                  <li><a href="#pricing" className="tw-text-gray-400 hover:tw-text-white tw-transition-colors">Pricing</a></li>
                </ul>
              </div>
              <div>
                <h3 className="tw-text-lg tw-font-semibold tw-mb-3">Company</h3>
                <ul className="tw-space-y-2">
                  <li><a href="#about" className="tw-text-gray-400 hover:tw-text-white tw-transition-colors">About Us</a></li>
                  <li><a href="#contact" className="tw-text-gray-400 hover:tw-text-white tw-transition-colors">Contact</a></li>
                </ul>
              </div>
              <div>
                <h3 className="tw-text-lg tw-font-semibold tw-mb-3">Legal</h3>
                <ul className="tw-space-y-2">
                  <li><a href="#" className="tw-text-gray-400 hover:tw-text-white tw-transition-colors">Privacy Policy</a></li>
                  <li><a href="#" className="tw-text-gray-400 hover:tw-text-white tw-transition-colors">Terms of Service</a></li>
                </ul>
              </div>
            </div>
          </div>
          <div className="tw-border-t tw-border-gray-800 tw-mt-8 tw-pt-8 tw-text-center">
            <p className="tw-text-gray-500">© {new Date().getFullYear()} Digital Property Showcase. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}