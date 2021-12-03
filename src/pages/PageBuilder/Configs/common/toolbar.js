import customCommands from '../strings/customCommands';

export const movableComponentsToolbarActions = [
  {
    attributes: { class: 'fa fa-arrow-up' },
    command: customCommands.COMPONENT.MOVE_UP,
  },
  {
    attributes: { class: 'fa fa-arrow-down' },
    command: customCommands.COMPONENT.MOVE_DOWN,
  },
];

export const copyableComponentsToolbarActions = [
  {
    attributes: { class: 'fa fa-clone' },
    command: customCommands.COMPONENT.DUPLICATE,
  },
];

export const removableComponentsTooolbarActions = [
  {
    attributes: { class: 'fa fa-trash-o' },
    command: customCommands.COMPONENT.REMOVE,
  },
];

// NOTE: Need to selective add the things above
// depending on component flags
export default [
  ...movableComponentsToolbarActions,
  ...copyableComponentsToolbarActions,
  ...removableComponentsTooolbarActions,
];
