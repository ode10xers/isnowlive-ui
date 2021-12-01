import React, { useMemo } from 'react';

import { Row, Col, Empty } from 'antd';

import SessionListCard from 'components/DynamicProfileComponents/SessionsProfileComponent/SessionListCard';

const SessionCardGrid = ({ inventories = [] }) => {
  const sessions = useMemo(() => {
    const upcomingInventories = inventories;
    const sessionIds = Array.from(new Set(upcomingInventories.map((inventory) => inventory.session_id)));
    const adjustedSessions = sessionIds
      .map((sessionId) => upcomingInventories.filter((item) => item.session_id === sessionId))
      .map((items) => ({
        beginning: items[0].beginning,
        color_code: items[0].color_code,
        creator_username: items[0].creator_username,
        currency: items[0].currency,
        description: items[0].description,
        document_urls: items[0].document_urls,
        expiry: items[0].expiry,
        group: items[0].group,
        inventory: items.map((item) => ({
          end_time: item.end_time,
          inventory_external_id: item.inventory_external_id,
          inventory_id: item.inventory_id,
          is_published: item.is_published,
          num_participants: item.num_participants,
          offline_event_address: item.offline_event_address,
          participants: item.participants,
          session_date: item.session_date,
          start_time: item.start_time,
          start_url: item.start_url,
        })),
        is_active: items[0].is_active,
        is_course: items[0].is_course,
        is_offline: items[0].is_offline,
        is_refundable: items[0].is_refundable,
        max_participants: items[0].max_participants,
        name: items[0].name,
        offline_event_address: items[0].offline_event_address,
        pay_what_you_want: items[0].pay_what_you_want,
        prerequisites: items[0].prerequisites,
        price: items[0].price,
        recurring: items[0].recurring,
        refund_before_hours: items[0].refund_before_hours,
        session_external_id: items[0].session_external_id,
        session_id: items[0].session_id,
        session_image_url: items[0].session_image_url,
        tags: items[0].tags,
        total_price: items[0].total_price,
        type: items[0].type,
        user_timezone: items[0].user_timezone,
        user_timezone_offset: items[0].user_timezone_offset,
      }));

    return adjustedSessions ?? [];
  }, [inventories]);

  const renderSessionCards = (session) => (
    <Col xs={24} md={12} lg={8} key={`${session.session_external_id}_${session?.inventory_id ?? session?.session_id}`}>
      <SessionListCard session={session} />
    </Col>
  );

  return (
    <div>
      {sessions.length > 0 ? (
        <Row gutter={[8, 8]}>{sessions.map(renderSessionCards)}</Row>
      ) : (
        <Empty description="No sessions found" />
      )}
    </div>
  );
};

export default SessionCardGrid;
