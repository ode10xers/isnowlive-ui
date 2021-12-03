import { message } from 'antd';
import { isValidCSSStyle } from 'utils/colors';
import componentTypes from './strings/componentTypes';
import customCommands from './strings/customCommands';

const supportedDeviceTypes = [
  {
    cmd: customCommands.SET_DEVICE.DESKTOP,
    name: 'Desktop',
  },
  {
    cmd: customCommands.SET_DEVICE.TABLET,
    name: 'Tablet',
  },
  {
    cmd: customCommands.SET_DEVICE.MOBILE,
    name: 'Mobile',
  },
];

export default (editor) => {
  // Previously we're overriding the "Exit" command, now we make it custom command
  // editor.Commands.add('core:component-exit', (editor) => {
  editor.Commands.add(customCommands.COMPONENT.MOVE_UP, (editor) => {
    const selectedComponent = editor.getSelected();
    const selectedParent = selectedComponent.parent();
    const targetIndex = Math.max(0, selectedComponent.index() - 1);
    selectedComponent.move(selectedParent, { at: targetIndex });
    editor.selectToggle(selectedComponent);
    editor.selectToggle(selectedComponent);
  });

  editor.Commands.add(customCommands.COMPONENT.MOVE_DOWN, (editor) => {
    const selectedComponent = editor.getSelected();
    const selectedParent = selectedComponent.parent();
    const targetIndex = Math.min(selectedParent.components().length - 1, selectedComponent.index() + 1);
    selectedComponent.move(selectedParent, { at: targetIndex });
    editor.selectToggle(selectedComponent);
    editor.selectToggle(selectedComponent);
  });

  // Override import command
  editor.Commands.add(customCommands.WEBPAGE_PRESET_IMPORT_OVERRIDE, (editor) => {
    const templateData = {
      html: editor.getHtml(),
      css: editor.getCss(),
      components: JSON.stringify(editor.getComponents()),
      styles: JSON.stringify(editor.getStyle()),
    };

    editor.StorageManager.store(templateData);
    message.success('Saved successfully!');
  });

  // Make use of StoreManagerAPI to actually store things
  editor.Commands.add(customCommands.SAVE_AS_JSON, {
    run: (editor) => {
      editor.store(
        (dataResponse) => {
          message.success('Saved successfully!');
        },
        (error) => {
          message.error('An error has occurred! Please try again in a few moments.');
        }
      );
    },
  });

  supportedDeviceTypes.forEach((devType) => {
    editor.Commands.add(devType.cmd, {
      run: (editor) => editor.setDevice(devType.name),
    });
  });

  // NOTE: This is the counter part of the one below
  editor.Commands.add(customCommands.IMAGE.REMOVE_BG, (editor) => {
    const selected = editor.getSelected();
    // NOTE: will be unused with new method
    // selected.removeClass(['with-background-image']);

    selected.setStyle({
      ...selected.getStyle(),
      background: 'transparent',
    });
  });

  editor.Commands.add(customCommands.IMAGE.SET_BG, {
    run: (editor) => {
      editor.AssetManager.open({
        types: ['image'],
        select(asset, complete) {
          let isSet = false;
          const selected = editor.getSelected();
          // NOTE: will be unused with new method
          // selected.addClass(['with-background-image']);
          const styleString = `url('${asset.getSrc()}') center center / cover no-repeat `;

          selected.setStyle({
            ...selected.getStyle(),
            background: isValidCSSStyle('background', styleString) ? styleString : 'transparent',
          });
          // NOTE: will be unused with new method
          // selected.set({
          //   'bg-style': isValidCSSStyle('background', styleString) ? styleString : 'transparent',
          // });

          // The default AssetManager UI will trigger `select(asset, false)` on asset click
          // and `select(asset, true)` on double-click
          if (isSet) {
            complete && editor.AssetManager.close();
          } else {
            editor.log('Failed to set image after Asset Manager Select', {
              ns: 'asset-manager-close',
              level: 'debug',
            });
          }
        },
      });
    },
  });

  editor.Commands.add(customCommands.IMAGE.SET_URL, {
    run: (editor) => {
      editor.AssetManager.open({
        types: ['image'],
        select(asset, complete) {
          let isSet = false;
          const selected = editor.getSelected();
          if (selected) {
            const closestImage = selected.findType(componentTypes.CUSTOM_COMPONENTS.CUSTOM_IMAGE)[0] ?? null;

            if (closestImage) {
              // closestImage.addAttributes({ src: asset.getSrc() });
              closestImage.setAttributes({
                ...closestImage.getAttributes(),
                src: asset.getSrc(),
              });
              closestImage.set('src', asset.getSrc(), { silent: 1 });
              isSet = true;
            } else if (
              selected.is('image') ||
              selected.is(componentTypes.CUSTOM_COMPONENTS.CUSTOM_IMAGE) ||
              selected.is('image-item')
            ) {
              // selected.addAttributes({ src: asset.getSrc() });
              selected.setAttributes({
                ...selected.getAttributes(),
                src: asset.getSrc(),
              });
              selected.set('src', asset.getSrc(), { silent: 1 });

              isSet = true;
            }
          }

          // The default AssetManager UI will trigger `select(asset, false)` on asset click
          // and `select(asset, true)` on double-click
          if (isSet) {
            editor.AssetManager.close();
          } else {
            editor.log('Failed to set image after Asset Manager Select', {
              ns: 'asset-manager-close',
              level: 'debug',
            });
          }
        },
      });
    },
  });
};
