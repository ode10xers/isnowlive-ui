import React, { useState, useCallback, useEffect } from 'react';
import { Row, Col, Button, Form, Select, Typography, Card, Empty, Tooltip } from 'antd';
import { SaveOutlined, EditOutlined, FilterFilled, CloseCircleOutlined } from '@ant-design/icons';

import apis from 'apis';

import Table from 'components/Table';
import Loader from 'components/Loader';
import { showErrorModal, showSuccessModal } from 'components/Modals/modals';

import { isAPISuccess } from 'utils/helper';
import { isMobileDevice } from 'utils/device';

import styles from './styles.module.scss';

const { Text, Title } = Typography;

const MembersList = () => {
  const [form] = Form.useForm();

  const [isLoading, setIsLoading] = useState(false);
  const [membersList, setMembersList] = useState([]);
  const [selectedMember, setSelectedMember] = useState(null);

  const [pageNumber, setPageNumber] = useState(1);
  const [canShowMore, setCanShowMore] = useState(false);
  const totalItemsPerPage = 10;

  const [creatorMemberTags, setCreatorMemberTags] = useState([]);

  const fetchCreatorMemberTags = useCallback(async () => {
    setIsLoading(true);

    try {
      const { status, data } = await apis.user.getCreatorUserPreferences();

      if (isAPISuccess(status) && data) {
        setCreatorMemberTags(data.tags);
      }
    } catch (error) {
      showErrorModal('Failed fetching creator members tags', error?.response?.data?.message || 'Something went wrong.');
    }

    setIsLoading(false);
  }, []);

  const fetchCreatorMembersList = useCallback(async (pageNumber, itemsPerPage) => {
    setIsLoading(true);

    try {
      const { status, data } = await apis.audiences.getCreatorMembers(pageNumber, itemsPerPage);

      if (isAPISuccess(status) && data) {
        setMembersList((memberList) => [...memberList, ...data.data]);
        setCanShowMore(data.next_page);
      }
    } catch (error) {
      showErrorModal('Failed fetching creator members list', error?.response?.data?.message || 'Something went wrong.');
    }

    setIsLoading(false);
  }, []);

  const updateMemberTag = (tagId) => {
    const selectedMemberIndex = membersList.findIndex((member) => member.id === selectedMember.id);

    if (selectedMemberIndex >= 0) {
      const tempMembersList = membersList;
      tempMembersList[selectedMemberIndex].tag = creatorMemberTags.find((tag) => tag.external_id === tagId) || {
        name: '',
        external_id: '',
      };
      setMembersList(tempMembersList);
      setSelectedMember(null);
    }
  };

  useEffect(() => {
    fetchCreatorMemberTags();
  }, [fetchCreatorMemberTags]);

  useEffect(() => {
    fetchCreatorMembersList(pageNumber, totalItemsPerPage);
  }, [fetchCreatorMembersList, pageNumber, totalItemsPerPage]);

  const updateSelectedMemberTag = async () => {
    if (!selectedMember) {
      showErrorModal('Something went wrong', 'Invalid member selected');
    }

    setIsLoading(true);

    try {
      const selectedTagId = form.getFieldValue(selectedMember.id);

      const payload = {
        external_id: selectedMember.id,
        tag_id: selectedTagId,
      };

      const { status } = await apis.audiences.updateMemberTag(payload);

      if (isAPISuccess(status)) {
        showSuccessModal('Member Tag updated successfully');
        updateMemberTag(selectedTagId);
      }
    } catch (error) {
      showErrorModal('Failed updating member tag', error?.response?.data?.message || 'Something went wrong');
    }

    setIsLoading(false);
  };

  const membersListColumns = [
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
      title: 'Tag',
      render: (text, record) =>
        record.id === selectedMember?.id ? (
          <Form.Item noStyle className={styles.tagDropdownContainer} name={record.id}>
            <Select
              className={styles.tagDropdownContainer}
              placeholder="Select the member tag"
              defaultValue={record.tag.external_id || null}
              options={creatorMemberTags.map((tag) => ({
                label: tag.name,
                value: tag.external_id,
              }))}
            />
          </Form.Item>
        ) : (
          <Text> {record.tag.name} </Text>
        ),
      filterIcon: (filtered) => (
        <Tooltip defaultVisible={true} title="Click here to filter">
          {' '}
          <FilterFilled style={{ fontSize: 16, color: filtered ? '#1890ff' : '#00ffd7' }} />{' '}
        </Tooltip>
      ),
      filters: [
        {
          text: 'Empty',
          value: 'empty',
        },
        ...creatorMemberTags.map((tag) => ({
          text: tag.name,
          value: tag.external_id,
        })),
      ],
      onFilter: (value, record) =>
        value === 'empty' ? record.tag.external_id === '' : record.tag.external_id === value,
    },
    {
      title: 'Actions',
      width: '7%',
      render: (record) => (
        <Row gutter={[8, 8]} justify="end">
          {record.id === selectedMember?.id ? (
            <>
              <Col xs={12}>
                <Tooltip title="Save Member Tag">
                  <Button block type="link" icon={<SaveOutlined />} onClick={() => updateSelectedMemberTag()} />
                </Tooltip>
              </Col>
              <Col xs={12}>
                <Tooltip title="Cancel Changes">
                  <Button block type="link" icon={<CloseCircleOutlined />} onClick={() => setSelectedMember(null)} />
                </Tooltip>
              </Col>
            </>
          ) : (
            <Col xs={24}>
              <Tooltip title="Edit Member Tag">
                <Button block type="link" icon={<EditOutlined />} onClick={() => setSelectedMember(record)} />
              </Tooltip>
            </Col>
          )}
        </Row>
      ),
    },
  ];

  // TODO: Test and Fix/improve mobile UI Later
  const renderMobileMembersCard = (member) => {
    return (
      <Col xs={24} key={member.id}>
        <Card
          title={
            <Title level={5}>
              {member.first_name} {member.last_name || ''}
            </Title>
          }
          action={
            member.id === selectedMember?.id
              ? [
                  <Tooltip title="Save Member Tag">
                    <Button block type="link" icon={<SaveOutlined />} onClick={() => updateSelectedMemberTag()} />
                  </Tooltip>,
                  <Tooltip title="Cancel Changes">
                    <Button block type="link" icon={<CloseCircleOutlined />} onClick={() => setSelectedMember(null)} />
                  </Tooltip>,
                ]
              : [
                  <Tooltip title="Edit Member Tag">
                    <Button block type="link" icon={<EditOutlined />} onClick={() => setSelectedMember(member)} />
                  </Tooltip>,
                ]
          }
        >
          <Row gutter={[8, 8]}>
            <Col xs={4}>Tag :</Col>
            <Col xs={20}>
              {member.id === selectedMember?.id ? (
                <Form.Item noStyle name={member.id}>
                  <Select
                    className={styles.tagDropdownContainer}
                    placeholder="Select the member tag"
                    defaultValue={member.tag.external_id || null}
                    options={creatorMemberTags.map((tag) => ({
                      label: tag.name,
                      value: tag.external_id,
                    }))}
                  />
                </Form.Item>
              ) : (
                <Text> {member.tag.name} </Text>
              )}
            </Col>
          </Row>
        </Card>
      </Col>
    );
  };

  return (
    <div className={styles.box}>
      <Row gutter={[16, 16]}>
        <Col xs={24}>
          <Title level={4}> Members List </Title>
        </Col>
        <Col xs={24}>
          <Form form={form} scrollToFirstError={true}>
            {isMobileDevice ? (
              <Loader loading={isLoading} size="large" text="Fetching members list...">
                {membersList.length > 0 ? (
                  <Row gutter={[8, 8]} justify="center">
                    {membersList.map(renderMobileMembersCard)}
                  </Row>
                ) : (
                  <Empty description="No members found" />
                )}
              </Loader>
            ) : (
              <Row gutter={[8, 16]} justify="center">
                <Col xs={24}>
                  <Table
                    size="small"
                    loading={isLoading}
                    data={membersList}
                    columns={membersListColumns}
                    rowKey={(record) => record.id}
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
                    Show more members
                  </Button>
                </Col>
              </Row>
            )}
          </Form>
        </Col>
      </Row>
    </div>
  );
};

export default MembersList;
