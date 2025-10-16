import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";

const a = [
  {
    img: "/src/assets/content-writing.png",
    alt: "Blog",
    labelKey: "home.reasons.blog",
  },
  {
    img: "/src/assets/motivation.png",
    alt: "Motivation",
    labelKey: "home.reasons.steps",
  },
  {
    img: "/src/assets/tips.png",
    alt: "Tips",
    labelKey: "home.reasons.tips",
  },
  {
    img: "/src/assets/piggy-bank.png",
    alt: "Cost-effective",
    labelKey: "home.reasons.cost",
  },
];

export const Home = () => {
  const { t } = useTranslation();
  return (
    <>
      {/* Hero Section */}
      <main className="grid grid-cols-12 items-center px-4 md:px-12 pt-10 md:pt-16 min-h-[calc(100vh-120px)] ml-0 md:ml-3 gap-y-8">
        <div className="col-span-12 md:col-span-7">
          <h1 className="text-3xl md:text-5xl font-bold mb-2 text-white">
            {t('home.heroTitle')}
          </h1>
          <h2 className="text-2xl md:text-3xl font-semibold mb-6 text-white">
            {t('home.heroSubtitle')}
          </h2>
          <p className="text-base md:text-lg font-normal mb-8 text-gray-300">
            {t('home.heroDesc')}
          </p>
          <Link to="/learn">
            <button className="bg-lime-400 text-gray-900 rounded-full px-6 md:px-8 py-3 md:py-4 font-semibold text-base md:text-lg shadow-md hover:bg-lime-300 cursor-pointer">
              {t('home.ctaExplore')}
            </button>
          </Link>
        </div>
        <div className="col-span-12 md:col-span-5 flex justify-center">
          <div className="flex justify-center w-48 md:w-[280px]">
            <img
              src="/src/assets/hacker.png"
              className="w-[80%] md:w-full object-contain max-w-full"
            />
          </div>
        </div>
      </main>

      <section className="py-10 md:py-14 md:pb-30 px-2 md:px-4 text-center">
        <h3 className="text-2xl md:text-4xl font-semibold text-white mb-4">
          {t('home.sectionTitle')}
        </h3>
        <div className="w-40 h-1 bg-[#A3EA2A] mx-auto rounded mb-6 mt-5"></div>
        <p className="text-gray-300 text-base md:text-lg max-w-5xl mx-auto mb-10">
          {t('home.sectionDesc')}
        </p>
        <div className="flex flex-wrap justify-center gap-x-8 md:gap-x-20 gap-y-8 md:gap-y-10 mt-6 md:mt-8">
          {a.map((item, index) => (
            <div
              key={index}
              className="w-32 md:w-40 flex flex-col items-center"
            >
              <img
                src={item.img}
                alt={item.alt}
                className="w-20 md:w-28 mb-2 max-w-full"
              />
              <span className="text-white mt-2 text-sm md:text-base">
                {t(item.labelKey)}
              </span>
            </div>
          ))}
        </div>
      </section>

      <section className="bg-gray-50 pt-10 md:pt-20 pb-10 md:pb-28 px-4 md:px-40 grid grid-cols-12 items-center gap-y-8">
        {/* <div className="mx-36 grid grid-cols-1 md:grid-cols-2 gap-8 items-center"> */}
        <div className="col-span-12 md:col-span-8">
          <h3 className="text-[28px] md:text-4xl font-bold text-gray-900 mb-4">
            {t('home.reasonsTitle')}
          </h3>
          <div className="ml-0 md:ml-3">
            <p className="mb-4 text-base md:text-lg mt-8">
              {t('home.reasonsLead')}
            </p>
            <ul className="list-disc ml-6 md:ml-10 space-y-2 text-base md:text-lg">
              <li>
                {t('home.reasons.viExplain')}
              </li>
              <li>
                {t('home.reasons.simpleLabs')}
              </li>
              <li>{t('home.reasons.community')}</li>
            </ul>
          </div>
        </div>
        <div className="col-span-12 md:col-span-4 mt-2 md:mt-0 flex items-center justify-center">
          <img
            src="/src/assets/computer.png"
            alt="Secure Lab"
            className="w-[130px] md:w-[330px] max-w-full"
          />
        </div>
        {/* </div> */}
      </section>
    </>
  );
};
