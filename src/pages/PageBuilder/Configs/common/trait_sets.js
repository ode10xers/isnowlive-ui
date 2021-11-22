// NOTE: Needs a 'font-family' and 'text-color' prop
export const fontTraits = [
  {
    type: 'font-selector',
    name: 'font-family',
    changeProp: 1,
  },
  {
    type: 'color',
    label: 'Text color',
    name: 'text-color',
    changeProp: 1,
  },
];

//NOTE: Needs a 'bg-color' prop
export const backgroundTraits = [
  {
    type: 'background-image-picker',
  },
  {
    type: 'color',
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
    changeProp: true,
  },
  {
    type: 'text',
    name: 'instagram-link',
    label: 'Instagram',
    changeProp: true,
  },
  {
    type: 'text',
    name: 'linkedin-link',
    label: 'LinkedIn',
    changeProp: true,
  },
  {
    type: 'text',
    name: 'twitter-link',
    label: 'Twitter',
    changeProp: true,
  },
  {
    type: 'text',
    name: 'website-link',
    label: 'Website',
    changeProp: true,
  },
];
