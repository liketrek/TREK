import { Injectable } from '@nestjs/common';
import type { Response } from 'express';
import type { OAuthServerProvider, AuthorizationParams } from '@modelcontextprotocol/sdk/server/auth/provider';
import type { OAuthClientInformationFull, OAuthTokenRevocationRequest, OAuthTokens } from '@modelcontextprotocol/sdk/shared/auth';
import type { AuthInfo } from '@modelcontextprotocol/sdk/server/auth/types';
import type { OAuthRegisteredClientsStore } from '@modelcontextprotocol/sdk/server/auth/clients';
import { InvalidClientMetadataError, ServerError } from '@modelcontextprotocol/sdk/server/auth/errors';
import { OauthService } from './oauth.service';
import { AuditService } from '../audit/audit.service';
import { ALL_SCOPES } from '../../mcp/scopes';
import { getMcpSafeUrl } from '../../app-config';

/**
 * TREK's adapters behind the MCP SDK's OAuth server interfaces, wrapping the
 * injected OauthService. The SDK's authorizationHandler / clientRegistrationHandler
 * Express routers are built over these instances in OauthModule.configure().
 *
 * Pending authorization codes stay module-scoped in oauth.pending-codes.ts: the
 * consent controller writes a code through the container singleton and
 * exchangeAuthorizationCode reads it back through the same injected singleton.
 */

// ---------------------------------------------------------------------------
// Redirect URI validation (mirrors oauth.ts DCR checks)
// ---------------------------------------------------------------------------

const DANGEROUS_SCHEMES = new Set([
    'javascript:', 'data:', 'vbscript:', 'file:', 'blob:', 'about:', 'chrome:', 'chrome-extension:',
]);

function assertValidRedirectUris(uris: string[]): void {
    for (const u of uris) {
        let url: URL;
        try { url = new URL(u); } catch {
            throw new InvalidClientMetadataError(`Invalid redirect URI: ${u}`);
        }
        if (DANGEROUS_SCHEMES.has(url.protocol))
            throw new InvalidClientMetadataError(`Dangerous redirect URI scheme: ${u}`);
        if (url.protocol === 'https:') continue;
        if (url.protocol === 'http:' && (url.hostname === 'localhost' || url.hostname === '127.0.0.1' || url.hostname === '[::1]')) continue;
        const scheme = url.protocol.slice(0, -1);
        if (/^[a-z][a-z0-9+.-]*$/i.test(scheme) && scheme.includes('.')) continue;
        throw new InvalidClientMetadataError('redirect_uris must be HTTPS, loopback HTTP, or a private custom scheme');
    }
}

// ---------------------------------------------------------------------------
// Row → SDK client info shape
// ---------------------------------------------------------------------------

function rowToInfo(row: NonNullable<ReturnType<OauthService['getSdkClient']>>): OAuthClientInformationFull {
    return {
        client_id: row.client_id,
        client_name: row.name,
        redirect_uris: JSON.parse(row.redirect_uris) as string[],
        scope: (JSON.parse(row.allowed_scopes) as string[]).join(' '),
        token_endpoint_auth_method: row.is_public ? 'none' : 'client_secret_post',
        grant_types: ['authorization_code', 'refresh_token'],
        response_types: ['code'],
    };
}

// ---------------------------------------------------------------------------
// Clients store
// ---------------------------------------------------------------------------

@Injectable()
export class TrekClientsStore implements OAuthRegisteredClientsStore {
    constructor(private readonly oauth: OauthService) {}

    async getClient(clientId: string): Promise<OAuthClientInformationFull | undefined> {
        const row = this.oauth.getSdkClient(clientId);
        return row ? rowToInfo(row) : undefined;
    }

    async registerClient(
        metadata: Omit<OAuthClientInformationFull, 'client_id' | 'client_id_issued_at'>,
    ): Promise<OAuthClientInformationFull> {
        const uris = metadata.redirect_uris as string[];
        assertValidRedirectUris(uris);

        const isPublic = metadata.token_endpoint_auth_method === 'none';
        const name = (typeof metadata.client_name === 'string' ? metadata.client_name.trim() : '').slice(0, 100) || 'MCP Client';

        // When scope is absent (ChatGPT DCR), default to all scopes.
        // The user still grants only what they approve at the consent screen.
        const rawScopes = metadata.scope ? metadata.scope.split(' ') : ALL_SCOPES;
        const scopes = rawScopes.filter(s => (ALL_SCOPES as string[]).includes(s));
        if (scopes.length === 0) throw new InvalidClientMetadataError('No valid scopes requested');

        const result = this.oauth.createOAuthClient(null, name, uris, scopes, null, { isPublic, createdVia: 'dcr' });
        if (result.error) throw new InvalidClientMetadataError(result.error);

        const c = result.client!;
        return {
            client_id: c.client_id as string,
            client_name: c.name as string,
            redirect_uris: c.redirect_uris as string[],
            scope: (c.allowed_scopes as string[]).join(' '),
            token_endpoint_auth_method: isPublic ? 'none' : 'client_secret_post',
            grant_types: ['authorization_code', 'refresh_token'],
            response_types: ['code'],
            ...(c.client_secret ? { client_secret: c.client_secret as string, client_secret_expires_at: 0 } : {}),
        };
    }
}

// ---------------------------------------------------------------------------
// OAuthServerProvider
// ---------------------------------------------------------------------------

@Injectable()
export class TrekOAuthProvider implements OAuthServerProvider {
    constructor(
        private readonly clients: TrekClientsStore,
        private readonly oauth: OauthService,
        private readonly audit: AuditService,
    ) {}

    get clientsStore(): OAuthRegisteredClientsStore { return this.clients; }

    // Redirects browser to the SPA consent page with OAuth params forwarded.
    async authorize(client: OAuthClientInformationFull, params: AuthorizationParams, res: Response): Promise<void> {
        // The lookbehind matches only the first slash of the trailing run. Without it the
        // engine retries from every slash, which is quadratic on a slash-heavy value.
        const mcpResource = `${getMcpSafeUrl().replace(/(?<!\/)\/+$/, '')}/mcp`;
        const resource = params.resource ? params.resource.href.replace(/(?<!\/)\/+$/, '') : mcpResource;

        if (resource !== mcpResource) {
            const url = new URL(params.redirectUri);
            url.searchParams.set('error', 'invalid_target');
            url.searchParams.set('error_description', 'Requested resource must be the TREK MCP endpoint');
            if (params.state) url.searchParams.set('state', params.state);
            res.redirect(302, url.toString());
            return;
        }

        const qs = new URLSearchParams({
            client_id: client.client_id,
            redirect_uri: params.redirectUri,
            scope: params.scopes.join(' '),
            code_challenge: params.codeChallenge,
            code_challenge_method: 'S256',
        });
        if (params.state) qs.set('state', params.state);
        if (params.resource) qs.set('resource', params.resource.href);

        const base = getMcpSafeUrl().replace(/(?<!\/)\/+$/, '');
        res.redirect(302, `${base}/oauth/consent?${qs.toString()}`);
    }

    // Not called because skipLocalPkceValidation = true.
    // PKCE verification is done inline in exchangeAuthorizationCode.
    readonly skipLocalPkceValidation = true;

    async challengeForAuthorizationCode(_client: OAuthClientInformationFull, _code: string): Promise<string> {
        throw new ServerError('PKCE validation is handled by the provider directly');
    }

    async exchangeAuthorizationCode(
        client: OAuthClientInformationFull,
        code: string,
        codeVerifier?: string,
        redirectUri?: string,
        resource?: URL,
    ): Promise<OAuthTokens> {
        const pending = this.oauth.consumeAuthCode(code);
        if (!pending || pending.clientId !== client.client_id)
            throw new Error('Authorization grant is invalid.');

        if (redirectUri && pending.redirectUri !== redirectUri)
            throw new Error('Authorization grant is invalid.');

        const resourceStr = resource ? resource.href.replace(/(?<!\/)\/+$/, '') : null;
        if (pending.resource && resourceStr && pending.resource !== resourceStr)
            throw new Error('Authorization grant is invalid.');

        // A missing verifier is a failed exchange, not a skipped check — the live
        // token endpoint refuses it the same way (oauth-public.controller.ts).
        if (!codeVerifier || !this.oauth.verifyPKCE(codeVerifier, pending.codeChallenge))
            throw new Error('Authorization grant is invalid.');

        const tokens = this.oauth.issueTokens(client.client_id, pending.userId, pending.scopes, null, pending.resource ?? null);
        this.audit.writeAudit({
            userId: pending.userId,
            action: 'oauth.token.issue',
            details: { client_id: client.client_id, scopes: pending.scopes, audience: pending.resource ?? null },
            ip: null,
        });
        return tokens;
    }

    async exchangeRefreshToken(
        client: OAuthClientInformationFull,
        refreshToken: string,
        _scopes?: string[],
        _resource?: URL,
    ): Promise<OAuthTokens> {
        const result = this.oauth.refreshTokens(refreshToken, client.client_id, client.client_secret, null);
        if (result.error) throw new Error(result.error === 'invalid_client' ? 'Invalid client credentials' : 'Refresh token is invalid or expired');
        return result.tokens!;
    }

    async verifyAccessToken(token: string): Promise<AuthInfo> {
        const info = this.oauth.getUserByAccessToken(token);
        if (!info) throw new Error('Invalid or expired token');
        return {
            token,
            clientId: info.clientId,
            scopes: info.scopes,
            extra: { user: info.user },
        };
    }

    async revokeToken(
        client: OAuthClientInformationFull,
        request: OAuthTokenRevocationRequest,
    ): Promise<void> {
        this.oauth.revokeToken(request.token, client.client_id, undefined, null);
    }
}
