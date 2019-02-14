export const load = (file: File) => {
    return new Promise((resolve: (result: Uint8Array) => void) => {
        const fr = new FileReader();
        fr.onload = () => {
            const data = fr.result as ArrayBuffer;
            const bytes = new Uint8Array(data);
            resolve(bytes);
        };
        fr.readAsArrayBuffer(file);
    });
};

export const loadText = (file: File) => {
    return new Promise((resolve: (result: string) => void) => {
        const fr = new FileReader();
        fr.onload = () => {
            resolve(fr.result as string);
        };
        fr.readAsText(file);
    });
};

export const toBase64 = (input: Uint8Array) => {
    var binary = "";
    const bytes = new Uint8Array(input);
    const len = bytes.byteLength;
    for (let i = 0; i < len; i++) {
        binary += String.fromCharCode(bytes[i]);
    }
    return window.btoa(binary);
};

export const toUint8Array = (input: string) => {
    const bin = atob(input);
    const buffer = new Uint8Array(bin.length);
    for (let i = 0; i < bin.length; i++) {
        buffer[i] = bin.charCodeAt(i);
    }
    return buffer;
};

export const arrayBufferToBase64 = (input: ArrayBuffer) => {
    let binary = "";
    const bytes = new Uint8Array(input);
    const len = bytes.byteLength;
    for (let i = 0; i < len; i++) {
        binary += String.fromCharCode(bytes[i]);
    }
    return window.btoa(binary);
};
