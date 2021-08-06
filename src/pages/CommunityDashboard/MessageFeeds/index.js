import React, { useState, useEffect } from 'react';

import { Layout, Spin } from 'antd';

import { Channel, MessageList, Thread, Window, useChatContext } from 'stream-chat-react';

import ChannelMemberList from '../ChannelMemberList';
import CustomFeedsHeader from './CustomFeedsHeader';

import CustomMessageItem from './CustomMessageItem';
import CustomMessageInputModal from './CustomMessageInputModal';

import ThreadMessageItem from './ThreadMessageItem';
import MessageReplyInput from './MessageReplyInput';
import CustomThreadHeader from './CustomThreadHeader';

import styles from './styles.module.scss';
import { TeamOutlined } from '@ant-design/icons';

const { Header, Content, Sider } = Layout;

// NOTE: This UI will specifically be used for team typed channels
const MessageFeeds = ({ match, history }) => {
  const [messageModalVisible, setMessageModalVisible] = useState(false);
  const [targetMessage, setTargetMessage] = useState(null);
  const [targetReply, setTargetReply] = useState(null);

  const { client, channel, setActiveChannel } = useChatContext();

  const handleOpenMessageModal = () => {
    setMessageModalVisible(true);
  };

  const handleCloseMessageModal = () => {
    setMessageModalVisible(false);
    setTargetMessage(null);
  };

  const handleEditMessage = (selectedMessage) => {
    setTargetMessage(selectedMessage);
    handleOpenMessageModal();
  };

  const setFirstChannelActive = async () => {
    const channelLists = await client.queryChannels(
      { members: { $in: [client.userID] }, type: 'team' },
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

  const handleEditThreadReply = (selectedReply) => {
    setTargetReply(selectedReply);
  };

  const handleResetTargetReply = () => {
    setTargetReply(null);
  };

  return channel ? (
    <Channel TypingIndicator={() => null} ThreadStart={() => null} ThreadHeader={CustomThreadHeader}>
      <Layout>
        <CustomMessageInputModal
          visible={messageModalVisible}
          closeModal={handleCloseMessageModal}
          targetMessage={targetMessage}
        />
        <Header className={styles.channelHeaderContainer}>
          <CustomFeedsHeader openMessageModal={handleOpenMessageModal} />
        </Header>
        <Layout className={styles.channelWindowContainer}>
          <Content>
            <Window hideOnThread={true}>
              <MessageList
                LoadingIndicator={<Spin spinning={true} tip="Fetching feed posts" />}
                hideDeletedMessages={true}
                disableDateSeparator={true}
                onlySenderCanEdit={true}
                Message={(messageProps) => <CustomMessageItem {...messageProps} editMessage={handleEditMessage} />}
              />
            </Window>
            <Thread
              fullWidth={true}
              additionalMessageListProps={{ hideDeletedMessages: true }}
              Message={(messageProps) => (
                <ThreadMessageItem
                  {...messageProps}
                  editedMessage={targetReply}
                  handleEditMessageReply={handleEditThreadReply}
                />
              )}
              Input={(inputProps) => (
                <MessageReplyInput
                  {...inputProps}
                  targetReply={targetReply}
                  resetTargetReply={handleResetTargetReply}
                />
              )}
            />
          </Content>
          <Sider
            width={280}
            breakpoint="md"
            reverseArrow={true}
            collapsedWidth={0}
            trigger={<TeamOutlined />}
            zeroWidthTriggerStyle={{ top: 20, backgroundColor: '#91d5ff' }}
            theme="light"
            className={styles.channelMemberListContainer}
          >
            <ChannelMemberList />
          </Sider>
        </Layout>
      </Layout>
    </Channel>
  ) : null;
};

export default MessageFeeds;
