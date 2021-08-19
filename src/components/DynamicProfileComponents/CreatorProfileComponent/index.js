import React from 'react';

import CreatorProfileEditView from './CreatorProfileEditView';
import CreatorProfileView from './CreatorProfileView';

import styles from './style.module.scss';

const CreatorProfileComponent = ({
  creatorProfile,
  isEditing,
  isContained = false,
  refetchCreatorProfileData = () => {},
}) => {
  return (
    <div className={styles.creatorProfileComponent}>
      <div className={styles.creatorProfileContainer}>
        <CreatorProfileView creatorProfile={creatorProfile} isEditing={isEditing} isContained={isContained} />
      </div>
      {isEditing && (
        <CreatorProfileEditView refetchCreatorProfileData={refetchCreatorProfileData} creatorProfile={creatorProfile} />
      )}
    </div>
  );
};

export default CreatorProfileComponent;
