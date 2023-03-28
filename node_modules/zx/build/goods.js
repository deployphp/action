// Copyright 2022 Google LLC
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//     https://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.
import assert from 'node:assert';
import * as globbyModule from 'globby';
import minimist from 'minimist';
import nodeFetch from 'node-fetch';
import { createInterface } from 'node:readline';
import { $, within, ProcessOutput } from './core.js';
import { isString, parseDuration } from './util.js';
import chalk from 'chalk';
export { default as chalk } from 'chalk';
export { default as fs } from 'fs-extra';
export { default as which } from 'which';
export { default as YAML } from 'yaml';
export { default as path } from 'node:path';
export { default as os } from 'node:os';
export { ssh } from 'webpod';
export let argv = minimist(process.argv.slice(2));
export function updateArgv(args) {
    argv = minimist(args);
    global.argv = argv;
}
export const globby = Object.assign(function globby(patterns, options) {
    return globbyModule.globby(patterns, options);
}, globbyModule);
export const glob = globby;
export function sleep(duration) {
    return new Promise((resolve) => {
        setTimeout(resolve, parseDuration(duration));
    });
}
export async function fetch(url, init) {
    $.log({ kind: 'fetch', url, init });
    return nodeFetch(url, init);
}
export function echo(pieces, ...args) {
    let msg;
    const lastIdx = pieces.length - 1;
    if (Array.isArray(pieces) &&
        pieces.every(isString) &&
        lastIdx === args.length) {
        msg =
            args.map((a, i) => pieces[i] + stringify(a)).join('') + pieces[lastIdx];
    }
    else {
        msg = [pieces, ...args].map(stringify).join(' ');
    }
    console.log(msg);
}
function stringify(arg) {
    if (arg instanceof ProcessOutput) {
        return arg.toString().replace(/\n$/, '');
    }
    return `${arg}`;
}
export async function question(query, options) {
    let completer = undefined;
    if (options && Array.isArray(options.choices)) {
        /* c8 ignore next 5 */
        completer = function completer(line) {
            const completions = options.choices;
            const hits = completions.filter((c) => c.startsWith(line));
            return [hits.length ? hits : completions, line];
        };
    }
    const rl = createInterface({
        input: process.stdin,
        output: process.stdout,
        terminal: true,
        completer,
    });
    return new Promise((resolve) => rl.question(query ?? '', (answer) => {
        rl.close();
        resolve(answer);
    }));
}
export async function stdin() {
    let buf = '';
    process.stdin.setEncoding('utf8');
    for await (const chunk of process.stdin) {
        buf += chunk;
    }
    return buf;
}
export async function retry(count, a, b) {
    const total = count;
    let callback;
    let delayStatic = 0;
    let delayGen;
    if (typeof a == 'function') {
        callback = a;
    }
    else {
        if (typeof a == 'object') {
            delayGen = a;
        }
        else {
            delayStatic = parseDuration(a);
        }
        assert(b);
        callback = b;
    }
    let lastErr;
    let attempt = 0;
    while (count-- > 0) {
        attempt++;
        try {
            return await callback();
        }
        catch (err) {
            let delay = 0;
            if (delayStatic > 0)
                delay = delayStatic;
            if (delayGen)
                delay = delayGen.next().value;
            $.log({
                kind: 'retry',
                error: chalk.bgRed.white(' FAIL ') +
                    ` Attempt: ${attempt}${total == Infinity ? '' : `/${total}`}` +
                    (delay > 0 ? `; next in ${delay}ms` : ''),
            });
            lastErr = err;
            if (count == 0)
                break;
            if (delay)
                await sleep(delay);
        }
    }
    throw lastErr;
}
export function* expBackoff(max = '60s', rand = '100ms') {
    const maxMs = parseDuration(max);
    const randMs = parseDuration(rand);
    let n = 1;
    while (true) {
        const ms = Math.floor(Math.random() * randMs);
        yield Math.min(2 ** n++, maxMs) + ms;
    }
}
export async function spinner(title, callback) {
    if (typeof title == 'function') {
        callback = title;
        title = '';
    }
    let i = 0;
    const spin = () => process.stderr.write(`  ${'⠋⠙⠹⠸⠼⠴⠦⠧⠇⠏'[i++ % 10]} ${title}\r`);
    return within(async () => {
        $.verbose = false;
        const id = setInterval(spin, 100);
        let result;
        try {
            result = await callback();
        }
        finally {
            clearInterval(id);
            process.stderr.write(' '.repeat(process.stdout.columns - 1) + '\r');
        }
        return result;
    });
}
