import React, { useState, useEffect } from 'react';

import styles from './styles.module.scss';

const TagSettings = ({ fetchUserSettings, userTags }) => {
  const [submitting, setSubmitting] = useState(true);
  const [creatorUserTags, setCreatorUserTags] = useState([]);

  const saveCreatorUserTags = () => {};

  useEffect(() => {
    if (userTags) {
      setCreatorUserTags(userTags);
    }
  }, [userTags]);

  return <div></div>;
};

export default TagSettings;
