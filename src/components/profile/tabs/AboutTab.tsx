import type { User } from "../../../types/user";

export function AboutTab({ profile }: { profile: User | null }) {
  return (
    <div className="max-w-3xl mx-auto">
      <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl p-8 border border-blue-100">
        <h3 className="text-2xl font-bold mb-4 text-gray-800 flex items-center gap-2">
          <span className="text-2xl">📝</span>
          About
        </h3>
        <div className="text-gray-700 text-lg leading-relaxed whitespace-pre-line">
          {profile?.bio ||
            "No bio available yet. Click 'Edit Profile' to add your story!"}
        </div>
      </div>
    </div>
  );
}

export default AboutTab;
