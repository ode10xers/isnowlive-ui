import React from 'react';

import { List, Typography } from 'antd';

import styles from './style.module.scss';

const { Text } = Typography;

const TextListView = ({ items = [], isContained }) => {
  const renderTextList = (item) => (
    <List.Item>
      <Text className={styles.textListItem}> {item} </Text>
    </List.Item>
  );

  return (
    <List
      bordered={false}
      className={styles.textListContainer}
      dataSource={items}
      renderItem={renderTextList}
      grid={isContained ? { column: 1, gutter: 8 } : { gutter: 10, column: 1, lg: 2 }}
    />
  );
};

export default TextListView;
