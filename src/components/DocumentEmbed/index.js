import React, { useState } from 'react';

import { Document, Page, pdfjs } from 'react-pdf/dist/esm/entry.webpack';

import { Spin, Button, Space, Typography } from 'antd';

import styles from './style.module.scss';

pdfjs.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjs.version}/pdf.worker.min.js`;

const { Text } = Typography;

const DocumentEmbed = ({ documentLink = null }) => {
  const [numPages, setNumPages] = useState(null);
  const [pageNumber, setPageNumber] = useState(1);
  // const [hasOutline, setHasOutline] = useState(false);

  const onDocumentLoadSuccess = (data) => {
    console.log(data);
    setNumPages(data.numPages);
    setPageNumber(1);
  };

  const changePage = (offset) => {
    setPageNumber((prevPageNumber) => prevPageNumber + offset);
  };

  const previousPage = () => {
    changePage(-1);
  };

  const nextPage = () => {
    changePage(1);
  };

  const onExternalLinkItemClick = (data) => {
    setPageNumber(data?.pageNumber);
  };

  // const onOutlineItemClick = ({ pageNumber: itemPageNumber }) => {
  //   setPageNumber(itemPageNumber);
  // };

  // const handleOutlineLoadError = (err) => {
  //   console.log('Outline Load Error:');
  //   console.log(err);
  //   setHasOutline(false);
  // };

  // const handleOutlineLoadSuccess = (outline) => {
  //   console.log('Outline Loaded!');
  //   console.log(outline);

  //   setHasOutline(outline && outline?.length > 0);
  // };

  return !documentLink ? null : (
    <div>
      <Document
        // file={`${documentLink}?origin=${window.location.protocol}//${window.location.host}`}
        file={documentLink}
        onLoadSuccess={onDocumentLoadSuccess}
        externalLinkTarget="_blank"
        loading={
          <div className={styles.textAlignCenter}>
            <Spin tip="Loading document..." size="large" />
          </div>
        }
      >
        {/* <div className={styles.pdfOutlineContainer}>
          <Outline
            onItemClick={onOutlineItemClick}
            onLoadError={handleOutlineLoadError}
            onLoadSuccess={handleOutlineLoadSuccess}
          />
        </div> */}
        <div className={styles.pdfPageContainer}>
          <Page
            onItemClick={onExternalLinkItemClick}
            pageNumber={pageNumber}
            renderAnnotationLayer={false}
            renderInteractiveForms={false}
            renderTextLayer={false}
          />
        </div>
      </Document>
      <div className={styles.navigatorContainer}>
        <Space align="center">
          <Button type="primary" disabled={pageNumber <= 1} onClick={previousPage}>
            Previous
          </Button>
          <Text>
            Page {pageNumber || (numPages ? 1 : '--')} of {numPages || '--'}
          </Text>
          <Button type="primary" disabled={pageNumber >= numPages} onClick={nextPage}>
            Next
          </Button>
        </Space>
      </div>
    </div>
  );
};

export default DocumentEmbed;