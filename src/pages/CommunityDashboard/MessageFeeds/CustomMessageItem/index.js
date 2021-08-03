import React, { useState, useRef } from 'react';

import {
  MessageOptions,
  ReactionSelector,
  messageHasReactions,
  SimpleReactionsList,
  Avatar,
  MessageText,
  MessageTimestamp,
  useMessageContext,
  useChannelActionContext,
  useEditHandler,
  useChatContext,
} from 'stream-chat-react';

import { Row, Col, Typography, Divider, Button, Popover } from 'antd';
import { CommentOutlined, LikeOutlined, EditOutlined } from '@ant-design/icons';

import { preventDefaults } from 'utils/helper';

import styles from './styles.module.scss';

const { Title, Text } = Typography;

const CustomMessageItem = ({ openMessageModal }) => {
  const { message, handleReaction, isReactionEnabled, showDetailedReactions } = useMessageContext();

  const { client } = useChatContext();
  const { openThread } = useChannelActionContext();
  const { handleEdit, setEditingState } = useMessageContext();

  const { setEdit } = useEditHandler();

  const [reactionPopoverVisible, setReactionPopoverVisible] = useState(false);

  const messageWrapperRef = useRef(null);

  const hasReactions = messageHasReactions(message);

  const handleLikeButtonClicked = (e) => {
    preventDefaults(e);
    setReactionPopoverVisible(true);
  };

  const handleReactionClicked = (reaction, event) => {
    setReactionPopoverVisible(false);
    handleReaction(reaction, event);
  };

  const handleCommentClicked = (e) => {
    preventDefaults(e);
    openThread(message);
  };

  // TODO: Investigate this later
  const handleEditMessage = async (e) => {
    await setEdit(e);
    await handleEdit(e);
    // await setEditingState(e);
    openMessageModal();
  };

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
                {' '}
                {message.user?.name}{' '}
              </Title>
              <Text type="secondary">
                {' '}
                <MessageTimestamp />{' '}
              </Text>
            </Col>
            {message.user.id === client.userID && (
              <Col flex="0 0 40px">
                <Button size="large" type="link" icon={<EditOutlined />} />
              </Col>
            )}
          </Row>
        </Col>
        <Col xs={24}>
          <Divider type="horizontal" className={styles.simpleDivider} />
        </Col>
        <Col xs={24}>
          <MessageOptions displayLeft={false} messageWrapperRef={messageWrapperRef} />
          <MessageText customWrapperClass={styles.messageTextWrapper} customInnerClass={styles.messageText} />
        </Col>
        {/* <Col xs={24}>
          Not sure how this will show up, test sometimes
          {message.attachments && <Attachment attachments={message.attachments} />}
        </Col> */}
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
