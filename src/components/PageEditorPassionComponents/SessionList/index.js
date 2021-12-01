import React, { useState, useEffect, useCallback } from 'react';

import { Spin, message } from 'antd';

import apis from 'apis';
import { sessionsLayout } from '../layouts';

import SessionCardGrid from './SessionCardGrid';
import InventoryDateList from 'components/InventoryDateList';

import { isAPISuccess } from 'utils/helper';

const SessionList = ({
  layout = sessionsLayout.GRID,
  'show-image': showImage = false,
  'show-desc': showDesc = false,
}) => {
  const [inventories, setInventories] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchCreatorSessions = useCallback(async () => {
    setIsLoading(true);

    try {
      const { status, data } = await apis.user.getSessionsByUsername('upcoming');

      if (isAPISuccess(status) && data) {
        setInventories(data ?? []);
      }
    } catch (error) {
      console.error(error);
      message.error('Failed fetching upcoming sessions data');
    }

    setIsLoading(false);
  }, []);

  useEffect(() => {
    fetchCreatorSessions();
  }, [fetchCreatorSessions]);

  const renderSessionComponent = () => {
    switch (layout) {
      case sessionsLayout.GRID:
        return <SessionCardGrid inventories={inventories ?? []} />;
      case sessionsLayout.LIST:
        return <InventoryDateList inventories={inventories ?? []} showImage={showImage} showDesc={showDesc} />;
      default:
        return <SessionCardGrid inventories={inventories ?? []} />;
    }
  };

  return (
    <div>
      <Spin spinning={isLoading} tip="Fetching sessions data...">
        {renderSessionComponent()}
      </Spin>
    </div>
  );
};

export default SessionList;
