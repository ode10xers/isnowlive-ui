import React from 'react';

import { Card, Typography } from 'antd';
import { LikeTwoTone } from '@ant-design/icons';

import styles from './style.module.scss';
import PassesListView from './PassesListView';

const { Text } = Typography;

const DefaultContainerTitle = (
  <Text style={{ color: '#0050B3' }}>
    <LikeTwoTone className={styles.mr10} twoToneColor="#0050B3" />
    CREDIT PASSES
  </Text>
);

// TODO : Later we might want these colors to be customized
const cardHeadingStyle = {
  background: '#F1FBFF',
  boxShadow: 'inset 0px -1px 0px #E6F5FB',
  color: '#0050B3',
};

const PassesProfileComponent = ({ title = DefaultContainerTitle }) => {
  return (
    <div className={styles.p10}>
      <Card
        title={title}
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
