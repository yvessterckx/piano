import { CacheStorage, SampleLoader, SplendidGrandPiano } from 'smplr';
import type { Smplr } from 'smplr';
import type { Hand } from '../timeline/types';
import type { NotePlayer, ScheduledNote } from './Transport';

/** Every note is played with the same velocity; the piano's sample layers for it are loaded. */
const VELOCITY = 90;

/** smplr volume (0 to 127) for a hand at full level. */
const FULL_VOLUME = 100;

export interface LoadProgress {
  readonly loaded: number;
  readonly total: number;
}

/** One sample loader per audio context: both hands and every loaded piece share its buffers. */
const loaders = new WeakMap<BaseAudioContext, SampleLoader>();

function loaderFor(context: AudioContext): SampleLoader {
  let loader = loaders.get(context);
  if (!loader) {
    // The Cache API keeps the samples between visits; it only exists in a secure context.
    const storage =
      'caches' in globalThis && globalThis.isSecureContext ? CacheStorage() : undefined;
    loader = SampleLoader(context, storage ? { storage } : {});
    loaders.set(context, loader);
  }
  return loader;
}

/**
 * The piano sound: smplr's SplendidGrandPiano, one instance per hand so each hand has its own
 * volume. Samples come from smplr's hosted set (smpldsnds.github.io) and only for the notes of
 * the piece.
 */
export class PianoSound implements NotePlayer {
  readonly #instruments: Record<Hand, Smplr>;

  private constructor(instruments: Record<Hand, Smplr>) {
    this.#instruments = instruments;
  }

  /** Loads the samples for the given notes (MIDI numbers). Rejects if they cannot be loaded. */
  static async load(
    context: AudioContext,
    notes: readonly number[],
    onProgress?: (progress: LoadProgress) => void,
  ): Promise<PianoSound> {
    const loader = loaderFor(context);
    const options = {
      loader,
      velocity: VELOCITY,
      volume: FULL_VOLUME,
      notesToLoad: { notes: [...notes], velocityRange: [VELOCITY, VELOCITY] as [number, number] },
    };
    const right = SplendidGrandPiano(context, {
      ...options,
      onLoadProgress: (progress) => onProgress?.(progress),
    });
    const left = SplendidGrandPiano(context, options);
    await Promise.all([right.ready, left.ready]);
    return new PianoSound({ left, right });
  }

  play(note: ScheduledNote): void {
    this.#instruments[note.hand].start({
      note: note.midi,
      time: note.time,
      duration: note.duration,
    });
  }

  stopAll(): void {
    this.#instruments.left.stop();
    this.#instruments.right.stop();
  }

  /** Volume of a hand, from 0 (silent) to 1 (full). */
  setHandLevel(hand: Hand, level: number): void {
    this.#instruments[hand].output.volume = Math.round(
      Math.min(Math.max(level, 0), 1) * FULL_VOLUME,
    );
  }

  dispose(): void {
    this.#instruments.left.dispose();
    this.#instruments.right.dispose();
  }
}
