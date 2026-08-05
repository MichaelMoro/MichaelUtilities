/**
 * Fuerteventura Itinerary - Modern JavaScript
 * Clean, simple, mobile-friendly interactions
 */

(function() {
    'use strict';

    // DOM Elements
    const dayNav = document.getElementById('dayNav');
    const dayChips = document.querySelectorAll('.day-chip');
    const daySections = document.querySelectorAll('.day-section');
    const themeToggle = document.getElementById('themeToggle');
    const zoneSummary = document.getElementById('zoneSummary');
    const searchInput = document.getElementById('searchInput');
    const searchClear = document.getElementById('searchClear');
    const searchResults = document.getElementById('searchResults');

    // State
    let currentDay = 'all';
    let searchIndex = [];

    /**
     * Initialize the application
     */
    function init() {
        loadTheme();
        buildSearchIndex();
        setupEventListeners();
        checkUrlHash();
    }

    /**
     * Setup event listeners
     */
    function setupEventListeners() {
        // Day chip clicks
        dayChips.forEach(chip => {
            chip.addEventListener('click', () => handleDaySelect(chip));
        });

        // Theme toggle
        themeToggle.addEventListener('click', toggleTheme);

        // URL hash changes
        window.addEventListener('hashchange', checkUrlHash);

        // Keyboard navigation
        dayNav.addEventListener('keydown', handleKeyboard);

        // Search functionality
        searchInput.addEventListener('input', handleSearch);
        searchInput.addEventListener('focus', () => {
            if (searchInput.value.trim()) {
                handleSearch();
            }
        });
        searchClear.addEventListener('click', clearSearch);

        // Close search results when clicking outside
        document.addEventListener('click', (e) => {
            if (!e.target.closest('.search-container')) {
                searchResults.classList.remove('active');
            }
        });

        // Search keyboard navigation
        searchInput.addEventListener('keydown', handleSearchKeyboard);
    }

    /**
     * Handle day selection
     */
    function handleDaySelect(chip) {
        const day = chip.dataset.day;
        if (day === currentDay) return;

        currentDay = day;
        
        // Update active chip
        dayChips.forEach(c => {
            c.classList.toggle('active', c === chip);
            c.setAttribute('aria-selected', c === chip ? 'true' : 'false');
        });

        // Scroll chip into view
        chip.scrollIntoView({
            behavior: 'smooth',
            block: 'nearest',
            inline: 'center'
        });

        // Filter sections
        filterSections(day);

        // Update URL
        updateUrl(day);

        // Scroll to content (if specific day)
        if (day !== 'all') {
            scrollToSection(day);
        }
    }

    /**
     * Filter day sections
     */
    function filterSections(day) {
        daySections.forEach(section => {
            const sectionDay = section.dataset.day;
            const shouldShow = day === 'all' || sectionDay === day;
            
            section.classList.toggle('hidden', !shouldShow);
            
            if (shouldShow) {
                section.style.animation = 'none';
                section.offsetHeight; // Trigger reflow
                section.style.animation = 'fadeIn 0.3s ease-out';
            }
        });

        // Toggle zone summary visibility
        if (zoneSummary) {
            zoneSummary.style.display = day === 'all' ? 'block' : 'none';
        }
    }

    /**
     * Update URL hash
     */
    function updateUrl(day) {
        const hash = day === 'all' ? '' : `#day-${day}`;
        history.replaceState(null, null, hash || window.location.pathname);
    }

    /**
     * Scroll to specific section
     */
    function scrollToSection(day) {
        const section = document.querySelector(`.day-section[data-day="${day}"]`);
        if (!section) return;

        requestAnimationFrame(() => {
            const navHeight = dayNav.offsetHeight;
            const sectionTop = section.getBoundingClientRect().top + window.scrollY;
            
            window.scrollTo({
                top: sectionTop - navHeight - 16,
                behavior: 'smooth'
            });
        });
    }

    /**
     * Check URL hash on load
     */
    function checkUrlHash() {
        const hash = window.location.hash;
        if (!hash || !hash.startsWith('#day-')) return;

        const day = hash.replace('#day-', '');
        const chip = document.querySelector(`.day-chip[data-day="${day}"]`);
        
        if (chip) {
            handleDaySelect(chip);
        }
    }

    /**
     * Toggle theme
     */
    function toggleTheme() {
        const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
        const newTheme = isDark ? 'light' : 'dark';
        
        document.documentElement.setAttribute('data-theme', newTheme);
        localStorage.setItem('fuerteventura-theme', newTheme);
        
        // Update meta theme color
        const metaTheme = document.querySelector('meta[name="theme-color"]');
        if (metaTheme) {
            metaTheme.content = newTheme === 'dark' ? '#0f172a' : '#0ea5e9';
        }
    }

    /**
     * Load saved theme
     */
    function loadTheme() {
        const savedTheme = localStorage.getItem('fuerteventura-theme');
        const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
        const theme = savedTheme || (prefersDark ? 'dark' : 'light');
        
        document.documentElement.setAttribute('data-theme', theme);
        
        // Update meta theme color
        const metaTheme = document.querySelector('meta[name="theme-color"]');
        if (metaTheme) {
            metaTheme.content = theme === 'dark' ? '#0f172a' : '#0ea5e9';
        }

        // Listen for system theme changes
        window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', (e) => {
            if (!localStorage.getItem('fuerteventura-theme')) {
                const newTheme = e.matches ? 'dark' : 'light';
                document.documentElement.setAttribute('data-theme', newTheme);
                if (metaTheme) {
                    metaTheme.content = newTheme === 'dark' ? '#0f172a' : '#0ea5e9';
                }
            }
        });
    }

    /**
     * Handle keyboard navigation
     */
    function handleKeyboard(e) {
        const chips = Array.from(dayChips);
        const currentIndex = chips.findIndex(c => c.classList.contains('active'));
        let newIndex;

        switch (e.key) {
            case 'ArrowRight':
            case 'ArrowDown':
                e.preventDefault();
                newIndex = (currentIndex + 1) % chips.length;
                break;
            case 'ArrowLeft':
            case 'ArrowUp':
                e.preventDefault();
                newIndex = (currentIndex - 1 + chips.length) % chips.length;
                break;
            case 'Home':
                e.preventDefault();
                newIndex = 0;
                break;
            case 'End':
                e.preventDefault();
                newIndex = chips.length - 1;
                break;
            default:
                return;
        }

        chips[newIndex].click();
        chips[newIndex].focus();
    }

    /**
     * Build search index from all activities
     */
    function buildSearchIndex() {
        searchIndex = [];
        
        daySections.forEach(section => {
            const day = section.dataset.day;
            const dayHeader = section.querySelector('.day-header-title');
            const dayTitle = dayHeader ? dayHeader.textContent : '';
            
            // Index activities
            const activities = section.querySelectorAll('.activity-card');
            activities.forEach(activity => {
                const title = activity.querySelector('.activity-title');
                const desc = activity.querySelector('.activity-desc');
                const timeBlock = activity.closest('.timeline-block');
                const timeText = timeBlock ? timeBlock.querySelector('.time-text') : null;
                
                if (title) {
                    searchIndex.push({
                        day: day,
                        dayTitle: dayTitle,
                        title: title.textContent,
                        description: desc ? desc.textContent : '',
                        time: timeText ? timeText.textContent : '',
                        element: activity
                    });
                }
            });
        });
    }

    /**
     * Handle search input
     */
    function handleSearch() {
        const query = searchInput.value.trim().toLowerCase();
        
        if (!query) {
            searchResults.classList.remove('active');
            return;
        }

        const results = searchIndex.filter(item => {
            const searchText = `${item.title} ${item.description} ${item.dayTitle}`.toLowerCase();
            return searchText.includes(query);
        });

        renderSearchResults(results, query);
    }

    /**
     * Render search results
     */
    function renderSearchResults(results, query) {
        if (results.length === 0) {
            searchResults.innerHTML = `
                <div class="search-no-results">
                    Nessun risultato per "${query}"
                </div>
            `;
            searchResults.classList.add('active');
            return;
        }

        const html = results.map(item => {
            const highlightedTitle = highlightMatch(item.title, query);
            return `
                <div class="search-result-item" data-day="${item.day}" tabindex="0">
                    <div class="search-result-day">
                        ${item.day}
                        <span>AGO</span>
                    </div>
                    <div class="search-result-content">
                        <div class="search-result-title">${highlightedTitle}</div>
                        <div class="search-result-meta">${item.time} - ${item.dayTitle}</div>
                    </div>
                </div>
            `;
        }).join('');

        searchResults.innerHTML = html;
        searchResults.classList.add('active');

        // Add click handlers to results
        searchResults.querySelectorAll('.search-result-item').forEach(item => {
            item.addEventListener('click', () => {
                const day = item.dataset.day;
                selectDayFromSearch(day);
            });
        });
    }

    /**
     * Highlight matching text
     */
    function highlightMatch(text, query) {
        const regex = new RegExp(`(${escapeRegex(query)})`, 'gi');
        return text.replace(regex, '<mark>$1</mark>');
    }

    /**
     * Escape regex special characters
     */
    function escapeRegex(string) {
        return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    }

    /**
     * Select day from search result
     */
    function selectDayFromSearch(day) {
        // Clear search
        clearSearch();
        
        // Find and click the day chip
        const chip = document.querySelector(`.day-chip[data-day="${day}"]`);
        if (chip) {
            handleDaySelect(chip);
        }
    }

    /**
     * Clear search
     */
    function clearSearch() {
        searchInput.value = '';
        searchResults.classList.remove('active');
        searchResults.innerHTML = '';
    }

    /**
     * Handle search keyboard navigation
     */
    function handleSearchKeyboard(e) {
        if (!searchResults.classList.contains('active')) return;

        const items = searchResults.querySelectorAll('.search-result-item');
        if (items.length === 0) return;

        const activeItem = searchResults.querySelector('.search-result-item:hover, .search-result-item:focus');
        let currentIndex = Array.from(items).indexOf(activeItem);

        switch (e.key) {
            case 'ArrowDown':
                e.preventDefault();
                currentIndex = Math.min(currentIndex + 1, items.length - 1);
                items[currentIndex].focus();
                break;
            case 'ArrowUp':
                e.preventDefault();
                currentIndex = Math.max(currentIndex - 1, 0);
                items[currentIndex].focus();
                break;
            case 'Enter':
                e.preventDefault();
                if (currentIndex >= 0) {
                    items[currentIndex].click();
                } else if (items.length > 0) {
                    items[0].click();
                }
                break;
            case 'Escape':
                e.preventDefault();
                clearSearch();
                searchInput.blur();
                break;
        }
    }

    // Initialize when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();
