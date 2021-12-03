import { generateTraitsLayout } from 'utils/pageEditor';
import traitTypes from '../strings/traitTypes';

export default (editor) => {
  // Layout Traits
  editor.TraitManager.addType(traitTypes.LAYOUTS.TEXT_SECTION_LAYOUT, {
    // Expects as return a simple HTML string or an HTML element
    noLabel: true,
    templateInput: generateTraitsLayout('Text layout'),
    createInput({ trait }) {
      // Here we can decide to use properties from the trait
      const options = [
        { id: 'left', name: 'Left', class: 'fa fa-align-left' },
        { id: 'center', name: 'Centered', class: 'fa fa-align-center' },
        { id: 'right', name: 'Right', class: 'fa fa-align-right' },
      ];

      // Create a new element container and add some content
      const el = document.createElement('div');
      el.innerHTML = `
          <select class="input-select" id="text-section-layout-select">
            ${options.map((opt) => `<option value="${opt.id}">${opt.name}</option>`).join('')}
          </select>
        `;

      return el;
    },
    // Update the component based on element changes
    // elInput` is the result HTMLElement you get from `createInput`
    onEvent({ elInput, component, event }) {
      const inputType = elInput.querySelector('#text-section-layout-select');
      const alignValue = inputType.value;

      const textSection = component.find('.text-section-container') ?? [];

      if (textSection.length > 0) {
        textSection.forEach((comp) => {
          comp.setStyle({
            ...comp.getStyle(),
            'text-align': alignValue ?? 'left',
            'align-items':
              alignValue === 'center'
                ? alignValue
                : alignValue === 'left'
                ? 'flex-start'
                : alignValue === 'right'
                ? 'flex-end'
                : 'flex-start',
          });
        });
      } else {
        component.setStyle({
          ...component.getStyle(),
          'text-align': alignValue ?? 'left',
          'align-items':
            alignValue === 'center'
              ? alignValue
              : alignValue === 'left'
              ? 'flex-start'
              : alignValue === 'right'
              ? 'flex-end'
              : 'flex-start',
        });
      }

      component.addAttributes({
        layout: inputType.value,
      });
    },
    // Update elements on the component change
    onUpdate({ elInput, component }) {
      const layout = component.getAttributes()['layout'] || 'center';
      const inputType = elInput.querySelector('#text-section-layout-select');
      inputType.value = layout;

      inputType.dispatchEvent(new CustomEvent('change'));
    },
  });

  editor.TraitManager.addType(traitTypes.LAYOUTS.IMAGE_POSITION_LAYOUT, {
    // Expects as return a simple HTML string or an HTML element
    noLabel: true,
    templateInput: generateTraitsLayout('Image Layout'),
    createInput({ trait }) {
      // Here we can decide to use properties from the trait
      const options = [
        { id: 'left', name: 'Left', class: 'fa fa-align-left' },
        { id: 'top', name: 'Top', class: 'fa fa-align-center' },
        { id: 'right', name: 'Right', class: 'fa fa-align-right' },
        { id: 'bottom', name: 'Bottom', class: 'fa fa-align-center' },
      ];

      // Create a new element container and add some content
      const el = document.createElement('div');
      el.innerHTML = `
          <select class="input-select" id="image-position-select">
            ${options.map((opt) => `<option value="${opt.id}">${opt.name}</option>`).join('')}
          </select>
        `;

      return el;
    },
    // Update the component based on element changes
    // `elInput` is the result HTMLElement you get from `createInput`
    onEvent({ elInput, component, event }) {
      const inputType = elInput.querySelector('#image-position-select');
      const targetComponent =
        component.find('.text-image-section-container')[0] ??
        component.findType('simple-text-image-section')[0] ??
        component;

      let classes = [];
      let existingClasses = targetComponent.getClasses();

      if (inputType.value) {
        classes.push(`image-${inputType.value}`);
        existingClasses = existingClasses.filter(
          (cls) => !['image-left', 'image-top', 'image-right', 'image-bottom'].includes(cls)
        );
      }

      targetComponent.setClass([...new Set([...existingClasses, ...classes])]);
    },
    // Update elements on the component change
    onUpdate({ elInput, component }) {
      // This is getting the trait value from the set classes
      const targetComponent =
        component.find('.text-image-section-container')[0] ??
        component.findType('simple-text-image-section')[0] ??
        component;

      const layout =
        targetComponent
          .getClasses()
          .find((cls) => cls.startsWith('image-'))
          ?.split('-')[1] ?? 'right';
      const inputType = elInput.querySelector('#image-position-select');
      inputType.value = layout;

      inputType.dispatchEvent(new CustomEvent('change'));
    },
  });
};
