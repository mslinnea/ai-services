/**
 * WordPress dependencies
 */
import apiFetch from '@wordpress/api-fetch';
import { createRegistrySelector } from '@wordpress/data';

/**
 * Internal dependencies
 */
import { STORE_NAME } from './name';
import { getGenerativeAiService } from './generative-ai-service';

const RECEIVE_SERVICES = 'RECEIVE_SERVICES';

/**
 * Gets the first available service slug, optionally satisfying the given criteria.
 *
 * @since n.e.x.t
 *
 * @param {Object}   services          Service objects, keyed by slug.
 * @param {Object}   args              Optional. Arguments to filter the services to consider.
 * @param {string[]} args.slugs        Optional. List of service slugs, to only consider any of these services.
 * @param {string[]} args.capabilities Optional. List of AI capabilities, to only consider services that support all of these
 *                                     capabilities.
 * @return {string} The first available service slug, or empty string if no service is available.
 */
function getAvailableServiceSlug( services, args ) {
	const slugs = args.slugs || Object.keys( services );

	for ( const slug of slugs ) {
		if ( ! services[ slug ] || ! services[ slug ].is_available ) {
			continue;
		}

		if ( args.capabilities ) {
			const missingCapabilities = args.capabilities.filter(
				( capability ) =>
					! services[ slug ].capabilities.includes( capability )
			);
			if ( missingCapabilities.length ) {
				continue;
			}
		}

		return slug;
	}

	return '';
}

const initialState = {
	services: undefined,
};

const actions = {
	/**
	 * Receives services from the server.
	 *
	 * @since n.e.x.t
	 *
	 * @param {Object} services Services received from the server, as key value pairs.
	 * @return {Function} Action creator.
	 */
	receiveServices( services ) {
		return ( { dispatch } ) => {
			dispatch( {
				type: RECEIVE_SERVICES,
				payload: {
					services,
				},
			} );
		};
	},
};

/**
 * Reducer for the store mutations.
 *
 * @since n.e.x.t
 *
 * @param {Object} state  Current state.
 * @param {Object} action Action object.
 * @return {Object} New state.
 */
function reducer( state = initialState, action ) {
	switch ( action.type ) {
		case RECEIVE_SERVICES: {
			const { services } = action.payload;
			return {
				...state,
				services: services.reduce( ( acc, service ) => {
					acc[ service.slug ] = service;
					return acc;
				}, {} ),
			};
		}
	}

	return state;
}

const resolvers = {
	/**
	 * Fetches the services from the server.
	 *
	 * @since n.e.x.t
	 *
	 * @return {Function} Action creator.
	 */
	getServices() {
		return async ( { dispatch } ) => {
			const services = await apiFetch( {
				path: '/wp-starter-plugin/v1/services',
			} );
			dispatch.receiveServices( services );
		};
	},
};

const selectors = {
	getServices: ( state ) => {
		return state.services;
	},

	isServiceRegistered: createRegistrySelector(
		( select ) => ( state, slug ) => {
			const services = select( STORE_NAME ).getServices();
			if ( services === undefined ) {
				return undefined;
			}
			return services[ slug ] !== undefined;
		}
	),

	isServiceAvailable: createRegistrySelector(
		( select ) => ( state, slug ) => {
			const services = select( STORE_NAME ).getServices();
			if ( services === undefined ) {
				return undefined;
			}
			return (
				services[ slug ] !== undefined && services[ slug ].is_available
			);
		}
	),

	hasAvailableServices: createRegistrySelector(
		( select ) => ( state, args ) => {
			const services = select( STORE_NAME ).getServices();
			if ( services === undefined ) {
				return undefined;
			}

			const slug = getAvailableServiceSlug( services, args );
			return !! slug;
		}
	),

	getAvailableService: createRegistrySelector(
		( select ) => ( state, args ) => {
			const services = select( STORE_NAME ).getServices();
			if ( services === undefined ) {
				return undefined;
			}

			if ( typeof args === 'string' ) {
				const slug = args;
				if ( ! services[ slug ] || ! services[ slug ].is_available ) {
					return null;
				}
				return getGenerativeAiService( services[ slug ] );
			}

			const slug = getAvailableServiceSlug( services, args );
			if ( ! slug ) {
				return null;
			}
			return getGenerativeAiService( services[ slug ] );
		}
	),
};

const storeConfig = {
	initialState,
	actions,
	reducer,
	resolvers,
	selectors,
};

export default storeConfig;