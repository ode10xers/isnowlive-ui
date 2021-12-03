import { googleFonts } from 'utils/constants.js';
import { generateTraitsLayout } from 'utils/pageEditor';
import traitTypes from '../strings/traitTypes';

export default (editor) => {
  // NOTE : Font Traits
  editor.TraitManager.addType(traitTypes.FONT.FONT_FAMILY_SELECTOR, {
    noLabel: true,
    templateInput: generateTraitsLayout('Text Font'),
    createInput({ trait }) {
      // Here we can decide to use properties from the trait
      const options = Object.values(googleFonts).map((font) => ({
        id: font,
        name: font,
      }));

      // Create a new element container and add some content
      const el = document.createElement('div');
      el.innerHTML = `
          <select placeholder="Default" class="input-select" id="font-select">
            ${options
              .map(
                (opt) =>
                  `<option style="font-family: ${opt.id.includes(' ') ? `'${opt.id}'` : opt.id};" value="${opt.id}">${
                    opt.name
                  }</option>`
              )
              .join('')}
          </select>
        `;

      return el;
    },
    // Update the component based on element changes
    // `elInput` is the result HTMLElement you get from `createInput`
    onEvent({ elInput, component, event }) {
      const inputType = elInput.querySelector('#font-select');
      component.updateTrait('font-family', {
        type: 'text',
        value: inputType.value,
        changeProp: 1,
      });
    },
    // Update elements on the component change
    onUpdate({ elInput, component }) {
      // This is getting the trait value from the set classes
      const font = component.props()['font-family'] ?? component.getAttributes()['font-family'] ?? '';
      const inputType = elInput.querySelector('#font-select');
      inputType.value = font;

      inputType.dispatchEvent(new CustomEvent('change'));
    },
  });

  editor.TraitManager.addType(traitTypes.FONT.FONT_SIZE, {
    noLabel: true,
    templateInput: generateTraitsLayout('Text size'),
    createInput({ trait }) {
      const el = document.createElement('div');
      el.innerHTML = `
          <input type="number" min="0" id="font-size-input" class="input-field" placeholder="Default size" />
        `;
      return el;
    },

    onEvent({ elInput, component, event }) {
      const inputLink = elInput.querySelector('#font-size-input');

      if (inputLink.value) {
        component.setStyle({
          ...component.getStyle(),
          'font-size': `${inputLink.value}px`,
        });
      }
    },

    onUpdate({ elInput, component }) {
      // This is getting the trait value from the set classes
      const inputType = elInput.querySelector('#font-size-input');
      inputType.value = (component.getStyle()['font-size'] ?? '14px').replace('px', '');

      inputType.dispatchEvent(new CustomEvent('change'));
    },
  });
};
