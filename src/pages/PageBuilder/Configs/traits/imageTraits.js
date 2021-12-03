import { generateTraitsLayout } from 'utils/pageEditor';
import traitTypes from '../strings/traitTypes';

export default (editor) => {
  editor.TraitManager.addType(traitTypes.IMAGE.CUTOUT_SHAPE_SELECT, {
    // Expects as return a simple HTML string or an HTML element
    noLabel: true,
    templateInput: generateTraitsLayout('Image Type'),
    createInput({ trait }) {
      const container = document.createElement('div');

      // Create a new element container and add some content
      const el = document.createElement('div');
      el.classList.add(['radio-btn-container']);

      const adjustBorderRadius = (value) => {
        const selected = editor.getSelected();
        const targetComponent = selected.find('img') ?? [];

        if (targetComponent.length > 0) {
          targetComponent.forEach((comp) => {
            comp.setStyle({
              ...comp.getStyle(),
              'clip-path': value,
            });
          });
        } else {
          selected.setStyle({
            ...selected.getStyle(),
            'clip-path': value,
          });
        }
      };

      [
        {
          labelText: 'Original',
          value: 'none',
        },
        {
          labelText: 'Circle',
          value: 'circle(closest-side)',
        },
      ].map((btnData) => {
        const btn = document.createElement('button');
        btn.classList.add('radio-btn-item');
        btn.innerText = btnData.labelText;
        btn.addEventListener('click', () => adjustBorderRadius(btnData.value));

        el.appendChild(btn);
      });

      container.appendChild(el);

      // const helpText = document.createElement('div');
      // helpText.classList.add('radio-btn-helptext');
      // helpText.innerText = 'To have a perfectly circle image, the image needs to have 1:1 (square) ratio';

      // container.appendChild(helpText);
      return container;
    },
  });

  editor.TraitManager.addType(traitTypes.IMAGE.BORDER_RADIUS_SLIDER, {
    // Expects as return a simple HTML string or an HTML element
    noLabel: true,
    templateInput: generateTraitsLayout('Roundness'),
    createInput({ trait }) {
      // Create a new element container and add some content
      const minValue = trait.get('min') || 0;
      const maxValue = trait.get('max') || 100;
      const traitUnit = trait.get('unit') || 'px';
      const unitType = ['px', '%'].includes(traitUnit) ? traitUnit : 'px';
      this.unit = unitType;
      const el = document.createElement('div');
      el.innerHTML = `
        <div class="input-slider-container">
          <span class="input-slider-text">${minValue}${unitType}</span>
          <input type="range" min="${minValue}" max="${maxValue}" id="border-radius-slider" class="input-slider" />
          <span class="input-slider-text">${maxValue}${unitType}</span>
        </div>
        <div class="input-slider-value-container">
          Current Value: <span id="border-radius-slider-value" class="input-slider-value"></span>
        </div>
        `;
      return el;
    },
    // Update the component based on element changes
    // `elInput` is the result HTMLElement you get from `createInput`
    onEvent({ elInput, component, event }) {
      const sliderInput = elInput.querySelector('#border-radius-slider');
      const valueText = elInput.querySelector('#border-radius-slider-value');
      valueText.innerHTML = sliderInput.value + (this.unit ?? 'px');

      const targetComponent = component.find('img') ?? [];

      if (targetComponent.length > 0) {
        targetComponent.forEach((comp) => {
          comp.setStyle({
            ...comp.getStyle(),
            'border-radius': `${sliderInput.value ?? 8}${this.unit ?? 'px'}`,
          });
        });
      } else {
        component.setStyle({
          ...component.getStyle(),
          'border-radius': `${sliderInput.value ?? 8}${this.unit ?? 'px'}`,
        });
      }
    },
    // Update elements on the component change
    onUpdate({ elInput, component }) {
      const componentStyle = (component.find('img')[0] ?? component).getStyle();
      const borderRadius = componentStyle['border-radius'] ?? '0px';
      const sliderInput = elInput.querySelector('#border-radius-slider');
      // Remove all non numeric char
      // The logic below is for us to support multiple units
      sliderInput.value = borderRadius.replaceAll('[^\\d]', '');

      const valueText = elInput.querySelector('#border-radius-slider-value');
      valueText.innerHTML = borderRadius;
      sliderInput.dispatchEvent(new CustomEvent('change'));
    },
  });

  editor.TraitManager.addType(traitTypes.IMAGE.BG_IMAGE_PICKER, {
    noLabel: true,
    templateInput: generateTraitsLayout('Container background'),
    createInput({ trait }) {
      const el = document.createElement('div');
      el.classList.add(['actions-input-container']);

      const setBtn = document.createElement('button');
      setBtn.innerText = 'Set BG Image';
      setBtn.addEventListener('click', () => {
        editor.runCommand('set-background-image');
      });

      const resetBtn = document.createElement('button');
      resetBtn.innerText = 'Reset BG';
      resetBtn.addEventListener('click', () => {
        editor.runCommand('remove-background-image');
      });

      el.appendChild(setBtn);
      el.appendChild(resetBtn);
      return el;
    },
  });
};
