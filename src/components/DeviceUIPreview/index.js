import React from 'react';

// Props list can be found here https://github.com/bdryanovski/react-device-preview/blob/master/src/index.js
import ReactDevicePreview from 'react-device-preview';

import DynamicProfile from 'pages/DynamicProfile';

const deviceTypes = {
  MOBILE: 'iphonex',
  DESKTOP: 'macbookpro',
};

const DeviceUIPreview = () => {
  return (
    <ReactDevicePreview device={deviceTypes.MOBILE} scale="0.6">
      <DynamicProfile creatorUsername="ellianto" />
    </ReactDevicePreview>
  );
};

export default DeviceUIPreview;
