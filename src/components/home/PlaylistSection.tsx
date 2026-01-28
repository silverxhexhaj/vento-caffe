import Link from "next/link";
import { content } from "@/data/content";

export default function PlaylistSection() {
  const { playlist } = content;
  
  // Double the tracks for seamless loop
  const doubledTracks = [...playlist.tracks, ...playlist.tracks];

  return (
    <section className="section overflow-hidden">
      <div className="container mb-8">
        <p className="text-h3 text-muted mb-0">{playlist.heading}</p>
        <h2 className="text-h1 font-serif">{playlist.subHeading}</h2>
      </div>

      {/* Marquee Container */}
      <div className="relative">
        {/* Row 1 */}
        <div className="flex whitespace-nowrap animate-marquee mb-4">
          {doubledTracks.map((track, index) => (
            <Link
              key={`row1-${index}`}
              href={playlist.spotifyUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-lg md:text-xl link-underline mr-4 hover:text-muted transition-colors"
            >
              {track}
            </Link>
          ))}
        </div>

        {/* Row 2 - Reverse direction */}
        <div
          className="flex whitespace-nowrap animate-marquee mb-4"
          style={{ animationDirection: "reverse", animationDuration: "35s" }}
        >
          {doubledTracks.map((track, index) => (
            <Link
              key={`row2-${index}`}
              href={playlist.spotifyUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-lg md:text-xl text-muted link-underline mr-4 hover:text-[var(--foreground)] transition-colors"
            >
              {track}
            </Link>
          ))}
        </div>

        {/* Row 3 */}
        <div
          className="flex whitespace-nowrap animate-marquee"
          style={{ animationDuration: "40s" }}
        >
          {doubledTracks.map((track, index) => (
            <Link
              key={`row3-${index}`}
              href={playlist.spotifyUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-lg md:text-xl link-underline mr-4 hover:text-muted transition-colors"
            >
              {track}
            </Link>
          ))}
        </div>
      </div>

      {/* Spotify Link */}
      <div className="container mt-8">
        <Link
          href={playlist.spotifyUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="btn"
        >
          Vento Playlist
        </Link>
      </div>
    </section>
  );
}
