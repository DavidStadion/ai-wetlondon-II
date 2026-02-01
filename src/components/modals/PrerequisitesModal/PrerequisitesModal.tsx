import { Modal } from '@/components/common/Modal';
import { Tag } from '@/components/common/Tag';
import { Button } from '@/components/common/Button';
import { isPrerequisitesModalOpen } from '@/signals/uiSignals';
import { constraints, toggleConstraint } from '@/signals/filterSignals';
import styles from './PrerequisitesModal.module.css';

interface PrerequisiteCategory {
  title: string;
  items: string[];
}

const PREREQUISITE_CATEGORIES: PrerequisiteCategory[] = [
  {
    title: 'Access & Mobility',
    items: [
      'Wheelchair accessible',
      'Step-free',
      'Lift access',
      'Low-impact',
      'Seating available',
      'Avoid stairs',
    ],
  },
  {
    title: 'Family & Groups',
    items: [
      'Child-friendly',
      'Pushchair-friendly',
      'Family tickets',
      'Quiet spaces',
      'Interactive exhibits',
    ],
  },
  {
    title: 'Budget & Time',
    items: [
      'Free entry',
      'Under 20',
      'Under 50',
      'Premium',
      'Under 1 hour',
      'Half day',
      'Full day',
    ],
  },
  {
    title: 'Sensory & Comfort',
    items: [
      'Avoid crowds',
      'Quiet environment',
      'No flashing lights',
      'No loud music',
      'Well-lit spaces',
      'Climate controlled',
    ],
  },
  {
    title: 'Dietary',
    items: [
      'Vegan options',
      'Vegetarian',
      'Gluten-free',
      'Halal',
      'Kosher',
      'Dairy-free',
      'Nut-free',
    ],
  },
  {
    title: 'Neurodiverse',
    items: [
      'Low sensory',
      'Quiet hours',
      'Predictable layouts',
      'Clear signage',
      'Relaxed timing',
    ],
  },
  {
    title: 'Practical',
    items: [
      'Cloakroom',
      'Toilets available',
      'Cafe on-site',
      'Free WiFi',
      'Photography allowed',
      'Booking required',
      'Walk-ins welcome',
    ],
  },
  {
    title: 'Experience Style',
    items: [
      'Educational',
      'Interactive',
      'Relaxing',
      'Social',
      'Solo-friendly',
      'Romantic',
      'Group activity',
      'Unique experience',
    ],
  },
  {
    title: 'Inclusive',
    items: [
      'LGBTQ+ friendly',
      'Gender-neutral facilities',
      'Inclusive spaces',
    ],
  },
];

export function PrerequisitesModal() {
  const isOpen = isPrerequisitesModalOpen.value;
  const selected = constraints.value;

  const handleClose = () => {
    isPrerequisitesModalOpen.value = false;
  };

  const handleClearAll = () => {
    constraints.value = new Set();
  };

  const selectedCount = selected.size;

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title="Activity Prerequisites"
      size="lg"
    >
      <p className={styles.description}>
        Select constraints to shape your perfect experience
      </p>

      <div className={styles.grid}>
        {PREREQUISITE_CATEGORIES.map((category) => (
          <div key={category.title} className={styles.category}>
            <h4 className={styles.categoryTitle}>{category.title}</h4>
            <div className={styles.tags}>
              {category.items.map((item) => (
                <Tag
                  key={item}
                  label={item}
                  selected={selected.has(item)}
                  onClick={() => toggleConstraint(item)}
                  variant="category"
                />
              ))}
            </div>
          </div>
        ))}
      </div>

      <div className={styles.footer}>
        <Button variant="ghost" onClick={handleClearAll}>
          Clear All
        </Button>
        <Button onClick={handleClose}>
          Done {selectedCount > 0 && `(${selectedCount})`}
        </Button>
      </div>
    </Modal>
  );
}
