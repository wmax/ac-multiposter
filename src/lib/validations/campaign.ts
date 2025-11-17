import { z } from 'zod/mini';

/**
 * Schema for creating a new campaign.
 * Does not include id as it's generated server-side.
 */
export const createCampaignSchema = z.object({
  name: z.string().check(z.minLength(1, 'Campaign name is required')),
  content: z.string()
    .check(z.minLength(1, 'Content is required'))
    .check((payload) => {
      try {
        JSON.parse(payload.value);
      } catch {
        payload.issues.push({
          code: 'custom',
          message: 'Content must be valid JSON',
          input: payload.value,
        });
      }
    }),
});

/**
 * Schema for updating an existing campaign.
 * All fields are optional except id.
 */
export const updateCampaignSchema = z.object({
  id: z.string(),
  name: z.string().check(z.minLength(1, 'Campaign name is required')),
  content: z.string()
    .check(z.minLength(1, 'Content is required'))
    .check((payload) => {
      try {
        JSON.parse(payload.value);
      } catch {
        payload.issues.push({
          code: 'custom',
          message: 'Content must be valid JSON',
          input: payload.value,
        });
      }
    }),
});

/**
 * Schema for deleting campaigns.
 * Accepts an array of campaign IDs.
 */
export const deleteCampaignIdsSchema = z.array(z.string());