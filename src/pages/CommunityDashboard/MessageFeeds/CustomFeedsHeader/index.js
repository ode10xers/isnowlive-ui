import React from 'react';
import { useChannelStateContext } from 'stream-chat-react';

import { Typography } from 'antd';

const { Text } = Typography;

const CustomFeedsHeader = ({ title = '' }) => {
  const { channel } = useChannelStateContext();
  const { name } = channel.data || {};

  return <Text strong> # {title || name || 'Message Feeds'} </Text>;
};

export default CustomFeedsHeader;
