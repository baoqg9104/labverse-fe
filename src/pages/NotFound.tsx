import { useTranslation } from "react-i18next";

export const NotFound = () => {
  const { t } = useTranslation();
  return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center py-10 md:py-16 px-4 text-white">
      <h1 className="text-3xl md:text-5xl font-extrabold mb-4 md:mb-6 text-center">{t("notFound.title")}</h1>
      <p className="text-base md:text-lg mb-6 md:mb-8 text-center">{t("notFound.desc")}</p>
      <a href="/" className="px-5 md:px-6 py-2 md:py-3 rounded-full bg-indigo-600 font-semibold text-base md:text-lg shadow hover:bg-indigo-500 transition">{t("notFound.backHome")}</a>
    </div>
  );
};