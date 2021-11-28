// NOTE: Needs a 'font-family' and 'text-color' prop
export const genericFontTraits = [
  {
    type: 'font-selector',
    name: 'font-family',
    changeProp: true,
  },
  {
    type: 'custom-color-picker',
    label: 'Text Color',
    name: 'text-color',
    changeProp: true,
  },
];

export const contextualFontTraits = [
  ...genericFontTraits,
  {
    type: 'font-size',
  },
];

export const spacingTraits = [
  {
    type: 'padding-slider',
    min: 0,
    max: 100,
  },
  {
    type: 'margin-slider',
    min: 0,
    max: 100,
  },
];

//NOTE: Needs a 'bg-color' prop
export const backgroundTraits = [
  {
    type: 'background-image-picker',
  },
  {
    type: 'custom-color-picker',
    label: 'Background color',
    name: 'bg-color',
    changeProp: true,
  },
];

export const innerButtonTraits = [
  {
    type: 'button-link',
  },
  {
    type: 'button-target',
  },
  {
    type: 'button-content',
  },
];

// NOTE: need all of the names listed below as props
export const socialLinksTraits = [
  {
    type: 'text',
    name: 'facebook-link',
    label: 'Facebook',
    placeholder: 'Your Facebook link',
    changeProp: true,
  },
  {
    type: 'text',
    name: 'instagram-link',
    label: 'Instagram',
    placeholder: 'Your Instagram link',
    changeProp: true,
  },
  {
    type: 'text',
    name: 'linkedin-link',
    label: 'LinkedIn',
    placeholder: 'Your LinkedIn Link',
    changeProp: true,
  },
  {
    type: 'text',
    name: 'twitter-link',
    label: 'Twitter',
    placeholder: 'Your Twitter Link',
    changeProp: true,
  },
  {
    type: 'text',
    name: 'website-link',
    label: 'Website',
    placeholder: 'Your website Link',
    changeProp: true,
  },
];
