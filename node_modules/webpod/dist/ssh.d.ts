export type RemoteShell = ((pieces: TemplateStringsArray, ...values: any[]) => Promise<Result>) & {
    exit: () => void;
};
export type Options = {
    port?: number | string;
    forwardAgent?: boolean;
    shell?: string;
    options?: (SshOption | `${SshOption}=${string}`)[];
};
export declare function ssh(host: string, options?: Options): RemoteShell;
export declare class Result extends String {
    readonly source: string;
    readonly stdout: string;
    readonly stderr: string;
    readonly exitCode: number | null;
    readonly error?: Error;
    constructor(source: string, exitCode: number | null, stdout: string, stderr: string, combined: string, error?: Error);
}
export type SshOption = 'AddKeysToAgent' | 'AddressFamily' | 'BatchMode' | 'BindAddress' | 'CanonicalDomains' | 'CanonicalizeFallbackLocal' | 'CanonicalizeHostname' | 'CanonicalizeMaxDots' | 'CanonicalizePermittedCNAMEs' | 'CASignatureAlgorithms' | 'CertificateFile' | 'ChallengeResponseAuthentication' | 'CheckHostIP' | 'Ciphers' | 'ClearAllForwardings' | 'Compression' | 'ConnectionAttempts' | 'ConnectTimeout' | 'ControlMaster' | 'ControlPath' | 'ControlPersist' | 'DynamicForward' | 'EscapeChar' | 'ExitOnForwardFailure' | 'FingerprintHash' | 'ForwardAgent' | 'ForwardX11' | 'ForwardX11Timeout' | 'ForwardX11Trusted' | 'GatewayPorts' | 'GlobalKnownHostsFile' | 'GSSAPIAuthentication' | 'GSSAPIDelegateCredentials' | 'HashKnownHosts' | 'Host' | 'HostbasedAcceptedAlgorithms' | 'HostbasedAuthentication' | 'HostKeyAlgorithms' | 'HostKeyAlias' | 'Hostname' | 'IdentitiesOnly' | 'IdentityAgent' | 'IdentityFile' | 'IPQoS' | 'KbdInteractiveAuthentication' | 'KbdInteractiveDevices' | 'KexAlgorithms' | 'KnownHostsCommand' | 'LocalCommand' | 'LocalForward' | 'LogLevel' | 'MACs' | 'Match' | 'NoHostAuthenticationForLocalhost' | 'NumberOfPasswordPrompts' | 'PasswordAuthentication' | 'PermitLocalCommand' | 'PermitRemoteOpen' | 'PKCS11Provider' | 'Port' | 'PreferredAuthentications' | 'ProxyCommand' | 'ProxyJump' | 'ProxyUseFdpass' | 'PubkeyAcceptedAlgorithms' | 'PubkeyAuthentication' | 'RekeyLimit' | 'RemoteCommand' | 'RemoteForward' | 'RequestTTY' | 'SendEnv' | 'ServerAliveInterval' | 'ServerAliveCountMax' | 'SetEnv' | 'StreamLocalBindMask' | 'StreamLocalBindUnlink' | 'StrictHostKeyChecking' | 'TCPKeepAlive' | 'Tunnel' | 'TunnelDevice' | 'UpdateHostKeys' | 'UseKeychain' | 'User' | 'UserKnownHostsFile' | 'VerifyHostKeyDNS' | 'VisualHostKey' | 'XAuthLocation';
