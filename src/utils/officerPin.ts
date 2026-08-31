export const STORAGE_KEY_OFFICER_PIN = 'goa_officer_security_pin';
export const DEFAULT_OFFICER_PIN = '1234';

export function getStoredOfficerPin(): string {
  try {
    const saved = localStorage.getItem(STORAGE_KEY_OFFICER_PIN);
    if (saved && /^\d{4}$/.test(saved)) {
      return saved;
    }
  } catch (e) {
    console.error('Error reading officer PIN from storage', e);
  }
  return DEFAULT_OFFICER_PIN;
}

export function setStoredOfficerPin(newPin: string): boolean {
  try {
    if (/^\d{4}$/.test(newPin)) {
      localStorage.setItem(STORAGE_KEY_OFFICER_PIN, newPin);
      return true;
    }
  } catch (e) {
    console.error('Error writing officer PIN to storage', e);
  }
  return false;
}

export function resetStoredOfficerPin(): boolean {
  try {
    localStorage.removeItem(STORAGE_KEY_OFFICER_PIN);
    return true;
  } catch (e) {
    console.error('Error resetting officer PIN', e);
  }
  return false;
}
