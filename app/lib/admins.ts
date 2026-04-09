export const ADMINS = ['+79999999999']; // твой номер

export function isAdmin(phone?: string | null): boolean {
  if (!phone) return false;
  return ADMINS.includes(phone);
}