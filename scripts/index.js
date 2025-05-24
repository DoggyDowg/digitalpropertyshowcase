document.addEventListener('DOMContentLoaded', function() {
    console.log("DOM loaded - initializing animations");
    
    // Ensure GSAP and ScrollTrigger are registered
    if (typeof gsap !== 'undefined' && typeof ScrollTrigger !== 'undefined') {
        console.log("GSAP and ScrollTrigger loaded successfully");
        gsap.registerPlugin(ScrollTrigger);
        
        // Select ALL elements with the class "reveal-up"
        const revealElements = document.querySelectorAll(".reveal-up");
        console.log(`Found ${revealElements.length} elements with .reveal-up class`);
        
        // Create a class for revealed elements
        const REVEALED_CLASS = "is-revealed";
        
        if (revealElements.length > 0) {
            // Apply animation to each element
            revealElements.forEach((element, index) => {
                console.log(`Setting up animation for element ${index}`);
                
                // Set initial state with GSAP
                gsap.set(element, { 
                    opacity: 0,
                    y: 40
                });
                
                // Create the ScrollTrigger
                ScrollTrigger.create({
                    trigger: element,
                    start: "top 85%",
                    once: true,
                    onEnter: () => {
                        console.log(`Animation triggered for element ${index}`);
                        
                        // Animate with GSAP
                        gsap.to(element, {
                            opacity: 1,
                            y: 0,
                            duration: 0.8,
                            ease: "power2.out"
                        });
                        
                        // Also add a class as fallback
                        element.classList.add(REVEALED_CLASS);
                    }
                });
            });
        } else {
            console.warn("No elements with .reveal-up class found");
        }
    } else {
        console.error("GSAP or ScrollTrigger not loaded! Falling back to basic animations");
        // Fallback for when GSAP isn't loaded
        setupBasicAnimations();
    }
});

// Fallback animation using Intersection Observer
function setupBasicAnimations() {
    const revealElements = document.querySelectorAll(".reveal-up");
    
    if (revealElements.length === 0) return;
    
    // Add initial state with CSS
    revealElements.forEach(el => {
        el.style.opacity = "0";
        el.style.transform = "translateY(40px)";
    });
    
    // Use Intersection Observer if available
    if ('IntersectionObserver' in window) {
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    const element = entry.target;
                    element.style.opacity = "1";
                    element.style.transform = "translateY(0)";
                    observer.unobserve(element); // Stop watching once revealed
                }
            });
        }, { threshold: 0.1 });
        
        revealElements.forEach(el => {
            observer.observe(el);
        });
    } else {
        // Simple fallback - just show all elements
        revealElements.forEach(el => {
            el.style.opacity = "1";
            el.style.transform = "translateY(0)";
        });
    }
} 