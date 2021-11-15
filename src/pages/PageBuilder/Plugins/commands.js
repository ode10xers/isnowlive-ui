import { message } from 'antd';

const supportedDeviceTypes = [
  {
    cmd: 'set-device-desktop',
    name: 'Desktop',
  },
  {
    cmd: 'set-device-tablet',
    name: 'Tablet',
  },
  {
    cmd: 'set-device-mobile',
    name: 'Mobile',
  },
];

export default (editor) => {
  editor.Commands.add('core:component-exit', (editor) => {
    const selectedComponent = editor.getSelected();
    const selectedParent = selectedComponent.parent();
    const targetIndex = Math.max(0, selectedComponent.index() - 1);
    selectedComponent.move(selectedParent, { at: targetIndex });
  });

  // Override import command
  editor.Commands.add('gjs-open-import-webpage', (editor) => {
    // run: (editor) => {
    const templateData = {
      html: editor.getHtml(),
      css: editor.getCss(),
      components: JSON.stringify(editor.getComponents()),
      styles: JSON.stringify(editor.getStyle()),
    };

    editor.StorageManager.store(templateData);
    message.success('Saved successfully!');
    // },
  });

  // Make use of StoreManagerAPI to actually store things
  editor.Commands.add('save-as-json', {
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

  editor.Commands.add('set-image-url', {
    run: (editor) => {
      editor.AssetManager.open({
        types: ['image'],
        select(asset, complete) {
          let isSet = false;
          const selected = editor.getSelected();
          if (selected && selected.is('image')) {
            selected.addAttributes({ src: asset.getSrc() });
            isSet = true;
          } else {
            const closestImage = selected.find('img')[0] ?? null;
            if (closestImage && closestImage.is('image')) {
              closestImage.addAttributes({ src: asset.getSrc() });
              isSet = true;
            }
          }

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
};
