import React from 'react';

import { Comment, Row, Col, Button, Space, Popover, message } from 'antd';
import { SmileOutlined } from '@ant-design/icons';

import {
  Avatar,
  ChatAutoComplete,
  EmojiPicker,
  SendButton,
  MessageInput,
  useChatContext,
  useMessageInputContext,
  useChannelStateContext,
} from 'stream-chat-react';

import styles from './styles.module.scss';
import { preventDefaults } from 'utils/helper';

const ReplyInputComponent = ({ parentMessage = null }) => {
  const {
    closeEmojiPicker,
    emojiPickerIsOpen,
    handleEmojiKeyDown,
    openEmojiPicker,
    text,
    textareaRef,
  } = useMessageInputContext();

  const { channel } = useChannelStateContext();

  const resetComponentState = () => {
    if (textareaRef.current) {
      textareaRef.current.value = '';
    }
  };

  const handleReplyMessage = async (e) => {
    preventDefaults(e);

    try {
      if (parentMessage && parentMessage.id) {
        await channel.sendMessage({
          text,
          parent_id: parentMessage?.id,
        });

        resetComponentState();

        // TODO: Trigger replies/comment reload or append new data
      }
    } catch (error) {
      console.error(error);
      message.error('Failed to comment on this post');
    }
  };

  return (
    <Row gutter={[8, 8]} className={styles.inputReplyContainer}>
      <Col flex="1 1 auto">
        <ChatAutoComplete />
      </Col>
      <Col flex="0 0 40px">
        <Space direction="vertical" align="center">
          <Popover
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
          <SendButton sendMessage={handleReplyMessage} />
        </Space>
      </Col>
    </Row>
  );
};

const MessageReplyInput = ({ parentMessage = null }) => {
  const { client } = useChatContext();

  // TODO: Can also check flag for if reply is enabled
  return parentMessage ? (
    <Comment
      avatar={<Avatar image={client.user?.image} name={client.user?.name} />}
      content={
        <MessageInput
          keycodeSubmitKeys={[]}
          grow={true}
          maxRows={5}
          Input={(inputProps) => <ReplyInputComponent {...inputProps} parentMessage={parentMessage} />}
        />
      }
    />
  ) : null;
};

export default MessageReplyInput;
