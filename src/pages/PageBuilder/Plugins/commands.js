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
  supportedDeviceTypes.forEach((devType) => {
    editor.Commands.add(devType.cmd, {
      run: (editor) => editor.setDevice(devType.name),
    });
  });

  // Make use of StoreManagerAPI to actually store things
  editor.Commands.add('save-as-json', {
    run: (editor) => {
      const templateData = {
        'template-data': JSON.stringify(editor.storeData()),
      };

      console.log(templateData);
      editor.StorageManager.store(templateData);
    },
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
