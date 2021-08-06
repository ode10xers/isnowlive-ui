import React, { useState, useEffect, useCallback } from 'react';

import { List } from 'antd';

import { useChannelStateContext, Avatar } from 'stream-chat-react';

import styles from './styles.module.scss';

// TODO: Add UI components and interactions here
// For example, show roles (owner, mods) and their respective actions
const ChannelMemberList = () => {
  const { channel } = useChannelStateContext();

  const [isLoading, setIsLoading] = useState(false);
  const [channelMembers, setChannelMembers] = useState([]);

  const fetchChannelMembers = useCallback(async () => {
    setIsLoading(true);
    try {
      const { members } = await channel.queryMembers({}, {}, {});

      if (members && members.length > 0) {
        setChannelMembers(members);
      } else {
        setChannelMembers([]);
      }
    } catch (error) {
      console.error(error);
    }
    setIsLoading(false);
  }, [channel]);

  useEffect(() => {
    fetchChannelMembers();
  }, [fetchChannelMembers]);

  return (
    <div className={styles.p10}>
      <List
        itemLayout="vertical"
        split={false}
        loading={{
          spinning: isLoading,
          tip: 'Loading members',
        }}
        rowKey={(member) => member.user_id}
        header={`Members (${channelMembers.length})`}
        dataSource={channelMembers}
        renderItem={(member) => (
          <List.Item.Meta
            className={styles.channelMemberItems}
            avatar={<Avatar name={member.user.name} shape="circle" size={32} />}
            title={member.user.name}
          />
        )}
      />
    </div>
  );
};

export default ChannelMemberList;
