import React, { useState } from 'react';

import { Layout } from 'antd';

import { Channel, MessageList, Thread, Window } from 'stream-chat-react';

import ChannelMemberList from '../ChannelMemberList';
import CustomFeedsHeader from './CustomFeedsHeader';

import styles from './styles.module.scss';
import CustomMessageItem from './CustomMessageItem';
import CustomMessageInputModal from './CustomMessageInputModal';

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
    <Channel TypingIndicator={() => null}>
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
