export const movableComponentsToolbarActions = [
  {
    attributes: { class: 'fa fa-arrow-up' },
    command: 'tlb-move-component-up',
  },
  {
    attributes: { class: 'fa fa-arrow-down' },
    command: 'tlb-move-component-down',
  },
];

export const copyableComponentsToolbarActions = [
  {
    attributes: { class: 'fa fa-clone' },
    command: 'tlb-clone',
  },
];

export const removableComponentsTooolbarActions = [
  {
    attributes: { class: 'fa fa-trash-o' },
    command: 'tlb-delete',
  },
];

// NOTE: Need to selective add the things above
// depending on component flags
export default [
  ...movableComponentsToolbarActions,
  ...copyableComponentsToolbarActions,
  ...removableComponentsTooolbarActions,
];
