import React, { useState, useEffect } from 'react';

import DefaultLayout from 'layouts/DefaultLayout';
import ProfilePreview from 'pages/ProfilePreview';

const reservedDomainName = ['app', 'localhost'];

const Home = () => {
  const [loadProfile, setLoadProfile] = useState(false);
  const [username, setUsername] = useState(null);
  useEffect(() => {
    const domainName = window.location.hostname.split('.')[0];
    if (domainName && !reservedDomainName.includes(domainName)) {
      setLoadProfile(true);
      setUsername(domainName);
    }
  }, []);
  if (loadProfile) {
    return <ProfilePreview username={username} />;
  }
  return (
    <DefaultLayout>
      <h1>Hello</h1>
    </DefaultLayout>
  );
};

export default Home;
