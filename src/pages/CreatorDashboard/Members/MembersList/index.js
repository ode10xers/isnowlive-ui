import React, { useState, useCallback, useEffect } from 'react';
import { Row, Col, Button, Form, Select, Typography, Card, Empty, Tooltip, Modal } from 'antd';
import { SaveOutlined, EditOutlined, FilterFilled, CloseCircleOutlined, CheckCircleTwoTone } from '@ant-design/icons';

import apis from 'apis';

import Table from 'components/Table';
import Loader from 'components/Loader';
import { showErrorModal, showSuccessModal } from 'components/Modals/modals';

import { isAPISuccess } from 'utils/helper';
import { isMobileDevice } from 'utils/device';

import styles from './styles.module.scss';

const { Text, Title, Paragraph } = Typography;

const MembersList = () => {
  const [form] = Form.useForm();

  const [isLoading, setIsLoading] = useState(false);
  const [membersList, setMembersList] = useState([]);
  const [selectedMember, setSelectedMember] = useState(null);

  const [pageNumber, setPageNumber] = useState(1);
  const [canShowMore, setCanShowMore] = useState(false);
  const totalItemsPerPage = 10;

  const [creatorMemberTags, setCreatorMemberTags] = useState([]);
  // isPrivateCommunity will be true when the user settings 'member_requires_invite' is true
  const [isPrivateCommunity, setIsPrivateCommunity] = useState(false);

  const fetchCreatorMemberTags = useCallback(async () => {
    setIsLoading(true);

    try {
      const { status, data } = await apis.user.getCreatorSettings();

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

  const fetchCreatorPrivateCommunityFlag = useCallback(async () => {
    setIsLoading(false);
    try {
      const { status, data } = await apis.user.getCreatorSettings();

      if (isAPISuccess(status) && data) {
        setIsPrivateCommunity(data.member_requires_invite);
      }
    } catch (error) {
      showErrorModal(
        'Failed fetching creator private community settings',
        error?.response?.data?.message || 'Something went wrong.'
      );
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

  const updateMemberApprovalStatus = (externalId, is_approved) => {
    const selectedMemberIndex = membersList.findIndex((member) => member.id === externalId);

    if (selectedMemberIndex >= 0) {
      const tempMembersList = membersList;
      tempMembersList[selectedMemberIndex].is_approved = is_approved ?? true;
      setMembersList(tempMembersList);
    }
  };

  useEffect(() => {
    fetchCreatorMemberTags();
    fetchCreatorPrivateCommunityFlag();
  }, [fetchCreatorMemberTags, fetchCreatorPrivateCommunityFlag]);

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

  const approveMemberRequest = async (memberId) => {
    setIsLoading(true);

    try {
      const payload = {
        external_id: memberId,
        is_approved: true,
      };

      const { status } = await apis.audiences.setCreatorMemberRequestApproval(payload);

      if (isAPISuccess(status)) {
        showSuccessModal('Member join request approved!');
        updateMemberApprovalStatus(memberId, true);
      }
    } catch (error) {
      showErrorModal('Failed approving member request', error?.response?.data?.message || 'Something went wrong.');
    }

    setIsLoading(false);
  };

  const banMember = async (memberId) => {
    setIsLoading(true);

    try {
      const payload = {
        external_id: memberId,
        is_approved: false,
      };

      const { status } = await apis.audiences.setCreatorMemberRequestApproval(payload);

      if (isAPISuccess(status)) {
        showSuccessModal('Member has been removed!');
        updateMemberApprovalStatus(memberId, false);
      }
    } catch (error) {
      showErrorModal('Failed removing member', error?.response?.data?.message || 'Something went wrong.');
    }

    setIsLoading(false);
  };

  const handleBanMemberClicked = (memberId) => {
    Modal.confirm({
      title: 'Remove member?',
      content: (
        <>
          <Paragraph>
            Are you sure you want to remove this member? Doing this means they won't be able to access your content
          </Paragraph>
          <Paragraph>You can approve them again so to allow them to access your content.</Paragraph>
        </>
      ),
      okText: 'Yes, remove member',
      okButtonProps: { danger: true, type: 'primary' },
      onOk: () => banMember(memberId),
    });
  };

  const generateMembersListColumns = useCallback(
    () => {
      const initialColumns = [
        {
          title: 'First Name',
          dataIndex: 'first_name',
          key: 'first_name',
        },
        {
          title: 'Last Name',
          dataIndex: 'last_name',
          key: 'last_name',
          render: (text, record) => record.last_name || '-',
        },
      ];

      if (creatorMemberTags.length > 0) {
        const tagColumnPosition = 2;

        const tagColumnObject = {
          title: 'Tag',
          width: '180px',
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
        };

        // Since currently actions are only related to tags, we will also show/hide
        // it based on whether or not creator has tags
        const actionsColumnObject = {
          title: 'Actions',
          width: '90px',
          align: 'right',
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
                      <Button
                        block
                        type="link"
                        icon={<CloseCircleOutlined />}
                        onClick={() => setSelectedMember(null)}
                      />
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
        };

        initialColumns.splice(tagColumnPosition, 0, tagColumnObject, actionsColumnObject);
      }

      if (isPrivateCommunity) {
        // For this column we will put it in the last column, so we can use push()
        const memberApprovalColumnObject = {
          title: 'Member Request',
          dataIndex: 'is_approved',
          key: 'is_approved',
          width: '280px',
          render: (text, record) =>
            record.is_approved ? (
              <Row align="middle" gutter={[12, 12]}>
                <Col>
                  <CheckCircleTwoTone twoToneColor="#52c41a" /> <Text type="success"> Joined </Text>
                </Col>
                <Col>
                  <Button className={styles.orangeBtn} type="primary" onClick={() => handleBanMemberClicked(record.id)}>
                    Remove
                  </Button>
                </Col>
              </Row>
            ) : (
              <Button type="primary" onClick={() => approveMemberRequest(record.id)}>
                Allow
              </Button>
            ),
        };

        initialColumns.push(memberApprovalColumnObject);
      }

      return initialColumns;
    }, //eslint-disable-next-line
    [creatorMemberTags, isPrivateCommunity, selectedMember]
  );

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
          {isPrivateCommunity && (
            <Row gutter={[8, 8]}>
              <Col xs={12}>Member Request:</Col>
              <Col xs={12}>
                {member.is_approved ? (
                  <>
                    {' '}
                    <CheckCircleTwoTone twoToneColor="#52c41a" /> <Text type="success"> Joined </Text>{' '}
                  </>
                ) : (
                  <Button block type="primary" onClick={() => approveMemberRequest(member.id)}>
                    Allow
                  </Button>
                )}
              </Col>
            </Row>
          )}
          {creatorMemberTags.length > 0 && (
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
          )}
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
                    columns={generateMembersListColumns()}
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
