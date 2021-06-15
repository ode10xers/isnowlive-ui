import React from 'react';
import { Card, Typography } from 'antd';
import { LikeTwoTone } from '@ant-design/icons';

import styles from './style.module.scss';
import PassesListView from './PassesListView';

const { Text } = Typography;

const ContainerTitle = ({ title = 'CREDIT PASSES' }) => (
  <Text style={{ color: '#0050B3' }}>
    <LikeTwoTone className={styles.mr10} twoToneColor="#0050B3" />
    {title}
  </Text>
);

// TODO : Later we might want these colors to be customized
const cardHeadingStyle = {
  background: '#F1FBFF',
  boxShadow: 'inset 0px -1px 0px #E6F5FB',
  color: '#0050B3',
  borderRadius: '12px 12px 0 0',
};

// TODO: Create Edit Overlays (for editing/deleting)
const PassesProfileComponent = ({ isEditing, title = null }) => {
  return (
    <div className={styles.p10}>
      <Card
        title={<ContainerTitle title={title} />}
        headStyle={cardHeadingStyle}
        className={styles.profileComponentContainer}
        bodyStyle={{ padding: 12 }}
      >
        <PassesListView />
      </Card>
    </div>
  );
};

export default PassesProfileComponent;
