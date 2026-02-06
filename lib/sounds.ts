const DICE_ROLL_SOUND_URL =
  "https://pub-0b8bdb0f1981442e9118b343565c1579.r2.dev/sounds/rolled_dice.wav";

export function playDiceRollSound(): void {
  try {
    const audio = new Audio(DICE_ROLL_SOUND_URL);
    void audio.play();
  } catch {
    // SSR or autoplay blocked - fail silently
  }
}
