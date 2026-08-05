/**
 * Fuerteventura Trip Log - SuperDesign JavaScript
 * Clean, simple, mobile-friendly interactions
 */

(function() {
    'use strict';

    const dayNav = document.getElementById('dayNav');
    const dayChips = document.querySelectorAll('.day-chip');
    const dayCards = document.querySelectorAll('.day-card');
    const searchInput = document.getElementById('searchInput');
    const searchClear = document.getElementById('searchClear');
    const searchResults = document.getElementById('searchResults');
    const darkModeToggle = document.getElementById('darkModeToggle');
    const darkModeStyles = document.getElementById('darkModeStyles');

    let currentDay = 'all';
    let searchIndex = [];

    function init() {
        buildSearchIndex();
        setupEventListeners();
        checkUrlHash();
        loadDarkModePreference();
    }

    function loadDarkModePreference() {
        const isDarkMode = localStorage.getItem('darkMode') === 'true';
        if (isDarkMode) {
            enableDarkMode();
        }
    }

    function enableDarkMode() {
        document.body.classList.add('dark-mode');
        darkModeStyles.disabled = false;
        localStorage.setItem('darkMode', 'true');
    }

    function disableDarkMode() {
        document.body.classList.remove('dark-mode');
        darkModeStyles.disabled = true;
        localStorage.setItem('darkMode', 'false');
    }

    function toggleDarkMode() {
        if (document.body.classList.contains('dark-mode')) {
            disableDarkMode();
        } else {
            enableDarkMode();
        }
    }

    function setupEventListeners() {
        dayChips.forEach(chip => {
            chip.addEventListener('click', () => handleDaySelect(chip));
        });

        window.addEventListener('hashchange', checkUrlHash);

        dayNav.addEventListener('keydown', handleKeyboard);

        searchInput.addEventListener('input', handleSearch);
        searchInput.addEventListener('focus', () => {
            if (searchInput.value.trim()) {
                handleSearch();
            }
        });
        searchClear.addEventListener('click', clearSearch);

        document.addEventListener('click', (e) => {
            if (!e.target.closest('.search-container')) {
                searchResults.classList.remove('active');
            }
        });

        searchInput.addEventListener('keydown', handleSearchKeyboard);

        darkModeToggle.addEventListener('click', toggleDarkMode);

        // Prevent zoom on mobile
        preventMobileZoom();
    }

    function preventMobileZoom() {
        // Prevent pinch zoom
        document.addEventListener('touchstart', function(e) {
            if (e.touches.length > 1) {
                e.preventDefault();
            }
        }, { passive: false });

        // Prevent double tap zoom
        let lastTouchEnd = 0;
        document.addEventListener('touchend', function(e) {
            const now = (new Date()).getTime();
            if (now - lastTouchEnd <= 300) {
                e.preventDefault();
            }
            lastTouchEnd = now;
        }, { passive: false });

        // Reset zoom if somehow zoomed
        document.addEventListener('touchend', resetZoom);
        document.addEventListener('touchcancel', resetZoom);

        // Also reset on orientation change
        window.addEventListener('orientationchange', resetZoom);
    }

    function resetZoom() {
        // Force viewport reset
        const viewport = document.querySelector('meta[name="viewport"]');
        if (viewport) {
            viewport.setAttribute('content', 'width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no');
        }
    }

    function handleDaySelect(chip) {
        const day = chip.dataset.day;
        if (day === currentDay) return;

        currentDay = day;
        
        dayChips.forEach(c => {
            c.classList.toggle('active', c === chip);
            c.setAttribute('aria-selected', c === chip ? 'true' : 'false');
        });

        chip.scrollIntoView({
            behavior: 'smooth',
            block: 'nearest',
            inline: 'center'
        });

        filterCards(day);

        updateUrl(day);

        if (day !== 'all') {
            scrollToCard(day);
        }
    }

    function filterCards(day) {
        dayCards.forEach(card => {
            const cardDay = card.dataset.day;
            const shouldShow = day === 'all' || cardDay === day;
            
            card.classList.toggle('hidden', !shouldShow);
            
            if (shouldShow) {
                card.style.animation = 'none';
                card.offsetHeight;
                card.style.animation = 'fadeIn 0.3s ease-out';
            }
        });
    }

    function updateUrl(day) {
        const hash = day === 'all' ? '' : `#day-${day}`;
        history.replaceState(null, null, hash || window.location.pathname);
    }

    function scrollToCard(day) {
        const card = document.querySelector(`.day-card[data-day="${day}"]`);
        if (!card) return;

        requestAnimationFrame(() => {
            const navHeight = dayNav.offsetHeight;
            const cardTop = card.getBoundingClientRect().top + window.scrollY;
            
            window.scrollTo({
                top: cardTop - navHeight - 24,
                behavior: 'smooth'
            });
        });
    }

    function checkUrlHash() {
        const hash = window.location.hash;
        if (!hash || !hash.startsWith('#day-')) return;

        const day = hash.replace('#day-', '');
        const chip = document.querySelector(`.day-chip[data-day="${day}"]`);
        
        if (chip) {
            handleDaySelect(chip);
        }
    }

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

    function buildSearchIndex() {
        searchIndex = [];
        
        dayCards.forEach(card => {
            const day = card.dataset.day;
            const dayHeader = card.querySelector('.day-card__title');
            const dayTitle = dayHeader ? dayHeader.textContent : '';
            
            const activities = card.querySelectorAll('.activity');
            activities.forEach(activity => {
                const title = activity.querySelector('.activity__title');
                const reason = activity.querySelector('.activity__reason');
                
                if (title) {
                    const titleText = title.textContent.replace(/[🌅☀️🌙🏖️🚗🌊🏄🕳️🌾✈️]/g, '').trim();
                    searchIndex.push({
                        day: day,
                        dayTitle: dayTitle,
                        title: titleText,
                        description: reason ? reason.textContent : '',
                        element: activity
                    });
                }
            });

            const timeTexts = card.querySelectorAll('.time-text');
            timeTexts.forEach(timeText => {
                searchIndex.push({
                    day: day,
                    dayTitle: dayTitle,
                    title: timeText.textContent,
                    description: 'Fascia oraria',
                    element: timeText.closest('.timeline-block')
                });
            });
        });
    }

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
                        <div class="search-result-meta">${item.dayTitle}</div>
                    </div>
                </div>
            `;
        }).join('');

        searchResults.innerHTML = html;
        searchResults.classList.add('active');

        searchResults.querySelectorAll('.search-result-item').forEach(item => {
            item.addEventListener('click', () => {
                const day = item.dataset.day;
                selectDayFromSearch(day);
            });
        });
    }

    function highlightMatch(text, query) {
        const regex = new RegExp(`(${escapeRegex(query)})`, 'gi');
        return text.replace(regex, '<mark>$1</mark>');
    }

    function escapeRegex(string) {
        return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    }

    function selectDayFromSearch(day) {
        clearSearch();
        
        const chip = document.querySelector(`.day-chip[data-day="${day}"]`);
        if (chip) {
            handleDaySelect(chip);
        }
    }

    function clearSearch() {
        searchInput.value = '';
        searchResults.classList.remove('active');
        searchResults.innerHTML = '';
    }

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

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();
