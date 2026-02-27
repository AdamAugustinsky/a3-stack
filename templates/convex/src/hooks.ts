import { decodeConvexLoad, encodeConvexLoad } from 'convex-sveltekit';

export const transport = {
	ConvexLoadResult: {
		encode: (value: unknown) => encodeConvexLoad(value),
		decode: (encoded: { refName: string; args: Record<string, unknown>; data: unknown }) =>
			decodeConvexLoad(encoded)
	}
};
