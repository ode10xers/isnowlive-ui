import React from 'react';
import Icon from '@ant-design/icons';
import { ReactComponent as TwitterSVG } from './twitter.svg';

const TwitterLogo = ({ height = 28, width = 28, ...props }) => (
  <Icon component={() => <TwitterSVG width={width} height={height} {...props} />} />
);

export default TwitterLogo;
