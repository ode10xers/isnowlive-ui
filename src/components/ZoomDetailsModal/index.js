import React, { useEffect, useState, useCallback } from 'react';
import { Row, Col, Form, Modal, Button, Radio, Typography, Input } from 'antd';
import { CopyOutlined } from '@ant-design/icons';
import { useTranslation } from 'react-i18next';

import apis from 'apis';

import Loader from 'components/Loader';
import { showErrorModal, showSuccessModal } from 'components/Modals/modals';

import { isAPISuccess, copyToClipboard } from 'utils/helper';
import validationRules from 'utils/validation';

import styles from './style.module.scss';

const { Title, Text, Link } = Typography;

const ZoomDetailsModal = ({ selectedInventory, closeModal }) => {
  const { t } = useTranslation();
  const [form] = Form.useForm();

  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showForm, setShowForm] = useState(true);
  const [view, setView] = useState('generate');
  const [zoomMeetingDetails, setZoomMeetingDetails] = useState(null);

  const getZoomMeetingInformation = useCallback(
    async (inventoryId) => {
      setIsLoading(true);
      try {
        const { status, data } = await apis.session.getZoomMeetingInfo(inventoryId);

        if (isAPISuccess(status)) {
          setZoomMeetingDetails(data);
        }
      } catch (error) {
        showErrorModal(t('SOMETHING_WRONG_HAPPENED'), error.response?.data?.message);
      }
      setIsLoading(false);
    },
    [t]
  );

  const generateZoomMeetingInformation = useCallback(async (inventoryId) => {
    setIsSubmitting(true);
    try {
      const { status } = await apis.session.generateZoomMeetingInfo(inventoryId);

      if (isAPISuccess(status)) {
        showSuccessModal(t('ZOOM_MEETING_GENERATED'));
        closeModal(true);
      }
    } catch (error) {
      showErrorModal(t('SOMETHING_WRONG_HAPPENED'), error.response?.data?.message);
    }
    setIsSubmitting(false);
    //eslint-disable-next-line
  }, []);

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
      showErrorModal(t('INVALID_INVENTORY_SELECTED'));
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
        showSuccessModal(t('ZOOM_MEETING_INFORMATION_SUCCESSFULLY_SUBMITTED'));
        closeModal(true);
      }
    } catch (error) {
      showErrorModal(t('SOMETHING_WRONG_HAPPENED'), error.response?.data?.message);
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
            <Title level={3}> {t('ZOOM_DETAILS_SENT_TO_ATTENDEE')} </Title>
          ) : (
            <Radio.Group value={view} onChange={handleViewChange}>
              <Radio.Button value="generate"> {t('GENERATE')} </Radio.Button>
              <Radio.Button value="add"> {t('ADD')} </Radio.Button>
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
                        label={t('ZOOM_MEETING_LINK')}
                        rules={validationRules.requiredValidation}
                      >
                        <Input placeholder={t('ADD_YOUR_ZOOM_MEETING_LINK_HERE')} />
                      </Form.Item>
                    </Col>
                  </Row>
                  <Row gutter={[8, 16]}>
                    <Col xs={24} md={12}>
                      <Form.Item id="meetingId" name="meetingId" label={t('MEETING_ID')}>
                        <Input placeholder={t('ADD_ZOOM_MEETING_ID')} />
                      </Form.Item>
                    </Col>
                    <Col xs={24} md={{ span: 11, offset: 1 }}>
                      <Form.Item id="password" name="password" label={t('MEETING_PASSWORD')}>
                        <Input.Password placeholder={t('ADD_MEETING_PASSWORD')} />
                      </Form.Item>
                    </Col>
                  </Row>
                  <Row justify="end" align="center" gutter={[8, 8]}>
                    <Col xs={12} md={4}>
                      <Button block type="default" onClick={() => closeModal(false)} loading={isSubmitting}>
                        {t('CANCEL')}
                      </Button>
                    </Col>
                    <Col xs={12} md={4}>
                      <Button block type="primary" htmlType="submit" loading={isSubmitting}>
                        {t('SUBMIT')}
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
                    onClick={() => generateZoomMeetingInformation(selectedInventory.inventory_id)}
                    loading={isSubmitting}
                  >
                    {t('CREATE_A_ZOOM_MEETING')}
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
                            {t('ZOOM_MEETING_LINK')}{' '}
                          </Title>{' '}
                          <Button
                            type="text"
                            onClick={() => copyToClipboard(zoomMeetingDetails.join_url)}
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
                            {t('MEETING_ID')}{' '}
                          </Title>{' '}
                          <Button
                            type="text"
                            onClick={() => copyToClipboard(zoomMeetingDetails.meeting_id)}
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
                            {t('MEETING_PASSWORD')}{' '}
                          </Title>{' '}
                          <Button
                            type="text"
                            onClick={() => copyToClipboard(zoomMeetingDetails.password)}
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
                    {t('NO_ZOOM_MEETING_DETAILS_AVAILABLE')}{' '}
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
