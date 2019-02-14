import { arrayBufferToBase64 } from "./file";

export const publicKeyHeaderFooter: IHeaderFooter = {
    header: "-----BEGIN PUBLIC KEY-----",
    footer: "-----END PUBLIC KEY-----",
};

export const privateKeyHeaderFooter: IHeaderFooter = {
    header: "-----BEGIN PRIVATE KEY-----",
    footer: "-----END PRIVATE KEY-----",
};

interface IHeaderFooter {
    header: string;
    footer: string;
}

interface IKeyURLPair {
    publicKey: string;
    privateKey: string;
}

export const generateKey = async () => {
    const keyPair = await window.crypto.subtle.generateKey(
        {
            name: "RSA-OAEP",
            modulusLength: 4096,
            publicExponent: new Uint8Array([1, 0, 1]),
            hash: "SHA-256",
        },
        true,
        ["encrypt", "decrypt"]
    );
    const pubKeyURL = await exportKey(
        "spki",
        keyPair.publicKey,
        publicKeyHeaderFooter
    );
    const privKeyURL = await exportKey(
        "pkcs8",
        keyPair.privateKey,
        privateKeyHeaderFooter
    );
    return <IKeyURLPair>{
        publicKey: pubKeyURL,
        privateKey: privKeyURL,
    };
};

const exportKey = async (
    format: string,
    key: CryptoKey,
    headerFooter: IHeaderFooter
) => {
    const exported = (await window.crypto.subtle.exportKey(
        format,
        key
    )) as ArrayBuffer;
    const data =
        headerFooter.header +
        "\n" +
        arrayBufferToBase64(exported) +
        "\n" +
        headerFooter.footer;
    const keyBlobl = new Blob([data], {
        type: "text/plain",
    });
    return window.URL.createObjectURL(keyBlobl);
};
