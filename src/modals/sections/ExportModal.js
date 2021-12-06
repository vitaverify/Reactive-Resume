// import { FaPrint } from 'react-icons/fa';
import { clone } from 'lodash';
import { toast } from 'react-toastify';
import { useTranslation } from 'react-i18next';
import React, { memo, useContext, useEffect, useState } from 'react';
import download from 'downloadjs';
import firebase from 'gatsby-plugin-firebase';
import { useSelector } from '../../contexts/ResumeContext';
import BaseModal from '../BaseModal';
import Button from '../../components/shared/Button';
import ModalContext from '../../contexts/ModalContext';
import { b64toBlob } from '../../utils';

const ExportModal = () => {
  const state = useSelector();
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);
  const [isLoadingSingle, setLoadingSingle] = useState(false);
  const [isLoadingMulti, setLoadingMulti] = useState(false);

  const { emitter, events } = useContext(ModalContext);

  useEffect(() => {
    const unbind = emitter.on(events.EXPORT_MODAL, () => setOpen(true));

    return () => unbind();
  }, [emitter, events]);

  // const handleOpenPrintDialog = () => {
  //   if (typeof window !== `undefined`) {
  //     window && window.print();
  //   }
  // };

  function exportHTML(fileName) {
    const header =
      "<html xmlns:o='urn:schemas-microsoft-com:office:office' " +
      "xmlns:w='urn:schemas-microsoft-com:office:word' " +
      "xmlns='http://www.w3.org/TR/REC-html40'>" +
      "<head><meta charset='utf-8'><title>Export HTML to Word Document with JavaScript</title></head><body>";
    const footer = '</body></html>';
    const sourceHTML =
      header + document.getElementById('page').innerHTML + footer;

    const source = `data:application/vnd.ms-word;charset=utf-8,${encodeURIComponent(
      sourceHTML,
    )}`;
    const fileDownload = document.createElement('a');
    document.body.appendChild(fileDownload);
    fileDownload.href = source;
    fileDownload.download = `${fileName}.doc`;
    fileDownload.click();
    document.body.removeChild(fileDownload);
  }

  const handleDownload = async (isSinglePDF, isExtPDF) => {
    setLoadingSingle(true);
    setLoadingMulti(true);

    const fileMIMEType = 'application/pdf';

    const fileName = `vita-resume-${state.id}`;

    if (!isExtPDF) {
      setLoadingSingle(false);
      setLoadingMulti(false);
      return exportHTML(fileName);
    }

    try {
      const printResume = firebase.functions().httpsCallable('printResume');
      const { data } = await printResume({
        id: state.id,
        type: isSinglePDF ? 'single' : 'multi',
      });
      const blob = b64toBlob(data, fileMIMEType);
      download(blob, `${fileName}.pdf`, fileMIMEType);
    } catch (error) {
      toast(t('builder.toasts.printError'));
    } finally {
      setLoadingSingle(false);
      setLoadingMulti(false);
    }
  };

  const handleExportToJson = () => {
    const backupObj = clone(state);
    delete backupObj.id;
    delete backupObj.user;
    delete backupObj.name;
    delete backupObj.createdAt;
    delete backupObj.updatedAt;
    const data = `data:text/json;charset=utf-8,${encodeURIComponent(
      JSON.stringify(backupObj, null, '\t'),
    )}`;
    download(data, `RxResume-${state.id}.json`, 'text/json');
  };

  return (
    <BaseModal
      hideActions
      state={[open, setOpen]}
      title={t('builder.actions.export.heading')}
    >
      {/* <div>
        <h5 className="text-xl font-semibold mb-4">
          {t('modals.export.printDialog.heading')}
        </h5>

        <p className="leading-loose">{t('modals.export.printDialog.text')}</p>

        <Button icon={FaPrint} className="mt-5" onClick={handleOpenPrintDialog}>
          {t('modals.export.printDialog.button')}
        </Button>
      </div>

      <hr className="my-8" /> */}

      <div>
        <h5 className="text-xl font-semibold mb-4">Download Word</h5>

        <p className="leading-loose">{t('modals.export.downloadPDF.text')}</p>

        <div className="mt-5 mb-4">
          <div className="flex">
            <Button
              isLoading={isLoadingSingle}
              onClick={() => handleDownload(true, false)}
            >
              {t('modals.export.downloadPDF.buttons.single')}
            </Button>
            <Button
              className="ml-8"
              isLoading={isLoadingMulti}
              onClick={() => handleDownload(false, false)}
            >
              {t('modals.export.downloadPDF.buttons.multi')}
            </Button>
          </div>
        </div>
      </div>

      <hr className="my-8" />

      <div>
        <h5 className="text-xl font-semibold mb-4">
          {t('modals.export.downloadPDF.heading')}
        </h5>

        <p className="leading-loose">{t('modals.export.downloadPDF.text')}</p>

        <div className="mt-5 mb-4">
          <div className="flex">
            <Button
              isLoading={isLoadingSingle}
              onClick={() => handleDownload(true, true)}
            >
              {t('modals.export.downloadPDF.buttons.single')}
            </Button>
            <Button
              className="ml-8"
              isLoading={isLoadingMulti}
              onClick={() => handleDownload(false, true)}
            >
              {t('modals.export.downloadPDF.buttons.multi')}
            </Button>
          </div>
        </div>
      </div>

      <hr className="my-8" />

      <div>
        <h5 className="text-xl font-semibold mb-4">
          {t('modals.export.jsonFormat.heading')}
        </h5>

        <p className="leading-loose">{t('modals.export.jsonFormat.text')}</p>

        <div className="mt-5">
          <Button onClick={handleExportToJson}>
            {t('modals.export.jsonFormat.button')}
          </Button>
          <a id="downloadAnchor" className="hidden">
            {t('modals.export.jsonFormat.button')}
          </a>
        </div>
      </div>
    </BaseModal>
  );
};

export default memo(ExportModal);
