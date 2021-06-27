import React from 'react';

import { MenuOutlined } from '@ant-design/icons';

import styles from './style.module.scss';

const DragAndDropHandle = ({ ...props }) => (
  <div className={styles.dndHandle} {...props}>
    <MenuOutlined />
  </div>
);

export default DragAndDropHandle;
