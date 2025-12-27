// UNIFIED FILTER STATE - Single source of truth
const filters = {
    keywords: '',
    types: new Set(),
    areas: new Set(),
    wetness: null,  // 'dry' | 'slightly' | 'wet' | null
    openNow: false,
    constraints: new Set()
};

// Track counts for Done button labels
function getFilterCounts() {
    return {
        types: filters.types.size,
        areas: filters.areas.size,
        wetness: filters.wetness ? 1 : 0,
        openNow: filters.openNow ? 1 : 0,
        keywords: filters.keywords.trim() ? 1 : 0,
        constraints: filters.constraints.size,
        total: function () {
            return this.types + this.areas + this.wetness + this.openNow + this.keywords + this.constraints;
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
    console.log('[filter-state.js:44] window.applyFilters called');
    console.log('customize done');

    closeModal();

    // Read filter state
    const filtersSummary = {
        types: Array.from(filters.types),
        areas: Array.from(filters.areas),
        wetness: filters.wetness,
        openNow: filters.openNow,
        keywords: filters.keywords,
        constraints: Array.from(filters.constraints)
    };
    console.log('filters summary:', JSON.stringify(filtersSummary));

    // Use existing filterVenues function from app.js
    const filtered = filterVenues();

    console.log('filtered count:', filtered.length);

    // Render results immediately
    setGeneratedResults(filtered, { title: 'Your Personalized Selection' });

    console.log('render complete');
}

// Expose THE ONE applyFilters function globally
window.applyFilters = applyFilters;
