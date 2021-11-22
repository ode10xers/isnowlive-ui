import { isValidCSSColor } from 'utils/colors';
import { googleFonts } from 'utils/constants.js';

export default (editor) => {
  editor.TraitManager.addType('padding-slider', {
    // Expects as return a simple HTML string or an HTML element
    noLabel: true,
    templateInput: `
      <div class="custom-trait-layout">
        <div class="custom-trait-label">
          Padding
        </div>
        <div class="custom-trait-input" data-input>
        </div>
      </div>
    `,
    createInput({ trait }) {
      // Create a new element container and add some content
      console.log(trait.get('min'));
      const minValue = trait.get('min') || 0;
      const maxValue = trait.get('max') || 250;
      const el = document.createElement('div');
      el.innerHTML = `
      <div class="input-slider-container">
        <span class="input-slider-text">${minValue}px</span>
        <input type="range" min="${minValue}" max="${maxValue}" id="padding-slider" class="input-slider" />
        <span class="input-slider-text">${maxValue}px</span>
      </div>
      <div class="input-slider-value-container">
        Current Value: <span class="input-slider-value" id="padding-slider-value"></span>
      </div>
      `;
      return el;
    },
    // Update the component based on element changes
    // `elInput` is the result HTMLElement you get from `createInput`
    onEvent({ elInput, component, event }) {
      const sliderInput = elInput.querySelector('#padding-slider');
      const valueText = elInput.querySelector('#padding-slider-value');
      valueText.innerHTML = sliderInput.value + 'px';
      component.setStyle({
        ...component.getStyle(),
        padding: `${sliderInput.value ?? 8}px`,
      });
    },
    // Update elements on the component change
    onUpdate({ elInput, component }) {
      const componentStyle = component.getStyle();
      const padding = componentStyle['padding'] ?? '8px';
      const sliderInput = elInput.querySelector('#padding-slider');
      sliderInput.value = padding.replace('px', '');
      const valueText = elInput.querySelector('#padding-slider-value');
      valueText.innerHTML = padding;
      sliderInput.dispatchEvent(new CustomEvent('change'));
    },
  });

  editor.TraitManager.addType('margin-slider', {
    // Expects as return a simple HTML string or an HTML element
    noLabel: true,
    templateInput: `
    <div class="custom-trait-layout">
      <div class="custom-trait-label">
        Margin
      </div>
      <div class="custom-trait-input" data-input>
      </div>
    </div>
    `,
    createInput({ trait }) {
      // Create a new element container and add some content
      const minValue = 0;
      const maxValue = 100;
      const el = document.createElement('div');
      el.innerHTML = `
      <div class="input-slider-container">
        <span class="input-slider-text">${minValue}px</span>
        <input type="range" min="${minValue}" max="${maxValue}" id="margin-slider" class="input-slider" />
        <span class="input-slider-text">${maxValue}px</span>
      </div>
      <div class="input-slider-value-container">
        Current Value: <span id="margin-slider-value" class="input-slider-value"></span>
      </div>
      `;
      return el;
    },
    // Update the component based on element changes
    // `elInput` is the result HTMLElement you get from `createInput`
    onEvent({ elInput, component, event }) {
      const sliderInput = elInput.querySelector('#margin-slider');
      const valueText = elInput.querySelector('#margin-slider-value');
      valueText.innerHTML = sliderInput.value + 'px';
      component.setStyle({
        ...component.getStyle(),
        margin: `${sliderInput.value ?? 8}px`,
      });
    },
    // Update elements on the component change
    onUpdate({ elInput, component }) {
      const componentStyle = component.getStyle();
      const padding = componentStyle['margin'] ?? '0px';
      const sliderInput = elInput.querySelector('#margin-slider');
      sliderInput.value = padding.replace('px', '');
      const valueText = elInput.querySelector('#margin-slider-value');
      valueText.innerHTML = padding;
      sliderInput.dispatchEvent(new CustomEvent('change'));
    },
  });

  editor.TraitManager.addType('border-radius-slider', {
    // Expects as return a simple HTML string or an HTML element
    noLabel: true,
    templateInput: `
    <div class="custom-trait-layout">
      <div class="custom-trait-label">
        Roundness
      </div>
      <div class="custom-trait-input" data-input>
      </div>
    </div>
    `,
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
      component.setStyle({
        ...component.getStyle(),
        'border-radius': `${sliderInput.value ?? 8}${this.unit ?? 'px'}`,
      });
    },
    // Update elements on the component change
    onUpdate({ elInput, component }) {
      const componentStyle = component.getStyle();
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

  editor.TraitManager.addType('font-size-slider', {
    // Expects as return a simple HTML string or an HTML element
    noLabel: true,
    templateInput: `
    <div class="custom-trait-layout">
      <div class="custom-trait-label">
        Text Size
      </div>
      <div class="custom-trait-input" data-input>
      </div>
    </div>
    `,
    createInput({ trait }) {
      // Create a new element container and add some content
      const minValue = 0;
      const maxValue = 100;
      const el = document.createElement('div');
      el.innerHTML = `
      <div class="input-slider-container">
        <span class="input-slider-text">${minValue}px</span>
        <input type="range" min="${minValue}" max="${maxValue}" id="font-size-slider" class="input-slider" />
        <span class="input-slider-text">${maxValue}px</span>
      </div>
      <div class="input-slider-value-container">
        Current Value: <span class="input-slider-value" id="font-size-slider-value"></span>
      </div>
      `;
      return el;
    },
    // Update the component based on element changes
    // `elInput` is the result HTMLElement you get from `createInput`
    onEvent({ elInput, component, event }) {
      const sliderInput = elInput.querySelector('#font-size-slider');
      const valueText = elInput.querySelector('#font-size-slider-value');
      valueText.innerHTML = sliderInput.value + 'px';
      component.setStyle({
        ...component.getStyle(),
        'font-size': `${sliderInput.value ?? 12}px`,
      });
    },
    // Update elements on the component change
    onUpdate({ elInput, component }) {
      const componentStyle = component.getStyle();
      const fontSize = componentStyle['font-size'] ?? '12px';
      const sliderInput = elInput.querySelector('#font-size-slider');
      sliderInput.value = fontSize.replace('px', '');
      const valueText = elInput.querySelector('#font-size-slider-value');
      valueText.innerHTML = fontSize;
      sliderInput.dispatchEvent(new CustomEvent('change'));
    },
  });

  editor.TraitManager.addType('text-section-layout', {
    // Expects as return a simple HTML string or an HTML element
    noLabel: true,
    templateInput: `
    <div class="custom-trait-layout">
      <div class="custom-trait-label">
        Text Layout
      </div>
      <div class="custom-trait-input" data-input>
      </div>
    </div>
    `,
    createInput({ trait }) {
      // Here we can decide to use properties from the trait
      const options = [
        { id: 'left', name: 'Left', class: 'fa fa-align-left' },
        { id: 'center', name: 'Centered', class: 'fa fa-align-center' },
        { id: 'right', name: 'Right', class: 'fa fa-align-right' },
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

      const textSection = component.find('div.text-section-container')[0];

      if (textSection) {
        textSection.setStyle({
          ...textSection.getStyle(),
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

  editor.TraitManager.addType('image-position-layout', {
    // Expects as return a simple HTML string or an HTML element
    noLabel: true,
    templateInput: `
    <div class="custom-trait-layout">
      <div class="custom-trait-label">
        Image Layout
      </div>
      <div class="custom-trait-input" data-input>
      </div>
    </div>
    `,
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
      let classes = [];
      let existingClasses = component.getClasses();

      if (inputType.value) {
        classes.push(`image-${inputType.value}`);
        existingClasses = existingClasses.filter(
          (cls) => !['image-left', 'image-top', 'image-right', 'image-bottom'].includes(cls)
        );
      }

      component.setClass([...new Set([...existingClasses, ...classes])]);
    },
    // Update elements on the component change
    onUpdate({ elInput, component }) {
      // This is getting the trait value from the set classes
      const layout =
        component
          .getClasses()
          .find((cls) => cls.startsWith('image-'))
          ?.split('-')[1] ?? 'right';
      const inputType = elInput.querySelector('#image-position-select');
      inputType.value = layout;

      inputType.dispatchEvent(new CustomEvent('change'));
    },
  });

  editor.TraitManager.addType('font-selector', {
    noLabel: true,
    templateInput: `
      <div class="custom-trait-layout">
        <div class="custom-trait-label">
          Text Font
        </div>
        <div class="custom-trait-input" data-input>
        </div>
      </div>
    `,
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

  editor.TraitManager.addType('button-types', {
    noLabel: true,
    templateInput: `
      <div class="custom-trait-layout">
        <div class="custom-trait-label">
          Button Type
        </div>
        <div class="custom-trait-input" data-input>
        </div>
      </div>
    `,
    createInput({ trait }) {
      // TODO: This probably needs to be a global var so can be referenced to easily
      const options = [
        { id: 'link', name: 'Link' },
        { id: 'outlined', name: 'Outlined' },
        // { id: 'filled', name: 'Filled' },
      ];

      const el = document.createElement('div');
      el.innerHTML = `
        <select class="input-select" id="button-layout-select">
          ${options.map((opt) => `<option value="${opt.id}">${opt.name}</option>`).join('')}
        </select>
      `;

      return el;
    },

    onEvent({ elInput, component, event }) {
      const inputType = elInput.querySelector('#button-layout-select');

      let classes = [];
      let existingClasses = component.getClasses();

      if (inputType.value) {
        classes.push(`button-type-${inputType.value}`);
        existingClasses = existingClasses.filter((cls) => !['button-type-link', 'button-type-outlined'].includes(cls));
      }

      component.setClass([...new Set([...existingClasses, ...classes])]);
    },

    onUpdate({ elInput, component }) {
      // This is getting the trait value from the set classes
      const layout =
        component
          .getClasses()
          .find((cls) => cls.startsWith('button-type-'))
          ?.split('-')[2] ?? 'link';
      const inputType = elInput.querySelector('#button-layout-select');
      inputType.value = layout;

      inputType.dispatchEvent(new CustomEvent('change'));
    },
  });

  editor.TraitManager.addType('brand-type-select', {
    noLabel: true,
    templateInput: `
    <div class="custom-trait-layout">
    <div class="custom-trait-label">
      Brand Type
    </div>
    <div class="custom-trait-input" data-input>
    </div>
  </div>
    `,
    createInput({ trait }) {
      // TODO: This probably needs to be a global var so can be referenced to easily
      const options = [
        { id: 'text', name: 'Text' },
        { id: 'image', name: 'Image/Logo' },
      ];

      const el = document.createElement('div');
      el.innerHTML = `
        <select class="input-select" id="brand-type-select">
          ${options.map((opt) => `<option value="${opt.id}">${opt.name}</option>`).join('')}
        </select>
      `;

      return el;
    },

    onEvent({ elInput, component, event }) {
      const inputType = elInput.querySelector('#brand-type-select');

      component.set({
        'brand-type': inputType.value ?? 'text',
      });
    },

    onUpdate({ elInput, component }) {
      // This is getting the trait value from the set classes
      const brandType = component.get('brand-type') ?? 'text';
      const inputType = elInput.querySelector('#brand-type-select');
      inputType.value = brandType;

      inputType.dispatchEvent(new CustomEvent('change'));
    },
  });

  editor.TraitManager.addType('nav-links', {
    noLabel: true,
    templateInput: `
    <div class="custom-trait-layout">
      <div class="custom-trait-label">
        Navigation Links
      </div>
      <div class="custom-trait-input" data-input>
      </div>
    </div>
    `,
    createInput({ trait }) {
      const el = document.createElement('div');
      el.classList.add(['button-list-container']);

      return el;
    },

    onEvent({ elInput, component, event }) {
      console.log(event);

      if (event) {
        return;
      }
    },

    onUpdate({ elInput, component }) {
      // This is getting the trait value from the set classes
      const linkButtons = component.findType('link-buttons') ?? [];
      // const elInput = elInput.querySelector('.button-list-container');

      elInput.innerHTML = '';

      linkButtons.forEach((btn) => {
        const btnTraitContainer = document.createElement('div');
        btnTraitContainer.classList.add(['button-item-container']);

        const btnTraitContent = document.createElement('p');
        btnTraitContent.classList.add(['button-trait-content']);
        btnTraitContent.innerHTML = btn.get('content') ?? 'Link button';

        const selectNavBtn = document.createElement('button');
        selectNavBtn.classList.add(['button-trait-cta']);
        selectNavBtn.innerText = 'Select';
        selectNavBtn.onclick = () => {
          editor.selectToggle(btn);
          editor.select(btn);
        };

        const deleteNavBtn = document.createElement('button');
        deleteNavBtn.classList.add(['button-trait-cta']);
        deleteNavBtn.innerText = 'Delete';
        deleteNavBtn.onclick = () => {
          btn.remove();
          component.emitUpdate();
        };

        btnTraitContainer.appendChild(btnTraitContent);
        btnTraitContainer.appendChild(selectNavBtn);
        btnTraitContainer.appendChild(deleteNavBtn);

        elInput.appendChild(btnTraitContainer);
      });

      const addNavBtn = document.createElement('button');
      addNavBtn.classList.add(['button-trait-add']);
      addNavBtn.innerText = 'Add New Link';
      addNavBtn.onclick = () => {
        component.handleAddButtonLink();
        component.emitUpdate();
      };

      elInput.appendChild(addNavBtn);
    },
  });

  editor.TraitManager.addType('background-styles', {
    noLabel: true,
    templateInput: `
    <div class="custom-trait-layout">
      <div class="custom-trait-label">
        Container Background
      </div>
      <div class="custom-trait-input" data-input>
      </div>
    </div>
    `,
    createInput({ trait }) {
      const el = document.createElement('div');
      el.classList.add(['styles-input-container']);

      const selectDropdown = document.createElement('select');
      [
        { name: 'placeholder', value: 'Transparent' },
        { name: 'class', value: 'input-select' },
        { name: 'id', value: 'bg-style-select' },
      ].map((attr) => selectDropdown.setAttribute(attr.name, attr.value));

      // TODO: Can also put this in a separate file
      const options = [
        {
          id: 'color',
          name: 'Color Background',
        },
        {
          id: 'image',
          name: 'Image (with dark overlay)',
        },
      ];

      selectDropdown.innerHTML = `${options.map((opt) => `<option value="${opt.id}">${opt.name}</option>`).join('')}`;
      el.appendChild(selectDropdown);
      return el;
    },

    onEvent({ elInput, component, event }) {
      const newValue = event.target.value;
      let traitToAdd = null;
      let traitToDel = '';

      if (newValue === 'image') {
        traitToDel = 'bg-style';
        traitToAdd = {
          id: 'bg-image-picker',
          type: 'button',
          text: 'Click to set image',
          full: true,
          label: 'Background Image',
          command: 'set-background-image',
        };
        component.set({
          'bg-style': '',
        });
      } else if (newValue === 'color') {
        traitToDel = 'bg-image-picker';
        traitToAdd = {
          type: 'color',
          label: 'Background color',
          name: 'bg-style',
          changeProp: true,
        };
        editor.runCommand('remove-background-image');
        component.set({
          'bg-style': '#ffffff',
        });
      }

      if (traitToAdd) {
        if (traitToDel) {
          component.removeTrait(traitToDel);
        }
        const traitIndex = component.getTraitIndex('background-style-picker');
        component.addTrait(traitToAdd, { at: traitIndex + 1 });
      }
    },

    onUpdate({ elInput, component }) {
      const bgStyle = component.props()['bg-style'] ?? component.getAttributes()['bg-style'] ?? '';
      const selectEl = elInput.querySelector('#bg-style-select');
      selectEl.value = isValidCSSColor(bgStyle) || bgStyle === 'transparent' ? 'color' : 'image';
      selectEl.dispatchEvent(new CustomEvent('change'));
    },
  });

  editor.TraitManager.addType('background-image-picker', {
    noLabel: true,
    templateInput: `
    <div class="custom-trait-layout">
      <div class="custom-trait-label">
        Container Background
      </div>
      <div class="custom-trait-input" data-input>
      </div>
    </div>
    `,
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
