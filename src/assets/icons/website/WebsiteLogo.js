import React from 'react';
import Icon from '@ant-design/icons';
import { ReactComponent as WebsiteSVG } from './website.svg';

const WebsiteLogo = ({ height = 21, width = 28, ...props }) => (
  <Icon component={() => <WebsiteSVG width={width} height={height} {...props} />} />
);

export default WebsiteLogo;
