import React from 'react';

import { Modal, Row, Col, Button, Popover } from 'antd';
import { SmileOutlined } from '@ant-design/icons';
import { ChatAutoComplete, EmojiPicker, SendButton, MessageInput, useMessageInputContext } from 'stream-chat-react';

import { resetBodyStyle } from 'components/Modals/modals';

import styles from './styles.module.scss';

const CustomInputComponent = ({ closeModal = () => {} }) => {
  const {
    closeEmojiPicker,
    emojiPickerIsOpen,
    handleEmojiKeyDown,
    handleSubmit,
    openEmojiPicker,
  } = useMessageInputContext();

  const handleMessageSend = (e) => {
    handleSubmit(e);
    // TODO: See if there's some listener like onMessageSuccess
    closeModal();
  };

  // TODO: Add file handling later

  return (
    <div className={styles.inputWrapper}>
      <Row gutter={[10, 12]}>
        <Col xs={24}>
          <Row gutter={[10, 10]}>
            <Col flex="0 0 40px">
              <Popover
                placement="bottomLeft"
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
            </Col>
            <Col flex="1 1 auto"></Col>
            <Col flex="0 0 40px" className={styles.sendButtonContainer}>
              <SendButton sendMessage={handleMessageSend} />
            </Col>
          </Row>
        </Col>
        <Col xs={24}>
          <div className={styles.textAreaWrapper}>
            <ChatAutoComplete />
          </div>
        </Col>
      </Row>
    </div>
  );
};

const CustomMessageInputModal = ({ visible, closeModal, targetMessage = null }) => {
  return (
    <Modal
      className={styles.newPostModal}
      footer={null}
      centered={true}
      closable={true}
      forceRender={true}
      visible={visible}
      onCancel={closeModal}
      afterClose={resetBodyStyle}
      title="Post a message"
    >
      {visible && (
        <MessageInput
          message={targetMessage}
          keycodeSubmitKeys={[]}
          grow={true}
          maxRows={7}
          Input={(inputProps) => <CustomInputComponent {...inputProps} closeModal={closeModal} />}
        />
      )}
    </Modal>
  );
};

export default CustomMessageInputModal;
