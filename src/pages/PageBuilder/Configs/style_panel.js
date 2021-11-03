// Example Doc : https://grapesjs.com/docs/modules/Style-manager.html#built-in-properties
export default [
  {
    name: 'Dimensions',
    buildProps: ['width', 'height'],
  },
  {
    name: 'Spacing',
    buildProps: ['padding', 'margin'],
  },
  {
    name: 'Alignment',
    // Use Flex here
    buildProps: ['display', 'float'],
  },
  {
    name: 'Typography',
    buildProps: ['color', 'font-size', 'font-weight', 'text-align'],
  },
];
