import React, { useState, useEffect } from 'react';

import apis from 'apis';

import Loader from 'components/Loader';
import PublicPassList from 'components/PublicPassList';

import { isAPISuccess } from 'utils/helper';
import { formatPassesData } from 'utils/productsHelper';

import styles from './style.module.scss';

const Passes = () => {
  const [passes, setPasses] = useState([]);
  const [isPassesLoading, setIsPassesLoading] = useState(true);

  useEffect(() => {
    const getPasses = async () => {
      setIsPassesLoading(true);
      try {
        const { status, data } = await apis.passes.getPassesByUsername();

        if (isAPISuccess(status) && data) {
          setPasses(formatPassesData(data));
          setIsPassesLoading(false);
        }
      } catch (error) {
        setIsPassesLoading(false);
        console.error('Failed to load pass details');
      }
    };

    getPasses();
  }, []);

  return (
    <div className={styles.passPluginContainer}>
      <Loader loading={isPassesLoading} size="large" text="Loading passes">
        <PublicPassList passes={passes} />
      </Loader>
    </div>
  );
};

export default Passes;
