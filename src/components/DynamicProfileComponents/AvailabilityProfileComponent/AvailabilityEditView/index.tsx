import React, { MouseEvent, useCallback, useState } from 'react'
import { Modal, Row, Col, Input, Button, Form, Typography } from 'antd';

import { preventDefaults } from 'utils/helper';
import { resetBodyStyle } from 'components/Modals/modals';
import validationRules from 'utils/validation';

import styles from './style.module.scss';
import { DeleteOutlined, EditOutlined } from '@ant-design/icons';

const { Paragraph } = Typography

interface AvailabilityEditForm {
  title: string | null
}

const DEFAULT_FORM_VALUES: AvailabilityEditForm = { title: null }

export interface AvailabilityEditViewProps {
  config: Partial<AvailabilityEditForm>
  onUpdate: (config: AvailabilityEditForm) => void
  onRemove: () => void
}

const AvailabilityEditView: React.VFC<AvailabilityEditViewProps> = ({
  config,
  onUpdate,
  onRemove,
}) => {
  const [form] = Form.useForm()
  const [showModal, setShowModal] = useState(false)

  const handleEdit = useCallback((e: MouseEvent) => {
    preventDefaults(e)
    setShowModal(true)
  },　[])

  const handleRemove = useCallback((e: MouseEvent) => {
    preventDefaults(e)

    Modal.confirm({
      closable: true,
      centered: true,
      mask: true,
      maskClosable: false,
      title: 'Delete this component?',
      content: <Paragraph>Are you sure you want to remove this component?</Paragraph>,
      okText: 'Yes, remove it',
      okButtonProps: {
        danger: true,
        type: 'primary',
      },
      cancelText: 'Cancel',
      onOk: () => onRemove(),
      afterClose: resetBodyStyle,
    });
  }, [onRemove])

  const handleCancelEdit = useCallback((e: MouseEvent) => {
    preventDefaults(e)
    setShowModal(false)
  }, [])

  return (
    <>
      <Row justify="center">
        <Col xs={24} className={styles.editViewButtonContainer}>
          <button className={styles.editComponentButton} onClick={handleEdit}>
            <EditOutlined />
          </button>
        </Col>
        <Col xs={24} className={styles.editViewButtonContainer}>
          <button className={styles.deleteComponentButton} onClick={handleRemove}>
            <DeleteOutlined />
          </button>
        </Col>
      </Row>
      <Modal
        afterClose={resetBodyStyle}
        centered={true}
        footer={null}
        onCancel={handleCancelEdit}
        title="Edit this component"
        visible={showModal}
        width={640}
      >
        <Form<AvailabilityEditForm>
          form={form}
          initialValues={DEFAULT_FORM_VALUES}
          layout="vertical"
          onFinish={onUpdate}
          scrollToFirstError={true}
        >
          <Row gutter={[8, 16]}>
            <Col xs={24}>
              <Form.Item id="title" label="Container Title" name="title" rules={validationRules.requiredValidation}>
                <Input maxLength={30} placeholder="Input container title (max. 30 characters)" />
              </Form.Item>
            </Col>
            <Col xs={24}>
              <Row gutter={[12, 8]}>
                <Col xs={24} md={12}>
                  <Button block onClick={handleCancelEdit} size="large" type="default">
                    Cancel
                  </Button>
                </Col>
                <Col xs={24} md={12}>
                  <Button block htmlType="submit" size="large" type="primary">
                    Submit
                  </Button>
                </Col>
              </Row>
            </Col>
          </Row>
        </Form>
      </Modal>
    </>
  )
}

export default AvailabilityEditView
