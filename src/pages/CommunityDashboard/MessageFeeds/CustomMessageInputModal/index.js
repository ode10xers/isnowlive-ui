import React from 'react';

import { Modal, Row, Col, Button, Popover, Upload, Typography, message as AntdMessage } from 'antd';
import { SmileOutlined, CloudUploadOutlined } from '@ant-design/icons';
import {
  ChatAutoComplete,
  EmojiPicker,
  UploadsPreview,
  SendButton,
  MessageInput,
  useMessageInputContext,
} from 'stream-chat-react';

import { resetBodyStyle } from 'components/Modals/modals';

import styles from './styles.module.scss';

const { Text } = Typography;

const CustomInputComponent = ({ closeModal = () => {} }) => {
  const {
    closeEmojiPicker,
    emojiPickerIsOpen,
    handleEmojiKeyDown,
    handleSubmit,
    openEmojiPicker,
    uploadNewFiles,
    isUploadEnabled,
    maxFilesLeft,
    fileUploads,
    imageUploads,
  } = useMessageInputContext();

  const handleMessageSend = (e) => {
    handleSubmit(e);
    // TODO: See if there's some listener like onMessageSuccess
    closeModal();
  };

  const handleBeforeFileUpload = (file) => {
    const isValidFileSize = file.size / 1024 / 1024 < 20; // Stream max file size = 20MB
    if (!isValidFileSize) {
      AntdMessage.error('Image must be smaller than 20MB!');
    }

    return isValidFileSize;
  };

  const handleFileUpload = (fileData) => {
    uploadNewFiles([fileData.file]);
  };

  // TODO: Editing a file with attachment doesn't render the images correctly. Investigate
  // the message pulled from MessageInputContext does have attachments property
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
            {isUploadEnabled && (
              <Col flex="0 0 100px">
                {maxFilesLeft ? (
                  <Upload
                    defaultFileList={[]}
                    showUploadList={false}
                    multiple={false}
                    beforeUpload={handleBeforeFileUpload}
                    customRequest={handleFileUpload}
                  >
                    <Button type="default" icon={<CloudUploadOutlined />} />
                  </Upload>
                ) : (
                  <div className={styles.maxAttachmentText}>
                    <Text type="danger">
                      {' '}
                      You can only attach max {Object.keys(fileUploads).length +
                        Object.keys(imageUploads).length} files{' '}
                    </Text>
                  </div>
                )}
              </Col>
            )}
            <Col flex="1 1 auto"></Col>
            <Col flex="0 0 40px" className={styles.sendButtonContainer}>
              <SendButton sendMessage={handleMessageSend} />
            </Col>
          </Row>
        </Col>
        <Col xs={24}>
          <UploadsPreview />
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
