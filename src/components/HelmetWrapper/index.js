import React from 'react';
import { Helmet } from 'react-helmet';

const HelmetWrapper = ({
  title = 'Do Your Passion | Turn your passion into your income',
  imageUrl = null,
  description = 'Do Your Passion | Turn your passion into your income',
}) => {
  console.log('HERE');

  return (
    <Helmet>
      <meta property="og:title" content={title} />
      <meta property="og:description" content={description} />
      {imageUrl && <meta property="og:image" content={imageUrl} />}
      {imageUrl && <meta property="og:image:secure_url" content={imageUrl} />}
    </Helmet>
  );
};

export default HelmetWrapper;
