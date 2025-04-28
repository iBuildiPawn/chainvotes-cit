export const campaignRoutes = {
  details: (id: string) => `/campaigns/${id}`,
  vote: (id: string) => `/campaigns/${id}/vote`,
  results: (id: string) => `/campaigns/${id}/results`,
  configure: (id: string) => `/campaigns/${id}/configure`
} as const;

export type CampaignRouteType = keyof typeof campaignRoutes;