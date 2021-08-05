import React from 'react';
import { useChannelStateContext } from 'stream-chat-react';

import { Row, Col, Button, Typography } from 'antd';
import { FormOutlined } from '@ant-design/icons';

import { isMobileDevice } from 'utils/device';
import { preventDefaults } from 'utils/helper';

const { Text } = Typography;

const CustomFeedsHeader = ({ title = '', openMessageModal = () => {} }) => {
  const { channel } = useChannelStateContext();
  const { name } = channel.data || {};

  const handleNewPostClicked = (e) => {
    preventDefaults(e);
    openMessageModal();
  };

  return (
    <Row gutter={8}>
      <Col flex="1 0 auto">
        <Text strong> # {title || name || 'Message Feeds'} </Text>
      </Col>
      {isMobileDevice ? (
        <Col flex="0 0 48px">
          <Button block type="primary" onClick={handleNewPostClicked} icon={<FormOutlined />} />
        </Col>
      ) : (
        <Col flex="0 1 180px">
          <Button block type="primary" onClick={handleNewPostClicked}>
            New Post
          </Button>
        </Col>
      )}
    </Row>
  );
};

export default CustomFeedsHeader;
