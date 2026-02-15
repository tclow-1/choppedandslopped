import Color from 'colorjs.io';

/**
 * Calculate relative luminance of a color per WCAG 2.1 specification
 * @param hexColor - Hex color string (e.g., "#4F4A85")
 * @returns Relative luminance value between 0 (darkest) and 1 (lightest)
 */
export function getRelativeLuminance(hexColor: string): number {
  const color = new Color(hexColor);
  const rgb = color.to('srgb').coords; // [R, G, B] in 0-1 range

  // Apply sRGB linearization formula per WCAG 2.1
  const linearize = (channel: number): number => {
    if (channel <= 0.03928) {
      return channel / 12.92;
    }
    return Math.pow((channel + 0.055) / 1.055, 2.4);
  };

  const [r, g, b] = rgb.map((ch) => linearize(ch ?? 0));

  // Calculate relative luminance with standard weights
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

/**
 * Calculate contrast ratio between two colors per WCAG 2.1
 * @param color1 - First hex color
 * @param color2 - Second hex color
 * @returns Contrast ratio between 1 (identical) and 21 (max contrast)
 */
export function getContrastRatio(color1: string, color2: string): number {
  const lum1 = getRelativeLuminance(color1);
  const lum2 = getRelativeLuminance(color2);

  const lighter = Math.max(lum1, lum2);
  const darker = Math.min(lum1, lum2);

  return (lighter + 0.05) / (darker + 0.05);
}

/**
 * Get accessible marker color with WCAG AA contrast against background
 * @param backgroundColor - Background hex color
 * @returns '#ffffff' (white) or '#000000' (black) - whichever has higher contrast
 */
export function getAccessibleMarkerColor(backgroundColor: string): string {
  const whiteContrast = getContrastRatio(backgroundColor, '#ffffff');
  const blackContrast = getContrastRatio(backgroundColor, '#000000');

  // Return color with higher contrast ratio
  // WCAG AA requires 3:1 for UI components - pure white or black easily exceeds this
  return whiteContrast > blackContrast ? '#ffffff' : '#000000';
}
