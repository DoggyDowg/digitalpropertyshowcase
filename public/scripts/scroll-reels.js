/**
 * Scroll-Triggered Property Reels
 * Adds GSAP ScrollTrigger animations to property reels
 */

document.addEventListener('DOMContentLoaded', function() {
  // Wait for GSAP to be loaded
  if (typeof gsap === 'undefined') {
    console.error('GSAP not loaded! ScrollTrigger reels will not work.');
    return;
  }
  
  // Make sure ScrollTrigger plugin is registered
  if (typeof ScrollTrigger === 'undefined') {
    console.error('ScrollTrigger plugin not loaded! Scroll reels will not work.');
    return;
  }
  
  gsap.registerPlugin(ScrollTrigger);
  
  // Function to initialize scroll-triggered animations
  function initScrollReels() {
    console.log("Initializing scroll-triggered property reels");
    
    // Make sure reels exist before trying to animate them
    const reel1Element = document.querySelector('#property-reel-1');
    const reel2Element = document.querySelector('#property-reel-2');
    
    if (!reel1Element || !reel2Element) {
      console.warn("Property reels not found in the document");
      return;
    }
    
    // First, disable any existing auto-scroll behaviors and styles
    disableExistingAutoScroll();
    
    // Check if we're on a mobile device
    const isMobile = window.innerWidth < 768;
    
    // First reel - scroll left-to-right
    const reel1Content = document.querySelector('#property-reel-1 .scrolling-content');
    if (reel1Content) {
      // Make sure reel content has items before animating
      if (reel1Content.children.length === 0) {
        console.warn("Property reel 1 has no content yet, waiting for population");
        // We'll continue and set up the animation anyway, it will work once content is added
      }
      
      // Calculate the total scrollable width with a safety factor
      // This function will be re-evaluated when ScrollTrigger refreshes
      const getScrollWidth = () => {
        const parentWidth = reel1Content.parentElement.offsetWidth;
        const contentWidth = reel1Content.scrollWidth;
        console.log(`Reel 1 Dimensions - Parent: ${parentWidth}px, Content: ${contentWidth}px, Scrollable: ${contentWidth - parentWidth}px`);
        
        // Add extra width for safety (ensures full scroll on all devices)
        const safetyFactor = 1.1;
        return (contentWidth - parentWidth) * safetyFactor;
      };
      
      // Mobile-specific handling for visibility
      if (isMobile) {
        // For mobile, start at the beginning to ensure visibility
        reel1Content.style.transform = 'translateX(0)';
        
        // Mobile-specific animation settings
        gsap.to(reel1Content, {
          x: () => -getScrollWidth() / 1.5, // Use less extreme end position for mobile
          ease: "none", // Linear movement
          scrollTrigger: {
            trigger: "#property-reel-1",
            start: "top 80%", // Start sooner on mobile
            end: "bottom 20%", // End when element is almost out of view
            scrub: 1, // Smooth scrolling
            invalidateOnRefresh: true, // Recalculate on window resize
            onRefresh: () => console.log("Mobile Reel 1 ScrollTrigger refreshed")
          }
        });
      } else {
        // RESTORE ORIGINAL DESKTOP ANIMATION - UNCHANGED FROM ORIGINAL
        // Set initial position to middle of the scroll range as in original code
        const midpoint = -getScrollWidth() / 2;
        reel1Content.style.transform = `translateX(${midpoint}px)`;
        
        // Original desktop animation with original parameters
        gsap.to(reel1Content, {
          x: () => -getScrollWidth(), // End position (fully scrolled)
          ease: "none", // Linear movement
          scrollTrigger: {
            trigger: "#property-reel-1",
            start: "top bottom", // Start when top of reel enters bottom of viewport
            end: "+=3000%", // Make the scroll distance much longer for slower animation - ORIGINAL VALUE
            scrub: 1, // Smooth scrolling with a 1-second delay
            // markers: true, // Uncomment for debugging
            invalidateOnRefresh: true, // Recalculate on window resize
            onRefresh: () => console.log("Reel 1 ScrollTrigger refreshed, new end position:", -getScrollWidth())
          }
        });
      }
      
      console.log(`Reel 1 scroll animation initialized - positioned for ${isMobile ? 'mobile' : 'desktop'} view`);
    }
    
    // Second reel - scroll right-to-left (reverse direction)
    const reel2Content = document.querySelector('#property-reel-2 .scrolling-content-reverse');
    if (reel2Content) {
      // Same check for content
      if (reel2Content.children.length === 0) {
        console.warn("Property reel 2 has no content yet, waiting for population");
      }
      
      // Calculate width function with safety factor
      const getScrollWidth = () => {
        const parentWidth = reel2Content.parentElement.offsetWidth;
        const contentWidth = reel2Content.scrollWidth;
        console.log(`Reel 2 Dimensions - Parent: ${parentWidth}px, Content: ${contentWidth}px, Scrollable: ${contentWidth - parentWidth}px`);
        
        const safetyFactor = 1.1;
        return (contentWidth - parentWidth) * safetyFactor;
      };
      
      // Mobile-specific handling for visibility
      if (isMobile) {
        // For mobile, position near the end to show more content initially
        const nearEnd = -getScrollWidth() + (window.innerWidth * 0.5);
        reel2Content.style.transform = `translateX(${nearEnd}px)`;
        
        // Mobile-specific animation
        gsap.to(reel2Content, {
          x: 0, // End at the start (right to left)
          ease: "none",
          scrollTrigger: {
            trigger: "#property-reel-2",
            start: "top 80%", // Start sooner on mobile
            end: "bottom 20%", // End when element is almost out of view
            scrub: 1,
            invalidateOnRefresh: true,
            onRefresh: () => console.log("Mobile Reel 2 ScrollTrigger refreshed")
          }
        });
      } else {
        // RESTORE ORIGINAL DESKTOP ANIMATION - UNCHANGED FROM ORIGINAL
        // Set initial position to middle of the scroll range as in original code
        const midpoint = -getScrollWidth() / 2;
        reel2Content.style.transform = `translateX(${midpoint}px)`;
        
        // Original desktop animation with original parameters
        gsap.to(reel2Content, {
          x: 0, // End position (fully scrolled in opposite direction)
          ease: "none",
          scrollTrigger: {
            trigger: "#property-reel-2",
            start: "top bottom", // Original - Start when top of reel enters bottom of viewport
            end: "+=3000%", // Original - Make the scroll distance much longer for slower animation
            scrub: 1, // Original value
            // markers: true, // Uncomment for debugging
            invalidateOnRefresh: true,
            onRefresh: () => console.log("Reel 2 ScrollTrigger refreshed, new start position:", -getScrollWidth())
          }
        });
      }
      
      console.log(`Reel 2 scroll animation initialized - positioned for ${isMobile ? 'mobile' : 'desktop'} view`);
    }
  }
  
  // Function to disable any existing auto-scroll behaviors and reset conflicting styles
  function disableExistingAutoScroll() {
    console.log("Attempting to disable existing auto-scroll behaviors and reset styles...");
    
    // Check if we're on a mobile device
    const isMobile = window.innerWidth < 768;
    
    // 1. Check for and disable CSS animations on the content elements
    const scrollingContentElements = document.querySelectorAll('.scrolling-content, .scrolling-content-reverse');
    scrollingContentElements.forEach(element => {
      element.style.animation = 'none';
      element.style.webkitAnimation = 'none';
      
      // Aggressive style resets to ensure GSAP can control transform and position
      element.style.position = 'relative'; // GSAP often works best with relative or absolute
      element.style.left = 'auto';
      element.style.right = 'auto';
      element.style.marginLeft = '0';
      element.style.marginRight = '0';
      // Don't reset transform here as we set it manually for initial positioning
      element.style.webkitTransform = 'none';
      
      // Special handling for mobile to ensure visibility
      if (isMobile) {
        element.style.willChange = 'transform'; // Optimize for transform changes
        element.style.minWidth = 'fit-content'; // Ensure content determines minimum width
        element.style.display = 'flex'; // Ensure flex layout
        element.style.flexDirection = 'row'; // Horizontal layout
        element.style.visibility = 'visible'; // Force visibility
        element.style.opacity = '1'; // Force full opacity
      } else {
        element.style.willChange = 'transform'; // Indicate that transform will be animated
        element.style.display = 'flex'; // Ensure flex layout is maintained
        element.style.flexDirection = 'row'; // Ensure horizontal layout
        element.style.width = 'fit-content'; // Allow content to determine width
        element.style.maxWidth = 'none'; // Remove max-width constraints
      }
    });
    
    // 2. Reset the scrolling wrappers - ensure overflow is hidden and no transforms
    const wrappers = document.querySelectorAll('.scrolling-wrapper');
    wrappers.forEach(wrapper => {
      wrapper.style.overflowX = 'hidden';
      wrapper.style.overflowY = 'hidden';
      wrapper.style.transform = 'none';
      wrapper.style.webkitTransform = 'none';
      
      // Mobile-specific handling
      if (isMobile) {
        wrapper.style.width = '100%'; // Full width
        wrapper.style.maxWidth = '100%';
        wrapper.style.visibility = 'visible'; // Force visibility
        wrapper.style.display = 'block'; // Ensure it's displayed
      } else {
        wrapper.style.width = '100%'; // Wrapper should take full width of its container
        wrapper.style.maxWidth = '100%';
      }
    });
    
    // 3. Reset the reel containers - ensure proper width and no conflicting styles
    const reelContainers = document.querySelectorAll('.property-reel');
    reelContainers.forEach(container => {
      // Mobile-specific styles
      if (isMobile) {
        container.style.width = '100%';
        container.style.maxWidth = '100%';
        container.style.overflow = 'hidden';
        container.style.visibility = 'visible'; // Force visibility
        container.style.display = 'block'; // Ensure it's displayed
        // Don't change transform for reel-2 as it has rotation
        
        // Apply special fallback for mobile if GSAP fails
        // We'll add a direct event listener that tracks scroll position
        if (container.id === 'property-reel-1' || container.id === 'property-reel-2') {
          ensureMobileReelVisibility(container);
        }
      } else {
        container.style.width = '100vw';
        container.style.maxWidth = '100vw';
        container.style.overflow = 'hidden';
        container.style.marginLeft = 'auto'; // Center the container if needed
        container.style.marginRight = 'auto';
        // Do NOT reset transform here for reel-2 as it has a rotation
      }
    });
    
    // 4. Clear any intervals or timeouts that might be animating the reels
    if (window.autoScrollInterval) {
      clearInterval(window.autoScrollInterval);
      delete window.autoScrollInterval; // Clean up the global variable
      console.log("Cleared existing auto-scroll interval");
    }
    
    console.log("Finished attempting to disable existing auto-scroll behaviors and reset styles.");
    
    // 5. Make sure reel containers have the scroll-triggered class - important for CSS
    const reels = document.querySelectorAll('.property-reel');
    reels.forEach(reel => {
      if (!reel.classList.contains('scroll-triggered')) {
        reel.classList.add('scroll-triggered');
      }
    });
  }
  
  // Special function to ensure mobile reel visibility regardless of GSAP
  function ensureMobileReelVisibility(reelContainer) {
    if (window.innerWidth >= 768) return; // Only apply to mobile
    
    // Identify the content element
    const contentEl = reelContainer.id === 'property-reel-1' 
      ? reelContainer.querySelector('.scrolling-content')
      : reelContainer.querySelector('.scrolling-content-reverse');
      
    if (!contentEl) return;
    
    // Force display and visibility
    reelContainer.style.display = 'block';
    reelContainer.style.visibility = 'visible';
    reelContainer.style.opacity = '1';
    
    contentEl.style.display = 'flex';
    contentEl.style.visibility = 'visible';
    contentEl.style.opacity = '1';
    
    // For first reel, ensure it starts at the beginning
    if (reelContainer.id === 'property-reel-1') {
      // Set a starting position that shows content on screen
      contentEl.style.transform = 'translateX(0)';
    } 
    // For second reel, position it to show content on screen
    else if (reelContainer.id === 'property-reel-2') {
      // Calculate a position that shows content
      const contentWidth = contentEl.scrollWidth;
      const containerWidth = reelContainer.offsetWidth;
      const visiblePosition = Math.max(0, (contentWidth - containerWidth) * 0.3);
      contentEl.style.transform = `translateX(-${visiblePosition}px)`;
    }
    
    console.log(`Applied mobile visibility fallback for ${reelContainer.id}`);
  }
  
  // Function to handle window resize and ScrollTrigger refresh
  function handleResize() {
    console.log("Window resized, refreshing ScrollTrigger...");
    // Refresh ScrollTrigger to handle new dimensions
    if (ScrollTrigger) {
      ScrollTrigger.refresh();
      console.log("ScrollTrigger refreshed due to resize");
    }
    
    // Check if we need to re-apply mobile-specific fixes
    if (window.innerWidth < 768) {
      // Re-apply mobile fixes
      const reels = document.querySelectorAll('.property-reel');
      reels.forEach(reel => {
        if (reel.id === 'property-reel-1' || reel.id === 'property-reel-2') {
          ensureMobileReelVisibility(reel);
        }
      });
    }
  }
  
  // We need to make sure the property cards are loaded before initializing animations
  // Set up a small polling mechanism to wait for cards to be populated
  function waitForPropertyCards() {
    const reel1Content = document.querySelector('#property-reel-1 .scrolling-content');
    const reel2Content = document.querySelector('#property-reel-2 .scrolling-content-reverse');
    
    // Check if both reel containers and their content elements exist and have children
    // Also check if the content elements have a scrollWidth greater than 0
    const reel1Ready = reel1Content && reel1Content.children.length > 0 && reel1Content.scrollWidth > 0;
    const reel2Ready = reel2Content && reel2Content.children.length > 0 && reel2Content.scrollWidth > 0;
    
    if (reel1Ready || reel2Ready) { // Initialize if at least one reel is ready
      console.log("Property cards found and elements have scrollWidth > 0, initializing scroll animations");
      initScrollReels();
      
      // Set up resize handler with debounce
      let resizeTimeout;
      window.addEventListener('resize', () => {
        clearTimeout(resizeTimeout);
        resizeTimeout = setTimeout(handleResize, 250);
      });
      
      // Also set up MutationObserver to detect when new cards are added or removed
      const observerConfig = { childList: true };

      const reel1Observer = new MutationObserver(() => {
          console.log('Reel 1 content changed, refreshing ScrollTrigger.');
          // Use setTimeout to allow the DOM to settle after changes
          setTimeout(() => ScrollTrigger.refresh(), 50);
      });
       if (reel1Content) reel1Observer.observe(reel1Content, observerConfig);

      const reel2Observer = new MutationObserver(() => {
          console.log('Reel 2 content changed, refreshing ScrollTrigger.');
           // Use setTimeout to allow the DOM to settle after changes
          setTimeout(() => ScrollTrigger.refresh(), 50);
      });
       if (reel2Content) reel2Observer.observe(reel2Content, observerConfig);

    } else {
      console.log("Waiting for property cards to be populated and have non-zero scrollWidth...");
      setTimeout(waitForPropertyCards, 200); // Check again in 200ms
    }
  }
  
  // Give the page a moment to load and start the card population
  setTimeout(() => {
    console.log("Starting initialization check for scroll-triggered reels");
    waitForPropertyCards();
  }, 500);
}); 