import React, { useState } from 'react';

import {
  Avatar,
  MessageTimestamp,
  MessageText,
  SimpleReactionsList,
  ReactionSelector,
  messageHasReactions,
  useMessageContext,
  useChatContext,
  useChannelActionContext,
} from 'stream-chat-react';

import { Row, Col, Popover, Button, Divider, Typography, Comment, Popconfirm, message as AntdMessage } from 'antd';
import { LikeOutlined } from '@ant-design/icons';

import dateUtil from 'utils/date';
import { preventDefaults } from 'utils/helper';

import styles from './styles.module.scss';

const {
  formatDate: { toDateAndTime },
} = dateUtil;
const { Text, Title } = Typography;

const ThreadMessageItem = ({ handleEditMessageReply = () => {}, editedMessage = null }) => {
  const { client } = useChatContext();
  const { removeMessage } = useChannelActionContext();
  const {
    message,
    initialMessage,
    handleReaction,
    isReactionEnabled,
    showDetailedReactions,
    actionsEnabled,
    isMyMessage,
    getMessageActions,
  } = useMessageContext();

  const hasReactions = messageHasReactions(message);

  const [reactionPopoverVisible, setReactionPopoverVisible] = useState(false);

  const handleLikeButtonClicked = (e) => {
    preventDefaults(e);
    setReactionPopoverVisible(true);
  };

  const handleReactionClicked = (reaction, event) => {
    setReactionPopoverVisible(false);
    handleReaction(reaction, event);
  };

  const handleDeleteMessageReply = async (e) => {
    preventDefaults(e);
    try {
      await client.deleteMessage(message.id);
      removeMessage(message);
      AntdMessage.success('Message deleted successfully!');
    } catch (error) {
      console.error(error);
      AntdMessage.error('Failed to delete message! Try again later');
    }
  };

  // TODO: Get allowed actions, and render the CTAs accordingly
  return initialMessage ? (
    <div className={styles.feedContainer}>
      <Row gutter={[10, 10]}>
        <Col xs={24}>
          {/* Top Section with Avatar, name, timestamp */}
          <Row gutter={[8, 8]} align="middle">
            <Col flex="0 0 40px">
              <Avatar image={message.user?.image} name={message.user?.name} size={42} shape="circle" />
            </Col>
            <Col flex="1 1 auto">
              <Title level={5} className={styles.messageAuthor}>
                {message.user?.name}
              </Title>
              <Text type="secondary">
                <MessageTimestamp />
              </Text>
            </Col>
          </Row>
        </Col>
        <Col xs={24}>
          <Divider type="horizontal" className={styles.simpleDivider} />
        </Col>
        <Col xs={24}>
          <MessageText customWrapperClass={styles.messageTextWrapper} customInnerClass={styles.messageText} />
        </Col>
        <Col xs={24}>{hasReactions && !showDetailedReactions && isReactionEnabled && <SimpleReactionsList />}</Col>
        <Col xs={24}>
          <Divider type="horizontal" className={styles.simpleDivider} />
        </Col>
        <Col xs={24}>
          <Row gutter={8}>
            {getMessageActions().includes('react') && (
              <Col flex="0 0 100px">
                <Popover
                  visible={reactionPopoverVisible}
                  overlayClassName={styles.reactionPopover}
                  overlayInnerStyle={{
                    background: 'black',
                  }}
                  content={<ReactionSelector handleReaction={handleReactionClicked} />}
                  trigger="click"
                >
                  <Button
                    type="default"
                    icon={<LikeOutlined />}
                    className={styles.likeButton}
                    onClick={handleLikeButtonClicked}
                  >
                    Like
                  </Button>
                </Popover>
              </Col>
            )}
            <Col flex="1 1 auto" className={styles.replyCountContainer}>
              <Text type="secondary"> {message.reply_count} Replies </Text>
            </Col>
          </Row>
        </Col>
      </Row>
    </div>
  ) : (
    <div className={styles.messageReplyContainer}>
      {editedMessage && editedMessage?.id === message.id && <div className={styles.editingOverlay} />}
      <Comment
        className={styles.messageReplyItem}
        actions={
          actionsEnabled && isMyMessage()
            ? [
                <Button
                  className={styles.replyActionButtons}
                  size="small"
                  type="link"
                  onClick={() => handleEditMessageReply(message)}
                >
                  {' '}
                  Edit{' '}
                </Button>,
                <Popconfirm
                  okType="danger"
                  title="Are you sure you want to delete this message?"
                  onConfirm={handleDeleteMessageReply}
                >
                  <Button danger className={styles.replyActionButtons} size="small" type="link">
                    {' '}
                    Delete{' '}
                  </Button>
                </Popconfirm>,
              ]
            : []
        }
        author={message.user?.name}
        avatar={<Avatar image={message.user?.image} name={message.user?.name} />}
        content={<MessageText className={styles.replyContent} message={message} />}
        datetime={toDateAndTime(message.updated_at)}
      />
    </div>
  );
};

export default ThreadMessageItem;
