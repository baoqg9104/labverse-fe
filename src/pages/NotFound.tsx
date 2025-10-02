export const NotFound = () => {
  return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center py-10 md:py-16 px-4 text-white">
      <h1 className="text-3xl md:text-5xl font-extrabold mb-4 md:mb-6 text-center">404 - Page Not Found</h1>
      <p className="text-base md:text-lg mb-6 md:mb-8 text-center">The page you are looking for does not exist or has been removed.<br />Please check the address or return to the homepage.</p>
      <a href="/" className="px-5 md:px-6 py-2 md:py-3 rounded-full bg-indigo-600 font-semibold text-base md:text-lg shadow hover:bg-indigo-500 transition">Back to Homepage</a>
    </div>
  );
};