import React, { useState } from 'react';

import { Layout } from 'antd';

import { Channel, MessageList, Thread, Window } from 'stream-chat-react';

import ChannelMemberList from '../ChannelMemberList';
import CustomFeedsHeader from './CustomFeedsHeader';

import CustomMessageItem from './CustomMessageItem';
import CustomMessageInputModal from './CustomMessageInputModal';

import ThreadMessageItem from './ThreadMessageItem';
import MessageReplyInput from './MessageReplyInput';
import CustomThreadHeader from './CustomThreadHeader';

import styles from './styles.module.scss';

const { Header, Content, Sider } = Layout;

// NOTE: This UI will specifically be used for team typed channels
const MessageFeeds = ({ match, history }) => {
  const [messageModalVisible, setMessageModalVisible] = useState(false);

  const handleOpenMessageModal = () => {
    setMessageModalVisible(true);
  };

  const handleCloseMessageModal = () => {
    setMessageModalVisible(false);
  };

  return (
    <Channel TypingIndicator={() => null} ThreadStart={() => null} ThreadHeader={CustomThreadHeader}>
      <Layout>
        <CustomMessageInputModal visible={messageModalVisible} closeModal={handleCloseMessageModal} />
        <Header className={styles.channelHeaderContainer}>
          <CustomFeedsHeader openMessageModal={handleOpenMessageModal} />
        </Header>
        <Layout className={styles.channelWindowContainer}>
          <Content>
            <Window hideOnThread={true}>
              <MessageList
                onlySenderCanEdit={true}
                Message={(messageProps) => (
                  <CustomMessageItem {...messageProps} openMessageModal={handleOpenMessageModal} />
                )}
              />
            </Window>
            <Thread fullWidth={true} Message={ThreadMessageItem} Input={MessageReplyInput} />
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
