import React, { useState, useEffect } from 'react';

import { Button, Input, Form, Modal, Row, Col } from 'antd';

import apis from 'apis';

import Loader from 'components/Loader';
import { resetBodyStyle, showErrorModal, showSuccessModal } from 'components/Modals/modals';

import { isAPISuccess } from 'utils/helper';
import validationRules from 'utils/validation';

const formInitialValues = {
  address: '',
};

const EventAddressModal = ({ visible, inventory = null, closeModal }) => {
  const [form] = Form.useForm();

  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    console.log(visible);
    console.log(inventory);
    if (visible && inventory && inventory?.inventory_external_id) {
      form.setFieldsValue({
        address: inventory?.offline_event_address ?? '',
      });
    } else {
      form.resetFields();
      setIsLoading(false);
    }
  }, [visible, form, inventory]);

  const handleFormFinish = async (values) => {
    setIsLoading(true);

    try {
      const payload = {
        address: values.address,
      };

      const { status } = await apis.session.updateOfflineEventAddress(inventory?.inventory_external_id, payload);

      if (isAPISuccess(status)) {
        showSuccessModal(
          'Event location updated successfully',
          'The attendees that have booked this event will also be notified via email.'
        );
        closeModal(true);
      }
    } catch (error) {
      showErrorModal('Failed to update event location', error?.response?.data?.message || 'Something went wrong.');
    }

    setIsLoading(false);
  };

  return (
    <div>
      <Modal
        centered={true}
        destroyOnClose={true}
        visible={visible}
        title="Edit Event Address/Location"
        width={560}
        footer={null}
        afterClose={resetBodyStyle}
        onCancel={() => closeModal(false)}
      >
        <Loader size="large" loading={isLoading}>
          <Form
            layout="vertical"
            initialValues={formInitialValues}
            name="offline-event-address-form"
            form={form}
            scrollToFirstError={true}
            onFinish={handleFormFinish}
          >
            <Row>
              <Col xs={24}>
                <Form.Item
                  id="address"
                  name="address"
                  label="Event Location"
                  rules={validationRules.requiredValidation}
                >
                  <Input placeholder="Input event location here" />
                </Form.Item>
              </Col>
              <Col xs={24}>
                <Row gutter={[8, 8]} justify="end">
                  <Col xs={10}>
                    <Button block type="default" onClick={() => closeModal(false)} loading={isLoading}>
                      Cancel
                    </Button>
                  </Col>
                  <Col xs={10}>
                    <Button block type="primary" htmlType="submit" loading={isLoading}>
                      Submit
                    </Button>
                  </Col>
                </Row>
              </Col>
            </Row>
          </Form>
        </Loader>
      </Modal>
    </div>
  );
};

export default EventAddressModal;
