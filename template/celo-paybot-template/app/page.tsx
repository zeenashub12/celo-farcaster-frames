import { Metadata } from "next";
import App from "@/app/app";

const appUrl = process.env.NEXT_PUBLIC_URL;

const frame = {
  version: "next",
  imageUrl: `${appUrl}/opengraph-image`,
  button: {
    title: "Launch Frame",
    action: {
      type: "launch_frame",
      name: "Farcaster Frames v2 Demo",
      url: appUrl,
      splashImageUrl: `${appUrl}/next.svg`,
      splashBackgroundColor: "#f7f7f7",
    },
  },
};

export const revalidate = 300;

export async function generateMetadata(): Promise<Metadata> {
  return {
    title: "Farcaster Frames v2 With Celo Demo",
    openGraph: {
      title: "Farcaster Frames v2 Demo With Celo",
      description: "A Farcaster Frames v2 demo for Celo Network.",
    },
    other: {
      "fc:frame": JSON.stringify(frame),
    },
  };
}

export default function Home() {
  return <App />;
}
