import React, { useState, useCallback, useEffect } from 'react';
import moment from 'moment';

import {
  Row,
  Col,
  Button,
  Form,
  Select,
  Space,
  Input,
  Grid,
  Radio,
  Typography,
  DatePicker,
  Card,
  Empty,
  Tag,
  Modal,
} from 'antd';
import { CheckCircleTwoTone } from '@ant-design/icons';

import apis from 'apis';

import Table from 'components/Table';
import Loader from 'components/Loader';
import { showErrorModal, showSuccessModal } from 'components/Modals/modals';

import { isAPISuccess } from 'utils/helper';
import { tagColors } from 'utils/colors';
import dateUtil from 'utils/date';

import styles from './styles.module.scss';

const { Text, Title, Paragraph } = Typography;
const { RangePicker } = DatePicker;
const { useBreakpoint } = Grid;
const { Search } = Input;

const {
  formatDate: { toShortDateWithYear },
} = dateUtil;

const memberViews = {
  ACTIVE: {
    label: 'Active Members',
    value: 'active',
  },
  ARCHIVED: {
    label: 'Inactive Members',
    value: 'archive',
  },
};

const memberActivityFilterOptions = {
  ALL: {
    label: 'Show All',
    value: 'all',
  },
  ALL_INACTIVE: {
    label: 'Inactive for',
    value: 'all_inactive',
  },
  VIDEO_INACTIVE: {
    label: 'No videos bought since',
    value: 'video_inactive',
  },
  SESSION_INACTIVE: {
    label: 'No sessions bought since',
    value: 'session_inactive',
  },
};

const MembersList = () => {
  const { lg } = useBreakpoint();
  const [form] = Form.useForm();

  const [isLoading, setIsLoading] = useState(false);
  const [membersList, setMembersList] = useState([]);
  const [selectedMember, setSelectedMember] = useState(null);
  const [archiveView, setArchiveView] = useState(memberViews.ACTIVE.value);

  const [searchString, setSearchString] = useState(null);
  const [pageNumber, setPageNumber] = useState(1);
  const [canShowMore, setCanShowMore] = useState(false);
  const totalItemsPerPage = 10;

  const [creatorMemberTags, setCreatorMemberTags] = useState([]);
  // isPrivateCommunity will be true when the user settings 'member_requires_invite' is true
  const [isPrivateCommunity, setIsPrivateCommunity] = useState(false);

  const [selectedMemberActivityFilter, setSelectedMemberActivityFilter] = useState(
    memberActivityFilterOptions.ALL.value
  );
  const [selectedTagFilters, setSelectedTagFilters] = useState([]);
  const [selectedFilterDuration, setSelectedFilterDuration] = useState([
    moment().startOf('day').subtract(7, 'days'),
    moment().endOf('day'),
  ]);

  const fetchCreatorMemberTags = useCallback(async () => {
    setIsLoading(true);

    try {
      const { status, data } = await apis.user.getCreatorSettings();

      if (isAPISuccess(status) && data) {
        setCreatorMemberTags(data.tags.map((tag, idx) => ({ ...tag, color: tagColors[idx % tagColors.length] })));
      }
    } catch (error) {
      showErrorModal('Failed fetching creator members tags', error?.response?.data?.message || 'Something went wrong.');
    }

    setIsLoading(false);
  }, []);

  const fetchCreatorMembersList = useCallback(async (pageNo, perPage, filters = {}) => {
    setIsLoading(true);
    try {
      const { searchText = null } = filters;

      const queryData = {
        pageNo,
        perPage,
        ...filters,
      };

      const { status, data } =
        searchText && searchText.length > 0
          ? await apis.audiences.searchCreatorMembers(queryData)
          : await apis.audiences.getCreatorMembers(queryData);

      if (isAPISuccess(status) && data) {
        setMembersList((memberList) => [...memberList, ...data.data]);
        setCanShowMore(data.next_page);
      }
    } catch (error) {
      if (!(error?.response?.status === 404 && !error?.response?.data?.audiences)) {
        showErrorModal(
          'Failed fetching creator members list',
          error?.response?.data?.message || 'Something went wrong.'
        );
      }
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

  const resetUIState = () => {
    setPageNumber(1);
    setMembersList([]);
    setSelectedMember(null);
  };

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
    const dateFormat = 'YYYY-MM-DD';
    const activityFilter =
      selectedMemberActivityFilter === memberActivityFilterOptions.ALL.value
        ? {}
        : {
            productType:
              selectedMemberActivityFilter === memberActivityFilterOptions.VIDEO_INACTIVE.value
                ? 'VIDEO'
                : selectedMemberActivityFilter === memberActivityFilterOptions.SESSION_INACTIVE.value
                ? 'SESSION'
                : '',
            startDate: (selectedFilterDuration[0] ?? moment().startOf('day').subtract(7, 'days'))
              ?.utc()
              .format(dateFormat),
            endDate: (selectedFilterDuration[1] ?? moment().endOf()).utc().format(dateFormat),
          };

    const filters = {
      searchText: searchString,
      fetchArchived: archiveView === memberViews.ARCHIVED.value,
      ...activityFilter,
    };

    fetchCreatorMembersList(pageNumber, totalItemsPerPage, filters);
  }, [
    fetchCreatorMembersList,
    pageNumber,
    totalItemsPerPage,
    searchString,
    archiveView,
    selectedMemberActivityFilter,
    selectedFilterDuration,
  ]);

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
        external_ids: [memberId],
      };

      const { status } = await apis.audiences.deleteAudienceFromList(payload);

      if (isAPISuccess(status)) {
        showSuccessModal('Member has been removed!');
        setMembersList((prevList) => prevList.filter((member) => member.id !== memberId));
      }
    } catch (error) {
      showErrorModal('Failed removing member', error?.response?.data?.message || 'Something went wrong.');
    }

    setIsLoading(false);
  };

  const reactivateMember = async (memberId) => {
    setIsLoading(true);
    setSelectedMember(null);

    try {
      const payload = {
        external_ids: [memberId],
      };

      const { status, data } = await apis.audiences.reactivateCreatorMembers(payload);

      if (isAPISuccess(status) && data?.success) {
        showSuccessModal('Member has been reactivated!');
        setMembersList((prevList) => prevList.filter((member) => member.id !== memberId));
      }
    } catch (error) {
      showErrorModal('Failed reactivating member', error?.response?.data?.message || 'Something went wrong.');
    }

    setIsLoading(false);
  };

  const handleBanMemberClicked = (memberId) => {
    setSelectedMember(null);
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

  const handleMemberSearch = (value) => {
    const searchInput = encodeURI(value.trim());
    resetUIState();
    setSearchString(searchInput ?? null);
  };

  const handleArchiveViewChanged = (e) => {
    resetUIState();
    setArchiveView(e.target.value);
  };

  const renderMemberInteractionDetails = useCallback((memberDetails) => {
    const noActivityTag = (
      <Text type="secondary" className={styles.activityText}>
        No Activity
      </Text>
    );

    const { last_membership_name = '', last_membership_expiry = '' } = memberDetails;
    const interactionDetails = memberDetails?.interaction_details ?? null;

    if (!interactionDetails) {
      return noActivityTag;
    }

    // const isInactive = !interactionDetails['session'].external_id && !interactionDetails['video'].external_id;

    // if (isInactive) {
    //   return noActivityTag;
    // }

    // Previously we're using the above check, but for some reason the external_id can still come
    // empty even though the person has bought something so we switched to check their last_interaction
    // date instead
    const isNotActiveRecently =
      moment(interactionDetails['session'].last_interaction).isBefore(moment(0)) &&
      moment(interactionDetails['video'].last_interaction).isBefore(moment(0)) &&
      memberDetails.last_membership_name === '';

    if (isNotActiveRecently) {
      return noActivityTag;
    }

    const activityTags = Object.entries(interactionDetails)
      .map(([productName, activityDetails]) => {
        const activityMoment = moment(activityDetails.last_interaction);

        // Check if it's before 1970-01-01, if it is we consider it invalid
        if (activityMoment.isBefore(moment(0))) {
          return null;
        }

        return (
          <Text key={productName} className={styles.activityText}>
            Last bought a {productName} {activityMoment.fromNow()}
          </Text>
        );
      })
      .filter((tag) => tag);

    if (last_membership_name === '') {
      activityTags.push(
        <Text key="subscription" className={styles.activityText}>
          Never got a membership
        </Text>
      );
    } else {
      const activityMoment = moment(last_membership_expiry);
      let activityText = '';

      // Check if it's before 1970-01-01, if it is we consider it invalid
      if (activityMoment.isBefore(moment(0))) {
        activityText = 'Never bought a membership';
      }

      // Check if the subscription is still valid
      const membershipExpired = activityMoment.isBefore(moment());
      const expiryDate = toShortDateWithYear(activityMoment);
      if (membershipExpired) {
        activityText = `Previously got "${last_membership_name}” membership, which expired at ${expiryDate}`;
      } else {
        activityText = `Currently have "${last_membership_name}” membership, which will expire at ${expiryDate}`;
      }

      activityTags.push(
        <Text key="subscription" className={styles.activityText}>
          {activityText}
        </Text>
      );
    }

    return activityTags.length > 0 ? (
      <Space direction="vertical">{activityTags.map((tag) => tag)}</Space>
    ) : (
      noActivityTag
    );
  }, []);

  const handleMemberActivityFilterChanged = (value) => {
    resetUIState();
    setSelectedMemberActivityFilter(value);
  };

  const handleFilterDurationChanged = (value) => {
    resetUIState();
    setSelectedFilterDuration(value);
  };

  const generateMembersListColumns = useCallback(
    () => {
      const initialColumns = [
        {
          title: 'Full Name',
          dataIndex: 'first_name',
          key: 'first_name',
          width: '220px',
          render: (text, record) => `${record.first_name ?? ''} ${record.last_name ?? '-'}`,
        },
        {
          title: 'Activity',
          dataIndex: 'interaction_details',
          key: 'interaction_details',
          render: (text, record) => renderMemberInteractionDetails(record),
        },
      ];

      if (creatorMemberTags.length > 0) {
        const tagColumnPosition = 3;

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
            ) : record.tag.external_id ? (
              <Tag
                color={creatorMemberTags?.find((tag) => tag.external_id === record.tag?.external_id)?.color ?? 'blue'}
              >
                {record.tag?.name ?? ''}
              </Tag>
            ) : (
              '-'
            ),
        };

        // Since currently actions are only related to tags, we will also show/hide
        // it based on whether or not creator has tags
        const actionsColumnObject = {
          title: '',
          width: '100px',
          render: (record) => (
            <Row gutter={[8, 8]}>
              {record.id === selectedMember?.id ? (
                <>
                  <Col xs={12}>
                    <Button className={styles.greenText} block type="link" onClick={() => updateSelectedMemberTag()}>
                      Save Tag
                    </Button>
                  </Col>
                  <Col xs={12}>
                    <Button block danger type="link" onClick={() => setSelectedMember(null)}>
                      Cancel
                    </Button>
                  </Col>
                </>
              ) : (
                <Col xs={24}>
                  <Button block type="link" onClick={() => setSelectedMember(record)}>
                    Edit Tag
                  </Button>
                </Col>
              )}
            </Row>
          ),
        };

        initialColumns.splice(tagColumnPosition, 0, tagColumnObject, actionsColumnObject);
      }

      const banMemberActions = {
        title: '',
        width: '80px',
        render: (record) =>
          archiveView === memberViews.ARCHIVED.value ? (
            <Button type="primary" onClick={() => reactivateMember(record.id)}>
              Reactivate
            </Button>
          ) : (
            <Button className={styles.orangeBtn} type="primary" onClick={() => handleBanMemberClicked(record.id)}>
              Remove
            </Button>
          ),
      };

      initialColumns.push(banMemberActions);

      if (isPrivateCommunity && archiveView === memberViews.ACTIVE.value) {
        // For this column we will put it in the last column, so we can use push()
        const memberApprovalColumnObject = {
          title: 'Member Request',
          dataIndex: 'is_approved',
          key: 'is_approved',
          align: 'center',
          width: '140px',
          render: (text, record) =>
            record.is_approved ? (
              <>
                <CheckCircleTwoTone twoToneColor="#52c41a" /> <Text type="success"> Joined </Text>
              </>
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
    [creatorMemberTags, isPrivateCommunity, selectedMember, archiveView, renderMemberInteractionDetails]
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
          actions={
            member.id === selectedMember?.id
              ? [
                  <Button className={styles.greenText} block type="link" onClick={() => updateSelectedMemberTag()}>
                    Save Tag
                  </Button>,
                  <Button block danger type="link" onClick={() => setSelectedMember(null)}>
                    Cancel
                  </Button>,
                ]
              : archiveView === memberViews.ARCHIVED.value
              ? [
                  <Button type="primary" onClick={() => reactivateMember(member.id)}>
                    Reactivate
                  </Button>,
                ]
              : [
                  <Button block type="link" onClick={() => setSelectedMember(member)}>
                    Edit Tag
                  </Button>,
                  <Button
                    block
                    className={styles.orangeBtn}
                    type="primary"
                    onClick={() => handleBanMemberClicked(member.id)}
                  >
                    Remove
                  </Button>,
                ]
          }
        >
          <Row gutter={[8, 8]} align="middle">
            {isPrivateCommunity && (
              <Col xs={24}>
                <Space align="middle">
                  <Text>Member Request:</Text>
                  {member.is_approved ? (
                    <>
                      <CheckCircleTwoTone twoToneColor="#52c41a" /> <Text type="success"> Joined </Text>
                    </>
                  ) : (
                    <Button type="primary" onClick={() => approveMemberRequest(member.id)}>
                      Allow
                    </Button>
                  )}
                </Space>
              </Col>
            )}
            {creatorMemberTags.length > 0 && (
              <Col xs={24}>
                <Space align="middle">
                  <Text>Tag :</Text>
                  <div>
                    {member.id === selectedMember?.id ? (
                      <Form.Item noStyle name={member.id}>
                        <Select
                          className={styles.tagDropdownContainer}
                          placeholder="Select the member tag"
                          defaultValue={member.tag?.external_id || null}
                          options={creatorMemberTags.map((tag) => ({
                            label: tag.name,
                            value: tag.external_id,
                          }))}
                        />
                      </Form.Item>
                    ) : member.tag?.external_id ? (
                      <Tag
                        color={
                          creatorMemberTags?.find((tag) => tag.external_id === member.tag?.external_id)?.color ?? 'blue'
                        }
                      >
                        {member.tag?.name ?? ''}
                      </Tag>
                    ) : (
                      '-'
                    )}
                  </div>
                </Space>
              </Col>
            )}
            <Col xs={24}>
              <Space direction="vertical">
                <Text> Activities: </Text>
                {renderMemberInteractionDetails(member)}
              </Space>
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
          <Row gutter={[8, 12]}>
            <Col xs={24} lg={12}>
              <Row gutter={[8, 8]}>
                <Col xs={24}>
                  <Title level={4}> Members List </Title>
                </Col>
                <Col xs={24}>
                  <Row gutter={[8, 8]} align="middle">
                    <Col>
                      <Text> Search members : </Text>
                    </Col>
                    <Col>
                      <Search
                        enterButton="Search"
                        placeholder="Member first/last name"
                        onSearch={handleMemberSearch}
                        className={styles.searchInput}
                      />
                    </Col>
                  </Row>
                  <Paragraph type="secondary" className={styles.mt10}>
                    To see all members, empty the search bar and hit Search again
                  </Paragraph>
                </Col>
                <Col xs={24}>
                  <Radio.Group value={archiveView} onChange={handleArchiveViewChanged}>
                    {Object.values(memberViews).map((view) => (
                      <Radio.Button key={view.value} value={view.value}>
                        {view.label}
                      </Radio.Button>
                    ))}
                  </Radio.Group>
                </Col>
              </Row>
            </Col>
            <Col xs={24} lg={12}>
              <Row gutter={[8, 12]}>
                {creatorMemberTags.length > 0 && (
                  <Col xs={24} md={12}>
                    <Title level={5} className={styles.filterTitle}>
                      Tags
                    </Title>
                    <Select
                      showArrow
                      allowClear
                      mode="multiple"
                      placeholder="Tags to show (empty = all)"
                      maxTagCount={3}
                      value={selectedTagFilters}
                      onChange={setSelectedTagFilters}
                      options={Object.entries(creatorMemberTags).map(([key, val]) => ({
                        label: val.name,
                        value: val.external_id,
                      }))}
                      className={styles.filterDropdown}
                    />
                  </Col>
                )}
                <Col xs={24} md={12}>
                  <Title level={5} className={styles.filterTitle}>
                    Activity
                  </Title>
                  <Select
                    value={selectedMemberActivityFilter}
                    onChange={handleMemberActivityFilterChanged}
                    options={Object.values(memberActivityFilterOptions)}
                    className={styles.filterDropdown}
                  />
                </Col>
                {selectedMemberActivityFilter !== memberActivityFilterOptions.ALL.value && (
                  <Col xs={24}>
                    <Title level={5} className={styles.filterTitle}>
                      Time Period
                    </Title>
                    <RangePicker
                      className={styles.w100}
                      value={selectedFilterDuration}
                      allowEmpty={[false, false]}
                      onChange={handleFilterDurationChanged}
                      disabledDate={(current) => current && current > moment().endOf('day')}
                      ranges={{
                        'Last 7 Days': [moment().startOf('day').subtract(7, 'days'), moment().endOf('day')],
                        'Last 14 Days': [moment().startOf('day').subtract(14, 'days'), moment().endOf('day')],
                        'Last 30 Days': [moment().startOf('day').subtract(30, 'days'), moment().endOf('day')],
                        'Last Month': [
                          moment().subtract(1, 'month').startOf('month'),
                          moment().subtract(1, 'month').endOf('month'),
                        ],
                      }}
                    />
                  </Col>
                )}
              </Row>
            </Col>
          </Row>
        </Col>

        <Col xs={24}>
          <Form form={form} scrollToFirstError={true}>
            {!lg ? (
              <Loader loading={isLoading} size="large" text="Fetching members list...">
                {membersList.length > 0 ? (
                  <Row gutter={[8, 8]} justify="center">
                    {membersList.map(renderMobileMembersCard)}
                    <Col xs={24}>
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
                    data={membersList.filter(
                      (member) => !selectedTagFilters.length || selectedTagFilters.includes(member.tag?.external_id)
                    )}
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
