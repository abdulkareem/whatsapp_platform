const parseRoutingConfig = () => {
  const rawConfig = process.env.CLIENT_ROUTE_CONFIG;

  if (!rawConfig) {
    return [];
  }

  try {
    const parsed = JSON.parse(rawConfig);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
};

const getDefaultClient = () => ({
  name: "MYCROWB",
  endpoint: process.env.MYCROWB_API_URL,
  apiKey: process.env.MYCROWB_API_KEY,
});

export const resolveClientTargets = ({ from, message }) => {
  const rules = parseRoutingConfig();

  const matches = rules.filter((rule) => {
    const keywordMatch =
      Array.isArray(rule.keywords) &&
      rule.keywords.some((keyword) =>
        message?.toLowerCase().includes(String(keyword).toLowerCase()),
      );

    const phoneMatch =
      Array.isArray(rule.phonePrefixes) &&
      rule.phonePrefixes.some((prefix) => from?.startsWith(String(prefix)));

    return keywordMatch || phoneMatch;
  });

  if (matches.length > 0) {
    return matches.map((match) => ({
      name: match.name,
      endpoint: match.endpoint,
      apiKey: match.apiKey,
    }));
  }

  return [getDefaultClient()];
};
