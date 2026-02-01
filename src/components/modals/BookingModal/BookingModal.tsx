import { Modal } from '@/components/common/Modal';
import { Button } from '@/components/common/Button';
import { isBookingModalOpen, selectedVenue } from '@/signals/uiSignals';
import styles from './BookingModal.module.css';

export function BookingModal() {
  const isOpen = isBookingModalOpen.value;
  const venue = selectedVenue.value;

  const handleClose = () => {
    isBookingModalOpen.value = false;
  };

  if (!venue) return null;

  const handleContinue = () => {
    if (venue.affiliateLink) {
      window.open(venue.affiliateLink, '_blank', 'noopener,noreferrer');
    }
    handleClose();
  };

  const hasAffiliateLink = !!venue.affiliateLink;

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="Book Activity" size="sm">
      <div className={styles.content}>
        <div className={styles.venueInfo}>
          <h3 className={styles.venueName}>{venue.name}</h3>
          <div className={styles.details}>
            <span className={styles.price}>{venue.priceDisplay}</span>
            <span className={styles.location}>
              {venue.location.charAt(0).toUpperCase() + venue.location.slice(1)} London
            </span>
          </div>
        </div>

        {hasAffiliateLink ? (
          <>
            <p className={styles.notice}>
              You will be redirected to an external website to complete your booking.
            </p>
            <div className={styles.buttons}>
              <Button variant="secondary" onClick={handleClose}>
                Cancel
              </Button>
              <Button onClick={handleContinue}>
                Continue to Booking
              </Button>
            </div>
          </>
        ) : (
          <>
            <p className={styles.notice}>
              Online booking is not available for this venue. Please visit their website or contact them directly.
            </p>
            <div className={styles.buttons}>
              <Button onClick={handleClose}>
                Close
              </Button>
            </div>
          </>
        )}
      </div>
    </Modal>
  );
}
