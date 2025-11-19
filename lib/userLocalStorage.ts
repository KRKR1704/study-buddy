// Helper to namespace certain localStorage keys by the currently logged-in user.
export function currentUserId(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("sb_user_id") || null;
}

export function namespacedKey(key: string, userId?: string) {
  const uid = userId || currentUserId();
  return uid ? `${key}:${uid}` : key;
}

export function getItem(key: string, userId?: string): string | null {
  try {
    return localStorage.getItem(namespacedKey(key, userId));
  } catch (e) {
    return null;
  }
}

export function setItem(key: string, value: string, userId?: string) {
  try {
    localStorage.setItem(namespacedKey(key, userId), value);
  } catch (e) {
    // ignore
  }
}

export function removeItem(key: string, userId?: string) {
  try {
    localStorage.removeItem(namespacedKey(key, userId));
  } catch (e) {
    // ignore
  }
}

export function clearAllForUser(userId?: string, keys?: string[]) {
  const uid = userId || currentUserId();
  if (!uid) return;
  const ks = keys || ["sb_summary", "sb_keypoints", "sb_flashcards", "sb_quiz", "sb_title"];
  ks.forEach((k) => removeItem(k, uid));
}
