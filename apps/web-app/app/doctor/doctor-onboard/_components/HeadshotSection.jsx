// Section 3 — profile headshot upload with preview. The hidden file input
// is paired with a label-as-button so we get a native file picker without
// the ugly default styling.

import styles from "../doctor-onboard.module.css";
import { DOCTOR_IMAGE_ACCEPT } from "../_lib/imageUpload";
import Section from "./Section";

export default function HeadshotSection({
  values,
  photoFile,
  photoPreviewUrl,
  fileInputRef,
  onPickPhoto,
  clearPhoto,
}) {
  const initial = (values.firstName?.[0] || "D").toUpperCase();

  return (
    <Section
      number="3"
      title="Profile photo"
      description="Patients see this when choosing their clinician. JPG, PNG, or iPhone HEIC, up to 6 MB."
    >
      <div className={styles.photoRow}>
        <div className={styles.photoPreview}>
          {photoPreviewUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={photoPreviewUrl} alt="Headshot preview" />
          ) : (
            <span>{initial}</span>
          )}
        </div>
        <div className={styles.photoActions}>
          <input
            ref={fileInputRef}
            type="file"
            accept={DOCTOR_IMAGE_ACCEPT}
            onChange={onPickPhoto}
            style={{ display: "none" }}
            id="doctor-headshot"
          />
          <label htmlFor="doctor-headshot" className={styles.photoBtn}>
            {photoFile ? "Choose a different photo" : "Choose headshot"}
          </label>
          {photoFile && (
            <button
              type="button"
              className={styles.photoRemove}
              onClick={clearPhoto}
            >
              Remove
            </button>
          )}
          <span className={styles.photoHint}>
            Square crops look best · 600×600+ recommended
          </span>
        </div>
      </div>
    </Section>
  );
}
