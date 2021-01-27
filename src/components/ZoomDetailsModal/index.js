import React, { useEffect, useState, useCallback } from 'react';
import { Row, Col, Form, Modal, Button, Radio, Typography, Input, message } from 'antd';
import { CopyOutlined } from '@ant-design/icons';

import apis from 'apis';

import Loader from 'components/Loader';
import { showErrorModal, showSuccessModal } from 'components/Modals/modals';

import { isAPISuccess } from 'utils/helper';
import validationRules from 'utils/validation';

import styles from './style.module.scss';

const { Title, Text, Link } = Typography;

const ZoomDetailsModal = ({ selectedInventory, closeModal }) => {
  const [form] = Form.useForm();

  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showForm, setShowForm] = useState(true);
  const [view, setView] = useState('generate');
  const [zoomMeetingDetails, setZoomMeetingDetails] = useState(null);

  const getZoomMeetingInformation = useCallback(async (inventoryId) => {
    setIsLoading(true);
    try {
      const { status, data } = await apis.session.getZoomMeetingInfo(inventoryId);

      if (isAPISuccess(status)) {
        setZoomMeetingDetails(data);
      }
    } catch (error) {
      showErrorModal('Something wrong happened', error.response?.data?.message);
    }
    setIsLoading(false);
  }, []);

  const generateZoomMeetingInformation = useCallback(async (inventoryId) => {
    setIsSubmitting(true);
    try {
      const { status } = await apis.session.generateZoomMeetingInfo(inventoryId);

      if (isAPISuccess(status)) {
        showSuccessModal('Zoom meeting generated!');
        closeModal(true);
      }
    } catch (error) {
      showErrorModal('Something wrong happened', error.response?.data?.message);
    }
    setIsSubmitting(false);
    //eslint-disable-next-line
  }, []);

  const copyTextToClipboard = (text, itemName) => {
    // Fallback method if navigator.clipboard is not supported
    if (!navigator.clipboard) {
      var textArea = document.createElement('textarea');
      textArea.value = text;

      // Avoid scrolling to bottom
      textArea.style.top = '0';
      textArea.style.left = '0';
      textArea.style.position = 'fixed';

      document.body.appendChild(textArea);
      textArea.focus();
      textArea.select();

      try {
        var successful = document.execCommand('copy');

        if (successful) {
          message.success(`${itemName} copied to clipboard!`);
        } else {
          message.error('Failed to copy to clipboard');
        }
      } catch (err) {
        message.error('Failed to copy to clipboard');
      }

      document.body.removeChild(textArea);
    } else {
      navigator.clipboard.writeText(text).then(
        () => {
          message.success(`${itemName} copied to clipboard!`);
        },
        (err) => {
          message.error('Failed to copy to clipboard');
        }
      );
    }
  };

  useEffect(() => {
    form.resetFields();

    if (selectedInventory) {
      if (selectedInventory.start_url) {
        getZoomMeetingInformation(selectedInventory.inventory_id);
        setShowForm(false);
      } else {
        setShowForm(true);
        setView('generate');
      }
    } else {
      setShowForm(true);
      setView('generate');
    }
    //eslint-disable-next-line
  }, [selectedInventory]);

  const handleViewChange = (e) => {
    setView(e.target.value);
  };

  const handleFinish = async (values) => {
    setIsSubmitting(true);

    if (!selectedInventory) {
      showErrorModal('Invalid Inventory Selected');
      setIsSubmitting(false);
      closeModal(false);
      return;
    }

    const payload = {
      join_url: values.joinUrl,
      meeting_id: parseInt(values.meetingId?.split(' ').join('')) || null,
      password: values.password || null,
    };

    try {
      const { status } = await apis.session.submitZoomMeetingInfo(selectedInventory.inventory_id, payload);

      if (isAPISuccess(status)) {
        showSuccessModal('Zoom Meeting information successfully submitted');
        closeModal(true);
      }
    } catch (error) {
      showErrorModal('Something wrong happened', error.response?.data?.message);
    }

    setIsSubmitting(false);
  };

  return (
    <div>
      <Modal
        centered={true}
        visible={selectedInventory}
        footer={null}
        width={560}
        onCancel={() => closeModal(false)}
        destroyOnClose={true}
        title={
          !showForm ? (
            <Title level={3}> Zoom Details Sent to Attendee </Title>
          ) : (
            <Radio.Group value={view} onChange={handleViewChange}>
              <Radio.Button value="generate"> Generate </Radio.Button>
              <Radio.Button value="add"> Add </Radio.Button>
            </Radio.Group>
          )
        }
      >
        <Loader size="large" loading={isLoading}>
          {showForm ? (
            view === 'add' ? (
              <div>
                <Form layout="vertical" name="zoomDetailsForm" form={form} onFinish={handleFinish}>
                  <Row gutter={[8, 16]}>
                    <Col xs={24}>
                      <Form.Item
                        id="joinUrl"
                        name="joinUrl"
                        label="Zoom Meeting Link"
                        rules={validationRules.requiredValidation}
                      >
                        <Input placeholder="Add your zoom meeting link here" />
                      </Form.Item>
                    </Col>
                  </Row>
                  <Row gutter={[8, 16]}>
                    <Col xs={24} md={12}>
                      <Form.Item id="meetingId" name="meetingId" label="Meeting ID">
                        <Input placeholder="Add zoom meeting ID" />
                      </Form.Item>
                    </Col>
                    <Col xs={24} md={{ span: 11, offset: 1 }}>
                      <Form.Item id="password" name="password" label="Meeting Password">
                        <Input.Password placeholder="Add meeting password" />
                      </Form.Item>
                    </Col>
                  </Row>
                  <Row justify="end" align="center" gutter={[8, 8]}>
                    <Col xs={12} md={4}>
                      <Button block type="default" onClick={() => closeModal(false)} loading={isSubmitting}>
                        Cancel
                      </Button>
                    </Col>
                    <Col xs={12} md={4}>
                      <Button block type="primary" htmlType="submit" loading={isSubmitting}>
                        Submit
                      </Button>
                    </Col>
                  </Row>
                </Form>
              </div>
            ) : (
              <Row>
                <Col xs={24} md={{ span: 10, offset: 7 }}>
                  <Button
                    block
                    size="large"
                    type="primary"
                    onClick={() => generateZoomMeetingInformation()}
                    loading={isSubmitting}
                  >
                    Create a Zoom Meeting
                  </Button>
                </Col>
              </Row>
            )
          ) : (
            <Row gutter={[8, 24]}>
              {zoomMeetingDetails ? (
                <>
                  {zoomMeetingDetails.join_url && (
                    <Col xs={24}>
                      <Row>
                        <Col xs={24}>
                          <Title level={4} className={styles.detailsHeader}>
                            {' '}
                            Zoom Meeting Link{' '}
                          </Title>{' '}
                          <Button
                            type="text"
                            onClick={() => copyTextToClipboard(zoomMeetingDetails.join_url, 'Meeting Link')}
                            icon={<CopyOutlined />}
                          />
                        </Col>
                        <Col xs={24}>
                          <Link href={zoomMeetingDetails.join_url} target="_blank">
                            {' '}
                            {zoomMeetingDetails.join_url}{' '}
                          </Link>
                        </Col>
                      </Row>
                    </Col>
                  )}
                  {zoomMeetingDetails.meeting_id ? (
                    <Col xs={24} md={12}>
                      <Row>
                        <Col xs={24}>
                          <Title level={4} className={styles.detailsHeader}>
                            {' '}
                            Meeting ID{' '}
                          </Title>{' '}
                          <Button
                            type="text"
                            onClick={() => copyTextToClipboard(zoomMeetingDetails.meeting_id, 'Meeting ID')}
                            icon={<CopyOutlined />}
                          />
                        </Col>
                        <Col xs={24}>
                          <Text> {zoomMeetingDetails.meeting_id} </Text>
                        </Col>
                      </Row>
                    </Col>
                  ) : null}
                  {zoomMeetingDetails.password ? (
                    <Col xs={24} md={12}>
                      <Row>
                        <Col xs={24}>
                          <Title level={4} className={styles.detailsHeader}>
                            {' '}
                            Meeting Password{' '}
                          </Title>{' '}
                          <Button
                            type="text"
                            onClick={() => copyTextToClipboard(zoomMeetingDetails.password, 'Meeting Password')}
                            icon={<CopyOutlined />}
                          />
                        </Col>
                        <Col xs={24}>
                          <Text> {zoomMeetingDetails.password} </Text>
                        </Col>
                      </Row>
                    </Col>
                  ) : null}
                </>
              ) : (
                <Col xs={24}>
                  <Title disabled level={5} className={styles.textAlignCenter}>
                    {' '}
                    No Zoom Meeting Details available{' '}
                  </Title>
                </Col>
              )}
            </Row>
          )}
        </Loader>
      </Modal>
    </div>
  );
};

export default ZoomDetailsModal;
