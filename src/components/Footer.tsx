import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";

export const Footer = () => {
  const { t } = useTranslation();
  return (
    <footer className="bg-[#0F172A] py-8 px-4 text-white">
      <div className="mx-2 md:mx-40 flex flex-col md:flex-row justify-between items-center gap-6 md:gap-0">
        <div className="mb-4 md:mb-0 flex flex-col items-center md:items-start">
          <div className="font-semibold text-2xl mb-3">{t('footer.getInTouch')}</div>
          <Link to="/contact" className="text-gray-300 text-base hover:underline mb-1">
            {t('footer.contactUs')}
          </Link>
          <Link to="/forum" className="text-gray-300 text-base hover:underline">
            {t('footer.forum')}
          </Link>
        </div>
        <div className="text-gray-400 text-base text-center md:text-left">{t('footer.copyright')}</div>
      </div>
    </footer>
  );
};
