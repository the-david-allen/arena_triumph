const DICE_ROLL_SOUND_URL =
  "https://pub-0b8bdb0f1981442e9118b343565c1579.r2.dev/sounds/rolled_dice.wav";

const CHEST_BACKGROUND_URL =
  "https://pub-0b8bdb0f1981442e9118b343565c1579.r2.dev/sounds/chest_background.mp3";

/** Volume (0–1) for all game background music. Use this when adding background music to any game. */
export const BACKGROUND_MUSIC_VOLUME = 0.6;

let chestBackgroundAudio: HTMLAudioElement | null = null;

export function playDiceRollSound(): void {
  try {
    const audio = new Audio(DICE_ROLL_SOUND_URL);
    void audio.play();
  } catch {
    // SSR or autoplay blocked - fail silently
  }
}

export function playChestBackgroundMusic(): void {
  try {
    stopChestBackgroundMusic();
    const audio = new Audio(CHEST_BACKGROUND_URL);
    audio.volume = BACKGROUND_MUSIC_VOLUME;
    audio.loop = true;
    chestBackgroundAudio = audio;
    void audio.play();
  } catch {
    // SSR or autoplay blocked - fail silently
  }
}

export function stopChestBackgroundMusic(): void {
  try {
    if (chestBackgroundAudio) {
      chestBackgroundAudio.pause();
      chestBackgroundAudio.currentTime = 0;
      chestBackgroundAudio = null;
    }
  } catch {
    // ignore
  }
}
