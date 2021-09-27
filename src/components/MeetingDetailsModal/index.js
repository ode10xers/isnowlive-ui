import React, { useEffect, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { Row, Col, Form, Modal, Button, Radio, Typography, Input } from 'antd';
import { CopyOutlined } from '@ant-design/icons';

import apis from 'apis';
import Routes from 'routes';

import Loader from 'components/Loader';
import { resetBodyStyle, showErrorModal, showSuccessModal } from 'components/Modals/modals';

import { isAPISuccess, ZoomAuthType, copyToClipboard } from 'utils/helper';
import validationRules from 'utils/validation';

import { useGlobalContext } from 'services/globalContext';

import styles from './style.module.scss';

const { Title, Text, Paragraph } = Typography;

const MeetingDetailsModal = ({ visible, selectedInventory = null, closeModal }) => {
  const [form] = Form.useForm();
  const {
    state: { userDetails },
  } = useGlobalContext();

  const isZoomConnected = userDetails.profile && userDetails.profile.zoom_connected !== ZoomAuthType.NOT_CONNECTED;

  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showForm, setShowForm] = useState(true);
  const [view, setView] = useState('add');
  const [meetingDetails, setMeetingDetails] = useState(null);

  const getMeetingInformation = useCallback(async (inventoryId) => {
    setIsLoading(true);
    try {
      const { status, data } = await apis.session.getMeetingInfo(inventoryId);

      if (isAPISuccess(status)) {
        setMeetingDetails(data);
      }
    } catch (error) {
      showErrorModal('Something wrong happened', error.response?.data?.message);
    }
    setIsLoading(false);
  }, []);

  const generateZoomMeetingInformation = useCallback(async (inventoryId) => {
    if (!isZoomConnected) {
      showErrorModal(
        'Unable to generate Zoom Meeting',
        <>
          {' '}
          You have not connected your Zoom Account. Please head{' '}
          <Link to={Routes.creatorDashboard.rootPath + Routes.creatorDashboard.livestream}>here</Link> to connect it.{' '}
        </>
      );
      return;
    }

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

  const showAddMeetingDetailsForm = useCallback(() => {
    setShowForm(true);
    setView('add');
  }, []);

  useEffect(() => {
    if (visible && selectedInventory && selectedInventory.inventory_id && selectedInventory.start_url) {
      getMeetingInformation(selectedInventory.inventory_id);
      setShowForm(false);
    } else {
      showAddMeetingDetailsForm();
      setMeetingDetails(null);
    }
  }, [visible, selectedInventory, getMeetingInformation, showAddMeetingDetailsForm]);

  useEffect(() => {
    if (meetingDetails) {
      form.setFieldsValue({
        joinUrl: meetingDetails.join_url,
        meetingId: meetingDetails.meeting_id,
        password: meetingDetails.password,
      });
    } else {
      form.resetFields();
    }
  }, [meetingDetails, form]);

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
      meeting_id: values.meetingId,
      password: values.password,
    };

    try {
      const { status } = await apis.session.submitMeetingInfo(selectedInventory.inventory_id, payload);

      if (isAPISuccess(status)) {
        showSuccessModal(`Meeting information successfully updated`);
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
        visible={visible}
        footer={null}
        width={560}
        onCancel={() => closeModal(false)}
        afterClose={resetBodyStyle}
        destroyOnClose={true}
        title={
          !showForm ? (
            <Title level={3}> Meeting Details Sent to Attendee </Title>
          ) : (
            <Radio.Group value={view} onChange={handleViewChange}>
              {isZoomConnected && !selectedInventory?.start_url && (
                <Radio.Button value="generate"> Generate </Radio.Button>
              )}
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
                        label="Meeting Link"
                        rules={validationRules.requiredValidation}
                      >
                        <Input placeholder="Add your meeting link here" />
                      </Form.Item>
                    </Col>
                  </Row>
                  <Row gutter={[8, 16]}>
                    <Col xs={24} md={12}>
                      <Form.Item id="meetingId" name="meetingId" label="Meeting ID (optional)">
                        <Input placeholder="Add meeting ID" autoComplete="off" />
                      </Form.Item>
                    </Col>
                    <Col xs={24} md={{ span: 11, offset: 1 }}>
                      <Form.Item id="password" name="password" label="Meeting Password (optional)">
                        <Input.Password placeholder="Add meeting password" autoComplete="off" />
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
            ) : isZoomConnected && !selectedInventory?.start_url ? (
              <Row gutter={[12, 12]}>
                <Col xs={24}>
                  <Row justify="center">
                    <Col>
                      <Button
                        size="large"
                        type="primary"
                        onClick={() => generateZoomMeetingInformation(selectedInventory.inventory_id)}
                        loading={isSubmitting}
                      >
                        Create a Zoom Meeting
                      </Button>
                    </Col>
                  </Row>
                </Col>
                <Col xs={24} className={styles.textAlignCenter}>
                  <Paragraph>
                    We will automatically create a Zoom meeting for you using the Zoom account you have connected.
                  </Paragraph>
                </Col>
              </Row>
            ) : null
          ) : (
            <Row gutter={[8, 24]}>
              {meetingDetails ? (
                <>
                  {meetingDetails.join_url && (
                    <Col xs={24}>
                      <Row>
                        <Col xs={24}>
                          <Title level={4} className={styles.detailsHeader}>
                            Meeting Link
                          </Title>
                          <Button
                            type="text"
                            onClick={() => copyToClipboard(meetingDetails.join_url)}
                            icon={<CopyOutlined />}
                          />
                        </Col>
                        <Col xs={24}>
                          <Link href={meetingDetails.join_url} target="_blank">
                            {meetingDetails.join_url}
                          </Link>
                        </Col>
                      </Row>
                    </Col>
                  )}
                  {meetingDetails.meeting_id ? (
                    <Col xs={24} md={12}>
                      <Row>
                        <Col xs={24}>
                          <Title level={4} className={styles.detailsHeader}>
                            Meeting ID
                          </Title>
                          <Button
                            type="text"
                            onClick={() => copyToClipboard(meetingDetails.meeting_id)}
                            icon={<CopyOutlined />}
                          />
                        </Col>
                        <Col xs={24}>
                          <Text> {meetingDetails.meeting_id} </Text>
                        </Col>
                      </Row>
                    </Col>
                  ) : null}
                  {meetingDetails.password ? (
                    <Col xs={24} md={12}>
                      <Row>
                        <Col xs={24}>
                          <Title level={4} className={styles.detailsHeader}>
                            {' '}
                            Meeting Password{' '}
                          </Title>{' '}
                          <Button
                            type="text"
                            onClick={() => copyToClipboard(meetingDetails.password)}
                            icon={<CopyOutlined />}
                          />
                        </Col>
                        <Col xs={24}>
                          <Text> {meetingDetails.password} </Text>
                        </Col>
                      </Row>
                    </Col>
                  ) : null}
                  <Col xs={24}>
                    <Row justify="center">
                      <Col>
                        <Button type="primary" onClick={showAddMeetingDetailsForm}>
                          Edit Meeting Details
                        </Button>
                      </Col>
                    </Row>
                  </Col>
                </>
              ) : (
                <Col xs={24}>
                  <Title disabled level={5} className={styles.textAlignCenter}>
                    No Meeting Details available
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

export default MeetingDetailsModal;
