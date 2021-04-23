import React from 'react';

import { Row, Col, Popover, Button, List, Typography } from 'antd';

const { Text } = Typography;

const TagListPopup = ({ tags = [], mobileView = false }) => {
  if (mobileView) {
    return (
      <Row gutter={[4, 16]}>
        <Col xs={11}> Purchasable by : </Col>
        {tags.length > 1 ? (
          <Col xs={24}>
            <Popover
              trigger="click"
              title="Purchasable by members with these tag"
              content={
                <List size="small" dataSource={tags} renderItem={(item) => <List.Item> {item.name} </List.Item>} />
              }
            >
              <Button block type="default">
                {tags.length || 0} Tags
              </Button>
            </Popover>
          </Col>
        ) : (
          <Col xs={13}>{tags.length > 0 ? tags[0].name : 'Everyone'}</Col>
        )}
      </Row>
    );
  }

  if (tags.length === 0) {
    return 'Everyone';
  }

  if (tags.length === 1) {
    return <Text strong> {tags[0].name} </Text>;
  }

  return (
    <Popover
      trigger="click"
      title="Purchasable by members with these tag"
      content={<List size="small" dataSource={tags} renderItem={(item) => <List.Item> {item.name} </List.Item>} />}
    >
      <Button block type="default">
        {tags.length || 0} Tags
      </Button>
    </Popover>
  );
};

export default TagListPopup;
