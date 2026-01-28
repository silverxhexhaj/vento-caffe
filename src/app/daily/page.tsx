import { Metadata } from "next";
import { content } from "@/data/content";
import EditorialCard from "@/components/editorial/EditorialCard";

export const metadata: Metadata = {
  title: "Daily",
  description: "Welcome to Vento Caffè's Journal. Moments, music, and inspiration from our world of coffee.",
};

export default function DailyPage() {
  return (
    <div className="section">
      <div className="container">
        {/* Page Header */}
        <div className="mb-12">
          <h1 className="text-h1 font-serif mb-4">{content.daily.heading}</h1>
          <p className="text-lg text-muted max-w-2xl">
            {content.daily.subHeading}
          </p>
        </div>

        {/* Posts Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {content.daily.posts.map((post) => (
            <EditorialCard
              key={post.slug}
              post={post}
              basePath="/daily"
            />
          ))}
        </div>

        {/* Empty State Message */}
        {content.daily.posts.length === 0 && (
          <p className="text-center text-muted py-16">
            New stories coming soon.
          </p>
        )}
      </div>
    </div>
  );
}
