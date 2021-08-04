import React, { useState } from 'react';

import {
  Avatar,
  MessageTimestamp,
  MessageText,
  SimpleReactionsList,
  ReactionSelector,
  messageHasReactions,
  useMessageContext,
} from 'stream-chat-react';

import { Row, Col, Popover, Button, Divider, Typography, Comment } from 'antd';
import { LikeOutlined } from '@ant-design/icons';

import dateUtil from 'utils/date';
import { preventDefaults } from 'utils/helper';

import styles from './styles.module.scss';

const {
  formatDate: { toDateAndTime },
} = dateUtil;
const { Text, Title } = Typography;

const ThreadMessageItem = () => {
  const { message, initialMessage, handleReaction, isReactionEnabled, showDetailedReactions } = useMessageContext();

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
                {' '}
                {message.user?.name}{' '}
              </Title>
              <Text type="secondary">
                {' '}
                <MessageTimestamp />{' '}
              </Text>
            </Col>
          </Row>
        </Col>
        <Col xs={24}>
          <Divider type="horizontal" className={styles.simpleDivider} />
        </Col>
        <Col xs={24}>
          {/* <MessageOptions displayLeft={false} messageWrapperRef={messageWrapperRef} /> */}
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
            <Col flex="1 1 auto" className={styles.replyCountContainer}>
              <Text type="secondary"> {message.reply_count} Replies </Text>
            </Col>
          </Row>
        </Col>
      </Row>
    </div>
  ) : (
    <Comment
      className={styles.messageReplyItem}
      actions={[]}
      author={message.user?.name}
      avatar={<Avatar image={message.user?.image} name={message.user?.name} />}
      content={<MessageText className={styles.replyContent} message={message} />}
      datetime={toDateAndTime(message.updated_at)}
    />
  );
};

export default ThreadMessageItem;
