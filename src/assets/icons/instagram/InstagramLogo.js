import React from 'react';
import Icon from '@ant-design/icons';
import { ReactComponent as InstagramSVG } from './instagram.svg';

const InstagramLogo = ({ height = 28, width = 28, ...props }) => (
  <Icon component={() => <InstagramSVG width={width} height={height} {...props} />} />
);

export default InstagramLogo;
