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
        {/* Social icons center */}
        <div className="flex items-center gap-4">
          <a
            href="https://www.facebook.com/people/Labverse/61581254788987"
            target="_blank"
            rel="noopener noreferrer"
            className="text-gray-300 hover:text-white"
            aria-label="Facebook"
            title="Facebook"
          >
            <svg className="h-6 w-6" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
              <path d="M22 12a10 10 0 10-11.5 9.9v-7h-2.2V12h2.2V9.8c0-2.2 1.3-3.4 3.3-3.4.9 0 1.8.1 2 .1v2.3h-1.2c-1 0-1.3.6-1.3 1.2V12h2.3l-.4 2.9h-1.9v7A10 10 0 0022 12z" />
            </svg>
          </a>
          <a
            href="https://www.instagram.com/labverse.nexus/"
            target="_blank"
            rel="noopener noreferrer"
            className="text-gray-300 hover:text-white"
            aria-label="Instagram"
            title="Instagram"
          >
            <svg className="h-6 w-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true">
              <rect x="3" y="3" width="18" height="18" rx="5" ry="5" />
              <path d="M16 11.37A4 4 0 1112.63 8 4 4 0 0116 11.37z" />
              <path d="M17.5 6.5h.01" />
            </svg>
          </a>
        </div>
        <div className="text-gray-400 text-base text-center md:text-left">{t('footer.copyright')}</div>
      </div>
    </footer>
  );
};
