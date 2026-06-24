// lib/prescriptions/bmi.js
//
// BMI helpers shared by prescription builder and patient views.

export function computeBmiFromOnboarding(onb) {
  if (!onb) return null;
  if (onb.bmiUnit === "metric") {
    const cm = parseFloat(onb.heightCm) || 0;
    const kg = parseFloat(onb.weightKg) || 0;
    if (cm <= 0 || kg <= 0) return null;
    const m = cm / 100;
    return kg / (m * m);
  }
  const feet = parseFloat(onb.heightFt) || 0;
  const inches = parseFloat(onb.heightIn) || 0;
  const pounds = parseFloat(onb.weightLbs) || 0;
  if (feet <= 0 || pounds <= 0) return null;
  const total = feet * 12 + inches;
  if (total <= 0) return null;
  return (pounds * 703) / (total * total);
}
