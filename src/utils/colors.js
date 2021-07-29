export const convertHSLToHex = (hslString) => {
  const regexString = /hsl\(\s*(\d+)\s*,\s*(\d+(?:\.\d+)?%)\s*,\s*(\d+(?:\.\d+)?%)\)/g;

  let [h, s, l] = regexString.exec(hslString).slice(1);

  h = parseInt(h);
  s = parseInt(s.replace('%', ''));
  l = parseInt(l.replace('%', ''));

  l /= 100;

  const a = (s * Math.min(l, 1 - l)) / 100;

  const f = (n) => {
    const k = (n + h / 30) % 12;
    const color = l - a * Math.max(Math.min(k - 3, 9 - k, 1), -1);
    return Math.round(255 * color)
      .toString(16)
      .padStart(2, '0'); // convert to Hex and prefix "0" if needed
  };

  return `#${f(0)}${f(8)}${f(4)}`;
};

export const convertHexToHSL = (hexColor) => {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hexColor);

  let r = parseInt(result[1], 16);
  let g = parseInt(result[2], 16);
  let b = parseInt(result[3], 16);

  r /= 255;
  g /= 255;
  b /= 255;
  const max = Math.max(r, g, b),
    min = Math.min(r, g, b);
  let h,
    s,
    l = (max + min) / 2;

  if (max === min) {
    h = s = 0; // achromatic
  } else {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r:
        h = (g - b) / d + (g < b ? 6 : 0);
        break;
      case g:
        h = (b - r) / d + 2;
        break;
      case b:
        h = (r - g) / d + 4;
        break;
      default:
        h = 0;
        break;
    }
    h /= 6;
  }

  s = s * 100;
  s = Math.round(s);
  l = l * 100;
  l = Math.round(l);
  h = Math.round(360 * h);

  return [h, s, l];
};

export const formatHSLStyleString = (h, s, l) => `hsl(${h}, ${s}%, ${l}%)`;

export const generateColorPalletteForProfile = (primaryColor) => {
  const [h, s, l] = convertHexToHSL(primaryColor);

  // NOTE: We're using HSL here for easier programmatic control
  return {
    '--passion-profile-lightest-color': formatHSLStyleString(h, s, l + 44),
    '--passion-profile-lighter-color': formatHSLStyleString(h, s, l + 36),
    '--passion-profile-light-color': formatHSLStyleString(h, s, l + 32),
    '--passion-profile-primary-color': formatHSLStyleString(h, s, l),
    '--passion-profile-dark-color': formatHSLStyleString(h, s, l - 21),
    '--passion-profile-darker-color': formatHSLStyleString(h, s, l - 28),
  };
};
