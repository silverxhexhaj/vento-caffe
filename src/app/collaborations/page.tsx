import { Metadata } from "next";
import { content } from "@/data/content";
import EditorialCard from "@/components/editorial/EditorialCard";

export const metadata: Metadata = {
  title: "Collaborations",
  description: "Partnerships with creators, artists, and kindred spirits. Where coffee meets craft.",
};

export default function CollaborationsPage() {
  return (
    <div className="section">
      <div className="container">
        {/* Page Header */}
        <div className="mb-12">
          <h1 className="text-h1 font-serif mb-4">{content.collaborations.heading}</h1>
          <p className="text-lg text-muted max-w-2xl">
            {content.collaborations.subHeading}
          </p>
        </div>

        {/* Posts Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {content.collaborations.posts.map((post) => (
            <EditorialCard
              key={post.slug}
              post={post}
              basePath="/collaborations"
            />
          ))}
        </div>

        {/* Empty State Message */}
        {content.collaborations.posts.length === 0 && (
          <p className="text-center text-muted py-16">
            New collaborations coming soon.
          </p>
        )}
      </div>
    </div>
  );
}
