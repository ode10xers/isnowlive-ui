import React from 'react';
import Icon from '@ant-design/icons';
import { ReactComponent as LinkedInSVG } from './linkedin.svg';

const LinkedInLogo = ({ height = 28, width = 28, ...props }) => (
  <Icon component={() => <LinkedInSVG width={width} height={height} {...props} />} />
);

export default LinkedInLogo;
