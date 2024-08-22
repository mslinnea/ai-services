<?php
/**
 * Class Vendor_NS\WP_Starter_Plugin\Services\Cache\Cached_AI_Service_With_API_Client
 *
 * @since n.e.x.t
 * @package wp-plugin-starter
 */

namespace Vendor_NS\WP_Starter_Plugin\Services\Cache;

use InvalidArgumentException;
use Vendor_NS\WP_Starter_Plugin\Services\Contracts\Generative_AI_API_Client;
use Vendor_NS\WP_Starter_Plugin\Services\Contracts\Generative_AI_Service;
use Vendor_NS\WP_Starter_Plugin\Services\Contracts\With_API_Client;

/**
 * Class representing a cached AI service with API client through a decorator pattern.
 *
 * @since n.e.x.t
 */
class Cached_AI_Service_With_API_Client extends Cached_AI_Service implements With_API_Client {

	/**
	 * The underlying AI service to cache.
	 *
	 * This is purely here to satisfy PHPStan requirements. The parent class has a private property with the same name,
	 * which therefore is separate and has a different expected type.
	 *
	 * @since n.e.x.t
	 * @var Generative_AI_Service&With_API_Client
	 */
	private $service;

	/**
	 * Constructor.
	 *
	 * @since n.e.x.t
	 *
	 * @param Generative_AI_Service $service The underlying AI service to cache.
	 *
	 * @throws InvalidArgumentException Thrown if the service does not implement the With_API_Client interface.
	 */
	public function __construct( Generative_AI_Service $service ) {
		parent::__construct( $service );

		if ( ! $service instanceof With_API_Client ) {
			throw new InvalidArgumentException( 'The service must implement the With_API_Client interface.' );
		}

		// See above. This feels unnecessary, but it's required by PHPStan.
		$this->service = $service;
	}

	/**
	 * Gets the API client instance.
	 *
	 * @since n.e.x.t
	 *
	 * @return Generative_AI_API_Client The API client instance.
	 */
	public function get_api_client(): Generative_AI_API_Client {
		return $this->service->get_api_client();
	}
}