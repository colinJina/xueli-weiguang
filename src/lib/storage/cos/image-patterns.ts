type CosCoverImagePattern = {
  protocol: "https";
  hostname: string;
  port: string;
  pathname: string;
  search: "";
};

type CosImageEnvironment = {
  COS_CDN_DOMAIN?: string;
  COS_BUCKET?: string;
  COS_REGION?: string;
};

export function getCosCoverImagePatterns(environment: CosImageEnvironment): CosCoverImagePattern[] {
  const domains: string[] = [];
  const cdn = environment.COS_CDN_DOMAIN?.trim();
  if (cdn) { domains.push(cdn.includes("://") ? cdn : `https://${cdn}`); }
  const bucket = environment.COS_BUCKET?.trim();
  const region = environment.COS_REGION?.trim();
  if (bucket && region) { domains.push(`https://${bucket}.cos.${region}.myqcloud.com`); }

  return domains.flatMap((domain) => {
    try {
      const url = new URL(domain);
      if ((url.protocol !== "https:" && url.protocol !== "http:") || url.hostname.includes("*") || url.username || url.password || url.search || url.hash) {
        return [];
      }
      return ["/submissions/*/*/cover.*", "/videos/*/cover.*"].map((coverPath): CosCoverImagePattern => ({
        protocol: "https",
        hostname: url.hostname,
        port: url.port,
        pathname: `${url.pathname.replace(/\/+$/, "")}${coverPath}`,
        search: "",
      }));
    } catch {
      return [];
    }
  });
}
