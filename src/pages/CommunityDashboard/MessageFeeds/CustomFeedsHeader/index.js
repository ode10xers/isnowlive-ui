import React from 'react';
import { useChannelStateContext } from 'stream-chat-react';

import { Row, Col, Button, Typography } from 'antd';
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
      <Col flex="1 1 auto">
        <Text strong> # {title || name || 'Message Feeds'} </Text>
      </Col>
      <Col flex="0 0 180px">
        <Button block type="primary" onClick={handleNewPostClicked}>
          New Post
        </Button>
      </Col>
    </Row>
  );
};

export default CustomFeedsHeader;
