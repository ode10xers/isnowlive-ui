import { clamp } from 'utils/math';
import { isInIframeWidget, isWidgetUrl } from './widgets';

export const tagColors = ['magenta', 'red', 'volcano', 'orange', 'gold', 'green', 'cyan', 'blue', 'geekblue', 'purple'];

export const parseReactColorObject = (colorData, syntax = 'rgba') => {
  switch (syntax) {
    case 'rgba':
      const { r = 255, g = 255, b = 255, a = 1 } = colorData.rgb;
      return `rgba(${r}, ${g}, ${b}, ${a})`;
    default:
      return 'transparent';
  }
};

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

export const formatHSLStyleString = (h, s, l) => `hsl(${clamp(0, h, 360)}, ${clamp(0, s, 100)}%, ${clamp(0, l, 100)}%)`;

export const generateColorPalletteForProfile = (primaryColor = '#1890ff', shouldColorNavbar = false) => {
  // NOTE: In our CSS Styling, the profile variable is in priority
  // However, we add an override here in case the site is shown in iframe widget
  // We don't load the colors so the plugin styling can be applied
  if (isWidgetUrl() || isInIframeWidget()) {
    return {};
  }

  const [h, s, l] = convertHexToHSL(primaryColor);

  const profileColors = {
    '--passion-profile-lightest-color': formatHSLStyleString(h, s, l + 44),
    '--passion-profile-lighter-color': formatHSLStyleString(h, s, l + 36),
    '--passion-profile-light-color': formatHSLStyleString(h, s, l + 32),
    '--passion-profile-primary-color': formatHSLStyleString(h, s, l),
    '--passion-profile-dark-color': formatHSLStyleString(h, s, l - 21),
    '--passion-profile-darker-color': formatHSLStyleString(h, s, l - 28),
  };

  const navbarColors = {
    '--passion-profile-backdrop-color': profileColors['--passion-profile-lightest-color'],
    '--passion-profile-navbar-bg': profileColors['--passion-profile-lightest-color'],
    '--passion-profile-navbar-logo': profileColors['--passion-profile-primary-color'],
    '--passion-profile-navbar-text': profileColors['--passion-profile-dark-color'],
  };

  // NOTE: We're using HSL here for easier programmatic control
  return shouldColorNavbar ? { ...profileColors, ...navbarColors } : profileColors;
};

export const getNewProfileUIMaxWidth = () => {
  return {
    '--passion-profile-max-width': '992px',
  };
};

// TODO: Currently it's only for hex colors, adjust when implementing other styling (fonts, etc)
export const generateWidgetCSSVarsFromJSON = (objData) => {
  const stylesData = Object.entries(objData).filter(([key, val]) => val);

  return '* { ' + stylesData.map(([key, val]) => `${key} : #${val}`).join('; ') + '}';
};

export const generateRandomColor = () => `#${Math.floor(Math.random() * 16777215).toString(16)}`;

export const convertHexToRGB = (hexColor) => {
  const color = +('0x' + hexColor.slice(1).replace(hexColor.length < 5 && /./g, '$&$&'));

  const r = color >> 16;
  const g = (color >> 8) & 255;
  const b = color & 255;

  return [r, g, b];
};

// NOTE: make sure the scale and value is inversely proportional
// e.g. if we want big scale numbers, value should be small
export const getShadeForHexColor = (hexColor, scale = 1, value = 44, darker = true) => {
  const rgbColor = convertHexToRGB(hexColor);

  const scaleMultiplier = darker ? -1 : 1;

  const colorShade = rgbColor.map((color) => Math.min(Math.max(color + scaleMultiplier * scale * value, 0), 255));
  return `#${colorShade.map((color) => color.toString(16).padStart(2, '0')).join('')}`;
};

export const isBrightColorShade = ([r, g, b]) => {
  // HSP (Highly Sensitive Poo) equation from http://alienryderflex.com/hsp.html
  const hsp = Math.sqrt(0.299 * (r * r) + 0.587 * (g * g) + 0.114 * (b * b));

  // Using the HSP value, determine whether the color is light or dark
  // return hsp > 127.5;
  return hsp > 180.5;
};

export const getRandomTagColor = () => tagColors[Math.floor(Math.random() * tagColors.length)];

/// src: https://stackoverflow.com/questions/48484767/javascript-check-if-string-is-valid-css-color
export const isValidCSSStyle = (cssProps, value) => CSS.supports(cssProps, value);

// NOTE: Doesn't include strings like 'red', 'magenta', etc
// Does support 6-digit hex, rgba, and hsla
export const isValidCSSColor = (colorString) =>
  /^#[0-9A-F]{6}$/i.test(colorString) ||
  /^(rgb|hsl)(a?)[(]\s*([\d.]+\s*%?)\s*,\s*([\d.]+\s*%?)\s*,\s*([\d.]+\s*%?)\s*(?:,\s*([\d.]+)\s*)?[)]$/i.test(
    colorString
  );
