/**
 * Keeps the screen on while a piece is open: a slow practice loop must not let the phone dim or
 * lock. Uses the Screen Wake Lock API where it exists (Chrome, Safari 16.4+); the browser
 * releases the lock when the page is hidden, so it is requested again when the page comes back.
 */
export class ScreenWakeLock {
  #wanted = false;
  #lock: WakeLockSentinel | undefined;

  constructor() {
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'visible') void this.#acquire();
    });
  }

  /** Whether the screen should stay on. */
  keepAwake(wanted: boolean): void {
    this.#wanted = wanted;
    if (wanted) void this.#acquire();
    else void this.#release();
  }

  async #acquire(): Promise<void> {
    if (!this.#wanted || (this.#lock && !this.#lock.released) || !('wakeLock' in navigator)) return;
    try {
      this.#lock = await navigator.wakeLock.request('screen');
    } catch {
      // Refused (no user action yet, battery saver, permissions policy): the screen may dim.
      // Requested again on the next play or when the page becomes visible.
    }
  }

  async #release(): Promise<void> {
    const lock = this.#lock;
    this.#lock = undefined;
    await lock?.release();
  }
}
