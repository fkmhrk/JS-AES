import * as CryptoJS from "crypto-js";

export const getRandomValues = () => {
    const arr = new Uint8Array(16);
    crypto.getRandomValues(arr);
    let out = "";
    arr.forEach((i: number) => {
        out += ("0" + i.toString(16)).slice(-2);
    });
    return out;
};

export const encrypt = (input: string, key: string) => {
    return CryptoJS.AES.encrypt(input, key).toString();
};

export const decrypt = (input: string, key: string) => {
    const bytes = CryptoJS.AES.decrypt(input, key);
    return bytes.toString(CryptoJS.enc.Utf8);
};
