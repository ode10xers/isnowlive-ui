import React, { useState, useEffect } from 'react';
import Loader from 'components/Loader';
import PublicPassList from 'components/PublicPassList';
import apis from 'apis';
import { isAPISuccess } from 'utils/helper';
import { formatPassesData } from 'utils/productsHelper';

const Passes = ({ profileUsername }) => {
  const [passes, setPasses] = useState([]);
  const [isPassesLoading, setIsPassesLoading] = useState(true);

  useEffect(() => {
    const getPasses = async () => {
      setIsPassesLoading(true);
      try {
        const { status, data } = await apis.passes.getPassesByUsername(profileUsername);

        if (isAPISuccess(status) && data) {
          setPasses(formatPassesData(data, profileUsername));
          setIsPassesLoading(false);
        }
      } catch (error) {
        setIsPassesLoading(false);
        console.error('Failed to load pass details');
      }
    };

    getPasses();
  }, [profileUsername]);

  return (
    <Loader loading={isPassesLoading} size="large" text="Loading passes">
      <PublicPassList passes={passes} username={profileUsername} />
    </Loader>
  );
};

export default Passes;