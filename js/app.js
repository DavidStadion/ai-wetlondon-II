console.log("WetLondon version:", "2026-01-18 06:45");

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


/* === Wetness score helpers (fallbacks keep UI trustworthy) === */
function parseMinutesFromText(text) {
    if (!text) return null;
    const str = String(text);
    const m = str.match(/\b(\d{1,2})\s*(?:min|mins|minutes)\b/i);
    if (!m) return null;
    const n = parseInt(m[1], 10);
    if (!Number.isFinite(n)) return null;
    return Math.max(0, Math.min(n, 60));
}

function computeWetnessScoreFallback(venue) {
    // Base ranges by label (calm, predictable)
    const label = (venue?.wetness || '').toLowerCase();
    let base = 0;

    if (label === 'dry') base = 5;
    else if (label === 'slightly') base = 22;
    else if (label === 'wet') base = 65;
    else base = 15;

    // Nudge by any stated walk time (caps to avoid silly numbers)
    const mins = parseMinutesFromText(venue?.description);
    if (mins != null) {
        const bump = Math.min(20, Math.round(mins * 1.5));
        base = base + bump;
    }

    return Math.max(0, Math.min(100, Math.round(base)));
}

function ensureWetnessScores(venues) {
    if (!Array.isArray(venues)) return;

    venues.forEach(v => {
        const existing = Number(v?.wetnessScore);
        if (Number.isFinite(existing) && existing >= 0) {
            v.wetnessScore = Math.max(0, Math.min(100, Math.round(existing)));
            return;
        }

        // Also support "wetness_score" if it ever comes back snake_case
        const snake = Number(v?.wetness_score);
        if (Number.isFinite(snake) && snake >= 0) {
            v.wetnessScore = Math.max(0, Math.min(100, Math.round(snake)));
            return;
        }

        v.wetnessScore = computeWetnessScoreFallback(v);
    });
}

function getWetnessScore(venue) {
    const n = Number(venue?.wetnessScore);
    if (Number.isFinite(n)) return Math.max(0, Math.min(100, Math.round(n)));
    return computeWetnessScoreFallback(venue);
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

// Unsplash Image Functions
function getImageCache() {
    try {
        const cache = localStorage.getItem(IMAGE_CACHE_KEY);
        return cache ? JSON.parse(cache) : {};
    } catch (error) {
        // Silently return empty cache if localStorage fails
        return {};
    }
}

function setImageCache(venueName, imageUrl) {
    try {
        const cache = getImageCache();
        cache[venueName] = {
            url: imageUrl,
            timestamp: Date.now()
        };
        localStorage.setItem(IMAGE_CACHE_KEY, JSON.stringify(cache));
    } catch (error) {
        // Silently fail if localStorage quota exceeded or unavailable
        // Images will just not be cached
    }
}

function getCachedImage(venueName) {
    const cache = getImageCache();
    const cached = cache[venueName];

    if (cached && (Date.now() - cached.timestamp < CACHE_DURATION)) {
        return cached.url;
    }

    return null;
}

async function fetchUnsplashImage(venueName) {
    // Check cache first
    const cachedUrl = getCachedImage(venueName);
    if (cachedUrl) {
        return cachedUrl;
    }

    // Better search terms for specific venues
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
        'God\'s Own Junkyard': 'neon lights art installation',
        'Frameless': 'Frameless immersive art London',
        'London Aquarium': 'London Aquarium Sea Life',
        'West End Theatre': 'West End theatre London lights',
        'Electric Cinema': 'Electric Cinema Notting Hill',
        'Fortnum & Mason': 'Fortnum Mason London interior',
        'Foyles Bookshop': 'Foyles bookshop London',
        'Little Venice': 'Little Venice London canal'
    };

    // Use custom search term if available, otherwise use venue name
    let searchQuery = searchTerms[venueName] || venueName.replace(/, London$/, '') + ' London';

    try {
        const response = await fetch(
            `${UNSPLASH_API_URL}/search/photos?query=${encodeURIComponent(searchQuery)}&per_page=1&orientation=landscape`,
            {
                headers: {
                    'Authorization': `Client-ID ${UNSPLASH_ACCESS_KEY}`
                }
            }
        );

        if (!response.ok) {
            // Silently fail - will use gradient fallback
            return null;
        }

        const data = await response.json();

        if (data.results && data.results.length > 0) {
            const imageUrl = data.results[0].urls.regular;
            setImageCache(venueName, imageUrl);
            return imageUrl;
        }

        // No results found - will use gradient fallback
        return null;
    } catch (error) {
        // Network error or API failure - silently use gradient fallback
        // Only log in development if needed
        // console.warn(`Image unavailable for ${venueName}, using fallback gradient`);
        return null;
    }
}

// Batch fetch images for multiple venues
async function fetchImagesForVenues(venues) {
    const promises = venues.map(venue => fetchUnsplashImage(venue.name));
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

function formatPriceDisplay(priceText) {
    if (!priceText) return '';
    const t = String(priceText).trim();

    // Only append when it looks like a numeric GBP amount and doesn't already specify a unit
    const hasPoundsNumber = /£\s*\d+/.test(t);
    const alreadyHasUnit = /per\s*(person|pp)|\/\s*person|each|ticket|entry/i.test(t);

    if (hasPoundsNumber && !alreadyHasUnit) {
        return `${t} per person`;
    }
    return t;
}

function getWetnessCopy(score) {
    const s = Number(score);
    if (!Number.isFinite(s)) return 'Check the route';

    if (s <= 10) return "You’ll stay dry";
    if (s <= 25) return "Light drizzle risk";
    if (s <= 45) return "You’ll get a bit damp";
    return "Properly wet";
}

function getWetnessLabelWithPercent(score) {
    const s = Number(score);
    const percent = Number.isFinite(s) ? Math.round(s) : 0;
    const copy = getWetnessCopy(percent);
    if (percent <= 0) return copy;
    return `${copy} · ${percent}% wet`;
}


const TRUST_MESSAGES = [
    "Every place here works properly in the rain",
    "Chosen for bad weather, not good intentions",
    "No long outdoor queues. No optimism.",
    "If it’s here, you’ll stay mostly dry"
];

function initTrustLine() {
    const el = document.getElementById('trustLine');
    if (!el) return;
    const msg = TRUST_MESSAGES[Math.floor(Math.random() * TRUST_MESSAGES.length)];
    el.textContent = msg;
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


function getTrustTags(venue) {
    const tags = [];
    const w = Number(venue.wetnessScore);
    if (Number.isFinite(w)) {
        if (w <= 0) tags.push("You’ll stay dry");
        else if (w <= 20) tags.push("Minimal exposure");
    }
    // If venue types imply indoor
    const types = Array.isArray(venue.type) ? venue.type.map(t => String(t).toLowerCase()) : [];
    const indoorTypes = ["museum","museums","gallery","galleries","cinema","theatre","theater","aquarium","spa","bowling","arcade","indoor"];
    if (types.some(t => indoorTypes.includes(t))) tags.push("Indoor throughout");
    // De-dupe and cap
    return [...new Set(tags)].slice(0, 2);
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
        .map((venue, i) => createActivityCardHTML(venue, i, { idPrefix: 'good-now', showId: true }))
        .join('');

    setTimeout(() => updateViewDetailsButtons(), 50);
    setTimeout(() => updateBookmarkIcons(), 50);
}



function renderGoodRightNow() {
    const section = document.getElementById('goodRightNow');
    const grid = document.getElementById('goodRightNowGrid');
    if (!section || !grid) return;

    const venues = (window.londonVenues || []).filter(v => v && v.name);

    // Prefer open now, then driest (lowest wetnessScore), then highest rating if present
    const ranked = venues
        .map(v => {
            const openNow = (typeof isVenueOpenNow === 'function') ? isVenueOpenNow(v) : null;
            const wet = Number.isFinite(Number(v.wetnessScore)) ? Number(v.wetnessScore) : 999;
            const rating = Number.isFinite(Number(v.rating)) ? Number(v.rating) : 0;
            const hasBookingLink = !!(v.website || v.bookingUrl || v.url);
            return { v, openNow, wet, rating, hasBookingLink };
        })
        .sort((a, b) => {
            // open now first (true > null/false)
            const ao = a.openNow === true ? 2 : (a.openNow === null ? 1 : 0);
            const bo = b.openNow === true ? 2 : (b.openNow === null ? 1 : 0);
            if (bo !== ao) return bo - ao;

            // then driest
            if (a.wet !== b.wet) return a.wet - b.wet;

            // then rating
            if (b.rating !== a.rating) return b.rating - a.rating;

            // then prefer items with links
            if (b.hasBookingLink !== a.hasBookingLink) return (b.hasBookingLink ? 1 : 0) - (a.hasBookingLink ? 1 : 0);

            return (a.v.name || '').localeCompare(b.v.name || '');
        });

    const picks = ranked.slice(0, 3).map(x => x.v);

    if (picks.length === 0) {
        section.style.display = 'none';
        grid.innerHTML = '';
        return;
    }

    section.style.display = 'block';
    grid.innerHTML = picks
        .map((venue, i) => createActivityCardHTML(venue, i, { idPrefix: 'good-now', showId: true }))
        .join('');

    // Lazy load images for Good right now cards
    picks.forEach(async (venue, i) => {
        if (!getCachedImage(venue.name)) {
            const imageUrl = await fetchUnsplashImage(venue.name);
            if (imageUrl) {
                const safeNameId = venue.name.replace(/[^a-zA-Z0-9]/g, '-');
                const card = document.getElementById(`good-now-${safeNameId}-${i}`);
                if (card) {
                    const imgDiv = card.querySelector('.activity-image');
                    if (imgDiv) {
                        imgDiv.style.backgroundImage = `url('${imageUrl}')`;
                        imgDiv.style.backgroundSize = 'cover';
                        imgDiv.style.backgroundPosition = 'center';
                    }
                }
            }
        }
    });


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
        badgeHTML = ''
    } = options;

    const cachedImage = getCachedImage(venue.name);
    const backgroundStyle = cachedImage
        ? `background-image: url('${cachedImage}'); background-size: cover; background-position: center;`
        : `background-image: url('${getPlaceholderImage(venue)}'); background-size: cover; background-position: center;`;

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
    const venueNameAttr = (venue.name || '').replace(/'/g, '&#39;');


    // ADD SPONSORED CLASS TO CARD - MONETIZATION FEATURE
    const sponsoredClass = isSponsored(venue) ? 'sponsored-card' : '';

    return `
        <div class="activity-card ${sponsoredClass} ${cardClass}" ${idAttr} data-venue-name='${venueNameAttr}' ${dataAttrs}>
            <div class="activity-image" style="${backgroundStyle}">
                ${sponsoredBadge}
                ${badgeHTML}
                ${openBadge}
                <div class="${bookmarkClass}" onclick="toggleBookmarkFromCard(event, '${venue.name.replace(/'/g, "\\'")}')"><svg viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"></path></svg></div>
                <div class="umbrella-chip" data-tooltip="${tooltipText}">${umbrellaEmoji}</div>
            </div>
            <div class="activity-content">
                <h3>${venue.name}</h3>
                ${(() => {
                    const t = getTrustTags(venue);
                    if (!t || !t.length) return '';
                    return `<div class="trust-chips">${t.map(x => `<span class="trust-chip">${x}</span>`).join('')}</div>`;
                })()}
                <div class="activity-tags">
                    <span class="tag">${labelCategory(venue.type[0])}</span>
                    <span class="tag">${labelCategory(venue.location)}</span>
                    <span class="tag">${labelCategory(venue.wetness)}</span>
                </div>
                <p>${venue.description}</p>
                <div class="wetness-indicator">
                    <div class="wetness-bar">
                        <div class="wetness-bar-fill" style="width: ${wetnessPercent}%"></div>
                    </div>
                    <span class="wetness-label">${getWetnessLabelWithPercent(wetnessPercent)}</span>
                </div>
                <div class="price">${venue.priceDisplay}</div>
                <button class="book-btn">See details</button>
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

    const startIndex = displayedCount;
    const venuesToShow = venues.slice(startIndex, startIndex + VENUES_PER_PAGE);
    displayedCount = startIndex + venuesToShow.length;

    // Optimistic rendering: Render text content first, then update with images
    const venueHTML = venuesToShow.map((venue, index) => {
        // Initial render with placeholder or cached image if available
        const cachedUrl = getCachedImage(venue.name);
        const backgroundStyle = cachedUrl
            ? `background-image: url('${cachedUrl}');`
            : `background-image: url('${getPlaceholderImage(venue)}'); background-size: cover;`;

        return createActivityCardHTML(venue, startIndex + index);
    }).join('');

    if (append) {
        grid.insertAdjacentHTML('beforeend', venueHTML);
    } else {
        grid.innerHTML = venueHTML;
    }

    // Lazy load images
    venuesToShow.forEach(async (venue, index) => {
        if (!getCachedImage(venue.name)) {
            const imageUrl = await fetchUnsplashImage(venue.name);
            if (imageUrl) {
                const safeNameId = venue.name.replace(/[^a-zA-Z0-9]/g, '-');
                const cardIndex = startIndex + index;
                const card = document.getElementById(`card-${safeNameId}-${cardIndex}`);
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

    // Update See details buttons logic
    updateViewDetailsButtons();
    initTrustLine();
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

// Activity type selection
document.querySelectorAll('.tag-option[data-type]').forEach(tag => {
    tag.addEventListener('click', function () {
        this.classList.toggle('selected');
        const type = this.dataset.type;
        const index = selectedTypes.indexOf(type);

        if (index > -1) {
            selectedTypes.splice(index, 1);
        } else {
            selectedTypes.push(type);
        }
        updateCounter();
    });
});

// Location selection (multiple)
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
        } else {
            // Deselect "All London" when selecting specific areas
            document.querySelector('.location-option[data-location="all"]').classList.remove('selected');

            // Toggle this location
            this.classList.toggle('selected');
            const index = selectedLocations.indexOf(location);

            if (index > -1) {
                selectedLocations.splice(index, 1);
            } else {
                selectedLocations.push(location);
            }

            // If nothing is selected, reselect "All London"
            if (selectedLocations.length === 0) {
                document.querySelector('.location-option[data-location="all"]').classList.add('selected');
            }
        }
        updateCounter();
    });
});

// Wetness selection (multiple)
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
        } else {
            // Deselect "I don't mind" when selecting specific wetness
            document.querySelector('.wetness-option[data-wetness="any"]').classList.remove('selected');

            // Toggle this wetness level
            this.classList.toggle('selected');
            const index = selectedWetness.indexOf(wetness);

            if (index > -1) {
                selectedWetness.splice(index, 1);
            } else {
                selectedWetness.push(wetness);
            }

            // If nothing is selected, reselect "I don't mind"
            if (selectedWetness.length === 0) {
                document.querySelector('.wetness-option[data-wetness="any"]').classList.add('selected');
            }
        }
        updateCounter();
    });
});

// Prerequisites selection
document.querySelectorAll('.prereq-tag').forEach(tag => {
    tag.addEventListener('click', function () {
        this.classList.toggle('selected');
        const text = this.textContent;
        const index = selectedPrerequisites.indexOf(text);

        if (index > -1) {
            selectedPrerequisites.splice(index, 1);
        } else {
            selectedPrerequisites.push(text);
        }
        updatePrereqCounter();
        updateCounter();
    });
});

function clearFilters() {
    selectedTypes = [];
    selectedLocations = [];
    selectedWetness = [];
    filterOpenNow = false;

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

    document.getElementById('preferences').value = '';
    document.getElementById('openNowFilter').checked = false;
    updateCounter();
}

function toggleOpenNow() {
    filterOpenNow = document.getElementById('openNowFilter').checked;
    updateCounter();
}

function clearPrerequisites() {
    selectedPrerequisites = [];
    document.querySelectorAll('.prereq-tag').forEach(tag => {
        tag.classList.remove('selected');
    });
    updatePrereqCounter();
    updateCounter();
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
    try { sessionStorage.setItem('wetlondon:scrollY', String(window.scrollY || 0)); } catch {}
    trackRecentlyViewed(venue);
    currentActivity = venue;
    const modal = document.getElementById('activityModal');

    // Lock body scroll
    document.body.classList.add('modal-open');

    // Set affiliate link on main button
    const bookBtn = document.getElementById('bookActivityBtn');
    if (venue.affiliateLink) {
        bookBtn.textContent = 'Book Tickets 🎟️';
        bookBtn.onclick = () => window.open(venue.affiliateLink, '_blank');
        bookBtn.classList.remove('action-btn-secondary');
        bookBtn.classList.add('action-btn-primary');
    } else {
        // Fallback for venues without affiliate link - search Google/Maps
        bookBtn.textContent = 'Search on Google';
        bookBtn.onclick = () => window.open(`https://www.google.com/search?q=${encodeURIComponent(venue.name + ' London tickets')}`, '_blank');
        bookBtn.classList.remove('action-btn-primary');
        bookBtn.classList.add('action-btn-secondary');
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
    if (modalWetnessLabel) modalWetnessLabel.textContent = `${getWetnessLabelWithPercent(wetnessPercent)}`;

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

    // Show modal
    modal.classList.add('active');

    // Reset to overview tab
    switchTab('overview');
}

function closeActivityModal() {
    document.getElementById('activityModal').classList.remove('active');
    document.body.classList.remove('modal-open');
    currentActivity = null;

    // Restore scroll position (so opening a card doesn't lose your place)
    try {
        const y = parseInt(sessionStorage.getItem('wetlondon:scrollY') || '0', 10);
        sessionStorage.removeItem('wetlondon:scrollY');
        requestAnimationFrame(() => window.scrollTo({ top: y, behavior: 'auto' }));
    } catch {}
}

function searchVenueOnline() {
    if (!currentActivity) return;

    // Create search query with venue name and "London"
    const searchQuery = encodeURIComponent(`${currentActivity.name} London`);
    const searchUrl = `https://www.google.com/search?q=${searchQuery}`;

    // Open in new tab
    window.open(searchUrl, '_blank');
}

function switchTab(tabName) {
    // Update tab buttons
    document.querySelectorAll('.activity-tab').forEach(tab => {
        tab.classList.remove('active');
    });
    event.target.classList.add('active');

    // Update tab content
    document.querySelectorAll('.activity-tab-content').forEach(content => {
        content.classList.remove('active');
    });
    document.getElementById(tabName + '-tab').classList.add('active');
}

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
    fetchUnsplashImage(currentActivity.name).then(imageUrl => {
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
    const body = `I thought you might be interested in this activity:\n\n${currentActivity.name}\n${currentActivity.description}\n\nPrice: ${currentActivity.priceDisplay}\nLocation: ${currentActivity.location}\n\nSee details: ${document.getElementById('shareLink').value}`;

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

// Update See details buttons to open modal
function updateViewDetailsButtons() {
    // Handle "See details" button clicks
    document.querySelectorAll('.book-btn').forEach((btn, index) => {
        btn.onclick = function (e) {
            e.preventDefault();
            e.stopPropagation(); // Prevent card click from also firing
            const card = this.closest('.activity-card');
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
                    priceDisplay: formatPriceDisplay(priceText),
                    rating: 4.5,
                    prerequisites: ['check venue for details']
                };
            }

            openActivityModal(venue);
        };
    });

    // Handle activity card clicks (but not bookmark icon or button)
    document.querySelectorAll('.activity-card').forEach(card => {
        card.onclick = function (e) {
            // Don't trigger if clicking bookmark icon or See details button
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
                    priceDisplay: formatPriceDisplay(priceText),
                    rating: 4.5,
                    prerequisites: ['check venue for details']
                };
            }

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
                const imageUrl = await fetchUnsplashImage(venue.name);
                if (imageUrl) {
                    const safeNameId = venue.name.replace(/[^a-zA-Z0-9]/g, '-');
                    const card = document.getElementById(`lucky-card-${safeNameId}-${index}`);
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

        // Update See details buttons and bookmark icons
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


// Recently viewed (local-only, no accounts)
const RECENTLY_VIEWED_KEY = 'recentActivities';
const RECENTLY_VIEWED_LIMIT = 12;

function getRecentlyViewed() {
    try {
        const raw = localStorage.getItem(RECENTLY_VIEWED_KEY);
        const list = raw ? JSON.parse(raw) : [];
        return Array.isArray(list) ? list : [];
    } catch {
        return [];
    }
}

function setRecentlyViewed(list) {
    try {
        localStorage.setItem(RECENTLY_VIEWED_KEY, JSON.stringify(Array.isArray(list) ? list : []));
    } catch {}
}

function trackRecentlyViewed(venue) {
    if (!venue || !venue.name) return;

    const list = getRecentlyViewed();

    // Store the most useful lightweight shape, but keep anything we already have
    const entry = {
        name: venue.name,
        description: venue.description,
        type: venue.type,
        location: venue.location,
        wetness: venue.wetness,
        wetnessScore: venue.wetnessScore || 0,
        price: venue.price,
        priceDisplay: venue.priceDisplay,
        rating: venue.rating,
        prerequisites: venue.prerequisites,
        affiliateLink: venue.affiliateLink,
        openingHours: venue.openingHours,
        sponsored: venue.sponsored === true
    };

    const next = [entry, ...list.filter(v => v && v.name !== venue.name)].slice(0, RECENTLY_VIEWED_LIMIT);
    setRecentlyViewed(next);

    renderRecentlyViewedSection();
}

function renderSavedForLaterSection() {
    const section = document.getElementById('savedForLaterSection');
    const grid = document.getElementById('savedForLaterGrid');
    const empty = document.getElementById('savedForLaterEmpty');
    if (!section || !grid || !empty) return;

    const saved = JSON.parse(localStorage.getItem('savedActivities') || '[]');
    const list = Array.isArray(saved) ? saved : [];

    if (list.length === 0) {
        section.style.display = 'block';
        empty.style.display = 'block';
        grid.innerHTML = '';
        return;
    }

    section.style.display = 'block';
    empty.style.display = 'none';

    const top = list.slice(0, 6);
    grid.innerHTML = top.map((venue, i) => createActivityCardHTML(venue, i, { idPrefix: 'saved', isSaved: true, showId: false })).join('');

    setTimeout(() => {
        updateViewDetailsButtons();
        updateBookmarkIcons();
    }, 50);
}

function renderRecentlyViewedSection() {
    const section = document.getElementById('recentlyViewedSection');
    const grid = document.getElementById('recentlyViewedGrid');
    const empty = document.getElementById('recentlyViewedEmpty');
    const clearBtn = document.getElementById('clearRecentlyViewedBtn');

    if (!section || !grid || !empty) return;

    const list = getRecentlyViewed();

    if (clearBtn && !clearBtn.__wetLondonBound) {
        clearBtn.__wetLondonBound = true;
        clearBtn.addEventListener('click', () => {
            setRecentlyViewed([]);
            renderRecentlyViewedSection();
            showToast('🧹', 'Recently viewed cleared');
        });
    }

    if (list.length === 0) {
        section.style.display = 'block';
        empty.style.display = 'block';
        grid.innerHTML = '';
        if (clearBtn) clearBtn.style.display = 'none';
        return;
    }

    section.style.display = 'block';
    empty.style.display = 'none';
    if (clearBtn) clearBtn.style.display = 'inline-flex';

    const top = list.slice(0, 6);
    grid.innerHTML = top.map((venue, i) => createActivityCardHTML(venue, i, { idPrefix: 'recent', showId: false })).join('');

    setTimeout(() => {
        updateViewDetailsButtons();
        updateBookmarkIcons();
    }, 50);
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
                priceDisplay: formatPriceDisplay(priceText),
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
        const imagePromises = savedActivities.map(venue => fetchUnsplashImage(venue.name));
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

        // Hook up the See details buttons
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
    const imagePromises = venuesToShow.map(venue => fetchUnsplashImage(venue.name));
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

    // Update See details buttons
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
            precipitation: Number(current.precipitation) || 0,
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
        precipitation: 0,
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
    console.log('=== Weather Recommendations Debug ===');
    console.log('Weather data:', JSON.stringify(weather, null, 2));

    const section = document.getElementById('weatherRecommendations');
    const grid = document.getElementById('weatherRecGrid');
    const icon = document.getElementById('weatherRecIcon');
    const title = document.getElementById('weatherRecTitle');
    const subtitle = document.getElementById('weatherRecSubtitle');

    console.log('Section element:', section);
    console.log('Grid element:', grid);
    console.log('Grid ID check:', document.getElementById('weatherRecGrid') === grid);

    if (!section || !grid) {
        console.error('ERROR: Weather recommendations elements not found!');
        console.error('section:', section);
        console.error('grid:', grid);
        return;
    }

    // Add test content to verify grid is accessible
    grid.innerHTML = '<div style="padding: 2rem; background: red; color: white; font-size: 2rem;">TEST CONTENT - If you see this, grid is working!</div>';
    console.log('Added test content to grid');
    console.log('Grid innerHTML after test:', grid.innerHTML.substring(0, 100));

    let recommendedVenues = [];
    let iconEmoji = '';
    let titleText = '';
    let subtitleText = '';

    
    // Wetness thresholds (use score where possible, fallback keeps it consistent)
    const precipitation = Number(weather?.precipitation) || 0;
    const code = Number(weather?.weatherCode) || 0;
    const isHeavierRain = Boolean(weather?.isRaining) && (precipitation >= 2 || (code >= 61 && code <= 65) || (code >= 80 && code <= 82));
    const rainThreshold = isHeavierRain ? 15 : 25;

// Determine recommendations based on weather conditions
    if (weather.isRaining) {
        // Heavy rain - prioritize completely dry venues
        iconEmoji = '';  // No emoji
        titleText = 'Perfect for Rainy Weather';
        subtitleText = 'Stay completely dry at these venues';
        recommendedVenues = window.londonVenues
            .filter(v => getWetnessScore(v) <= rainThreshold)
            .sort((a, b) => b.rating - a.rating)
            .slice(0, 6);
        console.log('Rainy weather detected');
    } else if (weather.temp < 10) {
        // Cold - prioritize cozy indoor venues
        iconEmoji = '';  // No emoji
        titleText = 'Cozy Indoor Escapes';
        subtitleText = 'Warm up at these comfortable venues';
        recommendedVenues = window.londonVenues
            .filter(v =>
                getWetnessScore(v) <= 20 &&
                (v.type.includes('dining') || v.type.includes('cinema') || v.type.includes('wellness'))
            )
            .sort((a, b) => b.rating - a.rating)
            .slice(0, 6);

        console.log('Cold weather detected, found', recommendedVenues.length, 'cozy venues');

        // Fallback if not enough cozy venues
        if (recommendedVenues.length < 6) {
            console.log('Not enough cozy venues, using fallback');
            recommendedVenues = window.londonVenues
                .filter(v => getWetnessScore(v) <= 25)
                .sort((a, b) => b.rating - a.rating)
                .slice(0, 6);
        }
    } else if (weather.temp > 20) {
        // Warm/sunny - show light activities with some airiness
        iconEmoji = '';  // No emoji
        titleText = 'Light & Bright Activities';
        subtitleText = 'Enjoy indoor spaces with natural light';
        recommendedVenues = window.londonVenues
            .filter(v =>
                getWetnessScore(v) <= 35 &&
                (v.type.includes('galleries') || v.type.includes('shopping') || v.type.includes('exhibitions'))
            )
            .sort((a, b) => b.rating - a.rating)
            .slice(0, 6);

        console.log('Warm weather detected, found', recommendedVenues.length, 'bright venues');

        // Fallback if not enough
        if (recommendedVenues.length < 6) {
            console.log('Not enough bright venues, using fallback');
            recommendedVenues = window.londonVenues
                .filter(v => getWetnessScore(v) <= 25)
                .sort((a, b) => b.rating - a.rating)
                .slice(0, 6);
        }
    } else if (weather.humidity > 80) {
        // High humidity - prioritize air-conditioned venues
        iconEmoji = '';  // No emoji
        titleText = 'Climate Controlled Comfort';
        subtitleText = 'Cool and comfortable venues';
        recommendedVenues = window.londonVenues
            .filter(v =>
                getWetnessScore(v) <= 20 &&
                (v.type.includes('cinema') || v.type.includes('museums') || v.type.includes('shopping'))
            )
            .sort((a, b) => b.rating - a.rating)
            .slice(0, 6);

        console.log('High humidity detected, found', recommendedVenues.length, 'AC venues');

        // Fallback if not enough
        if (recommendedVenues.length < 6) {
            console.log('Not enough AC venues, using fallback');
            recommendedVenues = window.londonVenues
                .filter(v => getWetnessScore(v) <= 25)
                .sort((a, b) => b.rating - a.rating)
                .slice(0, 6);
        }
    } else {
        // Pleasant weather - show popular venues
        iconEmoji = '';  // No emoji
        titleText = 'Top Indoor Attractions';
        subtitleText = 'Popular activities for today';
        recommendedVenues = window.londonVenues
            .filter(v => v.rating >= 4.5)
            .sort((a, b) => b.rating - a.rating)
            .slice(0, 6);
        console.log('Pleasant weather detected');
    }

    console.log('Final recommended venues count:', recommendedVenues.length);
    console.log('Venue names:', recommendedVenues.map(v => v.name));

    // Update header (hide icon if no emoji)
    if (icon) {
        if (iconEmoji) {
            icon.textContent = iconEmoji;
            icon.style.display = 'block';
        } else {
            icon.style.display = 'none';  // Hide icon element
        }
    }
    if (title) title.textContent = titleText;
    if (subtitle) subtitle.textContent = subtitleText;

    // Show section if we have recommendations
    if (recommendedVenues.length > 0) {
        console.log('Setting section display to block');
        section.style.display = 'block';

        console.log('Starting to build HTML...');

        // CLEAR the test content before adding real content
        grid.innerHTML = '';

        // Build cards HTML
        const cardsHTML = recommendedVenues.map((venue, index) => {
            // Use placeholder immediately
            const placeholderImage = getPlaceholderImage(venue);
            const backgroundStyle = `background-image: url('${placeholderImage}'); background-size: cover; background-position: center;`;

            const cardHTML = createActivityCardHTML(venue, index, {
                showId: false,
                dataAttrs: `data-venue-index="${index}" data-venue-name="${venue.name}"`
            });

            return cardHTML;
        }).join('');

        console.log('HTML length:', cardsHTML.length, 'characters');
        console.log('First 500 chars:', cardsHTML.substring(0, 500));

        // Insert the HTML
        grid.innerHTML = cardsHTML;

        console.log('Grid innerHTML set');
        console.log('Grid children count:', grid.children.length);
        console.log('Grid display:', window.getComputedStyle(grid).display);
        console.log('Grid visibility:', window.getComputedStyle(grid).visibility);
        console.log('Section display:', window.getComputedStyle(section).display);

        // Update See details buttons for these cards
        setTimeout(() => {
            updateViewDetailsButtons();
            updateBookmarkIcons();
            console.log('Updated buttons and icons');
        }, 100);

        // NOW fetch real images in background and update if available
        setTimeout(async () => {
            try {
                console.log('Fetching Unsplash images...');
                const imagePromises = recommendedVenues.map(venue => fetchUnsplashImage(venue.name));
                const images = await Promise.all(imagePromises);

                // Update images if we got better ones
                images.forEach((imageUrl, index) => {
                    if (imageUrl) {
                        const card = grid.querySelector(`[data-venue-index="${index}"] .activity-image`);
                        if (card) {
                            card.style.backgroundImage = `url('${imageUrl}')`;
                            console.log('Updated image for venue', index);
                        }
                    }
                });
                console.log('Finished updating Unsplash images');
            } catch (error) {
                console.error('Could not fetch Unsplash images:', error);
            }
        }, 500);

    } else {
        // Hide section if no recommendations
        console.log('No recommendations found, hiding section');
        section.style.display = 'none';
    }

    console.log('=== End Weather Recommendations Debug ===');
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
            badgeHTML: '<div class="featured-badge">Spotlight</div>'
        });
    }

    featured.forEach((venue, i) => {
        const cardIndex = spotlight ? i + 1 : i;
        html += createActivityCardHTML(venue, cardIndex, {
            idPrefix: 'featured',
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

    for (const card of cards) {
        const h3 = card.querySelector('h3');
        if (!h3) continue;

        const venueName = h3.textContent.trim();
        const imageDiv = card.querySelector('.activity-image');
        if (!imageDiv) continue;

        // Check if already has background image
        if (imageDiv.style.backgroundImage) continue;

        // Find venue in database for fallback gradient
        const venue = window.londonVenues.find(v => v.name === venueName);

        // Fetch image
        const imageUrl = await fetchUnsplashImage(venueName);

        if (imageUrl) {
            imageDiv.style.backgroundImage = `url('${imageUrl}')`;
            imageDiv.style.backgroundSize = 'cover';
        } else if (venue) {
            imageDiv.style.backgroundImage = `url('${getPlaceholderImage(venue)}')`;
            imageDiv.style.backgroundSize = 'cover';
        }
    }
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

// Initialize See details buttons on page load for Featured Activities
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

    // Load images for static Featured Activities
    loadFeaturedActivityImages();

    // Show loading state while Supabase fetches
    setVenuesLoading(true);

    // Load venues from Supabase (fallback to local data.js if it fails)
    if (typeof loadVenuesFromSupabase === 'function') {
        await loadVenuesFromSupabase();
    }

    // Ensure every venue has a reliable wetnessScore for UI + recommendations
    ensureWetnessScores(window.londonVenues);

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

    // === FILTER CHIP EVENT LISTENERS ===

    // Type chips
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

    // Location/Area chips
    document.querySelectorAll('.location-option').forEach(option => {
        option.addEventListener('click', function () {
            const location = this.dataset.location;
            console.log('location clicked:', location);

            if (filters.areas.has(location)) {
                filters.areas.delete(location);
                this.classList.remove('selected');
            } else {
                filters.areas.add(location);
                this.classList.add('selected');
            }

            updateDoneButtonLabels();
        });
    });

    // Wetness chips
    document.querySelectorAll('.wetness-option').forEach(option => {
        option.addEventListener('click', function () {
            const wetness = this.dataset.wetness;
            console.log('wetness clicked:', wetness);

            if (wetness === 'any') {
                // Clear all wetness selections
                document.querySelectorAll('.wetness-option').forEach(opt => {
                    opt.classList.remove('selected');
                });
                this.classList.add('selected');
                filters.wetness = null;
            } else {
                // Deselect "any" option
                document.querySelector('.wetness-option[data-wetness="any"]')?.classList.remove('selected');

                // Toggle this wetness level
                if (filters.wetness === wetness) {
                    filters.wetness = null;
                    this.classList.remove('selected');
                } else {
                    // Deselect other wetness options
                    document.querySelectorAll('.wetness-option').forEach(opt => {
                        opt.classList.remove('selected');
                    });
                    filters.wetness = wetness;
                    this.classList.add('selected');
                }
            }

            updateDoneButtonLabels();
        });
    });

    // Open Now checkbox
    const openNowCheckbox = document.getElementById('openNowFilter');
    if (openNowCheckbox) {
        openNowCheckbox.addEventListener('change', function () {
            filters.openNow = this.checked;
            console.log('open now:', filters.openNow);
            updateDoneButtonLabels();
        });
    }

    // Keywords input
    const keywordsInput = document.getElementById('preferences');
    if (keywordsInput) {
        keywordsInput.addEventListener('input', function () {
            filters.keywords = this.value;
            console.log('keywords:', filters.keywords);
            updateDoneButtonLabels();
        });
    }

    // Prerequisites chips
    document.querySelectorAll('.prereq-option').forEach(option => {
        option.addEventListener('click', function () {
            const prereq = this.dataset.prereq;
            console.log('prereq clicked:', prereq);

            if (filters.constraints.has(prereq)) {
                filters.constraints.delete(prereq);
                this.classList.remove('selected');
            } else {
                filters.constraints.add(prereq);
                this.classList.add('selected');
            }

            updateDoneButtonLabels();
        });
    });


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
    renderGoodRightNow();
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
