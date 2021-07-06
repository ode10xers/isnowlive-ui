import React, { useState, useCallback, useEffect } from 'react';

import { Checkbox, message, Spin } from 'antd';
import apis from 'apis';
import { isAPISuccess } from 'utils/helper';

const CreatorFeeSettings = ({ text = 'Offload platform fees to me' }) => {
  const [isLoading, setIsLoading] = useState(false);
  const [creatorSettings, setCreatorSettings] = useState(null);

  const fetchCreatorFeeSettings = useCallback(async () => {
    setIsLoading(true);
    try {
      const { status, data } = await apis.user.getCreatorSettings();

      if (isAPISuccess(status) && data) {
        setCreatorSettings(data);
      }
    } catch (error) {
      console.error(error);
      message.error(error?.response?.data?.message || 'Failed to load creator fee settings');
    }

    setIsLoading(false);
  }, []);

  useEffect(() => {
    fetchCreatorFeeSettings();
  }, [fetchCreatorFeeSettings]);

  const handleCreatorFeeSettingsChanged = async (e) => {
    console.log(e.target);
    setIsLoading(true);
    try {
      const { status } = await apis.user.updateCreatorFeeSettings({
        creator_owns_fee: e.target.checked,
      });

      if (isAPISuccess(status)) {
        message.success('Successfully updated creator fee settings');
        await fetchCreatorFeeSettings();
      }
    } catch (error) {
      console.error(error);
      message.error(error?.response?.data?.message || 'Failed to load creator fee settings');
    }

    setIsLoading(false);
  };

  return (
    <Spin spinning={isLoading}>
      <Checkbox
        onChange={handleCreatorFeeSettingsChanged}
        checked={creatorSettings?.creator_owns_fee || false}
        disabled={!creatorSettings}
      >
        {text}
      </Checkbox>
    </Spin>
  );
};

export default CreatorFeeSettings;
