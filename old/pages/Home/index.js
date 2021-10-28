import React, { useState, useEffect } from 'react';
import { useHistory } from 'react-router-dom';

import Routes from 'routes';

import ProfilePreview from 'pages/ProfilePreview';

import { getUsernameFromUrl } from 'utils/url';
import { reservedDomainName } from 'utils/helper';

const Home = () => {
  const history = useHistory();
  const [loadProfile, setLoadProfile] = useState(false);
  const [username, setUsername] = useState(null);

  useEffect(() => {
    const domainName = getUsernameFromUrl();
    if (domainName && !reservedDomainName.includes(domainName)) {
      setLoadProfile(true);
      setUsername(domainName);
    } else {
      history.push(Routes.login);
    }
  }, [history]);

  if (loadProfile) {
    return <ProfilePreview username={username} />;
  }
  return null;
};

export default Home;
