import React, { useState, useEffect, useCallback } from 'react';

import Routes from 'routes';
import DynamicProfile from 'pages/DynamicProfile';

import { getUsernameFromUrl } from 'utils/url';
import { reservedDomainName } from 'utils/constants';
import apis from 'apis';
import { isAPISuccess } from 'utils/helper';
import PageRenderer from 'pages/PageBuilder/PageRenderer';
import MobileLayout from 'layouts/MobileLayout';

const NewHome = ({ match, history, location }) => {
  const isRootHome = location.pathname === Routes.root;

  const [loadProfile, setLoadProfile] = useState(false);
  const [shouldRender, setShouldRender] = useState(!isRootHome);
  const [username, setUsername] = useState(null);

  const checkCustomHomepage = useCallback(async () => {
    try {
      const { status, data } = await apis.custom_pages.getPublicHomepage();

      if (isAPISuccess(status) && data) {
        setLoadProfile(false);
      }
    } catch (error) {
      console.log('Error while fetching custom homepage');
      console.error(error);
      setLoadProfile(true);
    }

    setShouldRender(true);
  }, []);

  useEffect(() => {
    if (shouldRender) {
      const domainName = getUsernameFromUrl();
      if (domainName && !reservedDomainName.includes(domainName)) {
        setUsername(domainName);
      } else {
        history.push(Routes.login);
      }
    } else {
      checkCustomHomepage();
    }
  }, [history, shouldRender, checkCustomHomepage]);

  if (loadProfile) {
    return (
      <MobileLayout>
        <DynamicProfile creatorUsername={username} />
      </MobileLayout>
    );
  } else {
    return <PageRenderer match={match} history={history} />;
  }
};

export default NewHome;
