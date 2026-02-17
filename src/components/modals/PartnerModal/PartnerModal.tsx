import { useState } from 'preact/hooks';
import type { Partner, PartnerType, PartnerLocation } from '@/types/partner';
import { PARTNER_TYPE_LABELS, PARTNER_LOCATION_LABELS } from '@/types/partner';
import styles from './PartnerModal.module.css';

export interface PartnerModalProps {
  partner: Partner | null;
  onClose: () => void;
  onSubmit: (data: Partial<Partner>) => void;
}

export function PartnerModal({ partner, onClose, onSubmit }: PartnerModalProps) {
  const [name, setName] = useState(partner?.name || '');
  const [type, setType] = useState<PartnerType>(partner?.type || 'workshops');
  const [location, setLocation] = useState<PartnerLocation>(partner?.location || 'central');
  const [description, setDescription] = useState(partner?.description || '');
  const [price, setPrice] = useState(partner?.price || 0);
  const [priceDisplay, setPriceDisplay] = useState(partner?.priceDisplay || '');
  const [websiteUrl, setWebsiteUrl] = useState(partner?.websiteUrl || '');
  const [affiliateLink, setAffiliateLink] = useState(partner?.affiliateLink || '');
  const [imageFilename, setImageFilename] = useState(partner?.imageFilename || '');
  const [featured, setFeatured] = useState(partner?.featured || false);
  const [active, setActive] = useState(partner?.active ?? true);

  function handleSubmit(e: Event) {
    e.preventDefault();
    onSubmit({
      name,
      type,
      location,
      description,
      price,
      priceDisplay,
      websiteUrl,
      affiliateLink,
      imageFilename,
      featured,
      active,
    });
  }

  return (
    <div className={styles.modal} onClick={onClose}>
      <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
        <h3 className={styles.modalTitle}>
          {partner ? 'Edit Partner' : 'Add Partner'}
        </h3>
        <form onSubmit={handleSubmit}>
          <div className={styles.formGroup}>
            <label>Business Name *</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName((e.target as HTMLInputElement).value)}
              required
            />
          </div>

          <div className={styles.formGroup}>
            <label>Type *</label>
            <select
              value={type}
              onChange={(e) => setType((e.target as HTMLSelectElement).value as PartnerType)}
              required
            >
              {Object.entries(PARTNER_TYPE_LABELS).map(([value, label]) => (
                <option key={value} value={value}>{label}</option>
              ))}
            </select>
          </div>

          <div className={styles.formGroup}>
            <label>Location *</label>
            <select
              value={location}
              onChange={(e) => setLocation((e.target as HTMLSelectElement).value as PartnerLocation)}
              required
            >
              {Object.entries(PARTNER_LOCATION_LABELS).map(([value, label]) => (
                <option key={value} value={value}>{label}</option>
              ))}
            </select>
          </div>

          <div className={styles.formGroup}>
            <label>Description</label>
            <textarea
              rows={3}
              value={description}
              onChange={(e) => setDescription((e.target as HTMLTextAreaElement).value)}
            />
          </div>

          <div className={styles.formGroup}>
            <label>Price</label>
            <input
              type="number"
              min="0"
              step="0.01"
              value={price}
              onChange={(e) => setPrice(parseFloat((e.target as HTMLInputElement).value) || 0)}
            />
          </div>

          <div className={styles.formGroup}>
            <label>Price Display</label>
            <input
              type="text"
              placeholder="e.g., From 45"
              value={priceDisplay}
              onChange={(e) => setPriceDisplay((e.target as HTMLInputElement).value)}
            />
          </div>

          <div className={styles.formGroup}>
            <label>Website URL</label>
            <input
              type="url"
              value={websiteUrl}
              onChange={(e) => setWebsiteUrl((e.target as HTMLInputElement).value)}
            />
          </div>

          <div className={styles.formGroup}>
            <label>Affiliate Link</label>
            <input
              type="url"
              value={affiliateLink}
              onChange={(e) => setAffiliateLink((e.target as HTMLInputElement).value)}
            />
          </div>

          <div className={styles.formGroup}>
            <label>Image Filename</label>
            <input
              type="text"
              placeholder="e.g., bread-ahead.jpg"
              value={imageFilename}
              onChange={(e) => setImageFilename((e.target as HTMLInputElement).value)}
            />
            <small className={styles.hint}>Upload image to /assets/smallandmighty/ folder</small>
            {imageFilename && (
              <div
                className={styles.imagePreview}
                style={{ backgroundImage: `url('assets/smallandmighty/${imageFilename}')` }}
              />
            )}
          </div>

          <div className={styles.formGroupCheckbox}>
            <label>
              <input
                type="checkbox"
                checked={featured}
                onChange={(e) => setFeatured((e.target as HTMLInputElement).checked)}
              />
              Featured on Homepage (max 3)
            </label>
          </div>

          <div className={styles.formGroupCheckbox}>
            <label>
              <input
                type="checkbox"
                checked={active}
                onChange={(e) => setActive((e.target as HTMLInputElement).checked)}
              />
              Active
            </label>
          </div>

          <div className={styles.modalActions}>
            <button type="button" className={styles.btnSecondary} onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className={styles.btnPrimary}>
              Save Partner
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
