import React, { useState } from 'react';
import { Document, Page, Outline, pdfjs } from 'react-pdf';

import { Spin } from 'antd';

import styles from './style.module.scss';
// import 'react-pdf/dist/esm/Page/AnnotationLayer.css';

pdfjs.GlobalWorkerOptions.workerSrc = 'pdf.worker.min.js';

// const documentLink = 'https://dkfqbuenrrvge.cloudfront.net/document/V6bLQBuhqnHbFOnl_gdpr-for-dummies-beginners-guide-to-gdpr.pdf';
const documentLink = 'https://dkfqbuenrrvge.cloudfront.net/document/UaFhbOG7wyfZLFXF_utm-tracking-cheatsheet.pdf';

const DocumentEmbed = () => {
  const [numPages, setNumPages] = useState(null);
  const [pageNumber, setPageNumber] = useState(1);
  const [hasOutline, setHasOutline] = useState(false);
  console.log(hasOutline);

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

  const onOutlineItemClick = ({ pageNumber: itemPageNumber }) => {
    setPageNumber(itemPageNumber);
  };

  const onExternalLinkItemClick = (data) => {
    console.log(data);

    setPageNumber(data?.pageNumber);
  };

  const handleOutlineLoadError = (err) => {
    console.log('Outline Load Error:');
    console.log(err);
    setHasOutline(false);
  };

  const handleOutlineLoadSuccess = (outline) => {
    console.log('Outline Loaded!');
    console.log(outline);

    setHasOutline(outline && outline?.length > 0);
  };

  return (
    <>
      <Document
        file={documentLink}
        onLoadSuccess={onDocumentLoadSuccess}
        externalLinkTarget="_blank"
        loading={<Spin tip="Loading document..." size="large" />}
        // options={{workerSrc: "pdf.worker.js"}}
      >
        <div className={styles.pdfOutlineContainer}>
          <Outline
            onItemClick={onOutlineItemClick}
            onLoadError={handleOutlineLoadError}
            onLoadSuccess={handleOutlineLoadSuccess}
          />
        </div>
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
      <div>
        <p>
          Page {pageNumber || (numPages ? 1 : '--')} of {numPages || '--'}
        </p>
        <button type="button" disabled={pageNumber <= 1} onClick={previousPage}>
          Previous
        </button>
        <button type="button" disabled={pageNumber >= numPages} onClick={nextPage}>
          Next
        </button>
      </div>
    </>
  );
};

export default DocumentEmbed;
