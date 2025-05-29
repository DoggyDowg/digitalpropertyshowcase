// Functions needed for the landing page
// function toggleMode() {
//   document.documentElement.classList.toggle('tw-dark');
//   const icon = document.getElementById('toggle-mode-icon');
//   if (icon) {
//     if (document.documentElement.classList.contains('tw-dark')) {
//       icon.className = 'bi bi-sun';
//     } else {
//       icon.className = 'bi bi-moon';
//     }
//   }
// }

// Global configuration for videos
// const videoConfig = {
//  desktopSrc: "https://res.cloudinary.com/dxljgvhwe/video/upload/v1717021235/dps_promo_wide_z4tsad.mp4",
//  mobileSrc: "https://res.cloudinary.com/dxljgvhwe/video/upload/v1717021235/dps_promo_mobile_1_cs0pkp.mp4",
//  breakpoint: 768 // Mobile breakpoint in pixels
// };

// window.toggleHeader = function toggleHeader() {
//  const headerItems = document.getElementById('collapsed-header-items');
//  const btn = document.getElementById('collapse-btn');
  
//  if (headerItems) {
//    if (headerItems.classList.contains('show')) {
//      headerItems.classList.remove('show');
//      if (btn) btn.className = 'bi bi-list tw-absolute tw-right-3 tw-top-3 tw-z-50 tw-text-3xl tw-text-gray-500 lg:tw-hidden';
//    } else {
//      headerItems.classList.add('show');
//      if (btn) btn.className = 'bi bi-x tw-absolute tw-right-3 tw-top-3 tw-z-50 tw-text-3xl tw-text-gray-500 lg:tw-hidden';
//    }
//  }
// }

// Smoothly animate values
// function smoothLerp(current, target, factor = 0.1) {
//   return current + (target - current) * factor;
// }

// Dashboard 3D animation variables
// let currentRotationX = 60;
// let currentTranslateY = 12;
// let ticking = false;
// let animationFrame = null;

// Dashboard 3D animation on scroll
// Function is currently unused but kept for reference
/* 
function handleScroll() {
  console.log("handleScroll called");
  const dashboard = document.getElementById('dashboard');
  if (dashboard) {
    console.log("Dashboard element found:", dashboard);
    const scrollPosition = window.scrollY;
    const maxScroll = 500; // Maximum scroll position to consider
    
    console.log(`Scroll position: ${scrollPosition}`);

    // Calculate rotation based on scroll position (less rotation as we scroll)
    const rotationX = Math.max(0, 60 - (scrollPosition / maxScroll * 60));
    
    // Calculate translation based on scroll position
    const translateY = Math.max(0, 12 - (scrollPosition / maxScroll * 12));
    
    // Fix dimensions according to viewport
    const isDesktop = window.innerWidth >= 1024;
    
    // Apply the transformation while preserving size - use !important to override any other styles
    const transformValue = `perspective(1200px) translateX(0px) translateY(${translateY}px) scale(0.8) rotate(0deg) rotateX(${rotationX}deg)`;
    dashboard.style.cssText += `transform: ${transformValue} !important;`;
    
    console.log(`Applying transform: ${transformValue}`);

    // Set dimensions to compensate for the scale(0.8) with !important to ensure they're applied
    if (isDesktop) {
      dashboard.style.cssText += 'width: calc(80vw / 0.8) !important;';
    } else {
      dashboard.style.cssText += 'width: calc(90vw / 0.8) !important;';
    }
    dashboard.style.cssText += 'height: calc(90vh / 0.8) !important; min-height: calc(500px / 0.8) !important;';
    
    // Ensure the container isn't restricting the size
    const container = document.getElementById('dashboard-container');
    if (container) {
      container.style.cssText += 'width: 100% !important; max-width: 100% !important; overflow: visible !important;';
    }
  } else {
    console.warn("Dashboard element not found!");
  }
}
*/

// Open and close video modal
// window.openVideo = function openVideo() {
//  console.log("openVideo called");
//  const videoContainer = document.getElementById('video-container-bg');
//  const videoContent = document.getElementById('video-container');
//  const desktopVideo = document.getElementById('desktop-video');
//  const mobileVideo = document.getElementById('mobile-video');
  
//  // Reset and prepare videos
//  if (desktopVideo) {
//    console.log("Desktop video found");
//    desktopVideo.currentTime = 0;
//    desktopVideo.pause();
//    // Ensure proper display
//    if (window.innerWidth >= videoConfig.breakpoint) {
//      desktopVideo.style.display = 'block';
//    }
//  }
  
//  if (mobileVideo) {
//    console.log("Mobile video found");
//    mobileVideo.currentTime = 0;
//    mobileVideo.pause();
//    // Ensure proper display for 9:16 vertical video
//    if (window.innerWidth < videoConfig.breakpoint) {
//      // For mobile view - set up vertical format
//      mobileVideo.style.display = 'block';
//      mobileVideo.style.visibility = 'visible';
//      mobileVideo.style.opacity = '1';
//      mobileVideo.style.width = '100%';
//      mobileVideo.style.height = '100%';
//      mobileVideo.style.objectFit = 'contain';
      
//      // Make sure the container fits the vertical video
//      const mobileContainer = mobileVideo.parentElement;
//      if (mobileContainer) {
//        mobileContainer.style.aspectRatio = '9/16';
//        mobileContainer.style.height = 'auto';
//        mobileContainer.style.maxWidth = '100%';
//        mobileContainer.style.margin = '0 auto';
//      }
//    }
//  }
  
//  if (videoContainer && videoContent) {
//    console.log("Video container found, showing modal");
//    // Remove the scale-0 and opacity-0 classes
//    videoContainer.classList.remove('tw-scale-0', 'tw-opacity-0');
//    // Add scale-100 and opacity-100 classes
//    videoContainer.classList.add('tw-scale-100', 'tw-opacity-100');
    
//    setTimeout(() => {
//      videoContent.classList.add('tw-scale-100');
//      document.body.classList.add('modal-open');
      
//      // Play the appropriate video based on screen size
//      if (window.innerWidth < videoConfig.breakpoint && mobileVideo) {
//        console.log("Playing mobile video");
//        mobileVideo.style.display = 'block';
//        mobileVideo.style.visibility = 'visible';
//        mobileVideo.style.opacity = '1';
//        mobileVideo.play().catch(e => console.log('Auto-play prevented:', e));
//      } else if (desktopVideo) {
//        console.log("Playing desktop video");
//        desktopVideo.play().catch(e => console.log('Auto-play prevented:', e));
//      }
//    }, 300);
//  } else {
//    console.log("Video container or content not found!");
//  }
// }

// window.closeVideo = function closeVideo() {
//  const videoContainer = document.getElementById('video-container-bg');
//  const videoContent = document.getElementById('video-container');
//  const desktopVideo = document.getElementById('desktop-video');
//  const mobileVideo = document.getElementById('mobile-video');

//  // Pause both videos
//  if (desktopVideo) {
//    desktopVideo.pause();
//  }
  
//  if (mobileVideo) {
//    mobileVideo.pause();
//  }
  
//  if (videoContainer && videoContent) {
//    videoContent.classList.remove('tw-scale-100');
//    setTimeout(() => {
//      videoContainer.classList.remove('tw-scale-100', 'tw-opacity-100');
//      videoContainer.classList.add('tw-scale-0', 'tw-opacity-0');
//      document.body.classList.remove('modal-open');
//    }, 300);
//  }
// }

// Initialize dropdown functionality and other DOM-dependent scripts
document.addEventListener('DOMContentLoaded', function() {
  const dropdownToggle = document.getElementById('nav-dropdown-toggle-0');
  const dropdownList = document.getElementById('nav-dropdown-list-0');
  
  if (dropdownToggle && dropdownList) {
    dropdownToggle.addEventListener('click', function() {
      const isOpen = dropdownList.getAttribute('data-open') === 'true';
      dropdownList.setAttribute('data-open', isOpen ? 'false' : 'true');
      
      if (isOpen) {
        dropdownList.classList.remove('tw-scale-100', 'tw-opacity-100');
        dropdownList.classList.add('tw-scale-0', 'tw-opacity-0');
      } else {
        dropdownList.classList.remove('tw-scale-0', 'tw-opacity-0');
        dropdownList.classList.add('tw-scale-100', 'tw-opacity-100');
      }
    });
  }
  
  // No initialization needed for video players anymore - direct HTML5 video elements with fixed sources
  
  // Initial call to set starting position

  // Iframe loader logic
  const heroPreviewIframe = document.getElementById('hero-preview-iframe');
  const iframeLoader = document.getElementById('iframe-loader');

  if (heroPreviewIframe && iframeLoader) {
    // Show loader initially (it should be visible by default from CSS)
    // If it might be hidden by other means, ensure it's not:
    heroPreviewIframe.classList.add('loading'); // Add loading class initially
    iframeLoader.classList.remove('hidden');

    heroPreviewIframe.addEventListener('load', function() {
      iframeLoader.classList.add('hidden'); // Hide loader when iframe content is loaded
      heroPreviewIframe.classList.remove('loading');
      heroPreviewIframe.classList.add('loaded'); // Add loaded class to make it visible
    });

    // Optional: You could also hide the loader on error, though 'load' often fires anyway.
    // console.error('Iframe content failed to load.');
    // iframeLoader.classList.add('hidden');
  }

  // Fetch config and set live showcase URL
  fetch('/config.json')
    .then(response => {
      if (!response.ok) {
        throw new Error('Network response was not ok ' + response.statusText);
      }
      return response.json();
    })
    .then(config => {
      const liveShowcaseButton = document.getElementById('live-showcase-banner');
      if (liveShowcaseButton && config.liveShowcaseUrl) {
        liveShowcaseButton.href = config.liveShowcaseUrl;
      }
    })
    .catch(error => {
      console.error('Failed to load or use live showcase config:', error);
    });

  // Add 'show' class to the header items for mobile menu animation
  const headerItems = document.getElementById('collapsed-header-items');
  if (headerItems) {
    headerItems.classList.add('animated-collapse');
  }

  // FAQ Accordion functionality
  initFaqAccordions(); // Call the FAQ initialization function

  // GSAP ScrollTrigger animation for the dashboard
  const dashboard = document.getElementById('dashboard');
  if (dashboard) {
    console.log('Setting up direct scroll animation for dashboard');
    
    // Remove any existing inline transform styles
    dashboard.style.transform = '';
    
    // Prep the dashboard element
    dashboard.style.willChange = 'transform';
    dashboard.style.transformOrigin = 'center center';
    
    // Store animation state
    const dashboardAnimState = {
      started: false,
      completed: false,
      startY: 0,
      endY: 0,
      progress: 0
    };
    
    // Function to calculate new animation bounds when needed
    function updateDashboardAnimBounds() {
      // Get dashboard position
      const dashboardRect = dashboard.getBoundingClientRect();
      const windowHeight = window.innerHeight;
      
      // Calculate start position (when top of dashboard hits bottom of viewport)
      dashboardAnimState.startY = dashboardRect.top + window.scrollY - windowHeight;
      
      // Calculate end position (when center of dashboard is 80% down from top of viewport)
      const dashboardCenter = dashboardRect.top + window.scrollY + dashboardRect.height / 2;
      dashboardAnimState.endY = dashboardCenter - (windowHeight * 0.8);
      
      console.log('Dashboard animation bounds updated:', 
                 {start: dashboardAnimState.startY, end: dashboardAnimState.endY});
    }
    
    // Calculate initial animation bounds
    updateDashboardAnimBounds();
    
    // Update bounds on resize
    window.addEventListener('resize', updateDashboardAnimBounds);
    
    // Function to update dashboard animation on scroll
    function updateDashboardAnim() {
      const scrollY = window.scrollY;
      
      // Check if we're in the animation range
      if (scrollY >= dashboardAnimState.startY && scrollY <= dashboardAnimState.endY) {
        // Calculate progress (0 to 1)
        dashboardAnimState.progress = (scrollY - dashboardAnimState.startY) / 
                                     (dashboardAnimState.endY - dashboardAnimState.startY);
        
        // Clamp progress between 0 and 1
        dashboardAnimState.progress = Math.max(0, Math.min(1, dashboardAnimState.progress));
        
        // Log progress occasionally (every 10% change to avoid console spam)
        if (Math.floor(dashboardAnimState.progress * 10) % 2 === 0) {
          console.log(`Dashboard scroll progress: ${dashboardAnimState.progress.toFixed(2)}`);
        }
        
        // Calculate animation values
        const rotationX = 10 * (1 - dashboardAnimState.progress);
        const scale = 0.95 + (0.05 * dashboardAnimState.progress);
        
        // Apply transform directly
        dashboard.style.transform = 
          `perspective(1200px) rotateX(${rotationX}deg) scale(${scale})`;
        
        // Update state
        dashboardAnimState.started = true;
        dashboardAnimState.completed = (dashboardAnimState.progress >= 1);
      } 
      // If we passed the end point and haven't marked as completed
      else if (scrollY > dashboardAnimState.endY && !dashboardAnimState.completed) {
        // Set to final state
        dashboard.style.transform = 'perspective(1200px) rotateX(0deg) scale(1)';
        dashboardAnimState.completed = true;
        dashboardAnimState.progress = 1;
        console.log('Dashboard animation completed');
      }
      // If we're before the start point and have started previously
      else if (scrollY < dashboardAnimState.startY && dashboardAnimState.started) {
        // Reset to initial state
        dashboard.style.transform = 'perspective(1200px) rotateX(10deg) scale(0.95)';
        dashboardAnimState.started = false;
        dashboardAnimState.completed = false;
        dashboardAnimState.progress = 0;
        console.log('Dashboard animation reset');
      }
    }
    
    // Run once to set initial state
    updateDashboardAnim();
    
    // Add efficient scroll listener with requestAnimationFrame for smoother performance
    let ticking = false;
    window.addEventListener('scroll', function() {
      if (!ticking) {
        window.requestAnimationFrame(function() {
          updateDashboardAnim();
          ticking = false;
        });
        ticking = true;
      }
    });
  } else {
    console.error("Dashboard element not found");
  }
});


// Initialize FAQ accordions
function initFaqAccordions() {
  const faqAccordions = document.querySelectorAll('.faq-accordion');

  faqAccordions.forEach(accordion => {
    // Initially hide all content
    const content = accordion.nextElementSibling;
    content.style.maxHeight = '0';
    content.style.overflow = 'hidden';
    content.style.transition = 'max-height 0.3s ease-out';
    content.style.padding = '0';

    // Add click event listeners
    accordion.addEventListener('click', function() {
      // Toggle active class on the accordion
      this.classList.toggle('active');

      // Get the icon element
      const icon = this.querySelector('.bi');

      // Get the content element
      const content = this.nextElementSibling;

      // Check if the accordion is active
      if (this.classList.contains('active')) {
        // Rotate the plus icon to make it a minus
        icon.style.transform = 'rotate(45deg)';

        // Show the content
        content.style.padding = '12px 0';

        // Fix for accurate height calculation
        // First temporarily remove the maxHeight constraint and make sure content is visible
        content.style.maxHeight = 'none';
        content.style.visibility = 'visible';
        content.style.position = 'relative';

        // Get the actual height after padding is applied
        const actualHeight = content.offsetHeight;

        // Reset to hidden state for animation to work
        content.style.maxHeight = '0';

        // Force a reflow to ensure the browser recognizes the change
        void content.offsetHeight;

        // Now set to the actual calculated height
        content.style.maxHeight = actualHeight + 'px';
      } else {
        // Reset the icon
        icon.style.transform = 'rotate(0)';

        // Hide the content
        content.style.maxHeight = '0';
        content.style.padding = '0';
      }
    });
  });

  // Add window resize listener to recalculate heights for open accordions
  window.addEventListener('resize', function() {
    const activeAccordions = document.querySelectorAll('.faq-accordion.active');
    activeAccordions.forEach(accordion => {
      const content = accordion.nextElementSibling;

      // Temporarily remove constraints to measure true height
      // const originalMaxHeight = content.style.maxHeight; // Not used, so commented out
      content.style.maxHeight = 'none';

      // Get actual height and restore
      const actualHeight = content.offsetHeight;
      content.style.maxHeight = actualHeight + 'px';
    });
  });
}

// Simple script to fix hero section height and background image positioning
document.addEventListener('DOMContentLoaded', function() {
  // Get elements
  const heroSection = document.getElementById('hero-section');
  const heroBackground = document.querySelector('.hero-bg-gradient');

  if (!heroSection || !heroBackground) {
    console.error('Could not find hero elements');
    return;
  }

  // Breakpoints for responsive design
  const TABLET_BREAKPOINT = 900;
  const MOBILE_BREAKPOINT = 576;

  // Function to add text shadow to the headline
  function addHeadlineTextShadow(headlineElement) {
    // Create a subtle lift effect with text shadow
    headlineElement.style.textShadow = '0 2px 4px rgba(0,0,0,0.3), 0 0 10px rgba(0,0,0,0.2)';
  }

  // Function to add text shadow to the paragraph
  function addParagraphTextShadow(paragraphElement) {
    // Create a subtle lift effect with text shadow (lighter than headline)
    paragraphElement.style.textShadow = '0 1px 3px rgba(0,0,0,0.2), 0 0 8px rgba(0,0,0,0.1)';
  }

  function updateHeroLayout(viewportWidth, heroContent, textWrapper, buttonContainer) {
    // Get the paragraph element
    const paragraph = document.getElementById('hero-paragraph');

    // Get the overlay element
    const tabletOverlay = document.getElementById('tablet-bottom-overlay');

    // Apply text shadow to headline for all viewport sizes
    const headlineElement = textWrapper.querySelector('h2');
    addHeadlineTextShadow(headlineElement);

    // Apply text shadow to paragraph for all viewport sizes
    addParagraphTextShadow(paragraph);

    if (viewportWidth <= TABLET_BREAKPOINT) { // Mobile and Tablet
      if (viewportWidth > MOBILE_BREAKPOINT) { // Tablet only
        // Ensure buttons are in a row for tablet view
        buttonContainer.classList.remove('tw-flex-col');
        buttonContainer.style.flexDirection = 'row';

        // Create a flexible container with content at top and bottom for TABLET
        heroContent.style.display = 'flex';
        heroContent.style.flexDirection = 'column';
        heroContent.style.justifyContent = 'space-between'; // Pushes content to top and bottom
        heroContent.style.height = '100%'; // Fill available height
        heroContent.style.boxSizing = 'border-box'; // Include padding in height calculation

        // Top padding for headline on tablet
        heroContent.style.paddingTop = '100px';

        // Bottom padding after buttons on tablet
        heroContent.style.paddingBottom = '60px';

        // Center alignment
        heroContent.style.alignItems = 'center';
        heroContent.style.textAlign = 'center';

        // Create bottom content group (will contain paragraph and buttons) for TABLET
        let bottomContentGroup = document.getElementById('hero-bottom-content');
        if (!bottomContentGroup) {
          bottomContentGroup = document.createElement('div');
          bottomContentGroup.id = 'hero-bottom-content';
          bottomContentGroup.style.display = 'flex';
          bottomContentGroup.style.flexDirection = 'column';
          bottomContentGroup.style.alignItems = 'center';
          heroContent.appendChild(bottomContentGroup);
        }

        // Style the headline (at the top) for tablet - make it much larger
        textWrapper.style.textAlign = 'center';
        textWrapper.querySelector('h2').style.textAlign = 'center';
        textWrapper.querySelector('h2').style.fontSize = '2.75rem'; // Larger headline for tablet
        textWrapper.querySelector('h2').style.lineHeight = '1.2';

        // Move paragraph to bottom content group and style it for tablet
        bottomContentGroup.appendChild(paragraph);
        paragraph.style.fontSize = '1.1rem';
        paragraph.style.textAlign = 'center';
        paragraph.style.marginTop = '0';
        paragraph.style.marginBottom = '16px'; // 16px padding between paragraph and buttons
        paragraph.style.maxWidth = '75%';

        // Move buttons to bottom content group for tablet
        bottomContentGroup.appendChild(buttonContainer);
        buttonContainer.classList.remove('tw-mt-10');
        buttonContainer.style.marginTop = '0';
        buttonContainer.classList.add('tw-justify-center');
        buttonContainer.classList.remove('tw-flex-col');
      } else { // Mobile specific (<577px)
        tabletOverlay.style.display = 'block'; // Show overlay for mobile too

        // Reset any previous layout structures
        const bottomContentGroup = document.getElementById('hero-bottom-content');
        if (bottomContentGroup) {
          // Move elements back to original container before rearranging
          if (bottomContentGroup.contains(paragraph)) {
            heroContent.appendChild(paragraph);
          }
          if (bottomContentGroup.contains(buttonContainer)) {
            heroContent.appendChild(buttonContainer);
          }
          bottomContentGroup.remove();
        }

        // Set up container for mobile layout
        heroContent.style.display = 'flex';
        heroContent.style.flexDirection = 'column';
        heroContent.style.justifyContent = 'space-between';
        heroContent.style.height = '100%';
        heroContent.style.boxSizing = 'border-box';
        heroContent.style.paddingTop = '100px'; // 100px top padding
        heroContent.style.paddingBottom = '60px'; // 60px bottom padding
        heroContent.style.alignItems = 'center';
        heroContent.style.textAlign = 'center';

        // Create top content group for headline and paragraph
        let topContentGroup = document.getElementById('hero-top-content');
        if (!topContentGroup) {
          topContentGroup = document.createElement('div');
          topContentGroup.id = 'hero-top-content';
          topContentGroup.style.display = 'flex';
          topContentGroup.style.flexDirection = 'column';
          topContentGroup.style.alignItems = 'center';

          // Move headline wrapper to top content
          if (heroContent.contains(textWrapper)) {
            heroContent.removeChild(textWrapper);
          }
          topContentGroup.appendChild(textWrapper);

          // Move paragraph directly after headline with 12px spacing
          if (heroContent.contains(paragraph)) {
            heroContent.removeChild(paragraph);
          }
          topContentGroup.appendChild(paragraph);

          // Insert the top content group at the beginning of hero content
          heroContent.insertBefore(topContentGroup, heroContent.firstChild);
        }

        // Style the headline for mobile - make it much smaller
        textWrapper.style.textAlign = 'center';
        textWrapper.querySelector('h2').style.textAlign = 'center';
        if (viewportWidth < 400) {
          textWrapper.querySelector('h2').style.fontSize = '1.5rem'; // Even smaller headline for < 400px
        } else {
          textWrapper.querySelector('h2').style.fontSize = '2rem'; // Headline for 400px-576px
        }
        textWrapper.querySelector('h2').style.lineHeight = '1.3';

        // Style the paragraph for mobile - smaller text
        paragraph.style.textAlign = 'center';
        paragraph.style.marginTop = '0'; // Removed spacing between headline and paragraph
        paragraph.style.marginBottom = '0';
        paragraph.style.maxWidth = '100%';
        if (viewportWidth < 400) {
          paragraph.style.fontSize = '0.9rem'; // Even smaller for < 400px
          paragraph.style.lineHeight = '1.4'; // Adjust line spacing for < 400px
        } else {
          paragraph.style.fontSize = '0.9rem'; // Smaller paragraph text for 400px-576px
          paragraph.style.lineHeight = 'normal'; // Reset to default for other mobile sizes
        }

        // Style buttons for mobile - same width
        buttonContainer.classList.add('tw-flex-col');
        buttonContainer.style.flexDirection = 'column';
        buttonContainer.classList.remove('tw-mt-10');
        buttonContainer.style.marginTop = 'auto'; // Push to bottom with natural spacing
        buttonContainer.classList.add('tw-justify-center');

        // Set equal width for all buttons in the container
        const buttons = buttonContainer.querySelectorAll('a, button');
        buttons.forEach(button => {
          button.style.width = '240px'; // Fixed width for all buttons
          button.style.maxWidth = '90vw'; // Prevent overflow on very small screens
          button.style.margin = '6px auto'; // Center buttons and add vertical spacing
        });
      }
    } else { // Desktop View
      // Hide overlay on desktop
      tabletOverlay.style.display = 'none';

      // Ensure buttons are in a row for desktop
      buttonContainer.classList.remove('tw-flex-col');
      buttonContainer.style.flexDirection = 'row';

      // Remove bottom content group if it exists
      const bottomContentGroup = document.getElementById('hero-bottom-content');
      if (bottomContentGroup) {
        // Move paragraph and buttons back to their original positions
        textWrapper.after(paragraph);
        paragraph.after(buttonContainer);

        // Remove the temporary container
        bottomContentGroup.remove();
      }

      // Remove top content group if it exists from mobile view
      const topContentGroup = document.getElementById('hero-top-content');
      if (topContentGroup) {
        // Ensure content is properly reintegrated
        if (topContentGroup.contains(textWrapper)) {
          heroContent.appendChild(textWrapper);
        }
        if (topContentGroup.contains(paragraph)) {
          textWrapper.after(paragraph);
        }
        topContentGroup.remove();
      }

      // Reset container styles
      heroContent.style.display = '';
      heroContent.style.flexDirection = '';
      heroContent.style.justifyContent = '';
      heroContent.style.height = '';
      heroContent.style.paddingTop = '';
      heroContent.style.paddingBottom = '';
      heroContent.style.boxSizing = '';
      heroContent.style.alignItems = '';
      heroContent.style.textAlign = '';

      // Set desktop-specific styles - make headline much larger
      textWrapper.style.textAlign = '';
      textWrapper.querySelector('h2').style.fontSize = '3.5rem'; // Much larger headline for desktop
      textWrapper.querySelector('h2').style.lineHeight = '1.1';
      textWrapper.querySelector('h2').style.textAlign = '';

      // Reset paragraph styles
      paragraph.style.fontSize = '';
      paragraph.style.textAlign = '';
      paragraph.style.lineHeight = '';
      paragraph.style.maxWidth = '';
      paragraph.style.marginTop = '';
      paragraph.style.marginBottom = '';

      // Reset button container
      buttonContainer.classList.add('tw-mt-10');
      buttonContainer.style.marginTop = '';
      buttonContainer.classList.remove('tw-justify-center');
      buttonContainer.classList.remove('tw-flex-col');
    }
  }

  function updateHeroBackground() {
    const viewportWidth = window.innerWidth;
    const heroContent = document.querySelector('.hero-bg-gradient > .tw-fixed-container');
    const textWrapper = document.getElementById('hero-text-content-wrapper');
    const buttonContainer = document.getElementById('hero-button-container');

    // Set constant height constraints directly
    heroSection.style.minHeight = '600px';
    heroSection.style.height = '100vh';
    heroSection.style.maxHeight = '800px';

    // Apply different background images and styles based on viewport width
    if (viewportWidth <= MOBILE_BREAKPOINT) {
      // Mobile view
      heroBackground.style.backgroundImage = "url('/assets/images/background/BGImg (Mobile).png')";
      heroBackground.style.backgroundSize = "cover";
      heroBackground.style.backgroundPosition = "center center";
    }
    else if (viewportWidth <= TABLET_BREAKPOINT) {
      // Tablet view
      heroBackground.style.backgroundImage = "url('/assets/images/background/BGImg (Tablet).png')";
      heroBackground.style.backgroundSize = "cover";
      heroBackground.style.backgroundPosition = "center center";
    }
    else {
      // Desktop view
      heroBackground.style.backgroundImage = "url('/assets/images/background/BGImg (Desktop).png')";
      heroBackground.style.backgroundSize = "cover";
      heroBackground.style.backgroundPosition = "center center";
    }

    // Update layout based on viewport width
    updateHeroLayout(viewportWidth, heroContent, textWrapper, buttonContainer);
  }

  // Initial call
  updateHeroBackground();
  // Update on resize
  window.addEventListener('resize', updateHeroBackground);

  // Also try after a small delay to ensure everything is loaded
  setTimeout(updateHeroBackground, 500);
});

// Legal Popups JavaScript
// Function to open legal popup
function openLegalPopup(popupId) {
  const popup = document.getElementById(popupId);
  if (popup) {
    popup.classList.add('active');
    document.body.style.overflow = 'hidden'; // Prevent scrolling behind modal

    // Focus on the popup for accessibility
    const focusableElement = popup.querySelector('button');
    if (focusableElement) {
      setTimeout(() => {
        focusableElement.focus();
      }, 100);
    }

    // Add escape key listener
    document.addEventListener('keydown', handleEscapeKey);

    // Add click outside listener
    popup.addEventListener('click', handleOutsideClick);
  }
}

// Function to close legal popup
function closeLegalPopup(popupId) {
  const popup = document.getElementById(popupId);
  if (popup) {
    popup.classList.remove('active');
    document.body.style.overflow = ''; // Restore scrolling

    // Remove event listeners
    document.removeEventListener('keydown', handleEscapeKey);
    popup.removeEventListener('click', handleOutsideClick);
  }
}

// Handle escape key press
function handleEscapeKey(event) {
  if (event.key === 'Escape') {
    const activePopup = document.querySelector('.legal-popup.active');
    if (activePopup) {
      closeLegalPopup(activePopup.id);
    }
  }
}

// Handle click outside the popup content
function handleOutsideClick(event) {
  // Check if click is directly on the popup background (not its children)
  if (event.target.classList.contains('legal-popup')) {
    closeLegalPopup(event.target.id);
  }
}

// Initialize popup functionality
document.addEventListener('DOMContentLoaded', function() {
  // Connect the footer links to open the popups
  const privacyPolicyLinks = document.querySelectorAll('a[href="#privacy-policy"]');
  const termsOfServiceLinks = document.querySelectorAll('a[href="#terms-of-service"]');

  privacyPolicyLinks.forEach(link => {
    link.addEventListener('click', function(e) {
      e.preventDefault();
      openLegalPopup('privacy-policy-popup');
    });
  });

  termsOfServiceLinks.forEach(link => {
    link.addEventListener('click', function(e) {
      e.preventDefault();
      openLegalPopup('terms-of-service-popup');
    });
  });
}); 