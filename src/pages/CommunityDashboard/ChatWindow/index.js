import React, { useEffect } from 'react';

import { Layout } from 'antd';

import { Channel, MessageList, MessageInput, Thread, Window, useChatContext } from 'stream-chat-react';

import CustomChannelHeader from './CustomChannelHeader';
import ChannelMemberList from '../ChannelMemberList';

import styles from './styles.module.scss';

const { Header, Content, Sider } = Layout;

const ChatWindow = () => {
  const { client, channel, setActiveChannel } = useChatContext();

  const setFirstChannelActive = async () => {
    const channelLists = await client.queryChannels(
      { members: { $in: [client.userID] }, type: 'messaging' },
      { created_at: 1 }
    );

    if (channelLists.length > 0) {
      setActiveChannel(channelLists[0]);
    }
  };

  // Custom logic to prevent incorrect UI rendered
  // due to mismatch between active channel and url
  useEffect(() => {
    setFirstChannelActive();
    // eslint-disable-next-line
  }, []);

  return channel ? (
    <Channel TypingIndicator={() => null}>
      <Layout>
        <Header className={styles.channelHeaderContainer}>
          <CustomChannelHeader />
        </Header>
        <Layout className={styles.channelWindowContainer}>
          <Content>
            <Window hideOnThread={true}>
              <MessageList />
              <MessageInput />
            </Window>
            <Thread fullWidth={true} />
          </Content>
          <Sider className={styles.channelMemberListContainer}>
            <ChannelMemberList />
          </Sider>
        </Layout>
      </Layout>
    </Channel>
  ) : null;
};

export default ChatWindow;
