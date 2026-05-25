
import { buildLandingPageHtml } from '../server/store.js';
export const offers = [
	{
		id: 'offer_founder_sprint',
		name: 'Founder Sprint',
		angle: 'Premium positioning for service founders',
		audience: 'Service businesses',
		icon: '🚀',
	},
	{
		id: 'offer_webinar_system',
		name: 'Webinar System',
		angle: 'Convert webinar registrants into buyers',
		audience: 'Coaches and consultants',
		icon: '🎯',
	},
	{
		id: 'offer_retention_stack',
		name: 'Retention Stack',
		angle: 'Turn existing customers into repeat buyers',
		audience: 'Membership and education brands',
		icon: '🔁',
	},
];

export const pages = [
	{
		id: 'page_founder_lp_01',
		offerId: 'offer_founder_sprint',
		name: 'Founder Sprint Landing Page',
		pageType: 'landing',
		promptNotes: 'Premium, direct-response tone with strong authority.',
		html: buildLandingPageHtml({
			offerName: 'Founder Sprint',
			audience: 'Service founders',
			angle: 'Turn scattered expertise into a premium advisory offer',
			notes: 'Premium, direct-response tone with strong authority.',
		}),
		updatedAt: '2026-05-20T09:15:00.000Z',
	},
];
