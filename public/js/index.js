document.addEventListener('DOMContentLoaded', function() {
    const RESPONSIVE_WIDTH = 1024;
    let isHeaderCollapsed = window.innerWidth < RESPONSIVE_WIDTH;
    const collapseBtn = document.getElementById("collapse-btn");
    const collapseHeaderItems = document.getElementById("collapsed-header-items");

    // Desktop-specific nav dropdown (if it exists)
    const navToggle = document.querySelector("#nav-dropdown-toggle-0");
    const navDropdown = document.querySelector("#nav-dropdown-list-0");

    if (!collapseBtn || !collapseHeaderItems) {
        console.error("Header collapse button or items container not found!");
        return;
    }

    function onHeaderClickOutside(e) {
        if (collapseHeaderItems && !collapseHeaderItems.contains(e.target) && 
            collapseBtn && !collapseBtn.contains(e.target)) {
            if (!isHeaderCollapsed) { // If menu is open
                toggleHeader();
            }
        }
    }

    function toggleHeader() {
        if (!collapseHeaderItems || !collapseBtn) return;

        if (isHeaderCollapsed) { 
            collapseHeaderItems.classList.add("mobile-menu-is-open");
            collapseBtn.classList.remove("bi-list");
            collapseBtn.classList.add("bi-x", "max-lg:tw-fixed"); 
            document.body.classList.add("modal-open");
            isHeaderCollapsed = false;
            setTimeout(() => window.addEventListener("click", onHeaderClickOutside), 1);
        } else { 
            collapseHeaderItems.classList.remove("mobile-menu-is-open");
            collapseBtn.classList.remove("bi-x", "max-lg:tw-fixed");
            collapseBtn.classList.add("bi-list");
            document.body.classList.remove("modal-open");
            isHeaderCollapsed = true;
            window.removeEventListener("click", onHeaderClickOutside);
        }
    }

    function responsive() {
        if (!collapseHeaderItems || !collapseBtn) return;
        const isDesktop = window.innerWidth > RESPONSIVE_WIDTH;

        if (isDesktop) {
            collapseHeaderItems.classList.remove("mobile-menu-is-open"); 
            collapseHeaderItems.style.height = ""; 
            collapseBtn.classList.remove("bi-x", "max-lg:tw-fixed");
            collapseBtn.classList.add("bi-list"); 
            
            if (document.body.classList.contains("modal-open") && !isHeaderCollapsed) {
                 document.body.classList.remove("modal-open");
            }
            window.removeEventListener("click", onHeaderClickOutside);
            isHeaderCollapsed = true; 

            if (navToggle && navDropdown) {
                navToggle.addEventListener("mouseenter", openNavDropdown);
                navToggle.addEventListener("mouseleave", navMouseLeave);
            }
        } else {
            if (!isHeaderCollapsed) {
                 toggleHeader(); 
            } else {
                 collapseHeaderItems.classList.remove("mobile-menu-is-open");
                 collapseHeaderItems.style.height = ""; // Clear inline height from old logic if any
            }
            
            if (navToggle && navDropdown) {
                navToggle.removeEventListener("mouseenter", openNavDropdown);
                navToggle.removeEventListener("mouseleave", navMouseLeave);
            }
        }
    }

    // Initial call to set up the correct state
    responsive(); 
    
    collapseBtn.addEventListener("click", toggleHeader);
    window.addEventListener("resize", responsive);

    // Desktop nav dropdown functions (if navToggle and navDropdown exist)
    // These are separate from the main mobile hamburger menu
    if (navToggle && navDropdown) {
        navToggle.addEventListener("click", toggleNavDropdown); // For click on desktop dropdown toggle
        navDropdown.addEventListener("mouseleave", closeNavDropdown); // To close desktop dropdown
    }

    function toggleNavDropdown() {
        if (!navDropdown) return;
        if (navDropdown.getAttribute("data-open") === "true") {
            closeNavDropdown();
        } else {
            openNavDropdown();
        }
    }

    function navMouseLeave() {
        if (!navDropdown) return;
        setTimeout(closeNavDropdown, 100);
    }

    function openNavDropdown() {
        if (!navDropdown) return;
        navDropdown.classList.add("tw-opacity-100", "tw-scale-100",
            "max-lg:tw-min-h-[450px]", "max-lg:!tw-h-fit", "tw-min-w-[320px]");
        navDropdown.setAttribute("data-open", "true");
    }

    function closeNavDropdown() {
        if (!navDropdown || (navDropdown.matches && navDropdown.matches(":hover"))) {
            return;
        }
        navDropdown.classList.remove("tw-opacity-100", "tw-scale-100",
            "max-lg:tw-min-h-[450px]", "tw-min-w-[320px]", "max-lg:!tw-h-fit");
        navDropdown.setAttribute("data-open", "false");
    }
});

/** Dark and light theme */
if (localStorage.getItem('color-mode') === 'dark' || (!('color-mode' in localStorage) && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
    document.documentElement.classList.add('tw-dark')
    updateToggleModeBtn()
} else {
    document.documentElement.classList.remove('tw-dark')
    updateToggleModeBtn()
}

window.toggleMode = function(){
    document.documentElement.classList.toggle("tw-dark")
    updateToggleModeBtn()
}

function updateToggleModeBtn(){
    const toggleIcon = document.querySelector("#toggle-mode-icon")
    if (toggleIcon) {
        if (document.documentElement.classList.contains("tw-dark")){
            toggleIcon.classList.remove("bi-sun")
            toggleIcon.classList.add("bi-moon")
            localStorage.setItem("color-mode", "dark")
        } else {
            toggleIcon.classList.add("bi-sun")
            toggleIcon.classList.remove("bi-moon")
            localStorage.setItem("color-mode", "light")
        }
    }
}

document.addEventListener('DOMContentLoaded', function() {
    updateToggleModeBtn();
    const themeToggleButton = document.querySelector(/* selector for your theme toggle button if it exists */);
    if (themeToggleButton) {
        // themeToggleButton.addEventListener('click', toggleMode);
    }
});

const videoBg = document.querySelector("#video-container-bg")
const videoContainer = document.querySelector("#video-container")

function openVideo(){
    if (!videoBg || !videoContainer) {
        console.error("Video modal elements not found for openVideo");
        return;
    }
    videoBg.classList.remove("tw-scale-0", "tw-opacity-0")
    videoBg.classList.add("tw-scale-100", "tw-opacity-100")
    videoContainer.classList.remove("tw-scale-0")
    videoContainer.classList.add("tw-scale-100")
    document.body.classList.add("modal-open")
}

window.closeVideo = function(){
    if (!videoBg || !videoContainer) {
        console.error("Video modal elements not found for closeVideo");
        return;
    }
    
    // Pause both videos before closing
    const desktopVideo = document.querySelector("#desktop-video");
    const mobileVideo = document.querySelector("#mobile-video");
    
    if (desktopVideo) {
        desktopVideo.pause();
        desktopVideo.currentTime = 0; // Reset to beginning
    }
    if (mobileVideo) {
        mobileVideo.pause();
        mobileVideo.currentTime = 0; // Reset to beginning
    }
    
    videoContainer.classList.add("tw-scale-0")
    videoContainer.classList.remove("tw-scale-100")
    setTimeout(() => {
        videoBg.classList.remove("tw-scale-100", "tw-opacity-100")
        videoBg.classList.add("tw-scale-0", "tw-opacity-0")
    }, 400)
    document.body.classList.remove("modal-open")
}

document.addEventListener('DOMContentLoaded', function() {
    const openVideoButton = document.querySelector(/* selector for open video button */);
    if(openVideoButton) openVideoButton.addEventListener('click', openVideo);
});

/**
 * Animations
 */

document.addEventListener('DOMContentLoaded', function() {
    if (typeof Typed !== 'undefined') {
        new Typed('#prompts-sample', {
            strings: ["How to solve a rubik's cube? Step by step guide", 
                        "What's Pixa playground?", 
                        "How to build an AI SaaS App?", 
                        "How to integrate Pixa API?"],
            typeSpeed: 80,
            smartBackspace: true, 
            loop: true,
            backDelay: 2000,
        });
    } else {
        console.warn("Typed.js library not found.");
    }

    if (typeof gsap !== 'undefined' && typeof ScrollTrigger !== 'undefined') {
        gsap.registerPlugin(ScrollTrigger);
        gsap.to(".reveal-up", {
            opacity: 0,
            y: "100%",
        });

        gsap.to("#dashboard", {
            scale: 1,
            translateY: 0,
            rotateX: "0deg",
            width: window.innerWidth > RESPONSIVE_WIDTH ? "80vw" : "90vw",
            height: "90vh",
            minHeight: "500px",
            scrollTrigger: {
                trigger: "#hero-section",
                start: window.innerWidth > RESPONSIVE_WIDTH ? "top 30%" : "top 20%",
                end: window.innerWidth > RESPONSIVE_WIDTH ? "bottom 70%" : "bottom 80%",
                scrub: true,
            },
            onComplete: function() {
                const dashboard = document.getElementById('dashboard');
                if (dashboard) {
                    const isDesktop = window.innerWidth >= RESPONSIVE_WIDTH;
                    dashboard.style.width = isDesktop ? "80vw" : "90vw";
                    dashboard.style.height = "90vh";
                    dashboard.style.minHeight = "500px";
                }
            }
        });

        const faqAccordion = document.querySelectorAll('.faq-accordion');
        faqAccordion.forEach(function (btn) {
            btn.addEventListener('click', function () {
                this.classList.toggle('active');
                let content = this.nextElementSibling;
                let icon = this.querySelector(".bi-plus");
                if (content.style.maxHeight === '240px') {
                    content.style.maxHeight = '0px';
                    content.style.padding = '0px 18px';
                    if(icon) icon.style.transform = "rotate(0deg)";
                } else {
                    content.style.maxHeight = '240px';
                    content.style.padding = '20px 18px';
                    if(icon) icon.style.transform = "rotate(45deg)";
                }
            });
        });

        const sections = gsap.utils.toArray("section");
        sections.forEach((sec) => {
            const revealUpElements = sec.querySelectorAll(".reveal-up");
            if (revealUpElements.length > 0) {
                const revealUptimeline = gsap.timeline({
                    paused: true,
                    scrollTrigger: {
                        trigger: sec,
                        start: "10% 80%",
                        end: "20% 90%",
                    }
                });
                revealUptimeline.to(revealUpElements, {
                    opacity: 1,
                    duration: 0.8,
                    y: "0%",
                    stagger: 0.2,
                });
            }
        });
    } else {
        console.warn("GSAP or ScrollTrigger library not found.");
    }
});
