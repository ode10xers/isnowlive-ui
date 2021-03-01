import React from 'react';
import { Helmet } from 'react-helmet';

const HelmetWrapper = ({
  title = 'Do Your Passion | Turn your passion into your income',
  description = 'Do Your Passion | Turn your passion into your income',
  siteUrl = null,
  imageUrl = null,
}) => {
  console.log('HERE');

  return (
    <Helmet>
      <meta property="og:title" content={title} />
      <meta property="og:description" content={description} />
      <meta property="og:url" content={siteUrl || window.location.href} />
      {imageUrl && <meta property="og:image" content={imageUrl} />}
      {imageUrl && <meta property="og:image:secure_url" content={imageUrl} />}
    </Helmet>
  );
};

export default HelmetWrapper;
