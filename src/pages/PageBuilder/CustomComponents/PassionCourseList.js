import layouts from 'components/PageEditorPassionComponents/layouts';
import PassionCourseList from 'components/PageEditorPassionComponents/CourseList';

export default (editor) => {
  editor.Components.addType('PassionCourseList', {
    extend: 'react-component',
    model: {
      defaults: {
        component: PassionCourseList,
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
    isComponent: (el) => el.tagName === 'PASSIONCOURSELIST',
  });
};
