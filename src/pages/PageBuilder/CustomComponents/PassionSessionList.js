import layouts from 'components/PageEditorPassionComponents/layouts';
import PassionSessionList from 'components/PageEditorPassionComponents/SessionList';

export default (editor) => {
  editor.Components.addType('PassionSessionList', {
    extend: 'react-component',
    model: {
      defaults: {
        component: PassionSessionList,
        stylable: false,
        resizable: false,
        editable: false,
        droppable: false,
        draggable: true,
        removable: true,
        badgeable: true,
        highlightable: true,
        hoverable: true,
        copyable: true,
        attributes: {
          layout: layouts.GRID,
          // padding: 20,
        },
        traits: [
          {
            type: 'select',
            name: 'layout',
            options: Object.entries(layouts).map(([key, val]) => ({
              id: val,
              name: key,
            })),
          },
        ],
        // traits: [
        //   {
        //     type: 'number',
        //     label: 'Padding',
        //     name: 'padding',
        //   },
        // ],
      },
    },
    isComponent: (el) => el.tagName === 'PASSIONSESSIONLIST',
  });
};