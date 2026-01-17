# Wet London Product Backlog

Last updated: 2026-01-05

---

## Feature Enhancements

### 1. Wetness as a First Class System
- [ ] Introduce a Wetness Score system (0-100 scale)
  - [ ] Add `wetnessScore` attribute to each activity
    - 0 = completely dry, direct indoor access
    - 100 = mostly outdoors
  - [ ] Derive score from attributes:
    - Walking distance from transport
    - Outdoor elements
    - Covered vs uncovered access
  - [ ] Display wetness score on activity cards
    - Small horizontal bar indicator
    - Label format: "0% wet", "15% wet", "40% wet"
  - [ ] Add filtering by maximum wetness
  - [ ] Add sorting by driest first
  - [ ] Keep UI subtle and consistent with editorial London feel

**Goal**: Standardize how exposed an activity is to rain without overwhelming the card design.

---

### 2. "I'm Feeling Lucky" as a Delightful Moment
- [ ] Improve "I'm Feeling Lucky" to feel intentional, not random
  - [ ] Select 1 primary activity + up to 3 alternates
  - [ ] Add human language explanations
    - Example: "Picked because it's dry, nearby, and open right now"
  - [ ] Add instant reroll functionality
  - [ ] Add ability to save results
  - [ ] Display primary activity larger than alternates
  - [ ] Add playful but restrained reveal animation

**Goal**: Create a moment of trust and delight, not surprise for its own sake.

---

### 3. Activity Detail Modal Simplification
- [ ] Refactor activity detail modal to reduce cognitive load
  - [ ] Default view shows only Overview content
  - [ ] Lazy load Gallery, Video, Reviews, Social on tab click
  - [ ] Mobile optimizations:
    - Convert tabs into swipeable vertical stack
    - Allow swipe down to dismiss
  - [ ] Prioritize key information:
    - Description
    - Wetness
    - Price
    - Opening status

**Goal**: Optimize for quick decision making, not browsing depth.

---

### 4. Orientation and Navigation Improvements
- [ ] Improve navigation clarity on long scrolling pages
  - [ ] Add floating action button after scrolling
    - Text: "Plan for this weather"
  - [ ] Display current filter state as sticky chip bar
    - Make chips removable inline
  - [ ] Add subtle scroll progress indicator for mobile

**Goal**: Help users understand where they are and what is shaping results without feeling heavy.

---

### 5. Performance and Polish Pass
- [ ] Performance and UX polish improvements
  - [ ] Replace heavy DOM-based rain animation with efficient approach
  - [ ] Add skeleton loaders for:
    - Activity grids
    - Generated results
  - [ ] Ensure consistent motion timing for all state changes
  - [ ] Improve empty states with friendly, contextual copy
    - Tone: helpful, calm, slightly witty

**Goal**: Focus on perceived performance and product maturity rather than adding new features.

---

## Completed Features
- [x] Initial product launch
- [x] Basic filtering system
- [x] Activity cards and detail views

---

## Notes
- Maintain editorial London feel throughout
- Prioritize mobile experience
- Focus on trust, clarity, and delight
