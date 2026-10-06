import { ImageResponse } from "next/og";
import { formatLongDate } from "@/lib/datetime";
import { photoDataUrl } from "@/lib/photos";
import { getInvitation } from "./data";

export const alt = "Graduation invitation";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

// The card WhatsApp shows when an invitation link is pasted into a chat.
export default async function Image({ params }: { params: Promise<{ token: string }> }) {
  const invitation = await getInvitation((await params).token);
  const honoree = invitation?.event.honoreeName ?? "";
  const guest = invitation?.guest.name ?? "";
  const date = invitation ? formatLongDate(invitation.event.startsAt) : "";
  const classYear = invitation?.event.classYear;
  const photo = invitation?.event.photoUpdatedAt ? await photoDataUrl(invitation.event.id) : null;

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "radial-gradient(ellipse at top, #fffdf6 0%, #f7eedc 55%, #ecdfc3 100%)",
          color: "#1b2a52",
          fontFamily: "serif",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            width: 1100,
            height: 530,
            border: "4px solid #c9a24d",
            outline: "1px solid rgba(201,162,77,0.5)",
            outlineOffset: 10,
            gap: 56,
          }}
        >
          {photo && (
            // eslint-disable-next-line jsx-a11y/alt-text -- rendered to a PNG, not HTML
            <img
              src={photo}
              width={330}
              height={330}
              style={{
                borderRadius: 9999,
                objectFit: "cover",
                objectPosition: "50% 25%",
                border: "8px solid #c9a24d",
              }}
            />
          )}
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: photo ? "flex-start" : "center",
              maxWidth: photo ? 600 : 1000,
              gap: 18,
            }}
          >
          <svg width="96" height="96" viewBox="0 0 64 64" fill="#c9a24d">
            <path d="M32 12 4 24l28 12 28-12-28-12Z" />
            <path d="M16 30v11c0 4 7.2 8 16 8s16-4 16-8V30l-16 7-16-7Z" opacity="0.85" />
            <path d="M56 26v14" stroke="#c9a24d" strokeWidth="2.5" strokeLinecap="round" />
            <circle cx="56" cy="43" r="3" />
          </svg>
          {classYear && (
            <div style={{ fontSize: 26, letterSpacing: 10, color: "#a87c27" }}>
              {`THE CLASS OF ${classYear}`}
            </div>
          )}
          <div style={{ fontSize: 40, color: "#4a4033" }}>
            {guest ? `${guest}, you're invited to celebrate` : "You're invited to celebrate"}
          </div>
          <div style={{ fontSize: photo ? 64 : 76, color: "#1b2a52", lineHeight: 1.1 }}>{honoree}</div>
          <div style={{ fontSize: 32, color: "#a87c27" }}>{date}</div>
          </div>
        </div>
      </div>
    ),
    size,
  );
}
