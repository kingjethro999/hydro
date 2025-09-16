/**
 * Advanced Hydro Web Interface - Main JavaScript
 * Features: Interactive animations, API integration, real-time updates, and advanced UX
 */

class HydroWebApp {
    constructor() {
        this.isLoaded = false;
        this.apiBaseUrl = window.location.origin;
        this.animationQueue = [];
        this.observers = new Map();
        this.state = {
            currentSection: 'home',
            isLoading: false,
            userPreferences: this.loadUserPreferences(),
            theme: 'light'
        };
        
        this.init();
    }

    async init() {
        try {
            this.setupEventListeners();
            this.initializeAnimations();
            this.setupIntersectionObservers();
            this.loadApiData();
            this.initializeAIFeatures();
            this.initializePluginSystem();
            this.setupKeyboardNavigation();
            this.setupPerformanceMonitoring();
            this.initializeTheme();
            this.initializeSPARouting();
            
            this.isLoaded = true;
            this.triggerCustomEvent('app:loaded');
            
            console.log('🚀 Hydro Web App initialized successfully');
        } catch (error) {
            console.error('❌ Failed to initialize Hydro Web App:', error);
            this.showErrorNotification('Failed to initialize application');
        }
    }

    setupEventListeners() {
        // Smooth scroll for navigation links
        document.addEventListener('click', (e) => {
            const link = e.target.closest('a[href^="#"]');
            if (link) {
                e.preventDefault();
                this.smoothScrollToSection(link.getAttribute('href').substring(1));
            }
        });

        // Documentation tab switching
        document.addEventListener('click', (e) => {
            const tab = e.target.closest('.doc-tab');
            if (tab) {
                e.preventDefault();
                this.switchDocTab(tab.dataset.tab);
            }
        });

        // SPA routing for hash changes
        window.addEventListener('hashchange', () => {
            this.handleHashChange();
        });

        // Mobile menu toggle
        const mobileMenuBtn = document.getElementById('mobile-menu-btn');
        const mobileMenu = document.getElementById('mobile-menu');
        
        if (mobileMenuBtn && mobileMenu) {
            mobileMenuBtn.addEventListener('click', () => {
                this.toggleMobileMenu();
            });
        }

        // Close mobile menu when clicking outside
        document.addEventListener('click', (e) => {
            if (mobileMenu && !mobileMenu.contains(e.target) && !mobileMenuBtn.contains(e.target)) {
                this.closeMobileMenu();
            }
        });

        // Hero button interactions
        this.setupHeroButtons();

        // Window resize handler
        window.addEventListener('resize', this.debounce(() => {
            this.handleResize();
        }, 250));

        // Scroll handler with throttling
        window.addEventListener('scroll', this.throttle(() => {
            this.handleScroll();
        }, 16));

        // Keyboard navigation
        document.addEventListener('keydown', (e) => {
            this.handleKeyboardNavigation(e);
        });
    }

    setupHeroButtons() {
        const getStartedBtn = document.querySelector('button:contains("Get Started")');
        const viewDocsBtn = document.querySelector('button:contains("View Documentation")');

        if (getStartedBtn) {
            getStartedBtn.addEventListener('click', () => {
                this.animateButtonClick(getStartedBtn);
                this.smoothScrollToSection('docs');
                this.trackEvent('button_click', { button: 'get_started' });
            });
        }

        if (viewDocsBtn) {
            viewDocsBtn.addEventListener('click', () => {
                this.animateButtonClick(viewDocsBtn);
                this.smoothScrollToSection('docs');
                this.trackEvent('button_click', { button: 'view_docs' });
            });
        }
    }

    initializeAnimations() {
        // Stagger animations for feature cards
        this.staggerFeatureCards();
        
        // Initialize parallax effects
        this.initializeParallax();
        
        // Setup floating elements
        this.setupFloatingElements();
        
        // Initialize progress indicators
        this.initializeProgressIndicators();
    }

    staggerFeatureCards() {
        const cards = document.querySelectorAll('#features .card-hover');
        cards.forEach((card, index) => {
            card.style.opacity = '0';
            card.style.transform = 'translateY(30px)';
            card.style.transition = 'all 0.6s ease-out';
            
            // Stagger the animation
            setTimeout(() => {
                card.style.opacity = '1';
                card.style.transform = 'translateY(0)';
            }, index * 150);
        });
    }

    initializeParallax() {
        const parallaxElements = document.querySelectorAll('.parallax');
        
        parallaxElements.forEach(element => {
            const observer = new IntersectionObserver((entries) => {
                entries.forEach(entry => {
                    if (entry.isIntersecting) {
                        this.animateParallaxElement(entry.target);
                    }
                });
            }, { threshold: 0.1 });
            
            observer.observe(element);
        });
    }

    animateParallaxElement(element) {
        const speed = element.dataset.speed || 0.5;
        
        const updateParallax = () => {
            const scrolled = window.pageYOffset;
            const rate = scrolled * -speed;
            element.style.transform = `translateY(${rate}px)`;
        };
        
        window.addEventListener('scroll', updateParallax);
    }

    setupFloatingElements() {
        const floatingElements = document.querySelectorAll('.animate-float');
        
        floatingElements.forEach((element, index) => {
            // Add random delay and duration for more natural movement
            const delay = Math.random() * 2;
            const duration = 3 + Math.random() * 2;
            
            element.style.animationDelay = `${delay}s`;
            element.style.animationDuration = `${duration}s`;
        });
    }

    initializeProgressIndicators() {
        // Create progress bars for loading states
        this.createProgressIndicator();
    }

    createProgressIndicator() {
        const progressBar = document.createElement('div');
        progressBar.id = 'progress-bar';
        progressBar.className = 'fixed top-0 left-0 w-full h-1 bg-hydro-blue transform -translate-y-full transition-transform duration-300 z-50';
        progressBar.style.background = 'linear-gradient(90deg, #3B82F6, #8B5CF6, #06B6D4)';
        document.body.appendChild(progressBar);
    }

    setupIntersectionObservers() {
        // Observe sections for active navigation
        const sections = ['home', 'features', 'docs', 'examples', 'api'];
        
        sections.forEach(sectionId => {
            const section = document.getElementById(sectionId);
            if (section) {
                const observer = new IntersectionObserver((entries) => {
                    entries.forEach(entry => {
                        if (entry.isIntersecting) {
                            this.updateActiveNavigation(sectionId);
                            this.animateSectionContent(sectionId);
                        }
                    });
                }, { 
                    threshold: 0.3,
                    rootMargin: '-80px 0px -80px 0px'
                });
                
                observer.observe(section);
                this.observers.set(sectionId, observer);
            }
        });
    }

    updateActiveNavigation(sectionId) {
        this.state.currentSection = sectionId;
        
        // Update navigation links
        const navLinks = document.querySelectorAll('.nav-link');
        navLinks.forEach(link => {
            const href = link.getAttribute('href');
            const linkSection = href ? href.substring(1) : 'home';
            
            if (linkSection === sectionId) {
                link.classList.add('text-hydro-blue', 'font-semibold');
                link.classList.remove('text-gray-600');
            } else {
                link.classList.remove('text-hydro-blue', 'font-semibold');
                link.classList.add('text-gray-600');
            }
        });
    }

    animateSectionContent(sectionId) {
        const section = document.getElementById(sectionId);
        if (!section) return;

        // Animate elements based on section
        switch (sectionId) {
            case 'features':
                this.animateFeatureCards();
                break;
            case 'docs':
                this.animateDocsContent();
                break;
            case 'examples':
                this.animateExamples();
                break;
            case 'api':
                this.animateApiContent();
                break;
        }
    }

    animateFeatureCards() {
        const cards = document.querySelectorAll('#features .card-hover');
        cards.forEach((card, index) => {
            setTimeout(() => {
                card.classList.add('animate-slide-up');
            }, index * 100);
        });
    }

    animateDocsContent() {
        const elements = document.querySelectorAll('#docs .bg-white');
        elements.forEach((element, index) => {
            setTimeout(() => {
                element.classList.add('animate-slide-up');
            }, index * 200);
        });
    }

    animateExamples() {
        const examples = document.querySelectorAll('#examples .bg-gradient-to-br');
        examples.forEach((example, index) => {
            setTimeout(() => {
                example.classList.add('animate-slide-up');
            }, index * 150);
        });
    }

    animateApiContent() {
        const apiItems = document.querySelectorAll('#api .border-l-4');
        apiItems.forEach((item, index) => {
            setTimeout(() => {
                item.classList.add('animate-slide-up');
            }, index * 200);
        });
    }

    async loadApiData() {
        try {
            this.showProgressBar();
            
            // Load version information
            const versionData = await this.fetchApiData('/api/version');
            this.updateVersionInfo(versionData);
            
            // Load status information
            const statusData = await this.fetchApiData('/api/status');
            this.updateStatusInfo(statusData);
            
            this.hideProgressBar();
        } catch (error) {
            console.warn('Failed to load API data:', error);
            this.hideProgressBar();
        }
    }

    async fetchApiData(endpoint) {
        try {
            const response = await fetch(`${this.apiBaseUrl}${endpoint}`);
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}`);
            }
            return await response.json();
        } catch (error) {
            console.warn(`Failed to fetch ${endpoint}:`, error);
            return null;
        }
    }

    updateVersionInfo(data) {
        if (!data) return;
        
        // Update any version displays on the page
        const versionElements = document.querySelectorAll('[data-version]');
        versionElements.forEach(element => {
            element.textContent = data.hydro?.version || '1.0.0';
        });
    }

    updateStatusInfo(data) {
        if (!data) return;
        
        // Update status indicators
        const statusElements = document.querySelectorAll('[data-status]');
        statusElements.forEach(element => {
            element.textContent = data.server || 'unknown';
        });
    }

    // AI Assistant functionality
    async initializeAIFeatures() {
        try {
            // Load AI capabilities
            const aiData = await this.fetchApiData('/api/ai/capabilities');
            if (aiData) {
                this.state.aiCapabilities = aiData;
                this.updateAIDashboard();
            }
        } catch (error) {
            console.warn('Failed to initialize AI features:', error);
        }
    }

    async processAIQuery(query) {
        try {
            const response = await fetch(`${this.apiBaseUrl}/api/ai/query`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ query })
            });
            
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}`);
            }
            
            return await response.json();
        } catch (error) {
            console.error('Failed to process AI query:', error);
            return { error: 'Failed to process query' };
        }
    }

    updateAIDashboard() {
        // Update AI-related UI elements
        const aiStats = document.querySelectorAll('[data-ai-stats]');
        aiStats.forEach(element => {
            const statType = element.dataset.aiStats;
            if (this.state.aiCapabilities && this.state.aiCapabilities[statType]) {
                element.textContent = this.state.aiCapabilities[statType];
            }
        });
    }

    // Plugin System functionality
    async initializePluginSystem() {
        try {
            // Load installed plugins
            const pluginsData = await this.fetchApiData('/api/plugins');
            if (pluginsData) {
                this.state.plugins = pluginsData;
                this.updatePluginDashboard();
            }
        } catch (error) {
            console.warn('Failed to initialize plugin system:', error);
        }
    }

    async installPlugin(pluginName) {
        try {
            const response = await fetch(`${this.apiBaseUrl}/api/plugins/install`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ plugin: pluginName })
            });
            
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}`);
            }
            
            const result = await response.json();
            this.showSuccessNotification(`Plugin "${pluginName}" installed successfully`);
            return result;
        } catch (error) {
            console.error('Failed to install plugin:', error);
            this.showErrorNotification(`Failed to install plugin "${pluginName}"`);
            return { error: 'Installation failed' };
        }
    }

    updatePluginDashboard() {
        // Update plugin-related UI elements
        const pluginStats = document.querySelectorAll('[data-plugin-stats]');
        pluginStats.forEach(element => {
            const statType = element.dataset.pluginStats;
            if (this.state.plugins && this.state.plugins[statType]) {
                element.textContent = this.state.plugins[statType];
            }
        });
    }

    // Interactive Demo functionality
    async runDemo(demoType) {
        const terminal = document.getElementById('terminal-demo');
        if (!terminal) return;

        // Clear existing content
        terminal.innerHTML = '';

        const demos = {
            analyze: {
                commands: [
                    { cmd: 'hydro analyze --complexity', output: '📏 Analyzing complexity...\n⚠️  Found 12 complex functions\n• src/utils/helpers.ts:45 (complexity: 8)\n• src/components/UserCard.tsx:23 (complexity: 6)\n• src/services/api.ts:67 (complexity: 7)\n\n💡 Consider breaking down complex functions into smaller, focused ones' },
                    { cmd: 'hydro analyze --cycles', output: '🔄 Analyzing dependencies...\n✅ No circular dependencies found\n📊 Dependency graph is clean and well-structured' }
                ]
            },
            security: {
                commands: [
                    { cmd: 'hydro analyze --security', output: '🔒 Security analysis started...\n⚠️  Found 3 security issues:\n• src/config/database.ts:12 - Hardcoded password detected\n• src/utils/auth.ts:45 - Potential SQL injection vulnerability\n• src/api/users.ts:23 - Missing input validation\n\n🛡️ Recommendations:\n• Use environment variables for sensitive data\n• Implement parameterized queries\n• Add input validation middleware' }
                ]
            },
            ai: {
                commands: [
                    { cmd: 'hydro ai "How can I improve this function?"', output: '🤖 AI Analysis:\n\n📝 Function Analysis:\n• Function is 45 lines (consider breaking into smaller functions)\n• High cyclomatic complexity (8) - add early returns\n• Missing error handling for edge cases\n• Consider using async/await instead of callbacks\n\n💡 Suggested improvements:\n1. Extract validation logic into separate function\n2. Add try-catch blocks for error handling\n3. Use Promise.all() for parallel operations\n4. Add JSDoc comments for better documentation' }
                ]
            },
            plugin: {
                commands: [
                    { cmd: 'hydro plugin list', output: '📦 Installed Plugins:\n\n• performance-analyzer v1.0.0 - Performance bottleneck detection\n• accessibility-analyzer v1.0.0 - WCAG compliance checking\n• custom-command v1.0.0 - Additional utility commands\n\n🔧 Available Commands:\n• hydro stats - Project statistics\n• hydro health - Health metrics\n• hydro summary - Project summary' },
                    { cmd: 'hydro plugin install performance-analyzer', output: '📥 Installing performance-analyzer...\n✅ Plugin installed successfully!\n🔧 Added performance analysis to hydro analyze command\n📊 New metrics available: N+1 queries, memory leaks, blocking operations' }
                ]
            },
            generate: {
                commands: [
                    { cmd: 'hydro generate component UserCard', output: '🎨 Generating React component...\n\n✅ Created src/components/UserCard.tsx\n✅ Created src/components/UserCard.test.tsx\n✅ Created src/components/UserCard.stories.tsx\n\n📝 Component includes:\n• TypeScript interfaces\n• PropTypes validation\n• Unit tests with Jest\n• Storybook stories\n• Accessibility attributes' }
                ]
            },
            visualize: {
                commands: [
                    { cmd: 'hydro codemap --type dependencies', output: '🗺️  Generating dependency map...\n\n📊 Dependency Analysis:\n• 47 modules analyzed\n• 156 dependencies mapped\n• 3 circular dependencies found\n• Average coupling: 2.3\n\n📁 Generated files:\n• dependency-map.dot\n• dependency-map.html\n• dependency-map.json\n\n💡 Use Graphviz to render: dot -Tpng dependency-map.dot -o map.png' }
                ]
            }
        };

        const demo = demos[demoType];
        if (!demo) return;

        // Animate terminal output
        for (let i = 0; i < demo.commands.length; i++) {
            const command = demo.commands[i];
            
            // Add command line
            const commandLine = document.createElement('div');
            commandLine.className = 'terminal-line';
            commandLine.innerHTML = `<span class="text-blue-400">$</span> ${command.cmd}`;
            terminal.appendChild(commandLine);

            // Wait a bit, then add output
            await this.delay(1000);
            
            const output = document.createElement('div');
            output.className = 'terminal-output';
            output.innerHTML = command.output.replace(/\n/g, '<br>');
            terminal.appendChild(output);

            // Wait before next command
            if (i < demo.commands.length - 1) {
                await this.delay(1500);
            }
        }
    }

    delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    setupKeyboardNavigation() {
        this.keyboardShortcuts = {
            'h': () => this.smoothScrollToSection('home'),
            'f': () => this.smoothScrollToSection('features'),
            'd': () => this.smoothScrollToSection('docs'),
            'c': () => this.smoothScrollToSection('commands'),
            'e': () => this.smoothScrollToSection('examples'),
            'a': () => this.smoothScrollToSection('api'),
            'Escape': () => this.closeMobileMenu(),
            'Tab': () => this.handleTabNavigation(),
            'Enter': () => this.handleEnterKey()
        };
    }

    handleKeyboardNavigation(e) {
        // Only handle shortcuts when not typing in input fields
        if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') {
            return;
        }

        const key = e.key.toLowerCase();
        if (this.keyboardShortcuts[key]) {
            e.preventDefault();
            this.keyboardShortcuts[key]();
        }
    }

    handleTabNavigation() {
        // Handle tab navigation within documentation tabs
        const activeTab = document.querySelector('.doc-tab.active');
        if (activeTab) {
            const nextTab = activeTab.nextElementSibling;
            if (nextTab && nextTab.classList.contains('doc-tab')) {
                this.switchDocTab(nextTab.dataset.tab);
            }
        }
    }

    handleEnterKey() {
        // Handle enter key for active elements
        const activeElement = document.activeElement;
        if (activeElement && activeElement.classList.contains('doc-tab')) {
            this.switchDocTab(activeElement.dataset.tab);
        }
    }

    switchDocTab(tabId) {
        // Hide all tab contents
        const allTabs = document.querySelectorAll('.doc-content');
        allTabs.forEach(tab => tab.classList.add('hidden'));

        // Remove active class from all tab buttons
        const allTabButtons = document.querySelectorAll('.doc-tab');
        allTabButtons.forEach(button => {
            button.classList.remove('active', 'text-hydro-blue', 'border-hydro-blue');
            button.classList.add('text-gray-600', 'border-gray-200');
        });

        // Show selected tab content
        const selectedTab = document.getElementById(tabId);
        if (selectedTab) {
            selectedTab.classList.remove('hidden');
        }

        // Activate selected tab button
        const selectedButton = document.querySelector(`[data-tab="${tabId}"]`);
        if (selectedButton) {
            selectedButton.classList.add('active', 'text-hydro-blue', 'border-hydro-blue');
            selectedButton.classList.remove('text-gray-600', 'border-gray-200');
        }

        // Update URL hash for SPA behavior
        if (window.location.hash !== `#${tabId}`) {
            history.pushState(null, null, `#${tabId}`);
        }

        // Track analytics
        this.trackEvent('tab_switch', { tab: tabId });
    }

    handleHashChange() {
        const hash = window.location.hash.substring(1);
        if (hash && ['getting-started', 'configuration', 'analyzers', 'integration', 'troubleshooting'].includes(hash)) {
            this.switchDocTab(hash);
        } else if (hash) {
            this.smoothScrollToSection(hash);
        }
    }

    smoothScrollToSection(sectionId) {
        const section = document.getElementById(sectionId);
        if (!section) return;

        const offsetTop = section.offsetTop - 80; // Account for fixed header
        
        window.scrollTo({
            top: offsetTop,
            behavior: 'smooth'
        });

        // Close mobile menu if open
        this.closeMobileMenu();
    }

    toggleMobileMenu() {
        const mobileMenu = document.getElementById('mobile-menu');
        if (mobileMenu) {
            mobileMenu.classList.toggle('hidden');
        }
    }

    closeMobileMenu() {
        const mobileMenu = document.getElementById('mobile-menu');
        if (mobileMenu) {
            mobileMenu.classList.add('hidden');
        }
    }

    handleResize() {
        // Update any responsive elements
        this.updateResponsiveElements();
    }

    handleScroll() {
        // Update scroll-based animations
        this.updateScrollAnimations();
        
        // Update progress bar
        this.updateProgressBar();
    }

    updateScrollAnimations() {
        const scrolled = window.pageYOffset;
        const windowHeight = window.innerHeight;
        
        // Parallax effects
        const parallaxElements = document.querySelectorAll('.parallax');
        parallaxElements.forEach(element => {
            const speed = element.dataset.speed || 0.5;
            const yPos = -(scrolled * speed);
            element.style.transform = `translateY(${yPos}px)`;
        });
    }

    updateProgressBar() {
        const progressBar = document.getElementById('progress-bar');
        if (!progressBar) return;

        const scrolled = window.pageYOffset;
        const maxHeight = document.documentElement.scrollHeight - window.innerHeight;
        const progress = (scrolled / maxHeight) * 100;
        
        progressBar.style.transform = `translateY(0)`;
        progressBar.style.width = `${progress}%`;
    }

    showProgressBar() {
        const progressBar = document.getElementById('progress-bar');
        if (progressBar) {
            progressBar.style.transform = 'translateY(0)';
        }
    }

    hideProgressBar() {
        const progressBar = document.getElementById('progress-bar');
        if (progressBar) {
            setTimeout(() => {
                progressBar.style.transform = 'translateY(-100%)';
            }, 500);
        }
    }

    animateButtonClick(button) {
        button.style.transform = 'scale(0.95)';
        setTimeout(() => {
            button.style.transform = 'scale(1)';
        }, 150);
    }

    setupPerformanceMonitoring() {
        // Monitor Core Web Vitals
        this.measureCoreWebVitals();
        
        // Monitor custom metrics
        this.measureCustomMetrics();
    }

    measureCoreWebVitals() {
        // Largest Contentful Paint
        new PerformanceObserver((entryList) => {
            const entries = entryList.getEntries();
            const lastEntry = entries[entries.length - 1];
            console.log('LCP:', lastEntry.startTime);
        }).observe({ entryTypes: ['largest-contentful-paint'] });

        // First Input Delay
        new PerformanceObserver((entryList) => {
            const entries = entryList.getEntries();
            entries.forEach(entry => {
                console.log('FID:', entry.processingStart - entry.startTime);
            });
        }).observe({ entryTypes: ['first-input'] });
    }

    measureCustomMetrics() {
        // Measure time to interactive
        const tti = performance.now();
        console.log('Time to Interactive:', tti);
        
        // Measure memory usage
        if (performance.memory) {
            console.log('Memory Usage:', {
                used: Math.round(performance.memory.usedJSHeapSize / 1024 / 1024) + ' MB',
                total: Math.round(performance.memory.totalJSHeapSize / 1024 / 1024) + ' MB'
            });
        }
    }

    initializeTheme() {
        // Load saved theme preference
        const savedTheme = localStorage.getItem('hydro-theme');
        if (savedTheme) {
            this.state.theme = savedTheme;
            this.applyTheme(savedTheme);
        }
    }

    initializeSPARouting() {
        // Handle initial page load with hash
        if (window.location.hash) {
            this.handleHashChange();
        }

        // Set up popstate for browser back/forward
        window.addEventListener('popstate', () => {
            this.handleHashChange();
        });
    }

    applyTheme(theme) {
        document.documentElement.setAttribute('data-theme', theme);
        this.state.theme = theme;
        localStorage.setItem('hydro-theme', theme);
    }

    loadUserPreferences() {
        try {
            const saved = localStorage.getItem('hydro-preferences');
            return saved ? JSON.parse(saved) : {};
        } catch {
            return {};
        }
    }

    saveUserPreferences() {
        localStorage.setItem('hydro-preferences', JSON.stringify(this.state.userPreferences));
    }

    showErrorNotification(message) {
        const notification = document.createElement('div');
        notification.className = 'fixed top-4 right-4 bg-red-500 text-white px-6 py-3 rounded-lg shadow-lg z-50 transform translate-x-full transition-transform duration-300';
        notification.textContent = message;
        document.body.appendChild(notification);
        
        // Animate in
        setTimeout(() => {
            notification.style.transform = 'translateX(0)';
        }, 100);
        
        // Auto remove
        setTimeout(() => {
            notification.style.transform = 'translateX(100%)';
            setTimeout(() => {
                notification.remove();
            }, 300);
        }, 5000);
    }

    showSuccessNotification(message) {
        const notification = document.createElement('div');
        notification.className = 'fixed top-4 right-4 bg-green-500 text-white px-6 py-3 rounded-lg shadow-lg z-50 transform translate-x-full transition-transform duration-300';
        notification.textContent = message;
        document.body.appendChild(notification);
        
        // Animate in
        setTimeout(() => {
            notification.style.transform = 'translateX(0)';
        }, 100);
        
        // Auto remove
        setTimeout(() => {
            notification.style.transform = 'translateX(100%)';
            setTimeout(() => {
                notification.remove();
            }, 300);
        }, 3000);
    }

    trackEvent(eventName, properties = {}) {
        // Analytics tracking
        console.log('Event tracked:', eventName, properties);
        
        // Example: Google Analytics
        if (typeof gtag !== 'undefined') {
            gtag('event', eventName, properties);
        }
    }

    triggerCustomEvent(eventName, detail = {}) {
        const event = new CustomEvent(eventName, { detail });
        document.dispatchEvent(event);
    }

    // Utility functions
    debounce(func, wait) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    }

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

    // Public API
    getState() {
        return { ...this.state };
    }

    updateState(newState) {
        this.state = { ...this.state, ...newState };
        this.saveUserPreferences();
    }

    destroy() {
        // Cleanup observers
        this.observers.forEach(observer => observer.disconnect());
        this.observers.clear();
        
        // Remove event listeners
        window.removeEventListener('resize', this.handleResize);
        window.removeEventListener('scroll', this.handleScroll);
        
        console.log('🧹 Hydro Web App destroyed');
    }
}

// Initialize the app when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.hydroApp = new HydroWebApp();
});

// Global function for demo buttons
window.runDemo = function(demoType) {
    if (window.hydroApp) {
        window.hydroApp.runDemo(demoType);
    }
};

// Handle page visibility changes
document.addEventListener('visibilitychange', () => {
    if (window.hydroApp) {
        if (document.hidden) {
            window.hydroApp.triggerCustomEvent('app:hidden');
        } else {
            window.hydroApp.triggerCustomEvent('app:visible');
        }
    }
});

// Handle beforeunload
window.addEventListener('beforeunload', () => {
    if (window.hydroApp) {
        window.hydroApp.destroy();
    }
});

// Export for module systems
if (typeof module !== 'undefined' && module.exports) {
    module.exports = HydroWebApp;
}
