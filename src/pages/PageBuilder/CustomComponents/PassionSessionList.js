import layouts from 'components/PageEditorPassionComponents/layouts';
import PassionSessionList, { componentStyles } from 'components/PageEditorPassionComponents/SessionList';

export default (editor) => {
  console.log(componentStyles);

  editor.Components.addType('PassionSessionList', {
    extend: 'react-component',
    model: {
      defaults: {
        component: PassionSessionList,
        stylable: true,
        resizable: true,
        editable: true,
        draggable: true,
        droppable: true,
        attributes: {
          layout: layouts.GRID,
          padding: 20,
        },
        traits: [
          {
            type: 'number',
            label: 'Padding',
            name: 'padding',
          },
        ],
      },
    },
    isComponent: (el) => el.tagName === 'PASSIONSESSIONLIST',
  });

  // editor.BlockManager.add('passion-session-list', {
  //   label: "<div class='gjs-fonts gjs-f-b1'>Listing</div>",
  //   category: 'React Components',
  //   content: '<Listing>Foo</Listing>'
  // });
};
