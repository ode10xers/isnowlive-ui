import layouts from 'components/PageEditorPassionComponents/layouts';
import PassionVideoList from 'components/PageEditorPassionComponents/VideoList';

export default (editor) => {
  editor.Components.addType('PassionVideoList', {
    extend: 'react-component',
    model: {
      defaults: {
        component: PassionVideoList,
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
      },
    },
    isComponent: (el) => el.tagName === 'PASSIONVIDEOLIST',
  });
};
