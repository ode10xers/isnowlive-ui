import React from 'react';

// Props list can be found here https://github.com/bdryanovski/react-device-preview/blob/master/src/index.js
import ReactDevicePreview from 'react-device-preview';

import { generateUrlFromUsername, preventDefaults } from 'utils/helper';

import styles from './styles.module.scss';

// NOTE: play with the previewScale (0 - 1) to adjust device size
const deviceTypes = {
  MOBILE: {
    key: 'iphonex',
    viewportWidth: '375',
    previewScale: '0.8',
  },
  DESKTOP: {
    key: 'macbookpro',
    viewportWidth: '1280',
    previewScale: '0.5',
  },
};

// NOTE : caveat is that the URL needs to contain username
// So we might not be able to allow them to edit this here
const DeviceUIPreview = ({ creatorProfileData = null, isMobilePreview = true }) => {
  return (
    <ReactDevicePreview
      device={deviceTypes[isMobilePreview ? 'MOBILE' : 'DESKTOP'].key}
      scale={deviceTypes[isMobilePreview ? 'MOBILE' : 'DESKTOP'].previewScale}
    >
      <iframe
        src={generateUrlFromUsername(creatorProfileData.username)}
        className={styles.contentContainer}
        title="Device Profile Preview"
        onClick={preventDefaults}
      ></iframe>
    </ReactDevicePreview>
  );
};

export default DeviceUIPreview;
