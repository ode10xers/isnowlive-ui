import React from 'react';

import { Layout } from 'antd';

import { Channel, MessageList, Thread, Window } from 'stream-chat-react';

import ChannelMemberList from '../ChannelMemberList';
import CustomFeedsHeader from './CustomFeedsHeader';

import styles from './styles.module.scss';
import CustomMessageItem from './CustomMessageItem';

const { Header, Content, Sider } = Layout;

// NOTE: This UI will specifically be used for team typed channels
const MessageFeeds = ({ match, history }) => {
  return (
    <Channel TypingIndicator={() => null}>
      <Layout>
        <Header className={styles.channelHeaderContainer}>
          <CustomFeedsHeader />
        </Header>
        <Layout className={styles.channelWindowContainer}>
          <Content>
            <Window hideOnThread={true}>
              <MessageList Message={CustomMessageItem} />
            </Window>
            <Thread fullWidth={true} />
          </Content>
          <Sider className={styles.channelMemberListContainer}>
            <ChannelMemberList />
          </Sider>
        </Layout>
      </Layout>
    </Channel>
  );
};

export default MessageFeeds;
