import React, { useState } from 'react';

import {
  ReactionSelector,
  messageHasReactions,
  SimpleReactionsList,
  Avatar,
  Attachment,
  MessageText,
  MessageTimestamp,
  useMessageContext,
  useChatContext,
  useChannelActionContext,
} from 'stream-chat-react';

import { Row, Col, Typography, Divider, Button, Popover, Popconfirm, message as AntdMessage } from 'antd';
import { CommentOutlined, LikeOutlined, EditOutlined, DeleteOutlined } from '@ant-design/icons';

import { preventDefaults } from 'utils/helper';

import styles from './styles.module.scss';

const { Title, Text } = Typography;

const CustomMessageItem = ({ editMessage = () => {} }) => {
  const { client } = useChatContext();
  const { removeMessage } = useChannelActionContext();
  const { message, handleOpenThread, handleReaction, isReactionEnabled, showDetailedReactions } = useMessageContext();

  const [reactionPopoverVisible, setReactionPopoverVisible] = useState(false);

  const hasReactions = messageHasReactions(message);

  const handleLikeButtonClicked = (e) => {
    preventDefaults(e);
    setReactionPopoverVisible(!reactionPopoverVisible);
  };

  const handleReactionClicked = (reaction, event) => {
    setReactionPopoverVisible(false);
    handleReaction(reaction, event);
  };

  const handleCommentClicked = (e) => {
    preventDefaults(e);
    handleOpenThread(e);
  };

  const handleEditMessage = (e) => {
    editMessage(message);
  };

  const handleDeleteFeedMessage = async (e) => {
    preventDefaults(e);
    try {
      await client.deleteMessage(message.id);
      removeMessage(message);
      AntdMessage.success('Post deleted!');
    } catch (error) {
      console.error(error);
      AntdMessage.error('Failed to delete post! Try again later');
    }
  };

  // TODO: Get allowed actions, and render the CTAs accordingly
  return (
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
                <MessageTimestamp format="DD/MM/YYYY, hh:mm A" />
              </Text>
            </Col>
            {message.user.id === client.userID && (
              <>
                <Col flex="0 0 40px">
                  <Button type="link" icon={<EditOutlined />} onClick={handleEditMessage} />
                </Col>
                <Col flex="0 0 40px">
                  <Popconfirm
                    okType="danger"
                    title="Are you sure you want delete this post?"
                    onConfirm={handleDeleteFeedMessage}
                  >
                    <Button danger type="link" icon={<DeleteOutlined />} />
                  </Popconfirm>
                </Col>
              </>
            )}
          </Row>
        </Col>
        <Col xs={24}>
          <Divider type="horizontal" className={styles.simpleDivider} />
        </Col>
        <Col xs={24}>
          {/* <MessageOptions displayLeft={false} messageWrapperRef={messageWrapperRef} /> */}
          <MessageText customWrapperClass={styles.messageTextWrapper} customInnerClass={styles.messageText} />
        </Col>
        <Col xs={24}>{message.attachments && <Attachment attachments={message.attachments} />}</Col>
        <Col xs={24}>{hasReactions && !showDetailedReactions && isReactionEnabled && <SimpleReactionsList />}</Col>
        <Col xs={24}>
          <Divider type="horizontal" className={styles.simpleDivider} />
        </Col>
        <Col xs={24}>
          <Row gutter={8}>
            <Col flex="0 0 100px">
              <Popover
                visible={reactionPopoverVisible}
                overlayClassName={styles.reactionPopover}
                overlayInnerStyle={{
                  background: 'black',
                }}
                content={
                  <div onMouseLeave={() => setReactionPopoverVisible(false)}>
                    <ReactionSelector handleReaction={handleReactionClicked} />
                  </div>
                }
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
            <Col flex="0 0 100px">
              <Button
                type="default"
                icon={<CommentOutlined />}
                onClick={handleCommentClicked}
                className={styles.commentButton}
              >
                Comment
              </Button>
            </Col>
            <Col flex="1 1 auto" className={styles.replyCountContainer}>
              <Text type="secondary"> {message.reply_count} Replies </Text>
            </Col>
          </Row>
        </Col>
      </Row>
    </div>
  );
};

export default CustomMessageItem;
