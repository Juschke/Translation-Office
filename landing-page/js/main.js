// Translation Office Landing Page - Main JavaScript

// ========================================
// Navigation & Scroll Behavior
// ========================================

// Navbar scroll effect
window.addEventListener('scroll', function() {
    const navbar = document.getElementById('navbar');
    if (window.scrollY > 50) {
        navbar.classList.add('scrolled');
    } else {
        navbar.classList.remove('scrolled');
    }
});

// Mobile menu toggle
const mobileMenuButton = document.getElementById('mobile-menu-button');
const mobileMenu = document.getElementById('mobile-menu');

if (mobileMenuButton && mobileMenu) {
    mobileMenuButton.addEventListener('click', function() {
        mobileMenu.classList.toggle('hidden');
    });

    // Close mobile menu when clicking on a link
    const mobileLinks = mobileMenu.querySelectorAll('a');
    mobileLinks.forEach(link => {
        link.addEventListener('click', function() {
            mobileMenu.classList.add('hidden');
        });
    });
}

// Smooth scroll for anchor links
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function(e) {
        const href = this.getAttribute('href');

        // Skip if it's just "#"
        if (href === '#') {
            e.preventDefault();
            return;
        }

        const target = document.querySelector(href);
        if (target) {
            e.preventDefault();
            const navbarHeight = document.getElementById('navbar').offsetHeight;
            const targetPosition = target.getBoundingClientRect().top + window.pageYOffset - navbarHeight;

            window.scrollTo({
                top: targetPosition,
                behavior: 'smooth'
            });
        }
    });
});

// ========================================
// Form Handling
// ========================================

const demoForm = document.getElementById('demo-form');

if (demoForm) {
    demoForm.addEventListener('submit', function(e) {
        e.preventDefault();

        // Get form data
        const formData = new FormData(demoForm);
        const data = {
            name: formData.get('name'),
            email: formData.get('email'),
            company: formData.get('company'),
            phone: formData.get('phone') || ''
        };

        // Validate email
        if (!isValidEmail(data.email)) {
            showFormMessage('Bitte geben Sie eine gültige E-Mail-Adresse ein.', 'error');
            return;
        }

        // Show loading state
        const submitButton = demoForm.querySelector('button[type="submit"]');
        const originalButtonText = submitButton.innerHTML;
        submitButton.disabled = true;
        submitButton.innerHTML = '<span class="spinner inline-block mr-2"></span> Wird gesendet...';

        // Simulate API call (replace with actual endpoint)
        setTimeout(() => {
            console.log('Demo request:', data);

            // Success state
            submitButton.innerHTML = '✅ Erfolgreich gesendet!';
            submitButton.classList.add('bg-green-600', 'hover:bg-green-700');
            submitButton.classList.remove('bg-primary', 'hover:bg-primary-dark');

            // Show success message
            showFormMessage('Vielen Dank! Wir melden uns in Kürze bei Ihnen.', 'success');

            // Reset form
            demoForm.reset();

            // Reset button after 3 seconds
            setTimeout(() => {
                submitButton.disabled = false;
                submitButton.innerHTML = originalButtonText;
                submitButton.classList.remove('bg-green-600', 'hover:bg-green-700');
                submitButton.classList.add('bg-primary', 'hover:bg-primary-dark');
            }, 3000);

            // Track conversion (Google Analytics, Meta Pixel, etc.)
            trackConversion('demo_request', data);

        }, 1500);
    });
}

// Email validation helper
function isValidEmail(email) {
    const re = /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
    return re.test(String(email).toLowerCase());
}

// Show form message
function showFormMessage(message, type = 'success') {
    const formContainer = demoForm.parentElement;

    // Remove existing messages
    const existingMessage = formContainer.querySelector('.form-message');
    if (existingMessage) {
        existingMessage.remove();
    }

    // Create message element
    const messageDiv = document.createElement('div');
    messageDiv.className = `form-message mt-4 p-4 rounded-lg ${type === 'success' ? 'bg-green-100 text-green-800 border border-green-200' : 'bg-red-100 text-red-800 border border-red-200'}`;
    messageDiv.textContent = message;

    // Insert after form
    formContainer.insertBefore(messageDiv, demoForm.nextSibling);

    // Remove after 5 seconds
    setTimeout(() => {
        messageDiv.remove();
    }, 5000);
}

// ========================================
// Analytics & Tracking
// ========================================

function trackConversion(eventName, data) {
    // Google Analytics 4
    if (typeof gtag !== 'undefined') {
        gtag('event', eventName, {
            event_category: 'engagement',
            event_label: data.company || 'Unknown',
            value: 1
        });
    }

    // Meta Pixel (Facebook)
    if (typeof fbq !== 'undefined') {
        fbq('track', 'Lead', {
            content_name: eventName,
            content_category: 'demo_request'
        });
    }

    // Console log for debugging
    console.log('Conversion tracked:', eventName, data);
}

// Track outbound links
document.querySelectorAll('a[href^="http"]').forEach(link => {
    link.addEventListener('click', function(e) {
        const url = this.href;
        if (typeof gtag !== 'undefined') {
            gtag('event', 'click', {
                event_category: 'outbound',
                event_label: url
            });
        }
    });
});

// ========================================
// Scroll Reveal Animations
// ========================================

function revealOnScroll() {
    const reveals = document.querySelectorAll('.reveal-on-scroll');

    reveals.forEach(element => {
        const windowHeight = window.innerHeight;
        const elementTop = element.getBoundingClientRect().top;
        const elementVisible = 150;

        if (elementTop < windowHeight - elementVisible) {
            element.classList.add('reveal');
        }
    });
}

window.addEventListener('scroll', revealOnScroll);
revealOnScroll(); // Initial check

// ========================================
// Stats Counter Animation
// ========================================

function animateCounters() {
    const counters = document.querySelectorAll('.stat-number');
    const speed = 200; // Animation speed

    counters.forEach(counter => {
        const animate = () => {
            const value = +counter.getAttribute('data-target');
            const data = +counter.innerText.replace(/[^0-9]/g, '');
            const time = value / speed;

            if (data < value) {
                counter.innerText = Math.ceil(data + time);
                setTimeout(animate, 1);
            } else {
                counter.innerText = counter.getAttribute('data-format') || value;
            }
        };

        // Start animation when element is in viewport
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting && !counter.classList.contains('counted')) {
                    counter.classList.add('counted');
                    animate();
                }
            });
        }, { threshold: 0.5 });

        observer.observe(counter);
    });
}

// Initialize counter animation
animateCounters();

// ========================================
// Page Load Optimizations
// ========================================

// Lazy load images
if ('loading' in HTMLImageElement.prototype) {
    const images = document.querySelectorAll('img[data-src]');
    images.forEach(img => {
        img.src = img.dataset.src;
    });
} else {
    // Fallback for browsers that don't support lazy loading
    const script = document.createElement('script');
    script.src = 'https://cdnjs.cloudflare.com/ajax/libs/lazysizes/5.3.2/lazysizes.min.js';
    document.body.appendChild(script);
}

// Preload critical resources
function preloadResources() {
    const criticalImages = [
        '/landing-page/images/dashboard-mockup.png',
        '/landing-page/images/benefits-illustration.png'
    ];

    criticalImages.forEach(src => {
        const link = document.createElement('link');
        link.rel = 'preload';
        link.as = 'image';
        link.href = src;
        document.head.appendChild(link);
    });
}

// ========================================
// Cookie Consent (GDPR Compliance)
// ========================================

function showCookieConsent() {
    const cookieConsent = localStorage.getItem('cookieConsent');

    if (!cookieConsent) {
        const consentBanner = document.createElement('div');
        consentBanner.className = 'fixed bottom-0 left-0 right-0 bg-gray-900 text-white p-4 z-50 shadow-2xl';
        consentBanner.innerHTML = `
            <div class="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
                <p class="text-sm">
                    Wir verwenden Cookies, um Ihre Erfahrung zu verbessern. Mit der Nutzung unserer Website stimmen Sie unserer
                    <a href="#" class="underline hover:text-gray-300">Datenschutzerklärung</a> zu.
                </p>
                <div class="flex gap-4">
                    <button id="accept-cookies" class="bg-primary hover:bg-primary-dark text-white px-6 py-2 rounded-lg transition">
                        Akzeptieren
                    </button>
                    <button id="decline-cookies" class="bg-gray-700 hover:bg-gray-600 text-white px-6 py-2 rounded-lg transition">
                        Ablehnen
                    </button>
                </div>
            </div>
        `;

        document.body.appendChild(consentBanner);

        document.getElementById('accept-cookies').addEventListener('click', () => {
            localStorage.setItem('cookieConsent', 'accepted');
            consentBanner.remove();
            // Initialize analytics
            initializeAnalytics();
        });

        document.getElementById('decline-cookies').addEventListener('click', () => {
            localStorage.setItem('cookieConsent', 'declined');
            consentBanner.remove();
        });
    } else if (cookieConsent === 'accepted') {
        initializeAnalytics();
    }
}

function initializeAnalytics() {
    // Initialize Google Analytics, Meta Pixel, etc.
    console.log('Analytics initialized');
}

// Show cookie consent on page load
window.addEventListener('load', showCookieConsent);

// ========================================
// Accessibility Enhancements
// ========================================

// Skip to main content
document.addEventListener('DOMContentLoaded', () => {
    const skipLink = document.createElement('a');
    skipLink.href = '#hero';
    skipLink.textContent = 'Zum Hauptinhalt springen';
    skipLink.className = 'sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-50 focus:bg-primary focus:text-white focus:px-4 focus:py-2 focus:rounded';
    document.body.insertBefore(skipLink, document.body.firstChild);
});

// Keyboard navigation for mobile menu
if (mobileMenuButton) {
    mobileMenuButton.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            mobileMenu.classList.toggle('hidden');
        }
    });
}

// ========================================
// Performance Monitoring
// ========================================

// Log page load performance
window.addEventListener('load', () => {
    if ('performance' in window) {
        const perfData = window.performance.timing;
        const pageLoadTime = perfData.loadEventEnd - perfData.navigationStart;
        console.log(`Page loaded in ${pageLoadTime}ms`);

        // Track in analytics
        if (typeof gtag !== 'undefined') {
            gtag('event', 'timing_complete', {
                name: 'load',
                value: pageLoadTime,
                event_category: 'Page Performance'
            });
        }
    }
});

console.log('Translation Office Landing Page loaded successfully! 🚀');
