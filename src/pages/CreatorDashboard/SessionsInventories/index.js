import React, { useState, useEffect, useCallback } from 'react';
import { Row, Col, Typography, Popconfirm, Button, Card, Radio, Empty, Tooltip } from 'antd';
import {
  DeleteOutlined,
  DownCircleOutlined,
  UpCircleOutlined,
  CopyOutlined,
  EyeInvisibleOutlined,
  PlayCircleOutlined,
  VideoCameraAddOutlined,
  InfoCircleOutlined,
  BookTwoTone,
  MailOutlined,
  CompassOutlined,
} from '@ant-design/icons';
import { useHistory, useLocation } from 'react-router-dom';

import apis from 'apis';
import Routes from 'routes';

import Table from 'components/Table';
import Loader from 'components/Loader';
import CalendarView from 'components/CalendarView';
import ZoomDetailsModal from 'components/ZoomDetailsModal';
import EventAddressModal from 'components/EventAddressModal';
import { showErrorModal, showSuccessModal } from 'components/Modals/modals';

import dateUtil from 'utils/date';
import { isMobileDevice } from 'utils/device';
import { getLocalUserDetails } from 'utils/storage';
import { isAPISuccess, getDuration, generateUrlFromUsername, copyToClipboard, productType } from 'utils/helper';

import {
  mixPanelEventTags,
  trackSimpleEvent,
  trackSuccessEvent,
  trackFailedEvent,
} from 'services/integrations/mixpanel';
import { useGlobalContext } from 'services/globalContext';

import Icons from 'assets/icons';

import styles from './styles.module.scss';

const {
  formatDate: { toLocaleTime, toLongDateWithDay, toLongDateWithLongDay, toLocaleDate },
} = dateUtil;
const { Text, Title } = Typography;
const { creator } = mixPanelEventTags;

const whiteColor = '#FFFFFF';

const SessionsInventories = ({ match }) => {
  const { showSendEmailPopup } = useGlobalContext();

  const history = useHistory();
  const location = useLocation();
  const isAvailability = location.pathname.includes(Routes.creatorDashboard.availabilities.split(':')[0]);
  const [isLoading, setIsLoading] = useState(true);
  const [sessions, setSessions] = useState([]);
  const [filteredByDateSession, setFilteredByDateSession] = useState([]);
  const [isPast, setIsPast] = useState(false);
  const [view, setView] = useState('list');
  const [calendarView, setCalendarView] = useState(isMobileDevice ? 'day' : 'month');
  const [expandedRowKeys, setExpandedRowKeys] = useState([]);
  const [zoomDetailsModalVisible, setZoomDetailsModalVisible] = useState(false);
  const [offlineEventAddressModalVisible, setOfflineEventAddressModalVisible] = useState(false);
  const [selectedInventoryForModal, setSelectedInventoryForModal] = useState(null);

  const getStaffSession = useCallback(
    async (sessionType) => {
      try {
        const { data } = isAvailability
          ? sessionType === 'past'
            ? await apis.availabilities.getPastAvailability()
            : await apis.availabilities.getUpcomingAvailability()
          : sessionType === 'past'
          ? await apis.session.getPastSession()
          : await apis.session.getUpcomingSession();

        if (data && data.length > 0) {
          const unfilteredSessions = data.map((i, index) => ({
            index,
            key: i?.inventory_id,
            name: i.name,
            type: i.max_participants > 1 ? 'Group' : '1-on-1',
            duration: getDuration(i.start_time, i.end_time),
            days: i?.start_time ? toLongDateWithDay(i.start_time) : null,
            session_date: i?.session_date,
            time: i?.start_time && i.end_time ? `${toLocaleTime(i.start_time)} - ${toLocaleTime(i.end_time)}` : null,
            start_time: i?.start_time,
            end_time: i?.end_time,
            num_participants: i.num_participants,
            participants: i.participants,
            start_url: i.start_url,
            inventory_id: i?.inventory_id,
            session_id: i.session_id,
            max_participants: i.max_participants,
            color_code: i.color_code,
            is_published: i.is_published,
            is_course: i.is_course,
            external_id: i.inventory_external_id,
            inventory_external_id: i.inventory_external_id,
            is_offline: i.is_offline,
            offline_event_address: i.offline_event_address,
          }));

          let filterByDateSessions = [];

          unfilteredSessions.forEach((session) => {
            const foundIndex = filterByDateSessions.findIndex(
              (val) => val.start_time === toLocaleDate(session.start_time)
            );

            if (foundIndex >= 0) {
              filterByDateSessions[foundIndex].children.push(session);
            } else {
              filterByDateSessions.push({
                start_time: toLocaleDate(session.start_time),
                name: session.start_time,
                is_date: true,
                children: [session],
              });
            }
          });
          setSessions(unfilteredSessions);
          setFilteredByDateSession(filterByDateSessions);

          if (filterByDateSessions.length > 0) {
            setExpandedRowKeys([filterByDateSessions[0].start_time]);
          }
        }
        setIsLoading(false);
      } catch (error) {
        showErrorModal('Something went wrong', error.response?.data?.message);
        setIsLoading(false);
      }
    },
    [isAvailability]
  );

  useEffect(() => {
    if (match?.params?.session_type) {
      setExpandedRowKeys([]);
      setSessions([]);
      setIsLoading(true);
      if (match?.params?.session_type === 'past') {
        setIsPast(true);
      } else {
        setIsPast(false);
      }
      getStaffSession(match?.params?.session_type);
    }
  }, [match.params.session_type, getStaffSession]);

  const showEmailPopup = (inventory) => {
    // Since user cannot book past inventory, we only have one type here
    // either active if upcoming or expired if past
    showSendEmailPopup({
      recipients: {
        active: isPast ? [] : inventory.participants || [],
        expired: isPast ? inventory.participants || [] : [],
      },
      productId: inventory.external_id,
      productType: productType.CLASS,
    });
  };

  const trackAndStartSession = (data) => {
    const eventTag = isMobileDevice
      ? creator.click.sessions.list.mobile.startSession
      : creator.click.sessions.list.startSession;

    trackSimpleEvent(eventTag, { session_data: data });
    window.open(data.start_url);
  };

  const openSessionInventoryDetails = (item) => {
    const eventTag = isMobileDevice
      ? creator.click.sessions.list.mobile.sessionDetails
      : isPast
      ? creator.click.sessions.list.pastSessionsDetails
      : creator.click.sessions.list.upcomingSessionsDetails;

    trackSimpleEvent(eventTag, { session_data: item });

    if (item.inventory_id) {
      history.push(
        `${Routes.creatorDashboard.rootPath}/${isAvailability ? 'availabilities' : 'sessions'}/e/${
          item.inventory_id
        }/details`
      );
    }
  };

  const deleteInventory = async (inventory_id) => {
    const eventTag = creator.click.sessions.list.cancelSession;

    try {
      const { status } = await apis.session.delete(JSON.stringify([inventory_id]));
      if (isAPISuccess(status)) {
        trackSuccessEvent(eventTag, { inventory_id: inventory_id });
        getStaffSession(match?.params?.session_type);
        showSuccessModal('Event has been cancelled');
      }
    } catch (error) {
      trackFailedEvent(eventTag, error, { inventory_id: inventory_id });
      showErrorModal('Something went wrong', error.response?.data?.message);
    }
  };

  const copyInventoryLink = (inventoryId) => {
    const username = getLocalUserDetails().username;
    const pageLink = `${generateUrlFromUsername(username)}/e/${inventoryId}`;

    copyToClipboard(pageLink);
  };

  const emptyTableCell = {
    props: {
      colSpan: 0,
      rowSpan: 0,
    },
  };

  const renderSimpleTableCell = (shouldNotRender, text) => (shouldNotRender ? emptyTableCell : <Text> {text} </Text>);

  const toggleExpandAll = () => {
    if (expandedRowKeys.length > 0) {
      setExpandedRowKeys([]);
    } else {
      setExpandedRowKeys(filteredByDateSession.map((date) => date.start_time));
    }
  };

  const expandRow = (rowKey) => {
    const tempExpandedRowsArray = expandedRowKeys;
    tempExpandedRowsArray.push(rowKey);
    setExpandedRowKeys([...new Set(tempExpandedRowsArray)]);
  };

  const collapseRow = (rowKey) => setExpandedRowKeys(expandedRowKeys.filter((key) => key !== rowKey));

  let dateColumns = [
    {
      title: `${isAvailability ? 'Availability' : 'Session'} Name`,
      dataIndex: 'name',
      key: 'name',
      render: (text, record) => {
        if (record.is_date) {
          return {
            props: {
              colSpan: 6,
            },
            children: (
              <Text strong className={styles.textAlignLeft}>
                {toLongDateWithLongDay(text)}
              </Text>
            ),
          };
        } else {
          return {
            props: {
              style: {
                borderLeft: `6px solid ${record.color_code || whiteColor}`,
              },
            },
            children: (
              <>
                <Text className={styles.sessionNameWrapper}>{record.name}</Text>{' '}
                {record.is_published ? null : <EyeInvisibleOutlined style={{ color: '#f00' }} />}{' '}
                {record.is_course ? <BookTwoTone twoToneColor="#1890ff" /> : null}
              </>
            ),
          };
        }
      },
    },
    {
      title: 'Type',
      dataIndex: 'type',
      key: 'type',
      width: '78px',
      render: (text, record) => renderSimpleTableCell(record.is_date, text),
    },
    {
      title: 'Duration',
      dataIndex: 'duration',
      key: 'duration',
      width: '90px',
      render: (text, record) => renderSimpleTableCell(record.is_date, text),
    },
    {
      title: 'Time',
      dataIndex: 'time',
      key: 'time',
      width: '165px',
      render: (text, record) => renderSimpleTableCell(record.is_date, text),
    },
    {
      title: 'Participants',
      key: 'num_participants',
      dataIndex: 'num_participants',
      width: '110px',
      render: (text, record) =>
        renderSimpleTableCell(record.is_date, `${record.num_participants || 0} / ${record.max_participants}`),
    },
    {
      title: (
        <Button block ghost type="primary" onClick={() => toggleExpandAll()}>
          {expandedRowKeys.length > 0 ? 'Collapse' : 'Expand'} All
        </Button>
      ),
      width: '200px',
      render: (text, record) => {
        if (record.is_date) {
          return emptyTableCell;
        }

        const isDisabled = record.num_participants > 0;
        return isPast ? (
          <Row justify="start">
            <Col>
              <Tooltip title="Send Customer Email">
                <Button type="text" onClick={() => showEmailPopup(record)} icon={<MailOutlined />} />
              </Tooltip>
            </Col>
            <Col>
              <Tooltip title="Event Details">
                <Button
                  type="link"
                  className={styles.detailsButton}
                  onClick={() => openSessionInventoryDetails(record)}
                  icon={<InfoCircleOutlined />}
                />
              </Tooltip>
            </Col>
          </Row>
        ) : (
          <Row justify="start" gutter={[8, 8]}>
            <Col md={24} lg={24} xl={4}>
              <Tooltip title="Send Customer Email">
                <Button type="text" onClick={() => showEmailPopup(record)} icon={<MailOutlined />} />
              </Tooltip>
            </Col>
            <Col md={24} lg={24} xl={4}>
              <Tooltip title="Edit Event Details">
                <Button
                  type="link"
                  className={styles.detailsButton}
                  onClick={() => openSessionInventoryDetails(record)}
                  icon={<InfoCircleOutlined />}
                />
              </Tooltip>
            </Col>
            <Col md={24} lg={24} xl={4}>
              <Tooltip title="Copy Event Page Link">
                <Button type="text" onClick={() => copyInventoryLink(record.inventory_id)} icon={<CopyOutlined />} />
              </Tooltip>
            </Col>
            <Col md={24} lg={24} xl={4}>
              {isDisabled ? (
                <Tooltip title="Event cannot be cancelled">
                  <Button type="text" disabled icon={<DeleteOutlined />} />
                </Tooltip>
              ) : (
                <Popconfirm
                  title={`Do you want to cancel ${isAvailability ? 'availability' : 'session'}?`}
                  icon={<DeleteOutlined className={styles.danger} />}
                  okText="Yes"
                  cancelText="No"
                  onConfirm={() => deleteInventory(record.inventory_id)}
                >
                  <Tooltip title="Cancel event">
                    <Button type="text" danger icon={<DeleteOutlined />} />
                  </Tooltip>
                </Popconfirm>
              )}
            </Col>

            {!isPast &&
              (record.is_offline ? (
                <Col md={24} lg={24} xl={4}>
                  <Tooltip title="Edit event location">
                    <Button
                      icon={<CompassOutlined />}
                      type="link"
                      onClick={() => showOfflineEventAddressModal(record)}
                    />
                  </Tooltip>
                </Col>
              ) : record.start_url ? (
                <>
                  <Col md={24} lg={24} xl={4}>
                    <Tooltip title="Show Zoom Meeting Details">
                      <Button type="link" icon={<Icons.VideoLink />} onClick={() => showZoomDetailsModal(record)} />
                    </Tooltip>
                  </Col>
                  <Col md={24} lg={24} xl={4}>
                    <Tooltip title="Start event">
                      <Button
                        type="text"
                        onClick={() => trackAndStartSession(record)}
                        icon={<PlayCircleOutlined style={{ color: '#52c41a' }} />}
                      />
                    </Tooltip>
                  </Col>
                </>
              ) : (
                <Col md={24} lg={24} xl={4}>
                  <Tooltip title="Add Zoom Meeting Details">
                    <Button
                      type="link"
                      icon={<VideoCameraAddOutlined />}
                      onClick={() => showZoomDetailsModal(record)}
                    />
                  </Tooltip>
                </Col>
              ))}
          </Row>
        );
      },
    },
  ];

  let mobileTableColumns = [
    {
      title: '',
      dataIndex: 'name',
      key: 'name',
      render: (text, record) => (
        <Text strong className={styles.textAlignLeft}>
          {toLongDateWithLongDay(text)}
        </Text>
      ),
    },
  ];

  const renderSessionItem = (item) => {
    const isCancelDisabled = item.num_participants > 0;

    const layout = (label, value) => (
      <Row>
        <Col span={8}>
          <Text strong>{label}</Text>
        </Col>
        <Col span={16}>: {value}</Col>
      </Row>
    );

    const offlineEventAddressEditButton = (
      <Tooltip title="Edit event location">
        <Button icon={<CompassOutlined />} type="link" onClick={() => showOfflineEventAddressModal(item)} />
      </Tooltip>
    );

    const meetingDetailsButton = (
      <Tooltip title="Show Zoom Meeting Details">
        <Button type="link" icon={<Icons.VideoLink />} onClick={() => showZoomDetailsModal(item)} />
      </Tooltip>
    );

    const startMeetingButton = (
      <Tooltip title="Start event">
        <Button
          type="text"
          onClick={() => trackAndStartSession(item)}
          icon={<PlayCircleOutlined style={{ color: '#52c41a' }} />}
        />
      </Tooltip>
    );

    const addMeetingDetailsButton = (
      <Tooltip title="Add Zoom Meeting Details">
        <Button type="link" icon={<VideoCameraAddOutlined />} onClick={() => showZoomDetailsModal(item)} />
      </Tooltip>
    );

    const actionButtons = [
      <Tooltip title="Send Customer Email">
        <Button type="text" onClick={() => showEmailPopup(item)} icon={<MailOutlined />} />
      </Tooltip>,
      isPast ? (
        <Tooltip title="Event Details">
          <Button type="link" onClick={() => openSessionInventoryDetails(item)} icon={<InfoCircleOutlined />} />
        </Tooltip>
      ) : (
        <Tooltip title="Edit Event Details">
          <Button type="link" onClick={() => openSessionInventoryDetails(item)} icon={<InfoCircleOutlined />} />
        </Tooltip>
      ),
      <Tooltip title="Copy Event Page Link">
        <Button type="text" onClick={() => copyInventoryLink(item.inventory_id)} icon={<CopyOutlined />} />
      </Tooltip>,
      isCancelDisabled ? (
        <Tooltip title="Event cannot be cancelled">
          <Button type="text" disabled icon={<DeleteOutlined />} />
        </Tooltip>
      ) : (
        <Popconfirm
          title={`Do you want to cancel ${isAvailability ? 'availability' : 'session'}?`}
          icon={<DeleteOutlined className={styles.danger} />}
          okText="Yes"
          cancelText={'No'}
          onConfirm={() => deleteInventory(item.inventory_id)}
        >
          <Tooltip title="Cancel event">
            <Button type="text" danger icon={<DeleteOutlined />} />
          </Tooltip>
        </Popconfirm>
      ),
    ];

    if (!isPast) {
      if (item.is_offline) {
        actionButtons.push(offlineEventAddressEditButton);
      } else {
        if (item.start_url) {
          actionButtons.push(meetingDetailsButton);
          actionButtons.push(startMeetingButton);
        } else {
          actionButtons.push(addMeetingDetailsButton);
        }
      }
    }

    return (
      <Card
        key={`${item.session_id}_${item.start_time}`}
        className={item.is_published ? styles.card : styles.unpublished}
        actions={actionButtons}
        title={
          <div
            style={{ paddingTop: 12, borderTop: `6px solid ${item.color_code || whiteColor}` }}
            onClick={() => openSessionInventoryDetails(item)}
          >
            {item.is_published ? null : <EyeInvisibleOutlined style={{ color: '#f00' }} />} <Text>{item.name}</Text>{' '}
            {item.is_course ? <BookTwoTone twoToneColor="#1890ff" /> : null}
          </div>
        }
      >
        {layout('Type', <Text>{item.type}</Text>)}
        {layout('Duration', <Text>{item.duration}</Text>)}
        {layout('Time', <Text>{item.time}</Text>)}
        {layout(
          'Attendees',
          <Text>
            {item.num_participants || 0} {'/'} {item.max_participants}
          </Text>
        )}
      </Card>
    );
  };

  const handleViewChange = (e) => {
    setView(e.target.value);
  };

  const onViewChange = (e) => {
    setCalendarView(e);
  };

  const showZoomDetailsModal = (selectedInventory) => {
    setSelectedInventoryForModal(selectedInventory);
    setZoomDetailsModalVisible(true);
  };

  const handleCloseZoomDetailsModal = (shouldRefresh = false) => {
    setSelectedInventoryForModal(null);
    setZoomDetailsModalVisible(false);

    if (shouldRefresh) {
      setIsLoading(true);
      getStaffSession(isPast ? 'past' : 'upcoming');
    }
  };

  const showOfflineEventAddressModal = (selectedInventory) => {
    setSelectedInventoryForModal(selectedInventory);
    setOfflineEventAddressModalVisible(true);
  };

  const handleCloseOfflineEventAddressModal = (shouldRefresh = false) => {
    setSelectedInventoryForModal(null);
    setOfflineEventAddressModalVisible(false);

    if (shouldRefresh) {
      setIsLoading(true);
      getStaffSession(isPast ? 'past' : 'upcoming');
    }
  };

  return (
    <>
      <EventAddressModal
        visible={offlineEventAddressModalVisible}
        closeModal={handleCloseOfflineEventAddressModal}
        inventory={selectedInventoryForModal}
      />
      <ZoomDetailsModal
        visible={zoomDetailsModalVisible}
        selectedInventory={selectedInventoryForModal}
        closeModal={handleCloseZoomDetailsModal}
      />
      <div className={styles.box}>
        <Row gutter={[8, 8]}>
          <Col xs={24} md={18} lg={20}>
            <Title level={4}>
              {isPast ? 'Past' : 'Upcoming'} {isAvailability ? 'Availabilities' : 'Sessions'}
            </Title>
            <Radio.Group value={view} onChange={handleViewChange}>
              <Radio.Button value="list">List</Radio.Button>
              <Radio.Button value="calendar">Calendar</Radio.Button>
            </Radio.Group>
          </Col>

          <Col xs={24}>
            {view === 'calendar' ? (
              <Loader
                loading={isLoading}
                size="large"
                text={`Loading ${isAvailability ? 'availabilities' : 'sessions'}`}
              >
                {sessions.length > 0 ? (
                  <CalendarView
                    inventories={sessions}
                    onSelectInventory={openSessionInventoryDetails}
                    onViewChange={onViewChange}
                    calendarView={calendarView}
                  />
                ) : (
                  <Empty />
                )}
              </Loader>
            ) : (
              <>
                {isMobileDevice ? (
                  <Loader
                    loading={isLoading}
                    size="large"
                    text={`Loading ${isAvailability ? 'availabilities' : 'sessions'}`}
                  >
                    {sessions.length > 0 ? (
                      <Table
                        columns={mobileTableColumns}
                        data={filteredByDateSession.map((session) => ({
                          session_id: session.session_id,
                          start_time: session.start_time,
                          name: session.name,
                          is_date: session.is_date,
                          sessions: session.children,
                        }))}
                        loading={isLoading}
                        rowKey={(record) =>
                          record.is_date ? record.start_time : `${record.session_id}_${record.start_time}`
                        }
                        expandable={{
                          expandedRowRender: (record) => <> {record.sessions.map(renderSessionItem)} </>,
                          expandRowByClick: true,
                          onExpand: (expanded, record) => {
                            if (expanded) {
                              expandRow(record.start_time);
                            } else {
                              collapseRow(record.start_time);
                            }
                          },
                          expandedRowKeys: expandedRowKeys,
                          expandIcon: ({ expanded, onExpand, record }) =>
                            expanded ? (
                              <UpCircleOutlined style={{ fontSize: 20 }} onClick={(e) => onExpand(record, e)} />
                            ) : (
                              <DownCircleOutlined style={{ fontSize: 20 }} onClick={(e) => onExpand(record, e)} />
                            ),
                        }}
                      />
                    ) : (
                      <div className="text-empty">
                        No {isPast ? 'Past' : 'Upcoming'} {isAvailability ? 'Availability' : 'Session'}
                      </div>
                    )}
                  </Loader>
                ) : filteredByDateSession.length > 0 ? (
                  <Table
                    sticky={true}
                    columns={dateColumns}
                    data={filteredByDateSession}
                    loading={isLoading}
                    rowKey={(record) =>
                      record.is_date ? record.start_time : `${record.session_id}_${record.start_time}`
                    }
                    rowClassName={(record, index) =>
                      !record.is_date && !record.is_published ? styles.unpublished : ''
                    }
                    expandable={{
                      expandedRowKeys: expandedRowKeys,
                      onExpand: (expanded, record) => {
                        if (expanded) {
                          expandRow(record.start_time);
                        } else {
                          collapseRow(record.start_time);
                        }
                      },
                    }}
                  />
                ) : (
                  <div className="text-empty">
                    No {isPast ? 'Past' : 'Upcoming'} {isAvailability ? 'Availability' : 'Session'}
                  </div>
                )}
              </>
            )}
          </Col>
        </Row>
      </div>
    </>
  );
};

export default SessionsInventories;
