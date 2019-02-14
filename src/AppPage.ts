import Ractive from "./ractive";
import {
    load,
    toBase64,
    loadText,
    toUint8Array,
    arrayBufferToBase64,
} from "./file";
import { encrypt, decrypt, getRandomValues } from "./crypt";
import Button from "./views/Button";
import TextField from "./views/TextField";
import { generateKey } from "./key";

export default class AppPage {
    private ractive: Ractive;

    constructor() {
        this.ractive = new Ractive({
            el: "body",
            template: "#template",
            components: {
                Button: Button,
                TextField: TextField,
            },
            data: {
                encFiles: [],
                decFiles: [],
            },
        });
        this.ractive.on({
            encrypt: () => {
                this.encrypt();
            },
            decrypt: () => {
                this.decrypt();
            },
            generateKey: () => this.generateKey(),
            encryptWithPubKey: () => this.encryptWithPubKey(),
            decryptWithPrivateKey: () => this.decryptWithPrivateKey(),
        });
    }

    private async encrypt() {
        const password = this.ractive.get("encPassword");
        const srcFile = this.ractive.get("encSrcFile");
        try {
            const src = await load(srcFile[0]);
            const srcBase64 = toBase64(src);
            const encrypted = encrypt(srcBase64, password);
            const blobURL = this.makeBlobURL(encrypted);
            this.ractive.push("encFiles", blobURL);
        } catch (e) {
            console.log(e);
        }
    }

    private async decrypt() {
        const password = this.ractive.get("decPassword");
        const ext = this.ractive.get("decExt");
        const srcFile = this.ractive.get("decSrcFile");
        try {
            const encrypted = await loadText(srcFile[0]);
            const rawBase64 = decrypt(encrypted, password);
            const rawUint8 = toUint8Array(rawBase64);
            const blob = new Blob([rawUint8.buffer], {
                type: "application/octet-stream",
            });
            const blobURL = window.URL.createObjectURL(blob);
            this.ractive.push("decFiles", {
                url: blobURL,
                ext: ext,
            });
        } catch (e) {
            console.log(e);
        }
    }

    private async generateKey() {
        try {
            const keyPair = await generateKey();
            this.ractive.set({
                pubKeyURL: keyPair.publicKey,
                privKeyURL: keyPair.privateKey,
            });
        } catch (e) {
            console.log(e);
        }
    }

    private async encryptWithPubKey() {
        const keyFile = this.ractive.get("pubKeyFile");
        const srcFile = this.ractive.get("pubKeyEncSrcFile");
        try {
            const pubKeyStr = await loadText(keyFile[0]);
            const pubKey = await this.importRsaKey(pubKeyStr);

            const src = await load(srcFile[0]);
            const srcBase64 = toBase64(src);
            const password = getRandomValues();
            const encrypted = encrypt(srcBase64, password);

            const encoder = new TextEncoder();
            const encodedMsg = encoder.encode(password);
            const encryptedKey = await crypto.subtle.encrypt(
                {
                    name: "RSA-OAEP",
                },
                pubKey,
                encodedMsg
            );

            const keyBase64 = arrayBufferToBase64(encryptedKey);

            const bodyURL = window.URL.createObjectURL(
                new Blob([encrypted], { type: "text/plain" })
            );
            const keyURL = window.URL.createObjectURL(
                new Blob([keyBase64], { type: "text/plain" })
            );
            this.ractive.push("keyEncFiles", {
                keyURL: keyURL,
                bodyURL: bodyURL,
            });
        } catch (e) {
            console.log(e);
        }
    }

    private async decryptWithPrivateKey() {
        const privateKeyFile = this.ractive.get("privateKeyFile");
        const keyFile = this.ractive.get("keyFile");
        const encryptedFile = this.ractive.get("pubKeyDecSrcFile");
        const ext = this.ractive.get("keyDecExt");
        try {
            const privateKeyStr = await loadText(privateKeyFile[0]);
            const privateKey = await this.importPrivateKey(privateKeyStr);

            const keyStr = await loadText(keyFile[0]);
            const key = toUint8Array(keyStr);
            const out = await crypto.subtle.decrypt(
                {
                    name: "RSA-OAEP",
                },
                privateKey,
                key
            );
            const decoder = new TextDecoder();
            const password = decoder.decode(out);

            const encrypted = await loadText(encryptedFile[0]);
            const rawBase64 = decrypt(encrypted, password);
            const rawUint8 = toUint8Array(rawBase64);
            const blob = new Blob([rawUint8.buffer], {
                type: "application/octet-stream",
            });
            const blobURL = window.URL.createObjectURL(blob);
            this.ractive.push("keyDecFiles", {
                url: blobURL,
                ext: ext,
            });
        } catch (e) {
            console.log(e);
        }
    }

    private importRsaKey(pem: string): PromiseLike<CryptoKey> {
        // fetch the part of the PEM string between header and footer
        const pemHeader = "-----BEGIN PUBLIC KEY-----";
        const pemFooter = "-----END PUBLIC KEY-----";
        const pemContents = pem.substring(
            pemHeader.length,
            pem.length - pemFooter.length
        );
        // base64 decode the string to get the binary data
        const binaryDerString = window.atob(pemContents);
        // convert from a binary string to an ArrayBuffer
        const binaryDer = this.str2ab(binaryDerString);

        return window.crypto.subtle.importKey(
            "spki",
            binaryDer,
            {
                name: "RSA-OAEP",
                hash: "SHA-256",
            },
            true,
            ["encrypt"]
        );
    }

    private async importPrivateKey(pem: string) {
        // fetch the part of the PEM string between header and footer
        const pemHeader = "-----BEGIN PRIVATE KEY-----";
        const pemFooter = "-----END PRIVATE KEY-----";
        const pemContents = pem.substring(
            pemHeader.length,
            pem.length - pemFooter.length
        );
        // base64 decode the string to get the binary data
        const binaryDerString = window.atob(pemContents);
        // convert from a binary string to an ArrayBuffer
        const binaryDer = this.str2ab(binaryDerString);

        return window.crypto.subtle.importKey(
            "pkcs8",
            binaryDer,
            {
                name: "RSA-OAEP",
                hash: "SHA-256",
            },
            true,
            ["decrypt"]
        );
    }

    private str2ab(str: string): ArrayBuffer {
        const buf = new ArrayBuffer(str.length);
        const bufView = new Uint8Array(buf);
        for (let i = 0, strLen = str.length; i < strLen; i++) {
            bufView[i] = str.charCodeAt(i);
        }
        return buf;
    }

    private loadFile(file: File): Promise<string> {
        return new Promise((resolve, reject) => {
            const fr = new FileReader();
            fr.onload = () => {
                const data = fr.result as ArrayBuffer;
                var binary = "";
                const bytes = new Uint8Array(data);
                const len = bytes.byteLength;
                for (let i = 0; i < len; i++) {
                    binary += String.fromCharCode(bytes[i]);
                }
                resolve(window.btoa(binary));
            };
            fr.readAsArrayBuffer(file);
        });
    }

    private makeBlobURL(src: string): string {
        const blob = new Blob([src], { type: "text/plain" });
        return window.URL.createObjectURL(blob);
    }
}
