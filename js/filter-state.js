// UNIFIED FILTER STATE - Single source of truth
const filters = {
    keywords: '',
    types: new Set(),
    areas: new Set(),
    wetness: null,  // 'dry' | 'slightly' | 'wet' | null
    maxWetnessScore: 100,  // 0-100, filter by wetness score threshold
    openNow: false,
    constraints: new Set()
};

// Track counts for Done button labels
function getFilterCounts() {
    return {
        types: filters.types.size,
        areas: filters.areas.size,
        wetness: filters.wetness ? 1 : 0,
        maxWetnessScore: filters.maxWetnessScore < 100 ? 1 : 0,
        openNow: filters.openNow ? 1 : 0,
        keywords: filters.keywords.trim() ? 1 : 0,
        constraints: filters.constraints.size,
        total: function () {
            return this.types + this.areas + this.wetness + this.maxWetnessScore + this.openNow + this.keywords + this.constraints;
        }
    };
}

// Update Done button labels
function updateDoneButtonLabels() {
    const counts = getFilterCounts();

    // Main customize modal Done button
    const customizeDone = document.querySelector('#customizeModal .btn-done .counter');
    if (customizeDone) {
        customizeDone.textContent = counts.total();
    }

    // Prerequisites modal Done button
    const prereqDone = document.querySelector('#prerequisitesModal .btn-done .counter');
    if (prereqDone) {
        prereqDone.textContent = counts.constraints;
    }
}

// Apply filters and render results (THE ONE AND ONLY applyFilters)
function applyFilters() {
    console.log('🚀 [filter-state.js] applyFilters triggered');

    // Close the customize modal
    if (typeof closeModal === 'function') {
        console.log('--- [applyFilters] Attempting to close modal ---');
        closeModal();
    } else {
        console.warn('--- [applyFilters] closeModal function not found ---');
    }

    // Read filter state
    const filtersSummary = {
        keywords: filters.keywords,
        types: Array.from(filters.types),
        areas: Array.from(filters.areas),
        wetness: filters.wetness,
        maxWetnessScore: filters.maxWetnessScore,
        openNow: filters.openNow,
        constraints: Array.from(filters.constraints)
    };
    console.log('--- [applyFilters] Current Filters State ---', filtersSummary);

    // Use existing filterVenues function from app.js
    if (typeof filterVenues === 'function') {
        console.log('--- [applyFilters] Calling filterVenues() ---');
        const filtered = filterVenues();
        console.log('--- [applyFilters] Filtered venues count: ' + filtered.length + ' ---');

        // Render results immediately
        if (typeof setGeneratedResults === 'function') {
            console.log('--- [applyFilters] Calling setGeneratedResults() ---');
            setGeneratedResults(filtered, { title: 'Your Personalized Selection' });

            // Scroll to results section if results were found
            if (filtered.length > 0) {
                const section = document.getElementById('generatedSection');
                if (section) {
                    console.log('--- [applyFilters] Scrolling to results section ---');
                    section.scrollIntoView({ behavior: 'smooth', block: 'start' });
                }
            }
        } else {
            console.error('❌ [applyFilters] ERROR: setGeneratedResults function not found!');
        }
    } else {
        console.error('❌ [applyFilters] ERROR: filterVenues function not found!');
    }

    console.log('✅ [filter-state.js] applyFilters execution complete');
}

// Expose THE ONE applyFilters function globally
window.applyFilters = applyFilters;
