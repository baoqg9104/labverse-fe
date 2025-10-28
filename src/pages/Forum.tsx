import { motion } from "framer-motion";
import { FaComments, FaClock } from "react-icons/fa";

export default function Forum() {
  return (
    <div className="min-h-screen flex flex-col items-center bg-gradient-to-b from-indigo-50 to-white px-6 py-20 relative">
      <motion.div
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="text-center max-w-2xl"
      >
        <div className="flex items-center justify-center mb-6">
          <div className="p-5 bg-indigo-100 rounded-full shadow-sm">
            <FaComments className="w-10 h-10 text-indigo-600" />
          </div>
        </div>

        <h1 className="text-5xl font-extrabold text-gray-900 mb-4 tracking-tight">
          Labverse Forum
        </h1>

        <p className="text-lg text-gray-600 mb-8 leading-relaxed">
          Our community forum is on its way! Soon, you’ll be able to ask
          questions, share insights, and connect with fellow learners in the
          Labverse community.
        </p>

        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.97 }}
          className="inline-flex items-center gap-2 bg-indigo-600 text-white px-6 py-3 rounded-2xl font-medium shadow-lg hover:bg-indigo-700 transition-all cursor-pointer"
        >
          <FaClock className="w-5 h-5" />
          <span>Coming Soon – Stay Tuned</span>
        </motion.button>
      </motion.div>

      <footer className="absolute bottom-6 text-gray-400 text-sm">
        © {new Date().getFullYear()} Labverse. All rights reserved.
      </footer>
    </div>
  );
}
