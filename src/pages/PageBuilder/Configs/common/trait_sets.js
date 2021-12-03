import traitTypes from '../strings/traitTypes';

// NOTE: Needs a 'font-family' and 'text-color' prop
export const genericFontTraits = [
  {
    type: traitTypes.FONT.FONT_FAMILY_SELECTOR,
    name: 'font-family',
    changeProp: true,
  },
  {
    type: traitTypes.CUSTOM_REACT_INPUTS.CUSTOM_COLOR_PICKER,
    label: 'Text Color',
    name: 'text-color',
    changeProp: true,
  },
];

export const contextualFontTraits = [
  ...genericFontTraits,
  {
    type: traitTypes.FONT.FONT_SIZE,
  },
];

export const spacingTraits = [
  {
    type: traitTypes.SPACING.PADDING_SLIDER,
    min: 0,
    max: 100,
  },
  {
    type: traitTypes.SPACING.MARGIN_SLIDER,
    min: 0,
    max: 100,
  },
];

//NOTE: Needs a 'bg-color' prop
export const backgroundTraits = [
  {
    type: traitTypes.IMAGE.BG_IMAGE_PICKER,
  },
  {
    type: traitTypes.CUSTOM_REACT_INPUTS.CUSTOM_COLOR_PICKER,
    label: 'Background color',
    name: 'bg-color',
    changeProp: true,
  },
];

export const innerButtonTraits = [
  {
    type: traitTypes.BUTTONS.BUTTON_LINK,
  },
  {
    type: traitTypes.BUTTONS.BUTTON_TARGET,
  },
  {
    type: traitTypes.BUTTONS.BUTTON_CONTENT,
  },
];

// NOTE: need all of the names listed below as props
export const socialLinksTraits = [
  {
    name: 'facebook-link',
    label: 'Facebook',
  },
  {
    name: 'instagram-link',
    label: 'Instagram',
  },
  {
    name: 'linkedin-link',
    label: 'LinkedIn',
  },
  {
    name: 'twitter-link',
    label: 'Twitter',
  },
  {
    name: 'website-link',
    label: 'Website',
  },
].map((data) => ({
  type: 'text',
  name: data.name,
  label: data.label,
  placeholder: `Your ${data.label} link`,
  changeProp: true,
}));
