import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  poweredByHeader: false,
  async redirects() {
    return [
      {
        source: "/designs",
        destination: "https://shimmering-syrniki-94cca5.netlify.app/",
        permanent: false
      },
      {
        source: "/designs/link",
        destination: "https://shimmering-syrniki-94cca5.netlify.app/",
        permanent: false
      },
      {
        source: "/revised-designs",
        destination: "https://starlit-gumption-65a19b.netlify.app/",
        permanent: false
      },
      {
        source: "/desings",
        destination: "https://shimmering-syrniki-94cca5.netlify.app/",
        permanent: false
      },
      {
        source: "/desings/link",
        destination: "https://shimmering-syrniki-94cca5.netlify.app/",
        permanent: false
      }
    ];
  }
};

export default nextConfig;
