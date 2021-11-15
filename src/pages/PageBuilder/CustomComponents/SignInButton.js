import SignInButton from 'components/PageEditorPassionComponents/SignInButton';

export default (editor) => {
  editor.Components.addType('SignInButton', {
    extend: 'react-component',
    model: {
      defaults: {
        component: SignInButton,
        stylable: false,
        resizable: false,
        editable: false,
        droppable: false,
        draggable: false,
        removable: false,
        highlightable: false,
        hoverable: false,
        copyable: false,
        attributes: {
          target: 'dashboard',
          buttonType: 'primary',
        },
        traits: [
          {
            type: 'select',
            label: 'After Login',
            name: 'target',
            options: [
              { id: 'dashboard', name: 'Go to Dashboard' },
              { id: 'current', name: 'Stay in page' },
            ],
          },
          {
            type: 'select',
            label: 'Button Type',
            name: 'buttonType',
            options: [
              { id: 'primary', name: 'Filled' },
              { id: 'outlined', name: 'Outlined' },
              { id: 'link', name: 'Link Text' },
            ],
          },
        ],
      },
    },
    isComponent: (el) => el.tagName === 'SIGNINBUTTON',
  });
};
