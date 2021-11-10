import layouts from 'components/PageEditorPassionComponents/layouts';
import PassionSubscriptionList from 'components/PageEditorPassionComponents/SubscriptionList';

export default (editor) => {
  editor.Components.addType('PassionSubscriptionList', {
    extend: 'react-component',
    model: {
      defaults: {
        component: PassionSubscriptionList,
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
      },
    },
    isComponent: (el) => el.tagName === 'PASSIONSUBSCRIPTIONLIST',
  });
};
