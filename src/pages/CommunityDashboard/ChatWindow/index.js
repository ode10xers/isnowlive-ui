import React, { useState, useCallback, useEffect } from 'react';

import { Layout, List } from 'antd';

import { Avatar, Channel, MessageList, MessageInput, Thread, Window, useChannelStateContext } from 'stream-chat-react';

import styles from './styles.module.scss';

const { Header, Content, Sider } = Layout;

// TODO: Move these into separate files
const CustomChannelHeader = ({ title = '' }) => {
  const { channel } = useChannelStateContext();
  // TODO: Decide what to do when it's a 1-on-1 chat
  // NOTE: See if we can use the title props
  // Probably not, if so then we can use the channel data
  const { name } = channel.data || {};

  return <div>{title || name || 'Channel Header'}</div>;
};

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
  }, []);

  useEffect(() => {
    fetchChannelMembers();
  }, [fetchChannelMembers]);

  return (
    <List
      itemLayout="vertical"
      split={false}
      loading={isLoading}
      rowKey={(member) => member.user_id}
      header="Members"
      dataSource={channelMembers}
      renderItem={(member) => (
        <List.Item.Meta
          avatar={<Avatar name={member.user.name} shape="rounded" size={32} />}
          title={member.user.name}
        />
      )}
    />
  );
};

const ChatWindow = () => {
  return (
    <Channel TypingIndicator={() => null}>
      <Layout>
        <Header className={styles.channelHeaderContainer}>
          <CustomChannelHeader />
        </Header>
        <Layout className={styles.channelWindowContainer}>
          <Content>
            <Window>
              {/* <ChannelHeader /> */}
              <MessageList />
              <MessageInput />
            </Window>
            <Thread />
          </Content>
          <Sider className={styles.channelMemberListContainer}>
            <ChannelMemberList />
          </Sider>
        </Layout>
      </Layout>
    </Channel>
  );
};

export default ChatWindow;
