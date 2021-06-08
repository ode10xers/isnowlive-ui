import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Row, Col, Button, Tooltip, Form, Typography, Modal } from 'antd';
import { FilterFilled } from '@ant-design/icons';
import Table from 'components/Table';
import Loader from 'components/Loader';
import apis from 'apis';
import { showErrorModal, resetBodyStyle, showSuccessModal } from 'components/Modals/modals';
import { isAPISuccess } from 'utils/helper';
const { Title } = Typography;

const AllAudienceModal = ({ visible, closeModal, listID }) => {
  const [form] = Form.useForm();
  const [isLoading, setIsLoading] = useState(false);
  const [selectedAudiences, setSelectedAudiences] = useState([]);
  const [pageNumber, setPageNumber] = useState(1);

  const [validRecipients, setValidRecipients] = useState([]);
  const totalItemsPerPage = 10;
  const [audienceList, setAudienceList] = useState([]);
  const [canShowMore, setCanShowMore] = useState(false);
  const defaultTemplateKey = 'blank';
  const [selectedTemplate, setSelectedTemplate] = useState(defaultTemplateKey);
  const isCreating = useMemo(() => selectedTemplate === defaultTemplateKey, [selectedTemplate]);

  useEffect(() => {
    if (visible && listID !== undefined) {
      setValidRecipients(listID);
      setSelectedTemplate(listID);
    }
  }, [visible, form, listID]);

  const handleFormFinish = async (values) => {
    setIsLoading(true);

    try {
      const payload = {
        audiences: selectedAudiences,
      };

      const { status } = await apis.newsletter.updateEmailList(validRecipients, payload);

      if (isAPISuccess(status)) {
        showSuccessModal(`Email List successfully ${isCreating ? 'created' : 'updated'}`);
        closeModal(true);
      }
    } catch (error) {
      showErrorModal(
        `Failed to ${isCreating ? 'create' : 'update'} email template`,
        error?.response?.data?.message || 'Something went wrong.'
      );
    }

    setIsLoading(false);
  };

  const getAudienceList = useCallback(async (pageNumber, itemsPerPage) => {
    setIsLoading(true);
    try {
      const { status, data } = await apis.audiences.getCreatorAudiences(pageNumber, itemsPerPage);

      if (isAPISuccess(status) && data) {
        setAudienceList((audienceList) => [...audienceList, ...data.data]);
        setCanShowMore(data.next_page);
      }
    } catch (error) {
      showErrorModal(error?.response?.data?.message || 'Something went wrong.');
    }
    setIsLoading(false);
  }, []);

  const onSelectAudienceRow = (selectedRowKeys, selectedRow) => {
    setSelectedAudiences(selectedRow.map((row) => row.id));
  };

  useEffect(() => {
    getAudienceList(pageNumber, totalItemsPerPage);
  }, [getAudienceList, pageNumber, totalItemsPerPage]);

  const audienceListColumns = [
    {
      title: 'First Name',
      dataIndex: 'first_name',
      key: 'first_name',
      width: '32%',
    },
    {
      title: 'Last Name',
      dataIndex: 'last_name',
      key: 'last_name',
      width: '32%',
      render: (text, record) => record.last_name || '-',
    },
    {
      title: 'Type',
      dataIndex: 'type',
      key: 'type',
      render: (text, record) => `${record.type[0]}${record.type.slice(1).toLowerCase()}`,
      filterIcon: (filtered) => (
        <Tooltip defaultVisible={true} title="Click here to filter">
          {' '}
          <FilterFilled style={{ fontSize: 16, color: filtered ? '#1890ff' : '#00ffd7' }} />{' '}
        </Tooltip>
      ),
    },
  ];

  return (
    <Modal
      title={<Title level={5}> Send email to audiences </Title>}
      visible={visible}
      centered={true}
      onCancel={closeModal}
      footer={null}
      width={1080}
      afterClose={resetBodyStyle}
    >
      <div>
        <Row>
          <Col xs={24}>
            <Loader loading={isLoading} size="large">
              <Form form={form} scrollToFirstError={true} onFinish={handleFormFinish}>
                <Row gutter={[8, 8]}>
                  <Col xs={24} md={12} lg={10}></Col>
                  <Col xs={24} md={12} lg={14}>
                    <Row gutter={[8, 8]} justify="end">
                      <Col xs={24} md={12} lg={8}></Col>
                      <Col xs={24} md={12} lg={8}>
                        <Button block type="primary" htmlType="submit">
                          {isCreating ? 'Save new' : 'Update this'} list
                        </Button>
                      </Col>
                    </Row>
                  </Col>
                </Row>
              </Form>
            </Loader>
          </Col>
          {/* Audience Section Section */}
          <Col xs={24}>
            <Row gutter={[8, 16]} justify="center">
              <Col xs={24}>
                <Table
                  size="small"
                  loading={isLoading}
                  data={audienceList}
                  columns={audienceListColumns}
                  rowKey={(record) => record.id}
                  rowSelection={{
                    onChange: onSelectAudienceRow,
                  }}
                />
              </Col>
              <Col xs={8}>
                <Button
                  block
                  type="default"
                  loading={isLoading}
                  disabled={!canShowMore}
                  onClick={() => setPageNumber(pageNumber + 1)}
                >
                  Show more audience
                </Button>
              </Col>
            </Row>
          </Col>
        </Row>
      </div>
    </Modal>
  );
};

export default AllAudienceModal;
