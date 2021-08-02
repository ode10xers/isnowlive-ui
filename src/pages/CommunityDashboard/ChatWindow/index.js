import React from 'react';

import { Layout } from 'antd';

import { Channel, MessageList, MessageInput, Thread, Window } from 'stream-chat-react';

import CustomChannelHeader from '../CustomChannelHeader';
import ChannelMemberList from '../ChannelMemberList';

import styles from './styles.module.scss';

const { Header, Content, Sider } = Layout;

const ChatWindow = () => {
  return (
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
            <Thread fullWidth={true} className={styles.h100} />
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
