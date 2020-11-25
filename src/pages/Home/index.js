import React, { useState, useEffect } from 'react';
import { useHistory } from 'react-router-dom';

import Routes from 'routes';
import ProfilePreview from 'pages/ProfilePreview';

const reservedDomainName = ['app', 'localhost'];

const Home = () => {
  const history = useHistory();
  const [loadProfile, setLoadProfile] = useState(false);
  const [username, setUsername] = useState(null);
  useEffect(() => {
    const domainName = window.location.hostname.split('.')[0];
    console.log(domainName && !reservedDomainName.includes(domainName));
    if (window.location.hostname.includes('ngrok')) {
      history.push(Routes.login);
    } else if (domainName && !reservedDomainName.includes(domainName)) {
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
