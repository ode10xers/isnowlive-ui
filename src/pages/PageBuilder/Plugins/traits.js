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
      const minValue = 0;
      const maxValue = 100;
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
      const padding = componentStyle['padding'] ?? '20px';
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
      const minValue = 0;
      const maxValue = 100;
      const el = document.createElement('div');
      el.innerHTML = `
      <div class="input-slider-container">
        <span class="input-slider-text">${minValue}px</span>
        <input type="range" min="${minValue}" max="${maxValue}" id="border-radius-slider" class="input-slider" />
        <span class="input-slider-text">${maxValue}px</span>
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
      valueText.innerHTML = sliderInput.value + 'px';
      component.setStyle({
        ...component.getStyle(),
        'border-radius': `${sliderInput.value ?? 8}px`,
      });
    },
    // Update elements on the component change
    onUpdate({ elInput, component }) {
      const componentStyle = component.getStyle();
      const borderRadius = componentStyle['border-radius'] ?? '0px';
      const sliderInput = elInput.querySelector('#border-radius-slider');
      sliderInput.value = borderRadius.replace('px', '');
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
      component.setStyle({
        ...component.getStyle(),
        'text-align': inputType.value ?? 'left',
      });
      component.addAttributes({
        layout: inputType.value,
      });
    },
    // Update elements on the component change
    onUpdate({ elInput, component }) {
      const layout = component.getAttributes()['layout'] || 'left';
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
      let classes = ['text-image-section-container'];

      if (inputType.value) {
        classes.push(`image-${inputType.value}`);
      }

      component.setClass(classes);
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

      let classes = ['link-btn'];

      if (inputType.value) {
        classes.push(`button-type-${inputType.value}`);
      }

      component.setClass(classes);

      // Adding Border Radius Trait
      if (inputType.value === 'link') {
        component.removeTrait('border-radius');
      } else {
        component.addTrait({
          type: 'border-radius-slider',
          name: 'border-radius',
        });
      }
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
};
