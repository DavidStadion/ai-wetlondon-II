import { Modal } from '@/components/common/Modal';
import { Tag } from '@/components/common/Tag';
import { Button } from '@/components/common/Button';
import { isCustomizeModalOpen, isPrerequisitesModalOpen } from '@/signals/uiSignals';
import {
  keywords,
  selectedTypes,
  selectedAreas,
  wetnessLevel,
  maxWetnessScore,
  openNow,
  toggleType,
  toggleArea,
  clearAllFilters,
  hasActiveFilters,
} from '@/signals/filterSignals';
import type { VenueType, AreaType, WetnessLevel } from '@/types';
import styles from './CustomizeModal.module.css';

interface TypeOption {
  value: VenueType;
  label: string;
}

interface AreaOption {
  value: AreaType | 'all';
  label: string;
}

interface WetnessOption {
  value: WetnessLevel | 'any';
  label: string;
  description: string;
}

const TYPE_OPTIONS: TypeOption[] = [
  { value: 'museums', label: 'Museums' },
  { value: 'galleries', label: 'Galleries' },
  { value: 'theatre', label: 'Theatre' },
  { value: 'dining', label: 'Dining' },
  { value: 'entertainment', label: 'Entertainment' },
  { value: 'shopping', label: 'Shopping' },
  { value: 'wellness', label: 'Wellness & Spa' },
  { value: 'nightlife', label: 'Nightlife' },
  { value: 'music', label: 'Music Venues' },
  { value: 'comedy', label: 'Comedy Clubs' },
  { value: 'cinema', label: 'Cinemas' },
  { value: 'gaming', label: 'Gaming' },
  { value: 'workshops', label: 'Classes & Workshops' },
  { value: 'historic', label: 'Historic Sites' },
  { value: 'markets', label: 'Markets' },
  { value: 'sports', label: 'Sports & Fitness' },
  { value: 'exhibitions', label: 'Exhibitions' },
  { value: 'libraries', label: 'Libraries' },
];

const AREA_OPTIONS: AreaOption[] = [
  { value: 'all', label: 'All London' },
  { value: 'north', label: 'North' },
  { value: 'south', label: 'South' },
  { value: 'east', label: 'East' },
  { value: 'west', label: 'West' },
  { value: 'central', label: 'Central' },
];

const WETNESS_OPTIONS: WetnessOption[] = [
  { value: 'any', label: "I don't mind", description: 'Happy to experience any venue regardless of weather exposure.' },
  { value: 'dry', label: 'Not at all (Completely Dry)', description: 'Direct tube/station access. Entire experience is fully covered and indoor.' },
  { value: 'slightly', label: 'Slightly Wet', description: '5-10 min walk from station. Some outdoor elements but mostly covered.' },
  { value: 'wet', label: 'Prepared to Get Wet', description: 'Longer journey (10+ mins). Significant outdoor portions of the experience.' },
];

export function CustomizeModal() {
  const isOpen = isCustomizeModalOpen.value;

  const handleClose = () => {
    isCustomizeModalOpen.value = false;
  };

  const handleAreaToggle = (area: AreaType | 'all') => {
    if (area === 'all') {
      selectedAreas.value = new Set();
    } else {
      toggleArea(area);
    }
  };

  const handleWetnessSelect = (level: WetnessLevel | 'any') => {
    wetnessLevel.value = level === 'any' ? null : level;
  };

  const handleSliderChange = (e: Event) => {
    const target = e.target as HTMLInputElement;
    maxWetnessScore.value = parseInt(target.value, 10);
  };

  const handleOpenNowToggle = () => {
    openNow.value = !openNow.value;
  };

  const handleOpenPrerequisites = () => {
    isPrerequisitesModalOpen.value = true;
  };

  const handleClearAll = () => {
    clearAllFilters();
  };

  const handlePreferencesInput = (e: Event) => {
    const target = e.target as HTMLInputElement;
    keywords.value = target.value;
  };

  const isAllAreas = selectedAreas.value.size === 0;
  const currentWetness = wetnessLevel.value ?? 'any';
  const activeFilterCount = countActiveFilters();

  function countActiveFilters(): number {
    let count = 0;
    if (keywords.value.trim()) count++;
    count += selectedTypes.value.size;
    count += selectedAreas.value.size;
    if (wetnessLevel.value !== null) count++;
    if (maxWetnessScore.value < 100) count++;
    if (openNow.value) count++;
    return count;
  }

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="Customize Your Experience" size="lg">
      <div className={styles.form}>
        {/* Preferences text input */}
        <div className={styles.section}>
          <label className={styles.label} htmlFor="preferences">
            What are you looking to do?
          </label>
          <input
            type="text"
            id="preferences"
            className={styles.input}
            placeholder="E.g., I want to learn about history, see contemporary art, try new foods..."
            value={keywords.value}
            onInput={handlePreferencesInput}
          />
        </div>

        {/* Activity Types */}
        <div className={styles.section}>
          <span className={styles.label}>Activity Types</span>
          <div className={styles.tagGrid}>
            {TYPE_OPTIONS.map((type) => (
              <Tag
                key={type.value}
                label={type.label}
                selected={selectedTypes.value.has(type.value)}
                onClick={() => toggleType(type.value)}
              />
            ))}
          </div>
        </div>

        {/* London Area */}
        <div className={styles.section}>
          <span className={styles.label}>London Area</span>
          <div className={styles.areaGrid}>
            {AREA_OPTIONS.map((area) => (
              <Tag
                key={area.value}
                label={area.label}
                selected={area.value === 'all' ? isAllAreas : selectedAreas.value.has(area.value as AreaType)}
                onClick={() => handleAreaToggle(area.value)}
              />
            ))}
          </div>
        </div>

        {/* Wetness Preference */}
        <div className={styles.section}>
          <span className={styles.label}>How wet are you prepared to get?</span>
          <div className={styles.wetnessOptions}>
            {WETNESS_OPTIONS.map((option) => (
              <button
                key={option.value}
                type="button"
                className={`${styles.wetnessOption} ${currentWetness === option.value ? styles['wetnessOption--selected'] : ''}`}
                onClick={() => handleWetnessSelect(option.value)}
              >
                <strong>{option.label}</strong>
                <span>{option.description}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Wetness Slider */}
        <div className={styles.section}>
          <label className={styles.label} htmlFor="wetness-slider">Maximum Wetness Tolerance</label>
          <div className={styles.sliderContainer}>
            <input
              type="range"
              id="wetness-slider"
              className={styles.slider}
              min="0"
              max="100"
              step="5"
              value={maxWetnessScore.value}
              onInput={handleSliderChange}
            />
            <div className={styles.sliderLabels}>
              <span>Completely Dry</span>
              <span className={styles.sliderValue}>{maxWetnessScore.value}%</span>
              <span>Mostly Outdoors</span>
            </div>
          </div>
          <p className={styles.hint}>Slide to filter activities by maximum rain exposure</p>
        </div>

        {/* Open Now */}
        <div className={styles.section}>
          <label className={styles.checkboxLabel}>
            <input
              type="checkbox"
              checked={openNow.value}
              onChange={handleOpenNowToggle}
              className={styles.checkbox}
            />
            <span>Show only venues open now</span>
          </label>
          <p className={styles.hint}>Filter out venues that are currently closed</p>
        </div>

        {/* Prerequisites Button */}
        <button type="button" className={styles.prerequisitesBtn} onClick={handleOpenPrerequisites}>
          + Add constraints like accessibility, budget, or dietary needs...
        </button>
      </div>

      {/* Footer */}
      <div className={styles.footer}>
        <Button variant="ghost" onClick={handleClearAll} disabled={!hasActiveFilters.value}>
          Clear All
        </Button>
        <Button onClick={handleClose}>
          Done {activeFilterCount > 0 && `(${activeFilterCount})`}
        </Button>
      </div>
    </Modal>
  );
}
