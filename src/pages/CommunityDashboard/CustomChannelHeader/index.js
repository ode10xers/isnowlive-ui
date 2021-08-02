import React from 'react';

import { Space, Typography } from 'antd';

import { useChatContext, useChannelStateContext, Avatar } from 'stream-chat-react';

import styles from './styles.module.scss';

const { Text } = Typography;

const CustomChannelHeader = ({ title = '' }) => {
  const { client } = useChatContext();
  const { channel } = useChannelStateContext();
  const { name } = channel.data || {};

  const otherMembers = Object.values(channel.state.members).filter(({ user }) => user.id !== client.userID);
  const renderLimit = 3;

  const renderMessagingChannelHeader = () => {
    if (otherMembers.length > 1) {
      return (
        <Space>
          {otherMembers.slice(0, renderLimit).map(({ user }, idx) => (
            <div key={idx} className={styles.userHeaders}>
              <Avatar name={user.name || user.id} size={32} />
              <Text> {user.name || user.id} </Text>
            </div>
          ))}
          {otherMembers.length > renderLimit && (
            <Text type="secondary"> and {otherMembers.length > renderLimit} more </Text>
          )}
        </Space>
      );
    } else {
      return (
        <div className={styles.userHeaders}>
          <Avatar name={otherMembers[0].user.name || otherMembers[0].user.id} shape="circle" size={32} />
          <Text strong>{otherMembers[0].user.name || otherMembers[0].user.id} </Text>
        </div>
      );
    }
  };

  return channel.type === 'messaging' ? (
    renderMessagingChannelHeader()
  ) : (
    <Text strong># {title || name || 'Channel Header'}</Text>
  );
};

export default CustomChannelHeader;
