console.log("WetLondon version:", "2026-01-26 lazy-load");

// ==========================================
// LAZY LOADING FOR IMAGES (PERFORMANCE)
// ==========================================
const lazyImageObserver = new IntersectionObserver((entries, observer) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            const card = entry.target;
            const venueName = card.dataset.venueName;
            if (venueName && !card.dataset.imageLoaded) {
                card.dataset.imageLoaded = 'loading';
                loadImageForCard(card, venueName);
            }
            observer.unobserve(card);
        }
    });
}, {
    rootMargin: '200px 0px', // Start loading 200px before entering viewport
    threshold: 0.01
});

async function loadImageForCard(card, venueName) {
    const imageDiv = card.querySelector('.activity-image');
    if (!imageDiv) return;

    try {
        const imageUrl = await fetchVenueImage(venueName);
        if (imageUrl) {
            imageDiv.style.backgroundImage = `url('${imageUrl}')`;
            imageDiv.style.backgroundSize = 'cover';
            imageDiv.style.backgroundPosition = 'center';
            card.dataset.imageLoaded = 'true';
        } else {
            card.dataset.imageLoaded = 'fallback';
        }
    } catch (e) {
        console.warn(`Lazy load failed for ${venueName}:`, e.message);
        card.dataset.imageLoaded = 'error';
    }
}

// Observe all activity cards for lazy loading
function observeCardsForLazyLoading(container) {
    if (!container) return;
    const cards = container.querySelectorAll('.activity-card[data-venue-name]:not([data-image-loaded])');
    cards.forEach(card => lazyImageObserver.observe(card));
}

// MutationObserver to catch dynamically added cards
const cardMutationObserver = new MutationObserver((mutations) => {
    mutations.forEach(mutation => {
        mutation.addedNodes.forEach(node => {
            if (node.nodeType === 1) { // Element node
                if (node.classList?.contains('activity-card') && node.dataset.venueName) {
                    lazyImageObserver.observe(node);
                }
                // Also check child cards
                const childCards = node.querySelectorAll?.('.activity-card[data-venue-name]:not([data-image-loaded])');
                childCards?.forEach(card => lazyImageObserver.observe(card));
            }
        });
    });
});

// Start observing the document body for dynamically added cards
document.addEventListener('DOMContentLoaded', () => {
    cardMutationObserver.observe(document.body, { childList: true, subtree: true });
});

function setVenuesLoading(isLoading) {
    const el = document.getElementById('venuesLoading');
    if (el) el.style.display = isLoading ? 'flex' : 'none';

    const luckyBtn = document.querySelector('.lucky-btn');
    if (luckyBtn) {
        luckyBtn.disabled = isLoading || window.__venuesSource !== 'supabase';
        luckyBtn.style.opacity = luckyBtn.disabled ? '0.55' : '1';
        luckyBtn.style.cursor = luckyBtn.disabled ? 'not-allowed' : 'pointer';
    }
}

function formatCategoryLabel(key) {
    if (!key) return '';
    return String(key)
        .replace(/[-_]+/g, ' ')
        .replace(/\b\w/g, c => c.toUpperCase());
}
let selectedTypes = [];
let selectedLocations = [];
let selectedWetness = [];
let selectedPrerequisites = [];
let filterOpenNow = false;
let searchQuery = '';
let searchDebounceTimer = null;
let userPreferences = '';
let allFilteredVenues = [];
let displayedCount = 0;
const VENUES_PER_PAGE = 6;

// Unsplash API Configuration
const UNSPLASH_ACCESS_KEY = 'urKB9lnQ7Uj4_qzMJ0ov70YmRdJIgW_VUZp35uuLb-E';
const UNSPLASH_API_URL = 'https://api.unsplash.com';
const IMAGE_CACHE_KEY = 'wet_london_images_cache';
const CACHE_DURATION = 7 * 24 * 60 * 60 * 1000; // 7 days

// Formatting helpers
function labelCategory(categoryKey) {
    if (!categoryKey) return '';
    return String(categoryKey)
        .replace(/_/g, ' ')
        .replace(/\s+/g, ' ')
        .trim()
        .replace(/\b\w/g, c => c.toUpperCase());
}

// Image Functions (Places first, Unsplash fallback)
function getImageCache() {
    try {
        const cache = localStorage.getItem(IMAGE_CACHE_KEY);
        return cache ? JSON.parse(cache) : {};
    } catch (error) {
        return {};
    }
}

function setImageCache(venueName, imageUrl, source = 'unknown') {
    try {
        const cache = getImageCache();
        cache[venueName] = {
            url: imageUrl,
            source,
            timestamp: Date.now()
        };
        localStorage.setItem(IMAGE_CACHE_KEY, JSON.stringify(cache));
    } catch (error) {
        // ignore
    }
}

/**
 * Returns cached URL if fresh.
 * If preferredSource is "places", a cached Unsplash URL will be ignored so we can try Places.
 */
function getCachedImage(venueName, preferredSource = 'places') {
    const cache = getImageCache();
    const cached = cache[venueName];

    if (!cached) return null;
    if (Date.now() - cached.timestamp >= CACHE_DURATION) return null;

    if (preferredSource === 'places' && cached.source && cached.source !== 'places') {
        return null;
    }

    return cached.url;
}

// Google Places Photo Proxy (server-side)
async function fetchPlacesImage(venueName) {
    const cachedPlaces = getCachedImage(venueName, 'places');
    if (cachedPlaces) return cachedPlaces;

    const q = (venueName || '').replace(/, London$/i, '').trim();
    if (!q) return null;

    try {
        const resp = await fetch(`/api/place-photo?q=${encodeURIComponent(q + ' London')}`);
        if (!resp.ok) {
            console.warn(`Places API failed for "${venueName}":`, resp.status);
            return null;
        }

        const data = await resp.json();
        if (data && typeof data.imageUrl === 'string' && data.imageUrl.length > 0) {
            setImageCache(venueName, data.imageUrl, 'places');
            return data.imageUrl;
        }
        // Log when no image found
        if (data && data.note) {
            console.log(`Places: ${venueName} - ${data.note}`);
        }
        return null;
    } catch (e) {
        console.warn(`Places API error for "${venueName}":`, e.message);
        return null;
    }
}

// Unsplash fallback only
async function fetchUnsplashImage(venueName) {
    // Accept any cached value here (if Places fails, we can still use it)
    const cachedUrl = getCachedImage(venueName, 'any');
    if (cachedUrl) return cachedUrl;

    const searchTerms = {
        'British Museum': 'British Museum interior London',
        'Tate Modern': 'Tate Modern gallery London',
        'National Gallery': 'National Gallery Trafalgar Square',
        'Science Museum': 'Science Museum London exhibits',
        'Natural History Museum': 'Natural History Museum London dinosaur',
        'Victoria and Albert Museum': 'V&A Museum London',
        'Sky Garden': 'Sky Garden London rooftop',
        'Covent Garden Market': 'Covent Garden London market',
        'Borough Market': 'Borough Market London food',
        'Southbank Centre': 'Southbank Centre London Thames',
        'Royal Albert Hall': 'Royal Albert Hall London exterior',
        'Churchill War Rooms': 'Churchill War Rooms London',
        'Somerset House': 'Somerset House London courtyard',
        'Barbican Centre': 'Barbican Centre London architecture',
        'Design Museum': 'Design Museum London Kensington',
        'Wellcome Collection': 'Wellcome Collection London',
        'Leake Street Arches': 'Leake Street graffiti tunnel London',
        "God's Own Junkyard": 'neon lights art installation',
        'Frameless': 'Frameless immersive art London',
        'London Aquarium': 'London Aquarium Sea Life',
        'West End Theatre': 'West End theatre London lights',
        'Electric Cinema': 'Electric Cinema Notting Hill',
        'Fortnum & Mason': 'Fortnum Mason London interior',
        'Foyles Bookshop': 'Foyles bookshop London',
        'Little Venice': 'Little Venice London canal'
    };

    const query = searchTerms[venueName] || ((venueName || '').replace(/, London$/i, '').trim() + ' London');

    try {
        const response = await fetch(
            `${UNSPLASH_API_URL}/search/photos?query=${encodeURIComponent(query)}&per_page=1&orientation=landscape`,
            { headers: { 'Authorization': `Client-ID ${UNSPLASH_ACCESS_KEY}` } }
        );

        if (!response.ok) return null;

        const data = await response.json();
        if (data.results && data.results.length > 0) {
            const imageUrl = data.results[0].urls.regular;
            setImageCache(venueName, imageUrl, 'unsplash');
            return imageUrl;
        }

        return null;
    } catch (error) {
        return null;
    }
}

// Main image fetcher: Places first, then Unsplash
async function fetchVenueImage(venueName) {
    const placesUrl = await fetchPlacesImage(venueName);
    if (placesUrl) return placesUrl;

    return await fetchUnsplashImage(venueName);
}

// Batch fetch images for multiple venues
async function fetchImagesForVenues(venues) {
    const promises = venues.map(venue => fetchVenueImage(venue.name));
    return await Promise.all(promises);
}

// Get fallback gradient based on venue type
function getFallbackGradient(venue) {
    const gradients = {
        'museums': 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        'galleries': 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
        'theatre': 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
        'dining': 'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)',
        'entertainment': 'linear-gradient(135deg, #fa709a 0%, #fee140 100%)',
        'shopping': 'linear-gradient(135deg, #30cfd0 0%, #330867 100%)',
        'nightlife': 'linear-gradient(135deg, #a8edea 0%, #fed6e3 100%)',
        'wellness': 'linear-gradient(135deg, #ffecd2 0%, #fcb69f 100%)',
        'cinema': 'linear-gradient(135deg, #ff9a9e 0%, #fecfef 100%)',
        'historic': 'linear-gradient(135deg, #ffecd2 0%, #fcb69f 100%)'
    };

    // Find first matching type
    for (const type of venue.type) {
        if (gradients[type]) {
            return gradients[type];
        }
    }

    // Default gradient
    return 'linear-gradient(135deg, #e0c3fc 0%, #8ec5fc 100%)';
}

function getPlaceholderImage(venue) {
    // Generate a simple SVG placeholder based on venue type
    const colors = {
        museums: '#8B5CF6',
        galleries: '#EC4899',
        dining: '#F59E0B',
        theatre: '#EF4444',
        cinema: '#3B82F6',
        music: '#10B981',
        shopping: '#F97316',
        markets: '#84CC16',
        entertainment: '#6366F1',
        sports: '#14B8A6',
        wellness: '#A855F7',
        nightlife: '#F43F5E',
        libraries: '#06B6D4',
        gaming: '#8B5CF6',
        comedy: '#FBBF24'
    };

    const color = colors[venue.type[0]] || '#6B7280';
    const initial = venue.name.charAt(0).toUpperCase();

    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="400" height="300"><rect width="400" height="300" fill="${color}"/><text x="50%" y="50%" font-family="Arial, sans-serif" font-size="120" fill="white" text-anchor="middle" dominant-baseline="middle">${initial}</text></svg>`;
    return `data:image/svg+xml,${encodeURIComponent(svg)}`;
}

// Search Functions
function initializeSearch() {
    const searchInput = document.getElementById('searchInput');
    const clearSearchBtn = document.getElementById('clearSearchBtn');
    const searchSuggestions = document.getElementById('searchSuggestions');

    // Search input event listener
    searchInput.addEventListener('input', function (e) {
        const query = e.target.value.trim();
        searchQuery = query;

        // Show/hide clear button
        if (query.length > 0) {
            clearSearchBtn.style.display = 'flex';
        } else {
            clearSearchBtn.style.display = 'none';
            searchSuggestions.style.display = 'none';
        }

        // Debounce search
        clearTimeout(searchDebounceTimer);
        searchDebounceTimer = setTimeout(() => {
            if (query.length >= 2) {
                showSearchSuggestions(query);
            } else {
                searchSuggestions.style.display = 'none';
            }
        }, 300);
    });

    // Enter key to search
    searchInput.addEventListener('keydown', function (e) {
        if (e.key === 'Enter') {
            e.preventDefault();
            performSearch();
            searchInput.blur();
        }
        // Escape key to clear
        if (e.key === 'Escape') {
            clearSearch();
        }
    });

    // Click outside to close suggestions
    document.addEventListener('click', function (e) {
        if (!searchInput.contains(e.target) && !searchSuggestions.contains(e.target)) {
            searchSuggestions.style.display = 'none';
        }
    });
}

function showSearchSuggestions(query) {
    const searchSuggestions = document.getElementById('searchSuggestions');
    const matches = searchVenues(query);

    if (matches.length === 0) {
        searchSuggestions.innerHTML = '<div class="no-results">No matching activities found</div>';
        searchSuggestions.style.display = 'block';
        return;
    }

    // Show max 5 suggestions
    const topMatches = matches.slice(0, 5);

    searchSuggestions.innerHTML = topMatches.map(venue => {
        const nameHighlighted = highlightMatch(venue.name, query);
        const typeLabel = venue.type[0].charAt(0).toUpperCase() + venue.type[0].slice(1);
        const locationLabel = venue.location.charAt(0).toUpperCase() + venue.location.slice(1);

        return `
        <div class="suggestion-item" onclick="selectVenue('${venue.name.replace(/'/g, "\\'")}')">
            <div class="suggestion-name">${nameHighlighted}</div>
                <div class="suggestion-meta">${typeLabel} · ${locationLabel} · ${venue.priceDisplay}</div>
                    </div >
        `;
    }).join('');

    searchSuggestions.style.display = 'block';
}

function searchVenues(query) {
    const lowerQuery = query.toLowerCase();

    return window.londonVenues.filter(venue => {
        // Search in name
        if (venue.name.toLowerCase().includes(lowerQuery)) return true;

        // Search in description
        if (venue.description.toLowerCase().includes(lowerQuery)) return true;

        // Search in types
        if (venue.type.some(type => type.toLowerCase().includes(lowerQuery))) return true;

        // Search in location
        if (venue.location.toLowerCase().includes(lowerQuery)) return true;

        // Search in prerequisites
        if (venue.prerequisites && venue.prerequisites.some(prereq =>
            prereq.toLowerCase().includes(lowerQuery)
        )) return true;

        return false;
    }).sort((a, b) => {
        // Prioritize name matches
        const aNameMatch = a.name.toLowerCase().includes(lowerQuery);
        const bNameMatch = b.name.toLowerCase().includes(lowerQuery);

        if (aNameMatch && !bNameMatch) return -1;
        if (!aNameMatch && bNameMatch) return 1;

        // Then sort alphabetically
        return a.name.localeCompare(b.name);
    });
}

function highlightMatch(text, query) {
    const lowerText = text.toLowerCase();
    const lowerQuery = query.toLowerCase();
    const index = lowerText.indexOf(lowerQuery);

    if (index === -1) return text;

    const before = text.substring(0, index);
    const match = text.substring(index, index + query.length);
    const after = text.substring(index + query.length);

    return `${before} <strong>${match}</strong>${after} `;
}

function selectVenue(venueName) {
    const venue = window.londonVenues.find(v => v.name === venueName);
    if (venue) {
        openActivityModal(venue);
        document.getElementById('searchSuggestions').style.display = 'none';
        document.getElementById('searchInput').value = '';
        document.getElementById('clearSearchBtn').style.display = 'none';
    }
}


// Small Render Function
function renderDavidsTopPicks() {
    const section = document.getElementById('davidsTopPicksSection');
    const grid = document.getElementById('davidsTopPicksGrid');
    if (!section || !grid) return;

    const venues = (window.londonVenues || []).filter(v => v.highlighted === true);
    const picks = venues.slice(0, 3);

    if (picks.length === 0) {
        section.style.display = 'none';
        grid.innerHTML = '';
        return;
    }

    section.style.display = 'block';

    grid.innerHTML = picks
        .map((venue, i) => createActivityCardHTML(venue, i, { showId: false }))
        .join('');

    setTimeout(() => updateViewDetailsButtons(), 50);
    setTimeout(() => updateBookmarkIcons(), 50);
}




// Expose selectVenue globally for inline onclick handlers
window.selectVenue = selectVenue;

function performSearch() {
    const query = searchQuery.trim();

    if (query.length < 2) return;

    const matches = searchVenues(query);

    // Close suggestions
    document.getElementById('searchSuggestions').style.display = 'none';

    if (matches.length === 0) {
        // Show no results
        showLoading();
        setTimeout(() => {
            hideLoading();
            document.getElementById('generatedGrid').innerHTML = `
        <div style="grid-column: 1 / -1; text-align: center; padding: 4rem 2rem;">
                            <h3 style="margin-bottom: 1rem; font-size: 1.5rem;">No results found</h3>
                            <p style="color: #666;">Try a different search term or <button onclick="clearSearch()" style="color: #DCDAF5; text-decoration: underline; background: none; border: none; cursor: pointer; font-size: inherit;">clear your search</button></p>
                        </div >
        `;
            document.getElementById('generatedCount').textContent = "0 activities found";
            document.getElementById('generatedSection').classList.add('active');
        }, 800);
        return;
    }

    // Show loading
    showLoading();

    setTimeout(async () => {
        await renderVenues(matches);
        hideLoading();

        const resultText = matches.length === 1 ? '1 result' : `${matches.length} results`;
        document.querySelector('.generated-title').textContent = `Search: "${query}"(${resultText})`;

        document.getElementById('generatedSection').scrollIntoView({
            behavior: 'smooth',
            block: 'start'
        });
    }, 800);
}

function clearSearch() {
    const searchInput = document.getElementById('searchInput');
    const clearSearchBtn = document.getElementById('clearSearchBtn');
    const searchSuggestions = document.getElementById('searchSuggestions');

    searchInput.value = '';
    searchQuery = '';
    clearSearchBtn.style.display = 'none';
    searchSuggestions.style.display = 'none';

    searchInput.focus();
}

// Real London venues database - 100+ venues


function filterVenues() {
    return window.londonVenues.filter(venue => {
        // Filter by activity types (use unified filter state)
        if (filters.types.size > 0) {
            const hasMatchingType = venue.type.some(t => filters.types.has(t));
            if (!hasMatchingType) return false;
        }

        // Filter by locations (use unified filter state)
        if (filters.areas.size > 0) {
            if (!filters.areas.has(venue.location)) return false;
        }

        // Filter by wetness (use unified filter state)
        if (filters.wetness) {
            if (venue.wetness !== filters.wetness) return false;
        }

        // Filter by wetness score threshold
        if (filters.maxWetnessScore < 100) {
            const venueScore = venue.wetnessScore || 0;
            if (venueScore > filters.maxWetnessScore) return false;
        }

        // Filter by prerequisites (use unified filter state)
        if (filters.constraints.size > 0) {
            const venuePrereqs = venue.prerequisites || [];
            const hasAllConstraints = Array.from(filters.constraints).every(c =>
                venuePrereqs.some(p => p.toLowerCase() === c.toLowerCase())
            );
            if (!hasAllConstraints) return false;
        }

        // Filter by Open Now (use unified filter state)
        if (filters.openNow) {
            const isOpen = isVenueOpenNow(venue);
            if (isOpen !== true) return false;
        }

        return true;
    });
}

// Pagination for generated results
let currentResults = [];
let currentOffset = 0;
const PAGE_SIZE = 6;

// Reusable function to generate Activity Card HTML
function createActivityCardHTML(venue, index, options = {}) {
    const {
        idPrefix = 'card',
        isSaved = false,
        dataAttrs = '',
        showId = true,
        cardClass = '',
        badgeHTML = '',
        eagerLoad = false  // Set true for above-fold cards
    } = options;

    const cachedImage = getCachedImage(venue.name);
    // Use placeholder initially for lazy loading; actual image loaded by IntersectionObserver
    const backgroundStyle = cachedImage
        ? `background-image: url('${cachedImage}'); background-size: cover; background-position: center;`
        : `background-image: url('${getPlaceholderImage(venue)}'); background-size: cover; background-position: center;`;

    // Track if image is already loaded (for lazy loading)
    const imageLoadedAttr = cachedImage ? 'data-image-loaded="true"' : '';

    // Create badges
    let openBadge = '';
    if (venue.openingHours) {
        const isOpen = isVenueOpenNow(venue);
        if (isOpen === true) {
            if (isClosingSoon(venue)) {
                const timeLeft = getHoursUntilClosing(venue);
                openBadge = `<div class="open-now-badge closing-soon-badge">Closes in ${timeLeft}</div>`;
            } else {
                openBadge = '<div class="open-now-badge">Open Now</div>';
            }
        } else if (isOpen === false) {
            openBadge = '<div class="open-now-badge closed-badge">Closed</div>';
        }
    }

    // ADD SPONSORED BADGE - MONETIZATION FEATURE
    const sponsoredBadge = isSponsored(venue)
        ? '<div class="sponsored-badge">✨ Featured Partner</div>'
        : '';

    const umbrellaEmoji = venue.wetness === 'slightly' ? '☂️' : (venue.wetness === 'wet' ? '☔️' : '🌂');
    const tooltipText = venue.wetness === 'slightly' ? 'Slightly Wet' : (venue.wetness === 'wet' ? 'Wet (Outdoor)' : 'Dry (Indoor)');

    // Wetness score for display
    const wetnessScore = venue.wetnessScore || 0;
    const wetnessPercent = Math.round(wetnessScore);
    const safeNameId = venue.name.replace(/[^a-zA-Z0-9]/g, '-');
    const idAttr = showId ? `id="${idPrefix}-${safeNameId}-${index}"` : '';
    const bookmarkClass = isSaved ? 'bookmark-icon saved' : 'bookmark-icon';

    // ADD SPONSORED CLASS TO CARD - MONETIZATION FEATURE
    const sponsoredClass = isSponsored(venue) ? 'sponsored-card' : '';

    // Escape venue name for data attribute
    const safeVenueName = venue.name.replace(/"/g, '&quot;');

    return `
        <div class="activity-card ${sponsoredClass} ${cardClass}" ${idAttr} ${dataAttrs} data-venue-name="${safeVenueName}" ${imageLoadedAttr}>
            <div class="activity-image" style="${backgroundStyle}">
                ${sponsoredBadge}
                ${badgeHTML}
                ${openBadge}
                <div class="${bookmarkClass}" onclick="toggleBookmarkFromCard(event, '${venue.name.replace(/'/g, "\\'")}')"><svg viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"></path></svg></div>
                <div class="umbrella-chip" data-tooltip="${tooltipText}">${umbrellaEmoji}</div>
            </div>
            <div class="activity-content">
                <h3>${venue.name}</h3>
                <div class="activity-tags">
                    <span class="tag">${labelCategory(venue.type[0])}</span>
                    <span class="tag">${labelCategory(venue.location)}</span>
                    <span class="tag">${labelCategory(venue.wetness)}</span>
                    <a href="https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(venue.name + ' London')}" target="_blank" rel="noopener" class="map-link" title="View on Google Maps"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg></a>
                </div>
                <p>${venue.description}</p>
                <div class="wetness-indicator">
                    <div class="wetness-bar">
                        <div class="wetness-bar-fill" style="width: ${wetnessPercent}%"></div>
                    </div>
                    <span class="wetness-label">${wetnessPercent}% wet</span>
                </div>
                <div class="price">${venue.priceDisplay}</div>
                <button class="book-btn">View Details</button>
            </div>
        </div>
    `;
}

function setGeneratedResults(list, opts = {}) {
    currentResults = Array.isArray(list) ? list : [];
    currentOffset = 0;

    // Update title if present
    const titleEl = document.querySelector('.generated-title');
    if (titleEl && opts.title) titleEl.textContent = opts.title;

    // Render first page
    renderVenues(currentResults.slice(0, PAGE_SIZE), { replace: true });
    currentOffset = Math.min(PAGE_SIZE, currentResults.length);

    // Toggle Show more
    updateLoadMoreButton();
    showGeneratedSectionAndScroll();
}

function updateLoadMoreButton() {
    const loadMoreContainer = document.getElementById('loadMoreContainer');
    if (loadMoreContainer) {
        if (currentOffset < currentResults.length) {
            loadMoreContainer.style.display = 'block';
        } else {
            loadMoreContainer.style.display = 'none';
        }
    }
}

function showGeneratedSectionAndScroll() {
    const section = document.getElementById('generatedSection');
    if (section) {
        // FORCE section to be visible
        section.style.display = 'block';
        section.style.visibility = 'visible';
        section.style.opacity = '1';

        // Add active class and remove any hiding classes
        section.classList.add('active');
        section.classList.remove('hidden');
        section.removeAttribute('hidden');

        setTimeout(() => {
            section.scrollIntoView({ behavior: 'smooth', block: 'start' });

            // Visual proof
            const grid = document.getElementById('generatedGrid');
            console.log('generatedSection display', getComputedStyle(section).display);
            console.log('generatedGrid children', grid ? grid.children.length : 0);
        }, 100);
    }
}

// Render venues in the generated grid
async function renderVenues(venues, options = {}) {
    const grid = document.getElementById('generatedGrid');
    const section = document.getElementById('generatedSection');
    const counter = document.getElementById('generatedCount');
    const loadMoreContainer = document.getElementById('loadMoreContainer');
    const loadMoreBtn = document.getElementById('loadMoreBtn');

    if (!grid || !counter || !section) return;

    // Extract options with defaults
    const append = Boolean(options.append);
    const replace = Boolean(options.replace);

    // Handle replace mode (clear grid and reset count)
    if (replace) {
        grid.innerHTML = '';
        displayedCount = 0;
        allFilteredVenues = venues;
    }

    // Handle append mode (add to existing)
    if (!append && !replace) {
        allFilteredVenues = venues;
        displayedCount = 0;
    }

    if (venues.length === 0) {
        grid.innerHTML = `
        <div style="grid-column: 1 / -1; text-align: center; padding: 4rem 2rem;">
                        <h3 style="margin-bottom: 1rem; font-size: 1.5rem;">No activities found</h3>
                        <p style="color: #666;">Try adjusting your filters to see more results</p>
                    </div >
        `;
        counter.textContent = "0 activities found";
        loadMoreContainer.style.display = 'none';
        section.classList.add('active');
        return;
    }

    counter.textContent = `${venues.length} ${venues.length === 1 ? 'activity' : 'activities'} found`;

    const venuesToShow = venues.slice(displayedCount, displayedCount + VENUES_PER_PAGE);
    displayedCount += venuesToShow.length;

    // Optimistic rendering: Render text content first, then update with images
    const venueHTML = venuesToShow.map((venue, index) => {
        // Initial render with placeholder or cached image if available
        const cachedUrl = getCachedImage(venue.name);
        const backgroundStyle = cachedUrl
            ? `background-image: url('${cachedUrl}');`
            : `background-image: url('${getPlaceholderImage(venue)}'); background-size: cover;`;

        return createActivityCardHTML(venue, index);
    }).join('');

    if (append) {
        grid.insertAdjacentHTML('beforeend', venueHTML);
    } else {
        grid.innerHTML = venueHTML;
    }

    // Lazy load images
    venuesToShow.forEach(async (venue, index) => {
        if (!getCachedImage(venue.name)) {
            const imageUrl = await fetchVenueImage(venue.name);
            if (imageUrl) {
                const safeName = venue.name.replace(/[^a-zA-Z0-9]/g, '-');
                const card = document.getElementById(`card-${safeName}-${index}`);
                if (card) {
                    const imgDiv = card.querySelector('.activity-image');
                    if (imgDiv) {
                        imgDiv.style.backgroundImage = `url('${imageUrl}')`;
                        imgDiv.style.backgroundSize = 'cover';
                    }
                }
            }
        }
    });

    counter.textContent = `${venues.length} ${venues.length === 1 ? 'activity' : 'activities'} found`;

    // Update View Details buttons logic
    updateViewDetailsButtons();
    updateBookmarkIcons();

    // Show/hide load more button
    if (loadMoreContainer) {
        if (displayedCount < venues.length) {
            loadMoreContainer.style.display = 'block';
        } else {
            loadMoreContainer.style.display = 'none';
        }
    }

    // Ensure section is visible
    section.classList.add('active');
}

function loadMoreVenues() {
    if (currentOffset >= currentResults.length) return;

    const nextBatch = currentResults.slice(currentOffset, currentOffset + PAGE_SIZE);
    renderVenues(nextBatch, { replace: false });
    currentOffset += nextBatch.length;
    updateLoadMoreButton();
}

function clearResults() {
    const section = document.getElementById('generatedSection');
    const grid = document.getElementById('generatedGrid');

    // Hide the section
    section.style.display = 'none';
    section.classList.remove('active');

    // Clear the grid
    if (grid) {
        grid.innerHTML = '';
    }

    // Reset pagination state
    currentResults = [];
    currentOffset = 0;
    allFilteredVenues = [];
    displayedCount = 0;
}

function showLoading() {
    document.getElementById('loadingOverlay').classList.add('active');
}

function hideLoading() {
    document.getElementById('loadingOverlay').classList.remove('active');
}

function updateCounter() {
    const totalFilters = selectedTypes.length + selectedLocations.length +
        selectedWetness.length + selectedPrerequisites.length +
        (filterOpenNow ? 1 : 0);
    document.getElementById('filterCount').textContent = `(${totalFilters})`;
}

function updatePrereqCounter() {
    document.getElementById('prereqCount').textContent = `(${selectedPrerequisites.length})`;
}

function openModal() {
    console.log('--- [app.js] openModal called ---');
    const modal = document.getElementById('customizeModal');
    if (modal) {
        modal.classList.add('active');
        console.log('--- [app.js] Modal "customizeModal" opened ---');
    } else {
        console.error('--- [app.js] ERROR: Modal "customizeModal" not found! ---');
    }
}

function closeModal() {
    console.log('--- [app.js] closeModal called ---');
    const modal = document.getElementById('customizeModal');
    if (modal) {
        modal.classList.remove('active');
        console.log('--- [app.js] Modal "customizeModal" closed ---');
    } else {
        console.error('--- [app.js] ERROR: Modal "customizeModal" not found! ---');
    }
}

function openPrerequisites() {
    document.getElementById('prerequisitesModal').classList.add('active');
}

function closePrerequisites() {
    document.getElementById('prerequisitesModal').classList.remove('active');
}

// Activity type selection - UPDATED to use unified filter state
document.querySelectorAll('.tag-option[data-type]').forEach(tag => {
    tag.addEventListener('click', function () {
        this.classList.toggle('selected');
        const type = this.dataset.type;
        const index = selectedTypes.indexOf(type);

        if (index > -1) {
            selectedTypes.splice(index, 1);
            filters.types.delete(type); // Remove from unified filter state
        } else {
            selectedTypes.push(type);
            filters.types.add(type); // Add to unified filter state
        }
        updateCounter();
        updateDoneButtonLabels();
    });
});

// Location selection (multiple) - UPDATED to use unified filter state
document.querySelectorAll('.location-option').forEach(option => {
    option.addEventListener('click', function () {
        const location = this.dataset.location;

        if (location === 'all') {
            // If "All London" is clicked, deselect everything else
            document.querySelectorAll('.location-option').forEach(opt => {
                opt.classList.remove('selected');
            });
            this.classList.add('selected');
            selectedLocations = [];
            filters.areas.clear(); // Clear unified filter state
        } else {
            // Deselect "All London" when selecting specific areas
            document.querySelector('.location-option[data-location="all"]').classList.remove('selected');

            // Toggle this location
            this.classList.toggle('selected');
            const index = selectedLocations.indexOf(location);

            if (index > -1) {
                selectedLocations.splice(index, 1);
                filters.areas.delete(location); // Remove from unified filter state
            } else {
                selectedLocations.push(location);
                filters.areas.add(location); // Add to unified filter state
            }

            // If nothing is selected, reselect "All London"
            if (selectedLocations.length === 0) {
                document.querySelector('.location-option[data-location="all"]').classList.add('selected');
            }
        }
        updateCounter();
        updateDoneButtonLabels();
    });
});

// Wetness selection - UPDATED to use unified filter state
document.querySelectorAll('.wetness-option').forEach(option => {
    option.addEventListener('click', function () {
        const wetness = this.dataset.wetness;

        if (wetness === 'any') {
            // If "I don't mind" is clicked, deselect everything else
            document.querySelectorAll('.wetness-option').forEach(opt => {
                opt.classList.remove('selected');
            });
            this.classList.add('selected');
            selectedWetness = [];
            filters.wetness = null; // Clear unified filter state
        } else {
            // Deselect "I don't mind" when selecting specific wetness
            document.querySelector('.wetness-option[data-wetness="any"]').classList.remove('selected');

            // Deselect all other options first (single selection)
            document.querySelectorAll('.wetness-option:not([data-wetness="any"])').forEach(opt => {
                opt.classList.remove('selected');
            });

            // Select this wetness level
            this.classList.add('selected');
            selectedWetness = [wetness];
            filters.wetness = wetness; // Set unified filter state
        }
        updateCounter();
        updateDoneButtonLabels();
    });
});

// Prerequisites selection - UPDATED to use unified filter state
document.querySelectorAll('.prereq-tag').forEach(tag => {
    tag.addEventListener('click', function () {
        this.classList.toggle('selected');
        const text = this.textContent.trim();
        const index = selectedPrerequisites.indexOf(text);

        if (index > -1) {
            selectedPrerequisites.splice(index, 1);
            filters.constraints.delete(text); // Remove from unified filter state
        } else {
            selectedPrerequisites.push(text);
            filters.constraints.add(text); // Add to unified filter state
        }
        updatePrereqCounter();
        updateCounter();
        updateDoneButtonLabels();
    });
});

function clearFilters() {
    // Clear old arrays
    selectedTypes = [];
    selectedLocations = [];
    selectedWetness = [];
    filterOpenNow = false;

    // Clear unified filter state
    filters.types.clear();
    filters.areas.clear();
    filters.wetness = null;
    filters.maxWetnessScore = 100;
    filters.openNow = false;
    filters.keywords = '';

    document.querySelectorAll('.tag-option[data-type]').forEach(tag => {
        tag.classList.remove('selected');
    });

    document.querySelectorAll('.location-option').forEach(opt => {
        opt.classList.remove('selected');
    });
    document.querySelector('.location-option[data-location="all"]').classList.add('selected');

    document.querySelectorAll('.wetness-option').forEach(opt => {
        opt.classList.remove('selected');
    });
    document.querySelector('.wetness-option[data-wetness="any"]').classList.add('selected');

    // Reset wetness slider
    const wetnessSlider = document.getElementById('wetnessSlider');
    const wetnessValue = document.getElementById('wetnessValue');
    if (wetnessSlider) {
        wetnessSlider.value = 100;
        if (wetnessValue) wetnessValue.textContent = '100%';
    }

    document.getElementById('preferences').value = '';
    document.getElementById('openNowFilter').checked = false;
    updateCounter();
    updateDoneButtonLabels();
}

function toggleOpenNow() {
    filterOpenNow = document.getElementById('openNowFilter').checked;
    filters.openNow = filterOpenNow; // Sync with unified filter state
    updateCounter();
    updateDoneButtonLabels();
}

function clearPrerequisites() {
    selectedPrerequisites = [];
    filters.constraints.clear(); // Clear unified filter state
    document.querySelectorAll('.prereq-tag').forEach(tag => {
        tag.classList.remove('selected');
    });
    updatePrereqCounter();
    updateCounter();
    updateDoneButtonLabels();
}

function applyPrerequisites() {
    closePrerequisites();
}

// applyFilters is defined in filter-state.js and exposed on window

// Close modals when clicking outside
document.querySelectorAll('.modal, .prerequisites-modal').forEach(modal => {
    modal.addEventListener('click', function (e) {
        if (e.target === this) {
            this.classList.remove('active');
        }
    });
});

// Activity Modal Functions
let currentActivity = null;
let savedActivities = JSON.parse(localStorage.getItem('savedActivities') || '[]');

function openActivityModal(venue) {
    currentActivity = venue;
    const modal = document.getElementById('activityModal');

    const hero = document.getElementById('modalHeroImage');
    if (hero) {
        const heroUrl =
            venue.cardImage ||
            (typeof getCachedImage === 'function' ? getCachedImage(venue.name) : null) ||
            (typeof getPlaceholderImage === 'function' ? getPlaceholderImage(venue) : null);

        if (heroUrl) {
            hero.style.backgroundImage = `url('${heroUrl}')`;
            hero.style.display = '';
        } else {
            hero.style.backgroundImage = '';
            hero.style.display = 'none';
        }
    }

    // Lock body scroll
    document.body.classList.add('modal-open');

    // Track as recently viewed
    addToRecentlyViewed(venue);

    // Set affiliate link on main button and overview button
    const bookBtn = document.getElementById('bookActivityBtn');
    const overviewBookBtn = document.getElementById('overviewBookBtn');

    if (venue.affiliateLink) {
        // Direct affiliate link from database
        const bookAction = () => window.open(venue.affiliateLink, '_blank');
        bookBtn.innerHTML = '<span class="btn-icon">🎟️</span> Book Tickets';
        bookBtn.onclick = bookAction;
        bookBtn.classList.remove('action-btn-secondary');
        bookBtn.classList.add('action-btn-primary');

        if (overviewBookBtn) {
            overviewBookBtn.innerHTML = '<span class="btn-icon">🎟️</span> Book Tickets';
            overviewBookBtn.onclick = bookAction;
        }
    } else {
        // Generate affiliate search links to booking platforms
        const searchQuery = encodeURIComponent(venue.name + ' London');
        const viatorUrl = `https://www.viator.com/searchResults/all?text=${searchQuery}`;
        const gyguUrl = `https://www.getyourguide.com/s/?q=${searchQuery}`;
        const bookAction = () => openBookingOptions(venue.name, viatorUrl, gyguUrl);

        bookBtn.innerHTML = '<span class="btn-icon">🔍</span> Find Tickets';
        bookBtn.onclick = bookAction;
        bookBtn.classList.remove('action-btn-secondary');
        bookBtn.classList.add('action-btn-primary');

        if (overviewBookBtn) {
            overviewBookBtn.innerHTML = '<span class="btn-icon">🔍</span> Find Tickets';
            overviewBookBtn.onclick = bookAction;
        }
    }
    document.getElementById('activityTitle').textContent = venue.name;
    document.getElementById('activityRating').textContent = venue.rating;
    document.getElementById('activityPrice').textContent = venue.priceDisplay;
    document.getElementById('activityLocation').textContent = venue.location;

    // Set umbrella
    let umbrellaEmoji = '🌂';
    if (venue.wetness === 'slightly') umbrellaEmoji = '☂️';
    else if (venue.wetness === 'wet') umbrellaEmoji = '☔️';
    document.getElementById('activityUmbrella').textContent = umbrellaEmoji;

    // Set wetness score indicator
    const wetnessScore = venue.wetnessScore || 0;
    const wetnessPercent = Math.round(wetnessScore);
    const modalWetnessFill = document.getElementById('modalWetnessFill');
    const modalWetnessLabel = document.getElementById('modalWetnessLabel');
    if (modalWetnessFill) modalWetnessFill.style.width = `${wetnessPercent}%`;
    if (modalWetnessLabel) modalWetnessLabel.textContent = `${wetnessPercent}% wet`;

    // Set stars
    const fullStars = Math.floor(venue.rating);
    const hasHalfStar = venue.rating % 1 >= 0.5;
    let starsHTML = '★'.repeat(fullStars);
    if (hasHalfStar) starsHTML += '☆';
    starsHTML += '☆'.repeat(5 - fullStars - (hasHalfStar ? 1 : 0));
    document.getElementById('activityStars').textContent = starsHTML;

    // Set description
    let descriptionHTML = `<p>${venue.description}</p>`;

    // Add helpful note for generic venues (those with minimal prerequisites)
    const hasDetailedInfo = venue.openingHours ||
        (venue.prerequisites && venue.prerequisites.length > 2);

    if (!hasDetailedInfo) {
        descriptionHTML += `
                    <div style="margin-top: 1rem; padding: 0.75rem 1rem; background: #f0f9ff; border-left: 3px solid #DCDAF5; border-radius: 4px; font-size: 0.875rem; color: #555;">
                        <strong>💡 Planning your visit?</strong> We've provided smart recommendations based on this activity type. 
                        For specific details, opening times, and bookings, please check the venue's official website or contact them directly.
                    </div>
                `;
    }

    document.getElementById('activityDescription').innerHTML = descriptionHTML;

    // Extract station name and set transport info
    const description = venue.description;
    let stationName = 'Check venue for details';
    let transportDetails = 'Easily accessible by tube';

    // Try to extract station name from description
    const stationPatterns = [
        /([A-Z][A-Za-z\s']+(?:Square|Street|Road|Bridge|Cross|Gate|Park|Hill|Station|Circus))\s+(?:station|tube|direct)/i,
        /([A-Z][A-Za-z\s']+)\s+(?:station|direct)/i,
        /from\s+([A-Z][A-Za-z\s']+)\s+station/i,
    ];

    for (const pattern of stationPatterns) {
        const match = description.match(pattern);
        if (match) {
            stationName = match[1].trim();
            break;
        }
    }

    // Build transport text with walk time
    if (description.includes('direct') || description.includes('Direct')) {
        transportDetails = 'Direct tube access - stay completely dry!';
    } else if (description.includes('min')) {
        const timeMatch = description.match(/(\d+)\s*min/);
        if (timeMatch) {
            transportDetails = `${timeMatch[1]} minute walk from station`;
        }
    }

    document.getElementById('activityTransport').innerHTML = `
                ${transportDetails}<br>
                <strong>Nearest Station:</strong> ${stationName}
            `;

    // Set accessibility
    const hasWheelchair = venue.prerequisites && venue.prerequisites.includes('wheelchair accessible');
    const hasStepFree = venue.prerequisites && venue.prerequisites.includes('step-free');
    const hasLift = venue.prerequisites && venue.prerequisites.includes('lift access');
    let accessText = [];
    if (hasWheelchair) accessText.push('♿ Wheelchair accessible');
    if (hasStepFree) accessText.push('✓ Step-free access');
    if (hasLift) accessText.push('🛗 Lift available');

    // Default accessibility text if nothing specific
    if (accessText.length === 0) {
        accessText.push('Please contact venue for accessibility information');
        // Add likely accessibility based on venue type and wetness
        if (venue.wetness === 'dry') {
            accessText.push('Direct station access likely has step-free options');
        }
    }

    document.getElementById('activityAccessibility').textContent = accessText.join(' • ');

    // Set booking info
    const needsBooking = venue.prerequisites && venue.prerequisites.includes('booking required');
    const walkInsWelcome = venue.prerequisites && venue.prerequisites.includes('walk-ins welcome');
    let bookingText = '';

    if (needsBooking) {
        bookingText = '📅 Advance booking required - book online or by phone';
    } else if (walkInsWelcome) {
        bookingText = '🚶 Walk-ins welcome - no booking needed';
    } else {
        // Smart defaults based on activity type
        if (venue.type.includes('theatre') || venue.type.includes('music') || venue.type.includes('comedy')) {
            bookingText = '🎫 Tickets required - book in advance for best seats';
        } else if (venue.type.includes('dining') && venue.price >= 30) {
            bookingText = '🍽️ Booking recommended, especially for dinner service';
        } else if (venue.type.includes('wellness')) {
            bookingText = '📞 Advance booking required for treatments';
        } else if (venue.price === 0) {
            bookingText = '🎫 Free entry - walk-ins welcome during opening hours';
        } else {
            bookingText = '🎫 Check availability online or contact venue';
        }
    }

    document.getElementById('activityBooking').textContent = bookingText;

    // Set opening hours
    if (venue.openingHours) {
        const formattedHours = formatOpeningHours(venue);
        const isOpen = isVenueOpenNow(venue);
        const closingSoon = isClosingSoon(venue);

        let statusText = '';
        if (isOpen === true) {
            if (closingSoon) {
                const timeLeft = getHoursUntilClosing(venue);
                statusText = `\n\n🟡 Closes in ${timeLeft}`;
            } else {
                const closingTime = getClosingTime(venue);
                statusText = `\n\n🟢 Open now - Closes at ${closingTime}`;
            }
        } else if (isOpen === false) {
            statusText = '\n\n🔴 Closed now';
        }

        document.getElementById('activityOpeningHours').textContent = formattedHours + statusText;
    } else {
        document.getElementById('activityOpeningHours').textContent = 'Hours not available - please check venue website';
    }

    // Set duration
    const hasFullDay = venue.prerequisites && venue.prerequisites.includes('full day');
    const hasHalfDay = venue.prerequisites && venue.prerequisites.includes('half day');
    const hasUnder1Hour = venue.prerequisites && venue.prerequisites.includes('under 1 hour');
    let durationText = '';

    if (hasFullDay) {
        durationText = '⏰ Full day experience (4+ hours recommended)';
    } else if (hasHalfDay) {
        durationText = '⏰ Half day visit (2-3 hours typical)';
    } else if (hasUnder1Hour) {
        durationText = '⏰ Quick visit (under 1 hour)';
    } else {
        // Smart defaults based on activity type
        if (venue.type.includes('museums') || venue.type.includes('historic')) {
            durationText = '⏰ 2-4 hours recommended to fully explore';
        } else if (venue.type.includes('galleries')) {
            durationText = '⏰ 1-3 hours depending on exhibitions';
        } else if (venue.type.includes('theatre') || venue.type.includes('music') || venue.type.includes('comedy')) {
            durationText = '⏰ 2-3 hours including intervals';
        } else if (venue.type.includes('dining')) {
            durationText = '⏰ 1-2 hours for a leisurely meal';
        } else if (venue.type.includes('cinema')) {
            durationText = '⏰ 2-3 hours including previews';
        } else if (venue.type.includes('wellness')) {
            durationText = '⏰ 1-3 hours depending on treatment';
        } else if (venue.type.includes('shopping')) {
            durationText = '⏰ 1-3 hours for browsing';
        } else if (venue.type.includes('gaming') || venue.type.includes('entertainment')) {
            durationText = '⏰ 1-2 hours typical session';
        } else if (venue.type.includes('workshops')) {
            durationText = '⏰ 2-4 hours including instruction';
        } else {
            durationText = '⏰ 1-3 hours typical visit';
        }
    }

    document.getElementById('activityDuration').textContent = durationText;

    // Set what's included
    const includesList = document.getElementById('activityIncludes');
    const highlights = [];

    // Type-specific highlights
    if (venue.type.includes('museums')) {
        highlights.push('Permanent collection access', 'Educational exhibits', 'Audio guide available');
    }
    if (venue.type.includes('galleries')) {
        highlights.push('Curated art collections', 'Rotating exhibitions', 'Gallery talks');
    }
    if (venue.type.includes('dining')) {
        highlights.push('Full menu', 'Indoor seating', 'Dietary options available');
    }
    if (venue.type.includes('theatre')) {
        highlights.push('Live performance', 'Professional production', 'Theatre seating');
    }
    if (venue.type.includes('entertainment')) {
        highlights.push('Indoor activities', 'Modern facilities', 'Group bookings available');
    }
    if (venue.type.includes('cinema')) {
        highlights.push('Multiple screens', 'Comfortable seating', 'Concessions available');
    }
    if (venue.type.includes('wellness')) {
        highlights.push('Professional treatments', 'Relaxing environment', 'Expert staff');
    }
    if (venue.type.includes('shopping')) {
        highlights.push('Wide selection', 'Indoor browsing', 'Various retailers');
    }
    if (venue.type.includes('nightlife')) {
        highlights.push('Licensed bar', 'Entertainment', 'Late opening');
    }
    if (venue.type.includes('music')) {
        highlights.push('Live music', 'Quality sound system', 'Bar available');
    }
    if (venue.type.includes('comedy')) {
        highlights.push('Live comedy acts', 'Bar service', 'Intimate venue');
    }
    if (venue.type.includes('gaming')) {
        highlights.push('Modern gaming equipment', 'Private sessions', 'Instruction provided');
    }
    if (venue.type.includes('workshops')) {
        highlights.push('Expert instruction', 'All materials included', 'Small group sizes');
    }
    if (venue.type.includes('sports')) {
        highlights.push('Professional equipment', 'Changing facilities', 'Instruction available');
    }
    if (venue.type.includes('historic')) {
        highlights.push('Historic building', 'Guided tours available', 'Educational information');
    }
    if (venue.type.includes('exhibitions')) {
        highlights.push('Immersive experience', 'Modern technology', 'Photo opportunities');
    }

    // Prerequisites-based highlights
    if (venue.prerequisites && venue.prerequisites.includes('cafe on-site')) highlights.push('On-site café');
    if (venue.prerequisites && venue.prerequisites.includes('toilets available')) highlights.push('Facilities available');
    if (venue.prerequisites && venue.prerequisites.includes('gift shop')) highlights.push('Gift shop');
    if (venue.prerequisites && venue.prerequisites.includes('lockers available')) highlights.push('Secure storage');

    // Default highlights if nothing added yet
    if (highlights.length === 0) {
        highlights.push('Indoor venue', 'Professional service', 'Great atmosphere');
    }

    includesList.innerHTML = highlights.map(h => `<li>${h}</li>`).join('');

    // Set tips
    const tipsList = document.getElementById('activityTips');
    const tips = [];

    // Weather-related tips
    if (venue.wetness === 'dry') {
        tips.push('✨ Direct tube access - stay completely dry!');
    } else if (venue.wetness === 'slightly') {
        tips.push('☂️ 5-10 minute walk from station - bring an umbrella on rainy days');
    } else if (venue.wetness === 'wet') {
        tips.push('☔ 10+ minute walk - dress for the weather');
    }

    // Booking tips
    if (venue.prerequisites && venue.prerequisites.includes('booking required')) {
        tips.push('📅 Book ahead to guarantee entry');
    } else if (venue.prerequisites && venue.prerequisites.includes('walk-ins welcome')) {
        tips.push('🚶 Walk-ins welcome - no booking needed');
    }

    // Price tips
    if (venue.price === 0) {
        tips.push('🎫 Free entry - donations welcome');
    } else if (venue.price < 15) {
        tips.push('💷 Great value for money');
    } else if (venue.price >= 50) {
        tips.push('💎 Premium experience - worth the splurge');
    }

    // Activity-specific tips
    if (venue.prerequisites && venue.prerequisites.includes('child-friendly')) {
        tips.push('👨‍👩‍👧‍👦 Great for families and children');
    }
    if (venue.prerequisites && venue.prerequisites.includes('photography allowed')) {
        tips.push('📸 Photography permitted - capture the memories!');
    }
    if (venue.type.includes('museums') || venue.type.includes('galleries')) {
        tips.push('🎨 Allow 2-3 hours to fully explore');
    }
    if (venue.type.includes('dining')) {
        tips.push('🍽️ Consider booking for busy periods (lunch & dinner)');
    }
    if (venue.type.includes('theatre') || venue.type.includes('music') || venue.type.includes('comedy')) {
        tips.push('🎭 Check show times and book tickets in advance');
    }
    if (venue.type.includes('wellness')) {
        tips.push('💆 Arrive 10-15 minutes early to relax and prepare');
    }
    if (venue.type.includes('nightlife')) {
        tips.push('🌙 Check opening hours - may vary by day of week');
    }

    // Default tips if nothing added yet
    if (tips.length === 0) {
        tips.push('🌧️ Perfect rainy day activity');
        tips.push('🚇 Easily accessible by London Underground');
        tips.push('⏰ Check opening times before visiting');
    }

    tipsList.innerHTML = tips.map(t => `<li>${t}</li>`).join('');

    // Set venue name for search button
    document.getElementById('venueSearchName').textContent = venue.name;

    // Update bookmark button
    updateBookmarkButton();

    // Reset gallery state for new venue
    galleryLoadedFor = null;
    galleryImages = [];

    // Show modal
    modal.classList.add('active');

    // Reset to overview tab (programmatic call)
    resetToOverviewTab();
}

function closeActivityModal() {
    document.getElementById('activityModal').classList.remove('active');
    document.body.classList.remove('modal-open');
    currentActivity = null;
}

function searchVenueOnline() {
    if (!currentActivity) return;

    // Create search query with venue name and "London"
    const searchQuery = encodeURIComponent(`${currentActivity.name} London`);
    const searchUrl = `https://www.google.com/search?q=${searchQuery}`;

    // Open in new tab
    window.open(searchUrl, '_blank');
}

// Helper to reset to overview tab (programmatic, no event)
function resetToOverviewTab() {
    document.querySelectorAll('.activity-tab').forEach(tab => {
        tab.classList.remove('active');
    });
    const overviewTabBtn = document.querySelector('.activity-tab');
    if (overviewTabBtn) overviewTabBtn.classList.add('active');

    document.querySelectorAll('.activity-tab-content').forEach(content => {
        content.classList.remove('active');
    });
    const overviewTab = document.getElementById('overview-tab');
    if (overviewTab) overviewTab.classList.add('active');
}

function switchTab(tabName) {
    // Update tab buttons
    document.querySelectorAll('.activity-tab').forEach(tab => {
        tab.classList.remove('active');
    });
    // Use event.target if available (click), otherwise find the tab button
    if (typeof event !== 'undefined' && event && event.target) {
        event.target.classList.add('active');
    } else {
        const tabBtn = document.querySelector(`.activity-tab[onclick*="${tabName}"]`);
        if (tabBtn) tabBtn.classList.add('active');
    }

    // Update tab content
    document.querySelectorAll('.activity-tab-content').forEach(content => {
        content.classList.remove('active');
    });
    document.getElementById(tabName + '-tab').classList.add('active');

    // Load gallery images when gallery tab is selected
    if (tabName === 'gallery' && currentActivity) {
        loadGalleryImages(currentActivity.name);
    }

    // Load reviews when reviews tab is selected
    if (tabName === 'reviews' && currentActivity) {
        loadReviews(currentActivity.name);
    }
}

// Gallery state to avoid re-fetching
let galleryLoadedFor = null;
let galleryImages = [];

async function loadGalleryImages(venueName) {
    // Don't reload if already loaded for this venue
    if (galleryLoadedFor === venueName && galleryImages.length > 0) {
        return;
    }

    const loadingEl = document.getElementById('galleryLoading');
    const galleryEl = document.getElementById('activityGallery');
    const emptyEl = document.getElementById('galleryEmpty');
    const hintEl = document.getElementById('galleryHint');
    const mainEl = document.getElementById('galleryMain');
    const thumbsEl = document.getElementById('galleryThumbs');

    // Show loading state
    if (loadingEl) loadingEl.style.display = 'block';
    if (galleryEl) galleryEl.style.display = 'none';
    if (emptyEl) emptyEl.style.display = 'none';
    if (hintEl) hintEl.style.display = 'none';

    try {
        // Fetch multiple photos from Places API
        const photos = await fetchPlacesGalleryImages(venueName);

        if (photos && photos.length > 0) {
            galleryImages = photos;
            galleryLoadedFor = venueName;

            // Set main image
            if (mainEl) {
                mainEl.style.backgroundImage = `url('${photos[0]}')`;
                mainEl.onclick = () => window.open(photos[0], '_blank');
            }

            // Create thumbnails
            if (thumbsEl) {
                thumbsEl.innerHTML = photos.slice(0, 6).map((url, index) => `
                    <div class="gallery-thumb"
                         style="background-image: url('${url}'); background-size: cover; background-position: center;"
                         onclick="setGalleryMainImage('${url}')"
                         data-index="${index}">
                    </div>
                `).join('');
            }

            // Show gallery
            if (loadingEl) loadingEl.style.display = 'none';
            if (galleryEl) galleryEl.style.display = 'grid';
            if (hintEl && photos.length > 1) hintEl.style.display = 'block';
        } else {
            // No images found
            if (loadingEl) loadingEl.style.display = 'none';
            if (emptyEl) emptyEl.style.display = 'block';
        }
    } catch (error) {
        console.warn('Failed to load gallery images:', error);
        if (loadingEl) loadingEl.style.display = 'none';
        if (emptyEl) emptyEl.style.display = 'block';
    }
}

function setGalleryMainImage(url) {
    const mainEl = document.getElementById('galleryMain');
    if (mainEl) {
        mainEl.style.backgroundImage = `url('${url}')`;
        mainEl.onclick = () => window.open(url, '_blank');
    }
}

// Fetch multiple photos from Google Places API
async function fetchPlacesGalleryImages(venueName) {
    const q = (venueName || '').replace(/, London$/i, '').trim();
    if (!q) return [];

    try {
        // First, get the place details with multiple photos
        const resp = await fetch(`/api/place-photo?q=${encodeURIComponent(q + ' London')}&gallery=true`);
        if (!resp.ok) return [];

        const data = await resp.json();

        // If API returned gallery URLs, use them
        if (data && data.galleryUrls && Array.isArray(data.galleryUrls)) {
            return data.galleryUrls;
        }

        // Otherwise, if we have a single imageUrl, return it as array
        if (data && data.imageUrl) {
            return [data.imageUrl];
        }

        return [];
    } catch (e) {
        console.warn('Gallery fetch error:', e);
        return [];
    }
}

// Make function available globally
window.setGalleryMainImage = setGalleryMainImage;

async function bookmarkActivity() {
    if (!currentActivity) return;

    // Load current saved activities
    const savedActivities = JSON.parse(localStorage.getItem('savedActivities') || '[]');

    // Check if already bookmarked (by name)
    const index = savedActivities.findIndex(v => v.name === currentActivity.name);

    let wasAdded = false;
    if (index > -1) {
        // Remove bookmark
        savedActivities.splice(index, 1);
        wasAdded = false;
    } else {
        // Add bookmark - save the full venue object
        savedActivities.push(currentActivity);
        wasAdded = true;
    }

    // Save to localStorage
    localStorage.setItem('savedActivities', JSON.stringify(savedActivities));

    // Update the modal button
    updateBookmarkButton();

    // Update all bookmark icons on the page
    updateBookmarkIcons();

    // Refresh bookmarks section
    await showBookmarks();

    // Show toast notification
    if (wasAdded) {
        showBookmarkToast(true);
    } else {
        showBookmarkToast(false);
    }
}

function showToast(icon, message) {
    const toast = document.getElementById('toast');
    const toastIcon = document.getElementById('toastIcon');
    const toastMessage = document.getElementById('toastMessage');

    toastIcon.textContent = icon;
    toastMessage.textContent = message;

    // Show toast
    toast.classList.add('show');

    // Hide after 3 seconds
    setTimeout(() => {
        toast.classList.remove('show');
    }, 3000);
}


function showBookmarkToast(wasAdded) {
    const toast = document.getElementById('toast');
    const toastIcon = document.getElementById('toastIcon');
    const toastMessage = document.getElementById('toastMessage');

    if (!toast || !toastIcon || !toastMessage) return;

    const bookmarkSvg = `
        <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
            <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"></path>
        </svg>
    `;

    toastIcon.innerHTML = bookmarkSvg;
    toastMessage.textContent = wasAdded ? 'Saved added to bookmarks' : 'Removed from bookmarks';

    toast.classList.add('show');
    setTimeout(() => {
        toast.classList.remove('show');
    }, 3000);
}

function updateBookmarkButton() {
    if (!currentActivity) return;

    // Load current saved activities
    const savedActivities = JSON.parse(localStorage.getItem('savedActivities') || '[]');
    const isSaved = savedActivities.some(v => v.name === currentActivity.name);

    const btn = document.getElementById('bookmarkActionBtn');
    if (!btn) return;

    if (isSaved) {
        const checkSvg = `
            <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
                <path d="M20 6L9 17l-5-5"></path>
            </svg>
        `;

        btn.innerHTML = `<span id="bookmarkIcon" class="bookmark-btn-icon">${checkSvg}</span> Saved`;
        btn.style.background = '#10b981';
        btn.style.color = 'white';
    } else {
        const bookmarkSvg = `
            <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
                <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"></path>
            </svg>
        `;

        btn.innerHTML = `<span id="bookmarkIcon" class="bookmark-btn-icon">${bookmarkSvg}</span> Save`;
        btn.style.background = '';
        btn.style.color = '';
    }
}

function shareActivity() {
    if (!currentActivity) return;

    // Populate share modal with activity details
    document.getElementById('shareActivityName').textContent = currentActivity.name;
    document.getElementById('shareActivityDescription').textContent = currentActivity.description;

    // Set activity image (use Unsplash or placeholder)
    const imageElement = document.getElementById('shareActivityImage');
    fetchVenueImage(currentActivity.name).then(imageUrl => {
        if (imageUrl) {
            imageElement.style.backgroundImage = `url('${imageUrl}')`;
        } else {
            imageElement.style.backgroundImage = `url('${getPlaceholderImage(currentActivity)}')`;
            imageElement.style.backgroundSize = 'cover';
        }
    });

    // Generate shareable link (for now, just the current URL with activity name)
    // In production, you'd want to create unique URLs for each activity
    const shareUrl = `${window.location.origin}${window.location.pathname}#${encodeURIComponent(currentActivity.name)}`;
    document.getElementById('shareLink').value = shareUrl;

    // Show share modal
    document.getElementById('shareModal').classList.add('active');
}

function closeShareModal() {
    document.getElementById('shareModal').classList.remove('active');
}

// Booking options popup
function openBookingOptions(venueName, viatorUrl, gyguUrl) {
    const bookingModal = document.getElementById('bookingModal');
    if (bookingModal) {
        document.getElementById('bookingVenueName').textContent = venueName;
        document.getElementById('viatorLink').href = viatorUrl;
        document.getElementById('gyguLink').href = gyguUrl;
        document.getElementById('googleSearchLink').href = `https://www.google.com/search?q=${encodeURIComponent(venueName + ' London tickets book')}`;
        bookingModal.classList.add('active');
    } else {
        // Fallback: open Viator directly
        window.open(viatorUrl, '_blank');
    }
}

function closeBookingModal() {
    const bookingModal = document.getElementById('bookingModal');
    if (bookingModal) bookingModal.classList.remove('active');
}

window.openBookingOptions = openBookingOptions;
window.closeBookingModal = closeBookingModal;

// Close share modal when clicking outside
document.addEventListener('DOMContentLoaded', function () {
    document.getElementById('shareModal').addEventListener('click', function (e) {
        if (e.target === this) {
            closeShareModal();
        }
    });
});

function copyShareLink() {
    const shareLink = document.getElementById('shareLink');
    const copyBtn = document.getElementById('copyLinkBtn');

    shareLink.select();
    shareLink.setSelectionRange(0, 99999); // For mobile devices

    navigator.clipboard.writeText(shareLink.value).then(() => {
        // Update button to show success
        copyBtn.textContent = '✓ Copied!';
        copyBtn.classList.add('copied');

        // Show toast notification
        showToast('✅', 'Link copied to clipboard!');

        // Reset button after 2 seconds
        setTimeout(() => {
            copyBtn.textContent = 'Copy Link';
            copyBtn.classList.remove('copied');
        }, 2000);
    }).catch(err => {
        console.error('Failed to copy:', err);
        showToast('❌', 'Failed to copy link');
    });
}

function shareViaWhatsApp() {
    if (!currentActivity) return;

    const text = `Check out ${currentActivity.name} on Wet London!\n\n${currentActivity.description}\n\n${currentActivity.priceDisplay} | ${currentActivity.location}`;
    const shareUrl = document.getElementById('shareLink').value;
    const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(text + '\n\n' + shareUrl)}`;

    window.open(whatsappUrl, '_blank');
    showToast('💬', 'Opening WhatsApp...');
}

function shareViaEmail() {
    if (!currentActivity) return;

    const subject = `Check out ${currentActivity.name} on Wet London`;
    const body = `I thought you might be interested in this activity:\n\n${currentActivity.name}\n${currentActivity.description}\n\nPrice: ${currentActivity.priceDisplay}\nLocation: ${currentActivity.location}\n\nView details: ${document.getElementById('shareLink').value}`;

    const mailtoUrl = `mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    window.location.href = mailtoUrl;
    showToast('📧', 'Opening email client...');
}

function shareViaTwitter() {
    if (!currentActivity) return;

    const text = `Discovered ${currentActivity.name} on Wet London! ${currentActivity.priceDisplay} | ${currentActivity.location}`;
    const shareUrl = document.getElementById('shareLink').value;
    const twitterUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(shareUrl)}`;

    window.open(twitterUrl, '_blank', 'width=550,height=420');
    showToast('🐦', 'Opening Twitter...');
}

function shareViaFacebook() {
    if (!currentActivity) return;

    const shareUrl = document.getElementById('shareLink').value;
    const facebookUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`;

    window.open(facebookUrl, '_blank', 'width=550,height=420');
    showToast('📘', 'Opening Facebook...');
}

// Helper: pull the card image URL so the modal can use it
function getCardImageUrl(card) {
    try {
        const imgDiv = card ? card.querySelector('.activity-image') : null;
        if (!imgDiv) return null;
        const bg = window.getComputedStyle(imgDiv).backgroundImage || '';
        const match = /url\(["']?(.*?)["']?\)/.exec(bg);
        return match && match[1] ? match[1] : null;
    } catch (e) {
        return null;
    }
}

// Update View Details buttons to open modal
function updateViewDetailsButtons() {
    // Handle "View Details" button clicks
    document.querySelectorAll('.book-btn').forEach((btn, index) => {
        btn.onclick = function (e) {
            e.preventDefault();
            e.stopPropagation(); // Prevent card click from also firing
            const card = this.closest('.activity-card');
            const cardImageUrl = getCardImageUrl(card);
            const venueName = card.querySelector('h3').textContent;
            let venue = window.londonVenues.find(v => v.name === venueName);

            // If venue not found in database, create a fallback venue object
            if (!venue) {
                const description = card.querySelector('p')?.textContent || 'A wonderful London activity perfect for any weather.';
                const priceText = card.querySelector('.price')?.textContent || 'Check venue for pricing';
                const locationText = card.querySelector('.tag:nth-child(2)')?.textContent || 'Central London';
                const typeText = card.querySelector('.tag:nth-child(1)')?.textContent || 'entertainment';
                const wetnessText = card.querySelector('.tag:nth-child(3)')?.textContent || 'dry';

                let price = 30;
                if (priceText.includes('Free')) price = 0;
                else if (priceText.includes('££££')) price = 80;
                else if (priceText.includes('£££')) price = 50;
                else if (priceText.includes('££')) price = 30;
                else if (priceText.includes('£')) price = 15;

                venue = {
                    name: venueName,
                    description: description,
                    type: [typeText.toLowerCase()],
                    location: locationText,
                    wetness: wetnessText.toLowerCase(),
                    price: price,
                    priceDisplay: priceText,
                    rating: 4.5,
                    prerequisites: ['check venue for details']
                };
            }

            // Pass the card image into the modal hero
            if (cardImageUrl) venue.cardImage = cardImageUrl;

            openActivityModal(venue);
        };
    });

    // Handle activity card clicks (but not bookmark icon or button)
    document.querySelectorAll('.activity-card').forEach(card => {
        card.onclick = function (e) {
            const cardImageUrl = getCardImageUrl(this);
            // Don't trigger if clicking bookmark icon or View Details button
            if (e.target.closest('.bookmark-icon') || e.target.closest('.book-btn')) {
                return;
            }

            const venueName = this.querySelector('h3').textContent;
            let venue = window.londonVenues.find(v => v.name === venueName);

            if (!venue) {
                const description = this.querySelector('p')?.textContent || 'A wonderful London activity perfect for any weather.';
                const priceText = this.querySelector('.price')?.textContent || 'Check venue for pricing';
                const locationText = this.querySelector('.tag:nth-child(2)')?.textContent || 'Central London';
                const typeText = this.querySelector('.tag:nth-child(1)')?.textContent || 'entertainment';
                const wetnessText = this.querySelector('.tag:nth-child(3)')?.textContent || 'dry';

                let price = 30;
                if (priceText.includes('Free')) price = 0;
                else if (priceText.includes('££££')) price = 80;
                else if (priceText.includes('£££')) price = 50;
                else if (priceText.includes('££')) price = 30;
                else if (priceText.includes('£')) price = 15;

                venue = {
                    name: venueName,
                    description: description,
                    type: [typeText.toLowerCase()],
                    location: locationText,
                    wetness: wetnessText.toLowerCase(),
                    price: price,
                    priceDisplay: priceText,
                    rating: 4.5,
                    prerequisites: ['check venue for details']
                };
            }

            // Pass the card image into the modal hero
            if (cardImageUrl) venue.cardImage = cardImageUrl;

            openActivityModal(venue);
        };
    });
}

// Close activity modal when clicking outside
document.getElementById('activityModal').addEventListener('click', function (e) {
    if (e.target === this) {
        closeActivityModal();
    }
});

// Category functions
function toggleCategories() {
    const grid = document.getElementById('categoryGrid');
    const btn = document.getElementById('showMoreCategories');

    if (grid.classList.contains('expanded')) {
        grid.classList.remove('expanded');
        btn.textContent = 'Show More Categories';
    } else {
        grid.classList.add('expanded');
        btn.textContent = 'Show Less Categories';
    }
}

// I'm Feeling Lucky function
async function feelingLucky() {
    if (window.__venuesSource !== 'supabase' || !window.__venuesLoaded) {
        alert('Venues are still loading from Supabase. Try again in a moment.');
        return;
    }

    // Get 6 random venues
    const shuffled = [...window.londonVenues].sort(() => Math.random() - 0.5);
    const randomVenues = shuffled.slice(0, 6);

    try {
        // Render the random venues in the lucky grid
        const luckyGrid = document.getElementById('luckyGrid');
        const luckySection = document.getElementById('luckySelection');

        if (!luckyGrid || !luckySection) {
            console.error('Lucky selection elements not found');
            return;
        }

        // Generate HTML for lucky cards
        const luckyHTML = randomVenues.map((venue, index) => {
            const cachedImage = getCachedImage(venue.name);
            const backgroundStyle = cachedImage
                ? `background-image: url('${cachedImage}'); background-size: cover; background-position: center;`
                : `background-image: url('${getPlaceholderImage(venue)}'); background-size: cover; background-position: center;`;

            return createActivityCardHTML(venue, index, { idPrefix: 'lucky-card', showId: true });
        }).join('');

        luckyGrid.innerHTML = luckyHTML;

        // Lazy load images
        randomVenues.forEach(async (venue, index) => {
            if (!getCachedImage(venue.name)) {
                const imageUrl = await fetchVenueImage(venue.name);
                if (imageUrl) {
                    const card = document.getElementById(`lucky-card-${index}`);
                    if (card) {
                        const imgDiv = card.querySelector('.activity-image');
                        if (imgDiv) {
                            imgDiv.style.backgroundImage = `url('${imageUrl}')`;
                            imgDiv.style.backgroundSize = 'cover';
                        }
                    }
                }
            }
        });

        // Update View Details buttons and bookmark icons
        setTimeout(() => {
            updateViewDetailsButtons();
            updateBookmarkIcons();
        }, 100);

        // Show the lucky selection section
        luckySection.style.display = 'block';

        // Scroll to lucky selection
        setTimeout(() => {
            luckySection.scrollIntoView({
                behavior: 'smooth',
                block: 'start'
            });
        }, 100);
    } catch (error) {
        console.error('Error in Feeling Lucky:', error);
        alert('An error occurred. Please try again.');
    }
}

// Bookmark functions
async function toggleBookmarkFromCard(event, venueName) {
    event.stopPropagation();
    const bookmarkIcon = (event.currentTarget && event.currentTarget.classList && event.currentTarget.classList.contains('bookmark-icon'))
        ? event.currentTarget
        : (event.target && event.target.closest ? event.target.closest('.bookmark-icon') : null);

    if (!bookmarkIcon) return;
    const savedActivities = JSON.parse(localStorage.getItem('savedActivities') || '[]');

    // Find the venue in our database
    let venue = window.londonVenues.find(v => v.name === venueName);

    // If venue not found, create a fallback object from the card
    if (!venue) {
        const card = bookmarkIcon.closest('.activity-card');
        if (card) {
            const description = card.querySelector('p')?.textContent || 'A wonderful London activity perfect for any weather.';
            const priceText = card.querySelector('.price')?.textContent || 'Check venue for pricing';
            const locationText = card.querySelector('.tag:nth-child(2)')?.textContent || 'Central London';
            const typeText = card.querySelector('.tag:nth-child(1)')?.textContent || 'entertainment';
            const wetnessText = card.querySelector('.tag:nth-child(3)')?.textContent || 'dry';

            // Parse price
            let price = 30;
            if (priceText.includes('Free')) price = 0;
            else if (priceText.includes('££££')) price = 80;
            else if (priceText.includes('£££')) price = 50;
            else if (priceText.includes('££')) price = 30;
            else if (priceText.includes('£')) price = 15;
            else {
                const match = priceText.match(/£(\d+)/);
                if (match) price = parseInt(match[1]);
            }

            venue = {
                name: venueName,
                description: description,
                type: [typeText.toLowerCase().replace(/\s+/g, '-')],
                location: locationText,
                wetness: wetnessText.toLowerCase().replace(' ', '-'),
                price: price,
                priceDisplay: priceText,
                rating: 4.5,
                prerequisites: ['check venue for details']
            };
        } else {
            // If we can't even find the card, silently fail
            return;
        }
    }

    // Check if already bookmarked
    const index = savedActivities.findIndex(v => v.name === venueName);
    const wasAdded = index === -1;

    if (index > -1) {
        // Remove bookmark
        savedActivities.splice(index, 1);
        bookmarkIcon.classList.remove('saved');
    } else {
        // Add bookmark
        savedActivities.push(venue);
        bookmarkIcon.classList.add('saved');

        // Trigger celebration animation
        triggerBookmarkCelebration(bookmarkIcon);
    }

    // Save to localStorage
    localStorage.setItem('savedActivities', JSON.stringify(savedActivities));

    // Update bookmarks section
    await showBookmarks();

    // Toast
    showBookmarkToast(wasAdded);
}

// Expose toggleBookmarkFromCard globally for inline onclick handlers
window.toggleBookmarkFromCard = toggleBookmarkFromCard;

// ============================================
// BOOKMARK CELEBRATION ANIMATION
// ============================================

function triggerBookmarkCelebration(bookmarkIcon) {
    // Add pulse animation to bookmark icon
    bookmarkIcon.classList.add('just-saved');
    setTimeout(() => bookmarkIcon.classList.remove('just-saved'), 300);

    // Create confetti container
    const celebration = document.createElement('div');
    celebration.className = 'bookmark-celebration';

    // Add confetti particles
    for (let i = 0; i < 8; i++) {
        const particle = document.createElement('div');
        particle.className = 'confetti-particle';
        celebration.appendChild(particle);
    }

    // Position relative to the bookmark icon
    const card = bookmarkIcon.closest('.activity-card');
    if (card) {
        card.style.position = 'relative';
        card.appendChild(celebration);

        // Remove after animation completes
        setTimeout(() => {
            celebration.remove();
        }, 700);
    }
}

// ============================================
// SKELETON LOADING CARDS
// ============================================

function createSkeletonCard() {
    return `
        <article class="skeleton-card">
            <div class="skeleton-image"></div>
            <div class="skeleton-content">
                <div class="skeleton-text short"></div>
                <div class="skeleton-text long"></div>
                <div class="skeleton-text medium"></div>
                <div class="skeleton-tags">
                    <div class="skeleton-tag"></div>
                    <div class="skeleton-tag"></div>
                    <div class="skeleton-tag"></div>
                </div>
            </div>
        </article>
    `;
}

function showSkeletonLoading(gridElement, count = 6) {
    if (!gridElement) return;
    gridElement.innerHTML = Array(count).fill(createSkeletonCard()).join('');
}

// Expose skeleton functions globally
window.showSkeletonLoading = showSkeletonLoading;
window.createSkeletonCard = createSkeletonCard;

async function showBookmarks() {
    const savedActivities = JSON.parse(localStorage.getItem('savedActivities') || '[]');
    const section = document.getElementById('bookmarks');
    const grid = document.getElementById('bookmarksGrid');
    const counter = document.getElementById('bookmarksCount');

    counter.textContent = `${savedActivities.length} ${savedActivities.length === 1 ? 'bookmarked activity' : 'bookmarked activities'}`;

    if (savedActivities.length === 0) {
        grid.innerHTML = `
                    <div style="grid-column: 1 / -1; text-align: center; padding: 4rem 2rem;">
                        <h3 style="margin-bottom: 1rem; font-size: 1.5rem;">No bookmarks yet</h3>
                        <p style="color: #666;">Start bookmarking activities to see them here!</p>
                    </div>
                `;
    } else {
        // Fetch images for bookmarked venues
        const imagePromises = savedActivities.map(venue => fetchVenueImage(venue.name));
        const images = await Promise.all(imagePromises);

        grid.innerHTML = savedActivities.map((venue, index) => {
            const imageUrl = images[index];
            const backgroundStyle = imageUrl
                ? `background-image: url('${imageUrl}');`
                : `background-image: url('${getPlaceholderImage(venue)}'); background-size: cover;`;

            let umbrellaEmoji = '🌂';
            let tooltipText = 'Dry - Direct tube access';
            if (venue.wetness === 'slightly') {
                umbrellaEmoji = '☂️';
                tooltipText = 'Slightly Wet - 5-10 min walk';
            } else if (venue.wetness === 'wet') {
                umbrellaEmoji = '☔️';
                tooltipText = 'Wet - 10+ min walk';
            }

            // Check opening status for bookmarked venue
            return createActivityCardHTML(venue, index, { isSaved: true, showId: false });
        }).join('');

        // Hook up the View Details buttons
        setTimeout(() => updateViewDetailsButtons(), 100);
    }
}

function clearBookmarks() {
    if (confirm('Are you sure you want to clear all bookmarks?')) {
        localStorage.setItem('savedActivities', '[]');
        showBookmarks();

        // Update all bookmark icons on the page
        document.querySelectorAll('.bookmark-icon').forEach(icon => {
            icon.classList.remove('saved');
        });
    }
}

// ============================================
// RECENTLY VIEWED ACTIVITIES
// ============================================
const RECENTLY_VIEWED_KEY = 'wet_london_recently_viewed';
const MAX_RECENTLY_VIEWED = 6;

function addToRecentlyViewed(venue) {
    if (!venue || !venue.name) return;

    let recentlyViewed = JSON.parse(localStorage.getItem(RECENTLY_VIEWED_KEY) || '[]');

    // Remove if already exists (we'll add to front)
    recentlyViewed = recentlyViewed.filter(v => v.name !== venue.name);

    // Add to front of array
    recentlyViewed.unshift({
        name: venue.name,
        type: venue.type,
        location: venue.location,
        wetness: venue.wetness,
        wetnessScore: venue.wetnessScore,
        price: venue.price,
        priceDisplay: venue.priceDisplay,
        description: venue.description,
        rating: venue.rating,
        viewedAt: Date.now()
    });

    // Keep only most recent
    recentlyViewed = recentlyViewed.slice(0, MAX_RECENTLY_VIEWED);

    localStorage.setItem(RECENTLY_VIEWED_KEY, JSON.stringify(recentlyViewed));

    // Update the section
    showRecentlyViewed();
}

async function showRecentlyViewed() {
    const recentlyViewed = JSON.parse(localStorage.getItem(RECENTLY_VIEWED_KEY) || '[]');
    const section = document.getElementById('recentlyViewed');
    const grid = document.getElementById('recentlyViewedGrid');
    const counter = document.getElementById('recentlyViewedCount');

    if (!section || !grid || !counter) return;

    counter.textContent = `${recentlyViewed.length} recently viewed`;

    if (recentlyViewed.length === 0) {
        section.style.display = 'none';
        return;
    }

    section.style.display = 'block';

    // Render cards
    grid.innerHTML = recentlyViewed.map((venue, index) => {
        return createActivityCardHTML(venue, index, {
            showId: false,
            dataAttrs: `data-venue-name="${venue.name}"`
        });
    }).join('');

    // Update View Details buttons
    setTimeout(() => {
        updateViewDetailsButtons();
        updateBookmarkIcons();
    }, 100);

    // Fetch images in background
    setTimeout(async () => {
        const imagePromises = recentlyViewed.map(venue => fetchVenueImage(venue.name));
        const images = await Promise.all(imagePromises);

        images.forEach((imageUrl, index) => {
            if (imageUrl) {
                const card = grid.children[index];
                if (card) {
                    const imgDiv = card.querySelector('.activity-image');
                    if (imgDiv) {
                        imgDiv.style.backgroundImage = `url('${imageUrl}')`;
                    }
                }
            }
        });
    }, 200);
}

function clearRecentlyViewed() {
    if (confirm('Clear your viewing history?')) {
        localStorage.setItem(RECENTLY_VIEWED_KEY, '[]');
        showRecentlyViewed();
    }
}

// Expose globally
window.clearRecentlyViewed = clearRecentlyViewed;

// ============================================
// NEWSLETTER SIGNUP
// ============================================
const NEWSLETTER_STORAGE_KEY = 'wet_london_newsletter_subscribed';

function handleNewsletterSubmit(event) {
    event.preventDefault();

    const emailInput = document.getElementById('newsletterEmail');
    const form = document.getElementById('newsletterForm');
    const successMsg = document.getElementById('newsletterSuccess');
    const submitBtn = form.querySelector('.newsletter-btn');

    const email = emailInput.value.trim();
    if (!email) return;

    // Disable button during "submission"
    submitBtn.disabled = true;
    submitBtn.textContent = 'Subscribing...';

    // In production, you'd send this to your email service (Mailchimp, ConvertKit, etc.)
    // For now, we'll store locally and show success
    // You can later add: fetch('/api/newsletter', { method: 'POST', body: JSON.stringify({ email }) })

    setTimeout(() => {
        // Store that user subscribed (to not show again or personalize)
        localStorage.setItem(NEWSLETTER_STORAGE_KEY, JSON.stringify({
            email: email,
            subscribedAt: Date.now()
        }));

        // Show success
        form.style.display = 'none';
        successMsg.style.display = 'block';

        // Also show a toast
        showToast('📧', 'You\'re subscribed to Rainy Day Alerts!');

        console.log('Newsletter signup:', email);
    }, 800);
}

// Update bookmark icons on page load
function updateBookmarkIcons() {
    const savedActivities = JSON.parse(localStorage.getItem('savedActivities') || '[]');
    const savedNames = savedActivities.map(v => v.name);

    document.querySelectorAll('.bookmark-icon').forEach(icon => {
        const onclickAttr = icon.getAttribute('onclick');
        if (!onclickAttr) return; // Skip if no onclick attribute

        const match = onclickAttr.match(/'([^']+)'/);
        if (!match || !match[1]) return; // Skip if no match

        const venueName = match[1].replace(/\\'/g, "'"); // Unescape any escaped quotes
        if (savedNames.includes(venueName)) {
            icon.classList.add('saved');
        } else {
            icon.classList.remove('saved');
        }
    });
}

// All Activities Page Functions
let allActivitiesDisplayedCount = 0;
let allActivitiesFiltered = [];
let activeCategoryFilters = [];
const ALL_ACTIVITIES_PER_PAGE = 18;

async function initializeAllActivities() {
    // Show all venues first
    allActivitiesFiltered = [...window.londonVenues];
    allActivitiesDisplayedCount = 0;

    // Initialize category chips
    initializeCategoryChips();

    // Update stats (after allActivitiesFiltered is set)
    updateActivityStats();

    // Render activities
    await renderAllActivities();

    // Show back to top button when scrolling
    window.addEventListener('scroll', handleAllActivitiesScroll);
}

function initializeCategoryChips() {
    const categoryChips = document.getElementById('categoryChips');
    if (!categoryChips) return;

    // Get unique categories and count venues per category
    const categoryCounts = {};
    (window.londonVenues || []).forEach(venue => {
        (venue.type || []).forEach(type => {
            categoryCounts[type] = (categoryCounts[type] || 0) + 1;
        });
    });

    // Sort categories by count (descending)
    const sortedCategories = Object.entries(categoryCounts)
        .sort((a, b) => b[1] - a[1]);

    // Open now chip count
    const openCount = (window.londonVenues || []).reduce((acc, v) => acc + (isVenueOpenNow(v) === true ? 1 : 0), 0);

    const openNowChip = `
        <div class="category-chip" data-category="__openNow" onclick="toggleCategoryFilter('__openNow')">
            Open now
            <span class="chip-count">${openCount}</span>
        </div>
    `;

    // Create chips
    categoryChips.innerHTML = openNowChip + sortedCategories.map(([category, count]) => {
        const displayName = labelCategory(category);
        return `
            <div class="category-chip" data-category="${category}" onclick="toggleCategoryFilter('${category}')">
                ${displayName}
                <span class="chip-count">${count}</span>
            </div>
        `;
    }).join('');

    // Ensure Open now chip reflects current state
    const openChipEl = document.querySelector('.category-chip[data-category="__openNow"]');
    if (openChipEl) openChipEl.classList.toggle('active', !!filters.openNow);
}


function toggleCategoryFilter(category) {
    console.log('=== Category Filter Clicked ===');
    console.log('Category:', category);
    console.log('Current active filters:', activeCategoryFilters);

    // Special chip: Open now
    if (category === '__openNow') {
        filters.openNow = !filters.openNow;
        const openChip = document.querySelector('.category-chip[data-category="__openNow"]');
        if (openChip) openChip.classList.toggle('active', !!filters.openNow);

        const clearBtn = document.getElementById('clearCategoryFilters');
        if (clearBtn) clearBtn.style.display = (activeCategoryFilters.length > 0 || filters.openNow) ? 'block' : 'none';

        applyAllActivitiesFilters();
        return;
    }

    const chip = document.querySelector(`.category-chip[data-category="${category}"]`);
    const clearBtn = document.getElementById('clearCategoryFilters');

    console.log('Chip element found:', chip ? 'Yes' : 'No');

    if (activeCategoryFilters.includes(category)) {
        // Remove filter
        activeCategoryFilters = activeCategoryFilters.filter(c => c !== category);
        chip.classList.remove('active');
        console.log('Removed filter');
    } else {
        // Add filter
        activeCategoryFilters.push(category);
        chip.classList.add('active');
        console.log('Added filter');
    }

    console.log('New active filters:', activeCategoryFilters);

    // Show/hide clear button
    clearBtn.style.display = (activeCategoryFilters.length > 0 || filters.openNow) ? 'block' : 'none';

    // Apply filters
    console.log('Calling applyAllActivitiesFilters...');
    applyAllActivitiesFilters();
}

async function clearCategoryFilters() {
    activeCategoryFilters = [];
    filters.openNow = false;
    document.querySelectorAll('.category-chip').forEach(chip => {
        chip.classList.remove('active');
    });
    document.getElementById('clearCategoryFilters').style.display = 'none';

    // Reset to all venues
    allActivitiesFiltered = [...window.londonVenues];
    allActivitiesDisplayedCount = 0;
    await renderAllActivities();

    // Update stats
    updateActivityStats();
}

async function applyAllActivitiesFilters() {
    console.log('=== Apply Filters Called ===');
    console.log('Active category filters:', activeCategoryFilters);
    console.log('Total venues before filter:', window.londonVenues.length);

    if (activeCategoryFilters.length === 0) {
        allActivitiesFiltered = [...window.londonVenues];
        console.log('No filters active, showing all venues');
    } else {
        allActivitiesFiltered = window.londonVenues.filter(venue => {
            const matchesFilter = venue.type.some(type => activeCategoryFilters.includes(type));
            if (matchesFilter) {
                console.log('Venue matches filter:', venue.name, 'types:', venue.type);
            }
            return matchesFilter;
        });
        console.log('Filtered venues count:', allActivitiesFiltered.length);
        console.log('Filtered venue names:', allActivitiesFiltered.map(v => v.name));
    }
    // Apply Open now chip filter
    if (filters.openNow) {
        allActivitiesFiltered = allActivitiesFiltered.filter(v => isVenueOpenNow(v) === true);
        console.log('Applied open now filter, count:', allActivitiesFiltered.length);
    }


    // Reset display count
    allActivitiesDisplayedCount = 0;

    // Re-render
    console.log('Calling renderAllActivities...');
    await renderAllActivities();

    // Update stats
    updateActivityStats();
    console.log('=== Apply Filters Complete ===');
}

async function renderAllActivities(append = false) {
    console.log('=== Render All Activities Called ===');
    console.log('Append mode:', append);
    console.log('Current displayed:', allActivitiesDisplayedCount);
    console.log('Total filtered:', allActivitiesFiltered.length);

    const grid = document.getElementById('allActivitiesGrid');
    const loadMoreContainer = document.getElementById('allActivitiesLoadMore');

    if (!grid) {
        console.error('allActivitiesGrid element not found');
        return;
    }

    if (!append) {
        grid.innerHTML = '';
        allActivitiesDisplayedCount = 0;
        console.log('Cleared grid, reset count to 0');
    }

    if (allActivitiesFiltered.length === 0) {
        grid.innerHTML = `
                    <div style="grid-column: 1 / -1; text-align: center; padding: 4rem 2rem;">
                        <h3 style="margin-bottom: 1rem; font-size: 1.5rem;">No activities found</h3>
                        <p style="color: #666;">Try adjusting your filters</p>
                    </div>
                `;
        if (loadMoreContainer) loadMoreContainer.style.display = 'none';
        console.log('No filtered activities, showing empty state');
        return;
    }

    const venuesToShow = allActivitiesFiltered.slice(
        allActivitiesDisplayedCount,
        allActivitiesDisplayedCount + ALL_ACTIVITIES_PER_PAGE
    );

    console.log('Venues to show this batch:', venuesToShow.length);
    console.log('Venue names:', venuesToShow.map(v => v.name).join(', '));

    allActivitiesDisplayedCount += venuesToShow.length;
    console.log('New displayed count:', allActivitiesDisplayedCount);

    // Fetch images for these venues
    const imagePromises = venuesToShow.map(venue => fetchVenueImage(venue.name));
    const images = await Promise.all(imagePromises);

    const venueHTML = venuesToShow.map((venue, index) => {
        const imageUrl = images[index];
        const backgroundStyle = imageUrl
            ? `background-image: url('${imageUrl}');`
            : `background-image: url('${getPlaceholderImage(venue)}'); background-size: cover;`;

        return createActivityCardHTML(venue, index, { showId: false });
    }).join('');

    console.log('Generated HTML length:', venueHTML.length, 'characters');

    if (append) {
        grid.innerHTML += venueHTML;
        console.log('Appended to existing grid');
    } else {
        grid.innerHTML = venueHTML;
        console.log('Replaced grid content');
    }

    console.log('Grid now has', grid.children.length, 'children');

    // Update View Details buttons
    setTimeout(() => updateViewDetailsButtons(), 100);

    // Update bookmark icons
    setTimeout(() => updateBookmarkIcons(), 100);

    // Show/hide load more button
    if (loadMoreContainer) {
        if (allActivitiesDisplayedCount < allActivitiesFiltered.length) {
            loadMoreContainer.style.display = 'block';
            console.log('Showing Load More button - more activities available');
        } else {
            loadMoreContainer.style.display = 'none';
            console.log('Hiding Load More button - all activities displayed');
        }
    }

    console.log('=== Render All Activities Complete ===');
}

async function loadMoreAllActivities() {
    console.log('=== Load More Clicked ===');
    console.log('Current displayed count:', allActivitiesDisplayedCount);
    console.log('Total filtered:', allActivitiesFiltered.length);
    console.log('Calling renderAllActivities(true)...');
    await renderAllActivities(true);
    console.log('After render - displayed count:', allActivitiesDisplayedCount);
    console.log('=== Load More Complete ===');
}

async function sortAllActivities() {
    const sortValue = document.getElementById('sortSelect').value;

    switch (sortValue) {
        case 'name-asc':
            allActivitiesFiltered.sort((a, b) => a.name.localeCompare(b.name));
            break;
        case 'name-desc':
            allActivitiesFiltered.sort((a, b) => b.name.localeCompare(a.name));
            break;
        case 'price-asc':
            allActivitiesFiltered.sort((a, b) => a.price - b.price);
            break;
        case 'price-desc':
            allActivitiesFiltered.sort((a, b) => b.price - a.price);
            break;
        case 'location':
            allActivitiesFiltered.sort((a, b) => a.location.localeCompare(b.location));
            break;
        case 'wetness-asc':
            allActivitiesFiltered.sort((a, b) => (a.wetnessScore || 0) - (b.wetnessScore || 0));
            break;
        case 'wetness-desc':
            allActivitiesFiltered.sort((a, b) => (b.wetnessScore || 0) - (a.wetnessScore || 0));
            break;
    }

    allActivitiesDisplayedCount = 0;
    await renderAllActivities();
}

function updateActivityStats() {
    // Total count
    document.getElementById('totalActivitiesCount').textContent = allActivitiesFiltered.length;

    // Count open now
    const openNow = allActivitiesFiltered.filter(v => isVenueOpenNow(v) === true).length;
    document.getElementById('openNowCount').textContent = openNow;

    // Count free activities
    const freeCount = allActivitiesFiltered.filter(v => v.price === 0).length;
    document.getElementById('freeActivitiesCount').textContent = freeCount;
}

function handleAllActivitiesScroll() {
    const backToTopBtn = document.getElementById('backToTopBtn');
    if (window.scrollY > 300) {
        backToTopBtn.style.display = 'block';
    } else {
        backToTopBtn.style.display = 'none';
    }
}

function scrollToTop() {
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

// Update Open Now badges for static Featured Activities cards
function updateOpenNowBadges() {
    // Get all static activity cards in Featured Activities section
    const featuredSection = document.querySelector('.activities-section .activity-grid');
    if (!featuredSection) return;

    const cards = featuredSection.querySelectorAll('.activity-card');

    cards.forEach(card => {
        const h3 = card.querySelector('h3');
        if (!h3) return;

        const venueName = h3.textContent.trim();
        const venue = window.londonVenues.find(v => v.name === venueName);

        if (!venue || !venue.openingHours) return;

        // Check if badge already exists
        let badge = card.querySelector('.open-now-badge');
        if (!badge) {
            // Create badge element
            badge = document.createElement('div');
            badge.className = 'open-now-badge';

            // Insert at start of activity-image div
            const imageDiv = card.querySelector('.activity-image');
            if (imageDiv) {
                imageDiv.insertBefore(badge, imageDiv.firstChild);
            }
        }

        // Update badge content and style
        const isOpen = isVenueOpenNow(venue);
        const closingSoon = isClosingSoon(venue);

        if (isOpen === true) {
            if (closingSoon) {
                const timeLeft = getHoursUntilClosing(venue);
                badge.textContent = `Closes in ${timeLeft}`;
                badge.className = 'open-now-badge closing-soon-badge';
            } else {
                badge.textContent = 'Open Now';
                badge.className = 'open-now-badge';
            }
            badge.style.display = 'flex';
        } else if (isOpen === false) {
            badge.textContent = 'Closed';
            badge.className = 'open-now-badge closed-badge';
            badge.style.display = 'flex';
        } else {
            // Unknown status - hide badge
            badge.style.display = 'none';
        }
    });
}

function updateCategoryCounts() {
    // Count activities for each category type
    const categoryCounts = {};

    window.londonVenues.forEach(venue => {
        venue.type.forEach(type => {
            categoryCounts[type] = (categoryCounts[type] || 0) + 1;
        });
    });

    // Update the count displays
    document.querySelectorAll('.category-count').forEach(countElement => {
        const type = countElement.dataset.type;
        const count = categoryCounts[type] || 0;
        countElement.textContent = `(${count})`;
    });
}

// Opening Hours Functions
function isVenueOpenNow(venue) {
    if (!venue.openingHours) return null; // Unknown

    const now = new Date();
    const dayNames = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'];
    const currentDay = dayNames[now.getDay()];
    const hours = venue.openingHours[currentDay];

    if (!hours || hours === 'Closed') return false;
    if (hours === '24/7') return true;

    // Parse opening hours (e.g., "10:00-17:00")
    const [openTime, closeTime] = hours.split('-');
    const [openHour, openMin] = openTime.split(':').map(Number);
    const [closeHour, closeMin] = closeTime.split(':').map(Number);

    const currentHour = now.getHours();
    const currentMin = now.getMinutes();
    const currentTimeInMins = currentHour * 60 + currentMin;
    const openTimeInMins = openHour * 60 + openMin;
    const closeTimeInMins = closeHour * 60 + closeMin;

    return currentTimeInMins >= openTimeInMins && currentTimeInMins < closeTimeInMins;
}

function getClosingTime(venue) {
    if (!venue.openingHours) return null;

    const now = new Date();
    const dayNames = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'];
    const currentDay = dayNames[now.getDay()];
    const hours = venue.openingHours[currentDay];

    if (!hours || hours === 'Closed') return null;
    if (hours === '24/7') return '24 hours';

    const [, closeTime] = hours.split('-');
    return closeTime;
}

function isClosingSoon(venue) {
    if (!venue.openingHours) return false;
    if (!isVenueOpenNow(venue)) return false;

    const closingTime = getClosingTime(venue);
    if (!closingTime || closingTime === '24 hours') return false;

    const [closeHour, closeMin] = closingTime.split(':').map(Number);
    const now = new Date();
    const currentTimeInMins = now.getHours() * 60 + now.getMinutes();
    const closeTimeInMins = closeHour * 60 + closeMin;

    // Closing within 1 hour
    return (closeTimeInMins - currentTimeInMins) <= 60 && (closeTimeInMins - currentTimeInMins) > 0;
}

function getHoursUntilClosing(venue) {
    if (!venue.openingHours) return null;

    const closingTime = getClosingTime(venue);
    if (!closingTime || closingTime === '24 hours') return null;

    const [closeHour, closeMin] = closingTime.split(':').map(Number);
    const now = new Date();
    const currentTimeInMins = now.getHours() * 60 + now.getMinutes();
    const closeTimeInMins = closeHour * 60 + closeMin;
    const minsUntilClosing = closeTimeInMins - currentTimeInMins;

    if (minsUntilClosing <= 0) return null;

    const hours = Math.floor(minsUntilClosing / 60);
    const mins = minsUntilClosing % 60;

    if (hours === 0) return `${mins} min`;
    if (mins === 0) return `${hours} hr`;
    return `${hours} hr ${mins} min`;
}

function formatOpeningHours(venue) {
    if (!venue.openingHours) return 'Hours not available';

    const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
    const dayKeys = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'];

    let formatted = '';
    for (let i = 0; i < days.length; i++) {
        const hours = venue.openingHours[dayKeys[i]];
        formatted += `${days[i]}: ${hours || 'Closed'}\n`;
    }

    return formatted.trim();
}

// Weather API Integration
const WEATHER_API_KEY = 'demo'; // Users should replace with their own key
const LONDON_LAT = 51.5074;
const LONDON_LON = -0.1278;
let weatherRefreshInterval = null;

async function fetchWeather() {
    const loadingEl = document.getElementById('weatherLoading');
    const contentEl = document.getElementById('weatherContent');

    try {
        // Show loading state
        loadingEl.style.display = 'flex';
        contentEl.style.display = 'none';

        // Open-Meteo API (Free, no key required)
        const response = await fetch('https://api.open-meteo.com/v1/forecast?latitude=51.5074&longitude=-0.1278&current=temperature_2m,relative_humidity_2m,apparent_temperature,weather_code,precipitation');

        if (!response.ok) throw new Error('Weather fetch failed');

        const data = await response.json();
        const current = data.current;

        // WMO Weather Codes to Description
        const weatherCode = current.weather_code;
        const description = getWeatherDescription(weatherCode);
        const isRaining = weatherCode >= 50 || current.precipitation > 0;

        // Update weather display
        displayWeather({
            temp: Math.round(current.temperature_2m),
            feelsLike: Math.round(current.apparent_temperature),
            humidity: current.relative_humidity_2m,
            description: description,
            weatherCode: weatherCode,
            isRaining: isRaining
        });

        // Hide loading, show content
        loadingEl.style.display = 'none';
        contentEl.style.display = 'flex';

    } catch (error) {
        console.warn('Weather fetch failed, using demo data:', error);
        // Silently fall back to demo weather data
        displayDemoWeather();
        loadingEl.style.display = 'none';
        contentEl.style.display = 'flex';
    }
}

function displayWeather(weather) {
    // Update temperature
    document.getElementById('weatherTemp').textContent = `${weather.temp}°C`;
    document.getElementById('weatherFeels').textContent = `${weather.feelsLike}°C`;
    document.getElementById('weatherHumidity').textContent = `${weather.humidity}%`;
    document.getElementById('weatherDesc').textContent = weather.description;

    // Determine weather icon
    const icon = getWeatherIcon(weather.weatherCode);
    document.getElementById('weatherIcon').textContent = icon;

    // Update rain status
    const rainStatus = weather.isRaining ? 'Yes ☔' : 'No ☀️';
    document.getElementById('weatherRain').textContent = rainStatus;

    // Create weather message
    const message = getWeatherMessage(weather.isRaining, weather.temp);
    const messageEl = document.getElementById('weatherMessage');
    messageEl.textContent = message;
    messageEl.className = weather.isRaining ? 'weather-message' : 'weather-message sunny';

    // Update timestamp
    const now = new Date();
    document.getElementById('weatherUpdated').textContent =
        `Updated: ${now.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}`;

    // Update weather-based recommendations
    updateWeatherRecommendations(weather);
}

function displayDemoWeather() {
    // Fallback demo data (London is often like this)
    displayWeather({
        temp: 12,
        feelsLike: 10,
        humidity: 75,
        description: 'Overcast',
        weatherCode: 3, // WMO code for Overcast
        isRaining: false
    });
}

function getWeatherDescription(code) {
    // WMO Weather interpretation codes
    if (code === 0) return 'Clear sky';
    if (code === 1) return 'Mainly clear';
    if (code === 2) return 'Partly cloudy';
    if (code === 3) return 'Overcast';
    if (code === 45 || code === 48) return 'Fog';
    if (code >= 51 && code <= 55) return 'Drizzle';
    if (code >= 61 && code <= 65) return 'Rain';
    if (code >= 66 && code <= 67) return 'Freezing Rain';
    if (code >= 71 && code <= 77) return 'Snow fall';
    if (code >= 80 && code <= 82) return 'Rain showers';
    if (code >= 85 && code <= 86) return 'Snow showers';
    if (code >= 95) return 'Thunderstorm';
    return 'Cloudy';
}

function getWeatherIcon(code) {
    // WMO Code to Emoji
    if (code === 0) return '☀️'; // Clear
    if (code === 1) return '🌤️'; // Mainly clear
    if (code === 2) return '⛅'; // Partly cloudy
    if (code === 3) return '☁️'; // Overcast
    if (code === 45 || code === 48) return '🌫️'; // Fog
    if (code >= 50 && code <= 55) return '🌦️'; // Drizzle
    if (code >= 60 && code <= 69) return '🌧️'; // Rain
    if (code >= 70 && code <= 79) return '🌨️'; // Snow
    if (code >= 80 && code <= 82) return '🌦️'; // Showers
    if (code >= 85 && code <= 86) return '❄️'; // Snow showers
    if (code >= 95) return '⛈️'; // Thunderstorm
    return '🌤️';
}

function getWeatherMessage(isRaining, temp) {
    if (isRaining) {
        return "🌧️ It's raining! Perfect day for indoor activities";
    } else if (temp < 10) {
        return "🥶 Chilly outside - stay cozy indoors!";
    } else if (temp > 20) {
        return "☀️ Nice day, but plenty of indoor fun too!";
    } else {
        return "Perfect weather for exploring London indoors!";
    }
}

// Weather-Based Recommendations
async function updateWeatherRecommendations(weather) {
    const section = document.getElementById('weatherRecommendations');
    const grid = document.getElementById('weatherRecGrid');
    const icon = document.getElementById('weatherRecIcon');
    const title = document.getElementById('weatherRecTitle');
    const subtitle = document.getElementById('weatherRecSubtitle');

    if (!section || !grid) {
        console.warn('Weather recommendations elements not found');
        return;
    }

    // Clear any previous content
    grid.innerHTML = '';

    let recommendedVenues = [];
    let iconEmoji = '';
    let titleText = '';
    let subtitleText = '';

    // Determine recommendations based on weather conditions
    if (weather.isRaining) {
        // Heavy rain - prioritize completely dry venues
        titleText = 'Perfect for Rainy Weather';
        subtitleText = 'Stay completely dry at these venues';
        recommendedVenues = window.londonVenues
            .filter(v => v.wetness === 'dry')
            .sort((a, b) => b.rating - a.rating)
            .slice(0, 6);
    } else if (weather.temp < 10) {
        // Cold - prioritize cozy indoor venues
        titleText = 'Cozy Indoor Escapes';
        subtitleText = 'Warm up at these comfortable venues';
        recommendedVenues = window.londonVenues
            .filter(v =>
                v.wetness === 'dry' &&
                (v.type.includes('dining') || v.type.includes('cinema') || v.type.includes('wellness'))
            )
            .sort((a, b) => b.rating - a.rating)
            .slice(0, 6);

        // Fallback if not enough cozy venues
        if (recommendedVenues.length < 3) {
            recommendedVenues = window.londonVenues
                .filter(v => v.wetness === 'dry')
                .sort((a, b) => b.rating - a.rating)
                .slice(0, 6);
        }
    } else if (weather.temp > 20) {
        // Warm/sunny - show light activities with some airiness
        titleText = 'Light & Bright Activities';
        subtitleText = 'Enjoy indoor spaces with natural light';
        recommendedVenues = window.londonVenues
            .filter(v =>
                (v.wetness === 'dry' || v.wetness === 'slightly') &&
                (v.type.includes('galleries') || v.type.includes('shopping') || v.type.includes('exhibitions'))
            )
            .sort((a, b) => b.rating - a.rating)
            .slice(0, 6);

        // Fallback if not enough
        if (recommendedVenues.length < 3) {
            recommendedVenues = window.londonVenues
                .filter(v => v.wetness === 'dry')
                .sort((a, b) => b.rating - a.rating)
                .slice(0, 6);
        }
    } else if (weather.humidity > 80) {
        // High humidity - prioritize air-conditioned venues
        titleText = 'Climate Controlled Comfort';
        subtitleText = 'Cool and comfortable venues';
        recommendedVenues = window.londonVenues
            .filter(v =>
                v.wetness === 'dry' &&
                (v.type.includes('cinema') || v.type.includes('museums') || v.type.includes('shopping'))
            )
            .sort((a, b) => b.rating - a.rating)
            .slice(0, 6);

        // Fallback if not enough
        if (recommendedVenues.length < 3) {
            recommendedVenues = window.londonVenues
                .filter(v => v.wetness === 'dry')
                .sort((a, b) => b.rating - a.rating)
                .slice(0, 6);
        }
    } else {
        // Pleasant weather - show popular venues
        titleText = 'Top Indoor Attractions';
        subtitleText = 'Popular activities for today';
        recommendedVenues = window.londonVenues
            .filter(v => v.rating >= 4.5)
            .sort((a, b) => b.rating - a.rating)
            .slice(0, 6);
    }

    // Update header (hide icon since we removed emoji usage)
    if (icon) {
        icon.style.display = 'none';
    }
    if (title) title.textContent = titleText;
    if (subtitle) subtitle.textContent = subtitleText;

    // Show section if we have recommendations
    if (recommendedVenues.length > 0) {
        section.style.display = 'block';

        // Build cards HTML
        const cardsHTML = recommendedVenues.map((venue, index) => {
            return createActivityCardHTML(venue, index, {
                showId: false,
                dataAttrs: `data-venue-index="${index}" data-venue-name="${venue.name}"`
            });
        }).join('');

        grid.innerHTML = cardsHTML;

        // Update View Details buttons for these cards
        setTimeout(() => {
            updateViewDetailsButtons();
            updateBookmarkIcons();
        }, 100);

        // Fetch real images in background and update if available
        setTimeout(async () => {
            try {
                const imagePromises = recommendedVenues.map(venue => fetchVenueImage(venue.name));
                const images = await Promise.all(imagePromises);

                images.forEach((imageUrl, index) => {
                    if (imageUrl) {
                        const card = grid.querySelector(`[data-venue-index="${index}"] .activity-image`);
                        if (card) {
                            card.style.backgroundImage = `url('${imageUrl}')`;
                        }
                    }
                });
            } catch (error) {
                console.warn('Could not fetch images for weather recommendations:', error);
            }
        }, 500);

    } else {
        section.style.display = 'none';
    }
}

function refreshWeather() {
    const refreshBtn = document.getElementById('weatherRefresh');
    refreshBtn.style.transform = 'rotate(360deg)';

    fetchWeather();

    setTimeout(() => {
        refreshBtn.style.transform = 'rotate(0deg)';
    }, 500);
}

// Auto-refresh weather every 30 minutes
function startWeatherAutoRefresh() {
    // Clear any existing interval
    if (weatherRefreshInterval) {
        clearInterval(weatherRefreshInterval);
    }

    // Refresh every 30 minutes (1800000 ms)
    weatherRefreshInterval = setInterval(fetchWeather, 1800000);
}

// Load images for static Featured Activities section

async function renderFeaturedActivitiesFromSupabase() {
    const grid = document.querySelector('#activities .activity-grid');
    if (!grid) return;

    const venues = Array.isArray(window.londonVenues) ? window.londonVenues : [];
    if (!venues.length) return;

    const spotlight = venues.find(v => v && v.spotlight === true) || null;
    let featured = venues.filter(v => v && v.featured === true);

    if (spotlight) {
        featured = featured.filter(v => v.name !== spotlight.name);
    }

    featured = featured.slice(0, 6);

    let html = '';

    if (spotlight) {
        html += createActivityCardHTML(spotlight, 0, {
            idPrefix: 'featured',
            cardClass: 'spotlight spotlight-card',
            badgeHTML: '<div class="spotlight-badge">Spotlight</div>'
        });
    }

    featured.forEach((venue, i) => {
        const cardIndex = spotlight ? i + 1 : i;
        html += createActivityCardHTML(venue, cardIndex, {
            idPrefix: 'featured',
            cardClass: 'featured',
            badgeHTML: '<div class="featured-badge">Featured</div>'
        });
    });

    if (html.trim().length === 0) {
        // If no Featured venues, keep existing static content
        return;
    }

    grid.innerHTML = html;

    // Re-bind interactions for new cards
    updateViewDetailsButtons();
    updateBookmarkIcons();
    updateOpenNowBadges();
}

async function loadFeaturedActivityImages() {
    const featuredSection = document.querySelector('.activities-section .activity-grid');
    if (!featuredSection) return;

    const cards = featuredSection.querySelectorAll('.activity-card:not(.featured)');

    // Load above-fold images in parallel for faster initial render
    const loadPromises = Array.from(cards).map(async (card) => {
        const h3 = card.querySelector('h3');
        if (!h3) return;

        const venueName = h3.textContent.trim();
        const imageDiv = card.querySelector('.activity-image');
        if (!imageDiv) return;

        // Mark card with venue name for lazy loading system
        card.dataset.venueName = venueName;

        // Check if already has non-placeholder background image
        if (card.dataset.imageLoaded === 'true') return;

        // Find venue in database for fallback gradient
        const venue = window.londonVenues?.find(v => v.name === venueName);

        // Fetch image
        const imageUrl = await fetchVenueImage(venueName);

        if (imageUrl) {
            imageDiv.style.backgroundImage = `url('${imageUrl}')`;
            imageDiv.style.backgroundSize = 'cover';
            imageDiv.style.backgroundPosition = 'center';
            card.dataset.imageLoaded = 'true';
        } else if (venue) {
            imageDiv.style.backgroundImage = `url('${getPlaceholderImage(venue)}')`;
            imageDiv.style.backgroundSize = 'cover';
            card.dataset.imageLoaded = 'fallback';
        }
    });

    // Execute all in parallel
    await Promise.all(loadPromises);
}

function closeLuckySelection() {
    const luckySection = document.getElementById('luckySelection');
    if (luckySection) {
        luckySection.style.display = 'none';
    }
}

// Expose functions globally for inline onclick handlers in index.html
window.refreshWeather = refreshWeather;
window.clearSearch = clearSearch;
window.clearResults = clearResults;
window.loadMoreVenues = loadMoreVenues;
window.toggleCategories = toggleCategories;
window.clearCategoryFilters = clearCategoryFilters;
window.loadMoreAllActivities = loadMoreAllActivities;
window.scrollToTop = scrollToTop;
window.clearBookmarks = clearBookmarks;
window.handleNewsletterSubmit = handleNewsletterSubmit;
window.openModal = openModal;
window.closeModal = closeModal;
window.openPrerequisites = openPrerequisites;
window.closePrerequisites = closePrerequisites;
window.clearFilters = clearFilters;

// Ensure filtering functions are exposed
window.filterVenues = filterVenues;
window.setGeneratedResults = setGeneratedResults;

// window.applyFilters is already set in filter-state.js
// window.applyFilters = applyFilters; // Removed redundant/incorrect assignment
window.clearPrerequisites = clearPrerequisites;
window.applyPrerequisites = applyPrerequisites;
window.closeActivityModal = closeActivityModal;
window.bookmarkActivity = bookmarkActivity;
window.shareActivity = shareActivity;
window.switchTab = switchTab;
window.searchVenueOnline = searchVenueOnline;
window.closeShareModal = closeShareModal;
window.shareViaWhatsApp = shareViaWhatsApp;
window.shareViaEmail = shareViaEmail;
window.shareViaTwitter = shareViaTwitter;
window.shareViaFacebook = shareViaFacebook;
window.copyShareLink = copyShareLink;
window.feelingLucky = feelingLucky;
window.closeLuckySelection = closeLuckySelection;

// Initialize View Details buttons on page load for Featured Activities
document.addEventListener('DOMContentLoaded', async function () {
    updateViewDetailsButtons();
    updateCategoryCounts();
    updateBookmarkIcons();
    updateOpenNowBadges();

    // Initialize search functionality
    initializeSearch();

    // Initialize weather
    await fetchWeather();
    startWeatherAutoRefresh();

    // Update Open Now badges every minute
    setInterval(updateOpenNowBadges, 60000);

    // Load images for static Featured Activities (above fold - eager load)
    loadFeaturedActivityImages();

    // Initialize lazy loading for all activity grids
    document.querySelectorAll('.activity-grid').forEach(grid => {
        observeCardsForLazyLoading(grid);
    });

    // Show loading state while Supabase fetches
    setVenuesLoading(true);

    // Load venues from Supabase (fallback to local data.js if it fails)
    if (typeof loadVenuesFromSupabase === 'function') {
        await loadVenuesFromSupabase();
    }

    // Render Featured Activities (and Spotlight) from Supabase flags
    await renderFeaturedActivitiesFromSupabase();

    // Hide loading state and refresh counters
    setVenuesLoading(false);
    updateCategoryCounts();
    updateActivityStats();

    // Initialize All Activities section
    await initializeAllActivities();

    // Initialize Bookmarks section
    await showBookmarks();

    // Initialize Recently Viewed section
    showRecentlyViewed();

    // === FILTER CHIP EVENT LISTENERS ===
    // NOTE: Most filter chip handlers are defined earlier in the file (outside DOMContentLoaded)
    // to avoid duplicate event listeners. Only handlers for elements not covered there are here.

    // Type chips (for .type-option class if used elsewhere - the modal uses .tag-option[data-type])
    document.querySelectorAll('.type-option').forEach(option => {
        option.addEventListener('click', function () {
            const type = this.dataset.type;
            console.log('type clicked:', type);

            if (filters.types.has(type)) {
                filters.types.delete(type);
                this.classList.remove('selected');
            } else {
                filters.types.add(type);
                this.classList.add('selected');
            }

            updateDoneButtonLabels();
        });
    });

    // Keywords/preferences input - sync with unified filter state
    const keywordsInput = document.getElementById('preferences');
    if (keywordsInput) {
        keywordsInput.addEventListener('input', function () {
            filters.keywords = this.value;
            updateDoneButtonLabels();
        });
    }

    // NOTE: Location, Wetness, OpenNow, and Prereq handlers are defined earlier in the file
    // to avoid duplicate event listeners that cause toggle issues.


    // Category expand / collapse (UI only)
      const toggleBtn = document.getElementById('categoryToggle');
      const wrap = document.getElementById('categoryChipsWrap');

      if (!toggleBtn || !wrap) {
        // Category toggle not present on this page state
      } else {

      const labelEl = toggleBtn.querySelector('.filter-toggle-label');

      function setExpanded(expanded) {
        toggleBtn.setAttribute('aria-expanded', expanded ? 'true' : 'false');
        wrap.classList.toggle('is-collapsed', !expanded);

        if (labelEl) labelEl.textContent = expanded ? 'Hide' : 'Show';
      }

      // Respect whatever the HTML currently says on load
      const initialExpanded = toggleBtn.getAttribute('aria-expanded') !== 'false';
      setExpanded(initialExpanded);

      toggleBtn.addEventListener('click', () => {
        const isExpanded = toggleBtn.getAttribute('aria-expanded') === 'true';
        setExpanded(!isExpanded);
      });

      }


    // Add click handlers to Popular Categories cards
    document.querySelectorAll('.category-card').forEach(card => {
        card.style.cursor = 'pointer';
        card.addEventListener('click', function () {
            const countSpan = this.querySelector('.category-count');
            if (countSpan) {
                const categoryType = countSpan.dataset.type;
                if (categoryType) {
                    // Clear ALL existing category selections and filters
                    activeCategoryFilters = [];
                    document.querySelectorAll('.category-chip').forEach(chip => {
                        chip.classList.remove('active');
                    });

                    // Now select ONLY this category
                    toggleCategoryFilter(categoryType);

                    // Scroll to All Activities section
                    setTimeout(() => {
                        const section = document.getElementById('all-activities');
                        if (section) {
                            section.scrollIntoView({ behavior: 'smooth', block: 'start' });
                        }
                    }, 200);
                }
            }
        });
    });

    // Initialize Action Buttons (Fix for inline onclick issues)
    const customizeBtn = document.querySelector('.customize-btn');
    if (customizeBtn) {
        customizeBtn.addEventListener('click', openModal);
    }

    const luckyBtn = document.querySelector('.lucky-btn');
    if (luckyBtn) {
        luckyBtn.addEventListener('click', feelingLucky);
    }
});
// Wetness slider event listener and functionality
// This should be added to app.js after DOMContentLoaded

document.addEventListener('DOMContentLoaded', function () {
    const wetnessSlider = document.getElementById('wetnessSlider');
    const wetnessValue = document.getElementById('wetnessValue');

    if (wetnessSlider && wetnessValue) {
        // Update label as slider moves
        wetnessSlider.addEventListener('input', function () {
            const value = parseInt(this.value);
            wetnessValue.textContent = value + '%';

            // Update slider gradient based on value
            const percentage = (value / 100) * 100;
            this.style.background = `linear-gradient(to right, #6C63FF 0%, #8B7CFF ${percentage}%, #E5E5E5 ${percentage}%, #E5E5E5 100%)`;
        });

        // Update filter state when slider changes
        wetnessSlider.addEventListener('change', function () {
            const value = parseInt(this.value);
            filters.maxWetnessScore = value;
            updateDoneButtonLabels();
        });
    }
});


window.addEventListener('venues:loaded', () => {
    renderDavidsTopPicks();
});




// ============================================
// MONETIZATION FUNCTION - Added for sponsored venues
// ============================================


// ============================================
// MONETIZATION - Minimal addition for sponsored badges
// ============================================
function isSponsored(venue) {
    return venue.sponsored === true;
}

/* Mobile navigation toggle (UI only) */
(function () {
    const toggle = document.getElementById('navToggle');
    const nav = document.getElementById('siteNav');
    const scrim = document.getElementById('navScrim');

    if (!toggle || !nav) return;

    function closeNav() {
        document.body.classList.remove('nav-open');
        toggle.setAttribute('aria-expanded', 'false');
    }

    function openNav() {
        document.body.classList.add('nav-open');
        toggle.setAttribute('aria-expanded', 'true');
    }

    toggle.addEventListener('click', function () {
        if (document.body.classList.contains('nav-open')) {
            closeNav();
        } else {
            openNav();
        }
    });

    if (scrim) {
        scrim.addEventListener('click', closeNav);
    }

    nav.querySelectorAll('a').forEach(function (link) {
        link.addEventListener('click', closeNav);
    });

    window.addEventListener('resize', function () {
        if (window.innerWidth > 768) closeNav();
    });
})();

// ============================================
// REVIEWS FUNCTIONALITY
// ============================================

let reviewsLoadedFor = null;
let selectedReviewRating = 5;

// Load reviews when Reviews tab is selected
async function loadReviews(venueName) {
    if (reviewsLoadedFor === venueName) return;

    const loadingEl = document.getElementById('googleReviewsLoading');
    const googleContainer = document.getElementById('googleReviewsContainer');
    const userContainer = document.getElementById('userReviewsContainer');

    // Show loading
    if (loadingEl) loadingEl.style.display = 'block';
    if (googleContainer) googleContainer.innerHTML = '';

    try {
        // Fetch Google Reviews from Places API
        const resp = await fetch(`/api/place-details?q=${encodeURIComponent(venueName + ' London')}`);
        const data = await resp.json();

        if (loadingEl) loadingEl.style.display = 'none';

        // Update summary
        if (data.rating) {
            document.getElementById('reviewsAvgRating').textContent = data.rating.toFixed(1);
            document.getElementById('reviewsStarsLarge').textContent = getStarDisplay(data.rating);
            document.getElementById('reviewsCount').textContent = `Based on ${data.userRatingCount || 0} Google reviews`;
        }

        // Render Google reviews
        if (data.reviews && data.reviews.length > 0) {
            googleContainer.innerHTML = data.reviews.map(review => `
                <div class="review-card">
                    <div class="review-header">
                        <div class="reviewer-info">
                            ${review.authorPhoto ? `<img src="${review.authorPhoto}" alt="" class="reviewer-photo" loading="lazy">` : ''}
                            <div>
                                <div class="reviewer-name">${escapeHtml(review.authorName)}</div>
                                <div class="review-rating">${getStarDisplay(review.rating)} ${review.rating.toFixed(1)}</div>
                            </div>
                        </div>
                        <div class="review-date">${review.relativeTime || ''}</div>
                    </div>
                    <p class="review-text">"${escapeHtml(review.text)}"</p>
                </div>
            `).join('');
        } else {
            googleContainer.innerHTML = '<p style="color: #999; text-align: center; padding: 1rem;">No Google reviews available yet.</p>';
        }

        // Fetch user reviews from Supabase
        await loadUserReviews(venueName);

        reviewsLoadedFor = venueName;

    } catch (error) {
        console.error('Error loading reviews:', error);
        if (loadingEl) loadingEl.style.display = 'none';
        if (googleContainer) {
            googleContainer.innerHTML = '<p style="color: #999; text-align: center; padding: 1rem;">Unable to load Google reviews.</p>';
        }
    }
}

async function loadUserReviews(venueName) {
    const container = document.getElementById('userReviewsContainer');
    if (!container) return;

    try {
        const resp = await fetch(`/api/reviews?venue=${encodeURIComponent(venueName)}`);
        const data = await resp.json();

        if (data.reviews && data.reviews.length > 0) {
            container.innerHTML = data.reviews.map(review => `
                <div class="review-card user-review">
                    <div class="review-header">
                        <div>
                            <div class="reviewer-name">${escapeHtml(review.authorName)}</div>
                            <div class="review-rating">${getStarDisplay(review.rating)} ${review.rating.toFixed(1)}</div>
                        </div>
                        <div class="review-date">${review.relativeTime}</div>
                    </div>
                    <p class="review-text">"${escapeHtml(review.text)}"</p>
                </div>
            `).join('');
        } else {
            container.innerHTML = '<p style="color: #999; text-align: center; padding: 1rem;">No community reviews yet. Be the first!</p>';
        }
    } catch (error) {
        console.error('Error loading user reviews:', error);
    }
}

async function submitReview(event) {
    event.preventDefault();

    if (!currentActivity) return;

    const nameInput = document.getElementById('reviewName');
    const textInput = document.getElementById('reviewText');
    const submitBtn = document.getElementById('submitReviewBtn');
    const successMsg = document.getElementById('reviewSuccess');
    const errorMsg = document.getElementById('reviewError');

    const name = nameInput.value.trim();
    const text = textInput.value.trim();
    const rating = selectedReviewRating;

    // Reset messages
    successMsg.style.display = 'none';
    errorMsg.style.display = 'none';

    // Validate
    if (!name || !text || text.length < 10) {
        errorMsg.textContent = 'Please fill in all fields. Review must be at least 10 characters.';
        errorMsg.style.display = 'block';
        return;
    }

    // Disable button
    submitBtn.disabled = true;
    submitBtn.textContent = 'Submitting...';

    try {
        const resp = await fetch('/api/reviews', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                venue: currentActivity.name,
                name,
                rating,
                text
            })
        });

        const data = await resp.json();

        if (resp.ok && data.success) {
            successMsg.style.display = 'block';
            nameInput.value = '';
            textInput.value = '';
            document.getElementById('reviewCharCount').textContent = '0';

            // Reset rating stars
            selectedReviewRating = 5;
            updateStarRatingDisplay(5);

            // Reload user reviews
            reviewsLoadedFor = null;
            await loadUserReviews(currentActivity.name);
        } else {
            throw new Error(data.error || 'Failed to submit review');
        }
    } catch (error) {
        console.error('Review submission error:', error);
        errorMsg.textContent = error.message || 'Failed to submit review. Please try again.';
        errorMsg.style.display = 'block';
    } finally {
        submitBtn.disabled = false;
        submitBtn.textContent = 'Submit Review';
    }
}

function getStarDisplay(rating) {
    const fullStars = Math.floor(rating);
    const hasHalf = rating % 1 >= 0.5;
    let stars = '★'.repeat(fullStars);
    if (hasHalf) stars += '☆';
    stars += '☆'.repeat(5 - fullStars - (hasHalf ? 1 : 0));
    return stars;
}

function escapeHtml(text) {
    if (!text) return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

function updateStarRatingDisplay(rating) {
    const stars = document.querySelectorAll('#starRatingInput .star-input');
    stars.forEach((star, index) => {
        star.classList.toggle('active', index < rating);
    });
}

// Initialize star rating input
document.addEventListener('DOMContentLoaded', function() {
    const starContainer = document.getElementById('starRatingInput');
    if (starContainer) {
        starContainer.addEventListener('click', function(e) {
            if (e.target.classList.contains('star-input')) {
                selectedReviewRating = parseInt(e.target.dataset.rating);
                document.getElementById('reviewRating').value = selectedReviewRating;
                updateStarRatingDisplay(selectedReviewRating);
            }
        });

        // Initialize with 5 stars selected
        updateStarRatingDisplay(5);
    }

    // Character counter for review text
    const reviewText = document.getElementById('reviewText');
    const charCount = document.getElementById('reviewCharCount');
    if (reviewText && charCount) {
        reviewText.addEventListener('input', function() {
            charCount.textContent = this.value.length;
        });
    }
});

// Make functions available globally
window.submitReview = submitReview;
window.loadReviews = loadReviews;

// ============================================
// SMALL & MIGHTY PARTNERS (HOMEPAGE)
// ============================================

function createPartnerCardHTML(partner, index) {
    const imageUrl = partner.image_filename
        ? `assets/smallandmighty/${partner.image_filename}`
        : 'assets/smallandmighty/placeholder.svg';

    const typeLabel = partner.type
        ? partner.type.charAt(0).toUpperCase() + partner.type.slice(1)
        : 'Partner';

    const locationLabel = partner.location
        ? partner.location.charAt(0).toUpperCase() + partner.location.slice(1) + ' London'
        : 'London';

    return `
        <article class="activity-card partner-card" data-partner-id="${partner.id}">
            <div class="activity-image" style="background-image: url('${imageUrl}'); background-size: cover; background-position: center;">
                <div class="small-mighty-badge">Pop-up</div>
            </div>
            <div class="activity-content">
                <div class="activity-meta">
                    <span class="activity-type">${typeLabel}</span>
                    <span class="activity-location">${locationLabel}</span>
                </div>
                <h3>${partner.name}</h3>
                <p class="activity-description">${partner.description || ''}</p>
                <div class="activity-footer">
                    <span class="activity-price">${partner.price_display || 'View pricing'}</span>
                    <a href="${partner.affiliate_link || partner.website_url || '#'}"
                       target="_blank"
                       rel="noopener noreferrer"
                       class="view-details-btn partner-link">
                        Visit Website
                    </a>
                </div>
            </div>
        </article>
    `;
}

async function renderSmallMightyPartners() {
    const section = document.getElementById('smallMightySection');
    const grid = document.getElementById('smallMightyGrid');

    if (!section || !grid) return;

    // Check if Supabase is available
    if (typeof supabase === 'undefined' || !supabase) {
        console.warn('Supabase not available for Pop-up partners');
        section.style.display = 'none';
        return;
    }

    try {
        // Fetch featured partners (max 3)
        const { data: partners, error } = await supabase
            .from('small_mighty_partners')
            .select('*')
            .eq('featured', true)
            .eq('active', true)
            .limit(3);

        if (error) {
            console.error('Error loading Pop-up partners:', error);
            section.style.display = 'none';
            return;
        }

        if (!partners || partners.length === 0) {
            section.style.display = 'none';
            return;
        }

        // Render partner cards
        grid.innerHTML = partners.map((partner, index) =>
            createPartnerCardHTML(partner, index)
        ).join('');

        // Show the section
        section.style.display = 'block';

    } catch (err) {
        console.error('Error rendering Pop-up partners:', err);
        section.style.display = 'none';
    }
}

// Initialize Pop-ups section on page load
document.addEventListener('DOMContentLoaded', function() {
    // Only run on homepage (index.html)
    if (document.getElementById('smallMightySection')) {
        renderSmallMightyPartners();
    }
});

// Expose globally
window.renderSmallMightyPartners = renderSmallMightyPartners;
