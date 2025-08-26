import * as WebBrowser from 'expo-web-browser';

export const openWebView = async (url: string) => {
    await WebBrowser.openBrowserAsync(url);
};
