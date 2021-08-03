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
  useEditHandler,
  useChatContext,
  useChannelStateContext,
} from 'stream-chat-react';

import { Row, Col, Typography, Divider, Button, Popover, List, Comment } from 'antd';
import { CommentOutlined, LikeOutlined, EditOutlined } from '@ant-design/icons';

import MessageReplyInput from '../MessageReplyInput';

import dateUtil from 'utils/date';
import { preventDefaults } from 'utils/helper';

import styles from './styles.module.scss';

const { Title, Text } = Typography;

const {
  formatDate: { toDateAndTime },
} = dateUtil;

const MessageRepliesItem = (message) => {
  return (
    <List.Item>
      <Comment
        actions={[]}
        author={message.user?.name}
        avatar={<Avatar image={message.user?.image} name={message.user?.name} />}
        content={<MessageText message={message} />}
        datetime={toDateAndTime(message.updated_at)}
      />
    </List.Item>
  );
};

const CustomMessageItem = ({ openMessageModal }) => {
  const { message, handleReaction, isReactionEnabled, showDetailedReactions } = useMessageContext();

  const { client } = useChatContext();
  const { channel } = useChannelStateContext();
  const { handleEdit, setEditingState } = useMessageContext();

  const { setEdit } = useEditHandler();

  const [reactionPopoverVisible, setReactionPopoverVisible] = useState(false);
  const [repliesVisible, setRepliesVisible] = useState(false);
  const [messageReplies, setMessageReplies] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [repliesPageCount, setRepliesPageCount] = useState(1);
  const [showLoadMore, setShowLoadMore] = useState(false);

  const repliesPerPage = 20;

  const messageWrapperRef = useRef(null);

  const hasReactions = messageHasReactions(message);

  const fetchMessageReplies = async () => {
    setIsLoading(true);
    try {
      const replies = await channel.getReplies(message.id, { limit: repliesPerPage * repliesPageCount });

      setMessageReplies((prevReplies) => [...prevReplies, ...replies.messages]);

      if (replies.messages.length >= repliesPerPage) {
        setShowLoadMore(true);
        setRepliesPageCount((prevPageCount) => prevPageCount + 1);
      }
    } catch (error) {
      console.error(error);
    }
    setIsLoading(false);
  };

  const toggleRepliesForMessage = () => {
    if (!repliesVisible) {
      fetchMessageReplies();
    } else {
      setMessageReplies([]);
      setRepliesPageCount(1);
      setShowLoadMore(false);
    }

    setRepliesVisible(!repliesVisible);
  };

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
    toggleRepliesForMessage();
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
        {repliesVisible && (
          <>
            <Col xs={24}>
              <Divider type="horizontal" className={styles.simpleDivider} />
            </Col>
            <Col xs={24}>
              <List
                loading={isLoading}
                dataSource={messageReplies}
                rowKey={(message) => message.id}
                renderItem={MessageRepliesItem}
                loadMore={
                  showLoadMore ? (
                    <Button type="default" onClick={fetchMessageReplies}>
                      Load more comments
                    </Button>
                  ) : null
                }
                footer={<MessageReplyInput parentMessage={message} />}
              />
            </Col>
          </>
        )}
      </Row>
    </div>
  );
};

export default CustomMessageItem;
