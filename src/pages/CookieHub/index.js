import React, { useEffect, useCallback, useState } from 'react';

import apis from 'apis';

import { createIframe } from 'cookie-toss';
import { getUsernameFromUrl, isAPISuccess, reservedDomainName } from 'utils/helper';

const DOMAINS = {
  development: 'localhost',
  staging: 'stage.passion.do',
  production: 'passion.do',
};

const CookieHub = () => {
  const [dependentDomains, setDependentDomains] = useState([]);

  const fetchCreatorDetails = useCallback(async () => {
    const creatorUsername = getUsernameFromUrl() || 'app';

    let domainsWhitelist = [`${creatorUsername}.${DOMAINS[process.env.REACT_APP_ENV]}`];

    if (!reservedDomainName.includes(creatorUsername)) {
      try {
        const { status, data } = await apis.user.getProfileByUsername(creatorUsername);

        if (isAPISuccess(status) && data?.profile?.custom_domain) {
          domainsWhitelist.push(data?.profile?.custom_domain);
        }
      } catch (error) {
        console.error('Failed fetching creator details');
      }
    }

    console.log('White listed domains in Cookie Toss Iframe');
    console.log(domainsWhitelist);

    setDependentDomains(domainsWhitelist);
  }, []);

  useEffect(() => {
    fetchCreatorDetails();
  }, [fetchCreatorDetails]);

  useEffect(() => {
    if (dependentDomains.length > 0) {
      createIframe({ dependentDomains });
    }
  }, [dependentDomains]);

  return <div style={{ display: 'none' }}></div>;
};

export default CookieHub;
