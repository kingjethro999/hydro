/**
 * Advanced Client-Side Routing System for Hydro Web Interface
 * Features: Smooth transitions, lazy loading, state management, and SEO-friendly URLs
 */

class HydroRouter {
    constructor() {
        this.routes = new Map();
        this.currentRoute = null;
        this.history = [];
        this.maxHistorySize = 50;
        this.transitionDuration = 300;
        this.isTransitioning = false;
        
        this.init();
    }

    init() {
        this.setupRoutes();
        this.bindEvents();
        this.handleInitialRoute();
        this.setupIntersectionObserver();
        this.setupPerformanceMonitoring();
    }

    setupRoutes() {
        // Define all routes with their handlers and metadata
        this.routes.set('/', {
            id: 'home',
            title: 'Hydro - Development Environment Catalyst',
            handler: () => this.showHomePage(),
            meta: {
                description: 'The unified development environment that automates code quality, dependency management, and project analysis.',
                keywords: 'development, code quality, dependency management, analysis, automation'
            }
        });

        this.routes.set('/features', {
            id: 'features',
            title: 'Features - Hydro',
            handler: () => this.showFeaturesPage(),
            meta: {
                description: 'Powerful features for modern development workflows including code analysis, dependency management, and project visualization.',
                keywords: 'features, code analysis, dependency management, visualization, automation'
            }
        });

        this.routes.set('/docs', {
            id: 'docs',
            title: 'Documentation - Hydro',
            handler: () => this.showDocsPage(),
            meta: {
                description: 'Comprehensive documentation and guides for getting started with Hydro.',
                keywords: 'documentation, guides, getting started, commands, API'
            }
        });

        this.routes.set('/examples', {
            id: 'examples',
            title: 'Examples - Hydro',
            handler: () => this.showExamplesPage(),
            meta: {
                description: 'Real-world examples and use cases showing how Hydro improves development workflows.',
                keywords: 'examples, use cases, tutorials, real-world, workflows'
            }
        });

        this.routes.set('/api', {
            id: 'api',
            title: 'API Reference - Hydro',
            handler: () => this.showApiPage(),
            meta: {
                description: 'Complete API reference for programmatic access to Hydro\'s analysis capabilities.',
                keywords: 'API, reference, programmatic, endpoints, integration'
            }
        });
    }

    bindEvents() {
        // Handle navigation clicks
        document.addEventListener('click', (e) => {
            const link = e.target.closest('a[href^="#"]');
            if (link) {
                e.preventDefault();
                const href = link.getAttribute('href');
                const route = href.substring(1) || '/';
                this.navigate(route);
            }
        });

        // Handle browser back/forward
        window.addEventListener('popstate', (e) => {
            const route = e.state?.route || window.location.pathname;
            this.navigate(route, false);
        });

        // Handle scroll-based navigation highlighting
        window.addEventListener('scroll', this.throttle(() => {
            this.updateActiveNavigation();
        }, 100));

        // Handle mobile menu
        const mobileMenuBtn = document.getElementById('mobile-menu-btn');
        const mobileMenu = document.getElementById('mobile-menu');
        
        if (mobileMenuBtn && mobileMenu) {
            mobileMenuBtn.addEventListener('click', () => {
                mobileMenu.classList.toggle('hidden');
            });
        }

        // Close mobile menu when clicking outside
        document.addEventListener('click', (e) => {
            if (mobileMenu && !mobileMenu.contains(e.target) && !mobileMenuBtn.contains(e.target)) {
                mobileMenu.classList.add('hidden');
            }
        });
    }

    handleInitialRoute() {
        const path = window.location.pathname || '/';
        this.navigate(path, false);
    }

    async navigate(route, pushState = true) {
        if (this.isTransitioning) return;
        
        const routeConfig = this.routes.get(route);
        if (!routeConfig) {
            this.show404();
            return;
        }

        this.isTransitioning = true;
        
        try {
            // Update URL
            if (pushState) {
                window.history.pushState({ route }, '', `#${route}`);
                this.history.push(route);
                if (this.history.length > this.maxHistorySize) {
                    this.history.shift();
                }
            }

            // Update page title and meta
            this.updatePageMeta(routeConfig);

            // Show loading indicator
            this.showLoadingIndicator();

            // Execute route handler
            await routeConfig.handler();

            // Update active navigation
            this.updateActiveNavigation(route);

            // Track page view
            this.trackPageView(route);

        } catch (error) {
            console.error('Navigation error:', error);
            this.showError('Failed to load page');
        } finally {
            this.hideLoadingIndicator();
            this.isTransitioning = false;
        }
    }

    updatePageMeta(routeConfig) {
        document.title = routeConfig.title;
        
        // Update meta description
        let metaDescription = document.querySelector('meta[name="description"]');
        if (!metaDescription) {
            metaDescription = document.createElement('meta');
            metaDescription.name = 'description';
            document.head.appendChild(metaDescription);
        }
        metaDescription.content = routeConfig.meta.description;

        // Update meta keywords
        let metaKeywords = document.querySelector('meta[name="keywords"]');
        if (!metaKeywords) {
            metaKeywords = document.createElement('meta');
            metaKeywords.name = 'keywords';
            document.head.appendChild(metaKeywords);
        }
        metaKeywords.content = routeConfig.meta.keywords;
    }

    updateActiveNavigation(route = null) {
        const currentRoute = route || this.getCurrentRouteFromScroll();
        const navLinks = document.querySelectorAll('.nav-link');
        
        navLinks.forEach(link => {
            const href = link.getAttribute('href');
            const linkRoute = href ? href.substring(1) || '/' : '/';
            
            if (linkRoute === currentRoute) {
                link.classList.add('text-hydro-blue', 'font-semibold');
                link.classList.remove('text-gray-600');
            } else {
                link.classList.remove('text-hydro-blue', 'font-semibold');
                link.classList.add('text-gray-600');
            }
        });
    }

    getCurrentRouteFromScroll() {
        const sections = ['home', 'features', 'docs', 'examples', 'api'];
        const scrollPosition = window.scrollY + 100;
        
        for (const section of sections) {
            const element = document.getElementById(section);
            if (element) {
                const rect = element.getBoundingClientRect();
                const elementTop = rect.top + window.scrollY;
                const elementBottom = elementTop + rect.height;
                
                if (scrollPosition >= elementTop && scrollPosition < elementBottom) {
                    return section === 'home' ? '/' : `/${section}`;
                }
            }
        }
        
        return '/';
    }

    showHomePage() {
        this.scrollToSection('home');
        this.animateHeroElements();
    }

    showFeaturesPage() {
        this.scrollToSection('features');
        this.animateFeatureCards();
    }

    showDocsPage() {
        this.scrollToSection('docs');
        this.animateDocsContent();
    }

    showExamplesPage() {
        this.scrollToSection('examples');
        this.animateExamples();
    }

    showApiPage() {
        this.scrollToSection('api');
        this.animateApiContent();
    }

    scrollToSection(sectionId) {
        const element = document.getElementById(sectionId);
        if (element) {
            const offsetTop = element.offsetTop - 80; // Account for fixed header
            window.scrollTo({
                top: offsetTop,
                behavior: 'smooth'
            });
        }
    }

    animateHeroElements() {
        const heroElements = document.querySelectorAll('#home .animate-fade-in, #home .animate-slide-up');
        heroElements.forEach((element, index) => {
            setTimeout(() => {
                element.style.opacity = '1';
                element.style.transform = 'translateY(0)';
            }, index * 200);
        });
    }

    animateFeatureCards() {
        const cards = document.querySelectorAll('#features .card-hover');
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.style.opacity = '1';
                    entry.target.style.transform = 'translateY(0)';
                }
            });
        }, { threshold: 0.1 });

        cards.forEach(card => {
            card.style.opacity = '0';
            card.style.transform = 'translateY(30px)';
            card.style.transition = 'all 0.6s ease-out';
            observer.observe(card);
        });
    }

    animateDocsContent() {
        const docsElements = document.querySelectorAll('#docs .animate-slide-up');
        this.animateElementsOnScroll(docsElements);
    }

    animateExamples() {
        const examples = document.querySelectorAll('#examples .bg-gradient-to-br');
        this.animateElementsOnScroll(examples);
    }

    animateApiContent() {
        const apiElements = document.querySelectorAll('#api .border-l-4');
        this.animateElementsOnScroll(apiElements);
    }

    animateElementsOnScroll(elements) {
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('animate-slide-up');
                    observer.unobserve(entry.target);
                }
            });
        }, { threshold: 0.1 });

        elements.forEach(element => {
            observer.observe(element);
        });
    }

    setupIntersectionObserver() {
        // Lazy load images and other content
        const imageObserver = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    const img = entry.target;
                    if (img.dataset.src) {
                        img.src = img.dataset.src;
                        img.classList.remove('lazy');
                    }
                    imageObserver.unobserve(img);
                }
            });
        });

        document.querySelectorAll('img[data-src]').forEach(img => {
            imageObserver.observe(img);
        });
    }

    setupPerformanceMonitoring() {
        // Monitor page load performance
        window.addEventListener('load', () => {
            const perfData = performance.getEntriesByType('navigation')[0];
            const loadTime = perfData.loadEventEnd - perfData.loadEventStart;
            
            console.log(`Page loaded in ${loadTime}ms`);
            
            // Send performance data to analytics (if implemented)
            this.trackPerformance(loadTime);
        });
    }

    showLoadingIndicator() {
        // Create loading overlay
        const loader = document.createElement('div');
        loader.id = 'page-loader';
        loader.className = 'fixed inset-0 bg-white bg-opacity-90 flex items-center justify-center z-50';
        loader.innerHTML = `
            <div class="flex flex-col items-center">
                <div class="w-12 h-12 border-4 border-hydro-blue border-t-transparent rounded-full animate-spin mb-4"></div>
                <p class="text-gray-600">Loading...</p>
            </div>
        `;
        document.body.appendChild(loader);
    }

    hideLoadingIndicator() {
        const loader = document.getElementById('page-loader');
        if (loader) {
            loader.remove();
        }
    }

    show404() {
        document.title = '404 - Page Not Found - Hydro';
        // Could implement a 404 page here
        console.log('404 - Page not found');
    }

    showError(message) {
        // Create error notification
        const errorDiv = document.createElement('div');
        errorDiv.className = 'fixed top-4 right-4 bg-red-500 text-white px-6 py-3 rounded-lg shadow-lg z-50';
        errorDiv.textContent = message;
        document.body.appendChild(errorDiv);
        
        setTimeout(() => {
            errorDiv.remove();
        }, 5000);
    }

    trackPageView(route) {
        // Analytics tracking (implement with your preferred analytics service)
        console.log(`Page view: ${route}`);
        
        // Example: Google Analytics
        if (typeof gtag !== 'undefined') {
            gtag('config', 'GA_MEASUREMENT_ID', {
                page_path: route
            });
        }
    }

    trackPerformance(loadTime) {
        // Performance tracking
        console.log(`Performance: ${loadTime}ms load time`);
        
        // Example: Send to analytics
        if (typeof gtag !== 'undefined') {
            gtag('event', 'timing_complete', {
                name: 'page_load',
                value: loadTime
            });
        }
    }

    // Utility function for throttling
    throttle(func, limit) {
        let inThrottle;
        return function() {
            const args = arguments;
            const context = this;
            if (!inThrottle) {
                func.apply(context, args);
                inThrottle = true;
                setTimeout(() => inThrottle = false, limit);
            }
        };
    }

    // Public API methods
    goBack() {
        if (this.history.length > 1) {
            this.history.pop(); // Remove current
            const previousRoute = this.history[this.history.length - 1];
            this.navigate(previousRoute, false);
        }
    }

    getCurrentRoute() {
        return this.currentRoute;
    }

    getHistory() {
        return [...this.history];
    }
}

// Initialize router when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.hydroRouter = new HydroRouter();
});

// Export for module systems
if (typeof module !== 'undefined' && module.exports) {
    module.exports = HydroRouter;
}
