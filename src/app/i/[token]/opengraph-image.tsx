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
          background: "radial-gradient(ellipse at top, #22396e 0%, #0e1b3a 55%, #081126 100%)",
          color: "#ead39a",
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
            border: "3px solid #c9a24d",
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
                border: "6px solid #dcbc6e",
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
          <svg width="96" height="96" viewBox="0 0 64 64" fill="#dcbc6e">
            <path d="M32 12 4 24l28 12 28-12-28-12Z" />
            <path d="M16 30v11c0 4 7.2 8 16 8s16-4 16-8V30l-16 7-16-7Z" opacity="0.85" />
            <path d="M56 26v14" stroke="#dcbc6e" strokeWidth="2.5" strokeLinecap="round" />
            <circle cx="56" cy="43" r="3" />
          </svg>
          {classYear && (
            <div style={{ fontSize: 26, letterSpacing: 10, color: "#c9a24d" }}>
              {`THE CLASS OF ${classYear}`}
            </div>
          )}
          <div style={{ fontSize: 40, color: "#f3e6c0" }}>
            {guest ? `${guest}, you're invited to celebrate` : "You're invited to celebrate"}
          </div>
          <div style={{ fontSize: photo ? 64 : 76, color: "#ffffff", lineHeight: 1.1 }}>{honoree}</div>
          <div style={{ fontSize: 32, color: "#dcbc6e" }}>{date}</div>
          </div>
        </div>
      </div>
    ),
    size,
  );
}
