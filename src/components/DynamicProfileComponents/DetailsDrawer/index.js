import React from 'react';

import { Drawer, Typography } from 'antd';
import { CloseCircleTwoTone } from '@ant-design/icons';

import styles from './style.module.scss';

const { Title, Text } = Typography;

// const DetailsDrawer = ({ children, visible, height = 480, title = 'Details', placement = 'bottom' }) => {
const DetailsDrawer = ({ children, ...props }) => {
  return (
    <Drawer
      height={580}
      title={<Title level={4}> Details </Title>}
      placement="bottom"
      closeIcon={
        <Text className={styles.customDrawerCloseButton}>
          {' '}
          <CloseCircleTwoTone className={styles.textIcons} /> CLOSE{' '}
        </Text>
      }
      bodyStyle={{ padding: 12 }}
      {...props}
    >
      {children}
    </Drawer>
  );
};

export default DetailsDrawer;
