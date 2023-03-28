import { spawn, spawnSync } from 'node:child_process';
import process from 'node:process';
import { controlPath, escapeshellarg } from './utils.js';
export function ssh(host, options = {}) {
    const $ = function (pieces, ...values) {
        const source = new Error().stack.split(/^\s*at\s/m)[2].trim();
        if (pieces.some(p => p == undefined)) {
            throw new Error(`Malformed command at ${source}`);
        }
        let cmd = pieces[0], i = 0;
        while (i < values.length) {
            let s;
            if (Array.isArray(values[i])) {
                s = values[i].map((x) => escapeshellarg(x)).join(' ');
            }
            else {
                s = escapeshellarg(values[i]);
            }
            cmd += s + pieces[++i];
        }
        let resolve, reject;
        const promise = new Promise((...args) => ([resolve, reject] = args));
        const shellID = 'id$' + Math.random().toString(36).slice(2);
        const args = [
            host,
            '-o', 'ControlMaster=auto',
            '-o', 'ControlPath=' + controlPath(host),
            '-o', 'ControlPersist=5m',
            ...(options.port ? ['-p', `${options.port}`] : []),
            ...(options.forwardAgent ? ['-A'] : []),
            ...(options.options || []).flatMap(x => ['-o', x]),
            `: ${shellID}; ` + (options.shell || 'bash -ls')
        ];
        if (process.env.WEBPOD_DEBUG) {
            console.log('ssh', args.join(' '));
        }
        const child = spawn('ssh', args, {
            stdio: ['pipe', 'pipe', 'pipe'],
            windowsHide: true,
        });
        let stdout = '', stderr = '', combined = '';
        const onStdout = (data) => {
            stdout += data;
            combined += data;
        };
        const onStderr = (data) => {
            stderr += data;
            combined += data;
        };
        child.stdout.on('data', onStdout);
        child.stderr.on('data', onStderr);
        child.on('close', (code) => {
            if (code === 0) {
                resolve(new Result(source, code, stdout, stderr, combined));
            }
            else {
                reject(new Result(source, code, stdout, stderr, combined));
            }
        });
        child.on('error', err => {
            reject(new Result(source, null, stdout, stderr, combined, err));
        });
        child.stdin.write(cmd);
        child.stdin.end();
        return promise;
    };
    $.exit = () => spawnSync('ssh', [host, '-O', 'exit', '-o', `ControlPath=${controlPath(host)}`]);
    return $;
}
export class Result extends String {
    constructor(source, exitCode, stdout, stderr, combined, error) {
        super(combined);
        this.source = source;
        this.stdout = stdout;
        this.stderr = stderr;
        this.exitCode = exitCode;
        this.error = error;
    }
}
