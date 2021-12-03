import traitTypes from '../strings/traitTypes';
import { generateTraitsLayout } from 'utils/pageEditor';

export default (editor) => {
  // NOTE : Flex Container Trait
  // On Flex Direction Columns, this will work to control vertical align
  editor.TraitManager.addType(traitTypes.FLEX.CONTAINER_JUSTIFY_CONTENT, {
    noLabel: true,
    templateInput({ trait }) {
      return generateTraitsLayout(trait.get('label') || 'Vertical Align');
    },
    createInput({ trait }) {
      const el = document.createElement('div');
      el.classList.add(['radio-btn-container']);

      const adjustFlexVerticalAlign = (value) => {
        const selected = editor.getSelected();

        if (selected) {
          selected.setStyle({
            ...selected.getStyle(),
            'justify-content': value,
          });
        }
      };

      [
        {
          labelText: 'Top',
          value: 'flex-start',
        },
        {
          labelText: 'Center',
          value: 'center',
        },
        {
          labelText: 'Bottom',
          value: 'flex-end',
        },
      ].map((btnData) => {
        const btn = document.createElement('button');
        btn.classList.add('radio-btn-item');
        btn.innerText = btnData.labelText;
        btn.addEventListener('click', () => adjustFlexVerticalAlign(btnData.value));

        el.appendChild(btn);
      });

      return el;
    },
  });

  // Vertical align control for flex-column;
  editor.TraitManager.addType(traitTypes.FLEX.CONTAINER_ALIGN_ITEMS, {
    noLabel: true,
    templateInput({ trait }) {
      return generateTraitsLayout(trait.get('label') || 'Vertical Align');
    },
    createInput({ trait }) {
      const el = document.createElement('div');
      el.classList.add(['radio-btn-container']);

      const adjustFlexVerticalAlign = (value) => {
        const selected = editor.getSelected();

        if (selected) {
          selected.setStyle({
            ...selected.getStyle(),
            'align-items': value,
          });
        }
      };

      [
        {
          labelText: 'Top',
          value: 'flex-start',
        },
        {
          labelText: 'Center',
          value: 'center',
        },
        {
          labelText: 'Bottom',
          value: 'flex-end',
        },
      ].map((btnData) => {
        const btn = document.createElement('button');
        btn.classList.add('radio-btn-item');
        btn.innerText = btnData.labelText;
        btn.addEventListener('click', () => adjustFlexVerticalAlign(btnData.value));

        el.appendChild(btn);
      });

      return el;
    },
  });

  // Alignment for Flex Items
  editor.TraitManager.addType(traitTypes.FLEX.ITEMS_ALIGN_SELF, {
    noLabel: true,
    templateInput: generateTraitsLayout('Position'),
    createInput({ trait }) {
      // Here we can decide to use properties from the trait
      const options = [
        { id: 'flex-start', name: 'Left', class: 'fa fa-align-left' },
        { id: 'center', name: 'Centered', class: 'fa fa-align-center' },
        { id: 'flex-end', name: 'Right', class: 'fa fa-align-right' },
      ];

      // Create a new element container and add some content
      const el = document.createElement('div');
      // el.classList.add(['trait-radio-button-container']);
      // el.innerHTML = `
      //   ${options.map((opt) => `
      //     <input type="radio" class="trait-radio-button ${opt.class}" name="${opt.name}" value="${opt.value}" />
      //   `)}
      // `;
      el.innerHTML = `
        <select class="input-select" id="flex-item-layout-select">
          ${options.map((opt) => `<option value="${opt.id}">${opt.name}</option>`).join('')}
        </select>
      `;

      return el;
    },
    onEvent({ elInput, component, event }) {
      const inputType = elInput.querySelector('#flex-item-layout-select');
      const alignValue = inputType.value;

      component.setStyle({
        ...component.getStyle(),
        'align-self': alignValue,
      });
    },
    onUpdate({ elInput, component }) {
      const layout = component.getStyle()['align-self'] || 'flex-start';
      const inputType = elInput.querySelector('#flex-item-layout-select');
      inputType.value = layout;

      inputType.dispatchEvent(new CustomEvent('change'));
    },
  });
};
