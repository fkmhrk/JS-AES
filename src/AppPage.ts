import Ractive from "./ractive";
import { load, toBase64, loadText, toUint8Array } from "./file";
import { encrypt, decrypt } from "./crypt";
import Button from "./views/Button";
import TextField from "./views/TextField";

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
        });
    }

    private async encrypt() {
        const key = this.ractive.get("key");
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
