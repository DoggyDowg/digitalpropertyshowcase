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

window.toggleHeader = function toggleHeader() {
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
}

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
function handleScroll() {
  const dashboard = document.getElementById('dashboard');
  if (dashboard) {
    const scrollPosition = window.scrollY;
    const maxScroll = 500; // Maximum scroll position to consider
    
    // Calculate rotation based on scroll position (less rotation as we scroll)
    const rotationX = Math.max(0, 60 - (scrollPosition / maxScroll * 60));
    
    // Calculate translation based on scroll position
    const translateY = Math.max(0, 12 - (scrollPosition / maxScroll * 12));
    
    // Fix dimensions according to viewport
    const isDesktop = window.innerWidth >= 1024;
    
    // Apply the transformation while preserving size - use !important to override any other styles
    dashboard.style.cssText += `transform: perspective(1200px) translateX(0px) translateY(${translateY}px) scale(0.8) rotate(0deg) rotateX(${rotationX}deg) !important;`;
    
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
  }
}

// Open and close video modal
window.openVideo = function openVideo() {
  const videoContainer = document.getElementById('video-container-bg');
  const videoContent = document.getElementById('video-container');
  
  if (videoContainer && videoContent) {
    videoContainer.classList.remove('tw-scale-0', 'tw-opacity-0');
    videoContainer.classList.add('tw-scale-100', 'tw-opacity-100');
    
    setTimeout(() => {
      videoContent.classList.add('tw-scale-100');
      document.body.classList.add('modal-open');
    }, 300);
  }
}

window.closeVideo = function closeVideo() {
  const videoContainer = document.getElementById('video-container-bg');
  const videoContent = document.getElementById('video-container');
  const cloudinaryIframe = document.getElementById('cloudinaryPlayer'); // Get the iframe player

  if (cloudinaryIframe) {
    // Reload the iframe to stop the video
    const originalSrc = cloudinaryIframe.src;
    cloudinaryIframe.src = ''; // Set to empty first to ensure it stops
    cloudinaryIframe.src = originalSrc; // Then reset to original to be ready for next play
    // A simpler way that often works for stopping: 
    // cloudinaryIframe.src = cloudinaryIframe.src;
  }
  
  if (videoContainer && videoContent) {
    videoContent.classList.remove('tw-scale-100');
    setTimeout(() => {
      videoContainer.classList.remove('tw-scale-100', 'tw-opacity-100');
      videoContainer.classList.add('tw-scale-0', 'tw-opacity-0');
      document.body.classList.remove('modal-open');
    }, 300);
  }
}

// Initialize dropdown functionality
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
  
  // Add scroll event listener
  window.addEventListener('scroll', handleScroll);
  
  // Initial call to set starting position
  handleScroll();

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
    // heroPreviewIframe.addEventListener('error', function() {
    //   console.error('Iframe content failed to load.');
    //   iframeLoader.classList.add('hidden'); 
    // });
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
});

// Add 'show' class to the header items for mobile menu animation
document.addEventListener('DOMContentLoaded', function() {
  const headerItems = document.getElementById('collapsed-header-items');
  if (headerItems) {
    headerItems.classList.add('animated-collapse');
  }
  
  // FAQ Accordion functionality
  initFaqAccordions();
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
      const originalMaxHeight = content.style.maxHeight;
      content.style.maxHeight = 'none';
      
      // Get actual height and restore
      const actualHeight = content.offsetHeight;
      content.style.maxHeight = actualHeight + 'px';
    });
  });
} 