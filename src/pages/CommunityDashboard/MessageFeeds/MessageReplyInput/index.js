import React from 'react';

import { Comment, Row, Col, Button, Space, Popover } from 'antd';
import { SmileOutlined, SendOutlined } from '@ant-design/icons';

import {
  Avatar,
  ChatAutoComplete,
  EmojiPicker,
  MessageInput,
  useChatContext,
  useMessageInputContext,
  useChannelStateContext,
} from 'stream-chat-react';

import { preventDefaults } from 'utils/helper';

import styles from './styles.module.scss';

const ReplyInputComponent = () => {
  const {
    closeEmojiPicker,
    emojiPickerIsOpen,
    handleEmojiKeyDown,
    openEmojiPicker,
    handleSubmit,
  } = useMessageInputContext();

  const handleReplyMessage = async (e) => {
    preventDefaults(e);
    handleSubmit(e);
  };

  return (
    <Row gutter={[8, 8]} className={styles.inputReplyContainer}>
      <Col flex="1 1 auto">
        <ChatAutoComplete />
      </Col>
      <Col flex="0 0 40px">
        <Space direction="vertical" align="center">
          <Popover
            placement="topRight"
            overlayClassName={styles.emojiPopupContainer}
            visible={emojiPickerIsOpen}
            content={<EmojiPicker />}
            trigger="click"
          >
            <Button
              type="default"
              icon={<SmileOutlined className={styles.emojiIcon} />}
              className={styles.emojiButton}
              onKeyDown={handleEmojiKeyDown}
              onClick={emojiPickerIsOpen ? closeEmojiPicker : openEmojiPicker}
            />
          </Popover>
          <Button type="link" icon={<SendOutlined />} onClick={handleReplyMessage} />
        </Space>
      </Col>
    </Row>
  );
};

const MessageReplyInput = ({ targetReply = null, resetTargetReply = () => {} }) => {
  const { client } = useChatContext();

  const { channel, thread } = useChannelStateContext();

  const overrideSubmitHandler = async (message, channelId) => {
    if (thread && thread.id) {
      const messageReplyData = {
        ...message,
        parent: thread,
        parent_id: thread.id,
      };

      await channel.sendMessage(messageReplyData);
      resetTargetReply();
    }
  };

  // TODO: Can also check flag for if reply is enabled
  return (
    <Comment
      className={styles.threadReplyInput}
      avatar={<Avatar image={client.user?.image} name={client.user?.name} />}
      content={
        targetReply ? (
          <MessageInput
            message={targetReply}
            keycodeSubmitKeys={[]}
            grow={true}
            maxRows={5}
            Input={ReplyInputComponent}
            overrideSubmitHandler={overrideSubmitHandler}
          />
        ) : (
          <MessageInput
            keycodeSubmitKeys={[]}
            grow={true}
            maxRows={5}
            Input={ReplyInputComponent}
            overrideSubmitHandler={overrideSubmitHandler}
          />
        )
      }
    />
  );
};

export default MessageReplyInput;
