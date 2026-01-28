import Link from "next/link";
import Image from "next/image";
import { formatDate } from "@/lib/utils";

interface EditorialPost {
  slug: string;
  title: string;
  excerpt: string;
  image: string;
  date: string;
}

interface EditorialCardProps {
  post: EditorialPost;
  basePath: string;
}

export default function EditorialCard({ post, basePath }: EditorialCardProps) {
  return (
    <article className="group">
      <Link href={`${basePath}/${post.slug}`} className="block">
        {/* Image */}
        <div className="relative aspect-[3/2] bg-[var(--border)] overflow-hidden mb-4">
          <Image
            src={post.image || "/images/placeholder.svg"}
            alt={post.title}
            fill
            className="object-cover transition-transform duration-500 group-hover:scale-105"
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
          />
        </div>

        {/* Content */}
        <div>
          <time className="text-xs text-muted uppercase tracking-widest">
            {formatDate(post.date)}
          </time>
          <h2 className="text-lg font-serif mt-2 mb-2 group-hover:underline">
            {post.title}
          </h2>
          <p className="text-sm text-muted line-clamp-2">
            {post.excerpt}
          </p>
        </div>
      </Link>
    </article>
  );
}
