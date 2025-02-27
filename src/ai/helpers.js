/**
 * Internal dependencies
 */
import CandidatesStreamProcessor from './classes/candidates-stream-processor';
import { ContentRole } from './enums';

/**
 * Converts a text string to a Content object.
 *
 * @since 0.2.0
 *
 * @param {string} text The text.
 * @param {string} role Optional. The role to use for the content. Default 'user'.
 * @return {Object} The Content object.
 */
export function textToContent( text, role = ContentRole.USER ) {
	return {
		role,
		parts: [ { text } ],
	};
}

/**
 * Converts a text string and attachment to a multimodal Content instance.
 *
 * The text will be included as a prompt as the first part of the content, and the attachment (e.g. an image or
 * audio file) will be included as the second part.
 *
 * @since n.e.x.t
 *
 * @param {string} text       The text.
 * @param {Object} attachment The attachment object.
 * @param {string} role       Optional. The role to use for the content. Default 'user'.
 * @return {Object} The Content object.
 */
export async function textAndAttachmentToContent(
	text,
	attachment,
	role = ContentRole.USER
) {
	const mimeType = attachment.mime;
	const data = await base64EncodeFile(
		attachment.sizes?.large?.url || attachment.url
	);

	return {
		role,
		parts: [ { text }, { inlineData: { mimeType, data } } ],
	};
}

/**
 * Converts a Content object to a text string.
 *
 * This function will return the combined text from all consecutive text parts in the content.
 * Realistically, this should almost always return the text from just one part, as API responses typically do not
 * contain multiple text parts in a row - but it might be possible.
 *
 * @since 0.2.0
 *
 * @param {Object} content The Content object.
 * @return {string} The text, or an empty string if there are no text parts.
 */
export function contentToText( content ) {
	const textParts = [];

	for ( const part of content.parts ) {
		/*
		 * If there is any non-text part present, we want to ensure that no interrupted text content is returned.
		 * Therefore, we break the loop as soon as we encounter a non-text part, unless no text parts have been
		 * found yet, in which case the text may only start with a later part.
		 */
		if ( part.text === undefined ) {
			if ( textParts.length > 0 ) {
				break;
			}
			continue;
		}

		textParts.push( part.text );
	}

	if ( textParts.length === 0 ) {
		return '';
	}

	return textParts.join( '\n\n' );
}

/**
 * Gets the text from the first Content object in the given list which contains text.
 *
 * @since 0.2.0
 *
 * @param {Object[]} contents The list of Content objects.
 * @return {string} The text, or an empty string if no Content object has text parts.
 */
export function getTextFromContents( contents ) {
	for ( const content of contents ) {
		const text = contentToText( content );
		if ( text ) {
			return text;
		}
	}

	return '';
}

/**
 * Gets the first Content object in the given list which contains text.
 *
 * @since n.e.x.t
 *
 * @param {Object[]} contents The list of Content objects.
 * @return {?Object} The Content object, or null if no Content object has text parts.
 */
export function getTextContentFromContents( contents ) {
	for ( const content of contents ) {
		const text = contentToText( content );
		if ( text ) {
			return content;
		}
	}

	return null;
}

/**
 * Gets the Content objects for each candidate in the given list.
 *
 * @since 0.2.0
 *
 * @param {Object[]} candidates The list of candidates.
 * @return {Object[]} The list of Content objects.
 */
export function getCandidateContents( candidates ) {
	const contents = [];

	for ( const candidate of candidates ) {
		if ( candidate.content ) {
			contents.push( candidate.content );
		}
	}

	return contents;
}

/**
 * Processes a stream of candidates, aggregating the candidates chunks into a single candidates instance.
 *
 * This method returns a stream processor instance that can be used to read all chunks from the given candidates
 * generator and process them with a callback. Alternatively, you can read from the generator yourself and provide
 * all chunks to the processor manually.
 *
 * @since 0.3.0
 *
 * @param {Object} generator The generator that yields the chunks of response candidates.
 * @return {CandidatesStreamProcessor} The stream processor instance.
 */
export function processCandidatesStream( generator ) {
	return new CandidatesStreamProcessor( generator );
}

/**
 * Base64-encodes a file and returns its data URL.
 *
 * @since n.e.x.t
 *
 * @param {string} file     The file URL.
 * @param {string} mimeType Optional. The MIME type of the file. If provided, the base64-encoded data URL will
 *                          be prefixed with `data:{mime_type};base64,`. Default empty string.
 * @return {string} The base64-encoded file data URL, or empty string on failure.
 */
export async function base64EncodeFile( file, mimeType = '' ) {
	const data = await fetch( file );
	const blob = await data.blob();

	const base64 = await new Promise( ( resolve ) => {
		const reader = new window.FileReader();
		reader.readAsDataURL( blob );
		reader.onloadend = () => {
			const base64data = reader.result;
			resolve( base64data );
		};
	} );

	if ( mimeType ) {
		return base64.replace(
			/^data:[a-z0-9-]+\/[a-z0-9-]+;base64,/,
			`data:${ mimeType };base64,`
		);
	}
	return base64;
}
